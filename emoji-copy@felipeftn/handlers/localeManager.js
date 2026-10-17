import GLib from "gi://GLib";
import Gio from "gi://Gio";

Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");
Gio._promisify(Gio.File.prototype, "replace_contents_async", "replace_contents_finish");

export const DEFAULT_BUNDLED_LANGUAGES = [
  "en", "zh", "es", "fr", "de", "ja", "ru", "pt", "hi", "ar", "bn", "ko"
];

export const LANGUAGE_NAMES = {
  en: "English",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  ru: "Русский",
  pt: "Português",
  hi: "हिन्दी (Hindi)",
  ar: "العربية (Arabic)",
  bn: "বাংলা (Bengali)",
  ko: "한국어 (Korean)",
};

const CLDR_BASE_URL = "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json";

/**
 * Gets the primary language code of the user's desktop environment
 */
export function getSystemLanguage() {
  const langs = GLib.get_language_names();
  for (const l of langs) {
    const code = l.split(".")[0].split("_")[0].toLowerCase();
    if (code && code !== "c" && code !== "posix") {
      return code;
    }
  }
  return "en";
}

/**
 * Asynchronously fetch text from a URL using Soup 3.0 or Gio.File fallback
 */
async function fetchTextAsync(url) {
  try {
    const Soup = (await import("gi://Soup?version=3.0")).default;
    const session = new Soup.Session();
    const msg = Soup.Message.new("GET", url);
    const bytes = await session.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null);
    if (msg.get_status() !== Soup.Status.OK) {
      return null;
    }
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes.get_data());
  } catch (_e) {
    try {
      const file = Gio.File.new_for_uri(url);
      const [content] = await file.load_contents_async(null);
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(content);
    } catch (_err) {
      return null;
    }
  }
}

/**
 * Parses Unicode CLDR annotations JSON to a compact character->keywords dictionary
 */
function parseCldrAnnotations(jsonText) {
  if (!jsonText) return {};
  try {
    const data = JSON.parse(jsonText);
    const ann = data?.annotations?.annotations || {};
    const mapping = {};
    for (const [char, item] of Object.entries(ann)) {
      const kws = [];
      if (Array.isArray(item.default)) kws.push(...item.default);
      if (Array.isArray(item.tts)) kws.push(...item.tts);
      if (kws.length > 0) {
        mapping[char] = kws.join(" ");
        const noVs = char.replace(/\ufe0f/g, "");
        if (!mapping[noVs]) {
          mapping[noVs] = kws.join(" ");
        }
      }
    }
    return mapping;
  } catch (e) {
    return {};
  }
}

export class LocaleManager {
  constructor(extensionPath) {
    this.extensionPath = extensionPath;
    this.userCacheDir = GLib.build_filenamev([
      GLib.get_user_data_dir(),
      "emoji-copy",
      "locales",
    ]);
  }

  getBundledLanguages(sqlite) {
    if (sqlite) {
      const meta = sqlite.get_meta("bundled_languages");
      if (meta) {
        return meta.split(",").map((s) => s.trim().toLowerCase());
      }
    }
    return DEFAULT_BUNDLED_LANGUAGES;
  }

  isLanguageBundled(lang, sqlite) {
    const bundled = this.getBundledLanguages(sqlite);
    return bundled.includes(lang.toLowerCase());
  }

  /**
   * Initializes language support for the current user's system language
   */
  async init(sqlite) {
    const lang = getSystemLanguage();
    if (this.isLanguageBundled(lang, sqlite)) {
      // Mainstream language already bundled in the base database: instant 0-config ready
      return { lang, status: "bundled" };
    }

    // Check if local pack or cache exists
    const localMapping = await this.loadLocalMapping(lang);
    if (localMapping) {
      sqlite.append_keywords_batch(localMapping);
      return { lang, status: "cached" };
    }

    // Asynchronously download in the background without blocking GNOME Shell
    this.downloadAndApplyLanguage(lang, sqlite).catch((err) => {
      console.warn(`[Emoji Copy] Auto-download for language '${lang}' failed:`, err);
    });

    return { lang, status: "downloading" };
  }

  /**
   * Loads mapping from bundled extension data or user cache
   */
  async loadLocalMapping(lang) {
    // 1. Try extension bundled locale pack
    const bundledPath = GLib.build_filenamev([
      this.extensionPath,
      "data",
      "locales",
      `${lang}.json`,
    ]);
    const bundledFile = Gio.File.new_for_path(bundledPath);
    if (bundledFile.query_exists(null)) {
      try {
        const [content] = await bundledFile.load_contents_async(null);
        return JSON.parse(new TextDecoder("utf-8").decode(content));
      } catch (_e) {}
    }

    // 2. Try user data cache
    const userPath = GLib.build_filenamev([this.userCacheDir, `${lang}.json`]);
    const userFile = Gio.File.new_for_path(userPath);
    if (userFile.query_exists(null)) {
      try {
        const [content] = await userFile.load_contents_async(null);
        return JSON.parse(new TextDecoder("utf-8").decode(content));
      } catch (_e) {}
    }

    return null;
  }

  /**
   * Downloads CLDR annotations from official Unicode GitHub, caches locally, and updates SQLite
   */
  async downloadAndApplyLanguage(lang, sqlite) {
    const annUrl = `${CLDR_BASE_URL}/cldr-annotations-full/annotations/${lang}/annotations.json`;
    const derUrl = `${CLDR_BASE_URL}/cldr-annotations-derived-full/annotationsDerived/${lang}/annotations.json`;

    const [annText, derText] = await Promise.all([
      fetchTextAsync(annUrl),
      fetchTextAsync(derUrl),
    ]);

    if (!annText && !derText) {
      throw new Error(`No CLDR data found for language '${lang}'`);
    }

    const annMap = parseCldrAnnotations(annText);
    const derMap = parseCldrAnnotations(derText);
    const combined = { ...derMap, ...annMap };

    // Save to user cache
    const cachePath = GLib.build_filenamev([this.userCacheDir, `${lang}.json`]);
    const cacheFile = Gio.File.new_for_path(cachePath);
    const parentDir = cacheFile.get_parent();
    if (parentDir && !parentDir.query_exists(null)) {
      parentDir.make_directory_with_parents(null);
    }
    const encoded = new TextEncoder().encode(JSON.stringify(combined));
    await cacheFile.replace_contents_async(
      encoded,
      null,
      false,
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null
    );

    // Apply to in-memory database
    if (sqlite) {
      sqlite.append_keywords_batch(combined);
    }

    return combined;
  }
}
