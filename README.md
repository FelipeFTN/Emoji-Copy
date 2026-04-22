# Emoji Copy 😎

**This GNOME shell extension provides a emoji search pop-up menu. 🚀<br>Want any emoji? It's right into your top bar!<br>**
This repo is a Fork from [emoji-selector-for-gnome](https://github.com/maoschanz/emoji-selector-for-gnome) and was created for keeping the extension alive.
Please feel free to use and contribute to this project. 😃

## Features 🚀

- keyboard shortcut to open the extension's menu (<kbd>Super</kbd>+<kbd>.</kbd> by default)
- dynamic search (press <kbd>Enter</kbd> to copy the first result to the clipboard)
- lots of configurable things
- skin tone & gender modifiers
- middle-click to set to the clipboard without closing the menu (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>)
- right-click to add the emoji at the end of the current clipboard content (or <kbd>Shift</kbd>+<kbd>Enter</kbd>)

Keyboard navigation is designed to work **with <kbd>Tab</kbd>, not the arrows**.

<div align="center">
<img src="https://user-images.githubusercontent.com/80127749/265275927-8aed39fc-8844-4763-827d-dfe84b7e98b1.png" width="300"><img src="https://user-images.githubusercontent.com/80127749/265276211-4d3b438a-40e4-4b5e-aa0c-633992ff4b83.png" width="300">
</div>

## Installation 🍀

### Recommended

The easiest way to install it is directly from Gnome Extensions: [emoji-copy](https://extensions.gnome.org/extension/6242/emoji-copy/)

### How to Upgrade Emoji Copy to your Gnome Shell version?

Emoji Copy is frequently updated to the latest Gnome Shell version through Pull Requests.
Sometimes the Gnome Extensions team can take a bit of time to review and publish the new version, making the extension unavailable for some users.
**If you want to upgrade the extension by yourself to make it work in your Gnome version, you can:**

1. Upgrade the version installed in your system just by running this:

```bash
    $ sed -i 's/"\]/", "50"\]/' ~/.local/share/gnome-shell/extensions/emoji-copy\@felipeftn/metadata.json
```

This command will change the `metadata.json` file of the extension, making it compatible with Gnome Shell 50. You can change the version number to any other version you want, just make sure to use the correct version for your system.

2. You can also disable the version check by running this command:

```bash
    $ gsettings set org.gnome.shell disable-extension-version-validation true
```

This command will disable the version check for all extensions, allowing you to use any extension regardless of its compatibility with your Gnome Shell version. However, this is not recommended as it may cause issues with other extensions that are not compatible with your Gnome Shell version.

### Manual installation

**Not recommended at all:** installing the extension this way will prevent any further updates.

1. Download and extract the ZIP, then open a terminal in the project's directory.
2. Choose a way to install the extension:

```bash
    --> Make 🔥
    $ make install

    --> Hardcore 💀
    $ cp -a ./emoji-copy@felipeftn $HOME/.local/share/gnome-shell/extensions
```

You may need to restart the GNOME Shell environment (<kbd>Alt</kbd>+<kbd>F2</kbd> -> `restart` -> <kbd>Enter</kbd>).<br> _(X11 only, if you are in Wayland, sign out and sign in from the session manually)._

## Debug and Test 🏗

We have a lot of ways to debug and test our code. Currently, we already have a complete guide to debug and test our extension in a local environment described in [debug.md](./debug.md) file.<br>

Debug documentation can be found in two places:

- [Debug documentation](./debug.md) file
- [GJS extensions guide](https://gjs.guide/extensions/development/debugging.html)

## Memory performance 👾

Currently, we are loading emojis with SQLite. With a SQL query system, we were
able to load just the necessary amount of emojis for each category. All the emojis are "pre-compiled" during the building process, and generates a `emojis.db` file at data directory _(inside extension's directory)_.<br>
We still can do a lot of improvements in the way we load and display these emojis. Maybe some skeletons and non-syncronous loading should be great to avoid slow loadings; but works pretty well for now. ⚡️

## Fonts 🔠

It will be less ugly if you have the « Noto Emoji » font, the
« [Twitter Color Emoji](https://github.com/eosrei/twemoji-color-font/releases) »
font, or the « JoyPixels Color » font installed on your system.

## Contributors & translations 🫂

Various contributions to the code itself:

- [maoschanz](https://github.com/maoschanz) _emoji-selector-for-gnome creator_
- [Ryan Gonzalez](https://github.com/kirbyfan64)
- [amivaleo](https://github.com/amivaleo)
- [xurizaemon](https://github.com/xurizaemon)
- [khaled-0](https://github.com/khaled-0)
- [VortexAcherontic](https://github.com/VortexAcherontic)
- [NatVIII](https://github.com/NatVIII)
- [pavinjosdev](https://github.com/pavinjosdev)

The extension is currently available in the following languages:

- 🇪🇸 Castillan (Thanks to @mario-mra)
- 🇨🇳 Simplified chinese (Thanks to [@larryw3i](https://github.com/larryw3i/))
- 🇳🇱 Dutch (Thanks to [@vistaus](https://github.com/vistaus/))
- 🇺🇳 Esperanto (Thanks to [@nicolasmaia](https://github.com/nicolasmaia/))
- 🇩🇪 German (Thanks to [@jonnius](https://github.com/jonnius/))
- 🇫🇷 French (Thanks to [@maoschanz](https://github.com/maoschanz) & [@p-sage](github.com/p-sage))
- 🇮🇹 Italian (Thanks to [@amivaleo](https://github.com/amivaleo/))
- 🇵🇱 Polish (Thanks to [@alex4401](https://github.com/alex4401/))
- 🇧🇷 Brazilian/🇵🇹 Portuguese (Thanks to [@nicolasmaia](https://github.com/nicolasmaia/), [@picsi](https://github.com/picsi) & [@frnogueira](https://github.com/frnogueira/))
- 🇹🇷 Turkish (Thanks to [@mimoguz](https://github.com/mimoguz))
- 🇷🇺 Russian (Thanks to [@jasursadikov](https://github.com/jasursadikov))
- 🇧🇬 Bulgarian (Thanks to [@iatanas0v](https://github.com/iatanas0v))

If you need another language, please contribute! ❤️
