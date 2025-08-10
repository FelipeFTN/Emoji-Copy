  #!/usr/bin/env bash
set -euo pipefail

# Build and install the Emoji Copy GNOME Shell extension from this repo

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ID="emoji-copy@felipeftn"
SRC_DIR="$ROOT_DIR/$EXT_ID"
DIST_DIR="$ROOT_DIR/dist"

log() { printf "[build] %s\n" "$*"; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found. Please install it and retry." >&2
    exit 1
  fi
}

need glib-compile-schemas
need gnome-extensions
need python3
need zip

log "Source: $SRC_DIR"
log "Dist:   $DIST_DIR"

# Ensure emojis.db exists (copy from installed extension if available, otherwise generate)
ensure_db() {
  local db="$SRC_DIR/data/emojis.db"
  if [[ -f "$db" ]]; then
    log "emojis.db already present"
    return
  fi

  log "emojis.db not found in source; trying to copy from an installed extension"
  local inst1="$HOME/.local/share/gnome-shell/extensions/$EXT_ID/data/emojis.db"
  local inst2="/usr/share/gnome-shell/extensions/$EXT_ID/data/emojis.db"
  mkdir -p "$SRC_DIR/data"
  if [[ -f "$inst1" ]]; then
    cp -f "$inst1" "$db"
    log "Copied emojis.db from user install"
  elif [[ -f "$inst2" ]]; then
    cp -f "$inst2" "$db"
    log "Copied emojis.db from system install"
  else
    log "No installed DB found; generating via build/parser.py"
    python3 "$ROOT_DIR/build/parser.py"
    if [[ ! -f "$db" ]]; then
      echo "Error: failed to generate $db" >&2
      exit 1
    fi
  fi
}

log "Ensuring emojis.db..."
ensure_db

log "Compiling schemas..."
glib-compile-schemas "$SRC_DIR/schemas"

mkdir -p "$DIST_DIR"
ZIP_PATH="$DIST_DIR/$EXT_ID.shell-extension.zip"

log "Packing extension (primary: gnome-extensions pack)..."
# Explicitly include sources that the packer may skip by default
if gnome-extensions pack "$SRC_DIR" \
  --force \
  --out-dir "$DIST_DIR" \
  --extra-source emojiCategory.js \
  --extra-source emojiButton.js \
  --extra-source emojiOptionsBar.js \
  --extra-source emojiSearchItem.js \
  --extra-source handlers \
  --extra-source libs \
  --extra-source data \
  --extra-source icons \
  --extra-source locale \
  --extra-source prefs.js \
  --extra-source stylesheet.css >/dev/null 2>&1; then
  log "Packed to $ZIP_PATH"
else
  log "gnome-extensions pack failed; falling back to build-a-zip.sh"
  bash "$ROOT_DIR/build-a-zip.sh"
  ZIP_PATH="$ROOT_DIR/$EXT_ID.zip"
  if [[ ! -f "$ZIP_PATH" ]]; then
    echo "Error: fallback zip not found at $ZIP_PATH" >&2
    exit 1
  fi
  log "Fallback zip: $ZIP_PATH"
fi

log "Installing $ZIP_PATH ..."
gnome-extensions install --force "$ZIP_PATH"

log "Enabling $EXT_ID ..."
gnome-extensions disable "$EXT_ID" >/dev/null 2>&1 || true
gnome-extensions enable  "$EXT_ID" >/dev/null 2>&1 || true

log "Installed info:"
gnome-extensions info "$EXT_ID" | sed -n '1,200p'

log "Done. On Wayland, you may need to log out/in for changes to fully apply."


