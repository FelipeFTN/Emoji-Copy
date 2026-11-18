"""Tests for the database the build step generates (build/sqlite.py).

The extension code needs a GNOME Shell to run, this part does not: it is plain
python plus the stdlib sqlite3 module.
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(
    0,
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "build"),
)

from sqlite import SQLite  # noqa: E402  (import needs the path above)


class SQLiteBuildTest(unittest.TestCase):
    def setUp(self):
        handle, self.path = tempfile.mkstemp(suffix=".db")
        os.close(handle)
        self.db = SQLite(self.path)
        self.db.create_table()

    def tearDown(self):
        self.db.close()
        os.unlink(self.path)

    def test_insert_many_and_count(self):
        self.db.insert_many([
            ("🐧", "penguin animal bird", "", "Animals & Nature"),
            ("😂", "face tears joy", "", "Smileys & Emotion"),
        ])
        self.assertEqual(self.db.get_count(), 2)

    def test_replacing_the_same_emoji_keeps_one_row(self):
        self.db.insert_many([("🐧", "penguin", "", "Animals & Nature")])
        self.db.insert_many([("🐧", "penguin animal", "", "Animals & Nature")])
        self.assertEqual(self.db.get_count(), 1)
        self.assertEqual(self.db.get_many(1)[0][1], "penguin animal")

    def test_columns_keep_their_order(self):
        self.db.insert_many([
            ("👩", "woman person", "medium skin tone", "People & Body"),
        ])
        row = self.db.get_many(1)[0]
        self.assertEqual(row[0], "👩")
        self.assertEqual(row[2], "medium skin tone")
        self.assertEqual(row[3], "People & Body")

    def test_the_extension_queries_hit_the_indexes(self):
        def plan(sql_query, params=()):
            return " ".join(
                row[-1]
                for row in self.db.cur.execute("EXPLAIN QUERY PLAN " + sql_query, params)
            )

        # Same shape as select_by_group() and search_description() in
        # emoji-copy@felipeftn/handlers/sql.js
        self.assertIn(
            "idx_emojis_group",
            plan(
                "SELECT * FROM emojis WHERE emoji_group=? AND skin_tone = '';",
                ("Animals & Nature",),
            ),
        )
        self.assertIn(
            "idx_emojis_description",
            plan(
                "SELECT * FROM emojis WHERE description LIKE ? AND skin_tone = ''"
                " ORDER BY clicked_times DESC;",
                ("pengu%",),
            ),
        )

    def test_dropping_the_table_removes_every_row(self):
        self.db.insert_many([("🐧", "penguin", "", "Animals & Nature")])
        self.db.drop_table()
        self.db.create_table()
        self.assertEqual(self.db.get_count(), 0)


if __name__ == "__main__":
    unittest.main()
