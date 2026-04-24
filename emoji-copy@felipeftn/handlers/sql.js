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
    // Escape single quotes to prevent SQL injection
    const escaped = unicode.replace(/'/g, "''");
    return this.query(`
      UPDATE emojis SET clicked_times = clicked_times + 1 WHERE unicode = '${escaped}'
    `);
  }

  search_description(search_text, skin_tone = 0, gender = 0) {
    // Escape single quotes to prevent SQL injection
    const escaped_text = search_text.replace(/'/g, "''");
    const words = escaped_text.split(" ");
    
    // Build SQL conditions efficiently with a single pass
    const conditions = [];
    for (let i = 0; i < words.length; i++) {
      // Use LIKE with prefix match first, then fallback pattern
      conditions.push(`(description LIKE '${words[i]}%' OR description LIKE '%${words[i]}%')`);
    }
    const sql_string = conditions.join(" AND ");

    const skin_filter = skin_tone != 0 
      ? ` AND skin_tone LIKE '%${this.get_skin_tone(skin_tone)}%'`
      : ` AND skin_tone = ''`;

    const gender_filter = this.get_gender_filter(gender);

    // Single optimized query that handles both prefix and contains matching
    return this.query(`
      SELECT * FROM emojis 
      WHERE ${sql_string}${skin_filter}${gender_filter} 
      ORDER BY 
        CASE 
          WHEN description LIKE '${words[0]}%' THEN 0
          ELSE 1
        END,
        clicked_times DESC;
    `);
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
    // Escape single quotes to prevent SQL injection
    const escaped_group = group.replace(/'/g, "''");
    let skin_filter = '';
    if (skin_tone != 0) {
      // Show emojis that either have no skin tone (objects, etc) or match the selected skin tone
      skin_filter = ` AND skin_tone LIKE '%${this.get_skin_tone(skin_tone)}%'`;
    } else {
      // Show all emojis in the group
      skin_filter = ` AND skin_tone = ''`;
    }

    const gender_filter = this.get_gender_filter(gender);

    return this.query(`
      SELECT * FROM emojis WHERE emoji_group='${escaped_group}'${skin_filter}${gender_filter};
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
    switch (gender) {
      case 1: // Women
        return ` AND (description LIKE '%woman%' OR (description NOT LIKE '%man%' AND description NOT LIKE '%woman%'))`;
      case 2: // Men  
        return ` AND ((description LIKE '%man%' AND description NOT LIKE '%woman%') OR (description NOT LIKE '%man%' AND description NOT LIKE '%woman%'))`;
      default: // No filter
        return '';
    }
  }
}
