---
title: [pupyrus] WordPress With Redis and WPGraphQL
date: 2026-04-06
description: Running WordPress in Docker with MariaDB, Redis object caching, WPGraphQL for headless access, and automated setup via WP-CLI
---

# Pupyrus: WordPress With Redis and WPGraphQL

Pupyrus is the WordPress installation for [The Loft](https://github.com/hsimah-services/the-loft). It runs as a four-container stack: WordPress, MariaDB, Redis for object caching, and a WP-CLI container for automated setup. The name is "puppy" + "papyrus" - a writing surface with a dog pun.

WordPress might seem like an odd choice for a homelab blog when static site generators exist (and we use one for [hsimah.com](/posts/pawst)). But Pupyrus isn't just a blog - it's a headless CMS that exposes content via GraphQL, which other projects in the fleet can consume. Members of the household know the WordPress platform well and have previously built plugins we want to reuse. I was also an early contributor to the [WPGraphQL](https://github.com/wp-graphql/wp-graphql) ecosystem, having built plugins like [wp-graphql-metabox](https://github.com/hsimah-services/wp-graphql-metabox), so the GraphQL integration is a natural fit.

## Architecture

```yaml
services:
  db:
    image: mariadb:12.2
    volumes:
      - /opt/pupyrus/db:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  wordpress:
    image: wordpress:latest
    environment:
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_REDIS_HOST', 'redis');
        define('WP_REDIS_PORT', 6379);
        define('WP_CACHE', true);
        define('GRAPHQL_JWT_AUTH_SECRET_KEY', '${GRAPHQL_JWT_AUTH_SECRET_KEY}');
    volumes:
      - /opt/pupyrus/html:/var/www/html
    ports:
      - "8081:80"
    networks:
      - default
      - loft-proxy
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  cli:
    image: wordpress:cli
    profiles:
      - cli
```

The health checks are important here. WordPress won't start until MariaDB confirms InnoDB is initialized and Redis responds to pings. This prevents the common Docker Compose race condition where WordPress starts before the database is ready and throws connection errors.

## MariaDB Over MySQL

```yaml
db:
    image: mariadb:12.2
    stop_grace_period: 60s
```

MariaDB 12.2 instead of MySQL. The reasons:

- **Drop-in compatible**: WordPress doesn't care which one you use. The connection string is the same.
- **Better defaults**: MariaDB's default configuration is more conservative with memory and more aggressive with performance tuning out of the box.
- **Licensing**: MariaDB is fully open-source under GPLv2. MySQL is dual-licensed by Oracle, which makes some self-hosters uncomfortable.
- **InnoDB improvements**: MariaDB has made independent improvements to InnoDB that benefit small-to-medium workloads.

The `stop_grace_period: 60s` gives MariaDB a full minute to flush dirty pages and shut down cleanly before Docker kills it. The default 10 seconds can cause corruption on a busy database.

### Log Rotation

MariaDB gets a higher log retention than other services (10MB/5 files = 50MB) because query logs can spike during WordPress plugin updates or migration operations. The extra retention helps with debugging without eating too much disk.

## Redis Object Cache

```yaml
redis:
    image: redis:7-alpine
```

WordPress generates a lot of database queries on every page load - options, transients, user sessions, menu structures. The Redis Object Cache plugin stores these in memory, so subsequent requests skip the database entirely.

The WordPress container configures Redis via `WORDPRESS_CONFIG_EXTRA`:

```php
define('WP_REDIS_HOST', 'redis');
define('WP_REDIS_PORT', 6379);
define('WP_CACHE', true);
```

After deploying, you still need to install and activate the [Redis Object Cache plugin](https://wordpress.org/plugins/redis-cache/) in wp-admin. The `WP_CACHE` constant tells WordPress to use an object cache if one is available, and the plugin provides the Redis drop-in.

### Why Redis Over Memcached

Both work for WordPress object caching. Redis has two advantages:

1. **Persistence**: Redis can optionally persist cached data to disk. If the container restarts, the cache is warm immediately instead of rebuilding from database queries. For a homelab with one user, this barely matters, but it's nice.
2. **Data structures**: Redis supports sorted sets, lists, and hashes natively. Some WordPress plugins take advantage of these for more efficient caching.

The trade-off: Redis uses slightly more memory than Memcached for the same dataset. On a server with 64GB of RAM, this is irrelevant.

## WPGraphQL

The `GRAPHQL_JWT_AUTH_SECRET_KEY` in the config points to [WPGraphQL](https://www.wpgraphql.com/) with JWT authentication. WPGraphQL exposes WordPress content (posts, pages, custom post types, menus) as a GraphQL API. JWT auth allows authenticated queries from external clients.

This turns WordPress into a headless CMS. The content is managed through wp-admin (familiar UI, plugin ecosystem, media library), but the front-end can be anything - a React app, a static site generator, or another service in the fleet.

### Why WPGraphQL Over the REST API

WordPress has a built-in REST API. WPGraphQL has a few advantages:

- **Query exactly what you need**: GraphQL lets the client specify which fields to return. The REST API returns everything, which is wasteful for simple queries like "give me the title and excerpt of the last 10 posts."
- **Single request for related data**: Fetch a post with its author, categories, and featured image in one query instead of multiple REST endpoints.
- **Schema introspection**: The GraphQL schema is self-documenting. Tools like GraphiQL let you explore the API interactively.

The trade-off: GraphQL is more complex than REST for simple use cases. If all you need is a list of posts, the REST API is simpler. But for structured data with relationships, GraphQL is worth the setup.

## Automated Setup With WP-CLI

The `cli` container uses a Docker Compose profile so it only runs when explicitly invoked:

```yaml
cli:
    image: wordpress:cli
    profiles:
      - cli
```

The service-level `setup.sh` uses this container to automate WordPress installation:

```bash
if docker compose ${compose_args} --profile cli run --rm cli \
    wp core is-installed 2>/dev/null; then
  info "WordPress already installed"
else
  docker compose ${compose_args} --profile cli run --rm cli \
    wp core install \
      --url="http://localhost" \
      --title="Pupyrus" \
      --admin_user="adminhabl" \
      --admin_password="${WORDPRESS_ADMIN_PASSWORD}" \
      --admin_email="${WORDPRESS_ADMIN_EMAIL}"
fi
```

This runs during `setup.sh` on a fresh deployment. It checks if WordPress is already installed (idempotent), and if not, runs the five-minute install non-interactively. The admin credentials come from `.env`.

The `--rm` flag ensures the CLI container is removed after each run. It doesn't need to stay running - it's a one-shot tool.

## Networking

WordPress joins two Docker networks:

```yaml
networks:
  - default    # Internal: talks to MariaDB and Redis
  - loft-proxy # External: reachable by Caddy
```

The `default` network connects WordPress to its database and cache. The `loft-proxy` network makes it reachable by [Mushr's](/posts/mushr) Caddy reverse proxy, which serves it at `pupyrus.loft.hsimah.com` (HTTPS) and `pupyrus.space-needle` (HTTP).

Port 8081 is also exposed for direct access (`space-needle:8081`), which is useful for debugging when you want to bypass the reverse proxy.

## Data Persistence

Two directories on the host:

| Path | Contents |
|------|----------|
| `/opt/pupyrus/db` | MariaDB data files |
| `/opt/pupyrus/html` | WordPress files (themes, plugins, uploads) |

Both are owned by `littledog:pack-member` (the fleet's service account). Because these are bind mounts rather than Docker volumes, they're easy to back up with standard filesystem tools - `rsync`, `tar`, or whatever your backup strategy uses.

## Trade-Offs

- **WordPress is heavy**: PHP, a database, a cache server - it's a lot of moving parts compared to a static site. For a headless CMS that other services query, the complexity is justified. For a simple blog, it wouldn't be.
- **Plugin ecosystem is a double-edged sword**: Plugins make WordPress incredibly flexible but also introduce security surface area. Every plugin is code running on your server. We keep the plugin count minimal.
- **Updates require attention**: WordPress core, plugins, and themes need regular updates. Unlike static sites that have no runtime dependencies, a WordPress site that doesn't get updated becomes a security liability.
- **MariaDB backups**: The database needs proper backup procedures. A corrupt database without a backup means losing all content. We should be doing automated `mysqldump` exports - this is a gap in the current setup.

## Future Work

- **Automated database backups** via a cron job running `mysqldump` inside the MariaDB container, writing to a backup directory.
- **WordPress plugin management via WP-CLI** to automate plugin installs and updates as part of the deploy pipeline.
- **Move to SQLite** via the [WP-SQLite](https://github.com/WordPress/sqlite-database-integration) plugin to eliminate the MariaDB dependency entirely. This is experimental but would dramatically simplify the stack.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/pupyrus/`.
