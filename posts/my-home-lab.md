# The Loft: My Over-Engineered Homelab

I run a homelab called **The Loft**. It's a handful of machines tucked into a corner of my apartment, quietly running all the services my household depends on - media, music, blogs, a Fediverse instance, and more. The whole thing is managed from [a single Git repo](https://github.com/hsimah-services/the-loft) and deployed with a couple of shell scripts.

This isn't a deep dive into every config file. It's more of a walkthrough - what's running, why, and how it all fits together.

## The Fleet

The Loft runs across three machines:

| Host | Hardware | Role |
|------|----------|------|
| **space-needle** | Minisforum MS-01 (i9) | Primary - runs everything |
| **viking** | Raspberry Pi 3 B+ | Audio client |
| **fjord** | Raspberry Pi 3 B+ | Audio client |

The host names come from things I can physically see from my desk. Space Needle - obvious one, I'm in Seattle. Viking and fjord are from a bottle of Vikingfjord vodka sitting on the bar. I like my infrastructure to have a bit of personality.

## The Services

Every service gets a name pulled from one of two theme pools: **space/aerospace** or **dogs** (specifically spitz breeds - huskies, pomeranians, *pomskies*). The goal is a name that's a bit of wordplay connecting the theme to what the service actually does.

Here's what's running:

| Service | What It Does | The Name |
|---------|-------------|----------|
| **mushr** | Reverse proxy, DNS, and Cloudflare Tunnel | Musher - the person driving a dog sled. It drives all the traffic. |
| **pawpcorn** | Media server (Plex) | Paw + popcorn. What's movie night without snacks? |
| **stellarr** | Radarr, Sonarr, Lidarr, Jackett, Transmission, Soulseek - the full *arr stack behind a VPN | Stellar + *arr. The whole suite follows the *arr naming convention - a stellar collection of stars. |
| **pupyrus** | WordPress site | Puppy + papyrus. A writing surface with a dog pun. |
| **howlr** | Multi-room audio via Music Assistant + Snapcast | Huskies howl. This one streams audio to every room. |
| **pulsr** | GoToSocial + Phanpy - a private Fediverse instance | Pulsar - a spinning neutron star that emits signals. It posts updates. |
| **pawst** | Nginx serving static blogs ([hbla.ke](https://hbla.ke) + [hsimah.com](https://hsimah.com)) | Paw + post. It hosts blog posts. You're probably reading this on it. |
| **iditarod** | GitHub Actions self-hosted runner | The Iditarod is a sled dog race. Runners run. CI runners also run. |

I genuinely enjoy coming up with these. When I add a new service, picking the name is half the fun.

## Sharing Configs Across Hosts

One of the things I'm happiest with is how the repo handles multiple hosts with different hardware. Every service has a base `docker-compose.yml` under `services/<name>/`. If a particular host needs something different - different images, different volume paths, different profiles - it gets an override file at `hosts/<hostname>/overrides/<service>/docker-compose.override.yml`.

A helper function called `compose_args_for()` stitches it all together at runtime. You give it a service name and it returns the right `-f` flags for `docker compose`, automatically layering in any host-specific overrides.

The best example is **howlr**. The Music Assistant server needs decent hardware, so it only runs on space-needle (via the `server` profile). Viking and fjord just run lightweight Snapcast clients (via the `client` profile). Same service definition, same compose file, different profiles set per host. Each host has a `host.conf` that declares which services it runs and what profile to use - it's just a bash-sourceable config file.

The result: `git pull` on any host, run the deploy, and each machine gets exactly the right containers for its role.

## The Control Plane

Day-to-day management runs through [**loft-ctl**](https://github.com/hsimah-services/the-loft), a fleet-aware control script with five commands:

- **`start`** / **`stop`** - spin services up or down
- **`rebuild`** - tears down, pulls fresh images, and brings everything back up
- **`update`** - `git pull` → `rebuild` → `health` in one shot
- **`health`** - checks that containers are running *and* that web UIs are reachable

The health checks are the bit I'm most proud of. They run across three tiers: **local** (hit the port directly), **LAN** (resolve through dnsmasq), and **SSL** (verify the HTTPS cert path through Caddy and Cloudflare). If the container is up but Caddy isn't proxying correctly, the LAN check catches it. If the cert is broken, the SSL check catches it. It's a simple idea but it's caught real issues.

There's also a `setup.sh` provisioner that reads `host.conf` and handles everything from creating directories to setting up storage mounts. SSH into a fresh machine, clone the repo, run setup, and you've got a working node.

## That's The Loft

It's not the most complex homelab out there, but it's mine and I enjoy tinkering with it. The whole thing is open source - feel free to poke around the [repo on GitHub](https://github.com/hsimah-services/the-loft) if you want to see how any of this works under the hood.
