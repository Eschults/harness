# shellcheck shell=bash
# Shared by the bin/check-* functional round-trip scripts. Meant to be
# sourced, not run directly.

fail() {
  echo "✗ $1" >&2
  exit 1
}

# Shadows open/xdg-open with no-ops in $1, so an upgrade under test never opens a browser tab or eats its prompt's "y".
stub_url_openers() {
  mkdir -p "$1"
  printf '#!/usr/bin/env bash\ntrue\n' > "$1/open"
  cp "$1/open" "$1/xdg-open"
  chmod +x "$1/open" "$1/xdg-open"
  export PATH="$1:$PATH"
}

# Makes a hardcoded fallback URL fail fast instead of reaching the real network.
poison_network() {
  export http_proxy="http://127.0.0.1:1"
  export https_proxy="http://127.0.0.1:1"
}
