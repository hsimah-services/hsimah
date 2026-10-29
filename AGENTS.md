# AGENTS.md

Guidance for agents working on hsimah.com: the repo, Hamish's writing, and how posts are co-authored and reviewed.

## The Repo

A minimal static blog built on [markr](https://github.com/hsimah-services/markr). This repo is a thin consumer: `markr.config.ts` sets the title, fonts and colours, and the content is markdown in `posts/` (one file per post, filename = slug) and `pages/` (e.g. About). All rendering, routing and theming lives in markr - keep it that way.

```bash
npm run build     # prerender one static HTML file per route into dist/
npm run preview   # serve dist/ locally
```

- **Routes**: `/` (feed, newest first), `/posts/<slug>`, and one per page in `pages/`.
- **Static files**: `public/` is copied as-is; images go in `public/assets/`.
- **Deploy**: a push to `main` runs `.github/workflows/deploy.yml`, which builds `dist/` and publishes it as a GitHub release. [The Loft](https://github.com/hsimah/the-loft)'s Pawst service pulls the latest release and serves it as `hsimah.com` on `viking`.
- **Review**: adding the `claude-review` label to a PR runs `.github/workflows/post-review.yml` (see [Authoring Workflow](#authoring-workflow)). There is no other PR CI.
- File names are kebab-case.

## Authoring Workflow

Posts are co-authored in four stages. Stay in your lane at each one: the prose is Hamish's to write.

1. **Talk it through.** Hamish describes the subject and what the post should cover. Ask questions, poke at gaps, suggest angles, but don't draft prose. Keep going until Hamish says the scope is right.
2. **Outline.** Organise the conversation into a structured post: `##` section headings with dot points under each. This is the most valuable step - Hamish's first telling tends to ramble, so the job is to find the shape: what order, what's one section vs two, what's the hook, what's the closing line. Keep Hamish's phrasing where it exists, and put good lines from the conversation in quotes so they survive into the draft.
3. **Open a PR.** Commit the outline as the post itself (`posts/<slug>.md`, with frontmatter) on a new branch and open a PR to `main`. The PR *is* the plan: the outline commit is what the review checks the finished post against.
4. **Review loop.** Hamish picks up the PR and writes the prose over the outline. To ask for a review, Hamish adds the `claude-review` label. The `Post Review` workflow (`.github/workflows/post-review.yml`) runs Claude against the PR, leaves inline comments and a summary, and swaps the label for `go` or `no-go`. Repeat until `go`.

### Outline Format

This is the shape `Reduce, Reuse, Recycle` started from:

```markdown
---
title: Post Title
date: YYYY-MM-DD
description: One sentence for the feed card
---

## Opening / hook

- The anecdote or problem that opens the post.
- Thesis: the one-sentence point of the post.

## A Section Heading

- Point.
  - Supporting detail or example.
- "A line Hamish said that should survive verbatim."

## Closing

- Final line: the sentence to end on.
```

- Headings are real working headings, not placeholders - Hamish may keep them.
- One idea per dot point. Nest for examples and evidence.
- If photos are already available, commit them to `public/assets/` and place the real image markdown (with alt text and caption) where it belongs. Otherwise mark the spot: `- [image: before photo]`.
- Note links to other posts that should be cross-referenced.
- Put unresolved questions under a final `## Open questions` section rather than guessing at facts.

### PR Format

- Branch: kebab-case, named after the post (e.g. `balcony-bar-table`).
- Title: `Add post: <post title>`.
- Description: a short summary and any open questions.

The plan the reviewer checks against is the latest outline version of the post in the branch history. If the scope changes on purpose, add a `## Plan` section to the PR description - it overrides the outline, so the review stops asking for what was dropped.

## Hamish's Voice

Notes from reading every post on the blog. Use them to keep outlines in Hamish's register and to judge whether review suggestions fit - **suggest edits in Hamish's voice, never rewrite into a generic one.**

### Tone

- **Casual, a conversation between nerds.** The About page says it directly: "If you're after something more polished, you're in the wrong place." Don't polish the personality out.
- **First person, plain and direct.** "I wanted...", "I picked Caddy for a few reasons". Opinions are stated as opinions, often with a wink: "my opinions (which are always correct!)".
- **Australian.** "G'day", "mum", "uni", "kinda", "Oh well, it's not the end of the world". Spelling is mostly Australian/British (favourite, behaviour, honour, optimisation, maximise), with occasional American slips (behavior, labor). Prefer Australian spelling and keep a post consistent.
- **Self-deprecating, honest about mistakes.** Mistakes get admitted and laughed off: "Wait - where was the step where I *copied the backup to the USB drive*? Oh yeah, I didn't do that." Failures and trade-offs are part of the story, not hidden.
- **Short punchy reactions** after a win: "Slick.", "Very neat.", "nice.", "Even nicer.", "It's so neat seeing the device wake up!"
- **Transparent and grounded about Claude/LLMs.** Posts say when Claude was used and when it deliberately wasn't ("I deliberately avoided Claude for this - I need some level of problem solving in my brain"). The stance: "the LLM does not do my work for me, it helps me do my work." No hype, no "AI slop".

### Sentence-Level Habits

- **Spaced hyphen as a dash**: `word - word`. This is Hamish's natural punctuation; em dashes (`—`) mostly show up in passages an agent wrote. Prefer ` - `.
- **Parenthetical asides** for jokes and context: "(yes, I have four - no, I don't think that's too many)", "(I have not yet debugged this further - Firefox is running just fine.)"
- **Italics for spoken emphasis**: *really tedious*, *just wrong*, *whole thing*, *not*.
- **Bold for the one line that matters**: "**the LLM does not do my work for me, it helps me do my work**". Also bold lead-ins on list items: `- **Cost**: ...`.
- **Rhetorical question, then the answer**: "So why not merge the two?", "Why a volume instead of a bind mount?"
- **Concrete specifics**: times ("I started at 4:34pm", "By 9:07pm"), versions, model numbers, percentages, dollar figures.
- **"So:" or "I had a few ideas:" before a list.**
- Hostnames and commands in backticks: `calavera`, `xset q`.

### Structure by Post Type

**Personal / narrative** (Showing Windows the Door, Calavera's New Role, Coding with Claude):
- Opens with a hook: a memory ("It was '91 or '92 and my dad had brought home an Acer desktop"), a confession, or the problem.
- Tells the story roughly in order, with what went wrong along the way.
- Ends with a short reflective close and often a `## What's Next?` that teases future work or posts ("I will be writing about that a bit more later").

**Opinion / essay** (Deterministic Code for an Agentic World, Reduce, Reuse, Recycle):
- Thesis in the first paragraph. Short declarative sentences: "Much of reliable application engineering is boring. That is a feature. A good feature."
- Playful headings: "y tho?", "This sounds perfect!", "Reuse to reduce", "Claude-clusion".
- A section that argues against the thesis ("It's not."), with honest limitations.
- Ends on a bolded tagline or pun: "**Elephants never forget. Elephentity never forgets how the last entity was written.**"

**Technical deep dive** (the Loft service posts: mushr, howlr, pawst, stellarr...):
- Title `[service] What It Does`. Opens with what it is, its place in The Loft, and the name's pun.
- Config blocks followed by "A few things to call out:" bullet lists.
- `### Why X Over Y` sections with pros/cons and a stated trade-off.
- Closes with `## Trade-Offs`, `## Future Work`, and "The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/<name>/`."

**Quick tip** (Installing Music Assistant on Gnome, Dotfile Sync with `stow`):
- A few paragraphs, no or few headings: the problem, what was tried, the fix, a config snippet, a one-line sign-off ("So yeah - syncing dotfiles via `stow`. Very neat.").

### Recurring Content

- Names things with puns and themes (space/aerospace and spitz dogs for services, things visible from the desk for hosts) and explains the name.
- Cross-links earlier posts liberally with relative links: `[howlr](/posts/howlr)`.
- When a post is superseded, adds an italic note at the top rather than rewriting history: `*Updated October 2026: ... See [Post](/posts/slug).*`
- Recurring cast: The Loft (home lab), the Surface Pros (`calavera`, `woodstock`), the pomskies Laiko and Belki, Seattle, the condo balcony.

## Formatting Conventions

- Filename is the slug, kebab-case: `posts/balcony-bar-table.md`.
- Frontmatter: `title`, `date` (`YYYY-MM-DD`), `description` (one sentence), optional `image` (a hero image rendered above the title). markr's parser is line-based, not YAML: each line splits on its first `:`, so colons and brackets in values are fine, but **don't quote values** - quotes render literally.
- **Don't repeat the title as a `# H1` in the body** - markr already renders `title` as the page heading, so it appears twice. Start the body with prose or a `##`. (Several older posts do this; don't copy them.)
- Sections are `##`, subsections `###`. Title Case for technical posts; playful sentence case is fine in essays.
- Images live in `public/assets/` with descriptive kebab-case names and are referenced as `/assets/<file>`. Every image needs alt text. Nginx serves `/assets/` with a year-long immutable cache, so never overwrite an existing image file - use a new name.
- Captions: an italic line directly under the image.
- Code blocks get a language tag (`yaml`, `bash`, `nginx`, ...).

## Reviewing a Post

This is the rubric the `Post Review` workflow follows. Agents reviewing by hand should use it too.

### What to Look For

1. **Typos and spelling.** Including product and project names (Puslr/Pulsr, distributated, cental).
2. **Grammar.** Comma splices, run-ons that lose the reader, missing or doubled words, tense slips ("would be nice if it has Just Worked").
3. **The plan.** Compare the post to the plan (a `## Plan` in the PR description if there is one, otherwise the latest outline version of the post in the branch history). Anything planned that isn't in the post is an omission - name the plan item.
4. **Leftover scaffolding.** Dot points that are still outline notes rather than prose, `TODO`s, `[image: ...]` markers, `## Open questions`.
5. **Structure and flow.** Does the hook hook? Is there a closing line? Do headings match their sections? Does a section ramble past its point?
6. **Correctness of mechanics.** Frontmatter valid (no quoted values), title not duplicated as `# H1`, image paths exist under `public/assets/`, internal links point at real posts, heading levels consistent, a heading that lost its `##`.
7. **Facts that contradict the rest of the blog**, e.g. a host doing a job another post says it no longer does.

### Blocking vs Suggestion

- **Blocking** (any of these means `no-go`): typos, spelling mistakes, grammatical errors, plan items missing without explanation, leftover scaffolding, broken frontmatter/links/images, duplicate H1, a failed build.
- **Suggestion** (never blocks): style, word choice, structure ideas, extra content, Australian-vs-American spelling consistency, anything that is a matter of taste.

Don't nitpick the voice. Sentence fragments, casual asides, "kinda" and spaced-hyphen dashes are deliberate. Don't re-raise a suggestion that was already replied to or declined in an earlier round.
