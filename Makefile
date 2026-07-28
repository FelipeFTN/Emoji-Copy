.PHONY: all build clean uninstall

SHELL := /bin/bash

EXTENSION := emoji-copy@felipeftn
EXTENSION_NAME := emoji-copy
EXTENSION_PATH = ~/.local/share/gnome-shell/extensions/$(EXTENSION)
ZIP_NAME := $(EXTENSION).zip
ZIP_TEMP := zip-temp

SCHEMA_COMPILED_FILE = $(EXTENSION)/schemas/gschemas.compiled
EMOJIS_DB = $(EXTENSION)/data/emojis.db

ZIP_CONTENT = $(EXTENSION)/* LICENSE

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
	@rm -rf $(ZIP_NAME) $(SCHEMA_COMPILED_FILE) $(ZIP_TEMP) $(EMOJIS_DB) $(EXTENSION_PATH)
	
debug: clean install
	dbus-run-session -- gnome-shell --devkit

# Just to make it clear ($@ => First argument; $^ second argument)
# e.g: $@ => $(ZIP_NAME); $^ => $(ZIP_CONTENT).
$(ZIP_NAME):
	@echo "[-] ZIPPING EMOJI COPY..."
	@mkdir -p zip-temp
	@cp -r $(ZIP_CONTENT) $(ZIP_TEMP)
	@cd $(ZIP_TEMP) && find . -name ".gitkeep" -type f | xargs rm -rf
	@cd $(ZIP_TEMP) && find . -name "*.pot" -type f | xargs rm -rf
	@cd $(ZIP_TEMP) && find . -name "*.po" -type f | xargs rm -rf
	@rm -f $(ZIP_TEMP)/schemas/gschemas.compiled
	@rm -f $@
	@cd $(ZIP_TEMP) && zip -r ../$@ .

$(EMOJIS_DB):
	@python3 ./build/parser.py
