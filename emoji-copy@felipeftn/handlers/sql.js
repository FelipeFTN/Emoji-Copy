import Gio from "gi://Gio";
import GLib from "gi://GLib";

// import Gda from "gi://Gda";
// We use sql.js as GDA is broken in OpenSuse
// Bug report: https://bugzilla.opensuse.org/show_bug.cgi?id=1219970

import { initSqlJs } from "../libs/sql/sql.js";

async function ReadDB() {
  const p = GLib.build_filenamev([
    GLib.get_home_dir(),
    ".local",
    "share",
    "gnome-shell",
    "extensions",
    "emoji-copy@felipeftn",
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

  async initializeDB() {
    try {
      const [SQL, db] = await Promise.all([initSqlJs(), ReadDB()]);
      this.db = new SQL.Database(new Uint8Array(db));
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  destroy() {
    this.db.close();
    this.db = null;
  }

  select_like_description(description) {
    return this.query(`
      SELECT * FROM emojis WHERE description LIKE '%${description}%';
    `);
  }

  search_description(search_text) {
    const sql_string = search_text
      .split(" ")
      .flatMap((word) => `description LIKE '%${word}%'`)
      .join(" AND ");
    return this.query(`
      SELECT * FROM emojis WHERE ${sql_string} ORDER BY LENGTH(description);
    `);
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
      return item;
    });
    return result;
  }
}
