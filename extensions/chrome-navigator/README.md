# Skales Docs Navigator

A production-ready Chrome Extension for [https://docs.skales.app/](https://docs.skales.app/) built as a PR-ready contribution. 

## Features
- **Live Search**: Instantly search documentation content directly from the Chrome Side Panel.
- **Code Snippet Saver**: Save code blocks natively from the docs and easily access them anytime.
- **Right-Click Context**: Quickly save any highlighted text to your side panel.

## Architecture
- **Manifest V3**: State of the art Chrome extension platform.
- **Side Panel API**: Delivers a rich search UI right next to the documentation.
- **Service Workers**: Handles background orchestration efficiently.
- **Dependency-Free Core**: Uses Vanilla JS to ensure a lightweight and blazing fast experience.

## Installation / Local Dev
1. Clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the root directory (or `public` directory depending on setup) containing `manifest.json`.
5. Pin the extension and navigate to `docs.skales.app` to use.

## Environment Variables
If searching relies on an external API in the future, please add your API Key in `src/sidepanel.js` (Currently using DOM Fallback search).
