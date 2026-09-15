# Autonomous PR harness

Drop-in GitHub Actions that turn a Sentry error or a Notion roadmap card into a draft pull request, written by a [Claude Code routine](https://code.claude.com/docs/en/routines) running on Anthropic's cloud infrastructure. No Claude runs on your runner; no `ANTHROPIC_API_KEY` is involved. The runner only turns an issue event into an authenticated POST.

Install is: copy eight files, create two routines, set seven secrets, wire up Sentry and Notion. [docs/design-notes.md](docs/design-notes.md) explains why it is shaped this way.

## Shape

```
Sentry (new issue)                    Notion (card → "Ready for Dev")
        │                                          │
        │ creates GH issue, label "sentry"         │ notion-roadmap-sync.yml (cron, 15m)
        ▼                                          │ creates GH issue,
  sentry-triage.yml                                │ labels "agent-ready" + "from-notion"
  (cheap read-only routine                         │
   labels agent-ready / needs-human)               │
        │                                          │
        └──────────────► "agent-ready" ◄───────────┘
                               │
                               ▼
                    claude-issue-to-pr.yml
                               │
                               ▼
                 remote Claude Code session
                 (clones repo, opens DRAFT PR)
                               │
                               ▼
                     human reviews & merges
```

Both entry points converge on one label. Sentry gets a triage step because errors arrive with no human judgment attached; Notion skips it because moving a card to "Ready for Dev" *is* the judgment.

## 1. Copy the files

```bash
git clone --depth 1 -b kickstart-harness git@github.com:Eschults/harness.git /tmp/harness
cd /path/to/your/project

mkdir -p .github/workflows .github/actions .claude/prompts
cp    /tmp/harness/.github/workflows/*.yml .github/workflows/
cp -r /tmp/harness/.github/actions/fire-claude-routine .github/actions/
cp    /tmp/harness/.claude/prompts/*.md .claude/prompts/
cp -r /tmp/harness/scripts .
cat   /tmp/harness/CLAUDE.md >> CLAUDE.md   # merge by hand if you already have one

( cd scripts && npm install )               # commit package-lock.json
```

| File | Role |
|---|---|
| `.github/workflows/claude-issue-to-pr.yml` | Fires the implementation routine on `agent-ready`. |
| `.github/workflows/sentry-triage.yml` | Fires the triage routine on `issues.opened` labelled `sentry`. |
| `.github/workflows/notion-roadmap-sync.yml` | Cron poll of Notion → GitHub issues. |
| `.github/actions/fire-claude-routine/action.yml` | Shared POST to a routine's API trigger. Handles the untrusted issue text. |
| `.claude/prompts/issue-to-pr.md` | The implementation task, plus the routine prompt to paste. |
| `.claude/prompts/sentry-triage.md` | The triage task, plus its routine prompt. |
| `scripts/notion-poll.mjs`, `scripts/package.json` | The Notion sync itself. |
| `CLAUDE.md` | Every rule the agent follows. Single source of truth. |

Only using one entry point? Skip the workflows and secrets for the other.

## 2. Create two routines

Install the [Claude GitHub App](https://github.com/apps/claude) on the repo first — cloud sessions need it to clone and push `claude/` branches.

Then at [claude.ai/code/routines](https://claude.ai/code/routines), for each routine: point it at the repo, paste the routine prompt from the bottom of the matching `.claude/prompts/` file, add an **API** trigger, click **Generate token** (shown once).

| Routine | Prompt | Model | Connectors |
|---|---|---|---|
| Implementation | `.claude/prompts/issue-to-pr.md` | your normal coding model | only what the work needs |
| Triage | `.claude/prompts/sentry-triage.md` | a cheap one — it is a yes/no call | GitHub, and nothing else |

The routine's cloud environment *is* the sandbox: its network allowlist, env vars and attached connectors are the agent's reach. Every connector left attached is a tool it can write with, unprompted.

## 3. Secrets and variables

**Settings → Secrets and variables → Actions.** Ids are identifiers, so they go in the **Variables** tab; tokens and keys go in **Secrets**.

| Name | Kind | Value | Needed for |
|---|---|---|---|
| `CLAUDE_ROUTINE_ID` | Variable | Implementation routine id, `trig_…` | both paths |
| `CLAUDE_ROUTINE_TOKEN` | Secret | Its API trigger token, `sk-ant-oat01-…` | both paths |
| `CLAUDE_TRIAGE_ROUTINE_ID` | Variable | Triage routine id | Sentry |
| `CLAUDE_TRIAGE_ROUTINE_TOKEN` | Secret | Its API trigger token | Sentry |
| `NOTION_API_KEY` | Secret | Internal Notion integration key | Notion |
| `NOTION_DATABASE_ID` | Variable | Roadmap database id | Notion |
| `NOTION_SYNC_PAT` | Secret | Fine-grained PAT, this repo, **Issues: read/write** | Notion |

`NOTION_SYNC_PAT` is not optional and cannot be the default `GITHUB_TOKEN`: GitHub does not fire downstream workflow triggers for content created by it, so the issue would appear and Claude would never run.

## 4. Wire Sentry

Install Sentry's GitHub integration (**Settings → Integrations → GitHub**), then add an issue alert under **Project Settings → Alerts**:

- **WHEN** `A new issue is created` — this trigger, not a frequency threshold.
- **IF** optionally `level equals error` or `fatal`.
- **THEN** `Create a new GitHub issue` → this repo, with `sentry` in the **Labels** field.
- **Action interval**: high, as a backstop.

The label must be applied at creation time, or `issues.opened` fires without it and triage never runs. Requires a Sentry **Team plan or above**; the free Developer plan has no "create a GitHub issue" action, which leaves this entry point dead.

## 5. Wire Notion

Create an internal Notion integration, share the roadmap database with it (databases are private to integrations until you do), and give the database these properties — rename in the `CONFIG` block of `notion-poll.mjs` if yours differ:

| Property | Type | Role |
|---|---|---|
| `Name` | title | issue title |
| `Description` | rich_text | issue body |
| `Status` | **select** | needs `Ready for Dev` and `In Progress` options |
| `GitHub Issue` | url | written back by the script; its "already synced" marker |

`Status` must be a Notion **Select** property. Default Notion boards use the **Status** type instead, which needs `status:` rather than `select:` in the query filter and the update — check yours before the first run.

Adjust the cron in `notion-roadmap-sync.yml` to taste; 15 minutes is the default.

## Labels

| Label | Applied by | Means |
|---|---|---|
| `sentry` | Sentry alert | entered via the error path; triage it |
| `agent-ready` | triage routine, or Notion sync | **the gate** — implementation fires on this |
| `needs-human` | triage routine, or a failed dispatch | agent declined or never started |
| `from-notion` | Notion sync | provenance only |

## Worth knowing before you rely on it

- **A green check means "session started"** — not "PR opened" and not "verdict recorded". Both workflows finish in seconds; the session outlives them and comments its URL on the issue.
- **Triage is asynchronous.** An untriaged `sentry` issue is a normal state for a few minutes, not a bug.
- **Both routines bill to one claude.ai account**, and draw down its subscription usage and daily routine run cap — not API-key billing. Branches, PRs and labels appear as that user.
- **Triage shares that daily cap with implementation.** A burst of new Sentry error groups can exhaust it and starve the Notion path, which is the opposite of what a triage gate is for. Keep the alert rule narrow.
- **Nothing closes the loop on a dead session**: the issue keeps `agent-ready` and stalls silently. Reconciliation is not built yet.
- **Routine trigger tokens are long-lived bearer tokens.** Anyone holding one can fire the routine with arbitrary text. Rotate them like any other repo secret.
- The `/fire` endpoint is in research preview behind `experimental-cc-routine-2026-04-01`. Watch that header in `fire-claude-routine/action.yml` when upgrading.

Add branch protection requiring CI and a human approval before merge — the harness assumes it, it does not enforce it.
