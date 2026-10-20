---
title: Reduce, Reuse, Recycle: An Approach to Agentic Development
date: 2026-10-19
description: Old thoughts on new paradigms - managing software engineering costs in an agentic world
---

# Reduce, Reuse, Recycle: An Approach to Agentic Development

At my fist software engineering job our total product was around 2.1 million LOC. It was maintained by a staff of dozens of engineers, testers and QA, architects, analysts and managers. It was big, and necessarily so. The drawback was no one person could understand the entire system. It was too complex and a nightmare to make changes in.

AI has made producing code remarkably cheap. Give an agent a problem, and it'll happily produce a solution. Sometimes it's good. Sometimes it's terrible. Usually it works well enough to convince you to move on to the next thing. It reminds me of that behemoth codebase I first started working with.

The problem is that producing code is only one part of the cost of software.

Someone has to read it, understand it, maintain it, fix it when it breaks, and eventually replace it. And while I can't begin to estimate the aggregate cost of all this newly generated code, I can tell you from experience that poorly written software is taxing to maintain.

I think we need to start treating software development a little more like waste management.

Specifically, we should reduce, reuse, and recycle.

## Reduce: Do we need to write this at all?

The first question I want an agent to ask isn't how to solve a problem. It's whether we need to solve it in the first place.

Do we need to write code? Does this functionality already exist? Is there a simpler way to achieve the same result? Are we solving an actual problem, or have we just found an excuse to build something?

This is hardly a revolutionary concept. Good engineers have been asking these questions for decades.

But the economics have changed.

When writing code was expensive, there was a natural incentive to avoid unnecessary work. When an agent can generate an entire implementation in seconds, that incentive starts to disappear. We can afford to produce code that we probably shouldn't have written.

And so we do.

I don't think the solution is to stop using agents. Quite the opposite. I think we should use them to become better at deciding what not to build.

## AI slop is the software equivalent of single-use plastic

Single-use plastic is cheap, convenient, and often perfectly suited to its immediate purpose. In some applications, it serves a legitimate function that reusable alternatives struggle to match.

The trouble starts when we forget that the product has a life beyond the moment we use it.

The cost of producing the item is obvious. The total cost of dealing with it afterwards is much harder to calculate. The waste persists long after the original use case has been forgotten, and the consequences are inherited by people who had nothing to do with the original decision.

I see a similar pattern emerging with AI-generated software.

An agent is asked to solve a problem. It writes a solution that works. The task is complete, the pull request is merged, and everyone moves on.

A year later, someone else has to change that code. The original context is gone. The implementation is tightly coupled to a specific use case, the assumptions aren't documented, and there are three other implementations of roughly the same thing elsewhere in the codebase.

Nobody remembers why it was written that way. Nobody wants to touch it. Eventually, someone asks an agent to rewrite it.

And the cycle begins again.

The analogy isn't perfect. Software doesn't accumulate in a landfill, and not all generated code is waste. But software has a long tail of maintenance costs that is remarkably easy to ignore when the initial implementation is cheap.

We need to think about what happens after the code works.

## Reuse: Build things worth reusing

The second R is reuse.

Rather than solving the same problem repeatedly, we should capture solutions in forms that can be used again.

This is why I've built [Elephentity](https://github.com/hsimah/elephentity) and [tsquid](https://github.com/hsimah/tsquid). They're attempts to take problems I've encountered, solve them in a repeatable way, and make the resulting functionality available for future projects.

The important bit isn't necessarily the code itself. It's the accumulated knowledge about how to solve a particular class of problem.

Every time an agent implements something from scratch, it has to make decisions. Which pattern should it use? How should it handle errors? How should it structure the implementation? Which edge cases matter?

Some of those decisions are trivial. Others are not. And even when the agent makes good decisions, there's little value in making it rediscover them every time.

I'd rather give it a collection of examples that demonstrate how I've solved these problems before.

Not because my solutions are perfect, but because a known starting point is often better than a blank page.

## Recycle: A smorgasbord for agents

Here's where things get a little more interesting.

I want agents to have access to a freely available collection of reusable source code. Think of it as a smorgasbord of examples, patterns, and implementations that an agent can draw from when solving a problem.

The collection can grow in layers:

- **Snippets** solve small, focused problems.
- **Modules** combine snippets into more substantial functionality.
- **Frameworks** combine modules into larger, reusable patterns.

These don't necessarily need to be conventional software packages. In fact, I'd argue that they often shouldn't be.

Imagine an agent working on a WordPress project. It needs to work with a particular kind of post object in PHP. Rather than inventing an implementation, it searches a versioned repository of examples, finds an appropriate implementation from Elephentity, and uses it as a starting point.

The agent copies the relevant code into the project and modifies it to suit the actual requirements.

The source repository provides the example. The consuming project owns its implementation.

This is an important distinction. I'm not proposing another collection of packages that everyone must install, keep updated, and maintain compatibility with. I'm proposing a collection of source material that agents can use to produce better local implementations.

The repository evolves over time. An agent can consult newer versions, discover improved patterns, and choose the examples that make sense for its current task.

This is recycling in the sense that we're recovering useful knowledge from existing implementations and making it useful in other contexts.

We don't have to write everything from scratch. We can take something that works, separate the general solution from the specifics of its original use case, and make it available for the next person.

And when we improve an implementation, we can contribute that improvement back to the commons.

## Overengineering, underengineering, and other ways to get this wrong

Of course, there's a catch.

When does reuse become overengineering? When does an attempt to generalise a solution produce an abstraction that's more complicated than the original problem? And conversely, when does the desire to keep things simple result in underengineering?

I don't have definitive answers.

This is bleeding-edge territory, and the long-term costs of my approach haven't had time to materialise. Perhaps maintaining a large collection of examples will turn out to be more work than it's worth. Perhaps agents will struggle to identify the right examples, or will blindly copy code that doesn't suit their circumstances.

These are real risks.

The point isn't to build the world's most comprehensive catalogue of software patterns. It's to experiment with whether a shared body of examples can reduce unnecessary work and improve the quality of generated code.

I'd rather find out by building something and using it than spend the next few years arguing about it in the abstract.

## Who watches over the source?

This is probably the trickiest part.

Currently, it's me. Me and my agents.

Could the repository be compromised? Sure. Can I guarantee that every snippet is free from security vulnerabilities? Absolutely not.

I'm not going to pretend that putting code in a repository and asking an agent to review it makes that code safe.

But I also think we need to be honest about the trust assumptions we already make.

Take left-pad, the tiny JavaScript package that famously caused a significant disruption when it was unpublished from npm. How much of its implementation have you personally inspected? Do you know everything inside every dependency in your project?

Probably not. You're relying on some combination of reputation, community scrutiny, version control, automated checks, and implicit trust.

That doesn't mean the trust is always justified. The open-source ecosystem has plenty of examples of compromised packages, malicious maintainers, and vulnerabilities that went unnoticed for years.

My repository faces the same general category of risks, even if its exact attack surface differs.

There are things we can do to improve matters: review contributions, run automated security checks, keep a clear history of changes, and make it easy to inspect the source. We can also make sure agents treat retrieved code as untrusted until it has been assessed for the intended use.

None of this guarantees safety.

The goal is to make useful code easier to discover and reuse without pretending that reuse removes the responsibility to understand what we're using.

## Publish everything for free

There's one more principle that ties this together: I want to publish the work freely.

If I've spent time solving a problem, and that solution can help someone else avoid repeating the same work, why shouldn't they have it?

The value isn't in making everyone depend on my code. It's in making the knowledge available so that the next person can build something better.

An agent can take a snippet, modify it beyond recognition, and never need to consult the original again. That's fine. In fact, that's the point.

The source material is a starting point, not a contract.

If somebody improves a pattern, they can contribute the improvement. If someone discovers that an example is wrong, they can fix it. Over time, the collection becomes a shared resource that helps everyone produce less redundant code.

At least, that's the theory. We'll see how it works in practice.

## The point isn't to write less code at any cost

I'm not advocating for minimalism for its own sake. Sometimes the right solution is complicated. Sometimes we need to write entirely new code. Sometimes an existing abstraction is the wrong fit, and starting fresh is the sensible thing to do.

Reduce, reuse, recycle isn't a rule that says every line of code must be squeezed through an optimisation process before it can exist.

It's a reminder that code has a life beyond its initial implementation.

Agentic development has made it extraordinarily easy to produce software. We should use that capability to our advantage, but we shouldn't confuse the ability to generate code with a reason to generate it.

I'd like to see agents spend less time reinventing solutions, more time building on existing knowledge, and more time contributing useful improvements back to the community.

Reduce the unnecessary work. Reuse what we've already learned. Recycle the solutions that deserve another life.

And publish the results so the next person doesn't have to start from scratch.

If we're going to let machines write a lot more of our software, the least we can do is teach them not to throw everything away afterwards.
