---
title: [pawpcorn] Plex With Hardware Transcoding
date: 2026-04-06
description: Running Plex Media Server in Docker with GPU passthrough, host networking, and a shared media library across five content types
---

Pawpcorn is the media server for [The Loft](https://github.com/hsimah-services/the-loft). It's Plex, running in Docker with Intel Quick Sync hardware transcoding enabled. The name is "paw" + "popcorn" - what's movie night without snacks?

This is arguably the simplest service in the fleet. It's a single container. But there are a few decisions in how it's configured that are worth explaining.

## The Compose File

```yaml
services:
  pawpcorn:
    container_name: pawpcorn
    image: plexinc/pms-docker:latest
    restart: unless-stopped
    network_mode: host
    environment:
      - PLEX_UID=${PUID}
      - PLEX_GID=${PGID}
      - TZ=${TZ}
      - PLEX_CLAIM=${PLEX_CLAIM}
    volumes:
      - /opt/pawpcorn/config:/config
      - /mammoth/pawpcorn/transcode:/transcode
      - /mammoth/library/movies:/data/Movies
      - /mammoth/library/tv:/data/TV
      - /mammoth/library/music:/data/Music
      - /mammoth/library/videos:/data/Videos
      - /mammoth/library/stand-up:/data/Stand Up
    devices:
      - /dev/dri:/dev/dri
```

Short and to the point. But every line is a deliberate choice.

## Host Networking

Plex uses `network_mode: host` instead of port mappings. This is the official recommendation from Plex for Docker deployments. Plex uses a wide range of ports - the web UI on 32400, DLNA on 1900 and 32469, GDM discovery on 32410-32414, and more. Mapping all of them individually is fragile and easy to get wrong. Host networking sidesteps the problem entirely.

The trade-off: Plex binds directly to the host's network interfaces. If you're running something else on port 32400, you have a conflict. In practice this is never an issue on a dedicated server, but it's worth knowing.

## GPU Passthrough

```yaml
devices:
  - /dev/dri:/dev/dri
```

This passes the host's GPU (via the DRI subsystem) into the container. On our Minisforum MS-01 with an Intel i9, this enables Intel Quick Sync Video for hardware transcoding. Quick Sync handles 4K HEVC to 1080p H.264 transcodes using the iGPU instead of CPU cores, dropping transcoding CPU usage from 200-300% to under 10%.

For this to work, the `littledog` service account needs to be in the `render` and `video` groups on the host. This is handled in `host.conf`:

```bash
LITTLEDOG_EXTRA_GROUPS="render,video"
```

### Why Intel Quick Sync

The MS-01 has an i9 with an integrated Intel GPU. Quick Sync is the best-supported hardware transcoding option for Plex in Docker on Intel hardware - no additional drivers beyond what the kernel provides. The alternative would be an Nvidia GPU with the NVENC encoder, which requires the Nvidia Container Toolkit and is more complex to set up. For a machine where the GPU's only job is transcoding, Quick Sync is simpler and cheaper (no discrete GPU needed).

## The Claim Token

```yaml
- PLEX_CLAIM=${PLEX_CLAIM}
```

The claim token links the server to your Plex account during initial setup. You generate one at [plex.tv/claim](https://www.plex.tv/claim/) - it's valid for four minutes. Once the server is claimed, this variable is ignored on subsequent starts.

This is the only annoying part of Plex Docker deployments. If you tear down and recreate the container without preserving the config volume, you need a fresh claim token. As long as `/opt/pawpcorn/config` persists, the claim survives rebuilds.

## Media Library Layout

Five content types, each mounted to a path Plex expects under `/data`:

| Mount | Content |
|-------|---------|
| `/data/Movies` | `/mammoth/library/movies` |
| `/data/TV` | `/mammoth/library/tv` |
| `/data/Music` | `/mammoth/library/music` |
| `/data/Videos` | `/mammoth/library/videos` |
| `/data/Stand Up` | `/mammoth/library/stand-up` |

These are the same directories that [Stellarr's](/posts/stellarr) Radarr, Sonarr, and Lidarr write to. Radarr puts finished movies in `/mammoth/library/movies`, Plex picks them up from the same path. No copies, no sync - they're literally the same files on disk (often hardlinked from the download directory).

The `/mammoth` volume is a dedicated XFS filesystem on a separate drive. Keeping media on its own filesystem means config backups don't have to contend with terabytes of media, and XFS handles large files and sequential reads well.

## Transcoding Workspace

```yaml
- /mammoth/pawpcorn/transcode:/transcode
```

The transcode directory is where Plex writes temporary files during hardware transcoding. These can be large - a 4K movie being transcoded might produce gigabytes of intermediate data. Putting this on `/mammoth` (the media drive) rather than the OS drive avoids filling up the root filesystem.

The alternative is a RAM disk (`tmpfs`), which is faster but risky if you don't have enough RAM. A 4K transcode can eat 4-8GB of temp space. With 64GB on the MS-01 we could afford it, but the XFS drive is fast enough and doesn't risk OOM situations.

## Why Plex Over Jellyfin or Emby

This is the most common question in self-hosting circles, and the answer is boring: Plex works well for our household and we've been using it for about a year.

**Pros of Plex:**
- The client apps (Roku, iOS, Android TV, browsers) are polished and work reliably
- Hardware transcoding support is mature
- Remote access (streaming outside the LAN) works out of the box with Plex's relay
- The Plex Pass lifetime purchase is a one-time cost for all premium features

**Cons of Plex:**
- **It's not open source.** Plex Inc. controls the server binary and could change terms at any time
- **Plex phones home.** The server checks in with Plex's auth servers. If Plex's infrastructure goes down, local streaming can be disrupted (though there's a setting to allow local access without auth)
- **The Plex Pass is required** for hardware transcoding, which is table-stakes functionality
- **Ads and "Live TV" features** have been creeping into the UI. You can disable most of them, but Plex is clearly trying to become a content platform, not just a media server

**Jellyfin** is the fully open-source alternative. Its hardware transcoding has improved dramatically and is now competitive with Plex. The client apps are less polished (especially on Roku), but they're improving. If I were starting from scratch today, I'd seriously evaluate Jellyfin. The main reason I haven't switched is inertia - Plex works, the family knows how to use it, and migration is effort for no immediate gain.

## Log Rotation

Plex can be chatty, especially during library scans and transcoding. The compose file sets a 20MB/3-file rotation:

```yaml
logging:
    driver: json-file
    options:
      max-size: "20m"
      max-file: "3"
```

This caps total log storage at 60MB per container, which is generous but prevents runaway disk usage during long scan operations.

## Trade-Offs

- **Vendor lock-in**: Plex is closed-source. Our media library is organized in a standard way (folders with media files), so migrating to Jellyfin wouldn't require re-downloading anything - just re-scanning.
- **Host networking**: Means Plex gets all the host's ports. Fine on a dedicated server, potentially problematic on a shared workstation.
- **No container isolation**: Host networking plus GPU passthrough means Plex has broad access to the host. This is the standard Docker deployment for Plex, but it's worth acknowledging.

## Future Work

- **Evaluate Jellyfin** as an open-source replacement, particularly once Jellyfin's Roku client matures.
- **Tdarr** for automated media optimization - pre-transcoding 4K HEVC to H.264 for devices that can't direct-play, reducing real-time transcoding load.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/pawpcorn/`.
