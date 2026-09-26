# shellcheck shell=bash
# Shared by the bin/check-* functional round-trip scripts. Meant to be
# sourced, not run directly.

fail() {
  echo "✗ $1" >&2
  exit 1
}

# Poisons http(s)_proxy so a hardcoded fallback URL (i.e. $HARNESS_SRC or
# $HARNESS_TAGS_URL support missing or broken) fails fast instead of quietly
# reaching the real network; file:// fetches never go through a proxy.
poison_network() {
  export http_proxy="http://127.0.0.1:1"
  export https_proxy="http://127.0.0.1:1"
}
