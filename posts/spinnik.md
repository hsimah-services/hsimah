---
title: [spinnik] Streaming Vinyl Over the LAN
date: 2026-04-06
description: Capturing USB turntable audio with DarkIce, serving it via Icecast, pinning ALSA devices with udev, and running it all on a locked-down Surface Pro kiosk
---

*Retired July 2026: in several months I never actually turned the record streaming on, so the spinnik stack was removed. `calavera` is now a [howlr](/posts/howlr) Snapcast client with a Music Assistant touchscreen - see [Calavera's New Role](/posts/calavera-new-role). This post is kept as a write-up of how the build worked.*

Spinnik streams our Audio-Technica LP5X turntable to every room in the condo via [Howlr](/posts/howlr) (Music Assistant + Snapcast). It runs on `calavera` - an old Surface Pro 2 that sits next to the turntable, doubling as both the audio capture host and a touchscreen kiosk for controlling playback. The name is "spin" + "Sputnik", keeping with the space theme.

This post digs into the technical details: audio capture with DarkIce, streaming with Icecast, ALSA device pinning with udev, the kiosk lockdown, and the touch UI served by a local nginx container.

## Why Stream a Turntable?

We live in a two-story condo in Seattle. Upstairs has a balcony with a view of the Space Needle - a nice place to spend an afternoon. Downstairs is where the record player lives. Vinyl is a fun way to intentionally listen to music: you pick an album, flip it over halfway through, and actually pay attention. The problem was that "intentionally listening" meant sitting in one room. If I put on a record downstairs and walked up to the balcony, I'd lose it.

I already had multi-room audio working through Howlr, with Spotify, Plex and the rest streaming to every room. The missing piece was the turntable. I wanted to drop a needle downstairs and hear it everywhere, including up on the balcony. That meant getting the LP5X's audio onto the network and into Music Assistant.

## The Stack

Spinnik is a three-container stack running on `calavera`:

```yaml
services:
  spinnik-icecast:
    image: libretime/icecast:2.4.4
    ports:
      - "8000:8000"
    environment:
      ICECAST_SOURCE_PASSWORD: ${ICECAST_SOURCE_PASSWORD}
      ICECAST_ADMIN_PASSWORD: ${ICECAST_ADMIN_PASSWORD}

  spinnik-darkice:
    build:
      context: .
      dockerfile: Dockerfile.darkice
    image: spinnik-darkice:latest
    devices:
      - /dev/snd:/dev/snd
    volumes:
      - ./darkice.cfg:/etc/darkice.cfg:ro
    depends_on:
      - spinnik-icecast

  spinnik-ui:
    image: nginx:alpine
    ports:
      - "8080:8080"
    volumes:
      - ./ui:/usr/share/nginx/html:ro
      - ./nginx.conf.template:/etc/nginx/templates/default.conf.template:ro
    environment:
      MA_API_TOKEN: ${MA_API_TOKEN}
    depends_on:
      - spinnik-icecast
```

**DarkIce** captures audio from the LP5X's USB audio interface, encodes it, and pushes it to **Icecast**, which serves the stream over HTTP. Music Assistant on `space-needle` picks up the Icecast URL as a radio station and distributes it through Snapcast to every room.

## DarkIce: Audio Capture and Encoding

DarkIce is an old-school Linux audio encoder that reads from an ALSA device and streams to an Icecast or Shoutcast server. It's been around since the early 2000s and doesn't see much active development, but it's stable and does exactly what we need.

### The Custom Docker Image

There's no official DarkIce Docker image, so we build one:

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends darkice && \
    rm -rf /var/lib/apt/lists/*
CMD ["darkice", "-c", "/etc/darkice.cfg"]
```

Debian Bookworm's package repos include DarkIce, so the build is trivial. The slim base keeps the image small.

### DarkIce Configuration

```ini
[general]
duration        = 0
bufferSecs      = 5
reconnect       = yes

[input]
device          = plughw:LP5X,0
sampleRate      = 44100
bitsPerSample   = 16
channel         = 2

[icecast2-0]
bitrateMode     = vbr
quality         = 0.8
format          = vorbis
server          = spinnik-icecast
port            = 8000
password        = <icecast-source-password>
mountPoint      = vinyl
name            = The Loft Turntable
description     = Live vinyl from the Audio-Technica LP5X
```

Key decisions:

- **`duration = 0`**: Stream indefinitely. DarkIce captures audio as long as it's running.
- **`reconnect = yes`**: If Icecast restarts, DarkIce reconnects automatically instead of exiting.
- **`plughw:LP5X,0`**: The ALSA device name. The `plughw:` prefix enables automatic sample rate and format conversion, which is more forgiving than raw `hw:` access.
- **Ogg Vorbis at quality 0.8**: This produces roughly 256kbps variable bitrate. Ogg Vorbis is well-supported by Icecast, license-free, and sounds excellent at this quality level. The alternative would be MP3 (wider client compatibility) or Opus (better quality at lower bitrates), but Vorbis hits the sweet spot for a LAN stream where bandwidth isn't a concern.
- **44.1kHz/16-bit stereo**: CD quality. This matches the LP5X's native output - no upsampling or downsampling.

### Why DarkIce Over FFmpeg

FFmpeg could do the same job: `ffmpeg -f alsa -i plughw:LP5X,0 -codec:a libvorbis -q:a 8 icecast://source:password@spinnik-icecast:8000/vinyl`. The main reason I went with DarkIce is the reconnect behavior. DarkIce handles Icecast restarts gracefully - it retries the connection with backoff. Getting the same behavior from FFmpeg requires a wrapper script with retry logic. DarkIce is also purpose-built for this exact use case, so the config is more readable than an FFmpeg command line with a dozen flags.

The trade-off: DarkIce is less actively maintained. If it stops working on a future Debian release, FFmpeg is the fallback.

## ALSA Device Pinning With Udev

USB audio devices on Linux don't get stable names. The LP5X might come up as `hw:1,0` after one boot and `hw:3,0` after another, depending on USB enumeration order. DarkIce needs a consistent device path.

The fix is a udev rule that matches the LP5X by its USB vendor and product ID and assigns a stable name:

```
SUBSYSTEM=="sound", ATTRS{idVendor}=="08bb", ATTRS{idProduct}=="29c0", ATTR{id}="LP5X"
```

This makes `plughw:LP5X,0` always point to the turntable. The vendor/product ID (`08bb:29c0`) identifies the TI PCM2900C audio chip inside the LP5X. You can find yours with `lsusb`.

The rule is installed automatically by `setup.sh` when the host runs the spinnik service.

## Icecast: The Stream Server

Icecast serves the encoded audio as an HTTP stream at `http://calavera:8000/vinyl`. Any client that understands HTTP audio streams (VLC, Music Assistant, a web browser) can tune in.

We use the `libretime/icecast:2.4.4` image because it's a maintained build of Icecast 2.4.x. The official Icecast project doesn't publish Docker images.

The configuration is minimal - just passwords via environment variables. Icecast's defaults are fine for a LAN stream with a single source and a handful of listeners.

## The Kiosk

`calavera` runs as a locked-down kiosk. The touchscreen displays a custom web UI for controlling vinyl playback - start/stop the stream and choose which rooms to play in (Upstairs, Downstairs, All).

### Kiosk Stack

```
greetd (auto-login as kiosk user)
  └── cage (Wayland kiosk compositor)
       └── chromium --kiosk (URL-restricted)
```

- **Cage**: A minimal Wayland compositor (~5MB) that runs exactly one fullscreen app. No window management, no task switching, no escape vectors. Much simpler than a full desktop environment.
- **Chromium managed policies**: A JSON policy file blocks all URLs by default and allowlists only `*.loft.hsimah.com`, `*.space-needle`, and the blog domains. This prevents the kiosk from being used as a general web browser.
- **nftables firewall**: Outbound traffic is restricted to RFC 1918 private ranges. The kiosk can talk to the LAN but not the internet. This is defense-in-depth - even if someone navigates to an external URL, the firewall blocks it.

### Power Management

The Surface Pro 2 has known power management issues - it was retired from daily use for this reason. Suspend and resume are unreliable on this hardware, so we chose to leave it always on rather than risk it not waking up. Suspend, sleep, and hibernate are masked via systemd. The lid switch is ignored. Screen blanking is disabled via kernel parameter (`consoleblank=0`) and a udev rule that keeps DPMS off. The result: the screen is always on, showing the turntable controller.

### The Touch UI

The controller UI is served by the `spinnik-ui` nginx container running locally on `calavera`. Previously the UI was hosted remotely through Mushr's Caddy on `space-needle`, but moving it into the spinnik stack keeps the kiosk self-contained - it works even if `space-needle` is down for maintenance. Nginx handles three concerns: static file serving, API proxying, and stream proxying:

```nginx
server {
    listen 8080;

    location /api/spinnik {
        rewrite ^/api/spinnik$ /api break;
        proxy_pass http://192.168.86.28:8095;
        proxy_set_header Authorization "Bearer ${MA_API_TOKEN}";
    }

    location /stream {
        proxy_pass http://spinnik-icecast:8000/vinyl;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
```

The API proxy injects the Music Assistant Bearer token server-side, so the kiosk browser never handles authentication. The official nginx image's `envsubst` template support substitutes `${MA_API_TOKEN}` at container startup. The stream proxy provides a clean URL for the Icecast audio - the UI uses `/stream` rather than hitting Icecast directly.

The UI is intentionally simple: a large play/stop button and three room selection buttons (Upstairs, Downstairs, All). It polls Music Assistant every 3 seconds for playback state and updates the UI accordingly. No framework, no build step - just vanilla JavaScript.

## Network Considerations

`calavera`'s nftables firewall blocks internet access, so the Icecast stream is LAN-only. Other hosts reach it at `http://calavera:8000/vinyl` via dnsmasq resolution. Music Assistant on `space-needle` adds this URL as a radio station and handles distribution from there.

The stream adds minimal network load. Ogg Vorbis at ~256kbps is about 32KB/s - negligible on a gigabit LAN.

## Trade-Offs

- **Latency**: There is a small delay between the needle and the stream. Given the dated technology of a needle bumping over grooves, it's minuscule.
- **DarkIce maintenance risk**: The project is mature but not actively developed. A future OS upgrade could break it, requiring migration to FFmpeg.
- **Surface Pro 2 is old hardware**: 4GB RAM, a 3rd-gen Intel CPU. It handles audio capture and a kiosk browser fine, but there's no headroom. If it dies, any Linux-capable device with a USB port and display output could replace it.
- **Always-on display**: The Surface Pro's screen runs 24/7. Modern LCDs handle this fine, but it does consume power. Dimming the display would save energy, but because of the Surface Pro 2's unreliable power management, any solution needs to dim the backlight rather than suspend the device.
- **Single stream**: DarkIce captures one audio source. If we added a second turntable or audio input, we'd need a second DarkIce instance and Icecast mount point.

## Future Work

- **Motion-activated display dimming** using a USB PIR sensor to dim the backlight when nobody is nearby (without suspending, since the Surface Pro 2 can't reliably wake).
- **Stream quality selector** in the UI to switch between Ogg Vorbis quality levels based on network conditions (though on a LAN, max quality is always fine).
- **Record detection** - automatically start/stop the stream when the turntable platter spins (the LP5X doesn't have a digital signal for this, so it would need audio level detection).

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/spinnik/`.
