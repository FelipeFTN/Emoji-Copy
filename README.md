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
2. Choose a way to install the extension:

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

## Memory performance 👾

Loading hundreds of small pictures and thousands of keywords into the memory is
a lot. Despite a few attempts to optimize their loading, I'm not an expert at
all concerning memory management, and the extension may be responsible for
between 10MB and 60MB of memory usage, which is a lot. Don't blame the actual GS
devs for it.

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

The extension is currently available in the following languages:

- Castillan (thanks to mario-mra)
- Simplified chinese (thanks to larryw3i)
- Dutch (thanks to vistaus)
- Esperanto (thanks to nicolasmaia)
- German (thanks to jonnius)
- Italian (thanks to amivaleo)
- Polish (thanks to alex4401)
- Brazilian portuguese (thanks to nicolasmaia, picsi & frnogueira)
- Turkish (thanks to mimoguz)

If you need another language, please contribute! ♥
