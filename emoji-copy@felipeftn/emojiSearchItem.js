import St from "gi://St";
import Clutter from "gi://Clutter";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { EmojiButton } from "./emojiButton.js";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

// DEPRECATED?
export class EmojiSearchItem {
  constructor(emojiCopy, nbColumns) {
    this.super_item = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    this._nbColumns = nbColumns;
    this.emojiCopy = emojiCopy;
    this._settings = this.emojiCopy._settings;

    this.searchEntry = new St.Entry({
      name: "searchEntry",
      style_class: "search-entry",
      can_focus: true,
      hint_text: _("Type here to search…"),
      track_hover: true,
      x_expand: true,
    });

    this.searchEntry.get_clutter_text().connect(
      "text-changed",
      this._onSearchTextChanged.bind(this),
    );

    this.super_item.actor.add_child(this.searchEntry);

    // initializing the "recently used" buttons
    this.recentlyUsedItem = this._recentlyUsedInit();

    this.searchEntry.clutter_text.connect("key-press-event", (actor, event) => {
      const symbol = event.get_key_symbol();
      const relevantActor = global.stage.get_key_focus();

      if (relevantActor !== this.searchEntry.clutter_text) {
        return Clutter.EVENT_PROPAGATE;
      }

      switch (symbol) {
        // Existing Enter key logic - find first recent/result and activate
        case Clutter.KEY_Return:
        case Clutter.KEY_KP_Enter:
          let firstRecent = this._recents.find(
            (btn) => btn.super_btn.visible && btn.super_btn.can_focus
          );

          if (firstRecent) {
            firstRecent.onKeyPress(actor, event);
            return Clutter.EVENT_STOP;
          }

          return Clutter.EVENT_PROPAGATE;

        case Clutter.KEY_Down:
          let firstFocusableRecent = this._recents.find(
            (btn) =>
              btn.super_btn && btn.super_btn.visible && btn.super_btn.can_focus
          );

          if (firstFocusableRecent) {
            global.stage.set_key_focus(firstFocusableRecent.super_btn);
            return Clutter.EVENT_STOP;
          }

          return Clutter.EVENT_PROPAGATE;

        case Clutter.KEY_Up:
          if (!this.emojiCopy || !this.emojiCopy.emojiCategories) {
            return Clutter.EVENT_PROPAGATE;
          }

          let firstFocusableCategoryBtn = this.emojiCopy.emojiCategories.find(
            (cat) => {
              const btn = cat.getButton();
              return btn && btn.visible && btn.can_focus;
            }
          );

          if (firstFocusableCategoryBtn) {
            global.stage.set_key_focus(firstFocusableCategoryBtn.getButton());
            return Clutter.EVENT_STOP;
          }

          return Clutter.EVENT_PROPAGATE;

        default:
          return Clutter.EVENT_PROPAGATE;
      }
    });
  }

  // Updates the "recently used" buttons content in reaction to a new search
  // query (the text changed or the category changed).
  _onSearchTextChanged() {
    let searchedText = this.searchEntry.get_text();
    if (searchedText === "") {
      this._buildRecents();
      this._updateSensitivity();
      return;
    }
    searchedText = searchedText.toLowerCase().trim();

    for (let j = 0; j < this._nbColumns; j++) {
      this._recents[j].super_btn.label = "";
    }

    const results = this.emojiCopy.sqlite.search_description(searchedText, this._settings.get_int("skin-tone"));

    let firstEmptyIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (i < this._nbColumns) {
        this._recents[firstEmptyIndex].super_btn.label = results[i].unicode;
        this._recents[firstEmptyIndex].super_btn.text = results[i].description;
        firstEmptyIndex++;
      }
    }
    this._updateSensitivity();
  }

  _updateSensitivity() {
    for (let i = 0; i < this._recents.length; i++) {
      let can_focus = this._recents[i].super_btn.label != "";
      this._recents[i].super_btn.set_can_focus(can_focus);
      this._recents[i].super_btn.set_track_hover(can_focus);
    }
  }

  // Initializes the container showing the recently used emojis as buttons
  _recentlyUsedInit() {
    let recentlyUsed = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    let container = new St.BoxLayout();
    recentlyUsed.actor.add_child(container);
    this._recents = [];

    for (let i = 0; i < this._nbColumns; i++) {
      this._recents[i] = new EmojiButton(this.emojiCopy, "", []);
      this._recents[i].build(null);
      container.add_child(this._recents[i].super_btn);
    }

    this._buildRecents();
    this.updateStyleRecents();
    return recentlyUsed;
  }

  saveRecents() {
    let backUp = [];
    for (let i = 0; i < this._nbColumns; i++) {
      backUp.push(this._recents[i].super_btn.label);
    }
    this._settings.set_strv("recently-used", backUp);
  }

  _buildRecents() {
    let temp = this._settings.get_strv("recently-used");
    for (let i = 0; i < this._nbColumns; i++) {
      if (i < temp.length) {
        this._recents[i].super_btn.label = temp[i];
      } else {
        // If the extension was previously set with less "recently used
        // emojis", we still need to load something in the labels.
        // It will be a penguin for obvious reasons.
        this._recents[i].super_btn.label = "🐧";
      }
    }
  }

  updateStyleRecents() {
    let fontStyle = "font-size: " + this._settings.get_int("emojisize") +
      "px;";
    fontStyle += " color: #FFFFFF;";
    this._recents.forEach(function (b) {
      b.updateStyle(fontStyle);
    });
  }

  shiftFor(currentEmoji) {
    if (currentEmoji == "") return;
    let temp = this._settings.get_strv("recently-used");
    for (let i = 0; i < temp.length; i++) {
      if (temp[i] == currentEmoji) {
        temp.splice(i, 1);
      }
    }
    for (let j = temp.length; j > 0; j--) {
      temp[j] = temp[j - 1];
    }
    temp[0] = currentEmoji;
    this._settings.set_strv("recently-used", temp);
    this._buildRecents();
    this.saveRecents();
    this.emojiCopy._onSearchTextChanged();
  }
}
