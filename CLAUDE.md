# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hblake — a minimal static blog platform built on [markr](https://github.com/hsimah-services/markr). Posts are markdown files in the `posts/` directory. The site is a thin config-only consumer of markr, which provides the Vite plugin, web components, post parsing, theming, and base CSS.

**Philosophy**: This project prioritizes minimalism. All rendering, routing, and component logic lives in the markr package. hblake only provides configuration (theme, fonts, colors) and content (markdown posts).

## Commands

```bash
npm run dev              # Start dev server (Vite)
npm run build            # TypeScript check + Vite production build
npm run lint             # ESLint (flat config)
npm run preview          # Preview production build
npm run test:e2e         # Playwright e2e tests (Chromium)
npm run test:e2e:ui      # Playwright with interactive UI
npm run test:e2e:headed  # Playwright with visible browser
npx playwright test e2e/feed.spec.ts            # Run a single e2e test file
npx playwright test --grep "test name"          # Run tests matching a pattern
```

## Architecture

**Stack**: markr (Web Components + Vite plugin), TypeScript (strict), Playwright

**Configuration**: `markr.config.ts` defines the site title, fonts, and color theme. The markr Vite plugin reads this config and generates the HTML shell, CSS variables, and entry point.

**Blog data flow**:
- Markdown posts live in `posts/` with YAML frontmatter (title, date, description, optional image)
- markr loads all posts at build time, parses frontmatter, and renders markdown to HTML
- Posts are sorted by date descending

**Routing**: Client-side routing provided by markr's `mr-app` component:
- `/` → `mr-feed` (list of all posts)
- `/posts/:slug` → `mr-blog-post` (single post)

**Adding a post**: Create a new `.md` file in `posts/` with frontmatter. The filename becomes the URL slug.

**Deployment**: Pushes to `main` trigger a GitHub Action that builds, tests, then deploys the `dist/` to the `space-needle` runner via Docker.

**CI**: PRs to `main` trigger lint, build, and e2e tests on GitHub-hosted runners.

**E2E tests**: Playwright tests in `e2e/` with custom fixtures in `e2e/fixtures.ts`.

## TypeScript

- Strict mode enabled, no unused locals/parameters allowed
- Separate tsconfig files: `tsconfig.app.json` (markr config), `tsconfig.node.json` (build tools), `tsconfig.e2e.json` (tests)

## Conventions

- File naming: kebab-case for files
- e2e/ directory is excluded from ESLint
