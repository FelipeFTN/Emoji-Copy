import St from "gi://St";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

export class SkinTonesBar {
  constructor(emojiCopy, hasGender) {
    this._settings = emojiCopy._settings;
    this._toneArray = [];

    this._buildToneButton(0, _("No skin tone"), "#FFEE00");
    this._buildToneButton(1, _("Light skin tone"), "#FFD8A8");
    this._buildToneButton(2, _("Medium light skin tone"), "#E5B590");
    this._buildToneButton(3, _("Medium skin tone"), "#B88750");
    this._buildToneButton(4, _("Medium dark skin tone"), "#9B6020");
    this._buildToneButton(5, _("Dark skin tone"), "#4B2000");

    this._genderArray = [];
    if (hasGender) {
      this._buildGendersButtons();
    }
    this.update();
  }

  // Build the buttons for the 3 genders: null, men, women. Actually, null is
  // here just for consistency with how the data is represented in the
  // gsettings database, where 0 means no gender variation.
  _buildGendersButtons() {
    this._genderArray[0] = null;
    this._addGenderButton(1, _("Women"), "♀");
    this._addGenderButton(2, _("Men"), "♂");
  }

  _addGenderButton(intId, accessibleName, labelChar) {
    let btn = new St.Button({
      reactive: true,
      can_focus: true,
      track_hover: true,
      toggle_mode: true,
      accessible_name: accessibleName,
      style_class: "EmojisGender",
      label: labelChar,
    });
    btn.connect("clicked", () => {
      if (this._settings.get_int("gender") != intId) {
        this._setGender(intId);
      } else {
        this._setGender(0);
      }
    });
    this._genderArray.push(btn);
  }

  _setGender(intToSet) {
    this._settings.set_int("gender", intToSet);
    this._genderArray[1].set_checked(intToSet == 1);
    this._genderArray[2].set_checked(intToSet == 2);
  }

  addBar(categoryItemActor) {
    this._genderArray.forEach(function (b) {
      if (b) { // index 0 contains null
        categoryItemActor.add_child(b);
      }
    });
    this._toneArray.forEach(function (b) {
      categoryItemActor.add_child(b);
    });
  }

  removeCircle() {
    this._toneArray.forEach(function (b) {
      b.set_checked(false);
    });
  }

  // Update buttons appearance, reflecting the current state of the settings
  update() {
    this.removeCircle();
    // this._toneArray[this._settings.get_int("skin-tone")].set_checked(true);
    this._genderArray.forEach(function (b) {
      if (b) { // index 0 contains null
        b.set_checked(false);
      }
    });
    if (this._genderArray.length != 0) {
      let intId = this._settings.get_int("gender");
      if (intId > 0) {
        this._genderArray[intId].set_checked(true);
      }
    }
  }

  // Build a button for a specific skin tone
  _buildToneButton(intId, accessibleName, color) {
    let btn = new St.Button({
      reactive: true,
      can_focus: true,
      track_hover: true,
      toggle_mode: true,
      accessible_name: accessibleName,
      style_class: "EmojisTone",
      style: "background-color: " + color + ";",
    });
    btn.connect("clicked", () => {
      if (this._settings.get_int("skin-tone") != intId) {
        this.removeCircle();
        btn.set_checked(true);
        this._settings.set_int("skin-tone", intId);
      } else {
        this.removeCircle();
        btn.set_checked(false);
        this._settings.set_int("skin-tone", 0);
      }
    });
    this._toneArray.push(btn);
  }
}
