import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EmojiCopyPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Constructor
        window._settings = this.getSettings();
        this._window = window;

        const iconTheme = Gtk.IconTheme.get_for_display(window.get_display());
        const iconsDirectory = this.dir.get_child('icons').get_path();
        iconTheme.add_search_path(iconsDirectory);

        // General Page
        this._general();
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

        // Emoji copy paste on Select Switch
        const paste_on_select = new Adw.SwitchRow({
            title: _('Paste on Select'),
            subtitle: _('Automatically paste the selected emoji.'),
        });
        general_gp.add(paste_on_select);

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

        // About button - Thanks to @maniacx this could be done perfectly! 
        const about_button = new Gtk.Button({
            margin_top : 8,
            margin_bottom : 8,
            child: new Adw.ButtonContent({
                icon_name: 'dialog-information-symbolic',
                label: _('About')
            })
        });

        // About Button Styles
        about_button.set_css_classes(['accent']);
        // about_button.set_css_classes(['suggested-action']);
        // about_button.set_css_classes(['raised']);

        general_gp.set_header_suffix(about_button);

        about_button.connect('clicked', () => { this._openAboutPage(); });

        // Bind Adwaita field values to schema
        this._window._settings.bind('always-show', show_indicator, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._window._settings.bind('paste-on-select', paste_on_select, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._window._settings.bind('active-keybind', active_keybind, 'active', Gio.SettingsBindFlags.DEFAULT);
    }

    _openAboutPage() {
        const about_window = new Adw.AboutWindow({transient_for: this._window, modal: true});
        about_window.set_application_icon('emoji-people-symbolic');
        about_window.set_application_name(_('Emoji Copy'));
        about_window.set_version(`${this.metadata.version}.0`);
        about_window.set_developer_name('FelipeFTN & Community');
        about_window.set_issue_url('https://github.com/FelipeFTN/Emoji-Copy/issues');
        about_window.set_website('https://github.com/FelipeFTN/Emoji-Copy');
        about_window.set_license_type(Gtk.License.GPL_3_0);
        about_window.set_copyright('© 2023 FelipeFTN');
        about_window.show();
    }
}
