import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { initSqlJs } from "../libs/sql/sql.js";

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
    this.searchLang = "en";
  }

  async initializeDB(extensionPath) {
    try {
      const [SQL, db] = await Promise.all([initSqlJs(), ReadDB(extensionPath)]);
      this.db = new SQL.Database(new Uint8Array(db));

      // Ensure required tables exist (smooth migration for older databases)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS emoji_keywords (
            unicode VARCHAR(255),
            lang VARCHAR(10),
            name VARCHAR(255),
            keywords TEXT,
            PRIMARY KEY (unicode, lang)
        );
        CREATE INDEX IF NOT EXISTS idx_emoji_keywords_lang ON emoji_keywords(lang);
        CREATE TABLE IF NOT EXISTS meta (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT
        );
      `);

      // Populate English keywords if emoji_keywords is empty
      const checkRes = this.db.exec("SELECT COUNT(1) FROM emoji_keywords;");
      if (checkRes.length === 0 || checkRes[0].values[0][0] === 0) {
        this.db.exec(`
          INSERT OR IGNORE INTO emoji_keywords (unicode, lang, name, keywords)
          SELECT unicode, 'en', description, description FROM emojis;
        `);
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  setSearchLanguage(lang) {
    if (lang && typeof lang === "string") {
      this.searchLang = lang.trim();
    }
  }

  getSearchLanguage() {
    return this.searchLang || "en";
  }

  get_meta(key) {
    if (!this.db) return null;
    try {
      const res = this.db.exec("SELECT value FROM meta WHERE key = ?;", [key]);
      if (res.length > 0 && res[0].values.length > 0) {
        return res[0].values[0][0];
      }
    } catch (_e) {}
    return null;
  }

  set_meta(key, value) {
    if (!this.db) return;
    try {
      this.db.exec("REPLACE INTO meta VALUES (?, ?);", [key, String(value)]);
    } catch (_e) {}
  }

  insert_language_keywords(lang, mapping) {
    if (!this.db || !mapping || !lang) return;
    try {
      this.db.exec("BEGIN TRANSACTION;");
      const stmt = this.db.prepare(
        "REPLACE INTO emoji_keywords (unicode, lang, name, keywords) VALUES (?, ?, ?, ?);"
      );
      for (const [unicode, entry] of Object.entries(mapping)) {
        if (!entry) continue;
        let name = "";
        let keywords = "";
        if (typeof entry === "string") {
          name = entry.split(" ")[0] || "";
          keywords = entry;
        } else if (typeof entry === "object") {
          name = entry.name || "";
          keywords = Array.isArray(entry.keywords)
            ? entry.keywords.join(" ")
            : (entry.keywords || name);
        }
        stmt.run([unicode, lang, name, keywords]);
      }
      stmt.free();
      this.db.exec("COMMIT;");
    } catch (err) {
      try {
        this.db.exec("ROLLBACK;");
      } catch (_) {}
      console.error(`Error inserting keywords for language '${lang}':`, err);
    }
  }

  increment_selection(unicode) {
    return this.query(`
      UPDATE emojis SET clicked_times = clicked_times + 1 WHERE unicode = ?
    `, [unicode]);
  }

  search_description(search_text, skin_tone = 0, gender = 0, search_lang = null) {
    if (!search_text) return [];
    const words = search_text.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const userLang = (search_lang || this.searchLang || "en").toLowerCase();

    const buildQuery = (patternTemplate, targetLang = null) => {
      const sql_string = words.map(() => `k.keywords LIKE ?`).join(" AND ");
      const params = words.map((word) => patternTemplate.replace("WORD", word));

      let skin_filter = "";
      if (skin_tone != 0) {
        skin_filter = ` AND e.skin_tone LIKE ?`;
        params.push(`%${this.get_skin_tone(skin_tone)}%`);
      } else {
        skin_filter = ` AND e.skin_tone = ''`;
      }

      const gender_filter = this.get_gender_filter(gender);

      let sql = "";
      let finalParams = [];
      if (targetLang !== null) {
        sql = `SELECT DISTINCT e.unicode, e.description, e.skin_tone, e.emoji_group, e.clicked_times, k.name AS localized_name
               FROM emojis e
               JOIN emoji_keywords k ON e.unicode = k.unicode
               WHERE k.lang = ? AND (${sql_string}) ${skin_filter} ${gender_filter}
               ORDER BY e.clicked_times DESC;`;
        finalParams = [targetLang, ...params];
      } else {
        sql = `SELECT DISTINCT e.unicode, e.description, e.skin_tone, e.emoji_group, e.clicked_times, k.name AS localized_name
               FROM emojis e
               JOIN emoji_keywords k ON e.unicode = k.unicode
               WHERE (${sql_string}) ${skin_filter} ${gender_filter}
               ORDER BY e.clicked_times DESC;`;
        finalParams = [...params];
      }
      return { sql, params: finalParams };
    };

    const executeSearch = (targetLang) => {
      // 1. Try prefix search first
      const prefix_query = buildQuery("WORD%", targetLang);
      const prefix_results = this.query(prefix_query.sql, prefix_query.params);
      if (prefix_results.length >= 11) {
        return prefix_results;
      }
      // 2. Substring search fallback
      const contains_query = buildQuery("%WORD%", targetLang);
      const contains_results = this.query(contains_query.sql, contains_query.params);
      const seen = new Set(prefix_results.map((item) => item.unicode));
      return [...prefix_results, ...contains_results.filter((item) => !seen.has(item.unicode))];
    };

    // Stage 1: Query user's current language (if not English)
    let results = [];
    if (userLang && userLang !== "en") {
      results = executeSearch(userLang);
    }

    // Stage 2: If no results found or if userLang is 'en', query English
    if (results.length === 0) {
      results = executeSearch("en");
    }

    // Stage 3 (Fallback): Fall back to all available languages only when there is no hit
    if (results.length === 0) {
      results = executeSearch(null);
    }

    return results;
  }

  select_by_group(group, skin_tone = 0, gender = 0) {
    const params = [this.searchLang || "en", group];
    let skin_filter = "";
    if (skin_tone != 0) {
      skin_filter = ` AND e.skin_tone LIKE ?`;
      params.push(`%${this.get_skin_tone(skin_tone)}%`);
    } else {
      skin_filter = ` AND e.skin_tone = ''`;
    }

    const gender_filter = this.get_gender_filter(gender);

    return this.query(
      `SELECT e.unicode, e.description, e.skin_tone, e.emoji_group, e.clicked_times, k.name AS localized_name
       FROM emojis e
       LEFT JOIN emoji_keywords k ON e.unicode = k.unicode AND k.lang = ?
       WHERE e.emoji_group = ? ${skin_filter} ${gender_filter};`,
      params
    );
  }

  select_all() {
    return this.query(`
      SELECT unicode, description, skin_tone, emoji_group, clicked_times, NULL AS localized_name FROM emojis;
    `);
  }

  query(sql_query, params = []) {
    const res = this.db.exec(sql_query, params);
    if (res.length === 0) {
      return [];
    }

    let result = res[0].values.map((data) => {
      let item = {};
      item.unicode = data[0];
      item.description = data[1];
      item.skin_tone = data[2];
      item.group = data[3];
      item.clicked_times = data[4];
      item.localized_name = data[5] || null;
      return item;
    });
    return result;
  }

  get_skin_tone(skin_tone) {
    const skin_tones = {
      0: "",
      1: "light",
      2: "medium-light",
      3: "medium",
      4: "medium-dark",
      5: "dark",
    };
    return skin_tones[skin_tone] || "";
  }

  get_gender_filter(gender) {
    switch (gender) {
      case 1:
        return ` AND (e.description LIKE '%woman%' OR (e.description NOT LIKE '%man%' AND e.description NOT LIKE '%woman%'))`;
      case 2:
        return ` AND ((e.description LIKE '%man%' AND e.description NOT LIKE '%woman%') OR (e.description NOT LIKE '%man%' AND e.description NOT LIKE '%woman%'))`;
      default:
        return "";
    }
  }
}
