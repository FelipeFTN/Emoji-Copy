import Gio from "gi://Gio";
import GLib from "gi://GLib";
// We use sql.js as GDA is broken in OpenSuse
// Bug report: https://bugzilla.opensuse.org/show_bug.cgi?id=1219970
import { initSqlJs } from './sql.js';

async function ReadDb() {
  const p = GLib.build_filenamev([
    GLib.get_home_dir(),
    ".local",
    "share",
    "gnome-shell",
    "extensions",
    "emoji-copy@felipeftn",
    "data",
    "emojis.db"
  ]);
  const f = Gio.File.new_for_path(p);
  const [_ok, content, _etag] = await f.load_contents(null);
  console.info("Read database contents from file!")
  return content;
}

// Load the db
const dataPromise = await ReadDb();
const [SQL, buf] = await Promise.all([initSqlJs(), dataPromise])

export class SQLite {
  constructor(dbname) {
    this.db = new SQL.Database(new Uint8Array(buf));
  }

  select_like_description(description) {
    return this.query(`
      SELECT * FROM emojis WHERE description LIKE '%${description}%';
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
      console.error(sql_query);
      console.error(res);
      return res;
    } else {
      /*
      Result is array of arrays, with each array containing requested column values.
      Following example shows output for select_all()
      [
        [
          "👋🏻",
          "waving hand: light skin tone hand-fingers-open",
          "light skin tone",
          "People & Body"
        ],
        ...
      ]
      */
      return res[0].values;
    }
  }
}
