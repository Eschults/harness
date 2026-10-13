#!/bin/sh
# Installs the harness launcher: curl -fsSL https://raw.githubusercontent.com/Eschults/harness/v1/install.sh | sh
set -eu

HARNESS_LAUNCHER_URL=https://raw.githubusercontent.com/Eschults/harness/v1/bin/harness
INSTALL_DIR="${HARNESS_INSTALL_DIR:-$HOME/.local/bin}"

mkdir -p "$INSTALL_DIR"
curl -fsSL "$HARNESS_LAUNCHER_URL" -o "$INSTALL_DIR/harness.download"
chmod +x "$INSTALL_DIR/harness.download"
mv "$INSTALL_DIR/harness.download" "$INSTALL_DIR/harness"
echo "Installed harness to $INSTALL_DIR/harness"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) echo "Next, from inside your project repo: harness install" ;;
  *) echo "Add $INSTALL_DIR to your PATH, then from inside your project repo: harness install" ;;
esac
