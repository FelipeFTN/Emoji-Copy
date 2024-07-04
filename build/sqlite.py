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

# SQL query to insert/replace/update emoji in table
INSERT_TBL = """
REPLACE INTO emojis VALUES (?, ?, ?, ?, 0)
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
DROP TABLE IF EXISTS emojis
"""

class SQLite:
    def __init__(self, database):
        self.database = database
        self.conn = sqlite3.connect(self.database)
        self.cur = self.conn.cursor()

    def create_table(self):
        self.cur.execute(CREATE_TBL)
        self.conn.commit()

    def insert_or_update(self, item):
        self.cur.execute(INSERT_TBL, item)
        self.conn.commit()

    def insert_many(self, items):
        self.cur.executemany(INSERT_TBL, items)
        self.conn.commit()

    def get_many(self, num):
        self.cur.execute(GETALL_TBL)
        return self.cur.fetchmany(num)

    def get_count(self):
        self.cur.execute(COUNT_TBL)
        return self.cur.fetchone()[0]

    def drop_table(self):
        self.cur.execute(DROP_TBL)

    def close(self):
        self.conn.close()
