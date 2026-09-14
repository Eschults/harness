# Autonomous PR harness: Sentry errors + Notion roadmap → Claude Code

## Shape of the system

```
Sentry (5xx error)              Notion (card → "Ready for Dev")
       |                                    |
       v                                    v
 GitHub issue,                    notion-roadmap-sync.yml (cron)
 label "sentry"                   creates GitHub issue,
       |                          label "agent-ready" + "from-notion"
       v                                    |
 sentry-triage.yml                          |
 (fires a read-only                         |
 triage routine)                            |
       |                                    |
       | session adds "agent-ready"         |
       +--------------------+---------------+
                            |
                            v
                claude-issue-to-pr.yml
                (fires a Claude Code routine)
                            |
                            v
                 Remote Claude Code session
                 on Anthropic cloud infra
                 (clones repo, full tool access,
                 opens a DRAFT pull request)
                            |
                            v
                   Human reviews & merges
```

One execution path, two triage-gated entry points. The Sentry path adds an extra triage step because errors arrive with no human judgment attached — you want a cheap model to filter out "not actually fixable by an agent" before spending a full agentic run on it. The Notion path skips triage because moving a card to "Ready for Dev" already *is* the human judgment call.

Neither Claude step runs on the GitHub runner. Both POST to a [Claude Code routine](https://code.claude.com/docs/en/routines)'s API trigger, which spawns a remote cloud session on Anthropic-managed infrastructure that clones the repo and does the work. The runner's whole job is turning a GitHub issue event into an authenticated HTTP call, via the shared `.github/actions/fire-claude-routine` composite action, and recording the session URL back onto the issue. There are two routines: a cheap read-only one that triages, and a full one that implements.

Consequences worth knowing before you rely on this: a green check on either workflow means "session started", not "verdict recorded" or "PR opened"; both routines belong to one claude.ai account, so branches, PRs, labels, and connector writes appear as that user; runs draw down that account's subscription usage and its daily routine run cap rather than API-key billing; and each routine's saved prompt lives on claude.ai rather than in git, which is why both are kept to a few lines that defer to `.claude/prompts/` for the task and to [`CLAUDE.md`](CLAUDE.md), the single rulebook, for every rule and guardrail.

Triage being asynchronous is fine — the chain was always "label applied → next workflow", never "job output → next job", so an untriaged `sentry` issue is now briefly a normal state rather than a bug. Triage sharing the daily routine cap with implementation is less fine, and is the main thing to watch; see the last section.

## One-time setup

1. **Install the [Claude GitHub App](https://github.com/apps/claude) on this repository.** Cloud sessions need it to clone the repo and push `claude/` branches. No `ANTHROPIC_API_KEY` is involved anywhere in this harness any more — routines authenticate with their own per-routine trigger tokens.

2. **Create the implementation routine.** At [claude.ai/code/routines](https://claude.ai/code/routines), create a routine pointed at this repository, using the routine prompt at the bottom of [`.claude/prompts/issue-to-pr.md`](.claude/prompts/issue-to-pr.md). Then edit it, add an **API** trigger, and click **Generate token** — the token is shown once. Save it as the `CLAUDE_ROUTINE_TOKEN` repo secret and the routine id (`trig_...`) as the `CLAUDE_ROUTINE_ID` repo variable. Pick the routine's cloud environment deliberately: its network allowlist, environment variables, and connector list are the sandbox the agent runs in, and every connector you leave attached is a tool the agent can write with, unprompted.

3. **Create the triage routine**, the same way, using the routine prompt at the bottom of [`.claude/prompts/sentry-triage.md`](.claude/prompts/sentry-triage.md). Store its token and id as `CLAUDE_TRIAGE_ROUTINE_TOKEN` and `CLAUDE_TRIAGE_ROUTINE_ID`. Two things matter here: pick a cheap model in the routine's model selector, since triage is a yes/no call rather than a coding task; and attach your GitHub connector and nothing else, because the label it applies is the only output this routine has and any other connector is reach it does not need.

4. **Copy these files into the repo:**
   - `.github/workflows/claude-issue-to-pr.yml`
   - `.github/workflows/sentry-triage.yml`
   - `.github/workflows/notion-roadmap-sync.yml`
   - `.github/actions/fire-claude-routine/action.yml`
   - `.claude/prompts/issue-to-pr.md`
   - `.claude/prompts/sentry-triage.md`
   - `scripts/notion-poll.mjs` and `scripts/package.json`
   - `CLAUDE.md` (merge with your existing one if you have one)

5. **Sentry side:** install Sentry's GitHub integration from **Settings > Integrations > GitHub**, granting it access to this repository. Then create an issue alert under **Project Settings > Alerts** shaped like this:
   - **WHEN**: `A new issue is created`. Use this trigger, not a frequency threshold — see below.
   - **IF**: optionally `level equals error` or `fatal`, to keep cosmetic noise out. If you want volume gating, express it here (`issue is seen more than X times in Y`) rather than as the trigger.
   - **THEN**: `Create a new GitHub issue`, pointed at this repo, with `sentry` in the **Labels** field. The label has to be applied at creation time or the `issues.opened` event fires without it and triage never runs.
   - **Action interval**: set it high, as a backstop against one issue firing the rule repeatedly.

   Note that issue linking and creation requires a Sentry **Team, Business, or Enterprise** plan. On the free Developer plan the integration still gives you suspect commits and stack trace linking, but the "create a GitHub issue" action isn't available, which leaves this entry point dead.

   **On deduping:** Sentry's ticket actions have no "skip if already linked" logic — every firing creates a new GitHub issue unconditionally. The dedupe comes from the `A new issue is created` trigger, because a Sentry issue group is created once and later identical events fold into it without re-triggering. A frequency threshold like `>10 events/hour` re-fires every action interval for as long as the error stays hot, filing a fresh `sentry`-labelled issue each time — and each of those now costs a cloud session and a slot against the daily routine cap. The tradeoff of the trigger we recommend is that it does not fire on regressions: an error you resolved that comes back moves resolved to unresolved and files nothing. Add `The issue changes state from resolved to unresolved` as a second WHEN condition if you want those triaged, accepting that a flapping error will then file repeatedly.

6. **Notion side:**
   - Create an internal Notion integration, copy its API key into the
     `NOTION_API_KEY` repo secret.
   - Share your roadmap database with that integration (Notion databases
     are private to integrations until you explicitly share them).
   - Copy the database ID into `NOTION_DATABASE_ID`.
   - Add a `GitHub Issue` URL property to the database if it doesn't
     already have one — the script uses it as the "already synced" marker.

7. **Create a PAT for the Notion sync script:** a fine-grained token scoped
   to this repo with Issues: read/write, saved as `NOTION_SYNC_PAT`. This
   is not optional — see the comment in `notion-roadmap-sync.yml` for why
   the default `GITHUB_TOKEN` silently breaks this specific flow (GitHub
   doesn't fire downstream workflow triggers for content created by the
   default token, to prevent recursive workflow loops).

## Guardrails already built in

All rules the agent follows live in [`CLAUDE.md`](CLAUDE.md) — that is the single source of truth, and this section deliberately does not restate them. What the *harness* enforces structurally, on top of those rules:

- **A label gate before anything writes code.** Nothing reaches the implementation routine without `agent-ready`, which only triage or the Notion sync applies.
- **Triage before spend.** The Sentry path runs a cheap read-only pass on a small model first, so a wave of low-value errors doesn't become a wave of low-value PRs.
- **Least reach per routine.** Cloud sessions have no `--max-turns` or `--allowedTools`; the equivalent controls are set on each routine — its model, its cloud environment's network allowlist, its attached connectors, and the repositories it can clone. The triage routine gets the GitHub connector and nothing else.
- **Untrusted input stays data.** `fire-claude-routine` passes issue text to the API through environment variables rather than `${{ }}` interpolation inside a shell script, and the routine receives it inside a `<routine-fire-payload>` block marked as data rather than instructions.
- **Claim-before-create in the Notion sync.** A card is marked in-progress before its issue exists, so a crash between the two steps strands one card visibly instead of re-filing it every 15 minutes.
- **Concurrency groups** keyed on issue number stop one issue spawning parallel dispatches. This guards the dispatch only — two sessions fired seconds apart are independent cloud sessions with nothing coordinating them.
- **Branch protection at the source.** Cloud sessions push to `claude/`-prefixed branches; pushes elsewhere are rejected if the branch is protected, carries someone else's open PR, or has commits by another author.
- **Every dispatch is announced on the issue**, with the session URL on success and the Actions run URL on failure, so a lost session leaves a trace. A failed triage dispatch also labels the issue `needs-human`.

## Things worth tightening before you trust this in production

- Add branch protection requiring CI to pass and at least one human
  approval before merge — the harness assumes this exists, it doesn't
  enforce it itself.
- Consider running `claude-code-action`'s official `claude-code-security-review` action on any PR the agent opens, as a second automated check before a human even looks at it.
- Nothing currently closes the loop when a session dies or decides to do nothing: the issue keeps its `agent-ready` label and quietly stalls. A scheduled reconciliation job that lists routine runs and flags issues with a session comment but no PR after N hours would fix this.
- `scripts/` has no committed lockfile. Run `npm install` there once and commit `package-lock.json` so the sync job's `npm ci` is reproducible.
- `notion-poll.mjs` assumes the roadmap's Status column is a Notion **Select** property. Default Notion boards use the **Status** property type instead, which needs `status:` rather than `select:` in the query filter and the update. Check which type your database uses before the first run.
- **Collapse the Sentry path into one routine.** Now that triage is asynchronous too, splitting it from implementation costs a second cloud session and a second slot against the daily routine cap while buying nothing a single prompt couldn't do ("triage this; if it passes, implement it; otherwise label `needs-human` and stop"). The two-routine split is worth keeping only if you want the triage verdict visible as a label before any implementation run starts. Until then, keep the Sentry alert rule narrow — a burst of new error groups can now exhaust the daily cap and starve the Notion path, which is the opposite of what a triage gate is for.
- Routine trigger tokens are long-lived bearer tokens, and anyone holding one can fire the routine with arbitrary `text`. The `<routine-fire-payload>` wrapper means that text arrives as data rather than instructions, but rotate the tokens from the routine's API trigger modal on the same schedule as any other repo secret.
- The `/fire` endpoint is in research preview under the `experimental-cc-routine-2026-04-01` beta header. Breaking changes ship behind new dated headers with the two previous versions still working, so pin your attention to that header in `fire-claude-routine/action.yml` when upgrading.
