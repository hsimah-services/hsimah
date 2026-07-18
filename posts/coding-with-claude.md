---
title: Coding with Claude
date: 2026-07-17
description: Building my home lab, configuring systems with Claude Code and keeping motivation high
---

## Tinkerers are going to tinker
I'm a born tinkerer - I love putting things together and pulling them apart and seeing how they work. It's served me well as a software engineer. One of my favourite parts of the job is to dive into an unfamiliar codebase and make impactful changes very quickly.

Over the years my passion for home projects has waned. Since starting work at Facebook I became consumed with the number of things I could do at work, and combined with being in a new country and the pandemic, I stopped building my own things.

That all changed when I started using Claude Code. We started using LLMs and agentic supported coding tools in 2025 with gusto - but it was kinda boring and it didn't produce changes I liked. It was when I was listening to a podcase with Scott Hanselman (from Microsoft) where my mindset shifted. Scott said he went from writing a line of code at a time to writing ten, to writing a hundred. Something clicked - I got it. The LLM wasn't supposed to do all my work for me, it was supposed to support me doing my work.

And that's what I do now. I use my many years of experience as a software engineer and tinkerer and the, quite frankly, amazing technology of Claude Code to accelerate my skills. Instead of reading log files and debugging stack traces, I can provide Claude with those and have it do the analysis. I can tell it to remember something and it writes it down for me.

Again I have to stress - **the LLM does not to my work for me, it helps me do my work**. Everything I do with Claude is something I am more than capable of doing myself. I can just do it faster now.

## Large Language Learning
Many of my peers express fear of their skills atrophying if they use LLMs too much. That is a real concern and one worth considering every time we fire up the terminal. I am taking the opposite approach - I asked Claude to help me learn Rust and GTK4 programming. Together we built a simple, yet useless, file manager for Linux. It was an easy project (draw a window, list folder content, handle clicks) and I gave Claude express instructions to help me, not to do work for me. I would get some generated Rust code and try to read it. I would ask Claude questions drawing parallels from languages I did know (PHP/Hack, JavaScript, C#) and explain differences. I am not an expert in Rust, and would probably fail any test given on it, but I learned enough to finish the project. (It is on my GitHub, but it is not good - I use `yazi`.)

## Unbreakable Rollout
In my tinkering at home, I have set up a Snapcast base local streaming, making use of Music Assistant. I recently wanted to change one of the hosts involved from a Raspberry Pi 3B+ to an old Microsoft Surface Pro 2. This required provisioning a new Linux install for the Surface, installing all the services needed and building a new i3 based environment. There were various gotchas - the Surface Pro TypeCover does not emit reliable events, the wifi and audio controllers would go to sleep and never wake up - which I needed to handle. And then there was the sugar on top - automations to make the whole thing slick and worthy of my home.

This is the part I actually want to write about. Everything involved in this reimage - partitioning a disk, installing Debian, setting up a window manager, standing up a kiosk browser pointed at a website - is stuff I already know how to do. None of it was new to me. What was different was doing the *whole thing*, on a physical machine sitting in my living room, without ever leaving `calavera` (the Surface Pro 2) in a state where I'd have to walk back downstairs the next day and fix something.

I started at 4:34pm by writing the runbook before touching the hardware - wipe the Ubuntu install, put Debian 13 on it, provision i3 and lightdm and a kiosk-mode browser window pointed at Music Assistant. Working through it with Claude meant every step was sequenced and reversible before I ran it: create the install USB, boot it, make the exact tickbox choices that keep Debian's installer from pulling in a desktop environment and a print server I didn't want, seed SSH keys before the provisioner locks out password auth, *then* run `setup.sh` (my home lab provisioning script).

About two and a half hours in, the dashboard came up on a fresh chromium kiosk at 200% scale - and immediately SIGTRAPed on every launch. That could have eaten the rest of the night as a rabbit hole. Instead we worked it like an incident: reproduce with `--no-sandbox`, `--disable-gpu`, `--headless` - still crashes. Check `dmesg` for an AppArmor denial - nothing. Reinstall the package - still broken. That's a strong enough signature of a broken upstream build (trixie's Chromium 150.x, as it turned out) that the right move was to stop debugging someone else's binary and swap browsers, not keep digging. Twenty minutes later the dashboard was running on `firefox-esr --kiosk` instead, and I had a note in the docs for whoever hits the same wall next. (I have not yet debugged this further - Firefox is running just fine.)

By 9:07pm the branch was merged. Downstairs audio was only actually offline for the duration of the reimage itself, and at every commit along the way - runbook, dashboard config, the browser swap - `calavera` was left in a state I could have walked away from and it would have kept working. That's the part Claude actually changed for me: not the Linux knowledge, I had that already, but the discipline of never running two risky steps back to back without a working checkpoint in between, and the speed to tell "keep debugging" from "cut your losses and pivot" when a dead end shows up.

The polish kept going over the following week in small, low-risk commits - enabling touch swipe-scroll on the dashboard, dialing the HiDPI scale down from 200% to native and then up to a 130% sweet spot, tightening the WiFi watchdog interval for `calavera`'s flakier USB adapter, purging some installer cruft that snuck in. None of it required another evening pulled out of the schedule, because the machine was never broken to begin with.

`calavera`'s third job in its life as an old dock-mounted tablet, and the smoothest changeover yet.
