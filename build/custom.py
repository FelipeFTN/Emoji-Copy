#!/usr/bin/env python3

### THIS FILE SHOULD CONTAIN ALL THE EMOJIS WE WANT TO EXPLICITLY INCLUDE IN THE DB FILE

REGIONAL_INDICATORS = [
    "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯",
    "🇰", "🇱", "🇲", "🇳", "🇴", "🇵", "🇶", "🇷", "🇸", "🇹",
    "🇺", "🇻", "🇼", "🇽", "🇾", "🇿"
]

REGIONAL_TO_KEYWORDS = {
    "🇦": ["regional indicator", "letter a"],
    "🇧": ["regional indicator", "letter b"],
    "🇨": ["regional indicator", "letter c"],
    "🇩": ["regional indicator", "letter d"],
    "🇪": ["regional indicator", "letter e"],
    "🇫": ["regional indicator", "letter f"],
    "🇬": ["regional indicator", "letter g"],
    "🇭": ["regional indicator", "letter h"],
    "🇮": ["regional indicator", "letter i"],
    "🇯": ["regional indicator", "letter j"],
    "🇰": ["regional indicator", "letter k"],
    "🇱": ["regional indicator", "letter l"],
    "🇲": ["regional indicator", "letter m"],
    "🇳": ["regional indicator", "letter n"],
    "🇴": ["regional indicator", "letter o"],
    "🇵": ["regional indicator", "letter p"],
    "🇶": ["regional indicator", "letter q"],
    "🇷": ["regional indicator", "letter r"],
    "🇸": ["regional indicator", "letter s"],
    "🇹": ["regional indicator", "letter t"],
    "🇺": ["regional indicator", "letter u"],
    "🇻": ["regional indicator", "letter v"],
    "🇼": ["regional indicator", "letter w"],
    "🇽": ["regional indicator", "letter x"],
    "🇾": ["regional indicator", "letter y"],
    "🇿": ["regional indicator", "letter z"]
}

def get_custom_emojis():
    """
    Returns a list of custom emojis to be included in the database.
    This function is used to explicitly define emojis that should be included,
    such as regional indicators and other specific emojis.
    """
    custom_emojis = [
        # Regional indicators
        *REGIONAL_INDICATORS,
        
        # Other custom emojis can be added here
        # "❤️", "👍", "😊", "😂", "🔥", "✨", "🌟", "💯"
    ]

    custom_keywords = {
        "Symbols": REGIONAL_TO_KEYWORDS
    }
    
    return custom_emojis, custom_keywords
