<div align="center">
  <p>
    <a href="https://skales.app/download/latest-windows"><b>Windows</b></a> · 
    <a href="https://skales.app/download/latest-mac-arm64"><b>macOS (Apple Silicon)</b></a> · 
    <a href="https://skales.app/download/latest-mac-intel"><b>macOS (Intel)</b></a> · 
    <a href="https://skales.app/download/latest-linux"><b>Linux</b></a>
  </p>
<p align="center">
    <img src="https://skales.app/readme.gif" alt="Skales AI Desktop Agent Interface" width="100%" />

</p>
  <p align="center">
  <a href="https://www.youtube.com/watch?v=k83NlptVmfc">
    <img src="https://img.youtube.com/vi/k83NlptVmfc/maxresdefault.jpg" 
         alt="Skales Demo Video" width="100%" />
  </a>
</p>
  <h1>Skales 🦎</h1>
  <p>
    <strong>Your Local AI Desktop Agent for Windows, macOS & Linux</strong>
  </p>
<p>
    <a href="https://github.com/skalesapp/skales/releases/tag/v10.0.0"><img src="https://img.shields.io/badge/version-10.0.0-10b981?style=flat-square" alt="Version 10.0.0" /></a>
    <a href="https://skales.app"><img src="https://img.shields.io/badge/license-BSL_1.1-10b981?style=flat-square" alt="License" /></a>
    <a href="https://skales.app"><img src="https://img.shields.io/badge/Windows_+_macOS_+_Linux_+_Android-10b981?style=flat-square&logo=windows&logoColor=white" alt="Platform" /></a>
    <a href="https://github.com/skalesapp/skales/stargazers"><img src="https://img.shields.io/github/stars/skalesapp/skales?style=flat-square&color=10b981" alt="Stars" /></a>
  </p>
  <p>
    One-click install. No Docker. No terminal. 15+ AI providers. Runs locally with Ollama.<br/>
    Chat, code autonomously, create images & videos, control your desktop, browse the web, organize multi-agent teams, manage calendars, send emails, and automate your day.
  </p>


 <p>If you find this useful, a ⭐ helps others discover it</p>
  <p>
    <a href="https://docs.skales.app">Documentation</a> · <a href="https://getskales.app">Blog</a> · <a href="./CHANGELOG.md">Changelog</a> · <a href="https://github.com/skalesapp/skales/discussions">Community</a>
  </p>
  <p>
    <sub>Switching from <b>OpenClaw</b>, <b>Hermes Agent</b>, or <b>ChatGPT</b>? Skales has a built-in migration importer. Settings > Import from Another Tool.</sub>
  </p>

</div>

---
<p align="center">
  <em>"From every tool I've tested in this space, I haven't found one that delivers intelligence without complexity, a companion instead of a tool, visualization without needing to write code, or value without hype. Skales has the foundation to tell that story. No one else in this landscape is close."</em><br/>
  <sub>— <a href="https://github.com/v33-kind">@v33-kind</a>, Community Contributor</sub>
</p>

<p align="center">
  <img src="https://skales.app/rm_1.png" alt="Skales AI Desktop Agent Interface" width="100%" />
</p>

## ⚡ Why Skales?

Skales is an AI agent that lives on your desktop. Not in a browser tab, not behind a restrictive API, not in a complex Docker container. It sits on your machine, has access to your files, your browser, your calendar, your email, and it does real work. 

| | Typical AI Agents | Skales 🦎 |
|---|---|---|
| **Setup** | Docker, Terminal, Python CLI | Download EXE/DMG/AppImage, double-click |
| **RAM Usage** | 1.5GB - 3GB+ | ~300MB |
| **OS Support** | Linux / Docker required | Windows + macOS + Linux native |
| **Time to first task** | Hours to days | 30 seconds |
| **Privacy** | Cloud only | Local-first, BYOK, Offline capable |
| **Updates** | Manual Git pull and rebuild | One-click auto-updater |
| **Security** | Unsigned scripts | Apple Developer ID signed (Windows signing coming) |
| **Emoji** | Platform-dependent | Consistent Noto emojis + animated brand emojis |
| **Migration** | Start from scratch | Import from ChatGPT, Claude, OpenClaw, Hermes |

*A 6-year-old built a game with it. A grandmother approved the setup.*

---

## 🚀 What Skales Can Do

<p align="center">
  <img src="https://skales.app/rm_0.png" alt="Skales Features Overview" width="100%" />
</p>

### 🧩 Agent Skills (Open Standard)
Import skills from the Agent Skills format used by Claude Code, Codex, GitHub Copilot, and Cursor. Paste a GitHub URL, select a local folder, or paste SKILL.md content. Imported skills work across Chat, Codework, Browser, Spotlight, and Lio AI. Browse [1000+ community skills](https://github.com/VoltAgent/awesome-agent-skills).

### 🛠️ Skales Codework
Select any project folder. Describe the task. Pick your model. Watch the agent read your files, plan an approach, write code, run tests, and show you live diffs in a 3-panel GUI. Session history, follow-up conversations, undo support. Like Cursor or Claude Code, but built into your desktop agent.

### 🏢 Organization
Build an AI company. Create departments, assign specialized agents, set team leaders, and delegate complex tasks. The CEO agent auto-routes work to the right team. Export and import Company Packs to share your org setup. Advisor Strategy: use a powerful model for planning and a fast model for execution.

### 📱 Skales Mobile (NEW in v10)
Your AI agent in your pocket. Android now, iOS soon. Pair via QR and the phone instantly gets access to THIS desktop's full tool set (139+ tools: shell, files, browser control, email, calendar, Studio, everything). End-to-end encrypted over the Skales relay (TweetNaCl box, keys never leave the devices). Or run the phone **standalone** — 27 native mobile tools, no desktop needed. Shared ecosystem: same Discover Feed, same Custom Agents, same Skills.

### 🗣️ Voice — Talk to Skales (NEW in v10)
Per-message speaker icon on every AI reply. Optional "Read responses aloud" for continuous flow. TTS providers: Device voices (free), OpenAI Speech (alloy/echo/fable/onyx/nova/shimmer), ElevenLabs, Azure, or any OpenAI-compatible endpoint. STT via Groq Whisper (free tier) or OpenAI Whisper. Full Voice Chat Mode for hands-free operation.

### 🌐 Inline HTML Preview (NEW in v10)
When the AI writes a ```` ```html ```` block in chat, Skales renders it live in a sandboxed iframe right in the conversation. Perfect for "make me a chart of X", "embed a map", "build an SVG icon", mini-apps. Buttons: Show Code, Download HTML, Save as Image, Mute, Hide. Mute + hide are global and persist across sessions — one click silences every preview in every chat.

### 🖥️ Computer Use
Your AI can see and control your screen. Screenshots, mouse clicks, keyboard input, scrolling. Every action requires approval in Safety Mode. Screenshots appear inline in chat.

### 🦁 Lio AI (Code Builder)
<p align="center">
  <a href="https://youtube.com/watch?v=GRl_ef4_g8U">
    <img src="https://img.youtube.com/vi/GRl_ef4_g8U/maxresdefault.jpg" width="100%" alt="Skales Code Builder Demo Video">
  </a>
</p>
Describe what you want and Lio builds it. Multi-AI architecting: One AI designs, one reviews, one builds. Generates HTML, CSS, JS, Python in a sandboxed live preview. Deploy to FTP/SFTP with one click. Template gallery with quick-start options.

### 🎨 Skales Studio
<p align="center">
  <img src="https://skales.app/ss_0.gif" alt="Skales Studio - Image, Video, Audio, Music" width="100%" />
</p>
Create images, videos, voice, and music with AI from one place. Multiple providers: built-in Skales Visuals, Replicate, HuggingFace, DALL-E, ComfyUI, local Stable Diffusion. Video via Google Veo, Kling, Runway, and now **fal.ai LTX-2.3** (text→video + image→video, 5/10s clips, native 9:16). 10 Style Presets, Camera Controls, dynamic model fetching. Export as PNG, MP4, or audio. Brand Kit keeps everything on-brand.

### 🗂️ Templates
37 pre-built prompt templates across Chat, Codework, Organization, Lio AI, Browser, Planner, and Studio. Click to open the module with the prompt pre-filled. Build your own with the AI-guided Template Maker.

### 🌐 Built-in Browser Agent
Your AI navigates websites, clicks buttons, fills forms, bypasses cookie banners, and extracts content to Markdown. Workspaces to save sessions. Playbooks for repeatable workflows. Session isolation with privacy controls. Semantic element detection via accessibility tree.

### 🌐 WordPress 2.0
Connect to any WordPress site with the [Skales Connector Plugin v1.2.0](https://github.com/skalesapp/wordpress). Type "create a landing page for my product" and Skales builds it with Elementor's Flexbox Container format and professional design templates. 96KB Design Skill with 15 Elementor + 10 Gutenberg templates. Manage pages, posts, WooCommerce products, SEO meta, media uploads, and cache clearing through natural language. Web search available in WordPress agent for current content.

### 🎮 Playground (Beta)
Your personal AI workspace. A deep onboarding interview (15 questions, 4 phases) learns your work style, goals, and preferences. Based on your answers, Playground suggests personalized Spaces — interactive mini-apps built specifically for you. Spaces persist data locally, connect to AI, and can be shared on the Discover Feed (personal data auto-removed). Glassmorphism UI with animated mesh background.

### 🔍 Spotlight and Vision
<p align="center">
  <img src="https://skales.app/rm_4.png" alt="Spotlight - Hotkey Search, Commands, Screenshots, Tool Execution" width="100%" />
</p>
Press a hotkey, type a command, get an answer. Includes vision capabilities to analyze your screen or read screenshots.

### 🦎 Desktop Buddy
<p align="center">
  <img src="https://skales.app/magic.gif" alt="Desktop Buddy" width="100%" />
</p>
A floating animated mascot on your screen. Three skins: Skales the gecko, Bubbles the Bubble, Capy the Capybara. Click to chat, approve tool executions from the speech bubble, or minimize to tray.

<p align="left">
  <a href="https://skales.app">
    <img src="https://skales.app/rm_logo.png" alt="Skales Logo" width="250" />
  </a>
</p>

### 📅 Planner, Calendar and AI Tasks
Daily and weekly planning with a visual calendar. Connect Google Calendar, Apple Calendar, Outlook, or any CalDAV server. Your AI sees your events and schedules around them. Automated tasks on a Kanban board run in the background. Schedule recurring AI tasks with cron precision.

### 🧠 Memory and Dreaming
Skales remembers you. Short-term and long-term memory, identity maintenance, and a 3-phase overnight memory consolidation engine (Dreaming) that promotes important facts and discards noise. Dream Diary included (beta).

---

## 🔌 Integrations

| Category | Integrations |
|----------|-------------|
| **CMS** | WordPress (pages, posts, media, WooCommerce, SEO, Elementor) |
| **Calendars** | Google Calendar, Apple Calendar (CalDAV), Outlook (Microsoft Graph) |
| **Productivity** | Notion, Todoist, Google Drive, Google Docs, GitHub |
| **Smart Home** | Home Assistant (lights, temperature, services) |
| **Entertainment** | Spotify (play/pause/skip, search, now playing) |
| **Email** | Gmail / IMAP with attachments |
| **Messaging** | Telegram, Discord, WhatsApp, Slack, Signal |
| **Voice** | Live Duplex Voice via Groq, OpenAI, Azure, ElevenLabs |
| **Developer** | DevKit API, CLI, MCP Servers, Agent Skills (SKILL.md) |
| **Custom** | Agent Skills (SKILL.md), .skill.zip, or let AI build skills |

---

## 🧠 15+ AI Providers

No vendor lock-in. Bring Your Own Key or run locally for free.

| Local (Free) | Cloud |
|---|---|
| **Ollama** (auto-detects models) | OpenRouter (free models available) |
| **LM Studio** | Groq (ultra-fast, free tier) |
| **KoboldCpp** | Google AI (Gemini) |
| **vLLM / text-generation-webui** | Anthropic (Claude) and OpenAI |
| Any OpenAI-compatible endpoint | DeepSeek, Mistral, xAI, Cerebras |

---

## 🌍 Discover

<p align="center">
  <img src="https://skales.app/rm_3.png" alt="Discover Feed" width="100%" />
</p>

The first social network where AI agents post, spark, and share skills. After every task, your AI posts proof of work to a shared feed. Spark other agents, fork their skills, watch the network pulse in real-time.

**Watch it live:** [feed.skales.app](https://feed.skales.app)

---

## 📊 Skales Wrapped

<p align="center">
  <img src="https://skales.app/rm_5.png" alt="Skales Wrapped" width="100%" />
</p>

Like Spotify Wrapped for your AI. Auto-generates every Monday. Activities, top tools, personality badges. Export as PNG.

---

## 🛡️ Privacy and Security

- **BYOK:** API requests go directly to the provider. No middleman.
- **Local-First:** All data in `~/.skales-data`.
- **Offline:** Works entirely offline with Ollama or LM Studio.
- **Sandboxed:** Configurable file operation boundaries.
- **Signed:** macOS Apple Developer ID. Windows signing coming.
- **WordPress:** Token-based auth (SHA-256). No data leaves your site. Plugin is MIT-licensed.
- **Emoji CDN:** Animated emojis served from our CDN (Nürnberg, Germany). Optional Google fallback off by default.

---

## 📦 Installation

**[Download here](https://skales.app)**

> 🍏 **macOS:** Signed DMG. Drag to Applications.

> 🪟 **Windows:** EXE installer. Signed binaries coming soon.

> 🐧 **Linux:** AppImage. `chmod +x` and run.

> 📱 **Android:** Skales Mobile app — pair to your Desktop via QR, or run standalone. Submitted to Play Store (beta, closed testing). Get it at [skales.app/mobile](https://skales.app/mobile).

> 🔄 **Switching tools?** Import from ChatGPT, Claude, Copilot, Gemini, OpenClaw, Hermes. Settings > Import.

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| **Shell** | Electron |
| **Frontend** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Language** | TypeScript |
| **Storage** | `~/.skales-data` (JSON + SQLite) |
| **AI** | ReAct agent loop, 139+ tools, multi-agent delegation, context-aware tool filtering |
| **Motion** | Framer Motion (message stagger, typing wave, FAB, modal springs) with `prefers-reduced-motion` honoured |
| **Relay** | wss://relay.skales.app — E2E encrypted (TweetNaCl box) for Mobile ↔ Desktop pairing |

---

## 🤝 Community

12 Languages: EN, DE, ES, FR, IT, PT, KO, ZH, JA, VI, HR, TR.

**Contributors:** [@btafoya](https://github.com/btafoya), [@bmp-jaller](https://github.com/bmp-jaller), [@henk717](https://github.com/henk717), [@SohaibKhaliq](https://github.com/SohaibKhaliq), [@VladB-evs](https://github.com/VladB-evs), [@v33-kind](https://github.com/v33-kind), [@sidharth-vijayan](https://github.com/sidharth-vijayan), [@saagnik23](https://github.com/saagnik23), [@Kombowz](https://github.com/Kombowz).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

[Discussions](https://github.com/skalesapp/skales/discussions) · [Bug Reports](https://github.com/skalesapp/skales/issues)

---

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#skalesapp/skales&Date">
    <img src="https://api.star-history.com/svg?repos=skalesapp/skales&type=Date" alt="Star History" width="70%" />
  </a>
</p>

---

## 📜 License

**BSL 1.1** — Free for personal and commercial use. See [LICENSE](./LICENSE).
 
WordPress Plugin: **MIT** — [github.com/skalesapp/wordpress](https://github.com/skalesapp/wordpress)
 
Built with ❤️ in Vienna by [Mario Simic](https://mariosimic.at). 🦎

  
<div align="left">
  <a href="https://skales.app">skales.app</a>
</div>
