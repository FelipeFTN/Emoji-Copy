import Gio from "gi://Gio";
import GLib from "gi://GLib";

// import Gda from "gi://Gda";
// We use sql.js as GDA is broken in OpenSuse
// Bug report: https://bugzilla.opensuse.org/show_bug.cgi?id=1219970

import { initSqlJs } from "../libs/sql/sql.js";

// extension.js relies on this too, to await the user's custom.json
Gio._promisify(
  Gio.File.prototype,
  "load_contents_async",
  "load_contents_finish",
);

async function ReadDB(extensionPath) {
  const p = GLib.build_filenamev([
    extensionPath,
    "data",
    "emojis.db",
  ]);
  const f = Gio.File.new_for_path(p);
  const [content] = await f.load_contents_async(null);
  return content;
}

export class SQLite {
  constructor() {
    this.db = null;
  }

  async initializeDB(extensionPath) {
    try {
      const [SQL, db] = await Promise.all([initSqlJs(), ReadDB(extensionPath)]);
      this.db = new SQL.Database(new Uint8Array(db));
    } catch (error) {
      // Without the database every query throws; let enable() fail instead of
      // leaving a half-loaded extension that looks enabled and shows nothing.
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  increment_selection(unicode) {
    return this.query(`
      UPDATE emojis SET clicked_times = clicked_times + 1 WHERE unicode = ?
    `, [unicode]);
  }

  // Emojis from the user's custom.json. An emoji that is already in the table
  // keeps its group and its click count unless the entry names a group.
  insert_emoji(unicode, description, group = null) {
    return this.query(`
      INSERT INTO emojis (unicode, description, skin_tone, emoji_group, clicked_times)
      VALUES (?, ?, '', COALESCE(?, 'Symbols'), 0)
      ON CONFLICT(unicode) DO UPDATE SET
        description = excluded.description,
        emoji_group = COALESCE(?, emoji_group)
    `, [unicode, description, group, group]);
  }

search_description(search_text, skin_tone = 0, gender = 0) {
  const buildQuery = (pattern) => {
    const words = search_text.split(" ");
    const sql_string = words.map(() => `description LIKE ?`).join(" AND ");
    const params = words.map((word) => pattern.replace('WORD', word));

    let skin_filter;
    if (skin_tone != 0) {
      skin_filter = ` AND skin_tone LIKE ?`;
      params.push(`%${this.get_skin_tone(skin_tone)}%`);
    } else {
      skin_filter = ` AND skin_tone = ''`;
    }

    const gender_filter = this.get_gender_filter(gender);

    const sql = "SELECT * FROM emojis WHERE " + sql_string + skin_filter + gender_filter + " ORDER BY clicked_times DESC;";
    return { sql, params };
  };

  // Try prefix search first
  const prefix_query = buildQuery('WORD%');
  const prefix_results = this.query(prefix_query.sql, prefix_query.params);
  
  if (prefix_results.length >= 11) {
    return prefix_results;
  }

  // Fallback to contains search and combine results
  const contains_query = buildQuery('%WORD%');
  const contains_results = this.query(contains_query.sql, contains_query.params);
  const seen = new Set(prefix_results.map(item => item.unicode));
  
  return [...prefix_results, ...contains_results.filter(item => !seen.has(item.unicode))];
}

  /**
   * Selects emojis by group, filtered by skin tone and gender if provided.
   * If skin_tone is not 0, only emojis with the matching skin tone or no skin tone (e.g., objects) are returned.
   * If gender is not 0, only emojis with the matching gender or no gender preference are returned.
   * @param {string} group - The emoji group/category
   * @param {number} skin_tone - The selected skin tone (0 = no filter)
   * @param {number} gender - The selected gender (0 = no filter, 1 = women, 2 = men)
   */
  select_by_group(group, skin_tone = 0, gender = 0) {
    const params = [group];
    let skin_filter = '';
    if (skin_tone != 0) {
      // Show emojis that either have no skin tone (objects, etc) or match the selected skin tone
      skin_filter = ` AND skin_tone LIKE ?`;
      params.push(`%${this.get_skin_tone(skin_tone)}%`);
    } else {
      // Show all emojis in the group
      skin_filter = ` AND skin_tone = ''`;
    }

    const gender_filter = this.get_gender_filter(gender);

    return this.query(
      "SELECT * FROM emojis WHERE emoji_group=?" + skin_filter + gender_filter + ";",
      params
    );
  }

  select_all() {
    return this.query(`
      SELECT * FROM emojis;
    `);
  }

  query(sql_query, params = []) {
    const res = this.db.exec(sql_query, params);
    if (res.length == 0) {
      return [];
    }

    // Transform the result from array of arrays to emoji item object
    let result = res[0].values.map((data) => {
      let item = {};
      item.unicode = data[0];
      item.description = data[1];
      item.skin_tone = data[2];
      item.group = data[3];
      item.clicked_times = data[4];
      return item;
    });
    return result;
  }

  get_skin_tone(skin_tone) {
    // Skin tones map to the following values from emojis.db:
    // 0: no skin tone
    // 1: light skin tone
    // 2: medium-light skin tone
    // 3: medium skin tone
    // 4: medium-dark skin tone
    // 5: dark skin tone
    const skin_tones = {
      0: "",
      1: "light",
      2: "medium-light",
      3: "medium",
      4: "medium-dark",
      5: "dark",
    };
    return skin_tones[skin_tone];
  }

  get_gender_filter(gender) {
    // Gender filtering based on description field content:
    // 0: no filter (show all)
    // 1: women (show emojis with "woman" in description or gender-neutral emojis)
    // 2: men (show emojis with "man" in description but not "woman", or gender-neutral emojis)
    // So 1 is "woman, or no man" and 2 is "not woman": an emoji with "man" lands
    // in both only when it is neutral, and the men side has no "man" test
    // because "not woman" already covers it.
    // Both words are matched as whole words: '%man%' also matched "manicure",
    // "merman", "human" and the flags of Oman and Germany, which took 33
    // neutral emojis out of the women filter. Descriptions are keyword lists,
    // so a word boundary is a space, a comma, a colon or an apostrophe, and
    // the padding covers the first and the last word. GLOB is case sensitive,
    // like the descriptions in the db.
    const hasWord = (word) =>
      `(' ' || description || ' ') GLOB '*[ ,:’'']${word}[ ,:’'']*'`;

    switch (gender) {
      case 1: // Women
        return ` AND (${hasWord("woman")} OR NOT ${hasWord("man")})`;
      case 2: // Men
        return ` AND (NOT ${hasWord("woman")})`;
      default: // No filter
        return '';
    }
  }
}
