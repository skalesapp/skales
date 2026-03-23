# Skales - Windows Installation Guide

## Download

Download the latest version from [skales.app](https://skales.app) or [GitHub Releases](https://github.com/skalesapp/skales/releases).

- **Windows:** `Skales-Setup-6.2.0.exe`

## Installation

1. Run the downloaded `.exe` installer
2. **Windows SmartScreen** may show "Windows protected your PC" - click **More info** then **Run anyway**
3. Follow the installer prompts
4. Skales launches automatically after installation
5. Done! Skales runs at `http://localhost:3000`

## Troubleshooting

### Windows SmartScreen Warning

"Windows protected your PC" appears because Skales is not yet code-signed with an EV certificate. This is expected for unsigned apps.

Click **More info** then **Run anyway** to proceed.

### Why does this happen?

Skales is not yet signed with a Windows EV code signing certificate. This is planned for a future release. The app is clean - you can verify on [VirusTotal](https://www.virustotal.com).

### Using Ollama on Windows?

If you have the **Ollama Desktop App** installed and running, go to **Settings - AI Provider** and select **Ollama (Local)**. Click **Test Connection** to verify. Skales will auto-start Ollama if it is installed but not yet running.

If you run Ollama via command line, use the **Custom (OpenAI-compatible)** option in Settings with URL: `http://localhost:11434/v1`

## Data Location

All Skales data is stored in `%USERPROFILE%\.skales-data\`. This persists across updates and reinstalls.

## Uninstall

1. Open Settings > Apps > Skales > Uninstall
2. Optionally delete data: delete the `.skales-data` folder in your user directory
