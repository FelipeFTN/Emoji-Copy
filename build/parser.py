#!/usr/bin/env python3

import re
import sys
import json
import requests
import traceback
from sqlite import SQLite

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt" # emoji keyboard/display test data
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

# Connect to SQLite database
EmojisDB = SQLite(DB_PATH)
EmojisDB.drop_table()
EmojisDB.create_table()

print("[+] Loading existing emojis from emoji_map.json to database... 🍳")
items = []
for emoji in emoji_map:
    desc = " ".join(emoji_map[emoji]) # Get array of string and combine into a single string.
    item = (emoji, desc, "", "")
    items.append(item)

# insert all existing emojis into db
EmojisDB.insert_many(items)

print("[+] Finished loading existing emojis to database! 🎉")
print("[+] Loading official unicode emojis... 🍳")

# Global variables
GROUP = ""
SUBGROUP = ""
ITEM = []

for line in data:
    if line.startswith("# group"):
        group_match = re.search(r"# group: ([a-z &-]+)$", line, re.IGNORECASE)
        if group_match:
            GROUP = group_match.group(1)
    
    elif line.startswith("# subgroup"):
        subgroup_match = re.search(r"# subgroup: ([a-z &-]+)$", line, re.IGNORECASE)
        if subgroup_match:
            SUBGROUP = subgroup_match.group(1)
    
    # attempt to parse the emoji and its description
    match = re.search(r"# (\S+) E\d+\.\d+ (.+)$", line, re.IGNORECASE)
    if not match:
        continue
    emoji = match.group(1)
    desc = match.group(2)
    
    # skin tone match must be done before modifying desc with sub group
    skin_tone_match = re.search(r": ([a-z -]+)$", desc)
    skin_tone = ""
    if skin_tone_match:
        skin_tone = skin_tone_match.group(1)
    
    if SUBGROUP not in desc:
        desc = f"{match.group(2)} {SUBGROUP}"
    
    item = (emoji, desc, skin_tone, GROUP)
    #print(item)
    ITEM.append(item)

# insert all official emojis into db
EmojisDB.insert_many(ITEM)

print("[+] Finished loading official unicode emojis to database! 🎉")
print(f"[!] Emoji Count: {EmojisDB.get_count()}")
EmojisDB.close() # Never forget doing this
print("[!] run `du -ah ./emoji-copy@felipeftn/data/` to get the DBs current size.")
