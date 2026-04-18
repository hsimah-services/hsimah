# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hblake — a minimal static blog built on [markr](https://github.com/hsimah-services/markr). Posts are markdown files in the `posts/` directory. The site is a config-only consumer of markr, which handles the entire build: parsing markdown, rendering HTML, applying theming, and generating the static `dist/`.

**Philosophy**: This project prioritizes minimalism. All rendering, routing, and component logic lives in the markr package. hblake only provides configuration (theme, fonts, colors) and content (markdown posts).

## Commands

```bash
npm run prerender        # Generate static HTML into dist/
```

There is no dev server, build toolchain, linter, or test suite in this repo — all of that lives in markr.

## Architecture

**Stack**: markr (handles everything), markdown files

**Configuration**: `markr.config.ts` defines the site title, fonts, and color theme. markr reads this config and generates the full static site.

**Blog data flow**:
- Markdown posts live in `posts/` with YAML frontmatter (title, date, description, optional image)
- Pages live in `pages/` (e.g. `about.md`)
- markr parses all content at prerender time and outputs static HTML to `dist/`
- Posts are sorted by date descending

**Adding a post**: Create a new `.md` file in `posts/` with frontmatter. The filename becomes the URL slug.

**Deployment**: Pushes to `main` trigger a GitHub Action that runs `npm run prerender`, uploads `dist/`, then deploys to the `space-needle` runner via Docker.

## Conventions

- File naming: kebab-case for markdown files
