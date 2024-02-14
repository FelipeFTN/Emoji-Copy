#!/usr/bin/env python3

import re
import sys
import json
import requests
import traceback

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt" # Source: https://unicode.org
EMOJI_MAP = "./unicode_parser/emoji_map.json" # existing emojis mapped to keywords
CHAR_FILE = "./emoji-copy@felipeftn/data/emojisCharacters.json" # Save emoji characters here
KEY_FILE = "./emoji-copy@felipeftn/data/emojisKeywords.json" # Save description/keywords of emoji characters here

# Fetch unicode file from remote
try:
    print(f"Fetching unicode data from {UNICODE_URL}")
    data = requests.get(UNICODE_URL).text
    data = data.split("\n") # then split it into lines
except:
    print("Could not fetch unicode test file containing emoji and its description")
    print(traceback.format_exc())
    sys.exit(1)

# Load emoji:keywords map
try:
    with open(EMOJI_MAP, "r") as f:
        emoji_map = json.load(f)
except FileNotFoundError:
    print("Could not fetch existing emojis mapped to keywords")
    print(traceback.format_exc())
    sys.exit(2)
except json.JSONDecodeError:
    print(f"Invalid JSON data received from file {EMOJI_MAP}")
    print(traceback.format_exc())
    sys.exit(2)

# Parse unicode text into two lists of emoji and its corresponding description
EMOJI = [] # list of grouped emojis
DESC = [] # list of grouped emoji descriptions
# Emoji groups: Smileys & Emotion, People & Body, Animals & Nature, Food & Drink,
# Travel & Places, Activities, Objects, Symbols, Flags
emoji_group = []
desc_group = []
for line in data:
    if not line.startswith("#") and line.find("fully-qualified") != -1:
        match = re.search(r"# (\S+) E\d+\.\d+ (.+)$", line)
        if match:
            emoji = match.group(1)
            desc = match.group(2)
            emoji_group.append(emoji)
            key_words = emoji_map.get(emoji)
            if key_words:
                try:
                    key_words.remove(desc)
                except ValueError:
                    pass
                desc = [desc]
                desc.extend(key_words)
                desc_group.append(desc)
            else:
                desc_group.append([desc])
        else:
            print("Could not parse unicode test file containing emoji and its description")
            print(traceback.format_exc())
            sys.exit(3)
    if emoji_group and desc_group and ( line.startswith("# group:") or line.startswith("#EOF") ):
        EMOJI.append(emoji_group)
        DESC.append(desc_group)
        emoji_group = []
        desc_group = []

# Save parsed data
print(f"Saving emoji characters to {CHAR_FILE}")
with open(CHAR_FILE, "w") as f:
    json.dump(EMOJI, f, indent=2)
print(f"Saving emoji descriptions/keywords to {KEY_FILE}")
with open(KEY_FILE, "w") as f:
    json.dump(DESC, f, indent=2)
