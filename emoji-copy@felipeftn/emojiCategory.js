const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;

/* Import the current extension, mainly because we need to access other files */
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const SkinTonesBar = Me.imports.emojiOptionsBar.SkinTonesBar;
const Extension = Me.imports.extension;
const EmojiButton = Me.imports.emojiButton;

/**
 * This imports data (array of arrays of characters, and array of arrays
 * of strings). Keywords are used for both:
 * - search
 * - skin tone management
 * - gender management
 */
const EMOJIS_CHARACTERS = Me.imports.data.emojisCharacters.ALL;
const EMOJIS_KEYWORDS = Me.imports.data.emojisKeywords.ALL_KEYWORDS;

////////////////////////////////////////////////////////////////////////////////

var EmojiCategory = class EmojiCategory {

    /**
     * The category and its button have to be built without being loaded, to
     * memory issues with emojis' image textures.
     */
    constructor(categoryName, iconName, id) {
        this.super_item = new PopupMenu.PopupSubMenuMenuItem(categoryName);
        this.categoryName = categoryName;
        this.id = id;
        this._nbColumns = 10; // some random default value

        this.super_item.actor.visible = false;
        this.super_item.actor.reactive = false;
        this.super_item._triangleBin.visible = false;

        this.emojiButtons = []; // used for searching, and for updating the size/style

        // These options bar widgets have the same type for all categories to
        // simplify the update method
        if ((this.id == 1) || (this.id == 5)) {
            this.skinTonesBar = new SkinTonesBar(true);
        } else {
            this.skinTonesBar = new SkinTonesBar(false);
        }

        //   Smileys & body   Peoples           Activities
        if ((this.id == 0) || (this.id == 1) || (this.id == 5)) {
            this.skinTonesBar.addBar(this.super_item.actor);
        }

        this.categoryButton = new St.Button({
            reactive: true,
            can_focus: true,
            track_hover: true,
            toggle_mode: true,
            accessible_name: categoryName,
            style_class: 'EmojisCategory',
            child: new St.Icon({
                icon_name: iconName,
                icon_size: 16
            }),
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.categoryButton.connect('clicked', this._toggle.bind(this));

        this._built = false; // will be true once the user opens the category
        this._loaded = false; // will be true once loaded
        this.validateKeywordsNumber();
        this.load();
    }

    validateKeywordsNumber() {
        if (EMOJIS_CHARACTERS[this.id].length === EMOJIS_KEYWORDS[this.id].length) {
            return true;
        }
        let main_message = _("Incorrect number of keywords for category '%s':");
        this._addErrorLine(main_message.replace('%s', this.categoryName));
        this._addErrorLine(EMOJIS_CHARACTERS[this.id].length + " emojis");
        this._addErrorLine(EMOJIS_KEYWORDS[this.id].length + " keyword groups");
        this._addErrorLine(_("Please report this bug"));
        return false;
    }

    _addErrorLine(error_message) {
        log(error_message);
        let line = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        line.actor.add_child(new St.Label({
            text: error_message
        }));
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

        for (let i = 0; i < EMOJIS_CHARACTERS[this.id].length; i++) {
            let button = new EmojiButton.EmojiButton(
                EMOJIS_CHARACTERS[this.id][i], EMOJIS_KEYWORDS[this.id][i]);
            this.emojiButtons.push(button);
        }
        this._loaded = true;
    }

    clear() {
        this.super_item.menu.removeAll();
        this.emojiButtons = [];
    }

    searchEmoji(searchedText, results, recentlyUsed, neededresults, priority) {
        let searchResults = [];
        for (let i = 0; i < this.emojiButtons.length; i++) {
            if (results.includes(this.emojiButtons[i].baseCharacter)) {
                continue;
            }
            if (neededresults >= 0) {
                let isMatching = false;
                if (priority === 4) {
                    isMatching = this._searchRecentMatch(searchedText, i, recentlyUsed);
                } else if (priority === 3) {
                    isMatching = this._searchExactMatch(searchedText, i);
                } else if (priority === 2) {
                    isMatching = this._searchInName(searchedText, i);
                } else {
                    isMatching = this._searchInKeywords(searchedText, i);
                }
                if (isMatching) {
                    searchResults.push(this.emojiButtons[i].baseCharacter)
                    neededresults--;
                }
            }
        }
        return searchResults
    }

    _searchRecentMatch(searchedText, i, recentlyUsed) {
        return recentlyUsed.includes(this.emojiButtons[i].baseCharacter) && (
            this._searchExactMatch(searchedText, i) ||
            this._searchInName(searchedText, i) ||
            this._searchInKeywords(searchedText, i)
        )
    }

    _searchExactMatch(searchedText, i) {
        return this.emojiButtons[i].keywords[0] === searchedText;
    }

    _searchInName(searchedText, i) {
        return this.emojiButtons[i].keywords[0].includes(searchedText);
    }

    _searchInKeywords(searchedText, i) {
        return this.emojiButtons[i].keywords.some((e) => e.includes(searchedText));
    }

    /**
     * Builds the submenu, and fill it with containers full of previously built
     * EmojiButtons objects.
     */
    build() {
        if (this._built) { return; }
        let ln, container;
        for (let i = 0; i < this.emojiButtons.length; i++) {
            // lines of emojis
            if (i % this._nbColumns === 0) {
                ln = new PopupMenu.PopupBaseMenuItem({
                    style_class: 'EmojisList',
                    reactive: false,
                    can_focus: false,
                });
                ln.actor.track_hover = false;
                container = new St.BoxLayout();
                ln.actor.add_child(container);
                this.super_item.menu.addMenuItem(ln);
            }
            this.emojiButtons[i].build(this);
            container.add_child(this.emojiButtons[i].super_btn);
        }
        this._built = true;
    }

    //	unload() { // TODO ?
    //		this._built = false;
    //		this._loaded = false;
    //		for (let i=0; i<this.emojiButtons.length; i++) {
    //			this.emojiButtons[i].destroy();
    //		}
    //		this.super_item.menu.removeAll();
    //		this.emojiButtons = [];
    //	}

    _toggle() {
        if (this.super_item._getOpenState()) {
            Extension.GLOBAL_BUTTON.clearCategories();
        } else {
            this._openCategory();
        }
    }

    _openCategory() {
        Extension.GLOBAL_BUTTON.clearCategories();
        this.super_item.label.text = this.categoryName;

        if (!this._built) {
            this.build();
            this.updateStyle();
        }

        this.skinTonesBar.update();

        this.categoryButton.set_checked(true);
        this.super_item.actor.visible = true;
        this.super_item.setSubmenuShown(true);
        Extension.GLOBAL_BUTTON._activeCat = this.id;
        Extension.GLOBAL_BUTTON._onSearchTextChanged();
    }

    updateStyle() {
        let fontStyle = 'font-size: ' + Extension.SETTINGS.get_int('emojisize') + 'px;';
        fontStyle += ' color: #FFFFFF;';
        this.emojiButtons.forEach(function(b) {
            b.updateStyle(fontStyle);
        });
    }

    getButton() {
        return this.categoryButton;
    }
}
