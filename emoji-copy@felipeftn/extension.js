/*
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

import St from 'gi://St';
import Gtk from 'gi://Gtk';
import Meta from 'gi://Meta';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { ExtensionUtils, gettext as _ } from 'resource:///org/gnome/shell/extensions.js';

import { EmojiCategory } from './emojiCategory.js';
import { EmojiSearchItem } from './emojiSearchItem.js';

let SETTINGS = null;
let GLOBAL_BUTTON = null;
let SIGNAUX = [];
let POSITION;

let timeoutSourceId = null;

class EmojisMenu {
    constructor() {
        this.super_btn = new PanelMenu.Button(0.0, _("Emoji Copy"), false);
        let box = new St.BoxLayout();
        let icon = new St.Icon({
            icon_name: 'face-cool-symbolic',
            style_class: 'system-status-icon emotes-icon'
        });
        box.add_child(icon);
        this._permanentItems = 0;
        this._activeCat = -1;
        let nbCols = SETTINGS.get_int('nbcols');

        this.super_btn.add_child(box);
        this.super_btn.visible = SETTINGS.get_boolean('always-show');

        this._createAllCategories(nbCols);

        this._renderPanelMenuHeaderBox();

        this.searchItem = new EmojiSearchItem(nbCols);

        let recentlyUsed = this.searchItem._recentlyUsedInit();

        if (POSITION === 'top') {
            this.super_btn.menu.addMenuItem(this._buttonMenuItem);
            this._permanentItems++;
            this.super_btn.menu.addMenuItem(this.searchItem.super_item);
            this._permanentItems++;
            this.super_btn.menu.addMenuItem(recentlyUsed);
            this._permanentItems++;
        }

        this._addAllCategories();

        if (POSITION === 'bottom') {
            this.super_btn.menu.addMenuItem(recentlyUsed);
            this._permanentItems++;
            this.super_btn.menu.addMenuItem(this.searchItem.super_item);
            this._permanentItems++;
            this.super_btn.menu.addMenuItem(this._buttonMenuItem);
            this._permanentItems++;
        }

        this.super_btn.menu.connect(
            'open-state-changed',
            this._onOpenStateChanged.bind(this)
        );

        if (SETTINGS.get_boolean('use-keybinding')) {
            this._bindShortcut();
        }
    }

    _connectSignals() {
    }

    disconnectSignals() {
    }

    updateStyle() {
        this.searchItem.updateStyleRecents();
        this.emojiCategories.forEach(function(c) {
            c.updateStyle();
        });
    }

    updateNbCols() {
        let nbCols = SETTINGS.get_int('nbcols');
        this.emojiCategories.forEach(function(c) {
            c.setNbCols(nbCols);
        });

        this.searchItem = new EmojiSearchItem(nbCols);
    }

    toggle() {
        this.super_btn.menu.toggle();
    }

    _onOpenStateChanged(_, open) {
        this.super_btn.visible = open || SETTINGS.get_boolean('always-show');
        this.clearCategories();
        this.searchItem.searchEntry.set_text('');

        timeoutSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
            if (open) {
                global.stage.set_key_focus(this.searchItem.searchEntry);
            }
            timeoutSourceId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    clearCategories() {
        for (let i = 0; i < 9; i++) {
            this.emojiCategories[i].getButton().set_checked(false);
        }

        let items = this.super_btn.menu._getMenuItems();

        if (POSITION == 'top') {
            for (let i = this._permanentItems; i < items.length; i++) {
                items[i].setSubmenuShown(false);
                items[i].actor.visible = false;
            }
        } else {
            for (let i = 0; i < (items.length - this._permanentItems); i++) {
                items[i].setSubmenuShown(false);
                items[i].actor.visible = false;
            }
        }

        this._activeCat = -1;
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
            _("Flags")
        ];

        const CAT_ICONS = [
            'face-smile-symbolic',
            'emoji-people-symbolic',
            'emoji-nature-symbolic',
            'emoji-food-symbolic',
            'emoji-travel-symbolic',
            'emoji-activities-symbolic',
            'emoji-objects-symbolic',
            'emoji-symbols-symbolic',
            'emoji-flags-symbolic'
        ];

        for (let i = 0; i < 9; i++) {
            this.emojiCategories[i] = new EmojiCategory(CAT_LABELS[i], CAT_ICONS[i], i);
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
            can_focus: false
        });
        this.categoryButton = [];
        for (let i = 0; i < this.emojiCategories.length; i++) {
            this._buttonMenuItem.actor.add_child(this.emojiCategories[i].getButton());
        }
    }

    _bindShortcut() {
        Main.wm.addKeybinding(
            'emoji-keybinding',
            SETTINGS,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            this.toggle.bind(this)
        );
    }
}

function init() {
    ExtensionUtils.initTranslations('emoji-copy');
    try {
        let theme = Gtk.IconTheme.get_default();
        theme.append_search_path(ExtensionUtils.path + '/icons');
    } catch (e) {
        // Appending bullshit to the icon theme path is deprecated, but 18.04
        // users don't have the icons so I do it anyway.
    }
}

function enable() {
    SETTINGS = ExtensionUtils.getSettings(); // Is this GOING to work?
    POSITION = SETTINGS.get_string('position');

    GLOBAL_BUTTON = new EmojisMenu();

    Main.panel.addToStatusArea('EmojisMenu', GLOBAL_BUTTON.super_btn, 0, 'right');

    SIGNAUX[0] = SETTINGS.connect('changed::emojisize', () => {
        GLOBAL_BUTTON.updateStyle();
    });
    SIGNAUX[1] = SETTINGS.connect('changed::always-show', () => {
        GLOBAL_BUTTON.super_btn.visible = SETTINGS.get_boolean('always-show');
    });
    SIGNAUX[2] = SETTINGS.connect('changed::use-keybinding', (z) => {
        if (z.get_boolean('use-keybinding')) {
            Main.wm.removeKeybinding('emoji-keybinding');
            GLOBAL_BUTTON._bindShortcut();
        } else {
            Main.wm.removeKeybinding('emoji-keybinding');
        }
    });
    SIGNAUX[3] = SETTINGS.connect('changed::nbcols', () => {
        GLOBAL_BUTTON.updateNbCols();
    });
}

function disable() {
    GLOBAL_BUTTON.searchItem.saveRecents();

    if (SETTINGS.get_boolean('use-keybinding')) {
        Main.wm.removeKeybinding('emoji-keybinding');
    }

    SETTINGS.disconnect(SIGNAUX[0]);
    SETTINGS.disconnect(SIGNAUX[1]);
    SETTINGS.disconnect(SIGNAUX[2]);

    GLOBAL_BUTTON.super_btn.destroy();

    if (timeoutSourceId) {
        GLib.Source.remove(timeoutSourceId);
        timeoutSourceId = null;
    }

    SETTINGS = null;
    GLOBAL_BUTTON = null;
    SIGNAUX = [];
}
