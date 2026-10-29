---
title: [pawst] Static Blog Hosting With Nginx and CI
date: 2026-04-06
description: Serving a static blog from a single Nginx container using a named Docker volume, server_name routing, and pull-based deploys from GitHub Releases
---

*Updated October 2026: Pawst now hosts a single site, and deploys changed from CI pushing files into the container to `space-needle` pulling GitHub Releases. The blog is also prerendered HTML now rather than a client-side app. This post reflects the current setup.*

Pawst is the static blog host for [The Loft](https://github.com/hsimah-services/the-loft). It serves [hsimah.com](https://hsimah.com) (the blog you're reading now) from a single Nginx container. The name is "paw" + "post". It hosts blog posts.

It started out serving two separate blogs, which I later merged into hsimah.com.

This is the simplest service in the fleet by design. There's no application server, no database, no build step happening on the server. Just Nginx serving static files that arrive from CI.

## The Compose File

```yaml
services:
  pawst:
    image: nginx:alpine
    container_name: pawst
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - hblake-html:/usr/share/nginx/hblake
    ports:
      - "8085:80"
    networks:
      - loft-proxy

volumes:
  hblake-html:

networks:
  loft-proxy:
    external: true
```

Two things stand out: the named Docker volume and the network setup.

## A Named Volume for Deployable Content

The blog content lives in a named Docker volume, `hblake-html`. It isn't a bind mount to a host directory - it's a Docker-managed volume.

Why a volume instead of a bind mount? It keeps the content lifecycle separate from the container lifecycle. The volume persists across container rebuilds, so deploying a config change to Nginx doesn't wipe the blog content, and deploying new content doesn't require restarting Nginx - it serves the new files immediately.

### The Trade-Off

Named volumes are harder to back up and inspect than bind mounts. You can't just `ls /opt/pawst/hblake` to see the files - you need `docker volume inspect` to find the mount point, or exec into the container. For a static site that is rebuilt from source on every deploy, this doesn't matter. The Git repo is the source of truth, not the volume contents.

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name hsimah.com hblake.space-needle pawst.space-needle;
    root /usr/share/nginx/hblake;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

Nginx routes requests based on the `Host` header via `server_name`. With one site that's more than strictly necessary, but it means a second site can be added later as another `server` block and volume without touching anything else.

### One HTML File Per Route

```nginx
try_files $uri $uri/ /index.html;
```

The blog is built with [markr](https://github.com/hsimah-services/markr), my own micro blogging platform. markr started as a client-side app (Web Components + Vite) where a single `index.html` handled every path in the browser, and this `try_files` line was what made deep links work. It no longer works that way: markr prerenders one HTML file per route at build time - `/index.html` for the feed, `/posts/<slug>/index.html` for each post, `/about/index.html` for the About page.

That means `try_files $uri $uri/` now finds a real file for every valid URL, and the `/index.html` fallback is a leftover from the SPA days. The side effect is that a mistyped URL returns the home page with a 200 rather than a proper 404. It's harmless for a personal blog, but it is something I'd tidy up.

### Asset Caching

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

The site has no JavaScript or CSS bundles at all; `assets/` only holds a handful of static files (the favicons, a couple of icons and a profile photo) with plain, unhashed names. A year-long `immutable` header on a file like `hblake.png` means a browser that has seen it will never check for a replacement.

For files that almost never change, that's an acceptable cost. If I ever swap the profile photo, I'll need to rename the file or shorten the cache lifetime.

### Gzip Compression

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
```

Compresses text-based assets on the fly. The built site is small - the entire `dist/` is around 1.5MB, and about 1MB of that is a single PNG - so the CPU cost of compression is negligible and the bandwidth savings are meaningful for mobile connections through the Cloudflare Tunnel. (HTML is compressed by default when `gzip on` is set, so it doesn't need to be listed.)

## How Deploys Work

Deploys used to be pushed: a CI job on my self-hosted runner (Iditarod) copied the built files into the running container with `docker cp`. They're now pulled. Nothing in CI touches `space-needle` any more:

1. A push to `main` on the blog repo triggers a GitHub Actions workflow on a regular GitHub-hosted runner
2. The runner builds the site (`npm ci` and `npm run build`)
3. The contents of `dist/` are packaged as `site.tar.gz`
4. The workflow publishes a tagged GitHub Release (`deploy-<timestamp>-<commit>`) with the tarball attached
5. An hourly cron job on `space-needle` pulls the latest release and deploys it into Pawst

The new files are live as soon as the cron job picks them up.

### Why Pull Instead of Push

The push model needed a self-hosted runner with access to the Docker socket on `space-needle`, which is a lot of trust to extend to a CI job - especially since a self-hosted runner executes whatever the workflow tells it to. The pull model removes that from the picture entirely for this repo: CI only needs permission to create a release, and `space-needle` only needs outbound access to GitHub.

The trade-off is latency. A merge can take up to an hour to go live, instead of showing up in seconds. For a blog that I update a few times a month, that's fine.

## External Access

The blog is accessible from outside the LAN via [Mushr's](/posts/mushr) Cloudflare Tunnel. The traffic flow:

```
Internet → Cloudflare Edge → cloudflared → Caddy (mushr) → Nginx (pawst)
```

On the LAN, dnsmasq resolves `hsimah.com` directly to `space-needle`'s IP, bypassing the tunnel. Caddy handles TLS termination in both cases - Nginx inside Pawst only serves HTTP on port 80.

### Why a Separate Nginx Instead of Caddy Directly

[Mushr](/posts/mushr) already runs Caddy as the reverse proxy. Why not just serve the static files directly from Caddy?

The answer is separation of concerns. Pawst owns the blog content and its serving configuration. Mushr owns the traffic routing. If I change how the blog is served (different cache headers, different root paths), I modify Pawst's Nginx config without touching Mushr. If I change routing or TLS, I modify Mushr without touching Pawst.

It also means Pawst could move to a different host entirely. Just update the Caddy reverse proxy target and the blog keeps serving.

The trade-off: an extra network hop (Caddy → Nginx) adds a fraction of a millisecond of latency. Completely imperceptible.

## Why Nginx Over Caddy or a Static Host

For serving static files, Nginx is the most resource-efficient option. The `nginx:alpine` image is 7MB. It uses almost no memory at idle and handles static file serving faster than any application server.

Caddy could do this too (and arguably with a simpler config), but since we already have Caddy running in Mushr, using Nginx here provides variety in the stack and keeps Pawst independent of Mushr's Caddy build.

The other alternative is a cloud static host (Netlify, Vercel, CloudFlare Pages). These are excellent for public sites, but I wanted the blog to be self-hosted alongside everything else. The blog content should survive even if I stop paying for cloud services.

## Trade-Offs

- **No CDN edge caching**: Traffic from outside the LAN goes through Cloudflare's tunnel but isn't cached at the edge (tunnel traffic bypasses Cloudflare's CDN caching). For a personal blog with minimal traffic, this doesn't matter.
- **Volume-based deployment**: Named volumes are opaque compared to bind mounts. You can't easily inspect the deployed files from the host. The Git repo is the source of truth.
- **Hourly deploys**: The pull model trades immediacy for a smaller attack surface. A merge isn't live until the next cron run.
- **Leftover config**: The SPA-style `/index.html` fallback and the year-long `immutable` asset cache both date from the client-side app and no longer match how the site is built.

## Future Work

- **Tidy the Nginx config** - return a real 404 for unknown paths and drop (or shorten) the `immutable` asset cache now that assets aren't hashed.
- **Brotli compression** in addition to gzip for even smaller transfer sizes on modern browsers.
- **Cloudflare CDN caching** by switching from the tunnel to Cloudflare's proxy mode for the blog domain. This would add edge caching and DDoS protection, but requires opening port 443 on the router (or using Cloudflare Pages instead).

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/pawst/`.
