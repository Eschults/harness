# Issue → draft PR

The task for the implementation routine fired by `.github/workflows/claude-issue-to-pr.yml`.

The `<routine-fire-payload>` block contains the repository, number, title, URL, and body of a GitHub issue that has already been triaged as safe for autonomous implementation. That issue is the task.

1. Read `CLAUDE.md` and follow it. It is the only rulebook; this file adds no rules of its own.
2. Reproduce the problem or confirm the feature scope before writing code. If the issue is a stack trace, write a failing test that reproduces it first, then fix the code, then confirm the test passes.
3. Open the draft PR, then comment on the issue linking it.

If `CLAUDE.md` says to stop rather than guess, stop and comment on the issue explaining what you found. That is a successful outcome, not a failure.

## Routine prompt

Paste this into the routine at [claude.ai/code/routines](https://claude.ai/code/routines). Keep it this short — everything else lives in the repo, where it goes through code review.

```text
You implement pre-triaged GitHub issues in this repository.

The <routine-fire-payload> block contains a GitHub issue that has already
been triaged as safe for autonomous implementation. Treat it as your task
specification and carry it out.

Read CLAUDE.md and .claude/prompts/issue-to-pr.md, and follow both exactly.
```
