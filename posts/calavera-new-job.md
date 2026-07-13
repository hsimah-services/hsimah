---
title: Calavera's New Job
date: 2026-07-12
description: Retiring the vinyl kiosk, freeing fjord for a cyberdeck, and reimaging a decade-old Surface Pro in one sitting with Claude keeping me on track
---

# Calavera's New Job

I've written about [the Loft](/posts/my-home-lab) and about [spinnik](/posts/spinnik), the vinyl-streaming rig that turned our turntable into a whole-home audio source. Both posts feature **calavera**, the Surface Pro 2 I refuse to retire. It just changed jobs again, and the way I made that change is the more interesting story.

## What Calavera Used To Do

Calavera sat downstairs next to the record player. It ran an old Ubuntu install with a locked-down `cage`/chromium kiosk, and pulled double duty for spinnik: the touchscreen was `spinnik-ui`, a browser pointed at Music Assistant so we could pick rooms right next to the turntable, and underneath it was the audio capture host - DarkIce grabbing the LP5X over USB and Icecast serving it to the fleet.

Meanwhile, downstairs multi-room audio itself was handled by **fjord**, a Raspberry Pi 3 B+ running as a Snapcast client alongside its sibling **viking**.

## What Changed, and Why

Two Pi 3 B+ boards streaming Snapcast is plenty of redundancy for a two-room condo, and calavera was already an always-on machine sitting in a dock a few feet from the Downstairs speakers with a USB DAC for spinnik's capture stage. It made more sense for calavera to *be* the Downstairs Snapcast client directly rather than route through a separate Pi. So:

- **calavera** took over fjord's Downstairs Snapcast role, playing straight out its USB DAC.
- **spinnik** - the whole vinyl-streaming stack, DarkIce, Icecast, the dedicated kiosk UI - got retired outright. Folding the turntable browser into the same touchscreen that now needed to exist anyway for Music Assistant made the separate kiosk UI redundant.
- The chromium/cage kiosk got replaced with a real **i3** session, so calavera is a proper Linux desktop now rather than a locked browser - useful for debugging, and honestly just nicer to work with.
- **fjord**, freed of both howlr and its Downstairs duties, is now sitting quiet on metrics-only duty while it waits for its next life: it's going to be the driver for a cyberdeck build, a project for Georgia.

One Pi doing less, one old tablet doing more, and a stack retired outright. Net simpler.

## Doing It In One Sitting

Here's the part I actually want to write about. Everything involved in this reimage - partitioning a disk, installing Debian, setting up a window manager, standing up a kiosk browser pointed at a website - is stuff I already know how to do. None of it was new to me. What was different was doing the *whole thing*, on a physical machine sitting in my living room, in one evening, without ever leaving calavera in a state where I'd have to walk back downstairs the next day and fix something.

I started at 4:34pm by writing the runbook before touching the hardware - wipe the Ubuntu install, put Debian 13 on it, provision i3 and lightdm and a kiosk-mode Firefox pointed at Music Assistant, fold in an unrelated SSH hardening change that was sitting on `main`. Working through it with Claude meant every step was sequenced and reversible before I ran it: create the install USB, boot it, make the exact tickbox choices that keep Debian's installer from pulling in a desktop environment and a print server I didn't want, seed SSH keys before the provisioner locks out password auth, *then* run `setup.sh`.

About two and a half hours in, the dashboard came up on a fresh chromium kiosk at 200% scale - and immediately SIGTRAPed on every launch. That could have eaten the rest of the night as a rabbit hole. Instead we worked it like an incident: reproduce with `--no-sandbox`, `--disable-gpu`, `--headless` - still crashes. Check `dmesg` for an AppArmor denial - nothing. Reinstall the package - still broken. That's a strong enough signature of a broken upstream build (trixie's Chromium 150.x, as it turned out) that the right move was to stop debugging someone else's binary and swap browsers, not keep digging. Twenty minutes later the dashboard was running on `firefox-esr --kiosk` instead, and I had a note in the docs for whoever hits the same wall next.

By 9:07pm the branch was merged. Downstairs audio was only actually offline for the duration of the reimage itself, and at every commit along the way - runbook, dashboard config, the browser swap - calavera was left in a state I could have walked away from and it would have kept working. That's the part Claude actually changed for me: not the Linux knowledge, I had that already, but the discipline of never running two risky steps back to back without a working checkpoint in between, and the speed to tell "keep debugging" from "cut your losses and pivot" when a dead end shows up.

The polish kept going over the following week in small, low-risk commits - enabling touch swipe-scroll on the dashboard, dialing the HiDPI scale down from 200% to native and then up to a 130% sweet spot, tightening the WiFi watchdog interval for calavera's flakier USB adapter, purging some installer cruft that snuck in. None of it required another evening pulled out of the schedule, because the machine was never broken to begin with.

Calavera's third job in its life as an old dock-mounted tablet, and the smoothest changeover yet.
