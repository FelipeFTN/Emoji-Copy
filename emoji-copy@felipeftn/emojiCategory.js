import St from "gi://St";
import Clutter from "gi://Clutter";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { SkinTonesBar } from "./emojiOptionsBar.js";
import { EmojiButton } from "./emojiButton.js";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

// Map of emoji's group
const EMOJIS_CATEGORIES = {
  0: "Smileys & Emotion",
  1: "People & Body",
  2: "Animals & Nature",
  3: "Food & Drink",
  4: "Travel & Places",
  5: "Activities",
  6: "Objects",
  7: "Symbols",
  8: "Flags",
};

export class EmojiCategory {
  /**
   * The category and its button have to be built without being loaded, to "avoid"
   * memory issues with emojis' image textures.
   * PS: For some reason, when we render everything, there is a bunch of Lag...
   * I will be using jsdocs on the functions in the future for better documentation & readable code.
   */
  /**
   * EmojiCategory constructor sets up the emoji category UI, loads emojis, and connects skin tone change events.
   * @param {*} emojiCopy - Main extension object
   * @param {string} categoryName - Name of the emoji category
   * @param {string} iconName - Icon for the category
   * @param {number} id - Category ID
   */
  constructor(emojiCopy, categoryName, iconName, id) {
    this.super_item = new PopupMenu.PopupSubMenuMenuItem(categoryName);
    this.categoryName = categoryName;
    this.emojiCopy = emojiCopy;
    this._settings = this.emojiCopy._settings;
    this.emojiButtons = []; // used for searching, and for updating the size/style
    this._nbColumns = 10; // some random default value
    this.id = id;
    // Load only yellow (no skin tone) emojis for this category
    this.emojis = this.emojiCopy.sqlite.select_by_group(
      EMOJIS_CATEGORIES[this.id]
    ).filter(e => !e.skin_tone || e.skin_tone === '');

    // Set up the options bar (skin tone/gender selectors)
    if ((this.id == 1) || (this.id == 5)) {
      this.skinTonesBar = new SkinTonesBar(this.emojiCopy, true);
    } else {
      this.skinTonesBar = new SkinTonesBar(this.emojiCopy, false);
    }
    if ((this.id == 0) || (this.id == 1) || (this.id == 5)) {
      this.skinTonesBar.addBar(this.super_item);
    }

    // Set up the category button
    this.categoryButton = new St.Button({
      reactive: true,
      can_focus: true,
      track_hover: true,
      toggle_mode: true,
      accessible_name: categoryName,
      style_class: "EmojisCategory",
      child: new St.Icon({
        icon_name: iconName,
        icon_size: 16,
      }),
      x_expand: true,
      x_align: Clutter.ActorAlign.CENTER,
    });
    this.categoryButton.connect("clicked", this._toggle.bind(this));

    // Set initial visibility and style for the category menu item
    this.super_item.visible = false;
    this.super_item.reactive = false;
    this.super_item._triangleBin.visible = false;

    // Set the label width based on emoji size and columns
    const emoji_size = this._settings.get_int("emojisize");
    const nbcols = this._nbColumns;
    this.super_item.label.set_style(`width: ${emoji_size * Math.max(1, nbcols - 3) }px;`);

    this._built = false; // will be true once the user opens the category
    this._loaded = false; // will be true once loaded
    this.load();
  }

  _addErrorLine(error_message) {
    let line = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    line.add_child(
      new St.Label({
        text: error_message,
      }),
    );
    this.super_item.menu.addMenuItem(line);
  }

  setNbCols(nbColumns) {
    this._nbColumns = nbColumns;
  }

  /**
   * EmojiButtons objects are built here and loaded into an array, but not
   * packed into a container, thus not added to the Clutter stage and not
   * rendered. They will when the user will click on the button.
   */
  load() {
    if (this._loaded) return;

    for (let i = 0; i < this.emojis.length; i++) {
      let button = new EmojiButton(
        this.emojiCopy,
        this.emojis[i].unicode,
        this.emojis[i].description,
      );
      this.emojiButtons.push(button);
    }
    this._loaded = true;
  }

  clear() {
    this.super_item.menu.removeAll();
    this.emojiButtons = [];
    this.emojis = [];
  }

  /**
   * Builds the submenu, and fill it with containers full of previously built
   * EmojiButtons objects.
   */
  build() {
    if (this._built) return;
    let ln, container;
    for (let i = 0; i < this.emojiButtons.length; i++) {
      // lines of emojis
      if (i % this._nbColumns === 0) {
        ln = new PopupMenu.PopupBaseMenuItem({
          style_class: "EmojisList",
          reactive: false,
          can_focus: false,
        });
        ln.track_hover = false;
        container = new St.BoxLayout();
        ln.add_child(container);
        this.super_item.menu.addMenuItem(ln);
      }
      this.emojiButtons[i].build(this);
      container.add_child(this.emojiButtons[i].super_btn);
    }
    this._built = true;
  }

  _toggle() {
    if (this.super_item.menu && this.super_item.menu.isOpen) {
      this.emojiCopy.clearCategories();
    } else {
      this._openCategory();
    }
  }

  _openCategory() {
    this.emojiCopy.clearCategories();
    this.super_item.label.text = this.categoryName;

    if (!this._built) {
      this.build();
      this.updateStyle();
    }

    this.skinTonesBar.update();

    this.categoryButton.set_checked(true);
    this.super_item.visible = true;
    this.super_item.setSubmenuShown(true); // This is causing the Lag!
    this.emojiCopy._onSearchTextChanged();
  }

  updateStyle() {
    const emoji_size = this._settings.get_int("emojisize");
    const style = `font-size: ${emoji_size}px;\ncolor: #FFFFFF`;
    this.emojiButtons.forEach(function (b) {
      b.updateStyle(style);
    });
  }

  getButton() {
    return this.categoryButton;
  }
}
