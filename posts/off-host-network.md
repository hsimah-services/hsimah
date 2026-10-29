---
title: [the-loft] Off the Host Network
date: 2026-05-11
description: Moving the *arr stack onto a shared Docker bridge, unifying stellarr's compose config, and replacing host.docker.internal with container hostnames in Caddy
---

When I first wrote up [stellarr](/posts/stellarr), the *arr apps (Radarr, Sonarr, Lidarr, Jackett) were all running with `network_mode: host`. It worked, but it was sloppy. Every service had its own port mapping conventions, its own UID/GID handling, its own download paths. Some containers leaked ports onto the host that [Caddy](/posts/mushr) was already covering. The whole stack felt like it had grown by accretion rather than design.

The last two releases of [The Loft](https://github.com/hsimah-services/the-loft) cleaned this up. Stellarr now has a single, consistent compose convention. The *arr containers no longer touch the host network. Caddy reaches them by container name. The only services still on the host network are the ones that genuinely need it.

This post is about the docker config for services that interact with each other in a trusted space — what stayed, what moved, and why.

## What "Sloppy" Looked Like

The original stellarr stack had three different networking modes in one compose file:

- **VPN namespace** (`network_mode: service:vpn`) for Transmission and slskd — required for IP masking
- **Host network** (`network_mode: host`) for Radarr, Sonarr, Lidarr, and Jackett — chosen because it was easy
- **Default bridge** for whatever wasn't explicitly configured

Each *arr container had slightly different volume layouts. Transmission downloaded to `/mammoth/downloads/transmission`, slskd to `/mammoth/downloads/soulseek`. Permissions worked because most containers ran as `${PUID}/${PGID}`, but slskd's UID handling was different enough that it tripped over the shared volume during one of the early migrations.

Outside stellarr, pawst, pupyrus, and mushr each published ports on the host (`8085:80`, `8080:80`, etc.) even though Caddy was the only thing meant to reach them.

## Unifying the Compose Convention

Every container in stellarr now follows the same shape:

```yaml
radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - /opt/radarr:/config
      - /mammoth/library/movies:/movies
      - /mammoth/downloads:/downloads
    restart: unless-stopped
    networks:
      - loft-proxy
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Same logging policy. Same `PUID`/`PGID`/`TZ` from the shared `.env`. Same `/mammoth/downloads` bind. Same network attachment. Same restart policy. The container is interchangeable with sonarr or lidarr aside from the image and the library path.

### Shared Downloads Directory

The download directory is now a single shared root: `/mammoth/downloads`. Transmission writes to its default `complete/` subtree underneath it; slskd writes to `complete/lidarr` for Lidarr to import from. The *arr apps see the same path inside their containers (`/downloads`) and find whatever the download client just dropped there.

This matters because of [hardlinks](/posts/stellarr#why-hardlinks-matter). Hardlinks only work within a single filesystem, and they're easier to reason about when every service agrees on what "the downloads directory" means. The old per-client subfolders worked, but they pushed configuration complexity into each *arr app's import settings. One shared root is one less thing to misconfigure.

### Slskd's UID

Slskd specifically needs `user: "${PUID}:${PGID}"` at the container level — it doesn't honour `PUID`/`PGID` environment variables the way the linuxserver.io images do. Without this, slskd writes to `/mammoth/downloads` as a different user than the one Lidarr uses to import, and you get permission errors during import. Setting `user:` explicitly fixes it and makes slskd play nicely with the shared downloads root.

## Off the Host Network

The big change: the *arr apps no longer use `network_mode: host`. They attach to `loft-proxy`, the same Docker bridge network [mushr](/posts/mushr) created for Caddy and the other bridged services.

```yaml
networks:
  loft-proxy:
    external: true
```

That's the whole network declaration. The network itself is created by mushr's compose file with `name: loft-proxy`; everyone else joins it as external.

### What Bridge Networking Buys

Three things, in order of how much they actually mattered:

1. **No host port pollution.** Radarr's port 7878 is not bound on the host. The only thing that can talk to Radarr is something else on `loft-proxy`. That something is Caddy.
2. **DNS-by-container-name.** Inside the bridge, `radarr` resolves to Radarr's container IP. Caddy can `reverse_proxy radarr:7878` directly instead of routing through the host. This is just nicer to read and removes one layer of indirection.
3. **Failure modes are obvious.** If a service can't reach another service, it's a network-attach problem or a hostname problem. Not a "what port did I publish on the host again?" problem.

### Caddy: Hostnames Over `host.docker.internal`

The Caddyfile used to look like this for bridged services:

```caddy
radarr.{$LOFT_DOMAIN} {
    import cloudflare_tls
    reverse_proxy host.docker.internal:7878
}
```

It now looks like this:

```caddy
radarr.{$LOFT_DOMAIN} {
    import cloudflare_tls
    reverse_proxy radarr:7878
}
```

`host.docker.internal` is still used — but only for services that genuinely run on the host network (Plex/pawpcorn) or in a separate network namespace (Transmission and slskd, which live in the VPN container's namespace). For everything on `loft-proxy`, the container name is the address.

## The VPN Namespace Asymmetry

Bridged *arr containers still need to talk to Transmission and slskd. Those two services live inside the VPN container's network namespace, which means from a Docker DNS perspective they don't have addresses on `loft-proxy` — the only routable surface they expose is the ports the VPN container publishes on the host (9091 for Transmission, 5030 for slskd).

The fix is a single line on the bridged *arr services:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

`host-gateway` is a special Docker value that resolves to the host's IP from inside the container. With this, Radarr can configure Transmission as `host.docker.internal:9091` and the request goes out the bridge, hits the host, and lands on the VPN container's published port. It's slightly asymmetric — bridged-to-bridged uses container names, bridged-to-VPN-namespace uses `host.docker.internal` — but it's the cleanest expression of the actual topology.

## Stray Host Ports

Pawst, pupyrus, and the other bridged services no longer publish ports on the host. Pawst's compose used to have `ports: - "8085:80"`, but nothing actually wanted port 8085 — Caddy was already reaching Nginx on the bridge. Removing the publish makes the intent obvious: this container is reachable through the reverse proxy, full stop.

The same cleanup happened in pupyrus and mushr where stray mappings had accumulated.

## What's Still on the Host Network

Two things remain on `network_mode: host`, both deliberately:

- **The VPN container** (and by extension Transmission and slskd, which share its namespace). The VPN container needs to add a route back to `192.168.86.0/24` so Transmission's web UI is reachable from the LAN, and the tunnel itself needs `NET_ADMIN`/`NET_RAW`. There's no clean way to put this on a bridge.
- **Plex (pawpcorn).** Plex's local network discovery (GDM, DLNA, the various multicast bits its client apps use) only works on the host network. Bridging Plex breaks "Cast to TV" from phones on the LAN. Caddy reaches it via `host.docker.internal:32400`, same as before.

Everything else is on `loft-proxy`.

## Trade-Offs

- **A small asymmetry.** Bridged-to-bridged uses container names; bridged-to-VPN-namespace uses `host.docker.internal`. Two patterns instead of one. The alternative — putting Transmission and slskd on `loft-proxy` somehow — would mean either dropping the VPN (no) or wiring up a more complex VPN topology than the bubuntux image supports.
- **Cross-host services would need rethinking.** Container DNS only works within a single Docker host. If stellarr ever spans multiple hosts, the `radarr:7878` shorthand stops working and we're back to something like Tailscale or a Docker overlay network.
- **One more thing to remember.** Adding a new service to stellarr means remembering to attach it to `loft-proxy` and (if it needs Transmission/slskd) adding the `extra_hosts` line. Worth it for the consistency, but it's a checklist item now.

## Future Work

- **Drop `host.docker.internal` for VPN-namespace services** by figuring out a way to expose Transmission and slskd onto `loft-proxy` without breaking the VPN-only egress invariant. Possibly a sidecar that bridges the namespace.
- **Lock down `loft-proxy` egress.** Right now any container on the bridge can reach anything else on it. For a trusted homelab this is fine, but explicit allow-lists would be a nice belt-and-braces step.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/stellarr/` and `services/mushr/`.
