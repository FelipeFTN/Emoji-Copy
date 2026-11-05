#!/usr/bin/env python3

import re
import sys
import json
import requests
import traceback
from sqlite import SQLite

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/latest/emoji-test.txt" # emoji keyboard/display test data
EMOJI_MAP = "./build/emoji_map.json" # existing emojis mapped to keywords
DB_PATH = "./emoji-copy@felipeftn/data/emojis.db" # path to SQLite DB for storing emojis

# Fetch unicode file from remote
try:
    print(f"[+] Fetching unicode data from {UNICODE_URL}")
    response = requests.get(UNICODE_URL, timeout=30)
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code} while fetching {UNICODE_URL}")
    data = response.text.split("\n")
except Exception as e:
    print(f"[X] Could not fetch unicode test file: {e}")
    print(traceback.format_exc())
    sys.exit(1)

# Load emoji:keywords map
try:
    with open(EMOJI_MAP, "r", encoding="utf-8") as f:
        emoji_map = json.load(f)
except FileNotFoundError:
    print("[X] Could not find emoji_map.json")
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
KEYWORD_ITEMS = []

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
    base_name = match.group(2)
    desc = base_name

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

    # Keep emojis.description short and clean (English display/fallback)
    item = (emoji, desc, skin_tone, GROUP)
    ITEM.append(item)

    # Store base English keywords in emoji_keywords table
    KEYWORD_ITEMS.append((emoji, "en", base_name, desc))

# Insert custom emojis from custom.py
print("[+] Loading custom emojis from custom.py... 🔧")
try:
    from custom import get_custom_emojis
    custom_emojis = get_custom_emojis()
    for emoji in custom_emojis.keys():
        if any(item[0] == emoji for item in ITEM):
            continue

        if custom_emojis[emoji]:
            desc_list = custom_emojis[emoji].get("description", [])
            desc = " ".join(desc_list)
            name = desc_list[0] if desc_list else desc
            group = custom_emojis[emoji].get("group", "Symbols")
            ITEM.append((emoji, desc, "", group))
            KEYWORD_ITEMS.append((emoji, "en", name, desc))
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
EmojisDB.insert_many_keywords(KEYWORD_ITEMS)

# Save metadata indicating base bundled language
EmojisDB.set_meta("bundled_languages", "en")
EmojisDB.set_meta("schema_version", "2")

# Vacuum
EmojisDB.vacuum()

# Verify database contents
emoji_count = EmojisDB.get_count()
keywords_count = EmojisDB.get_keywords_count()
print(f"[!] Emoji Count: {emoji_count}")
print(f"[!] Keywords Count: {keywords_count}")

if emoji_count < 1800 or keywords_count < 1800:
    print("[X] Database verification failed! Row count is suspiciously low.")
    EmojisDB.close()
    sys.exit(1)

EmojisDB.close()
print("[+] Finished loading emojis into database! 🎉")
print("[!] run `du -ah ./emoji-copy@felipeftn/data/` to get the DBs current size.")
