#!/usr/bin/env python3

import sqlite3

# r'./emoji-copy@felipeftn/data/emojis.db'

class SQLite:
    def __init__(self, database):
        self.database = database

        self.conn = sqlite3.connect(self.database)
        self.cur = self.conn.cursor()

    def create_table(self):
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS emojis(
                unicode TEXT PRIMARY KEY,
                description TEXT,
                skin_tone TEXT
            );
        """)
        self.conn.commit()

    def insert_or_update(self, item):
        unicode = item[0]
        desc    = item[1]

        self.cur.execute("""
            UPDATE emojis SET description=(description || " " || ?)
            WHERE unicode=?
        ;""", [desc, unicode])
        self.conn.commit()

        self.cur.execute("INSERT OR IGNORE INTO emojis VALUES(?, ?, ?);", item)
        self.conn.commit()

    def get_many(self, n):
        self.cur.execute("SELECT * FROM emojis;")
        return self.cur.fetchmany(n)

    def get_count(self):
        self.cur.execute("SELECT COUNT(*) FROM emojis;")
        return self.cur.fetchone()

    def drop_table(self):
        self.cur.execute("DROP TABLE IF EXISTS emojis;")

    def close(self):
        self.conn.close()
