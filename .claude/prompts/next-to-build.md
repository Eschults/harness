# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out the one capability this project should gain next, and file it as an issue. The label you add starts an implementation run, so filing books a human's review time.

1. Read the README for what the project promises and does not yet do, then the code and the last few merged PRs for what it can carry.
2. Read the open issues, and the closed ones far enough back to catch what a human already rejected.
3. Pick the capability worth building next: a feature the README implies but nothing delivers, a manual step the project could take over, a failure mode the design could remove. Keep it to what one implementation run can carry — code it may touch, decisions already made, a diff under the cap in the rules.
4. File it when you can say in a sentence each what someone can do afterwards that they cannot do now, why this before the rest, what done looks like, and why it fits one PR. Short of that, report what you found and file nothing.
5. Label it, then stop.

## The issue

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Say that a scheduled run proposed it and nobody asked, so whoever triages it knows where it came from.

Create it unlabeled and label it in a second step — `claude.yml` listens for `issues.labeled`, and a label set at creation time does not reliably emit that event:

```bash
url=$(gh issue create --title "<title>" --body-file <file>)
gh issue edit "${url##*/}" --add-label claude
```

The two commands fail independently, so confirm the label landed before you call the issue filed.

## Ending the run

Say what you filed and why. Anything you passed over, or left unfiled because only a human can take it, goes here too.
