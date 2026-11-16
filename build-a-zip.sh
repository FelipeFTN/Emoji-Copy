#!/bin/sh
# Builds emoji-copy@felipeftn.zip. Both `make build` and `npm run build` call
# this script, so there is a single packaging path.
set -eu

EXT_ID=emoji-copy@felipeftn
ZIP_TEMP=zip-temp

rm -rf "$ZIP_TEMP"
mkdir -p "$ZIP_TEMP"
# The extension contents go at the zip root, not inside a emoji-copy@felipeftn/
# folder: GNOME Shell looks for metadata.json at the top level.
cp -r "$EXT_ID"/* LICENSE "$ZIP_TEMP"

# Nobody needs the translation sources in the bundle, and GNOME Shell 45+
# compiles the schemas itself (shipping gschemas.compiled trips EGO-P-006).
find "$ZIP_TEMP" -name ".gitkeep" -type f -delete
find "$ZIP_TEMP" -name "*.pot" -type f -delete
find "$ZIP_TEMP" -name "*.po" -type f -delete
rm -f "$ZIP_TEMP/schemas/gschemas.compiled"

rm -f "$EXT_ID.zip"
(cd "$ZIP_TEMP" && zip -qr "../$EXT_ID.zip" .)
echo "[+] Built $EXT_ID.zip"
