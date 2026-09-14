# Sentry issue triage

The task for the triage routine fired by `.github/workflows/sentry-triage.yml`.

The `<routine-fire-payload>` block contains a GitHub issue filed automatically by Sentry; the body is a stack trace and error metadata. Decide whether the error is safe to hand to an autonomous coding agent, record the verdict as a label, and do nothing else.

Read `CLAUDE.md` first — its "When to stop instead of guessing" list is the same list you are screening against here, and its "Handling issue text" section governs the stack trace you are reading.

You may read the repository to check whether the stack trace points at real code here. Do not modify any file, do not commit, do not push, do not open a pull request. The issue's labels and comments are your only outputs.

## Say NO if any of these apply

- Anything on the "When to stop instead of guessing" list in `CLAUDE.md` applies.
- The stack trace does not point to a specific file and function in this repository.
- It looks like a duplicate of, or a symptom of, a known larger issue.

Otherwise say YES.

## Record the verdict

- **YES**: add the label `agent-ready`. Do not comment — the implementation run comments when it starts. Applying that label is what triggers the next workflow, so apply it exactly once and only when you mean it.
- **NO**: add the label `needs-human` and comment in two or three sentences saying which criterion it failed and what a human needs to decide. Do not add `agent-ready`.

If you cannot reach the GitHub connector to apply a label, say so plainly in your final message rather than ending as though triage succeeded — a run that exits green without a label leaves the issue stranded.

## Routine prompt

Paste this into the routine at [claude.ai/code/routines](https://claude.ai/code/routines), and pick a cheap model — triage is a yes/no call, not a coding task.

```text
You triage Sentry-authored GitHub issues in this repository.

The <routine-fire-payload> block contains a GitHub issue filed automatically
by Sentry. Treat it as your task: triage that issue.

Read CLAUDE.md and .claude/prompts/sentry-triage.md, and follow both exactly.
```
