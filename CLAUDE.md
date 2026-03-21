# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hblake — a minimal static blog platform. Posts are markdown files in the `posts/` directory. Web Components + TypeScript frontend built with Vite, deployed as a static site.

**Philosophy**: This project prioritizes minimalism and zero runtime dependencies (aside from `marked` for markdown). Prefer vanilla browser APIs and Web Components over frameworks or libraries. Do not introduce new dependencies without explicit approval.

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

**Stack**: Web Components, Vite 7, TypeScript (strict), static CSS, Playwright

**Path alias**: `@/` maps to `./src/` — always use this instead of relative imports.

**Blog data flow**:
- Markdown posts live in `posts/` with YAML frontmatter (title, date, description, optional image)
- `src/lib/posts.ts` loads all posts at build time via `import.meta.glob`, parses frontmatter, and exports `getAllPosts()` and `getPostBySlug(slug)`
- Posts are sorted by date descending
- Markdown is rendered to HTML using `marked`

**Routing**: Client-side routing in `<hb-app>` (`src/web/hb-app.ts`):
- `/` → `<hb-feed>` (list of all posts)
- `/posts/:slug` → `<hb-blog-post>` (single post)
- Uses `history.pushState()` with `popstate` listener and `<a>` click interception

**Web components** (`src/web/`):
- `hb-app` — root component, owns layout shell and client-side routing
- `hb-header` — site header with nav
- `hb-feed` — renders list of post cards
- `hb-card` — individual post card
- `hb-blog-post` — renders a single post from markdown
- `register.ts` — registers all custom elements

**Entry point**: `src/main.ts` imports CSS and `register.ts`. `index.html` contains `<hb-app>`.

**Adding a post**: Create a new `.md` file in `posts/` with frontmatter. The filename becomes the URL slug.

**Deployment**: Pushes to `main` trigger a GitHub Action that builds, tests, then deploys the `dist/` to the `space-needle` runner via Docker.

**CI**: PRs to `main` trigger lint, build, and e2e tests on GitHub-hosted runners.

**E2E tests**: Playwright tests in `e2e/` with custom fixtures in `e2e/fixtures.ts`.

## TypeScript

- Strict mode enabled, no unused locals/parameters allowed
- Separate tsconfig files: `tsconfig.app.json` (app code), `tsconfig.node.json` (build tools), `tsconfig.e2e.json` (tests)

## Conventions

- File naming: kebab-case for files, PascalCase for class exports
- Web components prefixed with `hb-`
- e2e/ directory is excluded from ESLint
