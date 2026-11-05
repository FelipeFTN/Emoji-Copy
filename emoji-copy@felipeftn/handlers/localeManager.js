import GLib from "gi://GLib";
import Gio from "gi://Gio";

Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");
Gio._promisify(Gio.File.prototype, "replace_contents_async", "replace_contents_finish");

const CLDR_BASE_URL = "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json";

export const LANGUAGE_NAMES = {
  en: "English",
  zh: "中文 (简体)",
  "zh-Hant": "中文 (繁體)",
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
  it: "Italiano",
  tr: "Türkçe",
  pl: "Polski",
  vi: "Tiếng Việt",
  nl: "Nederlands",
  uk: "Українська",
  id: "Bahasa Indonesia",
  th: "ไทย",
};

/**
 * Normalizes system locale string to a CLDR language identifier
 */
export function normalizeLanguageCode(rawLocale) {
  if (!rawLocale) return "en";
  const cleaned = rawLocale.split(".")[0].replace("@", "_");
  const lower = cleaned.toLowerCase();

  // Traditional Chinese variants
  if (lower.startsWith("zh_tw") || lower.startsWith("zh_hk") || lower.startsWith("zh_mo") || lower.includes("hant")) {
    return "zh-Hant";
  }
  // Simplified Chinese variants
  if (lower.startsWith("zh")) {
    return "zh";
  }
  // Portuguese variants
  if (lower.startsWith("pt_pt")) {
    return "pt-PT";
  }
  if (lower.startsWith("pt")) {
    return "pt";
  }

  // General 2-letter ISO code
  const base = cleaned.split("_")[0].toLowerCase();
  return (base && base !== "c" && base !== "posix") ? base : "en";
}

/**
 * Gets the primary normalized language code of the user's desktop environment
 */
export function getSystemLanguage() {
  const langs = GLib.get_language_names();
  for (const l of langs) {
    const code = normalizeLanguageCode(l);
    if (code && code !== "en") {
      return code;
    }
  }
  return "en";
}

/**
 * Asynchronously fetch text from a URL using Soup 3.0 or Gio fallback
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
    return new TextDecoder("utf-8").decode(bytes.get_data());
  } catch (_e) {
    try {
      const file = Gio.File.new_for_uri(url);
      const [content] = await file.load_contents_async(null);
      return new TextDecoder("utf-8").decode(content);
    } catch (_err) {
      return null;
    }
  }
}

/**
 * Parses Unicode CLDR annotations JSON to a compact character -> { name, keywords } dictionary
 */
function parseCldrAnnotations(annJsonText, derJsonText) {
  const mapping = {};

  const processJson = (text) => {
    if (!text) return;
    try {
      const data = JSON.parse(text);
      const ann = data?.annotations?.annotations || {};
      for (const [char, item] of Object.entries(ann)) {
        let name = "";
        if (Array.isArray(item.tts) && item.tts.length > 0) {
          name = String(item.tts[0]).trim();
        }

        const kws = [];
        if (Array.isArray(item.default)) {
          kws.push(...item.default);
        }
        if (name && !kws.includes(name)) {
          kws.unshift(name);
        }

        if (kws.length > 0) {
          const entry = {
            name: name || kws[0],
            keywords: kws.join(" "),
          };
          mapping[char] = entry;
          const noVs = char.replace(/\ufe0f/g, "");
          if (!mapping[noVs]) {
            mapping[noVs] = entry;
          }
        }
      }
    } catch (_err) {}
  };

  processJson(derJsonText);
  processJson(annJsonText);
  return mapping;
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
        return meta.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    // If meta is absent or uninitialized, only base English is considered bundled.
    // Never fall back to assuming all languages are present.
    return ["en"];
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
    sqlite.setSearchLanguage(lang);

    if (lang === "en" || this.isLanguageBundled(lang, sqlite)) {
      return { lang, status: "bundled" };
    }

    // Check if local pack or cache exists
    const localMapping = await this.loadLocalMapping(lang);
    if (localMapping) {
      sqlite.insert_language_keywords(lang, localMapping);
      this._markLanguageBundled(lang, sqlite);
      return { lang, status: "cached" };
    }

    // Asynchronously download in background without blocking UI
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
   * Downloads CLDR annotations from Unicode GitHub, caches locally, and updates SQLite
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

    const combined = parseCldrAnnotations(annText, derText);
    if (Object.keys(combined).length === 0) {
      throw new Error(`Empty CLDR annotations received for '${lang}'`);
    }

    // Save to user local cache
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

    // Apply to SQLite database
    if (sqlite) {
      sqlite.insert_language_keywords(lang, combined);
      this._markLanguageBundled(lang, sqlite);
    }

    return combined;
  }

  _markLanguageBundled(lang, sqlite) {
    if (!sqlite) return;
    const current = this.getBundledLanguages(sqlite);
    if (!current.includes(lang.toLowerCase())) {
      current.push(lang.toLowerCase());
      sqlite.set_meta("bundled_languages", current.join(","));
    }
  }
}
