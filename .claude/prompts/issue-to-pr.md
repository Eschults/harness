# Issue → PR

The task for the routine fired by `.github/workflows/claude.yml`.

The `<routine-fire-payload>` block names one GitHub issue that someone labeled `claude`.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure, it adds no rules of its own.
2. Read the issue and every comment on it. A specification often continues in the comments, and the body alone will not show it.
3. Before writing any code, check whether an earlier run already opened a pull request for this issue. Follow "Continuing an earlier PR" below; it tells you whether to proceed as new work or pick up an existing PR.
4. Reproduce the problem or pin down the feature's scope before writing code.
5. Estimate the diff against the ~600-line cap in `.claude/harness-rules.md` before writing code. If the issue fits, build it whole. If it does not, follow "Splitting oversized work" below before choosing an outcome.
6. If the change is visible in a UI, screenshot it and commit the images, per the section below. The PR description links them, so they must exist before it does.
7. Open the PR per the three outcomes below, then comment the link on the issue.
8. Review the PR per the section below: ready-for-review PRs only; skip it on a draft, which by definition is not finished.
9. Remove the `claude` label as your last action. The label means "waiting for an agent", so leaving it on a handled issue makes the queue lie.

## Continuing an earlier PR

A re-applied `claude` label often means a run already touched this issue: one that died before pushing, a reviewer who just answered a draft's question, or a split run whose remainder is waiting. Before reproducing the problem or writing any code, look for that earlier work: search for an open pull request whose description names this issue in a `Fixes #<issue-number>` line (or another closing keyword), or whose branch starts with `claude/`, and read this issue's own comments for a link to one left by an earlier run.

- **No open PR found**: proceed exactly as the rest of this file describes, starting from the default branch.
- **An open PR exists and a human opened it**: open no second PR. Comment its link on the issue, remove the `claude` label, and stop; the rest of this file does not apply to this run.
- **An open PR exists and an earlier run opened it**: continue on that PR's branch instead of starting from the default branch. Add commits to it; never open a second PR for this issue; never rewrite history on a commit you did not write, per the existing PR rules.
  - If that PR is a draft holding on a question, read the issue's comments for the answer before doing anything else.
    - Answered: implement under that answer, then continue the normal flow below. Mark the draft ready for review only if an earlier run, not a human, opened it.
    - Not answered: comment that the question is still open, remove the `claude` label, and stop; do not guess the answer.
  - Otherwise, continue the normal flow below on that branch: estimate the diff, build, screenshot if needed, and so on.
  - When you reach review and label removal, and when writing the PR description or recap, say that this run continued an earlier PR rather than opening a new one.

## The three outcomes

Every run ends in exactly one of these. Pick deliberately; the difference is what a human is being asked to do next.

- **Ready for review**: the default. The change is complete and nothing is left to decide. Open it ready for review, not as a draft.
- **Draft**: the change is real but cannot proceed until a human answers something. State the question in the first line of the description, above everything else, and say what you would do under each answer. Then hand off on the issue, per below.
- **No PR**: there is no useful partial change to show. Comment on the issue explaining what you found and remove `claude`. That is a successful outcome, not a failure.

When the rulebook tells you to stop rather than guess, take **Draft** if you have a real change and one clear question a human can answer, and **No PR** when the doubt goes to the root of the task.

## Splitting oversized work

When the issue does not fit the diff cap, ship the largest self-contained slice that fits as a ready-for-review PR, and say in the description which slice you took. Leave the remainder as a comment on the PR listing what is not done, so the reviewer can say "ship the next N items in this PR" or "open a follow-up issue"; do not open a second issue or relabel anything yourself.

A slice that would leave the codebase broken or half-working is not allowed. When no self-contained slice fits the cap, take the Draft outcome instead, with the question "how should this be split?".

## Handing off a draft

When you open a draft, the issue comment is a handoff rather than a notification. An engineer reading only that comment must be able to act on it. Include exactly two things, in this order:

1. **The blocker, in one or two sentences.** Name concisely the decision you need and what you would do under each answer.
2. **A link to this session, as the place to take over.** Show both the claude.ai Web UI link, and the `claude --teleport` command to take over from a Terminal (rendered as a multi-line code block).

## Screenshots for UI changes

A reviewer cannot run your branch from a PR page, so when the change alters something a user sees, show it to them. Screenshot the main states the change introduces, commit the images on the PR's branch in their own commit, and link each one from the description next to the change it shows. Whatever tooling you need to render the page is for this run only: do not add it to the project's dependencies. The images do not count toward the diff cap.

Say in the description that the images are review-only and come out before merge, so they are not part of the change a human is being asked to accept. The rulebook tells whichever session is running to drop them when the reviewer asks.

## Review

Once the PR is open and ready for review, review your own work before you exit. Nothing runs after you: whatever you leave unexamined ships to a human unexamined.

1. **Run `/code-review <PR number> --fix`.** The skill scopes the diff, ranks findings, and applies the fixes. Do not hand-roll a review in its place, and do not skip it because you feel good about the code — that feeling is exactly what the pass is checking.
2. **Run the full test suite again.** A fix that breaks the build is worse than the finding it resolved.
3. **Commit and push to the PR's branch.** One commit for the review pass. If you fixed nothing, push nothing.
4. **Post the recap as a PR review**, per below.

Apply a fix when it is clearly correct, confined to the PR's own scope, and allowed by the rules. Report instead of fixing when it needs a human decision or is a design question rather than a defect. Never drop a finding silently — anything you chose not to fix goes in the recap with the reason.

Findings belong on the pull request, never in the diff. A finding about one line also goes on that line, and the recap carries every finding either way. Never write a comment into the source to record a finding, justify a fix, or flag something you left.

Track code comments that do not belong in the code, and make them review inline comments instead. Strip them out before handing off your work. 

## The recap review

One PR **Review**, with the **Comment** verdict, carrying inline comments on the lines that earned them. A review, not a comment: it belongs in the PR's review timeline, where a reviewer looks first and where a merge leaves it behind. Never approve, since you cannot be the approval gate, and never request changes, since you already pushed every fix you were going to make. No heading at the top; the review's own frame says what it is.

If the review will not post, say so in the first line of the fallback comment and name the error. A comment passed off as the recap is the one thing this step cannot do.

A reviewer should be able to read only this and know what changed and what still needs them:

1. **What the review found**, grouped by severity, one line each.
2. **What you fixed**, with the commit SHA, and confirmation that the suite passes.
3. **What you left**, each with its reason. This is the part a human has to act on, so do not bury it.
4. **A link to this session**, so the reasoning behind every call above is inspectable. Show both the claude.ai Web UI link, and the `claude --teleport` command to take over from a Terminal (rendered as a multi-line code block).
