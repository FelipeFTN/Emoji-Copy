.PHONY: all build clean uninstall

SHELL := /bin/bash

EXTENSION := emoji-copy@felipeftn
EXTENSION_NAME := emoji-copy
ZIP_NAME := $(EXTENSION).zip
ZIP_TEMP := zip-temp

SCHEMA_COMPILED_FILE = $(EXTENSION)/schemas/gschemas.compiled
EMOJIS_DB = $(EXTENSION)/data/emojis.db

all: clean build

# GNOME Shell 45+ compiles schemas itself; shipping gschemas.compiled
# triggers the EGO-P-006 review warning.
build: $(EMOJIS_DB) $(ZIP_NAME)
	@echo "[+] EMOJI COPY BUILT"

install: build
	gnome-extensions install $(ZIP_NAME) --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'restart')."

uninstall:
	gnome-extensions uninstall $(EXTENSION)
	@echo "Extension uninstalled successfully!"

clean:
	@rm -rf $(ZIP_NAME) $(SCHEMA_COMPILED_FILE) $(ZIP_TEMP) $(EMOJIS_DB)
	
debug: clean install
	dbus-run-session -- gnome-shell --devkit

# The packaging lives in build-a-zip.sh, shared with `npm run build`.
$(ZIP_NAME):
	@sh build-a-zip.sh

$(EMOJIS_DB):
	@python3 ./build/parser.py
