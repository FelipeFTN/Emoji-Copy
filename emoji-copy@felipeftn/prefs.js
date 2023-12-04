import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EmojiCopyPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Constructor
        window._settings = this.getSettings();
        this._window = window;

        // General Page
        this._general();

        // About Page
        this._about();
    }

    _general() {
        // General page
        const general_pg = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'emoji-symbols-symbolic',
        });
        this._window.add(general_pg);

        // Group general settings
        const general_gp = new Adw.PreferencesGroup({
            title: _('General Settings'),
            description: _('Configure your Emoji Copy'),
        });
        general_pg.add(general_gp);

        // Emoji copy indicator on Gnome panel
        const show_indicator = new Adw.SwitchRow({
            title: _('Show Indicator'),
            subtitle: _('Whether to show the emoji indicator.'),
        });
        general_gp.add(show_indicator);

        // Keybind active (true or false)
        const active_keybind = new Adw.SwitchRow({
            title: _('Use Keybind'),
            subtitle: _('Enable your default keybind to open the emoji menu.'),
        });
        general_gp.add(active_keybind);

        // Keybind field value (<Super>period)
        let keybind = this._window._settings.get_strv('emoji-keybind')[0];
        const emoji_keybind = new Adw.EntryRow({
            title: _('Emoji Copy Keybind'),
            show_apply_button:  true,
            text: _(keybind),
        });
        general_gp.add(emoji_keybind);

        // Event listeners
        emoji_keybind.connect('changed', () => {
            keybind = emoji_keybind.get_text();
		});
        emoji_keybind.connect('apply', () => {
			this._window._settings.set_strv('emoji-keybind', [keybind]);
		});

        // Bind Adwaita field values to schema
        this._window._settings.bind('always-show', show_indicator, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._window._settings.bind('active-keybind', active_keybind, 'active', Gio.SettingsBindFlags.DEFAULT);
    }

    _about() {
        // About page
        const about_pg = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'dialog-information-symbolic',
        });
        this._window.add(about_pg);

        // Group about page
        const about_gp = new Adw.PreferencesGroup({
            title: _('About'),
            description: _('Emoji Copy'),
        });
        about_pg.add(about_gp);

        const about_window = new Adw.AboutWindow({
            application_name: _('Emoji Copy'),
            developer_name: _('FelipeFTN & Community'),
            version: _('14'),
        });
        about_gp.add(about_window);
    }
}
