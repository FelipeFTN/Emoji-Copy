.PHONY: all build clean uninstall

SHELL := /bin/bash

EXTENSION := emoji-copy@felipeftn
EXTENSION_NAME := emoji-copy
EXTENSION_PATH = ~/.local/share/gnome-shell/extensions/$(EXTENSION)
ZIP_NAME := $(EXTENSION).zip
ZIP_TEMP := zip-temp

SCHEMA_FILE = $(EXTENSION)/schemas/org.gnome.shell.extensions.emoji-copy.gschema.xml
SCHEMA_COMPILED_FILE = $(EXTENSION)/schemas/gschemas.compiled
EMOJIS_DB = $(EXTENSION)/data/emojis.db

ZIP_CONTENT = $(EXTENSION)/*

all: clean build

build: $(SCHEMA_COMPILED_FILE) $(EMOJIS_DB) $(ZIP_NAME)
	@echo "[+] EMOJI COPY BUILT"

install: build
	gnome-extensions install $(ZIP_NAME) --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'restart')."

uninstall:
	gnome-extensions uninstall $(EXTENSION)
	@echo "Extension uninstalled successfully!"

clean:
	@rm --force --recursive $(ZIP_NAME) $(SCHEMA_COMPILED_FILE) $(ZIP_TEMP) $(EMOJIS_DB) $(EXTENSION_PATH)
	
debug: clean install
	dbus-run-session -- gnome-shell --nested --wayland

# Just to make it clear ($@ => First argument; $^ second argument)
# e.g: $@ => $(ZIP_NAME); $^ => $(ZIP_CONTENT).
$(ZIP_NAME):
	@echo "[-] ZIPPING EMOJI COPY..."
	@mkdir -p zip-temp
	@cp -r $(ZIP_CONTENT) $(ZIP_TEMP)
	@rm --force $@
	@cd $(ZIP_TEMP) && zip -r ../$@ .
	@cd $(ZIP_TEMP) && zip -d ../$@ **/*.pot
	@cd $(ZIP_TEMP) && zip -d ../$@ **/*.po

$(SCHEMA_COMPILED_FILE): $(SCHEMA_FILE)
	@echo "[-] COMPILING SCHEMA..."
	@glib-compile-schemas $(EXTENSION)/schemas
	@echo "[+] SCHEMA COMPILED"

$(EMOJIS_DB):
	@python3 ./build/parser.py
