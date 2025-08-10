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

- Install from GNOME Extensions: [emoji-copy](https://extensions.gnome.org/extension/6242/emoji-copy/)

- Or install your local fork (GNOME 49 compatible) with the helper script:

```bash
# Dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install -y libglib2.0-bin gnome-shell-extensions zip python3

# From the repo root
./build-and-install.sh

# Enable (if needed)
gnome-extensions enable emoji-copy@felipeftn

# Wayland: log out/in for a full refresh
```

### Native packages

Work in progress...

> We need to publish this project to most known package managers, like AUR, Fedora and so on.

<!-- - [`gnome-shell-extension-emoji-selector` (**Fedora**)](https://src.fedoraproject.org/rpms/gnome-shell-extension-emoji-selector) -->
<!-- - `gnome-shell-emoji-selector` (**nixOS**) -->
<!-- - [`gnome-shell-extension-emoji-selector-git` (**AUR**)](https://aur.archlinux.org/packages/gnome-shell-extension-emoji-selector-git/) -->
<!-- - ...<!-1- TODO à compléter -1-> -->

#### Manual installation

**Not recommended at all:** installing the extension this way will prevent any further updates.

1. Download and extract the ZIP, then open a terminal in the project's directory.
2. Ensure you have a database at `emoji-copy@felipeftn/data/emojis.db`:
   - Easiest: copy from an existing install:
     - `cp ~/.local/share/gnome-shell/extensions/emoji-copy@felipeftn/data/emojis.db emoji-copy@felipeftn/data/`
   - Or generate: `python3 ./build/parser.py`
3. Choose a way to install the extension:

```bash
    --> Make 🔥
    $ make install

    --> NPM 😇
    $ npm run deploy

    --> Shell scripts 🤨
    $ sh install.sh

    --> Hardcore 💀
    $ cp -a ./emoji-copy@felipeftn $HOME/.local/share/gnome-shell/extensions
```

You may need to restart the GNOME Shell environment (<kbd>Alt</kbd>+<kbd>F2</kbd> -> `restart` -> <kbd>Enter</kbd>).<br> _(X11 only, if you are in Wayland, sign out and sign in from the session manually)._

## Debug and Test 🏗

We have a lot of ways to debug and test our code. Currently, we already have a complete guide to debug and test our extension in a local environment described in [debug.md](./debug.md) file.<br>
In a simpler way, you can debug the code in two ways:

```bash
    --> Make 🔥
    $ make debug

    --> Gnome Dbus Session 🚧
    $ make && dbus-run-session -- gnome-shell --nested --wayland
```

## Memory performance 👾

Loading hundreds of small pictures and thousands of keywords into the memory is
a lot. Despite a few attempts to optimize their loading, I'm not an expert at
all concerning memory management, and the extension may be responsible for
between 10MB and 60MB of memory usage, which is a lot. Don't blame the actual GS
devs for it.<br>

**✨ Update:**<br>
Currently, we are loading emojis with SQLite. With a SQL query system, we were
able to load just the necessary amount of emojis for each category. All the emojis are "pre-compiled" during the building process, and generates a `emojis.db` file at data directory _(inside extension's directory)_.<br>
We still can do a lot of improvements in the way we load and display these emojis. Maybe some skeletons and non-syncronous loading should be great to avoid slow loadings.

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
