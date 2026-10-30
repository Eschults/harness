# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out the one capability this project should gain next, and file it as an issue. The label you add starts an implementation run, so filing books a human's review time.

## Check whether the harness is paused

Before anything else, look up the repo's `HARNESS_PAUSED` variable (list or read the repository variable by that name). If its value is `true`, end the run without filing: the harness is paused, so the `claude` label a new issue needs would queue up a run that will not start.

## Check what's already open

Before choosing a capability, list open issues labeled `claude` and open pull requests from `claude/` branches. If either list is non-empty, file nothing and end the run: that work already owes a human a review, and filing more only grows the queue ahead of it.

Then skim the titles of the 20 most recently closed not-planned issues and unmerged `claude/` pull requests, to see which directions humans have turned down.

How you work it out is yours — every project shows what it is missing somewhere different. What holds regardless: nobody has filed it and nobody has rejected it already, one implementation run can carry it, and you can say what someone will be able to do that they cannot do now. File one issue, or none.

Once you have a candidate, search issues and pull requests in every state for its key terms, in two or three phrasings, not just its title. An item counts as the same idea when it gives the same person the same outcome, even with a different interface, scope, or parameters. If one is open or done, the candidate is ruled out. If one was closed as not planned or left unmerged, read its closing comment: a reason about product direction rules out this candidate and its neighbours, while a reason about timing or size leaves a later or smaller version open. When a candidate is ruled out, say which item stopped it and pick another.

## The issue

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Create it with the `claude` label, to let the "Issue to PR" routine take over and create a PR without further notice.

## Ending the run

Say what you filed and why. Anything you passed over, or left unfiled because only a human can take it, goes here too. If you skipped the run because earlier work is still open, name the issue or PR that caused it.
