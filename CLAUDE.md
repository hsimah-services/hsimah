# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hblake — a minimal static blog platform built on [markr](https://github.com/hsimah-services/markr). Posts are markdown files in the `posts/` directory. The site is a thin config-only consumer of markr, which provides the prerender CLI, post parsing, theming, and base CSS.

**Philosophy**: This project prioritizes minimalism. All rendering, routing, and component logic lives in the markr package. hblake only provides configuration (theme, fonts, colors) and content (markdown posts).

## Commands

```bash
npm run build            # Generate static HTML into dist/ (markr-prerender)
npm run preview          # Preview static output locally (markr-serve)
```

## Architecture

**Stack**: markr (static prerender CLI)

**Configuration**: `markr.config.ts` defines the site title, fonts, and color theme. `markr-prerender` reads this config and generates one static HTML file per route into `dist/`.

**Blog data flow**:
- Markdown posts live in `posts/` with YAML frontmatter (title, date, description, optional image)
- markr reads all posts at build time, parses frontmatter, and renders markdown to static HTML
- Posts are sorted by date descending

**Routing**: One HTML file per route — `/` (feed), `/posts/:slug` (single post), and any pages under `pages/`.

**Adding a post**: Create a new `.md` file in `posts/` with frontmatter. The filename becomes the URL slug.

**Deployment**: Pushes to `main` trigger a GitHub Action that builds `dist/` and publishes it as a GitHub release. [The Loft](https://github.com/hsimah/the-loft)'s Pawst service deploys the latest release to `hsimah.com` on `viking`.

**CI**: PRs to `main` trigger a build on GitHub-hosted runners.

## Conventions

- File naming: kebab-case for files
