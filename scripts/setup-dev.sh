#!/usr/bin/env bash
#
# setup-dev.sh — Set up (or refresh) the AI Research Assistant dev vault.
#
# Creates a vault, enables the plugin in Obsidian's community-plugins config,
# installs Hot Reload, and symlinks the plugin build artifacts. Safe to re-run.
#
# Usage:
#   ./scripts/setup-dev.sh                 # uses VAULT_PATH env var, or tmp/vault
#   ./scripts/setup-dev.sh /path/to/vault  # explicit vault path
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_ID="ai-research-assistant"

# ─── Resolve vault path ─────────────────────────────────────────────────────

DEFAULT_VAULT_PATH="$REPO_ROOT/tmp/AI Research Assistant"

if [ -n "${1:-}" ]; then
  VAULT_PATH="$1"
else
  VAULT_PATH="${VAULT_PATH:-$DEFAULT_VAULT_PATH}"
fi

VAULT_PATH="${VAULT_PATH/#\~/$HOME}"

# ─── Create vault structure ─────────────────────────────────────────────────

mkdir -p "$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"
mkdir -p "$VAULT_PATH/Conversations"

PLUGIN_DEST="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"
COMMUNITY_PLUGINS="$VAULT_PATH/.obsidian/community-plugins.json"

# ─── Enable the plugin in Obsidian config ───────────────────────────────────

if [ ! -f "$COMMUNITY_PLUGINS" ]; then
  printf '["%s"]\n' "$PLUGIN_ID" > "$COMMUNITY_PLUGINS"
elif ! grep -q "\"$PLUGIN_ID\"" "$COMMUNITY_PLUGINS"; then
  node -e "
const fs = require('fs');
const f = '$COMMUNITY_PLUGINS';
const list = JSON.parse(fs.readFileSync(f, 'utf8'));
if (!list.includes('$PLUGIN_ID')) list.push('$PLUGIN_ID');
fs.writeFileSync(f, JSON.stringify(list, null, 2) + '\n');
"
fi

# ─── Install Hot Reload plugin ──────────────────────────────────────────────
# pjeby/hot-reload — triggers Obsidian plugin reloads on file changes so the
# dev loop works without manually toggling the plugin.
# https://github.com/pjeby/hot-reload

HOT_RELOAD_DIR="$VAULT_PATH/.obsidian/plugins/hot-reload"
mkdir -p "$HOT_RELOAD_DIR"

for asset in main.js manifest.json; do
  if [ ! -f "$HOT_RELOAD_DIR/$asset" ]; then
    echo "Downloading hot-reload/$asset..."
    curl -fsSL --retry 3 \
      "https://github.com/pjeby/hot-reload/releases/latest/download/$asset" \
      -o "$HOT_RELOAD_DIR/$asset" \
      || echo "Warning: could not download hot-reload/$asset — check your connection."
  fi
done

if ! grep -q '"hot-reload"' "$COMMUNITY_PLUGINS"; then
  node -e "
const fs = require('fs');
const f = '$COMMUNITY_PLUGINS';
const list = JSON.parse(fs.readFileSync(f, 'utf8'));
if (!list.includes('hot-reload')) list.push('hot-reload');
fs.writeFileSync(f, JSON.stringify(list, null, 2) + '\n');
"
fi

# ─── Build the plugin (dev mode writes to repo root) ────────────────────────
# Single-shot esbuild build — the watcher is started separately by dev.sh.
# Skip if main.js already exists (re-run after ./scripts/dev.sh started once).

if [ ! -f "$REPO_ROOT/main.js" ]; then
  echo "Building plugin (one-shot)..."
  ( cd "$REPO_ROOT" && node esbuild.config.mjs ) &
  BUILD_PID=$!
  # The dev config runs context.watch() which never exits — wait for main.js
  # to appear, then kill it. This is a side effect of esbuild's watch API.
  for _ in $(seq 1 30); do
    [ -f "$REPO_ROOT/main.js" ] && break
    sleep 0.5
  done
  kill "$BUILD_PID" 2>/dev/null || true
  wait "$BUILD_PID" 2>/dev/null || true
fi

# ─── Symlink build artifacts ────────────────────────────────────────────────
# Hot Reload watches the plugin directory for changes to these files.

for file in main.js styles.css manifest.json; do
  source="$REPO_ROOT/$file"
  link="$PLUGIN_DEST/$file"

  if [ -L "$link" ]; then
    rm "$link"
  elif [ -e "$link" ]; then
    echo "Warning: $link exists and is not a symlink — skipping"
    continue
  fi

  if [ ! -e "$source" ]; then
    echo "Warning: $source does not exist yet — symlink will be broken until first build"
  fi

  ln -s "$source" "$link"
done

# ─── .hotreload marker ──────────────────────────────────────────────────────
# Hot Reload only auto-reloads plugins that have this marker file present.

touch "$PLUGIN_DEST/.hotreload"

# ─── Done ───────────────────────────────────────────────────────────────────

cat <<EOF

Setup complete!

  Vault:  $VAULT_PATH
  Plugin: $PLUGIN_DEST

Next steps:
  1. Open the vault in Obsidian (File → Open vault → Open folder as vault)
  2. Settings → Community plugins → enable 'AI Research Assistant' and 'Hot Reload'
  3. Run 'npm run dev' (or './scripts/dev.sh') — Hot Reload picks up rebuilds
EOF
