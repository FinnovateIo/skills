#!/usr/bin/env bash

set -eo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [ -t 2 ]; then
  RED=$'\033[31m'
  YELLOW=$'\033[33m'
  DIM=$'\033[2m'
  RESET=$'\033[0m'
else
  RED=""
  YELLOW=""
  DIM=""
  RESET=""
fi

die() {
  printf '%s%s%s\n' "$RED" "$*" "$RESET" >&2
  exit 1
}

require_command() {
  local command=$1
  local message=$2

  command -v "$command" >/dev/null 2>&1 || die "$message"
}

require_node_version() {
  if node -e '
    const [major] = process.versions.node.split(".").map(Number);
    process.exit(major >= 24 ? 0 : 1);
  ' 2>/dev/null; then
    return
  fi

  printf '%sNode %s is too old for this installer.%s\n' \
    "$RED" "$(node --version)" "$RESET" >&2
  printf 'Needs Node 24 or newer.\n' >&2

  if [ -f "$SCRIPT_DIR/.nvmrc" ]; then
    printf 'This repo pins %s — try: nvm use\n' \
      "$(cat "$SCRIPT_DIR/.nvmrc")" >&2
  fi

  exit 1
}

dependencies_are_installed() {
  [ -d "$SCRIPT_DIR/node_modules/@inquirer/prompts" ] &&
    [ -d "$SCRIPT_DIR/node_modules/chalk" ]
}

install_dependencies() {
  if dependencies_are_installed; then
    return
  fi

  printf '%sInstalling dependencies (@inquirer/prompts, chalk)...%s\n' \
    "$YELLOW" "$RESET" >&2

  require_command \
    npm \
    "npm is required to install dependencies but was not found on PATH."

  (
    cd "$SCRIPT_DIR"
    npm ci --no-audit --no-fund --loglevel=error
  ) || die "npm install failed. Run it manually in $SCRIPT_DIR and try again."

  printf '%sdone%s\n' "$DIM" "$RESET" >&2
}

require_command \
  node \
  "Node.js is required but was not found on PATH."

require_node_version
install_dependencies

exec node "$SCRIPT_DIR/install.ts" "$@"