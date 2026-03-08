<div align="center">

# 🦎 Skales

### Your Local AI Agent - Desktop App for Windows & macOS

**Download. Install. Done.**
**No Terminal. No Docker. No Node.js. No npm.**

[![Version](https://img.shields.io/badge/version-5.0.0-1DB954?style=for-the-badge&labelColor=0D1117)](https://skales.app)
[![License](https://img.shields.io/badge/license-BSL_1.1-1DB954?style=for-the-badge&labelColor=0D1117)](./LICENSE)
[![Platform](https://img.shields.io/badge/Windows_+_macOS-1DB954?style=for-the-badge&labelColor=0D1117&logo=windows&logoColor=white)](https://skales.app)
[![GitHub](https://img.shields.io/badge/GitHub-skalesapp%2Fskales-1DB954?style=for-the-badge&labelColor=0D1117&logo=github&logoColor=white)](https://github.com/skalesapp/skales)

[**Download**](https://skales.app) · [**Documentation**](https://docs.skales.app) · [**Changelog**](./CHANGELOG.md)

---

</div>

## ⚡ Why Skales?

| | Others | Skales |
|---|---|---|
| **Setup** | Docker, Terminal, CLI | Download EXE/DMG, double-click |
| **RAM** | 1.5–3GB+ | ~300MB |
| **OS** | Linux / Docker required | Windows + macOS native |
| **Time to first agent** | Hours to days | 30 seconds |
| **Updates** | Manual rebuild | One-click installer |

---

## 🚀 Features

**🖥️ Native Desktop App** - Runs as a proper desktop application. System tray, auto-start, graceful shutdown. No browser needed.

**Multi-Provider Hub** - 11+ LLM providers: OpenRouter, OpenAI, Groq, Anthropic, Google, Mistral, Together AI, xAI, DeepSeek, Cerebras, and local Ollama.

**🦁 Lio AI - Code Builder** - Multi-AI code builder. Architect designs, Reviewer improves, Builder executes. Live preview. Build entire projects from plain language.

**🌐 Browser Control** - Headless Chromium automation via Playwright. Navigate, click, fill forms, scrape, screenshot any website.

**👁️ Vision & Screenshots** - Desktop screenshot analysis, image recognition, vision-capable model fallback across all channels.

**💬 Telegram & WhatsApp** - Chat with Skales on the go. Full remote control via Telegram with admin menus.

**📧 Gmail Integration** - Read, compose, reply, search, manage emails. IMAP/SMTP with safety gates.

**📅 Google Calendar** - Read/write access via OAuth. Schedule events, get reminders.

**𝕏 Twitter/X Integration** - Post tweets, read timeline, reply to mentions. OAuth 1.0a.

**🛡️ Safety Mode** - Three-level command safety: Safe / Advanced / Unrestricted.

**🧠 Bi-Temporal Memory** - Auto-extracts facts and preferences from conversations. Injected as context before every reply.

**👥 Group Chat** - Multiple AI personas debate your questions in configurable rounds.

**⚡ Autonomous Execute Mode** - Multi-step task execution with approve/reject checkpoints.

**🛑 Killswitch** - Emergency stop via dashboard, Telegram, or automatic trigger.

**🎨 Image & Video Generation** - Google Imagen 3 and Veo 2 built into the chat.

**🔍 Live Web Search** - Real-time, cited search results via Tavily.

**🗣️ Voice (TTS/STT)** - Speak to Skales and hear replies.

**🔒 Security** - Sandboxed file access, command blacklist, domain blocklist, VirusTotal scanning.

**⭐ Autopilot - Chief of Staff** - Fully autonomous background agent. Conducts a Deep-Dive Interview, generates a Master Plan, executes tasks while you sleep. OODA self-correction loop rewrites tasks on new context. Human-in-the-loop approval gates for sensitive actions.

**🎙️ Voice Chat** - Full duplex voice interface. Speak to Skales and hear replies via ElevenLabs TTS or browser speech synthesis. Whisper (Groq / OpenAI) for transcription.

**🧠 Skill AI - Custom Skill Ecosystem** - Upload .skill.zip packages to add completely new capabilities. AI-generated skill scaffolding. Hot-reload without restart. Isolated sandboxed execution.

**📄 Document Generation** - Create Excel (.xlsx), Word (.docx), and PDF files from natural language. Output files saved to the workspace and linked in chat.

**🗺️ Google Places** - Search nearby places, geocode addresses, get directions, fetch business details and photos via Google Places REST API.

**🌐 Network Scanner** - Discover all devices on your LAN. Detects other Skales instances on the same network.

**📺 Media Casting** - Cast any media URL to DLNA/UPnP renderers on your network (smart TVs, speakers, Chromecast).

**🦎 Desktop Buddy** - A transparent, frameless Electron window that sits in the corner of your desktop. Animated mascot with a Finite State Machine (Intro → Idle → Action). Click to open a glassmorphism Spotlight input - ask Skales anything from your desktop without opening the main window. Responses appear as auto-dismissing speech bubbles. Enable in **Settings → Desktop App → 🦎 Desktop Buddy**.

**🤝 Agent-to-Agent Protocol** - `/api/agent-sync` endpoint for multi-Skales collaboration. Supports `ping`, `handshake`, `delegate`, and `status` operations so multiple Skales instances can coordinate on the same local network.

**💾 Export / Import Backup** - One-click ZIP backup of all settings, memories, and integrations.

---

## 📦 Installation

| Platform | Download |
|---|---|
| **Windows** | [Download for Windows](https://skales.app) |
| **macOS (Apple Silicon)** | [Download for macOS (M1–M4)](https://skales.app) |
| **macOS (Intel)** | [Download for macOS (Intel)](https://skales.app) |

1. Download for your platform from **[skales.app](https://skales.app)**
2. Run the installer (EXE or DMG)
3. Skales opens as a desktop app
4. Follow the setup wizard - add your API key and start chatting

**No Terminal. No Node.js. No Docker. No npm.**

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| **Desktop Shell** | Electron (main process, tray, auto-updater) |
| **Frontend** | Next.js 15 (App Router, standalone output) |
| **Styling** | Tailwind CSS |
| **Language** | TypeScript |
| **Bots** | Node.js (Telegram, WhatsApp, Discord) |
| **Storage** | `~/.skales-data` (SQLite + JSON) |
| **Updates** | electron-updater (auto, silent) |
| **Build** | electron-builder (NSIS installer / DMG) |

---

## 🛠️ Building from Source

> **Note:** Pre-built installers are available at [skales.app](https://skales.app). Building from source is for contributors and developers.

### Prerequisites
- Node.js 20+
- npm 10+
- macOS (for `.dmg` builds) or Windows (for `.exe` builds)

### Steps

```bash
# 1. Install root dependencies
npm install

# 2. Build the Next.js frontend
cd apps/web
npm install --legacy-peer-deps
npm run build

# Copy standalone assets (required)
cp -r .next/static       .next/standalone/.next/static
cp -r public/*           .next/standalone/public/
cp -r public/mascot/*    .next/standalone/public/mascot/

cd ../..

# 3. Build the Electron app
npm run build:mac   # macOS DMG
npm run build:win   # Windows EXE (run on Windows)
```

Output is in `dist/`.

---

## 🤝 Contributing

Contributions are welcome for bug fixes and non-commercial improvements.

1. Fork the repository: `https://github.com/skalesapp/skales`
2. Create a feature branch: `git checkout -b fix/your-fix`
3. Commit your changes: `git commit -m "fix: description"`
4. Push and open a Pull Request

Please read the [BSL-1.1 license](./LICENSE) before contributing. All contributions are subject to the same license terms.

---

## 🛡️ Privacy by Design

- **BYOK (Bring Your Own Key):** API requests go directly from your machine to the provider. No middleman.
- **Local-First Storage:** All data stays on your machine in `~/.skales-data`.
- **Offline Capable:** With Ollama, Skales works entirely offline.
- **Sandboxed Autonomy:** File operations run in a workspace sandbox.

> ⚠️ Skales can browse the web, execute commands, and manage files on your behalf. Always review what you ask it to do.

---

## 📖 The Story

Skales started in early 2025 as a bloated Laravel SaaS project. I scrapped it all and rebuilt it via "Vibe Coding" - the result is a local-first AI companion that feels like a real product, not a developer tool.

I'm **Mario Simic** - 10+ years in Marketing & Design. I know how software should look and feel. I got tired of agents that require Terminal setups and Docker containers. So I built something better.

### 🏆 Credits

- **Claude & Google Gemini** - For powering the Vibe Coding workflow.
- **OpenRouter** - The best hub for accessing the world's greatest LLMs.

---

## 🔒 License

[**Business Source License 1.1 (BSL)**](./LICENSE)

**Free for personal & educational use.** Commercial use requires a license: [dev@mariosimic.at](mailto:dev@mariosimic.at)

See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) for details.

**Local AI Agent (Source Available)e release - v5.0.0 is the first publicly released version under BSL-1.1.**

---

<div align="center">

**[skales.app](https://skales.app)** · [**GitHub**](https://github.com/skalesapp/skales) · Built with ❤️ and Vibe Coding by **Mario Simic**

*Not just an agent. Your desktop companion.* 🦎

</div>
