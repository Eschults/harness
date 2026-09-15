# Autonomous PR harness

Label a GitHub issue `claude` and a Claude Code session picks it up, writes the code, opens a pull request, reviews its own diff, and comments a recap of what it found and fixed. Your team reviews and merges.

It runs as a [Claude Code routine](https://code.claude.com/docs/en/routines) on Anthropic's cloud infrastructure, billed against a Pro, Max, Team or Enterprise subscription. There is no `ANTHROPIC_API_KEY` anywhere in this repo, and no Claude runs on your GitHub runner.

Install is three files, one routine, and two repo values.

## Shape

```
   human labels an issue `claude`
               │
               ▼
     .github/workflows/claude.yml ── POST /fire ──┐
     (the only thing on your runner)              │
                                                  ▼
                                            one routine  ◄─────────┐
                                     clones repo, writes code,     │
                                          runs the test suite      │
                                                  │                │
                    ┌─────────────────────────────┴──────┐          │
                    │ work finished                      │ blocked on a
                    ▼                                    ▼ human answer
              PR ready for review             DRAFT PR + comment:
                    │                         the blocker, and a
                    ▼ same session             link to the session
           /code-review --fix on its own diff            │          │
                    │                                    └──────────┘
          ┌─────────┴──────────┐               engineer opens the session
          ▼                    ▼               and answers in place
   fixes pushed to      recap comment:
   the PR branch        found / fixed / left,
          │             + link to the session
          └─────────┬──────────┘
                    ▼
            human reviews & merges
                    │
                    ▼  CI fails, or someone comments
            Auto-fix pushes a fix
            (routine setting, no webhook)
```

The label is the entire gate. A routine's GitHub trigger only fires on `pull_request` and `release` events — it cannot subscribe to issue events — so the one workflow exists to turn `issues.labeled` into an authenticated POST. A plain GitHub webhook can't do that job, because webhooks can't send an `Authorization` header.

## 1. Copy the files

```bash
git clone --depth 1 git@github.com:eschults-engineering/harness.git /tmp/harness
cd /path/to/your/project

mkdir -p .github/workflows .claude/prompts
cp /tmp/harness/.github/workflows/claude.yml .github/workflows/
cp /tmp/harness/.claude/prompts/issue-to-pr.md .claude/prompts/
cat /tmp/harness/CLAUDE.md >> CLAUDE.md   # merge by hand if you already have one
```

| File | Role |
|---|---|
| `.github/workflows/claude.yml` | Fires the routine on the `claude` label. |
| `.claude/prompts/issue-to-pr.md` | The task, plus the routine prompt to paste. |
| `CLAUDE.md` | Every rule the routine follows. Single source of truth. |

The routine's saved prompt lives on claude.ai rather than in git, which is why it is five lines that defer to `.claude/prompts/` for the task and to `CLAUDE.md` for every rule. The part that matters stays version-controlled and reviewable.

## 2. Create the routine

Install the [Claude GitHub App](https://github.com/apps/claude) on the repo first — cloud sessions need it to clone and push `claude/` branches.

At [claude.ai/code/routines](https://claude.ai/code/routines): point the routine at the repo, paste the prompt from the bottom of `.claude/prompts/issue-to-pr.md`, and add an **API** trigger. Save first, then **Add another trigger → API → Generate token** — the URL and token only exist once the routine has an id, and the token is shown once.

It needs no schedule and no GitHub event trigger. Three settings are worth getting right:

- **Connectors: remove all of them.** A routine includes every connector on your account by default, and Claude can call any tool on an included one, writes included, without asking during a run. This routine needs none — `gh` is pre-installed in cloud sessions and reads `GH_TOKEN` automatically, which covers issues, labels, comments and PRs.
- **Behavior → Auto-fix pull requests: on.** It watches CI and review comments on PRs the routine opens and pushes fixes. This is what handles the two things the session cannot: CI that fails after it exits, and review comments your engineers leave. A human comments, Claude pushes a fix, no webhook involved.
- **Model**: whatever you'd want writing code unattended.

You can also create the routine from the CLI with `/schedule`, which writes to the same account. The API trigger's token still has to be generated on the web; the CLI cannot create or revoke tokens.

## 3. Set two repo values

**Settings → Secrets and variables → Actions.** The id is an identifier, so it goes in the **Variables** tab; the token goes in **Secrets**.

| Name | Kind | Value |
|---|---|---|
| `CLAUDE_ROUTINE_ID` | Variable | The routine's trigger id, `trig_…` |
| `CLAUDE_ROUTINE_TOKEN` | Secret | Its API trigger token, `sk-ant-oat01-…` |

Prove them before involving a workflow:

```bash
curl -X POST "https://api.anthropic.com/v1/claude_code/routines/$CLAUDE_ROUTINE_ID/fire" \
  -H "Authorization: Bearer $CLAUDE_ROUTINE_TOKEN" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "Setup check. Reply with the repo name and stop."}'
```

It returns a session URL, or names the reason it didn't.

## Labels

| Label | Applied by | Means |
|---|---|---|
| `claude` | a human | **the gate** — work starts on this, and the routine removes it when done |
| `needs-human` | the routine | it declined, and said why in a comment |

The `claude` label stays on while a run is in flight and comes off at every terminal outcome, so the label always means "waiting for an agent". A crashed run leaves it on deliberately: re-applying it retries, and the routine looks for an existing PR first so the retry can't open a second one.


## Worth knowing before you rely on it

- **A green check means "session started"** — not "PR opened". The workflow finishes in seconds; the session outlives it and comments its URL on the issue. Both outcomes are reported on the issue, because a silently stalled `claude` label is the worst failure mode here.
- **The label must come from a human or a PAT.** GitHub does not fire downstream workflow triggers for actions taken with the default `GITHUB_TOKEN`, so an automation that labels issues with it creates a green run that never invokes Claude.
- **Add branch protection requiring CI and a human approval.** The harness assumes it and does not enforce it. It is the only gate in the whole design.
- **One run per issue** against your account's daily routine cap, drawing down subscription usage rather than API billing. Auto-fix passes and re-labels cost additional runs. Branches, PRs, comments and labels all appear as your GitHub user.
- **Every connector left attached is a tool the agent can write with, unprompted.** Cloud sessions have no `--allowedTools` and no approval prompts, so the prompt is guidance and the connector list is the actual permission boundary. This routine needs none; leave the list empty.
- **The trigger token is a long-lived bearer token.** Anyone holding it can fire the routine with arbitrary text. Rotate it like any other repo secret.
- **`/fire` is in research preview** behind the `experimental-cc-routine-2026-04-01` beta header. Watch that header in `claude.yml` when upgrading.
- **Nothing closes the loop on a dead session.** If a run dies mid-work the label stays on and nobody is told; you notice it in the label list, not from an alert. Turning on routine notifications is the cheap mitigation.
