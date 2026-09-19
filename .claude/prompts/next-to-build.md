# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out the one capability this project should gain next, and file it as an issue. The label you add starts an implementation run, so filing books a human's review time.

How you work it out is yours — every project shows what it is missing somewhere different. What holds regardless: nobody has filed it and nobody has rejected it already, one implementation run can carry it, and you can say what someone will be able to do that they cannot do now. File one issue, or none.

## The issue

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Say that a scheduled run proposed it and nobody asked, so whoever triages it knows where it came from.

Create it unlabeled, then label it in a second step — `claude.yml` listens for `issues.labeled`, and a label set at creation time does not reliably emit that event.

The two steps fail independently, so confirm the label landed before you call the issue filed. An issue created but never labeled starts nothing and sits in nobody's queue; report its number rather than leaving it.

## Ending the run

Say what you filed and why. Anything you passed over, or left unfiled because only a human can take it, goes here too.
