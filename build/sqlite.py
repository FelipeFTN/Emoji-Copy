#!/usr/bin/env python3

import sqlite3

# Constants follow
# See parser.py constant "DB_PATH" for path to SQLite database

# SQL query to create table
CREATE_TBL = """
CREATE TABLE IF NOT EXISTS emojis(
    unicode VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255),
    skin_tone VARCHAR(255),
    emoji_group VARCHAR(255),
    clicked_times NUMBER default 0
)
"""

CREATE_KEYWORDS_TBL = """
CREATE TABLE IF NOT EXISTS emoji_keywords(
    unicode VARCHAR(255),
    lang VARCHAR(10),
    name VARCHAR(255),
    keywords TEXT,
    PRIMARY KEY (unicode, lang)
);
CREATE INDEX IF NOT EXISTS idx_emoji_keywords_lang ON emoji_keywords(lang);
"""

CREATE_META_TBL = """
CREATE TABLE IF NOT EXISTS meta(
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
)
"""

# SQL query to insert/replace/update emoji in table
INSERT_TBL = """
REPLACE INTO emojis VALUES (?, ?, ?, ?, 0)
"""

INSERT_KEYWORDS = """
REPLACE INTO emoji_keywords VALUES (?, ?, ?, ?)
"""

INSERT_META = """
REPLACE INTO meta VALUES (?, ?)
"""

# SQL query to get all entries from table
GETALL_TBL = """
SELECT * FROM emojis
"""

# SQL query to count number of rows in table
COUNT_TBL = """
SELECT COUNT(1) FROM emojis
"""

# SQL query to delete table
DROP_TBL = """
DROP TABLE IF EXISTS emojis;
DROP TABLE IF EXISTS emoji_keywords;
DROP TABLE IF EXISTS meta;
"""

# SQL query to enable full auto vacuum
ENABLE_FULL_AUTO_VACUUM = """
PRAGMA auto_vacuum=FULL
"""

# SQL query to vacuum database
VACUUM = """
VACUUM
"""


class SQLite:
    def __init__(self, database):
        self.database = database
        self.conn = sqlite3.connect(self.database)
        self.cur = self.conn.cursor()

    def create_table(self):
        self.cur.execute(CREATE_TBL)
        self.cur.executescript(CREATE_KEYWORDS_TBL)
        self.cur.execute(CREATE_META_TBL)
        self.conn.commit()

    def set_meta(self, key, value):
        self.cur.execute(INSERT_META, (key, value))
        self.conn.commit()

    def insert_or_update(self, item):
        self.cur.execute(INSERT_TBL, item)
        self.conn.commit()

    def insert_many(self, items):
        self.cur.executemany(INSERT_TBL, items)
        self.conn.commit()

    def insert_many_keywords(self, items):
        self.cur.executemany(INSERT_KEYWORDS, items)
        self.conn.commit()

    def get_many(self, num):
        self.cur.execute(GETALL_TBL)
        return self.cur.fetchmany(num)

    def get_count(self):
        self.cur.execute(COUNT_TBL)
        return self.cur.fetchone()[0]

    def get_keywords_count(self):
        self.cur.execute("SELECT COUNT(1) FROM emoji_keywords")
        return self.cur.fetchone()[0]

    def drop_table(self):
        self.cur.executescript(DROP_TBL)
        self.conn.commit()

    def vacuum(self):
        self.cur.execute(ENABLE_FULL_AUTO_VACUUM)
        self.cur.execute(VACUUM)

    def close(self):
        self.conn.close()
