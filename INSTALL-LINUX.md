# Skales — Linux Installation Guide (Beta)

> **Linux support is in Beta as of v7.2.0.** Core features work well on major distros. See Known Issues below for edge cases.

---

## Download

Download from [skales.app](https://skales.app) or [GitHub Releases](https://github.com/skalesapp/skales/releases).

Two formats are available:

| Format | Best for |
|--------|----------|
| **AppImage** (recommended) | Any distro — Ubuntu, Fedora, Arch, Manjaro, Mint, etc. |
| **.deb** | Debian, Ubuntu, and derivatives (apt-based) |

---

## AppImage (Recommended)

Works on any distro without installation. No root required.

```bash
# Make executable and run
chmod +x Skales-7.2.0-x64.AppImage
./Skales-7.2.0-x64.AppImage
```

To add to your application launcher, create a `.desktop` file:

```bash
cat > ~/.local/share/applications/skales.desktop << 'EOF'
[Desktop Entry]
Name=Skales
Exec=/path/to/Skales-7.2.0-x64.AppImage
Icon=skales
Type=Application
Categories=Utility;Development;
EOF
```

---

## .deb Package (Debian / Ubuntu)

```bash
# Install the package
sudo dpkg -i Skales-7.2.0-x64.deb

# Fix any missing dependencies
sudo apt-get install -f

# Launch
skales
```

---

## Auto-Start on Login

Skales does not configure auto-start automatically on Linux. To start Skales on login:

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/skales.desktop << 'EOF'
[Desktop Entry]
Name=Skales
Exec=/path/to/Skales-7.2.0-x64.AppImage
Type=Application
X-GNOME-Autostart-enabled=true
EOF
```

---

## Ollama (Local AI — Recommended)

Skales detects Ollama automatically on launch. To install:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Pull a model to get started:

```bash
ollama pull llama3.2
# or for a larger model:
ollama pull qwen2.5:7b
```

Skales will auto-detect Ollama at `http://localhost:11434` when you select the Ollama provider in onboarding. For remote Ollama, set the URL in **Settings → AI Models → Ollama → Base URL**.

---

## System Tray

On **GNOME**, the system tray requires an extension:

```bash
# Install AppIndicator extension
sudo apt install gnome-shell-extension-appindicator   # Ubuntu/Debian
# Then enable it in GNOME Extensions
```

On **KDE Plasma**, **XFCE**, and **i3/Sway** with a compatible bar (e.g. waybar), the tray works without additional setup.

---

## Known Issues (Beta)

| Issue | Workaround |
|-------|------------|
| Desktop Buddy floating window may behave unexpectedly on tiling WMs (i3, Sway, Hyprland) | Disable Desktop Buddy in Settings → Desktop App if it causes layout issues |
| System tray icon missing on stock GNOME | Install AppIndicator extension (see above) |
| Auto-start not configured automatically | Create a `.desktop` file in `~/.config/autostart/` (see above) |
| FUSE required for AppImage on some distros | `sudo apt install fuse libfuse2` |
| Wayland: some popup windows may flicker | Launch with `ELECTRON_OZONE_PLATFORM_HINT=wayland` prefix |

---

## Data Location

All Skales data (memory, settings, API keys, credentials) is stored in:

```
~/.skales-data/
```

This folder persists across updates and uninstalls. **Back it up** to preserve your configuration.

---

## Uninstall

**AppImage:** Simply delete the `.AppImage` file. Remove `~/.skales-data/` to wipe all data.

**.deb:**
```bash
sudo dpkg -r skales
# To also remove data:
rm -rf ~/.skales-data/
```

---

## Feedback & Bug Reports

Linux-specific issues: [github.com/skalesapp/skales/issues](https://github.com/skalesapp/skales/issues)

Please include your distro, desktop environment, and display server (X11 or Wayland) in bug reports.
