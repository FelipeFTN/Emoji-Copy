#!/usr/bin/env python3

import re
import sys
import json
import requests
import traceback
from sqlite import SQLite

import os

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/latest/emoji-test.txt" # emoji keyboard/display test data
EMOJI_MAP = "./build/emoji_map.json" # existing emojis mapped to keywords
DB_PATH = "./emoji-copy@felipeftn/data/emojis.db" # path to SQLite DB for storing emojis

# CLDR Internationalization settings
CLDR_BASE_URL = "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json"
CLDR_CACHE_DIR = "./build/cldr_cache"
LOCALES_EXPORT_DIR = "./emoji-copy@felipeftn/data/locales"

# Mainstream languages bundled directly into the base database
# zh: Chinese, es: Spanish, fr: French, de: German, ja: Japanese, ru: Russian, pt: Portuguese
# hi: Hindi, ar: Arabic, bn: Bengali, ko: Korean
BUNDLED_LANGUAGES = ["zh", "es", "fr", "de", "ja", "ru", "pt", "hi", "ar", "bn", "ko"]

def fetch_cldr_file(url, cache_path):
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            return data
    except Exception as e:
        print(f"[!] Warning: Failed to fetch {url}: {e}")
    return None

def load_cldr_for_lang(lang):
    print(f"[+] Loading CLDR annotations for '{lang}'...")
    ann_url = f"{CLDR_BASE_URL}/cldr-annotations-full/annotations/{lang}/annotations.json"
    der_url = f"{CLDR_BASE_URL}/cldr-annotations-derived-full/annotationsDerived/{lang}/annotations.json"
    ann_cache = f"{CLDR_CACHE_DIR}/{lang}_annotations.json"
    der_cache = f"{CLDR_CACHE_DIR}/{lang}_derived.json"

    ann_data = fetch_cldr_file(ann_url, ann_cache)
    der_data = fetch_cldr_file(der_url, der_cache)

    result = {}
    for data in [ann_data, der_data]:
        if not data:
            continue
        annotations = data.get("annotations", {}).get("annotations", {})
        for char, item in annotations.items():
            kws = []
            if "default" in item and isinstance(item["default"], list):
                kws.extend(item["default"])
            if "tts" in item and isinstance(item["tts"], list):
                kws.extend(item["tts"])
            if not kws:
                continue

            seen = set()
            clean_kws = []
            for k in kws:
                s = str(k).strip()
                if s and s not in seen:
                    seen.add(s)
                    clean_kws.append(s)

            result[char] = clean_kws
            char_no_vs = char.replace("\ufe0f", "")
            if char_no_vs not in result:
                result[char_no_vs] = clean_kws
    return result

def export_standalone_locale(lang, output_dir=LOCALES_EXPORT_DIR):
    """Export a lightweight compact language pack for minor languages"""
    os.makedirs(output_dir, exist_ok=True)
    mapping = load_cldr_for_lang(lang)
    compact = {char: " ".join(kws) for char, kws in mapping.items()}
    out_file = os.path.join(output_dir, f"{lang}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(compact, f, ensure_ascii=False, separators=(',', ':'))
    print(f"[+] Exported compact locale pack for '{lang}' to {out_file}")

# Pre-fetch all bundled languages
cldr_maps = {}
for b_lang in BUNDLED_LANGUAGES:
    cldr_maps[b_lang] = load_cldr_for_lang(b_lang)

# Fetch unicode file from remote
try:
    print(f"[+] Fetching unicode data from {UNICODE_URL}")
    data = requests.get(UNICODE_URL).text
    data = data.split("\n") # then split it into lines
except:
    print("[X] Could not fetch unicode test file containing emoji and its description")
    print(traceback.format_exc())
    sys.exit(1)

# Load emoji:keywords map
try:
    with open(EMOJI_MAP, "r") as f:
        emoji_map = json.load(f)
except FileNotFoundError:
    print("[X] Could not fetch existing emojis mapped to keywords")
    print(traceback.format_exc())
    sys.exit(2)
except json.JSONDecodeError:
    print(f"[X] Invalid JSON data received from file {EMOJI_MAP}")
    print(traceback.format_exc())
    sys.exit(2)

print("[+] Parsing and loading emojis into database... 🍳")

# Global variables
GROUP = ""
SUBGROUP = ""
ITEM = []

# parse emojis fetched from unicode
for line in data:
    if line.startswith("# group"):
        group_match = re.search(r"# group: ([a-z &-]+)$", line, re.IGNORECASE)
        if group_match:
            GROUP = group_match.group(1)

    elif line.startswith("# subgroup"):
        subgroup_match = re.search(r"# subgroup: ([a-z &-]+)$", line, re.IGNORECASE)
        if subgroup_match:
            SUBGROUP = subgroup_match.group(1)

    # parse only fully qualified emojis to prevent "copies" and useless components
    # see https://unicode.org/reports/tr51/#def_fully_qualified_emoji
    if line.find("fully-qualified") == -1:
        continue

    # attempt to parse the emoji and its description
    match = re.search(r"# (\S+) E\d+\.\d+ (.+)$", line, re.IGNORECASE)
    if not match:
        continue
    emoji = match.group(1)
    desc = match.group(2)

    # Extract only a single, normalized skin tone value (or empty string)
    skin_tone = ""
    skin_tone_match = re.search(r"(light|medium-light|medium|medium-dark|dark) skin tone", desc)
    if skin_tone_match:
        skin_tone = skin_tone_match.group(0)

    # check if emoji exists in old emoji_map, so we can get its keywords
    if emoji in emoji_map.keys():
        keywords = emoji_map.get(emoji)
        keywords = [kw for kw in keywords if kw != desc]
        desc = f"{desc} {' '.join(keywords)}"

    if SUBGROUP not in desc:
        desc = f"{desc} {SUBGROUP}"

    # Append keywords for bundled languages
    emoji_no_vs = emoji.replace("\ufe0f", "")
    for b_lang in BUNDLED_LANGUAGES:
        lmap = cldr_maps.get(b_lang, {})
        kws = lmap.get(emoji) or lmap.get(emoji_no_vs)
        if kws:
            desc = f"{desc} {' '.join(kws)}"

    item = (emoji, desc, skin_tone, GROUP)
    #print(item)
    ITEM.append(item)

# Insert custom emojis from custom.py
print("[+] Loading custom emojis from custom.py... 🔧")
try:
    from custom import get_custom_emojis
    custom_emojis = get_custom_emojis()
    for emoji in custom_emojis.keys():
        # If the emoji is already in the ITEM list, skip it
        if any(item[0] == emoji for item in ITEM):
            print(f"[!] Emoji {emoji} already exists in ITEM. Skipping.")
            continue

        # Use a default description if not provided
        if custom_emojis[emoji]:
            desc = " ".join(custom_emojis[emoji].get("description", []))
            emoji_no_vs = emoji.replace("\ufe0f", "")
            for b_lang in BUNDLED_LANGUAGES:
                lmap = cldr_maps.get(b_lang, {})
                kws = lmap.get(emoji) or lmap.get(emoji_no_vs)
                if kws:
                    desc = f"{desc} {' '.join(kws)}"
            item = (emoji, desc, "", custom_emojis[emoji].get("group", "Symbols"))
            ITEM.append(item)
except ImportError:
    print("[!] No custom emojis found. Skipping custom emojis.")
except Exception as e:
    print("[X] An error occurred while loading custom emojis:")
    print(traceback.format_exc())
    sys.exit(3)

# Insert all emojis into database
EmojisDB = SQLite(DB_PATH)
EmojisDB.drop_table()
EmojisDB.create_table()
EmojisDB.insert_many(ITEM)

# Save metadata
bundled_langs_str = ",".join(["en"] + BUNDLED_LANGUAGES)
EmojisDB.set_meta("bundled_languages", bundled_langs_str)
print(f"[+] Bundled languages saved to meta table: {bundled_langs_str}")

EmojisDB.vacuum()

# Check for export arguments
if len(sys.argv) > 1 and sys.argv[1] == "--export-locale":
    for loc in sys.argv[2:]:
        export_standalone_locale(loc)

print("[+] Finished loading emojis into database! 🎉")
print(f"[!] Emoji Count: {EmojisDB.get_count()}")
EmojisDB.close() # Never forget doing this
print("[!] run `du -ah ./emoji-copy@felipeftn/data/` to get the DBs current size.")
