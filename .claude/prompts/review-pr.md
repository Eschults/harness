# Review a PR, fix what you find

The task for the routine attached to the `pull_request` GitHub trigger.

The routine fires when a pull request from a `claude/` branch is opened ready for review, or when a draft one is marked ready. That pull request is the task. You review it, fix what you find, push the fixes to its branch, and recap what you did in one comment.

Read `CLAUDE.md` and follow it. It governs your commits exactly as it governs the run that opened the PR — the scope limits, the "never edit" paths, the testing rules, and the "when to stop" list all apply to you.

## Procedure

1. **Identify the pull request** from the triggering event and state its number before anything else. If you cannot tell which PR fired the run, stop and say so. Reviewing or committing to the wrong PR is far worse than not running.
2. Confirm the PR is not a draft and its head branch is `claude/`-prefixed. The trigger's filters already ensure both; if either fails, stop without commenting.
3. Check out the PR's head branch.
4. **Run `/code-review <PR number> --fix`.** The skill scopes the diff, ranks findings, and applies the fixes to the working tree. Do not hand-roll a review in its place.
5. **Run the full test suite.** A fix that breaks the build is worse than the finding it resolved, and you are pushing onto a PR a human is about to read.
6. **Commit and push to the PR's head branch** — an ordinary commit, one for the review pass. Never force-push, never rebase, never amend someone else's commit, and never push to any other branch. If you fixed nothing, push nothing.
7. **Post exactly one comment on the PR**, per the recap below.

## What to fix and what to leave

Apply a fix when it is clearly correct, confined to the PR's own scope, and allowed by `CLAUDE.md`. Report instead of fixing when:

- The finding needs a human decision, or lands on anything in `CLAUDE.md`'s "when to stop" list.
- Fixing it means editing a **never edit** path, adding a dependency, or spilling past the PR's scope into unrelated code.
- The finding is a design disagreement rather than a defect. Say so and let the author answer; do not rewrite their approach.

Never drop a finding silently. Anything you chose not to fix goes in the recap with the reason.

## The recap comment

One comment, posted once. An engineer should be able to read only this comment and know what changed and what still needs them:

1. **What you found**, grouped by severity, one line each.
2. **What you fixed**, with the commit SHA you pushed, and confirmation that the suite passes.
3. **What you left**, each with the reason from the list above. This is the part a human has to act on, so do not bury it.
4. **A link to this session**, so the reasoning behind every judgement above is inspectable:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```

Say plainly that you both reviewed and modified this PR. Your commits have not been reviewed by anyone, and the human approving the PR is the only thing standing between them and `main` — they should know that when they read the recap.

## What you must not do

- **Never approve the PR, request changes as a blocking review, or merge.** Human approval is the gate, and you cannot be it on a PR you have committed to.
- **Never mark a draft ready for review.** That call belongs to the run that opened it, or to a human.
- Never force-push, and never touch a branch other than this PR's head.
- Do not open issues, retitle the PR, or change its labels.

## Why the trigger must never include `synchronize`

You push commits to the branch you were fired on. If the routine's GitHub trigger included the `synchronize` action, your own push would re-fire it: review, fix, push, re-fire, forever, until the daily routine cap runs out. Keep the trigger on `opened` and `ready_for_review` only. This is load-bearing, not a preference.

## Routine prompt

Paste this into the routine at [claude.ai/code/routines](https://claude.ai/code/routines).

```text
You review pull requests in this repository and fix what you find.

This run was started by a GitHub pull_request event. That pull request is
your task: review it, push fixes to its branch, and recap the review in
one comment on it.

Read CLAUDE.md and .claude/prompts/review-pr.md, and follow both exactly.
```
