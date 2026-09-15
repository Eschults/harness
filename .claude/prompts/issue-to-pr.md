# Issue → PR

The task for the routine fired by `.github/workflows/claude.yml`.

The `<routine-fire-payload>` block contains the repository, number, title, URL and body of one GitHub issue that a human labeled `claude`. That issue is the task.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure; it adds no rules of its own.
2. **Look for an open PR referencing the issue before anything else.** Re-applying the label fires this routine again, so never open a second PR for one issue. What you do depends on what you find:
   - **An open PR ready for review** — stop and say so. It is already waiting on a human.
   - **An open draft PR of yours** — read its description and comments. If the question it was blocked on has been answered, continue the work on that same branch and mark the PR ready for review when it is done. If it has not been answered, stop and say so.
   - **Nothing** — carry on below.
3. Reproduce the problem or pin down the feature's scope before writing code. If the issue is a stack trace, write a failing test that reproduces it, then fix the code, then confirm the test passes.
4. Open the PR — ready for review or draft, per the three outcomes below — then comment the link on the issue.
5. **Self-review the PR**, per the section below. Ready-for-review PRs only; skip it on a draft, which by definition is not finished.
6. Remove the `claude` label as your last action. The label means "waiting for an agent", so leaving it on a handled issue makes the queue lie.

A crashed run leaves the `claude` label on, which is deliberate — re-applying it retries, and step 2 keeps the retry from duplicating work.

## The three outcomes

Every run ends in exactly one of these. Pick deliberately; the difference is what a human is being asked to do next.

- **Ready for review** — the default. The change is complete, the full suite passes, and nothing is left to decide. Open it ready for review, not as a draft, then self-review it before you exit.
- **Draft** — the change is real but cannot proceed until a human answers something. State the question in the first line of the description, above everything else, and say what you would do under each answer. Then hand off on the issue, per below. A draft is a request for input, so open one only when you actually need input; never as a hedge on finished work.
- **No PR** — there is no useful partial change to show. Comment on the issue explaining what you found, remove `claude`, and add `needs-human`. That is a successful outcome, not a failure.

When the rulebook tells you to stop rather than guess, take **Draft** if you have a real change and one clear question a human can answer, and **No PR** when the doubt goes to the root of the task. A change touching auth, payments, permissions or PII is always **No PR**.

## Handing off a draft

When you open a draft, the issue comment is a handoff rather than a notification. An engineer reading only that comment must be able to act on it. Include exactly three things, in this order:

1. **The blocker, in one or two sentences.** Name the decision you need and what you would do under each answer. Not "I have a question" — the question itself.
2. **A link to this session, as the place to take over.** Get it from your own session id:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```
3. **The fallback**, in one line: answering on the issue and re-applying the `claude` label starts a fresh run that picks the draft up where you left it.

Present the session link as the default route. It keeps your full context, lets the engineer answer and watch you continue in place, and costs no further routine run — where the re-label path starts a cold session that has to reconstruct everything from the PR.

## Self-review

Once the PR is open and ready for review, review your own work before you exit. Nothing runs after you: whatever you leave unexamined ships to a human unexamined.

1. **Run `/code-review <PR number> --fix`.** The skill scopes the diff, ranks findings, and applies the fixes. Do not hand-roll a review in its place, and do not skip it because you feel good about the code — that feeling is exactly what the pass is checking.
2. **Run the full test suite again.** A fix that breaks the build is worse than the finding it resolved.
3. **Commit and push to the PR's branch.** One commit for the review pass. If you fixed nothing, push nothing.
4. **Comment the recap on the PR**, per below.

Apply a fix when it is clearly correct, confined to the PR's own scope, and allowed by the rules. Report instead of fixing when the finding needs a human decision, lands on anything in the rulebook's "when to stop" list, would mean editing a **never edit** path or adding a dependency, or is a design question rather than a defect. Never drop a finding silently — anything you chose not to fix goes in the recap with the reason.

## The recap comment

One comment on the PR. A reviewer should be able to read only this and know what changed and what still needs them:

1. **What the review found**, grouped by severity, one line each.
2. **What you fixed**, with the commit SHA, and confirmation that the suite passes.
3. **What you left**, each with its reason. This is the part a human has to act on, so do not bury it.
4. **A link to this session**, so the reasoning behind every call above is inspectable:

   ```bash
   echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
   ```

Say plainly that this was a **self-review**: you wrote the code and you reviewed it, so it is not a second opinion and nothing here has been independently checked. The human approving the PR is the only real gate. Do not describe your own work as reviewed, approved, or ready to merge.

Never approve the PR and never merge it, whatever the review found.
