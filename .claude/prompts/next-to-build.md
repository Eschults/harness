# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out the one capability this project should gain next, and file it as an issue. The label you add starts an implementation run, so filing books a human's review time.

## Check what's already open

Before choosing a capability, list open issues labeled `claude` and open pull requests from `claude/` branches. If either list is non-empty, file nothing and end the run: that work already owes a human a review, and filing more only grows the queue ahead of it. The same list is also where you check for duplicates: a capability already covered by an open issue or PR is not filed again.

How you work it out is yours — every project shows what it is missing somewhere different. What holds regardless: nobody has filed it and nobody has rejected it already, one implementation run can carry it, and you can say what someone will be able to do that they cannot do now. File one issue, or none.

## The issue

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Create it with the `claude` label, to let the "Issue to PR" routine take over and create a PR without further notice.

## Ending the run

Say what you filed and why. Anything you passed over, or left unfiled because only a human can take it, goes here too. If you skipped the run because earlier work is still open, name the issue or PR that caused it.
