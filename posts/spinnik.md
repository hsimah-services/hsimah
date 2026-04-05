---
title: Spinnik: Vinyl to Every Room
date: 2026-04-05
description: Streaming a turntable throughout the condo with Icecast, DarkIce, and Music Assistant
---

<!-- Title ideas:
  - Spinnik: Vinyl to Every Room (spin + Sputnik, matching the service name)
  - The Vinyl Frontier (final frontier, space theme)
  - Wax Poetic (vinyl wax + writing about it)
  - Drop the Needle (record player + deployment)
-->

# Spinnik: Vinyl to Every Room

In [the last post](/posts/my-home-lab) I covered The Loft at a high level - what's running, how it's managed, and why everything has a silly name. This one zooms in on a new addition: **spinnik**, the service that streams our turntable to every room in the condo.

## The Setup

We live in a two-story condo in Seattle. Upstairs has a balcony with a view of the Space Needle - a nice place to spend an afternoon. Downstairs is where the record player lives, an Audio-Technica LP5X. We specifically picked the LP5X for its Bluetooth audio out, which made it easy to get the signal into a computer without running extra cables.

The LP5X is connected to **calavera**, an ancient Surface Pro 2 that I refuse to retire. We try to reuse as much tech as possible, and the Surface Pro 2 has a nice dock form factor that tucks away neatly next to the turntable. It pulls double duty: the touchscreen runs a kiosk display showing Music Assistant, so we can browse and select music right next to the record player. Underneath, it's also the audio capture host for the stream.

Vinyl is a fun way to intentionally listen to music. You pick an album, flip it over halfway through, and actually pay attention. The problem was that "intentionally listening" meant sitting in one room. If I put on a record downstairs and walked up to the balcony, I'd lose it.

## The Goal

I already had multi-room audio working through **howlr** (Music Assistant + Snapcast). Two Raspberry Pis - **viking** and **fjord** - sit in the living room and pole room with decent monitors attached, running as Snapcast clients. Spotify, Plex et al - all of that was already streaming to every room.

The missing piece was the turntable. I wanted to drop a needle downstairs and hear it everywhere, including up on the balcony. That meant getting the LP5X's analog audio onto the network and into Music Assistant.

## The Solution

Spinnik (spin + Sputnik, keeping with the space theme) is a two-container stack running on calavera:

| Container | What It Does |
|-----------|-------------|
| **spinnik-darkice** | Captures USB audio from the LP5X via ALSA and encodes it as Ogg Vorbis |
| **spinnik-icecast** | Serves the encoded stream at `http://calavera:8000/vinyl` |

The data flow looks like this:

1. The LP5X sends audio over USB to calavera
2. A udev rule pins the turntable's USB audio chip to a stable ALSA device name (`LP5X`), so DarkIce always knows where to find it
3. DarkIce captures the input at 44.1kHz/16-bit stereo and encodes to Ogg Vorbis at variable bitrate (~256kbps)
4. Icecast serves the stream on the LAN
5. Music Assistant picks up the Icecast URL as a radio station and distributes it through its built-in Snapcast server
6. Every Snapcast client in the fleet gets synchronized vinyl audio

The nice part is that spinnik only handles capture and encoding. All the distribution and room grouping is already handled by howlr. Once the stream existed, Music Assistant just treated it like any other source.

## The Tricky Bit

USB audio devices on Linux don't get stable names by default. Unplug and replug the turntable (or reboot) and it might come back as `hw:1,0` or `hw:3,0` or whatever ALSA feels like that day. DarkIce needs a consistent device path, so I wrote a udev rule that matches the LP5X's TI PCM2900C audio chip by vendor and product ID and pins it to `LP5X`. Now `plughw:LP5X,0` always points to the turntable regardless of enumeration order.

Calavera also runs behind nftables as a locked-down kiosk, so I had to open port 8000 to LAN traffic (RFC 1918 ranges only) for the other hosts to reach the Icecast stream.

## The Result

Put on a record downstairs, select which rooms should play from the touchscreen right next to it, and the vinyl streams everywhere in sync. Walk upstairs to the balcony, the music follows. There is a small delay between the needle and the stream, but given the dated technology of a needle bumping over grooves, it's minuscule. It's a small thing but it makes the turntable feel like a whole-home source instead of a single-room activity.

The full config is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/spinnik/` if you want to see the compose file, DarkIce config, and udev rule.
