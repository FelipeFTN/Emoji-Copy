import Gio from "gi://Gio";
import GLib from "gi://GLib";

async function ReadJsonFile(file_path) {
  const p = GLib.build_filenamev([
    GLib.get_home_dir(),
    ".local",
    "share",
    "gnome-shell",
    "extensions",
    "emoji-copy@felipeftn",
    file_path,
  ]);
  const f = Gio.File.new_for_path(p);
  const [_ok, content, _etag] = await f.load_contents(null);
  const decoder = new TextDecoder("utf-8");
  const f_content = decoder.decode(content);

  return JSON.parse(f_content);
}

export { ReadJsonFile };
