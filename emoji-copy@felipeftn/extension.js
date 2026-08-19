/*
    Copyright 2017-2022 Romain F. T.
    Copyright 2023 FelipeFTN

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import St from "gi://St";
import Meta from "gi://Meta";
import GLib from "gi://GLib";
import Shell from "gi://Shell";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import { EmojiButton } from "./emojiButton.js";
import { EmojiCategory } from "./emojiCategory.js";
import { EmojiSearchItem } from "./emojiSearchItem.js";
import { SQLite } from "./handlers/sql.js";

export default class EmojiCopy extends Extension {
  async enable() {
    this.timeoutSourceId = null;
    this._settings = this.getSettings();
    this.position = this._settings.get_string("position");
    this._permanentItems = 0;

    this.sqlite = new SQLite();
    await this.sqlite.initializeDB(this.path);

    this.super_btn = new PanelMenu.Button(0.0, _("Emoji Copy"), false);
    let box = new St.BoxLayout();
    let icon = new St.Icon({
      icon_name: "face-cool-symbolic",
      style_class: "system-status-icon emotes-icon",
    });
    box.add_child(icon);

    this.super_btn.add_child(box);
    this.super_btn.visible = this._settings.get_boolean("always-show");

    // Remove any stale indicator from a previous enable/disable cycle
    // (e.g. after screen lock/unlock) to avoid "Extension point conflict"
    const existingIndicator = Main.panel.statusArea[this.uuid];
    if (existingIndicator) {
      existingIndicator.destroy();
    }

    Main.panel.addToStatusArea(
      this.uuid,
      this.super_btn,
      0,
      "right",
    );

    this._cursorAnchor = new St.Widget({
      width: 1,
      height: 1,
      opacity: 0,
      reactive: false,
    });
    Main.uiGroup.add_child(this._cursorAnchor);

    this.super_btn.menu.connectObject(
      "open-state-changed",
      this._onOpenStateChanged.bind(this),
      this,
    );

    let nbCols = this._settings.get_int("nbcols");

    this._createAllCategories(nbCols);

    this._renderPanelMenuHeaderBox();

    this.searchItem = new EmojiSearchItem(this, nbCols);

    // The constructor already built the recents row; building a second one
    // here would orphan the first.
    let recentlyUsed = this.searchItem.recentlyUsedItem;

    if (this.position === "top") {
      this.super_btn.menu.addMenuItem(this._buttonMenuItem);
      this._permanentItems++;
      this.super_btn.menu.addMenuItem(this.searchItem.super_item);
      this._permanentItems++;
      this.super_btn.menu.addMenuItem(recentlyUsed);
      this._permanentItems++;
    }

    this._addAllCategories();

    if (this.position === "bottom") {
      this.super_btn.menu.addMenuItem(recentlyUsed);
      this._permanentItems++;
      this.super_btn.menu.addMenuItem(this.searchItem.super_item);
      this._permanentItems++;
      this.super_btn.menu.addMenuItem(this._buttonMenuItem);
      this._permanentItems++;
    }

    if (this._settings.get_boolean("active-keybind")) {
      this._bindShortcut();
    }

    this._settings.connectObject(
      "changed::emojisize", () => {
        this.updateStyle();
      },
      "changed::always-show", () => {
        this.super_btn.visible = this._settings.get_boolean("always-show");
      },
      "changed::active-keybind", (settings) => {
        Main.wm.removeKeybinding("emoji-keybind");
        if (settings.get_boolean("active-keybind")) {
          this._bindShortcut();
        }
      },
      "changed::nbcols", () => {
        this.updateNbCols();
      },
      this,
    );
  }

  disable() {
    this.searchItem.saveRecents();

    if (this._settings.get_boolean("active-keybind")) {
      Main.wm.removeKeybinding("emoji-keybind");
    }

    if (this._cursorAnchor) {
      Main.uiGroup.remove_child(this._cursorAnchor);
      this._cursorAnchor.destroy();
      this._cursorAnchor = null;
    }

    this._settings.disconnectObject(this);
    this.super_btn.menu.disconnectObject(this);

    if (this.timeoutSourceId) {
      GLib.Source.remove(this.timeoutSourceId);
      this.timeoutSourceId = null;
    }

    this.sqlite.destroy();
    this.searchItem.destroy();
    // Disconnects the categories' settings handlers; leaving them connected
    // would fire _onFilterChanged on destroyed items after re-enable.
    this.emojiCategories.forEach((c) => c.destroy());
    EmojiButton.destroyTooltip();
    this._buttonMenuItem.destroy();
    // Destroys the menu and all its remaining children (the categories'
    // items); below we only drop our references.
    this.super_btn.destroy();
    this.searchItem = null;
    this._settings = null;
    this.super_btn = null;
    this.sqlite = null;
    this._buttonMenuItem = null;
    this.emojiCategories = null;
  }

  toggleMenu() {
    const windowLocation = this._settings.get_string("window-location");

    if (this.super_btn.menu.isOpen) {
      this.super_btn.menu.close();
      return;
    }

    if (!this._cursorAnchor) {
      this._cursorAnchor = new St.Widget({
        width: 1,
        height: 1,
        opacity: 0,
        reactive: false,
      });
      Main.uiGroup.add_child(this._cursorAnchor);
    }

    if (windowLocation === "cursor") {
      let x, y;
      [x, y] = global.get_pointer();

      const margin = 10;
      const clampedX = Math.max(margin, Math.min(x, global.stage.width - margin));
      const clampedY = Math.max(margin, Math.min(y, global.stage.height - margin));

      this._cursorAnchor.set_position(clampedX, clampedY);
      this.super_btn.menu.sourceActor = this._cursorAnchor;
    } else {
      this.super_btn.menu.sourceActor = this.super_btn;
    }

    this.super_btn.menu.open(true);
  }

  updateStyle() {
    this.searchItem.updateStyleRecents();
    this.emojiCategories.forEach(function (c) {
      c.updateStyle();
    });
  }

  updateNbCols() {
    let nbCols = this._settings.get_int("nbcols");
    this.emojiCategories.forEach(function (c) {
      c.setNbCols(nbCols);
    });

    // Update in place: recreating the EmojiSearchItem would remove the
    // search entry and recents row from the menu without re-adding them.
    this.searchItem.setNbCols(nbCols);
  }

  _onOpenStateChanged(_, open) {
    if (open) {
      // The clipboard still holds whatever was copied before opening the
      // menu; the first "append" selection must not append to it.
      this.clipboardOwned = false;
    }
    this.super_btn.visible = open || this._settings.get_boolean("always-show");
    this.clearCategories();
    this.searchItem.searchEntry.set_text("");

    this.timeoutSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
      if (open) {
        global.stage.set_key_focus(this.searchItem.searchEntry);
      }
      this.timeoutSourceId = null;
      return GLib.SOURCE_REMOVE;
    });
  }

  clearCategories() {
    for (let i = 0; i < 9; i++) {
      this.emojiCategories[i].getButton().set_checked(false);
    }

    let items = this.super_btn.menu._getMenuItems();

    if (this.position == "top") {
      for (let i = this._permanentItems; i < items.length; i++) {
        items[i].setSubmenuShown(false);
        items[i].visible = false;
      }
    } else {
      for (let i = 0; i < (items.length - this._permanentItems); i++) {
        items[i].setSubmenuShown(false);
        items[i].visible = false;
      }
    }

    this._onSearchTextChanged();
  }

  _onSearchTextChanged() {
    this.searchItem._onSearchTextChanged();
  }

  _createAllCategories(nbCols) {
    this.emojiCategories = [];

    const CAT_LABELS = [
      _("Smileys & Body"),
      _("Peoples & Clothing"),
      _("Animals & Nature"),
      _("Food & Drink"),
      _("Travel & Places"),
      _("Activities & Sports"),
      _("Objects"),
      _("Symbols"),
      _("Flags"),
    ];

    const CAT_ICONS = [
      "face-smile-symbolic",
      "emoji-people-symbolic",
      "emoji-nature-symbolic",
      "emoji-food-symbolic",
      "emoji-travel-symbolic",
      "emoji-activities-symbolic",
      "emoji-objects-symbolic",
      "emoji-symbols-symbolic",
      "emoji-flags-symbolic",
    ];

    for (let i = 0; i < 9; i++) {
      this.emojiCategories[i] = new EmojiCategory(
        this,
        CAT_LABELS[i],
        CAT_ICONS[i],
        i,
      );
      this.emojiCategories[i].setNbCols(nbCols);
    }
  }

  _addAllCategories() {
    for (let i = 0; i < 9; i++) {
      this.super_btn.menu.addMenuItem(this.emojiCategories[i].super_item);
    }
  }

  _renderPanelMenuHeaderBox() {
    this._buttonMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    for (let i = 0; i < this.emojiCategories.length; i++) {
      this._buttonMenuItem.add_child(this.emojiCategories[i].getButton());
    }
  }

  _bindShortcut() {
    Main.wm.addKeybinding(
      "emoji-keybind",
      this._settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      this.toggleMenu.bind(this),
    );
  }

  get_super_btn() {
    return this.super_btn;
  }
}
