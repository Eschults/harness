# shellcheck shell=bash
# Shared by bin/harness-upgrade and bin/harness-doctor. Meant to be sourced,
# not run directly: it expects curl and jq on PATH and does no error
# handling of its own, so a caller under `set -euo pipefail` sees a lookup
# failure as this function's command substitution returning non-zero.

harness_tags_url() {
  echo "${HARNESS_TAGS_URL:-https://api.github.com/repos/Eschults/harness/tags}"
}

latest_harness_version() {
  local tags_url
  tags_url=$(harness_tags_url)
  # grep matching nothing is fine; pipefail would otherwise abort with no message.
  curl -fsSL "$tags_url" | jq -r '.[].name' | { grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || true; } | sort -V | tail -1
}
