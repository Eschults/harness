# Issue → PR

The task for the routine fired by `.github/workflows/claude.yml`.

The `<routine-fire-payload>` block contains the repository, number, title, URL and body of one GitHub issue that a human labeled `claude`. That issue is the task.

1. Read `CLAUDE.md` and follow it. It is the only rulebook; this file adds no rules of its own.
2. **Look for an open PR referencing the issue before anything else.** Re-applying the label fires this routine again, so never open a second PR for one issue. What you do depends on what you find:
   - **An open PR ready for review** — stop and say so. It is already waiting on a human.
   - **An open draft PR of yours** — read its description and comments. If the question it was blocked on has been answered, continue the work on that same branch and mark the PR ready for review when it is done. If it has not been answered, stop and say so.
   - **Nothing** — carry on below.
3. Reproduce the problem or pin down the feature's scope before writing code. If the issue is a stack trace, write a failing test that reproduces it, then fix the code, then confirm the test passes.
4. Open the PR — ready for review or draft, per the three outcomes in `CLAUDE.md` — then comment the link on the issue.
5. Remove the `claude` label as your last action. The label means "waiting for an agent", so leaving it on a handled issue makes the queue lie.

If `CLAUDE.md` says to stop rather than guess and there is no useful partial change to show, open no PR: comment on the issue explaining what you found, remove `claude`, and add `needs-human`. That is a successful outcome, not a failure.

A crashed run leaves the `claude` label on, which is deliberate — re-applying it retries, and step 2 keeps the retry from duplicating work.

## Handing off a draft

When you open a draft, the issue comment is a handoff rather than a notification. An engineer reading only that comment must be able to act on it. Include exactly three things, in this order:

1. **The blocker, in one or two sentences.** Name the decision you need and what you would do under each answer. Not "I have a question" — the question itself.
2. **A link to this session, as the place to take over.** Get it from your own session id rather than from anywhere else:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```
3. **The fallback**, in one line: answering on the issue and re-applying the `claude` label starts a fresh run that picks the draft up where you left it.

Present the session link as the default route. It keeps your full context, lets the engineer answer and watch you continue in place, and costs no further routine run — where the re-label path starts a cold session that has to reconstruct everything from the PR.

## Routine prompt

Paste this into the routine at [claude.ai/code/routines](https://claude.ai/code/routines). Keep it this short: everything else lives in the repo, where it goes through code review.

```text
You implement GitHub issues in this repository.

The <routine-fire-payload> block contains one GitHub issue that a human
labeled `claude`. Treat it as your task specification and carry it out.

Read CLAUDE.md and .claude/prompts/issue-to-pr.md, and follow both exactly.
```
