# Issue → PR

The task for the routine fired by `.github/workflows/claude.yml`.

The `<routine-fire-payload>` block names one GitHub issue that a human labeled `claude`. That issue is the task.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure; it adds no rules of its own.
2. Read the issue and its comments with `gh issue view <number> --comments`.
3. Reproduce the problem or pin down the feature's scope before writing code.
4. Open the PR — ready for review or draft, per the three outcomes below — then comment the link on the issue.
5. **Self-review the PR**, per the section below. Ready-for-review PRs only; skip it on a draft, which by definition is not finished.
6. Remove the `claude` label as your last action. The label means "waiting for an agent", so leaving it on a handled issue makes the queue lie.

## The three outcomes

Every run ends in exactly one of these. Pick deliberately; the difference is what a human is being asked to do next.

- **Ready for review** — the default. The change is complete and nothing is left to decide. Open it ready for review, not as a draft, then self-review it before you exit.
- **Draft** — the change is real but cannot proceed until a human answers something. State the question in the first line of the description, above everything else, and say what you would do under each answer. Then hand off on the issue, per below. A draft is a request for input, so open one only when you actually need input; never as a hedge on finished work.
- **No PR** — there is no useful partial change to show. Comment on the issue explaining what you found, remove `claude`, and add `needs-human`. That is a successful outcome, not a failure.

When the rulebook tells you to stop rather than guess, take **Draft** if you have a real change and one clear question a human can answer, and **No PR** when the doubt goes to the root of the task.

## Handing off a draft

When you open a draft, the issue comment is a handoff rather than a notification. An engineer reading only that comment must be able to act on it. Include exactly two things, in this order:

1. **The blocker, in one or two sentences.** Name the decision you need and what you would do under each answer. Not "I have a question" — the question itself.
2. **A link to this session, as the place to take over.** Get it from your own session id:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```

## Self-review

Once the PR is open and ready for review, review your own work before you exit. Nothing runs after you: whatever you leave unexamined ships to a human unexamined.

1. **Run `/code-review <PR number> --fix`.** The skill scopes the diff, ranks findings, and applies the fixes. Do not hand-roll a review in its place, and do not skip it because you feel good about the code — that feeling is exactly what the pass is checking.
2. **Run the full test suite again.** A fix that breaks the build is worse than the finding it resolved.
3. **Commit and push to the PR's branch.** One commit for the review pass. If you fixed nothing, push nothing.
4. **Post the recap as a PR review**, per below.

Apply a fix when it is clearly correct, confined to the PR's own scope, and allowed by the rules. Report instead of fixing when it needs a human decision or is a design question rather than a defect. Never drop a finding silently — anything you chose not to fix goes in the recap with the reason.

## The recap review

One PR review, posted with `gh pr review <PR number> --comment --body-file <file>`. It is a review rather than a plain comment so it lands in the PR's review timeline, where a reviewer looks first. Always the **Comment** verdict: never `--approve`, since you cannot be the approval gate, and never `--request-changes`, since you already pushed every fix you were going to make. No heading at the top; the review's own frame says what it is.

A reviewer should be able to read only this and know what changed and what still needs them:

1. **What the review found**, grouped by severity, one line each.
2. **What you fixed**, with the commit SHA, and confirmation that the suite passes.
3. **What you left**, each with its reason. This is the part a human has to act on, so do not bury it.
4. **A link to this session**, so the reasoning behind every call above is inspectable:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```
