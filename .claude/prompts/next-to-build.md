# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out what this project should gain next, and file it as one issue. The label you add starts an implementation run and books a human's review time, so filing is a commitment.

1. `.claude/harness-rules.md` and `CLAUDE.md` bind this run. This file is the procedure and adds no rules.
2. Read the README first — it says what the project is for, and what it does not do yet. Then the code and the last few merged PRs, to learn what it can actually carry.
3. Read the open issues, and the closed ones far enough back to catch what a human already rejected.
4. File one issue, or none. Then stop: no implementation, no PR, no comments elsewhere.

## What to look for

The next capability, not the next cleanup: a feature the README's own promise implies but nothing delivers, a manual step the project could take over, a failure mode the design could remove. Bugs and refactors belong to someone else's run — propose one only when it blocks the feature you are proposing.

File only when you can say in one sentence each what a user can do afterwards that they cannot do now, why this before the others, what done looks like, and why it fits one PR under the diff cap. If you cannot, you do not understand it well enough to hand it over.

One per run at most, and none is a fine answer. Inventing work costs a review, a run against the daily cap, and the credibility of your next issue.

## The issue you write

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Say that a scheduled run proposed it and nobody asked, so whoever triages it knows where it came from.

Create it unlabeled and label it in a second step — `claude.yml` listens for `issues.labeled`, and a label set at creation time does not reliably emit that event:

```bash
url=$(gh issue create --title "<title>" --body-file <file>)
gh issue edit "${url##*/}" --add-label claude
```

Use `needs-human` instead of `claude` when the work needs a never-edit path or a decision from the stop list, since an implementation run would stop on arrival; name the path or the decision in the body, so whoever picks it up knows what only they can settle.

Never leave it unlabeled — that is nobody's queue. The two commands fail independently, so check the label actually landed before you call the issue filed, and if it did not, say so in your ending report with the issue number.

## Ending the run

Say what you filed and why, or what you passed over and why none of it cleared the bar.
