# Skales - macOS Installation Guide

## Download

Download the latest version from [skales.app](https://skales.app) or [GitHub Releases](https://github.com/skalesapp/skales/releases).

- **Apple Silicon (M1/M2/M3/M4):** `Skales-6.2.0-arm64.dmg`
- **Intel Mac:** `Skales-6.2.0.dmg`

## Installation

1. Open the downloaded `.dmg` file
2. Drag **Skales** to your **Applications** folder
3. **Important - First Launch:**

macOS will show "Skales is damaged and can't be opened" because the app is not yet code-signed. This is expected for unsigned apps downloaded from the internet.

**Fix:** Open Terminal and run:

```
sudo xattr -rd com.apple.quarantine /Applications/Skales.app
```

4. Open Skales from Applications (first time: right-click > Open)
5. Done! Skales runs at `http://localhost:3000`

## Troubleshooting

### "Skales is damaged and can't be opened"

This is the macOS Gatekeeper quarantine flag. Run:

```
sudo xattr -rd com.apple.quarantine /Applications/Skales.app
```

The `-rd` flag removes the quarantine attribute recursively from the app and all files inside it.

### Still not opening after xattr?

Try:

```
sudo xattr -cr /Applications/Skales.app
sudo chmod -R 755 /Applications/Skales.app
```

### Why does this happen?

Skales is not yet code-signed with an Apple Developer ID certificate. Apple notarization is planned for a future release. Until then, this one-time Terminal command is required after installation.

### Using Ollama on macOS?

If you have the **Ollama Desktop App** installed and running, go to **Settings - AI Provider** and select **Ollama (Local)**. Click **Test Connection** to verify.

If you run Ollama via Terminal (`ollama serve`), use the **Custom (OpenAI-compatible)** option in Settings with URL: `http://localhost:11434/v1`

**Note:** If Test Connection fails right after starting Ollama, wait 5 seconds and try again. Ollama can take a moment to become responsive on first launch.

## Data Location

All Skales data is stored in `~/.skales-data/`. This persists across updates and reinstalls.

## Uninstall

1. Drag Skales from Applications to Trash
2. Optionally delete data: `rm -rf ~/.skales-data/`
