// prefs.js (https://github.com/felipeftn/emoji-copy)

const {GLib, GObject, Gio, Gtk, GdkPixbuf} = imports.gi;

const Gettext = imports.gettext.domain('emoji-copy');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//------------------------------------------------------------------------------

function init() {
	ExtensionUtils.initTranslations();
}

//------------------------------------------------------------------------------

const EmojiCopySettingsWidget = new GObject.Class({
	Name: 'EmojiCopy.Prefs.Widget',
	GTypeName: 'EmojiCopyPrefsWidget',

	_init (settings) {
        this.settings = settings;

		let builder = new Gtk.Builder();
		builder.add_from_file(Me.path+'/prefs.ui');
		this.prefs_stack = builder.get_object('prefs_stack');

		this._loadPrefsPage(builder);
		this._loadAboutPage(builder);
	},

	//--------------------------------------------------------------------------

	_loadPrefsPage(builder) {
		let RELOAD_TEXT = _("Modifications will be effective after reloading the extension.");

		let positionCombobox = builder.get_object('position_combobox');
		positionCombobox.append('top', _("From top to bottom"));
		positionCombobox.append('bottom', _("From bottom to top"));
		positionCombobox.active_id = this.settings.get_string('position');

		positionCombobox.connect("changed", (widget) => {
			this.settings.set_string('position', widget.get_active_id());
		});

		this.settings.connect('changed::position', () => {
			positionCombobox.set_active_id(this.settings.get_string('position'));
		});

		//----------------------------------------------------------------------

		let emojiSize = builder.get_object('size_spinbtn');
		emojiSize.set_value(this.settings.get_int('emojisize'));

		emojiSize.connect('value-changed', w => {
			var value = w.get_value_as_int();
			this.settings.set_int('emojisize', value);
		});

		this.settings.connect('changed::emojisize', () => {
			emojiSize.set_value(this.settings.get_int('emojisize'));
		});

		//----------------------------------------------------------------------

		let nbColsSpinBtn = builder.get_object('nbcols_spinbtn');
		nbColsSpinBtn.set_value(this.settings.get_int('nbcols'));
		nbColsSpinBtn.connect('value-changed', w => {
			var value = w.get_value_as_int();
			this.settings.set_int('nbcols', value);
		});

		this.settings.connect('changed::nbcols', () => {
			nbColsSpinBtn.set_value(this.settings.get_int('nbcols'));
		});

		//----------------------------------------------------------------------

		let default_kbs_label = _("The default value is %s");
		default_kbs_label = default_kbs_label.replace('%s', "<Super>e");
		builder.get_object('default-kbs-help-1').set_label(default_kbs_label);
		builder.get_object('default-kbs-help-2').set_label(RELOAD_TEXT);

		let keybindingEntry = builder.get_object('keybinding_entry');
		keybindingEntry.set_sensitive(this.settings.get_boolean('use-keybinding'));

		if (this.settings.get_strv('emoji-keybinding') != '') {
			keybindingEntry.text = this.settings.get_strv('emoji-keybinding')[0];
		}

		this.settings.connect('changed::emoji-keybinding', () => {
			keybindingEntry.set_text(this.settings.get_strv('emoji-keybinding')[0]);
		});

		let keybindingButton = builder.get_object('keybinding_button');
		keybindingButton.set_sensitive(this.settings.get_boolean('use-keybinding'));

		keybindingButton.connect('clicked', widget => {
			this.settings.set_strv('emoji-keybinding', [keybindingEntry.text]);
		});

		//----------------------------------------------------------------------

		let keybindingSwitch = builder.get_object('keybinding_switch');
		keybindingSwitch.set_state(this.settings.get_boolean('use-keybinding'));

		keybindingSwitch.connect('notify::active', widget => {
			if (widget.active) {
				this.settings.set_boolean('use-keybinding', true);
				keybindingEntry.sensitive = true;
				keybindingButton.sensitive = true;
				alwaysShowSwitch.sensitive = true;
			} else {
				this.settings.set_boolean('use-keybinding', false);
				keybindingEntry.sensitive = false;
				keybindingButton.sensitive = false;
				this.settings.set_boolean('always-show', true);
				alwaysShowSwitch.set_state(true);
				alwaysShowSwitch.sensitive = false;
			}
		});

		this.settings.connect('changed::use-keybinding', () => {
			keybindingSwitch.set_state(this.settings.get_boolean('use-keybinding'));
		});

		//----------------------------------------------------------------------

		let alwaysShowSwitch = builder.get_object('always_show_switch');
		alwaysShowSwitch.set_state(this.settings.get_boolean('always-show'));

		alwaysShowSwitch.connect('notify::active', widget => {
			if (widget.active) {
				this.settings.set_boolean('always-show', true);
			} else {
				this.settings.set_boolean('always-show', false);
			}
		});

		this.settings.connect('changed::always-show', () => {
			alwaysShowSwitch.set_state(this.settings.get_boolean('always-show'));
		});
	},

	//--------------------------------------------------------------------------

	_loadAboutPage(builder) {
		let version = _("version %s").replace('%s', Me.metadata.version.toString());
		builder.get_object('version-label').set_label(version);

		let translators_credits = builder.get_object('translators-credits').get_label();
		if (translators_credits == 'translator-credits') {
			builder.get_object('translators-label').set_label('');
			builder.get_object('translators-credits').set_label('');
		}

		builder.get_object('link-btn').set_uri(Me.metadata.url.toString());
	}

});

//------------------------------------------------------------------------------

function buildPrefsWidget() {
	let widget = new EmojiCopySettingsWidget(ExtensionUtils.getSettings());
	let obj = widget.prefs_stack;

	obj.connect('realize', () => {
        let window = obj.get_root(); // Only avaliable on GNOME 40+
		if (this._shellVersion < 43) {
			this._registerSignals(window);
		}
	});

	if (widget.prefs_stack.show_all)
		widget.prefs_stack.show_all();

	return widget.prefs_stack;
}

//------------------------------------------------------------------------------

