---
title: howlr - Multi-Room Audio With Music Assistant and Snapcast
date: 2026-04-06
description: Building a whole-home audio system across a condo with Music Assistant, Snapcast, Spotify Connect, AirPlay, and Raspberry Pis - without buying a Sonos
---

*Updated September 2026: the Upstairs Snapcast client is now `woodstock`, a Surface Pro with a Music Assistant touchscreen, instead of `viking`. `woodstock`'s story [can be read here](/posts/woodstock-calaveras-older-sibling)*
*Updated July 2026: the Downstairs Snapcast client is now `calavera`, a Surface Pro 2 with a Music Assistant touchscreen, instead of `fjord`, and the turntable stream ([spinnik](/posts/spinnik)) has been retired. The rest of this post describes the original Raspberry Pi setup. See [Calavera's New Role](/posts/calavera-new-role) for the details.*

Howlr is the multi-room audio system for [The Loft](https://github.com/hsimah-services/the-loft). It streams music from Spotify, Plex, Apple Music, and (for a while) a vinyl turntable to speakers throughout the condo using Music Assistant and Snapcast. The name comes from pomskies howling - this one streams audio to every room.

## Why Not Just Buy a Sonos

The obvious alternative to building a multi-room audio system is buying one. Sonos, Apple HomePod, or Amazon Echo speakers all do multi-room audio out of the box. Here's why I didn't go that route:

- **Source lock-in**: Sonos and HomePod each have preferred ecosystems. I wanted to stream from any source - Spotify, Apple Music, Plex, and a turntable - to any room, from a single interface.
- **Cost**: Good Sonos speakers for three rooms costs over $1,000. Two Raspberry Pis with decent powered monitors cost under $200 total, and they're general-purpose computers that also run other services.
- **Control**: I can add sources, rooms, and automation without waiting for a vendor to add a feature. When I added the vinyl turntable, it was a URL change in Music Assistant - no firmware update required.

The trade-off: setup complexity is significantly higher than plugging in a Sonos. And the mobile app experience isn't as polished - Music Assistant's web UI works well but it's not a native app.

## Architecture

Howlr uses Docker Compose profiles to run different containers on different hosts from the same compose file:

```yaml
services:
  # Server profile - runs on space-needle
  music-assistant:
    image: ghcr.io/music-assistant/server:latest
    container_name: howlr
    profiles:
      - server
    network_mode: host
    volumes:
      - /opt/howlr:/data

  # Client profile - runs on viking and fjord
  snapclient:
    image: ivdata/snapclient:latest
    container_name: howlr-snapclient
    profiles:
      - client
    network_mode: host
    devices:
      - /dev/snd:/dev/snd
    environment:
      HOST: ${SNAPSERVER_HOST}
      EXTRA_ARGS: "--soundcard ${SOUND_DEVICE:-default} --hostID ${HOST_ID}"
```

Each host's `.env` file selects which profile runs:

- `space-needle` (`COMPOSE_PROFILES=server`): Runs Music Assistant, which includes a built-in Snapcast server
- `viking` and `fjord` (`COMPOSE_PROFILES=client`): Run lightweight Snapcast clients that receive audio and play it through attached speakers

This means one compose file works for all hosts. `docker compose up -d` on `space-needle` starts the server; the same command on a Pi starts the client. The profile is controlled by a single environment variable.

## Music Assistant

[Music Assistant](https://music-assistant.io/) is the brains of the operation. It's a music library manager and multi-room audio controller that aggregates sources and distributes audio to players. Key features we use:

- **Multiple music sources**: Spotify, Apple Music, Tidal, Plex (our own library), and a custom Icecast URL (the turntable)
- **Built-in Snapcast server**: No separate Snapcast server container needed. MA manages player groups, volume, and sync.
- **Spotify Connect plugin**: Each room appears as a Spotify Connect target. Open Spotify on your phone, tap "Upstairs", and it plays through the Pi in that room.
- **AirPlay Receiver plugin**: Same idea for Apple devices. AirPlay to "Downstairs" and it plays through `fjord`'s speakers.

### Why Music Assistant Over Mopidy, Volumio, or Roon

- **Mopidy**: Great for single-room setups with MPD clients. Doesn't handle multi-room distribution or Spotify Connect/AirPlay natively.
- **Volumio**: Designed for dedicated audio hardware (HiFiBerry, etc.). Less flexible for fleet-style deployments across different hardware.
- **Roon**: Arguably the best multi-room audio software, but it costs $10/month and requires a Roon-specific endpoint setup. Music Assistant is free and open-source.
- **Home Assistant + Snapcast**: Music Assistant started as a Home Assistant add-on and graduated to a standalone project. You can still integrate it with HA for automation, but it runs independently.

The trade-off: Music Assistant is younger software. The Spotify Connect and AirPlay plugins are early-stage with 0.5-5 second startup latency on play/pause/skip. Ongoing playback is real-time with no degradation - it's just the initial command that's slow.

## Snapcast: Synchronized Audio

[Snapcast](https://github.com/badaix/snapcast) is the transport layer. It streams audio from the server to clients with time synchronization, so speakers in different rooms play in perfect sync. This is the same technique Sonos uses (though with a different protocol).

The server runs inside Music Assistant. Clients connect to it from `viking` and `fjord`:

```yaml
snapclient:
    image: ivdata/snapclient:latest
    network_mode: host
    devices:
      - /dev/snd:/dev/snd
    environment:
      HOST: ${SNAPSERVER_HOST}
      EXTRA_ARGS: "--soundcard ${SOUND_DEVICE:-default} --hostID ${HOST_ID}"
```

- **`/dev/snd`** passes the host's ALSA sound devices into the container. The Pis have USB DACs or 3.5mm output going to powered monitors.
- **`HOST`** points to `space-needle`'s IP where the Snapcast server runs.
- **`HOST_ID`** gives each client a stable identity for room grouping. Without this, Snapcast would assign a new random ID on every container restart, losing your group configuration.

### Why Host Networking for Audio

Both server and client use `network_mode: host`. Music Assistant needs host networking for its Spotify Connect and AirPlay plugins (they use mDNS/Bonjour for discovery, which requires being on the LAN broadcast domain). Snapclient needs it for low-latency audio - bridge networking adds measurable latency that can cause sync issues.

## The Surface Pro (1 & 2) Clients

`calavera` and `woodstock` are ancient Surface Pro devices in their respective hardware docks. They have been configured as lightweight Debian i3 kiosks with a fullscreen Firefox Music Assistant session. i3 and Music Assistant have been configured for the smaller screen size and touch-first input, forcing mobile mode and using DPI scaling.

### Surface Pro Stability

The devices are old. The wifi can drop out, the power management on the docks is flaky and the TypeCover switch does not fire any event (that I can monitor). All of these were solved with good old fashioned hacks - cron jobs checking on the device state and executing scripts as necessary. e.g. if no one has touched the device and nothing is streaming to the device for 10 minutes (which ever is shorter) turn the screen off; on touch or streaming initiated the screen turns back on.

## Spotify Connect Limitations

The Spotify Connect plugin in Music Assistant has one significant limitation: **only one target can be active per Spotify account at a time**. If you're streaming to "Upstairs" and someone else in the household opens Spotify and picks "Downstairs", it'll take over the session.

The workaround: a Spotify Family plan. Each family member gets their own Spotify login and can stream to different rooms simultaneously. This is a Music Assistant limitation, not a Snapcast one - Snapcast itself handles multiple simultaneous streams without issue.

## Trade-Offs

- **No mobile app**: Music Assistant has a web UI that works on mobile browsers, but there's no native iOS/Android app. The Spotify and Apple Music apps serve as the mobile interface for their respective sources. Pinning Music Assistant as a PWA is an acceptable interface.

## Future Work

- **Home Assistant integration** for automation - e.g., start playing music when someone arrives home, or lower volume at a certain time.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/howlr/`.
