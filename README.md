# Autonomous PR harness

Label a GitHub issue `claude` and a Claude Code session picks it up, writes the code, and opens a pull request for your team to review. A second session reviews that PR and posts its findings as comments.

Both sessions run as [Claude Code routines](https://code.claude.com/docs/en/routines) on Anthropic's cloud infrastructure, billed against a Pro, Max, Team or Enterprise subscription. There is no `ANTHROPIC_API_KEY` anywhere in this repo, and no Claude runs on your GitHub runner.

Install is four files, two routines, and two repo values.

## Shape

```
     human labels an issue `claude`
                 │
                 ▼
       .github/workflows/claude.yml ── POST /fire ──┐
       (the only thing on your runner)              │
                                                    ▼
                                      implementation routine  ◄───────┐
                                   clones repo, writes code,          │
                                        runs the test suite           │
                                                    │                 │
                        ┌───────────────────────────┴──────┐           │
                        │ work finished                    │ blocked on a
                        ▼                                  ▼ human answer
                  PR ready for review              DRAFT PR + a comment
                        │                           naming the blocker
                        ▼  pull_request event      and linking the session
                  review routine                           │           │
                        │                                  └───────────┘
                        ▼                              engineer opens the session
                findings on the PR                     and answers in place
                        │
                        ▼
                 human reviews & merges
```

The label is the entire gate. A routine's GitHub trigger only fires on `pull_request` and `release` events — it cannot subscribe to issue events — so the one workflow exists to turn `issues.labeled` into an authenticated POST. A plain GitHub webhook can't do that job, because webhooks can't send an `Authorization` header. The review routine needs no workflow at all: `pull_request` is a native trigger.

## 1. Copy the files

```bash
git clone --depth 1 -b kickstart-harness git@github.com:Eschults/harness.git /tmp/harness
cd /path/to/your/project

mkdir -p .github/workflows .claude/prompts
cp /tmp/harness/.github/workflows/claude.yml .github/workflows/
cp /tmp/harness/.claude/prompts/*.md .claude/prompts/
cat /tmp/harness/CLAUDE.md >> CLAUDE.md   # merge by hand if you already have one
```

| File | Role |
|---|---|
| `.github/workflows/claude.yml` | Fires the implementation routine on the `claude` label. |
| `.claude/prompts/issue-to-pr.md` | The implementation task, plus the routine prompt to paste. |
| `.claude/prompts/review-pr.md` | The review task, plus its routine prompt. |
| `CLAUDE.md` | Every rule both routines follow. Single source of truth. |

Each routine's saved prompt lives on claude.ai rather than in git, which is why both are a few lines that defer to `.claude/prompts/` for the task and to `CLAUDE.md` for every rule. The part that matters stays version-controlled and reviewable.

## 2. Create two routines

Install the [Claude GitHub App](https://github.com/apps/claude) on the repo first. Cloud sessions need it to clone and push `claude/` branches, and the review routine needs it for webhook delivery — `/web-setup` grants cloning but **not** webhooks.

Then at [claude.ai/code/routines](https://claude.ai/code/routines), create each routine pointing at the repo, with the prompt pasted from the bottom of the matching file:

| Routine | Prompt | Trigger |
|---|---|---|
| Implementation | `.claude/prompts/issue-to-pr.md` | **API**. Save the routine, then **Add another trigger → API → Generate token**. The token is shown once. |
| Review | `.claude/prompts/review-pr.md` | **GitHub event**: `pull_request`, actions `opened` and `ready_for_review`, filters head branch contains `claude/` and is draft = `false`. |

Neither needs a schedule. Under **Connectors**, keep GitHub and **remove everything else**: a routine includes all your connectors by default, and Claude can call any tool on an included one, writes included, without asking during a run. The routine's cloud environment is the sandbox — its network allowlist, variables and connectors are the agent's entire reach.

You can also create these from the CLI with `/schedule`, which writes to the same account. The API trigger's token still has to be generated on the web; the CLI cannot create or revoke tokens.

## 3. Set two repo values

**Settings → Secrets and variables → Actions.** The id is an identifier, so it goes in the **Variables** tab; the token goes in **Secrets**.

| Name | Kind | Value |
|---|---|---|
| `CLAUDE_ROUTINE_ID` | Variable | Implementation routine's trigger id, `trig_…` |
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

## When a run opens a draft

A draft means Claude got somewhere real and then hit a decision that isn't its to make. It comments on the issue with the blocker in a sentence or two and a link back to its session, so the handoff is readable without opening the PR.

**Take over in that session.** Open the link, answer the question, and Claude continues from there with its full context intact — nothing to reconstruct, and no further routine run spent. This is the path the comment points at.

If the session is gone or you'd rather not, answer on the issue and re-apply the `claude` label. A fresh run finds the draft, reads the answer, finishes on the same branch, and marks the PR ready for review. It works, it just starts cold.

## Worth knowing before you rely on it

- **A green check means "session started"** — not "PR opened". The workflow finishes in seconds; the session outlives it and comments its URL on the issue. Both outcomes are reported on the issue, because a silently stalled `claude` label is the worst failure mode here.
- **The label must come from a human or a PAT.** GitHub does not fire downstream workflow triggers for actions taken with the default `GITHUB_TOKEN`, so an automation that labels issues with it creates a green run that never invokes Claude.
- **Add branch protection requiring CI and a human approval.** The harness assumes it and does not enforce it. This matters more than it would with draft-only PRs, since finished work now arrives ready for review.
- **Each issue costs up to two runs** against your account's daily routine cap, and draws down subscription usage rather than API billing. Branches, PRs, comments and labels all appear as your GitHub user.
- **Every connector left attached is a tool the agent can write with, unprompted.** Cloud sessions have no `--allowedTools` and no approval prompts; the prompt is guidance, the connector list is the actual permission boundary.
- **The trigger token is a long-lived bearer token.** Anyone holding it can fire the routine with arbitrary text. Rotate it like any other repo secret.
- **`/fire` is in research preview** behind the `experimental-cc-routine-2026-04-01` beta header. Watch that header in `claude.yml` when upgrading.
- **Nothing closes the loop on a dead session.** If a run dies mid-work the label stays on and nobody is told; you notice it in the label list, not from an alert.
