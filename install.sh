#!/bin/sh
# Installs the harness launcher: curl -fsSL https://raw.githubusercontent.com/Eschults/harness/v1/install.sh | sh
set -eu

HARNESS_LAUNCHER_URL=https://raw.githubusercontent.com/Eschults/harness/v1/bin/harness

# Wrapped in main so a truncated `curl | sh` download runs nothing.
main() {
  install_dir="${HARNESS_INSTALL_DIR:-$HOME/.local/bin}"
  download="$install_dir/harness.download"
  trap 'rm -f "$download"' EXIT

  mkdir -p "$install_dir"
  curl -fsSL "$HARNESS_LAUNCHER_URL" -o "$download"
  chmod +x "$download"
  mv "$download" "$install_dir/harness"
  echo "Installed harness to $install_dir/harness"

  case ":$PATH:" in
    *":$install_dir:"*) echo "Next, from inside your project repo: harness install" ;;
    *) echo "Add $install_dir to your PATH, then from inside your project repo: harness install" ;;
  esac
}

main
