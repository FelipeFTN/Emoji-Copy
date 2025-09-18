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

    # skin tone match must be done before modifying desc with sub group
    skin_tone_match = re.search(r": ([a-z, -]+)$", desc)
    skin_tone = ""
    if skin_tone_match:
        skin_tone = skin_tone_match.group(1)
        if skin_tone.find("skin tone") == -1:
            skin_tone = ""

    # check if emoji exists in old emoji_map, so we can get its keywords
    if emoji in emoji_map.keys():
        keywords = emoji_map.get(emoji)
        keywords = [kw for kw in keywords if kw != desc]
        desc = f"{desc} {' '.join(keywords)}"

    if SUBGROUP not in desc:
        desc = f"{desc} {SUBGROUP}"

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
EmojisDB.vacuum()

print("[+] Finished loading emojis into database! 🎉")
print(f"[!] Emoji Count: {EmojisDB.get_count()}")
EmojisDB.close() # Never forget doing this
print("[!] run `du -ah ./emoji-copy@felipeftn/data/` to get the DBs current size.")
