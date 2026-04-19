---
title: Making Changes (draft)
date: 2026-04-20
description: A (draft) blog about changes I am making
---

# Making Changes
This year I have taken on some the challenge to spend less time at work and more time investing in my home and personal life. In addition to trying to do a short tai chi routine every morning, I reworked my entire [home lab/network](https://hsimah.com/posts/my-home-lab/) and added [some neat improvements](https://hsimah.com/posts/spinnik/) along the way.

This post is about another ambitious life change - ditching Windows 11 for a full open sourced home set up. I am tired of the bloat and ads in my operating system and want to challenge myself to become a Linux expert.

## Back in the Day
I clearly remember my family crowding around our first computer. It was '91 or '92 and my dad had brought home an Acer desktop. I didn't really grasp what we were doing but it was very exciting when my mum typed `windows` into the DOS prompt and the screen went blue - *not* as a BSOD, but the loading splashscreen for Windows 3.0.

Since then, Windows has been my daily OS for over 35 years. After Windows 3.0, 3.11 and 98 SE I got my own PC running XP. It was then that I started noodling with Linux, but due to gaming, it was only ever a second tier use case. At uni we used Solaris and at home I was running Slackware as a media server. After uni I ended up being a .NET developer, so it was Windows 7, 8, 10 and then eventually 11. When I got the job at Facebook in 2019 I tried to use a MacBook, but the keyboard layout and shortcuts were so foreign and *just wrong*. After 18 months I went back to a Thinkpad.

In the past year I have been doing a lot of home automation and lab experiements, all using Linux. With Microsoft's push to get LLMs into every aspect of the OS, I started considering whether I wanted to put myself in an uncomfortable position and use Linux full time. Eventually the LLMs in Control Panel and the abysmal performance of the Start Menu pushed me to ditch Windows entirely. Two days ago I wiped my laptop and replaced it with a fresh install of CachyOS, an Arch-based distro with a focus on gaming hardware.

So, this is the first in an ongoing series of posts about my journey to being a daily Linux user. I expect to face a bunch of challenges and fully understand this journey will never be over.

## Why CachyOS?
I use Ubuntu and Raspian on my other machines. These are reasonable, easy to use distros. I will likely migrate to something a bit more "nerdy" in time, but I wanted to get things done, not spend ages re-learning Linux administration. I am very happy with my home lab now and will leave it to run for a few months before tackling any upgrades.

I wanted something which was ready to maximise my hardware performance without much effort on my part. That led me to Bazzite and CachyOS. I didn't have strong feelings either way, but my lightweight research pointed towards CachyOS as being a good fit for my laptop model.

## Window Management
Back in the day I cycled through Gnome, KDE and xfce. I loathed KDE - it was so bloated and slow! Gnome was acceptable, but I couldn't remove the Palm Pilot packages - they were load bearing for some reason I can't recall. My Sony Vaio was not a Palm Pilot and it *really* irked me those packages were there. xfce was fine, but lacked any sort of modernity.

When CachyOS was isntalling I was given the option to choose a Window Manager. I went with xfce. I am sure with time and effort I could bring it into line with what I expect from a daily driver, but it felt dated and lacking in polish. It's something I would install on secondary hardware, or something I need to remote into. I wanted a little bit more panache.

I looked for a fun theme for it, and came across WinXP TC. This looked hilariously fun - imagine going back to XP after all these years. I did enjoy using it for a few hours, but as with most OSS clones, it lacked polish too. Firefox, Chromium etc put tabs in the title bar which messed up the XP-ness of it.

And, just before I said I wanted something which worked in the short term. Tinkering can come later. I installed the CachyOS KDE and to be honest, I am happy with it for now. The neat thing with Linux is I can run several Window Managers and flip between them as I see fit.

## Mishaps Happen
So, I diligently backed up my WSL instance (Ubuntu) and all my SSH keys and config files to a Windows folder. I flashed my USB drive with CachyOS and created a backup folder. I changed the BIOS boot order and wiped my hard drive, replacing Windows 11 with CachyOS.

Wait - where was the step where I *copied the backup to the USB drive*? Oh yeah, I didn't do that. I have all my config files checked into a Git repo, but the SSH keys were an annoying loss. Oh well, it's not the end of the world to rekey all my home servers, GitHub et al.

## Not By Halves
Never one to shy away from a challenge I doubled down on this effort this week. My work laptop was well past due for an upgrade. The battery life was non-existent and Windows 11 was sluggish to say the least. I opted for a brand new Thinkpad X1 Carbon with a Fedora image. Yep, not only am I ditching Windows at home but for work too. I am already picking up new skills and [problem solving with Gnome](https://hbla.ke/posts/gnome-chromium-pwa/).

## Conclusion
So, here I am at the start of an exciting learning adventure. I will need to brush up on my Bash skills, Linux architecture and all those other nerdy things. I am quite excited to take this on, I am much better at learning these days and it's been a long time since I got stuck into administering a computer system.
