#!/usr/bin/env python3

### THIS FILE SHOULD CONTAIN ALL THE EMOJIS WE WANT TO EXPLICITLY INCLUDE IN THE DB FILE

# UNICODE: DESCRIPTION
CUSTOM_EMOJIS = {
    "🇦": {"description": ["regional indicator", "letter a"], "group": "Symbols"},
    "🇧": {"description": ["regional indicator", "letter b"], "group": "Symbols"},
    "🇨": {"description": ["regional indicator", "letter c"], "group": "Symbols"},
    "🇩": {"description": ["regional indicator", "letter d"], "group": "Symbols"},
    "🇪": {"description": ["regional indicator", "letter e"], "group": "Symbols"},
    "🇫": {"description": ["regional indicator", "letter f"], "group": "Symbols"},
    "🇬": {"description": ["regional indicator", "letter g"], "group": "Symbols"},
    "🇭": {"description": ["regional indicator", "letter h"], "group": "Symbols"},
    "🇮": {"description": ["regional indicator", "letter i"], "group": "Symbols"},
    "🇯": {"description": ["regional indicator", "letter j"], "group": "Symbols"},
    "🇰": {"description": ["regional indicator", "letter k"], "group": "Symbols"},
    "🇱": {"description": ["regional indicator", "letter l"], "group": "Symbols"},
    "🇲": {"description": ["regional indicator", "letter m"], "group": "Symbols"},
    "🇳": {"description": ["regional indicator", "letter n"], "group": "Symbols"},
    "🇴": {"description": ["regional indicator", "letter o"], "group": "Symbols"},
    "🇵": {"description": ["regional indicator", "letter p"], "group": "Symbols"},
    "🇶": {"description": ["regional indicator", "letter q"], "group": "Symbols"},
    "🇷": {"description": ["regional indicator", "letter r"], "group": "Symbols"},
    "🇸": {"description": ["regional indicator", "letter s"], "group": "Symbols"},
    "🇹": {"description": ["regional indicator", "letter t"], "group": "Symbols"},
    "🇺": {"description": ["regional indicator", "letter u"], "group": "Symbols"},
    "🇻": {"description": ["regional indicator", "letter v"], "group": "Symbols"},
    "🇼": {"description": ["regional indicator", "letter w"], "group": "Symbols"},
    "🇽": {"description": ["regional indicator", "letter x"], "group": "Symbols"},
    "🇾": {"description": ["regional indicator", "letter y"], "group": "Symbols"},
    "🇿": {"description": ["regional indicator", "letter z"], "group": "Symbols"},

    # Other custom emojis can be added here
    # For example:
    # "🥰": {"description": ["smiling face with hearts"], "group": "Smileys & Body"},
}

def get_custom_emojis():
    """
    Returns a list of custom emojis to be included in the database.
    This function is used to explicitly define emojis that should be included,
    such as regional indicators and other specific emojis.
    """
    return CUSTOM_EMOJIS
