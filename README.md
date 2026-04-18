# hblake

A minimal static blog built with [markr](https://github.com/hsimah-services/markr). Posts are markdown files in the `posts/` directory — the filename becomes the URL slug.

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

## Building

```bash
npm install
npm run prerender
```

This generates the full static site into `dist/`.

## License

[MIT](LICENSE)
