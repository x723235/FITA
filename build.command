#!/bin/zsh
set -eu
FITA_DIR="$(cd "$(dirname "$0")" && pwd)"
exec '/Users/rafael/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' "$FITA_DIR/build-and-install.mjs"
