# hblake

A minimal static blog built with Web Components, TypeScript, and Vite. Posts are markdown files in the `posts/` directory — the filename becomes the URL slug.

## Getting Started

```bash
npm install
npm run dev
```

## Adding a Post

Create a `.md` file in `posts/` with YAML frontmatter:

```markdown
---
title: My Post Title
date: 2026-03-16
description: A short summary
---

Your markdown content here.
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright e2e tests |

## Stack

- [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_Components) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Playwright](https://playwright.dev/) for e2e tests
- [marked](https://marked.js.org/) for markdown rendering

## License

[MIT](LICENSE)
