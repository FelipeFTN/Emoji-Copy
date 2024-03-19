.PHONY: all build clean uninstall

SHELL := /bin/bash

EXTENSION := emoji-copy@felipeftn
EXTENSION_NAME := emoji-copy
ZIP_NAME := $(EXTENSION).zip
ZIP_TEMP := zip-temp

JS_FILES = $(shell find -type f -and \( -name "*.js" \))
SCHEMA_FILE = $(EXTENSION)/schemas/org.gnome.shell.extensions.emoji-copy.gschema.xml
SCHEMA_COMPILED_FILE = $(EXTENSION)/schemas/gschemas.compiled
ZIP_CONTENT = $(JS_FILES) $(EXTENSION)/schemas $(EXTENSION)/data $(EXTENSION)/locale $(EXTENSION)/icons $(EXTENSION)/metadata.json $(EXTENSION)/stylesheet.css LICENSE

all: clean build

build: $(SCHEMA_COMPILED_FILE) $(ZIP_NAME)
	@echo "[+] EMOJI COPY BUILT"

install: build
	gnome-extensions install $(ZIP_NAME) --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'restart')."

uninstall:
	gnome-extensions uninstall $(EXTENSION)
	@echo "Extension uninstalled successfully!"

clean:
	@rm --force --recursive $(ZIP_NAME) $(SCHEMA_COMPILED_FILE) $(ZIP_TEMP)

# Just to make it clear ($@ => First argument; $^ second argument)
# e.g: $@ => $(ZIP_NAME); $^ => $(ZIP_CONTENT).
$(ZIP_NAME): $(ZIP_CONTENT)
	@echo "[-] ZIPPING EMOJI COPY..."
	@mkdir -p zip-temp
	@cp -r $^ $(ZIP_TEMP)
	@rm --force $@
	@cd $(ZIP_TEMP) && zip -r ../$@ .
	@cd $(ZIP_TEMP) && zip -d ../$@ **/*.pot
	@cd $(ZIP_TEMP) && zip -d ../$@ **/*.po

$(SCHEMA_COMPILED_FILE): $(SCHEMA_FILE)
	@echo "[-] COMPILING SCHEMA..."
	@glib-compile-schemas $(EXTENSION)/schemas
	@echo "[+] SCHEMA COMPILED"
