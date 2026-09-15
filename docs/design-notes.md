# Design notes

Why the harness is shaped the way it is. Not needed to install it — [README.md](../README.md) covers that.

## Why nothing runs Claude on the runner

Both Claude steps POST to a [routine](https://code.claude.com/docs/en/routines)'s API trigger, which spawns a remote cloud session on Anthropic-managed infrastructure that clones the repo and does the work. The runner's whole job is turning a GitHub issue event into an authenticated HTTP call, via the shared `.github/actions/fire-claude-routine` composite action, and recording the session URL back onto the issue.

The consequence is that a green check means "session started", not "PR opened". The session is the unit of work, the Actions run is only the doorbell.

Each routine's saved prompt lives on claude.ai rather than in git. That is why both are kept to a few lines that defer to `.claude/prompts/` for the task and to `CLAUDE.md` for every rule — the part that matters stays version-controlled and reviewable.

## Why the Sentry path has a triage step and the Notion path does not

Errors arrive with no human judgment attached, so a cheap read-only pass filters out "not actually fixable by an agent" before a full agentic run is spent on it. Moving a Notion card to "Ready for Dev" already *is* that judgment, so a second opinion would only add latency and cost.

Triage being asynchronous is fine: the chain was always "label applied → next workflow", never "job output → next job", so an untriaged `sentry` issue is briefly a normal state rather than a bug.

Triage sharing the daily routine cap with implementation is less fine, and is the main thing to watch. **Collapsing the Sentry path into one routine is the obvious next simplification** — now that triage is asynchronous too, splitting it costs a second cloud session and a second slot against the cap while buying nothing a single prompt couldn't do ("triage this; if it passes, implement it; otherwise label `needs-human` and stop"). The split is worth keeping only if you want the verdict visible as a label before any implementation run starts.

## Why the Sentry trigger is "A new issue is created"

Sentry's ticket actions have no "skip if already linked" logic — every firing creates a new GitHub issue unconditionally. The dedupe comes from the trigger: a Sentry issue *group* is created once, and later identical events fold into it without re-triggering.

A frequency threshold like `>10 events/hour` re-fires every action interval for as long as the error stays hot, filing a fresh `sentry`-labelled issue each time — and each one now costs a cloud session and a slot against the daily cap. If you want volume gating, express it as an IF condition rather than as the trigger.

The tradeoff: it does not fire on regressions. An error you resolved that comes back moves resolved → unresolved and files nothing. Add `The issue changes state from resolved to unresolved` as a second WHEN condition if you want those triaged, accepting that a flapping error will then file repeatedly.

## Why the Notion sync needs its own PAT

GitHub does not fire downstream workflow triggers for content created or labeled with the default `GITHUB_TOKEN`, to prevent recursive workflow loops. Using it in `notion-roadmap-sync.yml` would create the issue and silently never invoke Claude — a green cron job that did nothing.

The triage routine avoids the same trap differently: it labels issues through the GitHub *connector*, which is a real user identity, so the label it applies does fire `issues.labeled`.

## Why the Notion sync claims a card before creating its issue

A card is marked in-progress before its issue exists, so a crash between the two steps strands one card visibly instead of re-filing it every 15 minutes. A claimed card with no issue link is recoverable by hand; a duplicate issue is a duplicate cloud session against the daily cap, every 15 minutes, forever.

The run also fails loudly if any card failed, rather than reporting success — a green cron job that synced nothing is how this entry point dies quietly.

## Guardrails the harness enforces structurally

All rules the *agent* follows live in `CLAUDE.md`. What the harness enforces on top of those:

- **A label gate before anything writes code.** Nothing reaches the implementation routine without `agent-ready`, applied only by triage or the Notion sync.
- **Triage before spend**, so a wave of low-value errors doesn't become a wave of low-value PRs.
- **Least reach per routine.** Cloud sessions have no `--max-turns` or `--allowedTools`; the equivalent controls are the routine's model, its cloud environment's network allowlist, its attached connectors, and the repos it can clone. Triage gets the GitHub connector and nothing else.
- **Untrusted input stays data.** `fire-claude-routine` passes issue text to the script through the environment, never through `${{ }}` inside a `run:` block, so a backtick or `$(...)` in an issue title cannot execute on the runner. Claude receives it wrapped in `<routine-fire-payload>`, marked as data, which is why each routine prompt has to explicitly opt in to acting on it.
- **Concurrency groups** keyed on issue number stop one issue spawning parallel dispatches. This guards the dispatch only — two sessions fired seconds apart are independent, with nothing coordinating them.
- **Branch protection at the source.** Cloud sessions push to `claude/`-prefixed branches; pushes elsewhere are rejected if the branch is protected, carries someone else's open PR, or has commits by another author.
- **Every dispatch is announced on the issue**, with the session URL on success and the Actions run URL on failure, so a lost session leaves a trace. A failed triage dispatch also labels `needs-human`.

## Still open

- Nothing closes the loop when a session dies or decides to do nothing: the issue keeps `agent-ready` and stalls. A scheduled job listing routine runs and flagging issues with a session comment but no PR after N hours would fix it.
- Consider running `claude-code-action`'s `claude-code-security-review` on any PR the agent opens, as a second automated check before a human looks.
- `scripts/` has no committed lockfile until you run `npm install` there once.
