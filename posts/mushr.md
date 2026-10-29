---
title: [mushr] Reverse Proxy, DNS, and Tunnels
date: 2026-04-06
description: How we route all traffic through Caddy with real TLS certs, wildcard DNS via dnsmasq, and external access via Cloudflare Tunnel - without opening a single port on the router
---

Mushr is the traffic layer for [The Loft](https://github.com/hsimah-services/the-loft). It handles three things: reverse proxying every web service through Caddy with real TLS certificates, wildcard DNS resolution on the LAN via dnsmasq, and external access to selected services through a Cloudflare Tunnel. The name comes from "musher" - the person driving a dog sled. Mushr drives all the traffic.

This post walks through the full configuration, why each piece exists, and the trade-offs involved.

## The Problem

Without a reverse proxy, every service is accessed by IP and port number: `192.168.86.28:7878` for Radarr, `192.168.86.28:8989` for Sonarr, and so on. That works, but it's ugly, hard to remember, and means no TLS. Some services also need to be accessible from outside the LAN - our Fediverse instance and blogs, specifically - but opening ports on a residential router is something I wanted to avoid.

## Architecture

Mushr is a three-container stack defined in a single `docker-compose.yml`:

| Container | Image | Role |
|-----------|-------|------|
| `mushr` | Custom Caddy build | Reverse proxy + TLS termination |
| `mushr-tunnel` | `cloudflare/cloudflared` | Outbound tunnel for external access |
| `mushr-dns` | `drpsychick/dnsmasq` | Wildcard DNS for LAN resolution |

All three share the `loft-proxy` Docker bridge network, which is also used by other bridge-networked services (pupyrus, pulsr, pawst). Services running on the host network (pawpcorn, howlr, the *arr stack) are reached via `host.docker.internal`.

## Caddy: The Reverse Proxy

### Why Caddy Over Nginx or Traefik

I picked Caddy for a few reasons:

- **Automatic TLS** is built in and just works. You point Caddy at a domain and it handles certificate issuance and renewal. No certbot cron jobs, no manual config.
- **The Caddyfile** is drastically simpler than Nginx config. A reverse proxy rule is two lines.
- **Caddy has a plugin ecosystem** that lets you compile in additional modules at build time. We need one: the Cloudflare DNS plugin for DNS-01 ACME challenges.

The main trade-off is performance. Caddy is slower than Nginx under extreme load. For a homelab with a handful of users, this is irrelevant.

### Custom Build for Cloudflare DNS-01

We can't use the stock Caddy image because we need the `caddy-dns/cloudflare` module for DNS-01 certificate challenges. The Dockerfile is straightforward - use Caddy's builder image to compile the binary with the module, then copy it into the runtime image:

```dockerfile
ARG CADDY_VERSION=2

FROM caddy:${CADDY_VERSION}-builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:${CADDY_VERSION}-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

### Why DNS-01 Instead of HTTP-01

The default ACME challenge (HTTP-01) requires the CA to reach your server on port 80. That means opening port 80 on your router, which defeats the goal of zero open ports. DNS-01 instead proves domain ownership by creating a TXT record via the Cloudflare API. No inbound connections required.

The trade-off: you need your domains managed by Cloudflare (or another supported DNS provider), and you need an API token with zone read and DNS edit permissions.

### The Caddyfile

The config uses snippets to avoid repeating TLS configuration across every site block. Here's how it's structured:

```
# Global settings
{
    admin :8880
    servers {
        protocols h1 h2
        trusted_proxies static private_ranges
    }
}

# Reusable TLS snippet
(cloudflare_tls) {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}
```

A few things to call out:

- **`protocols h1 h2`** explicitly disables HTTP/3 (QUIC). We had issues with QUIC idle timeouts causing connections to hang on resume. Disabling it fixed everything with no practical downside for LAN use.
- **`trusted_proxies static private_ranges`** tells Caddy to trust `X-Forwarded-For` headers from LAN clients and the Cloudflare Tunnel.
- **The admin API on port 8880** serves as the health check endpoint.

Each service gets a site block that imports the TLS snippet and proxies to the appropriate backend:

```
radarr.{$LOFT_DOMAIN} {
    import cloudflare_tls
    reverse_proxy host.docker.internal:7878
}
```

The `$LOFT_DOMAIN` environment variable is set to `loft.hsimah.com` in the `.env` file, so this expands to `radarr.loft.hsimah.com`.

### Two Domain Systems

Mushr serves every service under two domain patterns:

| Pattern | Protocol | Example | Use Case |
|---------|----------|---------|----------|
| `*.loft.hsimah.com` | HTTPS | `https://radarr.loft.hsimah.com` | Primary, with real certs |
| `*.space-needle` | HTTP | `http://radarr.space-needle` | LAN fallback, no TLS |

The HTTP fallback exists for backward compatibility - some devices on the network had bookmarks to the old `*.space-needle` URLs. It's also handy when debugging TLS issues since you can verify the service itself is working by hitting the HTTP endpoint.

### Path-Based Routing for Pulsr

Pulsr (GoToSocial + Phanpy) uses a more complex routing pattern. The Phanpy web client is the default handler, but GoToSocial API paths need to go directly to the GoToSocial container:

```
(pulsr_routes) {
    @gts path /api/* /.well-known/* /nodeinfo/* /oauth/*
             /users/* /@* /fileserver/* /settings /settings/*
             /auth/* /media/*
    handle @gts {
        reverse_proxy pulsr:8080
    }
    handle {
        reverse_proxy pulsr-phanpy:80 {
            @notfound status 404
            handle_response @notfound {
                reverse_proxy pulsr:8080
            }
        }
    }
}
```

The fallback handler is clever: if Phanpy returns a 404 (e.g., for a user profile URL that Phanpy doesn't know about), Caddy retries the request against GoToSocial. This means deep links to profiles and statuses work even when they don't match Phanpy's client-side routes.

## Dnsmasq: Wildcard DNS

For the subdomain URLs to resolve on the LAN, clients need to know that `*.space-needle`, `*.loft.hsimah.com`, `pulsr.hsimah.com`, and `hsimah.com` all point to `space-needle`'s LAN IP. That's what dnsmasq does.

The config is minimal:

```
listen-address=192.168.86.28
bind-interfaces
no-resolv
server=1.1.1.1
server=1.0.0.1
address=/space-needle/192.168.86.28
address=/loft.hsimah.com/192.168.86.28
address=/pulsr.hsimah.com/192.168.86.28
address=/hsimah.com/192.168.86.28
```

Each `address=` line is a wildcard - `address=/space-needle/192.168.86.28` matches `anything.space-needle`. Everything else falls through to Cloudflare DNS (`1.1.1.1`).

To use this, you point your router's DHCP DNS setting at `space-needle`'s IP. Every device on the network then resolves these domains locally without any per-device configuration.

### Why Dnsmasq Over Pi-hole or AdGuard Home

Dnsmasq is tiny, single-purpose, and has no web UI or filtering logic. I don't need ad blocking at the DNS level (browser extensions handle that), and I don't want the overhead of a full DNS sinkhole. Dnsmasq does one thing - wildcard resolution - and does it in a 5MB container.

The trade-off: no DNS-level analytics or ad blocking. If you want those features, Pi-hole or AdGuard Home would be a better fit, but they're overkill for pure wildcard resolution.

## Cloudflare Tunnel: External Access

The tunnel container (`cloudflare/cloudflared`) creates an outbound-only connection to Cloudflare's edge network. No ports are opened on the router. Traffic from the internet hits Cloudflare's edge, travels through the tunnel to `cloudflared`, and gets forwarded to Caddy.

```yaml
mushr-tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - loft-proxy
    depends_on:
      mushr:
        condition: service_healthy
```

The tunnel exposes two services: `pulsr.hsimah.com` and `hsimah.com`. Everything else stays LAN-only.

### Why Pulsr Uses `pulsr.hsimah.com` Instead of `pulsr.loft.hsimah.com`

Cloudflare's free Universal SSL only covers single-level subdomains. `pulsr.loft.hsimah.com` is a two-level subdomain and would require an Advanced Certificate ($10/month) or a custom cert. Using `pulsr.hsimah.com` keeps everything on the free tier.

### LAN Traffic Bypasses the Tunnel

Because dnsmasq resolves `pulsr.hsimah.com` and `hsimah.com` directly to the LAN IP, local clients never hit Cloudflare. The tunnel only carries external traffic. This means LAN access is fast and doesn't depend on your internet connection.

## Docker Networking

The `loft-proxy` network is a Docker bridge created by mushr's compose file:

```yaml
networks:
  loft-proxy:
    name: loft-proxy
    driver: bridge
```

Other services (pupyrus, pulsr, pawst) join this network as `external: true` in their own compose files. This lets Caddy reach them by container name. Services on the host network (pawpcorn, the *arr stack, howlr) are reached via `host.docker.internal:host-gateway`.

## Health Check

Caddy's admin API serves as the health check endpoint. The compose file defines:

```yaml
healthcheck:
    test: ["CMD", "wget", "-q", "-O", "/dev/null",
           "http://localhost:8880/config/"]
    interval: 10s
    timeout: 5s
    retries: 3
```

The tunnel container depends on this health check (`condition: service_healthy`), so cloudflared won't start until Caddy is up and serving.

## Trade-Offs

- **Cloudflare dependency**: The TLS certs, DNS, and tunnel all depend on Cloudflare. If Cloudflare has an outage, external access goes down and cert renewals fail. LAN access via the HTTP fallback still works.
- **Single point of failure**: Mushr going down takes every web service offline. There's no HA setup - this is a homelab, not production infrastructure.
- **Manual IP in dnsmasq config**: If `space-needle`'s LAN IP changes, you need to update `dnsmasq.conf`. A DHCP reservation on the router prevents this in practice.

## Future Work

- **Wildcard certificates**: Right now Caddy issues individual certs for each subdomain. A single wildcard cert for `*.loft.hsimah.com` would reduce ACME requests and simplify the config.
- **Monitoring**: No alerting if Caddy or the tunnel go down. A simple uptime check (e.g., Uptime Kuma) would close this gap.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/mushr/`.
