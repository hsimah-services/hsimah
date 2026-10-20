---
title: Reduce, Reuse, Recycle: An Approach to Agentic Development
date: 2026-10-19
description: Old thoughts on new paradigms - managing software engineering costs in an agentic world
---

# Reduce, Reuse, Recycle: An Approach to Agentic Development

## Opening / hook

- First software job: product was ~2.1M LOC, maintained by dozens of engineers, testers/QA, architects, analysts and managers.
- It was big, necessarily so. No one person could understand it all. Changes were a nightmare.
- AI makes code cheap. Give an agent a problem and it'll produce a solution. Sometimes good, sometimes terrible, usually "works well enough" to move on.
- That reminds me of the behemoth codebase.
- Producing code is only one part of the cost. Someone has to read it, understand it, maintain it, fix it and eventually replace it.
- I can't estimate the aggregate cost of all the new code, but poorly written software is taxing to maintain.
- Thesis: treat software development more like waste management. Reduce, reuse, recycle.

## Reduce: do we need to write this at all?

- The first question an agent should ask is whether we need to solve this, not how.
  - Does the code need to exist?
  - Does it already exist?
  - Is there a simpler way?
  - Is it a real problem, or an excuse to build?
- Not revolutionary. Good engineers have always asked this.
- The economics changed:
  - When code was expensive, there was a natural incentive to avoid unnecessary work.
  - When an agent generates an implementation in seconds, that incentive disappears.
  - We can afford to write code we shouldn't, so we do.
- The fix isn't to stop using agents. Use them to get better at deciding what not to build.

## AI slop is the software equivalent of single-use plastic

- Single-use plastic is cheap, convenient and sometimes the right tool.
- The trouble is forgetting that the product outlives its use:
  - Production cost is obvious. Cleanup cost is hard to calculate.
  - The consequences land on people who had no part in the decision.
- Software example:
  - An agent solves a problem, the PR merges, everyone moves on.
  - A year later someone has to change it. The context is gone.
  - It's coupled to one use case, the assumptions are undocumented, and there are three other near-identical implementations.
  - Nobody remembers why. Nobody wants to touch it. Someone asks an agent to rewrite it, and the cycle repeats.
- Caveat: the analogy isn't perfect. Software doesn't pile up in a landfill, and not all generated code is waste. But maintenance has a long tail that's easy to ignore when the initial build is cheap.
- Takeaway: think about what happens after the code works.

## Reuse: build things worth reusing

- Capture solutions in forms that can be used again, instead of re-solving the same problem.
- Examples: [Elephentity](https://github.com/hsimah/elephentity) and [tsquid](https://github.com/hsimah/tsquid).
  - They solve problems I've hit in a repeatable way, for future projects.
- The valuable part is the accumulated knowledge about a class of problem, not the code itself.
- Each from-scratch implementation forces decisions: pattern, error handling, structure, which edge cases matter.
  - Some are trivial, some aren't.
  - Even good decisions are wasted if the agent has to rediscover them every time.
- I'd rather give agents examples of how I've solved these before.
  - My solutions aren't perfect, but a known starting point beats a blank page.

## Recycle: a smorgasbord for agents

- Idea: a freely available collection of reusable source code for agents to draw from.
- Grows in layers:
  - **Snippets** solve small, focused problems.
  - **Modules** combine snippets.
  - **Frameworks** combine modules into larger patterns.
- These often shouldn't be conventional packages.
- Worked example:
  - An agent on a WordPress project needs to work with a particular post object in PHP.
  - It searches a versioned repo of examples, finds the Elephentity implementation, and uses it as a starting point.
  - It copies the code into the project and adapts it.
- Key distinction: the source repo provides the example, and the consuming project owns its implementation.
  - It is not another set of packages to install, update and keep compatible.
  - It is source material that agents use to produce better local implementations.
- The repo evolves. Agents can consult newer versions and pick what suits the task.
- Why "recycle": we recover useful knowledge from existing implementations, separate the general solution from the specifics of the original use case, and pass it on.
- Improvements get contributed back to the commons.

## Overengineering, underengineering, and other ways to get this wrong

- When does reuse become overengineering?
  - An abstraction more complicated than the original problem.
- When does keeping things simple become underengineering?
- I don't have definitive answers.
- This is bleeding-edge territory and the long-term costs haven't had time to show. Possible failures:
  - Maintaining the collection costs more than it's worth.
  - Agents struggle to pick the right example.
  - Agents blindly copy code that doesn't fit.
- The aim isn't the world's most comprehensive pattern catalogue. It's to experiment with whether shared examples reduce unnecessary work and improve generated code.
- I'd rather build it and find out than argue in the abstract.

## Who watches over the source?

- This is the trickiest part. Currently it's me and my agents.
- The repo could be compromised, and I can't guarantee every snippet is free of vulnerabilities.
- Having an agent review code doesn't make it safe.
- But we already make trust assumptions:
  - Example: left-pad, the tiny package whose unpublishing from npm caused major disruption. How much of it, or of any of your dependencies, have you inspected?
  - You rely on reputation, community scrutiny, version control, automated checks and implicit trust.
  - That trust isn't always justified. Compromised packages, malicious maintainers and long-unnoticed vulnerabilities all exist.
- My repo faces the same general category of risk, though the attack surface differs.
- Mitigations:
  - Review contributions.
  - Run automated security checks.
  - Keep a clear change history.
  - Make the source easy to inspect.
  - Have agents treat retrieved code as untrusted until assessed for the intended use.
- None of it guarantees safety.
- Goal: make useful code easier to discover and reuse, without pretending reuse removes the responsibility to understand what you're using.

## Publish everything for free

- Principle: publish the work freely.
- If I've solved a problem, why shouldn't someone else skip the repeat work?
- The value isn't getting everyone to depend on my code. It's making the knowledge available so the next person builds something better.
- An agent can modify a snippet beyond recognition and never look at the original again. That's the point.
- Source material is a starting point, not a contract.
- Anyone can contribute improvements or fix wrong examples, so the collection becomes a shared resource that reduces redundant code.
- "At least, that's the theory. We'll see how it works in practice."

## The point isn't to write less code at any cost

- Not minimalism for its own sake.
  - Sometimes the right solution is complicated.
  - Sometimes new code is needed.
  - Sometimes an abstraction is the wrong fit and starting fresh is sensible.
- Reduce/reuse/recycle isn't a rule that every line must pass an optimisation process before it can exist.
- It's a reminder that code has a life beyond its initial implementation.
- Don't confuse the ability to generate code with a reason to generate it.
- What I want to see: agents spending less time reinventing, more time building on existing knowledge, and more time contributing improvements back.

## Closing

- Reduce the unnecessary work. Reuse what we've learned. Recycle the solutions that deserve another life.
- Publish the results so the next person doesn't start from scratch.
- Final line: if machines write more of our software, the least we can do is teach them not to throw everything away afterwards.
