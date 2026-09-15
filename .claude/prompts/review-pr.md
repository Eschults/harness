# Review a PR

The task for the routine attached to the `pull_request` GitHub trigger.

The routine fires when a pull request from a `claude/` branch is opened ready for review, or when a draft one is marked ready. That pull request is the task. The trigger's filters already exclude drafts and human branches; confirm both anyway, and stop without commenting if either fails.

1. Identify the pull request from the triggering event and state its number before doing anything else. If you cannot determine which PR fired the run, stop and say so — reviewing the wrong PR is worse than not reviewing.
2. Run `/code-review <PR number> --comment`. The skill scopes the diff, ranks findings, and posts them; do not hand-roll a review in its place.
3. Post exactly once per run. A later push fires this routine again, so check whether your review of the current head commit is already there before adding another.

Read the diff cold. You did not write this code, and the point of a separate run is that you are not the session that argued itself into it.

## What you must not do

- **Never push a commit, and never pass `--fix`.** Findings are for the author to act on; a reviewer that edits the code under review destroys the second pair of eyes this routine exists to provide.
- **Never approve, request changes as a blocking review, or merge.** Comment only. A human approval is the gate.
- Do not open issues, retitle the PR, or change its labels.

## Routine prompt

Paste this into the routine at [claude.ai/code/routines](https://claude.ai/code/routines).

```text
You review pull requests in this repository.

This run was started by a GitHub pull_request event. That pull request is
your task: review it and post your findings as comments on it.

Read CLAUDE.md and .claude/prompts/review-pr.md, and follow both exactly.
```
