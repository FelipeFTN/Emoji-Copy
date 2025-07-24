import Gio from "gi://Gio";
import GLib from "gi://GLib";

// import Gda from "gi://Gda";
// We use sql.js as GDA is broken in OpenSuse
// Bug report: https://bugzilla.opensuse.org/show_bug.cgi?id=1219970

import { initSqlJs } from "../libs/sql/sql.js";

async function ReadDB(extensionPath) {
  const p = GLib.build_filenamev([
    extensionPath,
    "data",
    "emojis.db",
  ]);
  const f = Gio.File.new_for_path(p);
  const [_ok, content, _etag] = await f.load_contents(null);
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
      console.error("Error initializing database:", error);
    }
  }

  destroy() {
    this.db.close();
    this.db = null;
  }

  increment_selection(unicode) {
    return this.query(`
      UPDATE emojis SET clicked_times = clicked_times + 1 WHERE unicode = '${unicode}'
    `);
  }

search_description(search_text, skin_tone = 0) {
  const buildQuery = (pattern) => {
    const sql_string = search_text
      .split(" ")
      .flatMap((word) => `description LIKE '${pattern.replace('WORD', word)}'`)
      .join(" AND ");

    const skin_filter = skin_tone != 0 
      ? ` AND (skin_tone = '' OR skin_tone LIKE '%${this.get_skin_tone(skin_tone)}%')`
      : '';

    return `SELECT * FROM emojis WHERE ${sql_string}${skin_filter} ORDER BY clicked_times DESC;`;
  };

  // Try prefix search first
  const prefix_results = this.query(buildQuery('WORD%'));
  
  if (prefix_results.length >= 11) {
    return prefix_results;
  }

  // Fallback to contains search and combine results
  const contains_results = this.query(buildQuery('%WORD%'));
  const seen = new Set(prefix_results.map(item => item.unicode));
  
  return [...prefix_results, ...contains_results.filter(item => !seen.has(item.unicode))];
}

  select_by_group(group) {
    return this.query(`
      SELECT * FROM emojis WHERE emoji_group='${group}' AND (skin_tone='' OR skin_tone='person');
    `);
  }

  select_all() {
    return this.query(`
      SELECT * FROM emojis;
    `);
  }

  query(sql_query) {
    const res = this.db.exec(sql_query);
    if (res.length == 0) {
      return {};
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
}
