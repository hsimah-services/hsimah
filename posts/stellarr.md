---
title: [stellarr] The *arr Stack Behind a VPN
date: 2026-04-06
description: Running Radarr, Sonarr, Lidarr, Jackett, Transmission, and Soulseek as a single compose stack with shared VPN networking and automated torrent cleanup
---

Stellarr is the media acquisition layer for [The Loft](https://github.com/hsimah-services/the-loft). It bundles seven containers into a single compose file: a NordVPN container providing a shared WireGuard tunnel, Transmission and slskd routing through that tunnel, and Radarr, Sonarr, Lidarr, and Jackett running on the host network. The name is "stellar" + the *arr naming convention - a stellar collection of stars.

## Why One Compose File

These services are tightly coupled. Radarr needs to talk to Transmission and Jackett. Sonarr needs the same. Lidarr needs Transmission and slskd. They all share the same download directories and library paths. Splitting them into separate compose files would mean managing shared volumes, networks, and startup order across multiple stacks. One file keeps it simple.

## The VPN Container

The foundation is a NordVPN container running NordLynx (WireGuard):

```yaml
vpn:
    image: ghcr.io/bubuntux/nordvpn
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - TOKEN=${NORDVPN_TOKEN}
      - CONNECT=NETHERLANDS
      - TECHNOLOGY=NordLynx
      - NETWORK=192.168.86.0/24
    ports:
      - 9091:9091      # Transmission
      - 5030:5030      # slskd
      - 51413:51413    # Transmission peer port
      - 50300:50300    # slskd peer port
    sysctls:
      - net.ipv6.conf.all.disable_ipv6=1
```

A few things to call out:

- **`NET_ADMIN` and `NET_RAW`** are required for WireGuard to create the tunnel interface.
- **`NETWORK=192.168.86.0/24`** tells the container to add a route back to the LAN subnet. Without this, you couldn't reach the Transmission or slskd web UIs from your browser.
- **Ports are declared on the VPN container**, not on Transmission or slskd. Because those services use `network_mode: service:vpn`, they share the VPN container's network namespace. Any ports you want to expose must be mapped on the VPN container itself.
- **IPv6 is disabled** because NordVPN's WireGuard implementation doesn't tunnel IPv6 traffic, which would leak your real IP.
- **The Netherlands** is the default exit country. Pick whatever works for your situation.

### Why bubuntux/nordvpn

This image handles NordVPN authentication, server selection, and WireGuard setup automatically. The alternative is running a generic WireGuard container and manually configuring NordVPN's WireGuard keys - doable but more maintenance. The trade-off is vendor lock-in: this image only works with NordVPN. If you switch providers, you'd swap to a generic WireGuard or OpenVPN image.

### Why NordLynx Over OpenVPN

NordLynx is NordVPN's WireGuard implementation. WireGuard is faster and uses less CPU than OpenVPN - meaningful on a box running a dozen other services. The trade-off: WireGuard is newer and has a smaller codebase (which is actually a security positive), but some users prefer OpenVPN's longer track record.

## Transmission

```yaml
transmission:
    image: lscr.io/linuxserver/transmission:latest
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - /opt/transmission:/config
      - /mammoth/downloads/transmission:/downloads
      - ./transmission/remove-torrents.sh:/scripts/remove-torrents.sh:ro
    network_mode: service:vpn
    depends_on:
      - vpn
```

The key detail is `network_mode: service:vpn`. This makes Transmission share the VPN container's network stack. All of Transmission's traffic - including peer connections - goes through the WireGuard tunnel. If the VPN drops, Transmission loses network access entirely rather than falling back to your real IP.

### Automated Torrent Cleanup

A cron job runs nightly at midnight to clean up seeded torrents:

```bash
#!/bin/bash
# Delete all torrents with ratio >= 2.0
transmission-remote -l | awk '
NR>1 && $1 ~ /^[0-9]+$/ {
    id=$1; ratio=$9;
    if (ratio >= 2.0) {
        print id;
    }
}' | while read id; do
    echo "Deleting torrent $id (ratio >= 2.0)"
    transmission-remote --torrent "$id" --remove-and-delete
done
```

This deletes the torrent and its download data once it reaches a 200% seed ratio. This is safe because Radarr, Sonarr, and Lidarr hardlink files into the library directories. The library copies are independent of the download directory, so removing the download doesn't affect your media.

The script is bind-mounted read-only into the container and executed via a host cron job:

```
0 0 * * * root docker exec transmission /scripts/remove-torrents.sh
```

### Why Hardlinks Matter

On the same filesystem (which is why everything lives on `/mammoth`), a hardlink creates a second directory entry pointing to the same data on disk. The file isn't duplicated. When Radarr imports a movie from `/mammoth/downloads/transmission/Movie.mkv` to `/mammoth/library/movies/Movie.mkv`, it creates a hardlink rather than copying 40GB. The torrent cleanup script can then delete the download directory copy and the library copy is unaffected.

This only works if downloads and library are on the same filesystem. If they're on different filesystems (or different Docker volumes), the *arr apps fall back to copying, and you lose the ability to safely clean up downloads.

## slskd (Soulseek)

```yaml
slskd:
    image: slskd/slskd:latest
    environment:
      - SLSKD_REMOTE_CONFIGURATION=true
      - SLSKD_SOULSEEK_USERNAME=${SLSKD_SOULSEEK_USERNAME}
      - SLSKD_SOULSEEK_PASSWORD=${SLSKD_SOULSEEK_PASSWORD}
      - SLSKD_DOWNLOADS_DIR=/downloads/complete
      - SLSKD_INCOMPLETE_DIR=/downloads/downloading
      - SLSKD_SHARED_DIR=/music
    volumes:
      - /opt/slskd:/app
      - /mammoth/downloads/soulseek:/downloads
      - /mammoth/library/music:/music:ro
    network_mode: service:vpn
```

slskd is a modern web-based Soulseek client. Like Transmission, it routes through the VPN container. The music library is mounted read-only for sharing (Soulseek is a peer-to-peer network where you share what you have).

### Why Soulseek

Soulseek fills a gap that torrents don't cover well: rare, niche, and out-of-print music. Public torrent trackers have good coverage for popular releases, but if you want a specific Japanese pressing of a jazz album from 1972, Soulseek is often the only place to find it. The trade-off is speed - downloads depend on the uploader being online and having bandwidth - and there's no organized indexing like torrent trackers provide.

### Lidarr Integration

Lidarr uses the `nightly` tag specifically to support the [Lidarr.Plugin.Slskd](https://github.com/allquiet-hub/Lidarr.Plugin.Slskd) plugin, which adds slskd as both an indexer and download client. This means Lidarr can search Soulseek for missing albums and automatically download them. The nightly tag is less stable than the release tag, but the plugin support is worth it.

## The *arr Stack

Radarr, Sonarr, and Lidarr all follow the same pattern:

```yaml
radarr:
    image: lscr.io/linuxserver/radarr:latest
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - /opt/radarr:/config
      - /mammoth/library/movies:/movies
      - /mammoth/downloads/transmission:/downloads
    network_mode: host
```

These run on the **host network** rather than through the VPN. They don't need VPN protection - they're just web UIs and API servers that talk to indexers and download clients over HTTPS. Running them on the host network simplifies port access and avoids any VPN-related latency on the management UIs.

### Why LinuxServer.io Images

The `lscr.io/linuxserver/` images are the de facto standard for self-hosted media apps. They handle `PUID`/`PGID` mapping cleanly, have predictable volume layouts, and are well-maintained. The alternative is the official images from each project, which vary wildly in quality and configuration approach.

### Jackett as the Indexer Proxy

Jackett translates requests from the *arr apps into queries that hundreds of different torrent trackers understand. Instead of configuring each tracker individually in Radarr, Sonarr, and Lidarr, you configure them once in Jackett and point the *arr apps at Jackett.

```yaml
jackett:
    image: lscr.io/linuxserver/jackett:latest
    environment:
      - AUTO_UPDATE=true
    ports:
      - 9117:9117
```

Jackett runs on the host network with its own port mapping (not through the VPN) because it only talks to tracker APIs over HTTPS - it doesn't need IP masking.

**Alternative: Prowlarr.** The *arr team now maintains Prowlarr as their official indexer manager, with tighter integration into Radarr/Sonarr/Lidarr (it syncs indexer configs automatically). I haven't migrated yet because Jackett works and I haven't had a reason to switch. If you're starting fresh, Prowlarr is probably the better choice.

## Storage Layout

Everything lives on a single XFS filesystem mounted at `/mammoth`:

```
/mammoth
  /library
    /movies        → Pawpcorn + Radarr
    /tv            → Pawpcorn + Sonarr
    /music         → Pawpcorn + Lidarr + slskd
  /downloads
    /transmission  → Transmission downloads
    /soulseek      → slskd downloads
```

Having downloads and library on the same filesystem is critical for hardlinks to work. XFS was chosen over ext4 for its better handling of large files and high-throughput sequential I/O, which is common with media workloads.

## Trade-Offs

- **NordVPN lock-in**: The VPN container is NordVPN-specific. Switching providers means replacing the image and reconfiguring auth.
- **All-or-nothing VPN**: If the VPN drops, both Transmission and slskd lose connectivity. There's no fallback - which is the point, but it means downloads stall during VPN outages.
- **Nightly Lidarr**: The nightly tag is less stable. We accept occasional bugs in exchange for plugin support.
- **No Prowlarr**: Jackett works but is technically the legacy option. Migration is on the TODO list.

## Future Work

- **Migrate Jackett to Prowlarr** for native *arr integration and automatic indexer sync.
- **VPN health monitoring** to alert when the tunnel drops instead of silently stalling downloads.
- **Per-service VPN routing** if we ever want some download clients on the VPN and others not.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/stellarr/`.
