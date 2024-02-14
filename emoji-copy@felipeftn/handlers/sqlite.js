import Gda from "gi://Gda";
import GLib from "gi://GLib";

export class SQLite {
  constructor(file_name) {
    const p = GLib.build_filenamev([
      GLib.get_home_dir(),
      ".local",
      "share",
      "gnome-shell",
      "extensions",
      "emoji-copy@felipeftn",
      "data",
    ]);

    this.conn = Gda.open_sqlite(p, file_name, False);
  }

  select(emoji_description) {
    query = this.conn.execute_select_command(`
      SELECT * FROM emojis WHERE description LIKE %${emoji_description}%;
    `);
    return query.dump_as_string();
  }
}
