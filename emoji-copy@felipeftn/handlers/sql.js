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

  select_like_description(description) {
    return this.query(`
      SELECT * FROM emojis WHERE description LIKE '%${description}%';
    `);
  }

  increment_selection(unicode) {
    this.query(
      `UPDATE emojis SET clicked_times = clicked_times + 1 WHERE unicode = '${unicode}'`
    )
  }

  search_description(search_text, skin_tone = 0) {
    const sql_string = search_text
      .split(" ")
      .flatMap((word) => `description LIKE '%${word}%'`)
      .join(" AND ");

    // If skin_tone is not 0, we need to filter by skin_tone
    if (skin_tone != 0) {
      const skin_tone_str = this.get_skin_tone(skin_tone);
      return this.query(`
        SELECT * FROM emojis WHERE (${sql_string}) AND skin_tone LIKE '%${skin_tone_str}%' ORDER BY clicked_times DESC;
      `);
    }

    return this.query(`
      SELECT * FROM emojis WHERE ${sql_string} ORDER BY clicked_times DESC;
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
      item.clicked_times = data[4]
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
