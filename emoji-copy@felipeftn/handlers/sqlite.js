import Gda from "gi://Gda";
import GLib from "gi://GLib";

export class SQLite {
  constructor(dbname) {
    const p = GLib.build_filenamev([
      GLib.get_home_dir(),
      ".local",
      "share",
      "gnome-shell",
      "extensions",
      "emoji-copy@felipeftn",
      "data",
    ]);
    this.connection = new Gda.Connection({
      provider: Gda.Config.get_provider("SQLite"),
      cnc_string: `DB_DIR=${p};DB_NAME=${dbname}`,
    });
    if (this.connection === null) {
      console.error("Error opening database connection!");
    }
    this.connection.open();
  }

  select_by_description(description) {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    try {
      const dm = this.connection.execute_select_command(`
        SELECT * FROM emojis WHERE description LIKE '%${description}%';
      `);

      const iter = dm.create_iter();
      const items = [];

      while (iter.move_next()) {
        const unicode = iter.get_value_for_field("unicode");
        const description = iter.get_value_for_field("description");
        const skin_tone = iter.get_value_for_field("skin_tone");
        const group = iter.get_value_for_field("emoji_group");

        items.push({
          unicode,
          description,
          skin_tone,
          group,
        });
      }

      return items;
    } catch (error) {
      console.error("Error executing select command:", error.message);
      return [];
    }
  }

  select_by_group(group) {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    try {
      const dm = this.connection.execute_select_command(`
        SELECT * FROM emojis WHERE emoji_group='${group}';
      `);

      const iter = dm.create_iter();
      const items = [];

      while (iter.move_next()) {
        const unicode = iter.get_value_for_field("unicode");
        const description = iter.get_value_for_field("description");
        const skin_tone = iter.get_value_for_field("skin_tone");
        const group = iter.get_value_for_field("emoji_group");

        items.push({
          unicode,
          description,
          skin_tone,
          group,
        });
      }

      return items;
    } catch (error) {
      console.error("Error executing select command:", error.message);
      return [];
    }
  }

  select_all() {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    try {
      const dm = this.connection.execute_select_command(`
        SELECT * FROM emojis;
      `);

      const iter = dm.create_iter();
      const items = [];

      while (iter.move_next()) {
        const unicode = iter.get_value_for_field("unicode");
        const description = iter.get_value_for_field("description");
        const skin_tone = iter.get_value_for_field("skin_tone");
        const group = iter.get_value_for_field("emoji_group");

        items.push({
          unicode,
          description,
          skin_tone,
          group,
        });
      }

      return items;
    } catch (error) {
      console.error("Error executing select command:", error.message);
      return [];
    }
  }
}
