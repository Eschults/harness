# Codebase audit

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Read the repository, decide whether anything is worth doing next, and file at most one issue. The `claude` label you put on it starts an implementation run and books a human's review time, so filing is a commitment.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure; it adds no rules of its own.
2. Read the README, the code, the tests, and the last few merged PRs with their review comments. You are looking for where the project falls short of what it says it is.
3. Read the open issues, and the closed ones far enough back to catch anything a human already rejected. Refiling a finding closed as not-planned last year costs the same triage as a duplicate filed last week, and costs more credibility.
4. File one issue, or none, by the bar below. Then stop: no implementation, no PR, no comments on other issues.

## The bar

File only when you can answer all four in one sentence. If you cannot, you do not understand the problem well enough to hand it over.

- **What is wrong**, in terms of what someone using this project runs into.
- **Why now**, rather than any of the other things you found.
- **What done looks like**, concretely enough for a reviewer to check.
- **Why it fits one PR**, under the diff cap in the rules.

Bias hard toward filing nothing. A quiet run is the expected outcome; inventing work costs a review, a run against the daily cap, and the credibility of your next issue.

Never file: dependency bumps; reformatting or a refactor with no behaviour attached; features nobody asked for. A finding whose fix lands in a never-edit path or a stop-topic is not one of these — an implementation run would stop on arrival, so it goes to a human instead, per the next section.

## The issue you write

Title is the problem, not the fix, under 72 characters. Body is `## Context` (what is wrong and why it matters, two to four sentences, linking the file or PR that shows it), then `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Say that a scheduled audit filed it and nobody reported the problem, so whoever triages it knows where it came from.

Create the issue unlabeled, then add the label as a separate step. `claude.yml` listens for `issues.labeled` and nothing else, and a label set at creation time does not reliably produce that event, so `gh issue create --label claude` can leave the issue sitting there with nobody working it.

```bash
url=$(gh issue create --title "<title>" --body-file <file>)
gh issue edit "${url##*/}" --add-label claude
```

A finding that is real but needs a never-edit path or a decision from the stop list goes to a human rather than to a run that would stop on arrival: add `needs-human` instead of `claude`, say why an agent cannot take it, and that is still this run's one issue. Never leave the issue with no label at all — an unlabeled issue is in nobody's queue.

## Ending the run

Say what you filed and why it cleared the bar, or what you rejected and why nothing did. When you filed nothing, that is the whole report.
