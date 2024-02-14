#!/usr/bin/env python3

import re
import sys
import json
import requests
import traceback

from sqlite import SQLite

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt" # Source: https://unicode.org
EMOJI_MAP = "./build/emoji_map.json" # existing emojis mapped to keywords

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

EmojisDB = SQLite(r'./emoji-copy@felipeftn/data/emojis.db')
EmojisDB.drop_table()
EmojisDB.create_table()

for emoji in emoji_map:
    desc = ' '.join(emoji_map[emoji]) # Get array of string and combine into a single string
    item = [emoji, desc, "", ""]
    EmojisDB.insert_or_update(item) # Maybe do batch insert here + threads and stuff

print("[+] Finished loading emoji_map.json! 🎉")
print("[+] Loading Official Unicode emojis... 🍳")

# Global variables
GROUP = ""
SUBGROUP = ""

for line in data:
    if line.startswith("# subgroup"):
        subgroup_match = re.search(r"subgroup: ([a-z\-]+)", line, re.IGNORECASE)
        if subgroup_match == None :
            continue
        SUBGROUP = f" {subgroup_match.group(1)}"

    if line.startswith("# group"):
        group_match = re.search(r"group: ([a-z\ &]+)", line, re.IGNORECASE)
        if group_match == None :
            continue
        GROUP = f" {group_match.group(1)}"

    match = re.search(r"# (\S+) E\d+\.\d+ (.+)$", line, re.IGNORECASE)
    if match == None:
        continue

    # Keep the code if everything is allright
    emoji = match.group(1)
    desc = match.group(2) + SUBGROUP
    skin_tone_match = re.search(r":\ ([a-z\-]+)", desc)
    skin_tone = ""

    if skin_tone_match:
        skin_tone = skin_tone_match.group(1)

    item = [emoji, desc, skin_tone, GROUP]
    EmojisDB.insert_or_update(item) # Maybe do batch insert here + threads and stuff

print()
# print(EmojisDB.get_many(50))
print(f"[!] Item Count: {EmojisDB.get_count()}")
    
EmojisDB.close() # Never forget doing this
print("[!] run `du -ah ./emoji-copy@felipeftn/data/` to get the DBs current size.")
