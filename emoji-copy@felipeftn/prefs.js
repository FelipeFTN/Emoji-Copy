import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import { ExtensionUtils, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extension.js';

export default class EmojiCopyPreferences extends GObject.Object {
    _init(settings) {
        super._init();

        this._settings = settings;

        let builder = new Gtk.Builder();
        builder.add_from_file(ExtensionUtils.path + '/prefs.ui');
        this.prefs_stack = builder.get_object('prefs_stack');

        this._loadPrefsPage(builder);
        this._loadAboutPage(builder);
    }

    _loadPrefsPage(builder) {
        let RELOAD_TEXT = _("Modifications will be effective after reloading the extension.");

        let positionCombobox = builder.get_object('position_combobox');
        positionCombobox.append('top', _("From top to bottom"));
        positionCombobox.append('bottom', _("From bottom to top"));
        positionCombobox.active_id = this._settings.get_string('position');

        positionCombobox.connect("changed", (widget) => {
            this._settings.set_string('position', widget.get_active_id());
        });

        this._settings.connect('changed::position', () => {
            positionCombobox.set_active_id(this._settings.get_string('position'));
        });

        let emojiSize = builder.get_object('size_spinbtn');
        emojiSize.set_value(this._settings.get_int('emojisize'));

        emojiSize.connect('value-changed', w => {
            var value = w.get_value_as_int();
            this._settings.set_int('emojisize', value);
        });

        this._settings.connect('changed::emojisize', () => {
            emojiSize.set_value(this._settings.get_int('emojisize'));
        });

        let pasteonselectSwitch = builder.get_object('pasteonselect_switch');
        pasteonselectSwitch.set_state(this._settings.get_boolean('paste-on-select'));

        pasteonselectSwitch.connect('notify::active', widget => {
            if (widget.active) {
                this._settings.set_boolean('paste-on-select', true);
            } else {
                this._settings.set_boolean('paste-on-select', false);
            }
        });

        this._settings.connect('changed::paste-on-select', () => {
            pasteonselectSwitch.set_state(this._settings.get_boolean('paste-on-select'));
        });

        let nbColsSpinBtn = builder.get_object('nbcols_spinbtn');
        nbColsSpinBtn.set_value(this._settings.get_int('nbcols'));
        nbColsSpinBtn.connect('value-changed', w => {
            var value = w.get_value_as_int();
            this._settings.set_int('nbcols', value);
        });

        this._settings.connect('changed::nbcols', () => {
            nbColsSpinBtn.set_value(this._settings.get_int('nbcols'));
        });

        let default_kbs_label = _("The default value is %s");
        default_kbs_label = default_kbs_label.replace('%s', "<Super>e");
        builder.get_object('default-kbs-help-1').set_label(default_kbs_label);
        builder.get_object('default-kbs-help-2').set_label(RELOAD_TEXT);

        let keybindingEntry = builder.get_object('keybinding_entry');
        keybindingEntry.set_sensitive(this._settings.get_boolean('use-keybinding'));

        if (this._settings.get_strv('emoji-keybinding') != '') {
            keybindingEntry.text = this._settings.get_strv('emoji-keybinding')[0];
        }

        this._settings.connect('changed::emoji-keybinding', () => {
            keybindingEntry.set_text(this._settings.get_strv('emoji-keybinding')[0]);
        });

        let keybindingButton = builder.get_object('keybinding_button');
        keybindingButton.set_sensitive(this._settings.get_boolean('use-keybinding'));

        keybindingButton.connect('clicked', () => {
            this._settings.set_strv('emoji-keybinding', [keybindingEntry.text]);
        });

        let keybindingSwitch = builder.get_object('keybinding_switch');
        keybindingSwitch.set_state(this._settings.get_boolean('use-keybinding'));

        keybindingSwitch.connect('notify::active', widget => {
            if (widget.active) {
                this._settings.set_boolean('use-keybinding', true);
                keybindingEntry.sensitive = true;
                keybindingButton.sensitive = true;
                alwaysShowSwitch.sensitive = true;
            } else {
                this._settings.set_boolean('use-keybinding', false);
                keybindingEntry.sensitive = false;
                keybindingButton.sensitive = false;
                this._settings.set_boolean('always-show', true);
                alwaysShowSwitch.set_state(true);
                alwaysShowSwitch.sensitive = false;
            }
        });

        this._settings.connect('changed::use-keybinding', () => {
            keybindingSwitch.set_state(this._settings.get_boolean('use-keybinding'));
        });

        let alwaysShowSwitch = builder.get_object('always_show_switch');
        alwaysShowSwitch.set_state(this._settings.get_boolean('always-show'));

        alwaysShowSwitch.connect('notify::active', widget => {
            if (widget.active) {
                this._settings.set_boolean('always-show', true);
            } else {
                this._settings.set_boolean('always-show', false);
            }
        });

        this._settings.connect('changed::always-show', () => {
            alwaysShowSwitch.set_state(this._settings.get_boolean('always-show'));
        });
    }

    _loadAboutPage(builder) {
        let version = _("version %s").replace('%s', ExtensionUtils.metadata.version.toString());
        builder.get_object('version-label').set_label(version);

        let translators_credits = builder.get_object('translators-credits').get_label();
        if (translators_credits == 'translator-credits') {
            builder.get_object('translators-label').set_label('');
            builder.get_object('translators-credits').set_label('');
        }

        builder.get_object('link-btn').set_uri(ExtensionUtils.metadata.url.toString());
    }
}

