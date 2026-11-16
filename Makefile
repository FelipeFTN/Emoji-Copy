.PHONY: all build install uninstall deploy debug clean translations

SHELL := /bin/bash

EXTENSION := emoji-copy@felipeftn
EXTENSION_NAME := emoji-copy
ZIP_NAME := $(EXTENSION).zip
ZIP_TEMP := zip-temp

SCHEMA_COMPILED_FILE = $(EXTENSION)/schemas/gschemas.compiled
EMOJIS_DB = $(EXTENSION)/data/emojis.db

all: clean build

build: $(EMOJIS_DB) $(ZIP_NAME)
	@echo "[+] EMOJI COPY BUILT"

install: build
	gnome-extensions install $(ZIP_NAME) --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'restart')."

deploy: install

uninstall:
	gnome-extensions uninstall $(EXTENSION)
	@echo "Extension uninstalled successfully!"

clean:
	@rm -rf $(ZIP_NAME) $(SCHEMA_COMPILED_FILE) $(ZIP_TEMP) $(EMOJIS_DB)
	
debug: clean install
	dbus-run-session -- gnome-shell --devkit

translations:
	./update-and-compile-translations.sh

# The zip carries the extension contents at its root, not inside a
# emoji-copy@felipeftn/ folder: GNOME Shell looks for metadata.json there.
# The .po/.pot sources stay out, and GNOME Shell 45+ compiles the schemas
# itself (shipping gschemas.compiled trips the EGO-P-006 review warning).
$(ZIP_NAME):
	@echo "[-] Zipping $(ZIP_NAME)..."
	@rm -rf $(ZIP_TEMP)
	@mkdir -p $(ZIP_TEMP)
	@cp -r $(EXTENSION)/* LICENSE $(ZIP_TEMP)
	@find $(ZIP_TEMP) -name ".gitkeep" -type f -delete
	@find $(ZIP_TEMP) -name "*.pot" -type f -delete
	@find $(ZIP_TEMP) -name "*.po" -type f -delete
	@rm -f $(ZIP_TEMP)/schemas/gschemas.compiled
	@rm -f $@
	@cd $(ZIP_TEMP) && zip -qr ../$@ .

$(EMOJIS_DB):
	@python3 ./build/parser.py
