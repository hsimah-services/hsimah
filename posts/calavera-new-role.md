---
title: Calavera's New Role
date: 2026-07-17
description: Retiring the vinyl kiosk, freeing fjord for a cyberdeck, and reimaging a decade-old Surface Pro in one sitting with Claude keeping me on track
---

I've written about [the Loft](/posts/my-home-lab) and about [spinnik](/posts/spinnik), the vinyl-streaming rig that turned our turntable into a whole-home audio source. Both posts feature **calavera**, the Surface Pro 2 I refuse to retire. It just changed jobs again, and the way I made that change is the more interesting story.

## What Calavera Used To Do

Calavera sat downstairs next to the record player. It ran a default Ubuntu install with a locked-down `cage`/chromium kiosk which ran the `spinnik` service: the touchscreen was `spinnik-ui`, a custom web application which interfaces (poorly!) with Music Assistant, so we could pick rooms right next to the turntable, and underneath it was the audio capture host - DarkIce grabbing the LP5X over USB and Icecast serving it to the fleet.

Meanwhile, downstairs multi-room audio itself was handled by `fjord`, a Raspberry Pi 3 B+ running as a Snapcast client alongside its sibling `viking` (the upstairs audio controller).

## What Changed, and Why

Two Pi 3 B+ boards streaming Snapcast worked really well in our two-storey condo, and `calavera` was already an always-on machine sitting in a dock a few feet from the Downstairs speakers with a USB DAC for spinnik's capture stage. While `spinnik` was a fun solution to digital streaming of analogue media, it turns out that it is *really tedious* having to run back to the living room to flip/change records. In several months I never actually turned on the record streaming, we tended to opt in for a "listening experience" in the living room. We did make significant use of the Snapcast streaming, though - `howlr` has been a big win. So why not merge the two? Remove the defunct `spinnik` service, move `howlr` from `fjord` to `calavera` and have the same digital streaming via Snapcast but *with* a Music Assistant UI running on the `calavera`'s built-in touchscreen.
So:
- **calavera** took over fjord's Downstairs Snapcast role, playing straight out its USB DAC.
- **spinnik** - the whole vinyl-streaming stack, DarkIce, Icecast, the dedicated kiosk UI - got retired outright. Folding the turntable browser into the same touchscreen that now needed to exist anyway for Music Assistant made the separate kiosk UI redundant.
- The chromium/cage kiosk got replaced with a real **i3** session, so calavera is a proper Linux desktop now rather than a locked browser - useful for debugging, and honestly just nicer to work with.
- **fjord**, freed of both howlr and its Downstairs duties.

One Pi doing less, one old tablet doing more, and a stack retired outright.

## The Reimage

The new role needed a fresh start: wipe the Ubuntu install, put Debian 13 on `calavera`, and provision i3, lightdm and a kiosk-mode browser window pointed at Music Assistant. Gotchas came with the hardware - the Surface Pro TypeCover does not emit reliable events, and the wifi and audio controllers would go to sleep and never wake up - which I needed to handle.

Everything involved in this reimage - partitioning a disk, installing Debian, setting up a window manager, standing up a kiosk browser pointed at a website - is stuff I already know how to do. None of it was new to me. What was different was doing the *whole thing*, on a physical machine sitting in my living room, without ever leaving `calavera` in a state where I'd have to walk back downstairs the next day and fix something.

I started at 4:34pm by writing the runbook before touching the hardware. Working through it with Claude meant every step was sequenced and reversible before I ran it: create the install USB, boot it, make the exact tickbox choices that keep Debian's installer from pulling in a desktop environment and a print server I didn't want, seed SSH keys before the provisioner locks out password auth, *then* run `setup.sh` (my home lab provisioning script).

About two and a half hours in, the dashboard came up on a fresh chromium kiosk at 200% scale - and immediately SIGTRAPed on every launch. That could have eaten the rest of the night as a rabbit hole. Instead we worked it like an incident: reproduce with `--no-sandbox`, `--disable-gpu`, `--headless` - still crashes. Check `dmesg` for an AppArmor denial - nothing. Reinstall the package - still broken. That's a strong enough signature of a broken upstream build (trixie's Chromium 150.x, as it turned out) that the right move was to stop debugging someone else's binary and swap browsers, not keep digging. Twenty minutes later the dashboard was running on `firefox-esr --kiosk` instead, and I had a note in the docs for whoever hits the same wall next. (I have not yet debugged this further - Firefox is running just fine.)

By 9:07pm the branch was merged. Downstairs audio was only actually offline for the duration of the reimage itself, and at every commit along the way - runbook, dashboard config, the browser swap - `calavera` was left in a state I could have walked away from and it would have kept working. That's the part Claude actually changed for me: not the Linux knowledge, I had that already, but the discipline of never running two risky steps back to back without a working checkpoint in between, and the speed to tell "keep debugging" from "cut your losses and pivot" when a dead end shows up.

The polish kept going over the following week in small, low-risk commits - enabling touch swipe-scroll on the dashboard, dialing the HiDPI scale down from 200% to native and then up to a 130% sweet spot, tightening the WiFi watchdog interval for `calavera`'s flakier USB adapter, purging some installer cruft that snuck in. None of it required another evening pulled out of the schedule, because the machine was never broken to begin with.

`calavera`'s third job in its life as an old dock-mounted tablet, and the smoothest changeover yet. (I wrote more about working this way in [Coding with Claude](/posts/coding-with-claude).)

## Cool Changes
I wanted the screen to be a live display of what is currently streaming via `calavera`, but I am also energy conscious and did not want the screen on 24/7. To solve that we came up with a small python service which listens to the Snapcast websocket and parses streamed payloads and applies the following logic:
- If there is an active stream leave the display on;
- if there is no stream and the idle timer is at 10+ minutes, turn off the screen;
- if a stream starts, turn the screen on.

We leave Music Assistant in the Now Playing view, so we see the song and album art and have volume and playback controls. It's so neat seeing the device wake up!

I want to rebuild the service using Rust as a learning experience, and I may even dive into X11 GUIs and make my own Loft Assistant client - I find the experience to change streaming targets a bit janky on MA.

## What's Next?
We have two more Surface Pros at home (a first and third generation, so the whole trifecta of SP1, 2 & 3). I will clone `calavera` onto the SP1 and replace `viking` with that - two streaming targets, two Surfaces with touch interfaces. Slick.

What will happen to the Pis? We are building Cyberdecks! My wife has shown an interest in this novel world of self-constructed computers. I will be writing about that a bit more later - but the Pis are perfect for a prototype and it goes towards our low-waste household.
