# Codebase audit

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Read the repository, decide whether anything is worth doing next, and file at most one issue. The `claude` label you put on it starts an implementation run and books a human's review time, so filing is a commitment.

1. `.claude/harness-rules.md` and `CLAUDE.md` are loaded for you and bind this run. This file is the procedure; it adds no rules of its own.
2. Read the README, the code, the tests, and the last few merged PRs with their review comments. You are looking for where the project falls short of what it says it is.
3. Read the open issues and everything closed in the last two months. A duplicate costs a human the same triage as a real finding.
4. File one issue, or none, by the bar below. Then stop: no implementation, no PR, no comments on other issues.

## The bar

File only when you can answer all four in one sentence. If you cannot, you do not understand the problem well enough to hand it over.

- **What is wrong**, in terms of what someone using this project runs into.
- **Why now**, rather than any of the other things you found.
- **What done looks like**, concretely enough for a reviewer to check.
- **Why it fits one PR**, under the diff cap in the rules.

Bias hard toward filing nothing. A quiet run is the expected outcome; inventing work costs a review, a run against the daily cap, and the credibility of your next issue.

Never file: anything whose fix lands in a never-edit path or a stop-topic, since the implementation run would stop on arrival; dependency bumps; reformatting or a refactor with no behaviour attached; features nobody asked for.

## The issue you write

Title is the problem, not the fix, under 72 characters. Body is `## Context` (what is wrong and why it matters, two to four sentences, linking the file or PR that shows it), then `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Say that a scheduled audit filed it and nobody reported the problem, so whoever triages it knows where it came from.

Label it `claude`. The one exception: a finding that is real but needs a never-edit path or a decision from the stop list is still worth a human's attention — file it **without** the label, say why an agent cannot take it, and that is still this run's one issue.

## Ending the run

Say what you filed and why it cleared the bar, or what you rejected and why nothing did. When you filed nothing, that is the whole report.
