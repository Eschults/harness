# Project conventions for autonomous agent runs

These rules apply to any Claude Code run in this repository, interactive or
automated (GitHub Actions).

## Scope discipline
- Touch only the files needed for the issue at hand. Do not opportunistically
  refactor, rename, or reformat unrelated code.
- Never edit `.github/workflows/`, `Dockerfile`, `infra/`, or anything under
  `migrations/` without explicit human instruction in the issue itself.
- Never add or upgrade a dependency unless the issue explicitly calls for it.

## Testing
- Every bug fix must include a regression test that fails before the fix and
  passes after it.
- Every new feature must include tests covering the happy path and at least
  one edge case.
- Run the full test suite (`npm test`) before opening a PR. Do not open a PR
  with failing tests.

## Pull requests
- Always open as **draft**. Never mark ready for review or merge.
- Title format: `Fix: <summary>` or `Feat: <summary>`.
- Include "Fixes #<issue-number>" in the description when applicable.
- Describe root cause (bugs) or approach (features) in 2-4 sentences.
- Keep diffs small. If a fix would require touching more than ~5 files,
  stop and comment on the issue explaining the scope instead of proceeding.

## When to stop instead of guessing
Stop and comment on the issue instead of opening a PR when:
- The requirement is ambiguous and a wrong guess would ship the wrong thing
- The fix touches auth, payments, permissions, or PII handling
- The fix requires a schema or migration change
- Fixing it "properly" conflicts with fixing it "quickly" and the issue
  doesn't say which the team wants
