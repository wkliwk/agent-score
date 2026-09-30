# AgentScore

Scoring and discovery platform for Claude Code power users — answers "how optimized is your Claude Code setup?"

## What it does

Run a CLI export against your `~/.claude/` directory (agents, MCP servers, hooks, commands, memory structure, workflows), get a score across 6 dimensions, and publish a shareable public profile — a way to benchmark your setup against the community and discover how others build.

```bash
npx agentscore export
```

The CLI scans locally, shows a score preview and the manifest JSON before asking for confirmation, then submits to your public profile via GitHub OAuth. `--save` writes the manifest locally without submitting; `--auto` skips prompts for scripted use.

## Stack

Next.js, Drizzle ORM, Vitest, deployed on Vercel. CLI is a standalone Node package under `cli/`.

## Status

Active development — see `PRODUCT.md` for the full feature spec and acceptance criteria.
