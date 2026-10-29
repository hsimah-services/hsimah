---
title: Owning a Bluetooth Speaker With a Raspberry Pi and Snapcast
date: 2026-10-29
description: Turning a Raspberry Pi 3 B+ into a dedicated Bluetooth source for a light-with-speaker, and syncing it with the rest of the howlr whole-home audio setup
---
The master bedroom has a light with a built-in speaker (an NH-69). I wanted it in the [howlr](/posts/howlr) fleet, so I gave it a dedicated Bluetooth source: `fjord`, a Raspberry Pi 3 B+ running a Snapcast client that plays through the speaker over A2DP.

It's within earshot of the upstairs Surface client, [`woodstock`](/posts/woodstock-calaveras-older-sibling), so the two have to play in sync. Most of this post is about getting that right, and the handful of things that broke on the way.

## The Audio Path

```
snapclient (Docker) → bluealsa ALSA plugin → system D-Bus → bluealsa daemon (host) → BlueZ → speaker
```

- **A custom snapclient image.** The old `ivdata/snapclient` image has no bluealsa plugin, so the Pi builds its own from Debian trixie: snapclient 0.31 plus `libasound2-plugin-bluez`. The plugin talks to the host's daemon over D-Bus, so the image and the host need the same Debian release.
- **bluealsa as an A2DP source only.** The Pi owns the speaker. It's paired and trusted, and a cron job reconnects it every minute. Phones forget the speaker and play through Music Assistant instead.

## Keeping It in Sync

Snapcast compensates for the delay bluealsa reports, but the speaker's own buffering isn't reported, so I offset it with snapclient's `--latency`.

I tuned it live in Snapweb with a click track, standing equidistant from the two speakers (sound travels about 3 ms per metre, so position matters). **220 ms** lined them up. The Snapweb and `--latency` values add together, so only set one.

The groups are Upstairs (both), Master Bedroom (the Pi only), Sun Room (the Surface only) and All.

## Gotchas

- **`power on` fails with `org.bluez.Error.Failed`.** Raspberry Pi OS soft-blocks Bluetooth. `rfkill unblock bluetooth` fixes it.
- **The light shows up twice.** There's a BLE "G--Light" control entry and the classic-Bluetooth audio side. Only the classic side has `Audio Sink`.
- **Pairing failed while phones were silently auto-reconnecting to the speaker.** Forgetting it on the phones fixed it.
- **Pairing works but `connect` fails** until something registers an A2DP endpoint. BlueZ alone can't connect audio; bluealsa has to be running.
- **Wi-Fi and Bluetooth share one radio on the Pi 3 B+.** Keep Wi-Fi on 5 GHz or A2DP stutters.
- **Music Assistant said "You do not have permission to perform this action".** New players aren't added to existing users' allowed players.

## Open Questions

- Does 220 ms hold across reconnects and long sessions, or does the speaker's clock drift?
- Debian's bluealsa has no AAC (it needs non-free fdk-aac), so the audio is SBC.

The setup is in [the-loft repo](https://github.com/hsimah/the-loft): see the [fjord host page](https://github.com/hsimah/the-loft/blob/main/docs/hosts/fjord.md), and issues [#132](https://github.com/hsimah/the-loft/issues/132) (setup) and [#133](https://github.com/hsimah/the-loft/issues/133) (latency, group IDs).
