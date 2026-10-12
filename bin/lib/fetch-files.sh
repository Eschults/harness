# shellcheck shell=bash
# Shared by bin/harness-install and bin/harness-upgrade. Meant to be sourced,
# not run directly: it expects the caller to have set $src and cd'd to the
# repo root already.
HARNESS_FILES=(
  ".github/workflows/claude.yml"
  ".claude/prompts/issue-to-pr.md"
  ".claude/prompts/next-to-build.md"
  ".claude/harness-rules.md"
  ".claude/HARNESS_VERSION"
  "bin/fire-issue"
)

fetch_harness_files() {
  for f in "${HARNESS_FILES[@]}"; do
    # shellcheck disable=SC2154 # src is set by the caller before sourcing this file
    curl -fsSL "$src/$f" -o "$f"
    case "$f" in bin/*) chmod +x "$f" ;; esac
  done
}

# Tools fetched by hand per the README, not part of HARNESS_FILES, so an
# adopter who skipped one keeps skipping it across upgrades.
OPTIONAL_HARNESS_FILES=(
  "bin/harness-doctor"
  "bin/harness-uninstall"
)

# Refreshes each optional tool the adopter already has, leaving the ones
# they don't fetch absent. Downloads to a temp file and only moves it into
# place on success, so a failed download leaves the existing tool untouched.
refresh_optional_files() {
  for f in "${OPTIONAL_HARNESS_FILES[@]}"; do
    [ -e "$f" ] || continue
    # shellcheck disable=SC2154 # src is set by the caller before sourcing this file
    curl -fsSL "$src/$f" -o "$f.new"
    chmod +x "$f.new"
    mv "$f.new" "$f"
  done
}
