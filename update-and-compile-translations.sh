#!/bin/bash
# Regenerates the gettext template from POTFILES.in, then merges it into every
# .po file and recompiles the .mo files shipped in the extension bundle.
set -euo pipefail

EXTENSION="emoji-copy@felipeftn"
DOMAIN="emoji-copy"
LOCALE_DIR="$EXTENSION/locale"
POT="$LOCALE_DIR/$DOMAIN.pot"

echo "Generating $POT..."
xgettext \
    --files-from=POTFILES.in \
    --from-code=UTF-8 \
    --add-location=file \
    --package-name="Emoji Copy" \
    --msgid-bugs-address="https://github.com/FelipeFTN/Emoji-Copy/issues" \
    --copyright-holder="Felipe Tenório" \
    --output=- | sed '1s/.*/# Emoji Copy translation template./' > "$POT"

# hu ships its catalog as hu_HU.po, so glob the files instead of assuming the
# domain name.
for po in "$LOCALE_DIR"/*/LC_MESSAGES/*.po; do
    [ -f "$po" ] || continue
    echo "Updating $po ..."
    msgmerge --update --previous --quiet "$po" "$POT"
    msgfmt "$po" -o "${po%.po}.mo"
    rm -f "$po~"
done

echo "Done. New strings stay untranslated until the .po files are updated."
