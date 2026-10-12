# shellcheck shell=bash
# Legacy: pre-CLI installs' bin/harness-upgrade fetches and sources this; bin/harness has its own copy.

harness_tags_url() {
  echo "${HARNESS_TAGS_URL:-https://api.github.com/repos/Eschults/harness/tags}"
}

latest_harness_version() {
  local tags_url
  tags_url=$(harness_tags_url)
  # grep matching nothing is fine; pipefail would otherwise abort with no message.
  curl -fsSL "$tags_url" | jq -r '.[].name' | { grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || true; } | sort -V | tail -1
}
