# Next to build

The task for the routine that fires on a schedule, with no issue to work from.

Nobody asked for anything. Work out the one capability this project should gain next, and file it as an issue. The label you add starts an implementation run, so filing books a human's review time.

## Check what's already open

Before choosing a capability, list open issues labeled `claude` and open pull requests from `claude/` branches. If either list is non-empty, file nothing and end the run: that work already owes a human a review, and filing more only grows the queue ahead of it.

Also list what humans already turned down: issues whose state is closed and close reason is not planned, and this account's closed, unmerged pull requests from `claude/` branches. Fetch every page of each list, since search tools return only the first page by default and the rejection you need may be older. Read the closing comment on each, and the whole thread on any that touch the capability you are weighing. A closing comment is a human telling you no on that capability: don't file it again under another title or scope. When the reason is about product direction, it rules out neighbouring ideas too, not just the one they closed; when it is about timing or size, a later or smaller version stays open.

How you work it out is yours — every project shows what it is missing somewhere different. What holds regardless: nobody has filed it and nobody has rejected it already, one implementation run can carry it, and you can say what someone will be able to do that they cannot do now. File one issue, or none.

Check that nobody has filed it by searching every issue, open and closed, for the capability's key terms, not just its title. Leave the state filter off or set it to all, since most tools default to open issues only. An issue counts as the same idea when it gives the same person the same outcome, even with a different interface, scope, or parameters. If one exists, file nothing and say which issue stopped you.

## The issue

Title is the capability, under 72 characters. Body is `## Context` (what is missing and why it matters now), `## Done looks like` (acceptance criteria as a checklist), then the files you expect to change. Create it with the `claude` label, to let the "Issue to PR" routine take over and create a PR without further notice.

## Ending the run

Say what you filed and why. Anything you passed over, or left unfiled because only a human can take it, goes here too. If you skipped the run because earlier work is still open, name the issue or PR that caused it.
