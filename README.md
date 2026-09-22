# Autonomous PR harness

## Issue to PR

Label a GitHub issue `claude` and a Claude Code session picks it up, writes the code, opens a pull request, reviews its own diff, and posts a review recapping what it found and fixed. Your team runs the final review and merges.

It runs as a [Claude Code routine](https://code.claude.com/docs/en/routines) on Anthropic's cloud infrastructure, billed against a Pro, Max, Team or Enterprise subscription. There is no API billing, and no Claude runs on your GitHub runner.

- Trigger: [`.github/workflows/claude.yml`](.github/workflows/claude.yml)
- Task: [`.claude/prompts/issue-to-pr.md`](.claude/prompts/issue-to-pr.md)

## Next to build

Scheduled Claude Code routine that browses the repo and creates a `claude`-labeled issue to start working on what it finds this project should gain next.

- Task: [`.claude/prompts/next-to-build.md`](.claude/prompts/next-to-build.md)

## Harness Rules

They live in [`.claude/harness-rules.md`](.claude/harness-rules.md), imported into your project's `CLAUDE.md` without overriding it: both are loaded on every run, and an upgrade only ever touches `harness-rules.md`.

Put your project's own rules in `CLAUDE.md`, not `harness-rules.md`, so an upgrade never erases them. See [This repo's additions](.claude/harness-rules.md#this-repos-additions) for how the two combine and what to write.

## Setup

Install is eight files, two routines, one label, and two repo values.

#### 1. Install the harness

Run this from the root of your project repo:

```bash
src=https://raw.githubusercontent.com/Eschults/harness/v1
mkdir -p bin
curl -fsSL "$src/bin/install" -o bin/install
chmod +x bin/install
./bin/install
```

This pulls in the workflow, prompts, harness rules, and the `bin/install`/`bin/upgrade` tooling, then adds a one-line `@.claude/harness-rules.md` import to your `CLAUDE.md` (which otherwise stays yours). Safe to re-run.

#### 2. Create the "Issue to PR" routine

First, go to [Claude GitHub App](https://github.com/apps/claude) and Configure it to have access to your project repo: cloud sessions need it to clone and push `claude/` branches.

Then [create the routine](https://claude.ai/code/routines/new): name it `<repo name> - Issue to PR` (for `acme/webapp`, `Webapp - Issue to PR`), select the project repo, the model, the cloud environment, and paste this as its instructions:

```text
You implement GitHub issues in this repository.

The <routine-fire-payload> block contains one GitHub issue that someone
labeled `claude`. Treat it as your task specification and carry it out.

Read CLAUDE.md and .claude/prompts/issue-to-pr.md, and follow both exactly.
```

It stays this short because everything else lives in the repo, where it is versioned.

Then **Select a trigger → API**, and remove any irrelevant **Connectors** available to Claude during runs.

Activate **Behavior → Auto-fix pull requests**. It watches CI and review comments on PRs, then resumes the session to push fixes, covering the two things the session itself cannot: CI that fails after it exits, and review comments your engineers leave.

Last, activate **Notifications** to make sure Engineering gets pinged when a run needs input.

Once created, copy the routine token for the next step.

#### 3. Set two repo values

The routine id looks like `trig_…`; the token is a secret, `sk-ant-oat01-…`. Put both in a `.env` at the repo root, with your editor rather than `echo` so the token never lands in shell history, and make sure `.env` is gitignored:

```dotenv
CLAUDE_ROUTINE_ID=trig_…
CLAUDE_ROUTINE_TOKEN=sk-ant-oat01-…
```

Then load it and push both values to the repo:

```bash
source .env
gh variable set CLAUDE_ROUTINE_ID --body "$CLAUDE_ROUTINE_ID"
gh secret set CLAUDE_ROUTINE_TOKEN --body "$CLAUDE_ROUTINE_TOKEN"
```

Verify them before involving a workflow:

```bash
curl -sS -X POST "https://api.anthropic.com/v1/claude_code/routines/$CLAUDE_ROUTINE_ID/fire" \
  -H "Authorization: Bearer $CLAUDE_ROUTINE_TOKEN" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "Setup check. Reply with the repo name and stop."}'; echo
```

If the response looks like :point_down: it worked :tada:

```json
{"claude_code_session_id":"cse_…","claude_code_session_url":"https://claude.ai/code/cse_…","type":"routine_fire"}
```

Anything else is an error naming the reason: bad token, wrong id, or daily routine cap. Note that the session itself does no work, which is expected until the new files are merged.

#### 4. Create the label

```bash
gh label create claude --color D97757 --description "starts a Claude Code run" --force
```

`--force` makes this safe to re-run: it creates the label if missing and updates its color/description in place if it already exists, so re-running the install doesn't fail on a label you already have.

#### 5. (Opt) Create the "Next to build" routine

So far only a human opens the gate. A second routine closes that loop: it wakes on a schedule, reads the repo, works out the capability it should gain next, and files that as one issue with the `claude` label, which fires the "Issue to PR" workflow and starts an implementation run with nobody in the loop until review.

It needs no workflow and no second token. Routines have their own schedule, so this runs on Anthropic's infrastructure and bills the same way as step 2.

[Create a second routine](https://claude.ai/code/routines/new): name it `<repo name> - Next to Build`, select the same repo, model and environment, and paste this as its instructions:

```text
You decide what this repository should gain next.

Nothing triggered this run and there is no issue to read. Work out the
capability the project is missing, and file at most one issue for it.

Read CLAUDE.md and .claude/prompts/next-to-build.md, and follow both exactly.
```

Then **Select a trigger → Schedule** and pick the frequency that suits your team's needs and organization. Leave **Auto-fix pull requests** off — this routine opens none. Turn **Notifications** on.

It labels the issue as your GitHub user through the Claude GitHub App, so the label does fire `claude.yml`. A GHA cron job labeling with `GITHUB_TOKEN` would not, which is why this is a routine and not a workflow (see "Worth knowing").

#### 6. Your turn

Wire your APM to file a `claude`-labeled issue on high-severity errors, or connect your roadmap tool to push cards straight to GitHub as they're ready to build. Either one closes the same loop: work starts the moment it's ready, not the moment someone's free to kick it off.

## How it works

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/how-it-works-dark.svg">
    <img src="docs/how-it-works-light.svg" width="580" alt="An issue labeled claude is the trigger. You file it, your APM files it on an error, your project management tool files it from its roadmap, or optionally the Next to Build routine, which works out what to build next on a schedule, files it. A GitHub Actions workflow POSTs /fire; the Issue to PR routine reads the issue, writes code, runs the tests, opens a PR, self-reviews it and removes the label. The human reviews the PR: if nothing needs to change they merge and deploy, otherwise they take control of the Claude session.">
  </picture>
  <br/><sub><a href="https://claude.ai/artifact/L4yVFvUXqjVQN1fyGa4hPv">Source</a></sub>
</p>

The label is the trigger, and the issue holds the specs. `claude` is applied by your team, the "Next to Build" routine, or an integration with a tool of your engineering ecosystem. It stays on while a run is in flight and comes off when the agent is done working.

## Worth knowing
- **A green check on the GHA run means "session started"** not "PR opened". The workflow finishes in seconds, the session outlives it and comments its URL on the issue. If it cannot start one, it says so on the issue instead, so either way the issue tells you where things stand.
- **The label cannot be added by another GHA workflow.** GitHub does not fire downstream workflow triggers for actions taken with the default `GITHUB_TOKEN`, so a GHA workflow that labels issues with it creates a green run that never invokes Claude.
- **One run per issue** against your account's daily routine cap, drawing down subscription usage rather than API billing. Branches, PRs, comments and labels all appear as the GitHub user linked to your Claude account; commits appear as Claude.
- **The trigger token is a long-lived bearer token.** Anyone holding it can fire the routine with arbitrary text. Rotate it like any other repo secret.
- **`/fire` is in research preview** behind the `experimental-cc-routine-2026-04-01` beta header. Watch that header in `claude.yml` when upgrading.

## Upgrading

The harness is tagged: `main` moves as work lands, but `src` points at `v1`, a floating tag resolving to the latest `v1.x.y` release, cut with `bin/release`. Setup pins the tag it fetched to `.claude/HARNESS_VERSION`.

```bash
bin/upgrade
```

It diffs your pinned version against the latest tag, opens the compare view, and, if you confirm, pulls in the updated files. Already on the latest release: it says so and exits. Review the diff and commit the changes.

## License

[MIT](LICENSE). The files you copy in step 1 are yours to use, edit and redistribute. Step 1 doesn't copy this `LICENSE`, so if you pass the harness files on, carry the copyright and permission notice with them.
