# Harness review rules

What a reviewer flags in a PR an autonomous run opened, at what severity, and what it skips. The `/code-review` and `/security-review` passes in the Review step of `.claude/prompts/issue-to-pr.md` apply these rules to every self-review. `harness install`/`harness upgrade` also copy this file's content into a marked block in the repo's `REVIEW.md`, so a plan that runs the managed Code Review service applies the same rules there too.

## Always blocking

- The diff touches a never-edit path or a stop topic (auth, payments, permissions, PII, schema/migrations) and the PR is not a draft asking that question.
- A PR from a `claude/` branch edits `.claude/harness-rules.md`, `.claude/harness-review.md`, `REVIEW.md`, `CLAUDE.md`, `.claude/settings.json`, or `.github/workflows/`. A PR must not rewrite the rules that review it.
- A bug fix with no regression test.
- A test that asserts source text rather than behaviour.
- A PR description that claims something the diff does not do, or that omits `Fixes #N` when applicable.

## Flag, don't block

- A dependency added or upgraded that the issue did not ask for.
- A refactor unrelated to the issue.
- A diff over the cap with no slice note.
- A code comment that records a finding or narrates the work, rather than explaining a non-obvious why.

## Skip

- Formatting a linter already owns.
- Generated files and lockfiles.
- Review-only screenshots.
- Lines the diff did not touch, unless the diff breaks them.

## Format

- One line per finding.
- Severity first.
- No praise.
