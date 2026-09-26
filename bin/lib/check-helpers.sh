# shellcheck shell=bash
# Shared by the bin/check-* functional round-trip scripts. Meant to be
# sourced, not run directly.

fail() {
  echo "✗ $1" >&2
  exit 1
}

# Makes a hardcoded fallback URL fail fast instead of reaching the real network.
poison_network() {
  export http_proxy="http://127.0.0.1:1"
  export https_proxy="http://127.0.0.1:1"
}
