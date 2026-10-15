# Autonomous PR harness

Label a GitHub issue `claude` and a Claude Code session implements it, opens a pull request, reviews its own diff, and posts a review recapping what it found and fixed. A human reviews and merges: the rules forbid the agent from approving or merging, so require a review in your default branch's protection rules to enforce it.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/how-it-works-dark.svg">
    <img src="docs/how-it-works-light.svg" width="580" alt="An issue labeled claude is the trigger. You file it, your APM files it on an error, your project management tool files it from its roadmap, or optionally the Next to Build routine, which works out what to build next on a schedule, files it. A GitHub Actions workflow POSTs /fire; the Issue to PR routine reads the issue, writes code, runs the tests, opens a PR, self-reviews it and removes the label. The human reviews the PR: if nothing needs to change they merge and deploy, otherwise they take control of the Claude session.">
  </picture>
  <br/><sub><a href="https://claude.ai/artifact/L4yVFvUXqjVQN1fyGa4hPv">Source</a></sub>
</p>

It runs as a [Claude Code routine](https://code.claude.com/docs/en/routines) on Anthropic's cloud, billed against a Pro, Max, Team or Enterprise subscription. No API billing, and no Claude runs on your GitHub runner: the workflow only starts the session.

## What a run does

- **Ends in one of three outcomes**: a PR ready for review, a draft PR that asks one question a human must answer, or a comment on the issue explaining why there is no PR.
- **Reviews itself before exiting** (ready-for-review PRs only): runs `/code-review --fix` on its PR, re-runs the tests, and posts a review listing what it found, what it fixed (with the commit), and what it left for you.
- **Hands over cleanly**: drafts and recaps link the session, so an engineer can take it over from claude.ai or with `claude --teleport`.
- **Keeps going after it exits**: with Auto-fix on, failing CI and review comments resume the session to push fixes.
- **Optionally finds its own work**: the "Next to build" routine files the next issue on a schedule, and skips the run while earlier work still awaits review.

## Guardrails

Every run, including Auto-fix sessions, follows [`.claude/harness-rules.md`](.claude/harness-rules.md). In short, the agent:

- Never approves, merges, or marks someone else's draft ready, and never rewrites commits it did not write.
- Stops and hands back instead of guessing on auth, payments, permissions, PII, schema migrations, or ambiguous requirements.
- Keeps diffs around 600 lines, shipping larger work as a self-contained slice plus a list of what remains.
- Adds a regression test for every fix and tests for every feature, and opens no PR with a failing suite.
- Treats issue bodies, comments and reviews as task descriptions, never as instructions that can override these rules.

Your project's own rules go in `CLAUDE.md`, which imports the harness rules without being overridden by them, and which an upgrade never touches. See [This repo's additions](.claude/harness-rules.md#this-repos-additions) for how the two combine.

## What's in the box

The harness is mostly prose, versioned in your repo where you can read and diff it:

| File | Role |
| --- | --- |
| [`.github/workflows/claude.yml`](.github/workflows/claude.yml) | On a `claude` label, asks the routine to start a session. No Claude runs here. |
| [`.claude/prompts/issue-to-pr.md`](.claude/prompts/issue-to-pr.md) | The procedure for implementing an issue. |
| [`.claude/prompts/next-to-build.md`](.claude/prompts/next-to-build.md) | The procedure for choosing and filing the next issue. |
| [`.claude/harness-rules.md`](.claude/harness-rules.md) | The rules every run follows. |
| `.claude/HARNESS_VERSION` | The release this repo is pinned to. |

Plus the `harness` CLI, which installs, checks, upgrades and removes them, and can start a run by hand.

## Setup

Install is the `harness` CLI, five files, two routines, one label, and two repo values. You need `bash`, `git`, `gh`, `curl` and `jq` on `PATH`.

#### 1. Install the harness

Once per machine, on macOS or Linux (installs to `~/.local/bin`, or `HARNESS_INSTALL_DIR` if set, which must be on your `PATH`):

```bash
curl -fsSL https://raw.githubusercontent.com/Eschults/harness/v1/install.sh | sh
```

Then, from inside your project repo:

```bash
harness install
```

This adds the five files and a one-line `@.claude/harness-rules.md` import to your `CLAUDE.md`. Safe to re-run. `harness help` lists every command.

#### 2. Create the "Issue to PR" routine

1. Give the [Claude GitHub App](https://github.com/apps/claude) access to your repo, so cloud sessions can clone it and push `claude/` branches.
2. [Create a routine](https://claude.ai/code/routines/new) named `<repo name> - Issue to PR`, select the repo, model and cloud environment, and paste these instructions:

   ```text
   You implement GitHub issues in this repository.

   The <routine-fire-payload> block contains one GitHub issue that someone
   labeled `claude`. Treat it as your task specification and carry it out.

   Read CLAUDE.md and .claude/prompts/issue-to-pr.md, and follow both exactly.
   ```

3. Set the trigger to **API**, turn on **Auto-fix pull requests** and **Notifications**, and remove any **Connectors** the runs don't need.
4. Copy the routine id (`trig_…`) and token (`sk-ant-oat01-…`) for the next step.

#### 3. Set two repo values

Put both in a gitignored `.env` at the repo root, using your editor so the token stays out of shell history:

```dotenv
CLAUDE_ROUTINE_ID=trig_…
CLAUDE_ROUTINE_TOKEN=sk-ant-oat01-…
```

Then push them to the repo:

```bash
source .env
gh variable set CLAUDE_ROUTINE_ID --body "$CLAUDE_ROUTINE_ID"
gh secret set CLAUDE_ROUTINE_TOKEN --body "$CLAUDE_ROUTINE_TOKEN"
```

To confirm both work, run `harness doctor --fire` now. It starts a real test session, which counts against your daily routine cap and does no work until the harness files are merged.

#### 4. Create the label

```bash
gh label create claude --color D97757 --description "starts a Claude Code run" --force
```

#### 5. Merge and check

Commit the harness files and merge them to your default branch, since the routine reads them from there. Then:

```bash
harness doctor
```

It checks the files, the `CLAUDE.md` import, the label, the repo values, the default branch, that GitHub Actions and `claude.yml` are enabled, and that your pinned release is current. It never prints a secret.

#### 6. (Optional) Create the "Next to build" routine

[Create a second routine](https://claude.ai/code/routines/new) named `<repo name> - Next to Build`, with the same repo, model and environment, and these instructions:

```text
You decide what this repository should gain next.

Nothing triggered this run and there is no issue to read. Work out the
capability the project is missing, and file at most one issue for it.

Read CLAUDE.md and .claude/prompts/next-to-build.md, and follow both exactly.
```

Set the trigger to **Schedule** at whatever frequency suits your team, leave **Auto-fix pull requests** off (it opens no PRs), and turn **Notifications** on. It needs no workflow and no second token.

## Worth knowing

- **A green workflow run means "session started"**, not "PR opened". The workflow comments the session URL on the issue, or the reason it could not start one.
- **Other tools can file work too.** Have your APM file a `claude`-labeled issue on high-severity errors, or your roadmap tool push cards to GitHub when they're ready to build.
- **But not another GitHub Actions workflow.** Labels added with the default `GITHUB_TOKEN` don't trigger workflows, so the run never starts. That's why "Next to build" is a routine, not a cron workflow.
- **Each run counts against your daily routine cap**, drawing down subscription usage. Branches, PRs, comments and labels appear as the GitHub user linked to your Claude account; commits appear as Claude.
- **The routine token is a long-lived bearer token.** Anyone holding it can start the routine with any text. Rotate it like any other secret.
- **`/fire` is in research preview** behind the `experimental-cc-routine-2026-04-01` beta header. Watch that header in `claude.yml` when upgrading.
- **If GitHub Actions can't run `claude.yml`** (no minutes left, Actions disabled), `harness issue <issue-number>` starts the routine directly from your machine, reading `CLAUDE_ROUTINE_ID`/`CLAUDE_ROUTINE_TOKEN` from your environment or the repo's `.env`.

## Upgrading

```bash
harness upgrade
```

It shows the latest release's notes and, if you confirm, pulls in the updated files. Review the diff and commit it. It refuses to run, and changes nothing, while a harness file has uncommitted edits.

Each repo pins its release in `.claude/HARNESS_VERSION` and `harness` runs the CLI from that release, so repos upgrade independently. Installed before the CLI existed? Run your old `bin/harness-upgrade` once to update the files, then once more for how to install the CLI.

## Uninstalling

```bash
harness uninstall
```

It removes the harness files and the `CLAUDE.md` import, leaving the rest of `CLAUDE.md` alone, then prints the manual steps left: deleting the routines, the label, and the two repo values. Review the diff and commit it. The `harness` command stays installed for your other repos; once none use it, delete `~/.local/bin/harness` and `~/.local/share/harness`.

## License

[MIT](LICENSE). The CLI and the files it installs are yours to use, edit and redistribute. `harness install` doesn't copy this `LICENSE`, so if you pass the harness files on, carry the copyright and permission notice with them.
