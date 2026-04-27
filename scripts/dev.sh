#!/usr/bin/env bash
#
# dev.sh — Start the AI Research Assistant plugin watcher pointed at the dev vault.
#
# Auto-creates the vault on first run. esbuild watch mode writes main.js and
# styles.css to the repo root; Hot Reload picks up the symlinked changes and
# reloads the plugin in Obsidian without manual toggling.
#
# Usage:
#   ./scripts/dev.sh                  # watch mode (default)
#   ./scripts/dev.sh --clean          # wipe vault and re-run setup
#   ./scripts/dev.sh /path/to/vault   # use a specific vault path
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_ID="ai-research-assistant"

DEFAULT_VAULT_PATH="$REPO_ROOT/tmp/AI Research Assistant"

if [ "${1:-}" = "--clean" ]; then
  shift
  if [ -n "${1:-}" ]; then
    VAULT_PATH="$1"
  else
    VAULT_PATH="${VAULT_PATH:-$DEFAULT_VAULT_PATH}"
  fi
  VAULT_PATH="${VAULT_PATH/#\~/$HOME}"
  echo "Cleaning $VAULT_PATH..."
  rm -rf "$VAULT_PATH"
  bash "$REPO_ROOT/scripts/setup-dev.sh" "$VAULT_PATH"
elif [ -n "${1:-}" ]; then
  VAULT_PATH="$1"
  VAULT_PATH="${VAULT_PATH/#\~/$HOME}"
else
  VAULT_PATH="${VAULT_PATH:-$DEFAULT_VAULT_PATH}"
  VAULT_PATH="${VAULT_PATH/#\~/$HOME}"
fi

if [ ! -d "$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID" ]; then
  echo "Dev vault not found at $VAULT_PATH — running setup..."
  echo ""
  bash "$REPO_ROOT/scripts/setup-dev.sh" "$VAULT_PATH"
  echo ""
fi

echo "Watching plugin sources — vault: $VAULT_PATH"
echo "Press Ctrl+C to stop."
echo ""

cd "$REPO_ROOT"
exec node esbuild.config.mjs
