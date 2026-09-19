# Issue → PR

The task for the routine fired by `.github/workflows/claude.yml`.

The `<routine-fire-payload>` block names one GitHub issue that someone labeled `claude`.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure; it adds no rules of its own.
2. Read the issue and every comment on it, with the tooling from the section below. The body and the comments come back from separate calls — `issue_read` with `method: "get"` and then `method: "get_comments"` — and a specification that lives in a comment is invisible to the first alone.
3. Reproduce the problem or pin down the feature's scope before writing code.
4. If the change is visible in a UI, screenshot it and commit the images, per the section below. The PR description links them, so they must exist before it does.
5. Open the PR — ready for review or draft, per the three outcomes below — then comment the link on the issue.
6. **Self-review the PR**, per the section below. Ready-for-review PRs only; skip it on a draft, which by definition is not finished.
7. Remove the `claude` label as your last action. The label means "waiting for an agent", so leaving it on a handled issue makes the queue lie. Take off that one label and leave the rest: `issue_write` with `method: "update"` replaces the whole label set, so send the labels the issue keeps rather than an empty list, or the issue's other labels go with it.

## Reaching GitHub

A Claude Code cloud session has no `gh` on its PATH, so nothing in this file assumes one. Establish what this session actually has before the first call that needs it — the GitHub MCP tools (`mcp__github__*`) in a cloud session, `gh` in a terminal session that has it — and use the same tooling for every GitHub call in the run.

The tool changes; what has to end up on GitHub does not. Where a step below names an outcome — a review, an issue comment, a label removed — that outcome is the requirement, and reaching for a different kind of object because it was easier to post is a failure of the step, not a variation on it.

If nothing available can reach this repository, stop and say so as plainly as you can wherever you can still write. A run that cannot read the issue or post its review cannot finish, and working from the payload alone is guessing.

## The three outcomes

Every run ends in exactly one of these. Pick deliberately; the difference is what a human is being asked to do next.

- **Ready for review** — the default. The change is complete and nothing is left to decide. Open it ready for review, not as a draft, then self-review it before you exit.
- **Draft** — the change is real but cannot proceed until a human answers something. State the question in the first line of the description, above everything else, and say what you would do under each answer. Then hand off on the issue, per below. A draft is a request for input, so open one only when you actually need input; never as a hedge on finished work.
- **No PR** — there is no useful partial change to show. Comment on the issue explaining what you found and remove `claude`. That is a successful outcome, not a failure.

When the rulebook tells you to stop rather than guess, take **Draft** if you have a real change and one clear question a human can answer, and **No PR** when the doubt goes to the root of the task.

## Handing off a draft

When you open a draft, the issue comment is a handoff rather than a notification. An engineer reading only that comment must be able to act on it. Include exactly two things, in this order:

1. **The blocker, in one or two sentences.** Name the decision you need and what you would do under each answer. Not "I have a question" — the question itself.
2. **A link to this session, as the place to take over.** Get it from your own session id:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```

## Screenshots for UI changes

A reviewer cannot run your branch from a PR page, so when the change alters something a user sees, show it to them. Screenshot the main states the change introduces, commit the images on the PR's branch in their own commit, and link each one from the description next to the change it shows. Whatever tooling you need to render the page is for this run only: do not add it to the project's dependencies. The images do not count toward the diff cap.

Say in the description that the images are review-only and come out before merge, so they are not part of the change a human is being asked to accept. The rulebook tells whichever session is running to drop them when the reviewer asks.

## Self-review

Once the PR is open and ready for review, review your own work before you exit. Nothing runs after you: whatever you leave unexamined ships to a human unexamined.

1. **Run `/code-review <PR number> --fix`.** The skill scopes the diff, ranks findings, and applies the fixes. Do not hand-roll a review in its place, and do not skip it because you feel good about the code — that feeling is exactly what the pass is checking.
2. **Run the full test suite again.** A fix that breaks the build is worse than the finding it resolved.
3. **Commit and push to the PR's branch.** One commit for the review pass. If you fixed nothing, push nothing.
4. **Post the recap as a PR review**, per below.

Apply a fix when it is clearly correct, confined to the PR's own scope, and allowed by the rules. Report instead of fixing when it needs a human decision or is a design question rather than a defect. Never drop a finding silently — anything you chose not to fix goes in the recap with the reason.

Findings belong on the pull request, never in the diff. A finding about one line also goes on that line, as an inline comment in the review, and the recap still carries every finding whether or not it earned one. Do not write a comment into the source to record a review finding, to justify a fix, or to flag something you decided not to change: the review is a layer over the diff that a merge discards, while a code comment reaches `main` and stays there long after the exchange that produced it is forgotten.

## The recap review

One PR review, carrying the **Comment** verdict and any inline comments the findings earned. A review, not a comment: it has to land in the PR's review timeline, which is where a reviewer looks first and where a merge leaves it behind. With the GitHub MCP tools, a recap with no inline comments is one `pull_request_review_write` call with `method: "create"` and `event: "COMMENT"`; with inline comments it is `create` with **no** `event`, which opens a pending review rather than submitting one, then `add_comment_to_pending_review` per line, then `submit_pending` carrying the recap body and `event: "COMMENT"`. With `gh` it is `gh pr review <PR number> --comment --body-file <file>`. Never approve, since you cannot be the approval gate, and never request changes, since you already pushed every fix you were going to make. No heading at the top; the review's own frame says what it is.

If the review will not post, a plain PR comment is the fallback — but open it by saying the review failed and name the error, so the reviewer sees a degraded outcome rather than a recap that looks like it worked. Silently posting a comment in place of a review is the one thing this step cannot do.

A reviewer should be able to read only this and know what changed and what still needs them:

1. **What the review found**, grouped by severity, one line each.
2. **What you fixed**, with the commit SHA, and confirmation that the suite passes.
3. **What you left**, each with its reason. This is the part a human has to act on, so do not bury it.
4. **A link to this session**, so the reasoning behind every call above is inspectable:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```
