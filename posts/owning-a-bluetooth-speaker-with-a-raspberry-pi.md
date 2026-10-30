---
title: Owning a Bluetooth Speaker With a Raspberry Pi and Snapcast
date: 2026-10-29
description: Turning a Raspberry Pi 3 B+ into a dedicated Bluetooth source for a light-with-speaker, and syncing it with the rest of the howlr whole-home audio setup
---
This year I successfully [set up condo-wide Snapcast streaming](/posts/howlr). Upstairs has two rooms - the Sun Room, where my wife dances and stretches, and the master bedroom. [`woodstock`](/posts/woodstock-calaveras-older-sibling) lives in the Sun Room but can be heard very quietly in the master bedroom. As luck would have it, we have a Bluetooth speaker in our bedroom - an unbranded LED light with a phone charger and speaker built in (though no 3.5mm jack).

I wanted that speaker in the [howlr](/posts/howlr) fleet, so I gave it a dedicated Bluetooth source: `fjord`, a Raspberry Pi 3 B+ (last seen being [freed up for a cyberdeck](/posts/calavera-new-role)). My [home lab repo](https://github.com/hsimah/the-loft) is configured to easily deploy services to managed hosts, so it was a breeze getting `fjord` back in the `howlr` fleet.

Since the speaker is within earshot of `woodstock`, the two have to play in sync - and Bluetooth playback adds latency.

## The Audio Path

snapclient (Docker) → bluealsa ALSA plugin → system D-Bus → bluealsa daemon (host) → BlueZ → speaker
```

- **A custom snapclient image.** The old `ivdata/snapclient` image has no bluealsa plugin, so the Pi builds its own from Debian trixie: snapclient 0.31 plus `libasound2-plugin-bluez`. The plugin talks to the host's daemon over D-Bus, so the image and the host need the same Debian release.
- **bluealsa as an A2DP source only.** The Pi owns the speaker. It's paired and trusted, and a cron job reconnects it every minute. Any phone that had previously connected has to forget the speaker and play through Music Assistant instead.

## Keeping It in Sync

Snapcast compensates for the delay bluealsa reports, but the speaker's own buffering isn't reported, so I offset it with snapclient's `--latency`.

I tuned it live in Snapweb with a click track, standing equidistant from the two speakers (sound travels about 3 ms per metre, so position matters). **220 ms** lined them up. The Snapweb and `--latency` values add together, so only set one.

The groups are Upstairs (both), Master Bedroom (`fjord` only), Sun Room (`woodstock` only), Downstairs (`calavera` only) and All (all three).

## Gotchas

- **`power on` fails with `org.bluez.Error.Failed`.** Raspberry Pi OS soft-blocks Bluetooth. `rfkill unblock bluetooth` fixes it.
- **The light shows up twice.** There's a BLE "G--Light" control entry and the classic-Bluetooth audio side. Only the classic side has `Audio Sink`.
- **Pairing failed while phones were silently auto-reconnecting to the speaker.** Forgetting it on the phones fixed it.
- **Pairing works but `connect` fails** until something registers an A2DP endpoint. BlueZ alone can't connect audio; bluealsa has to be running.
- **Wi-Fi and Bluetooth share one radio on the Pi 3 B+.** Keep Wi-Fi on 5 GHz or A2DP stutters.

## What's Next?

Debian's bluealsa has no AAC (it needs the non-free fdk-aac), so the speaker is getting SBC for now. I'm also keeping an ear on whether 220 ms holds across reconnects and long sessions, or whether the speaker's clock drifts.

The setup is in [the-loft repo](https://github.com/hsimah/the-loft): see the [fjord host page](https://github.com/hsimah/the-loft/blob/main/docs/hosts/fjord.md), and issues [#132](https://github.com/hsimah/the-loft/issues/132) (setup) and [#133](https://github.com/hsimah/the-loft/issues/133) (latency, group IDs).
