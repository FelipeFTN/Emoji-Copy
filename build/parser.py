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
    print(f"🔃 Fetching unicode data from {UNICODE_URL}")
    data = requests.get(UNICODE_URL).text
    data = data.split("\n") # then split it into lines
except:
    print("❌ Could not fetch unicode test file containing emoji and its description")
    print(traceback.format_exc())
    sys.exit(1)

# Load emoji:keywords map
try:
    with open(EMOJI_MAP, "r") as f:
        emoji_map = json.load(f)
except FileNotFoundError:
    print("❌ Could not fetch existing emojis mapped to keywords")
    print(traceback.format_exc())
    sys.exit(2)
except json.JSONDecodeError:
    print(f"❌ Invalid JSON data received from file {EMOJI_MAP}")
    print(traceback.format_exc())
    sys.exit(2)

EmojisDB = SQLite(r'./emoji-copy@felipeftn/data/emojis.db')
EmojisDB.drop_table()
EmojisDB.create_table()

for emoji in emoji_map:
    desc = ' '.join(emoji_map[emoji]) # Get array of string and combine into a single string
    item = [emoji, desc, ""]
    EmojisDB.insert_or_update(item) # Maybe do batch insert here + threads and stuff

print("[+] Finished loading emoji_map.json! 🎉")
print("[-] Loading Official Unicode emojis... 🍳")

for line in data:
    if not line.startswith("#") and line.find("fully-qualified") != -1:
        match = re.search(r"# (\S+) E\d+\.\d+ (.+)$", line)
        # Doing early return
        if match == None:
            print("❌ Could not parse unicode test file containing emoji and its description")
            print(traceback.format_exc())
            sys.exit(3)

        # Keep the code if everything is allright
        emoji = match.group(1)
        desc = match.group(2)
        skin_tone_match = re.search(r":\ ([a-z\-]+)", desc)
        skin_tone = ""

        if skin_tone_match:
            skin_tone = skin_tone_match.group(1)

        item = [emoji, desc, skin_tone]
        EmojisDB.insert_or_update(item) # Maybe do batch insert here + threads and stuff

# print(EmojisDB.get_many(50))
print(f"item count: {EmojisDB.get_count()}")
    
EmojisDB.close() # Never forget doing this to save the file
