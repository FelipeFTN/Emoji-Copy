#!/bin/bash

EXT_ID=emoji-copy@felipeftn

# ./update-and-compile-translations.sh

cd $EXT_ID

# GNOME Shell 45+ compiles schemas itself; shipping gschemas.compiled
# triggers the EGO-P-006 review warning.
rm -f ./schemas/gschemas.compiled

zip ../$EXT_ID.zip *.js
zip ../$EXT_ID.zip prefs.ui
zip ../$EXT_ID.zip metadata.json
zip ../$EXT_ID.zip stylesheet.css

zip -r ../$EXT_ID.zip data
zip -r ../$EXT_ID.zip schemas
zip -r ../$EXT_ID.zip locale
zip -r ../$EXT_ID.zip icons

shopt -s globstar

zip -d ../$EXT_ID.zip **/*.pot
zip -d ../$EXT_ID.zip **/*.po
