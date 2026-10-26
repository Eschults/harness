# shellcheck shell=bash
# Legacy: pre-CLI installs' bin/harness-upgrade sources this to pull in a release; keep HARNESS_FILES in sync with bin/harness-cli.
HARNESS_FILES=(
  ".github/workflows/claude.yml"
  ".claude/prompts/issue-to-pr.md"
  ".claude/prompts/next-to-build.md"
  ".claude/harness-rules.md"
  ".claude/harness-review.md"
  ".claude/HARNESS_VERSION"
)

fetch_harness_files() {
  for f in "${HARNESS_FILES[@]}"; do
    # shellcheck disable=SC2154 # src is set by the caller before sourcing this file
    curl -fsSL "$src/$f" -o "$f"
  done
  echo "The harness is now a CLI: run bin/harness-upgrade once more for how to switch to it."
}

# A #77-era bin/harness-upgrade calls this last; bin/harness-doctor and bin/harness-uninstall no longer exist to refresh.
refresh_optional_files() { :; }
