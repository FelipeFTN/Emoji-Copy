# EMOJI COPY DEBUG

I will be working on a better MD file later, for now, I will be droping here
some useful commands I used to debug this extension.

### Reset extension

`gnome-extensions reset emoji-copy@felipeftn`

### enable extension

`gnome-extensions enable emoji-copy@felipeftn`

### Start a new debug session

`dbus-run-session -- gnome-shell --nested --wayland`

### Symbolic link

`ln -s ~/Desktop/emoji-copy/emoji-copy@felipeftn/ ~/.local/share/gnome-shell/extensions/debug-emoji-copy@felipeftn`

### Useful docs

- [GJS](https://gjs-docs.gnome.org/) GJS Documentation
- [GJS Settings](https://gjs-docs.gnome.org/gio20~2.0/gio.settings) GJS Settings Documentation
- [GJS Guide](https://gjs.guide/guides/) GJS Extensions Guide
- [Adwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/index.html) Gnome Adw documentation
