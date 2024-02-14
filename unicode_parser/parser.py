#!/usr/bin/env python3

import re
import sys
import json
from urllib.request import urlopen
import traceback
from emoji_map import emoji_map

# Constants
UNICODE_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt" # Source: https://unicode.org
CHAR_FILE = "./emoji-copy@felipeftn/data/emojisCharacters.json" # Emoji characters
KEY_FILE = "./emoji-copy@felipeftn/data/emojisKeywords.json" # Description/keywords of emoji characters

# Read unicode file
try:
    data = urlopen(UNICODE_URL).read().decode("utf-8") # Read file from URL
    data = data.split("\n") # then split it into lines
except Exception as e:
    print("Could not read unicode test file containing emoji and its description")
    print(e)
    sys.exit(1)

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
            key_words = emoji_map.get(emoji) # TODO: Read from JSON
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
            sys.exit(2)
    if emoji_group and desc_group and ( line.startswith("# group:") or line.startswith("#EOF") ):
        EMOJI.append(emoji_group)
        DESC.append(desc_group)
        emoji_group = []
        desc_group = []

# Save parsed data
with open(CHAR_FILE, "w+") as f:
    json.dump(EMOJI, f, indent=2)
with open(KEY_FILE, "w+") as f:
    json.dump(DESC, f, indent=2)
