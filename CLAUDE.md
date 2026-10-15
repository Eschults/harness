## This repo

- This repository *is* the harness, so `.claude/harness-rules.md` is the source here rather than a rules to follow, you are allowed to edit them.
- README.md's Guardrails list is generated from each `.claude/harness-rules.md` section's first sentence: after editing the rules, run `bin/sync-readme` (`bin/ci` fails until you do).
- The test suite is `bin/ci` (zero-cost checks on this repo's own rules text — no model calls). Run it before opening a PR.
- `.claude/settings.json`'s `SessionStart` hook installs `shellcheck` when missing, since `bin/ci` hard-requires it and a fresh autonomous session has no other way to get it.
- Prompts and rules (`.claude/prompts/`, `.claude/harness-rules.md`) never name a specific tool such as `gh` or a GitHub MCP. Describe what to query instead (filters, state, paging), since routine environments differ and `gh` may not be installed.
