import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EmojiCopyPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const general_pg = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'emoji-symbols-symbolic',
        });
        window.add(general_pg);

        const general_gp = new Adw.PreferencesGroup({
            title: _('General Settings'),
            description: _('Configure your Emoji Copy'),
        });
        general_pg.add(general_gp);

        const show_indicator = new Adw.SwitchRow({
            title: _('Show Indicator'),
            subtitle: _('Whether to show the emoji indicator.'),
        });
        general_gp.add(show_indicator);

        const active_keybind = new Adw.SwitchRow({
            title: _('Use Keybind'),
            subtitle: _('Enable your default keybind to open the emoji menu.'),
        });
        general_gp.add(active_keybind);

        const keybind = window._settings.get_strv('emoji-keybind')[0];
        // console.log(`\n KEYBIND: ${keybind}; TYPE: ${typeof(keybind[0])}; STRINGIFY: ${JSON.stringify(keybind)}\n`);
        const emoji_keybind = new Adw.EntryRow({
            title: _('Emoji Copy Keybind'),
            show_apply_button:  true,
            text: _(keybind),
        });
        general_gp.add(emoji_keybind);

        const about_pg = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(about_pg);

        const about_gp = new Adw.PreferencesGroup({
            title: _('About'),
            description: _('Emoji Copy'),
        });
        about_pg.add(about_gp);

        window._settings.bind('always-show', show_indicator, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('active-keybind', active_keybind, 'active', Gio.SettingsBindFlags.DEFAULT);
        // Working in Progress
        // emoji_keybind.set_text(emoji_keybind.text);
        // window._settings.set_strv('emoji-keybind', [emoji_keybind.text]);
        // window._settings.bind('emoji-keybind', emoji_keybind, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
}
