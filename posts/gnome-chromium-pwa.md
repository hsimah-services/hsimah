---
title: Installing Music Assistant on Gnome
date: 2026-04-19
description: Installing the Music Assistant PWA on my Fedora work laptop
---

This month I upgraded my work laptop to a new Thinkpad X1 Carbon running Fedora. After setting it up with the necessities (VS Code, my dotfiles etc) I wanted to install the Music Assistant PWA. I use [Music Assistant](/posts/howlr/) to manage the distributated sound system at home.

It was easy enough to open Music Assistant from [Ungoogled Chromium](https://github.com/ungoogled-software/ungoogled-chromium) as a PWA. But there were a few issues with the runtime experience:
1. The dash icon was missing, using the Gnome fallback
1. Whenever MA was open it would appear as a Chromium window in the dash

After a little bit of Stack Exchange searching (I deliberately avoided Claude for this - I need some level of problem solving in my brain) I came across the answer - it was an issue in the PWA configuration, a `.desktop` manifest file.

First I used Looking Glass to identify the WM class for Music Assistant by running `lg` (press `alt+F2`) and searching for the entry in the window. These Chromium PWAs get a long random string as the name, but since I don't have many it was easy to `cat` the content until I came across one containing Music Assistant.

I then navigated to `/home/hblake/.local/share/applications` and opened the `.desktop` file for MA's PWA. I updated `StartupWMClass` and added `WM_CLASS` with the value of the App ID (`chrome-[my app id]-Default`). After restarting the PWA, I got a new icon in the dash and the app was no longer reusing the Chromium one - nice.

The icon was still wrong, though. Looking in `/home/hblake/.local/share/icons/hicolor/32x32/apps` I could see there *was* a MA icon (named after the App ID). In my config file the `Icon` value was just the App ID. I updated this to be a full path to the actual PNG icon file. Restarting the PWA got me the MA icon in the dash (I have a 32px icon size set). Even nicer.

Here is my config file for MA:

```
#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=Music Assistant
Exec=flatpak 'run' '--command=/app/bin/chromium' 'io.github.ungoogled_software.ungoogled_chromium' '--profile-directory=Default' '--app-id=[my app id]'
Icon=/home/hblake/.local/share/icons/hicolor/32x32/apps/chrome-[my app id]-Default.png
StartupWMClass=chrome-[my app id]-Default
X-Flatpak-Part-Of=io.github.ungoogled_software.ungoogled_chromium
TryExec=/var/lib/flatpak/exports/bin/io.github.ungoogled_software.ungoogled_chromium
WM_CLASS=chrome-[my app id]-Default
```

All in all, nice and easy. It would be nice if it has Just Worked, and maybe it would have if I used Chrome or Edge, but I am working to move away from those browsers and I am happy with a few manual steps as a trade off.
