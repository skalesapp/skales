# **Changelog**

All notable changes to Skales will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v7.0.1 — Hotfix (March 2026)

### Bug Fixes
- **Telegram Bot:** Fixed bot process crash on end-user machines. Bot now uses Electron's built-in Node runtime (`fork()`) instead of requiring system Node.js installation (`spawn('node')`). Affects all platforms. Same fix applied to WhatsApp bot.
- **Chat Frozen:** Fixed chat becoming unresponsive after vision model error. Session history is now sanitized before every API call, preventing corrupted message blocks from breaking subsequent requests.
- **Streaming Timeout:** Added 60-second inactivity timeout to prevent chat UI from hanging permanently on broken API responses.
- **Vision Fallback:** When a model doesn't support vision, images are now stripped gracefully and the message is sent as text-only instead of corrupting the session.

---

## V7.0.0 - "The Foundation" (March 2026)

### New Features
- **Proactive Desktop Buddy** - Rule-based buddy intelligence observes calendar, email, tasks, and idle time. Meeting reminders, end-of-day summaries, idle check-ins, morning greetings. Respects quiet hours. No LLM calls.
- **Planner AI** - AI-powered daily scheduling. 8-step wizard learns work patterns, generates time-blocked plans from calendar events, pushes them back to your calendar. Chat integration: "plan my day."
- **Calendar Abstraction** - Google Calendar, Apple Calendar (CalDAV/iCloud), and Outlook (Microsoft Graph API). All three work simultaneously. Planner AI reads from all providers.
- **FTP/SFTP Deploy** - Upload Lio AI projects to any FTP server. Per-project deploy config, incremental upload (only changed files), test connection, 4 website starter templates.
- **7 Languages** - English, German, Spanish, French, Russian, Chinese (Simplified), Japanese. Full UI translation including onboarding.
- **Skales+ Tiers** - Free Forever / Personal ($9/mo) / Business ($29/mo) tier page with waitlist. All features free during beta.
- **Morning Briefing** - Daily digest of calendar events, pending tasks, unread emails, delivered via Telegram and chat.
- **File Sandbox** - Three modes: Unrestricted, Workspace Only, Custom Folders. Enforced on all file tools.
- **Redesigned Onboarding** - 7-step wizard with Cloud/Local/Custom provider cards, Ollama auto-detect, buddy picker, safety mode selection.
- **Model Auto-Fetch** - Real-time model lists from OpenAI, Google, OpenRouter APIs. No more hardcoded model IDs.
- **Linux Beta** - AppImage and .deb builds for x64 Linux.

### Improvements
- **Unified Notification Router** - All notifications go through one system. Quiet hours, per-type cooldowns, channel routing (bubble, Telegram, dashboard).
- **Settings Restructured** - 6 tabs (General, AI Providers, Integrations, Buddy, Security, Advanced) replace the single long scroll.
- **Custom Endpoint Equality** - Vision toggle, TTS URL, configurable timeout. Local AI is a first-class citizen.
- **Ollama Revolution** - Auto-detect on startup, real model dropdown via /api/tags, localhost consistency, 5s ping timeout, CORS warning.

### Bug Fixes
- Email Bug 31: Agent respects "send from marketing@" instructions. From parameter in send_email tool.
- Buddy speech bubble height for approval dialogs
- Think/reasoning tags stripped from buddy bubble
- Email whitelist per-mailbox
- Custom endpoint timeout configurable (5-120s)
- Empty API key no longer sends blank auth header
- WhatsApp toggle marked "Coming Soon" (was dead control)
- Dashboard notification channel fixed (was silently dropping messages)

### Platform
- Windows x64 (stable)
- macOS Apple Silicon (stable)
- macOS Intel (stable)
- Linux x64 AppImage (beta)
- Linux x64 .deb (beta)

---

## V6.2.0 - "The Telegram Fix" (March 2026)

### Critical Fixes
- Fixed: Endless Telegram approval loop — 9 tools (check_system_status, check_capabilities, check_identity, fetch_skales_docs, analyze_image, generate_voice, update_capabilities, enable_skill, disable_skill) missing from TOOL_SAFETY map caused read-only tools to require approval every call
- Fixed: TOOL_SAFETY fallback changed from 'confirm' to 'auto' — new tools no longer silently block with a console warning for unmapped tools
- Fixed: Telegram session history now preserves tool results with orphan protection — LLM no longer re-calls already-executed tools
- Fixed: Google Translate TTS hardcoded to German (`tl=de`) — now uses user's configured nativeLanguage/locale

### Improvements
- Telegram approval route now re-enters agent loop for natural responses after tool execution
- Autopilot "yes"/"no" intercept now checks task age (5 min window) to prevent eating unrelated messages
- App-shell pageshow event listener properly cleaned up (memory leak fix)
- Variable shadowing fixed in Telegram callback query handler (`data` → `responseData`)
- SkalesSettings interface extended with locale, theme, buddy_skin, telemetry_enabled, telemetry_anonymous_id fields

## V6.1.1 — Hotfix (March 2026)
- Fixed: Telemetry key mismatch - /api/settings endpoint now exposes telemetry_enabled, feedback page uses correct URL
- Fixed: Feature Request textarea not editable on /feedback page (was disabled when telemetry appeared off)
- Fixed: Report Bug sidebar link now opens /feedback instead of old modal
- Fixed: Skin/language change now prompts for restart with Electron relaunch support
- Fixed: Chat input focus lost after deleting chat or receiving media via Telegram
- Fixed: White screen on mobile Chrome tab switch via Tailscale (visibility recovery in app shell)
- Fixed: Privacy section consolidated - telemetry toggle moved into Security & Privacy, dynamic text based on state
- Updated: All 4 locale files (en/de/es/fr) with new privacy section keys (1010 keys each)

## V6.1.0 — "The Awakening" (March 2026)

### Autopilot — True Autonomous Agent
- **Recurring Task Scheduling**: Master Plan now generates cron jobs for recurring goals. "Check my email every morning at 8am" creates an actual scheduled task, not a one-shot.
- **Live Execution View**: New tab in Autopilot dashboard shows real-time agent reasoning, tool calls, and results as they happen. Watch Skales think.
- **Automatic Daily Stand-up**: Autopilot generates and delivers a daily briefing via Telegram every weekday at 9am (configurable). No button click needed.
- **Safe Mode: Approval Instead of Skip**: Scheduled tasks in Safe Mode now pause for approval instead of being silently skipped. Visible on the Execution Board.
- **Telegram Approval for Autopilot**: Approve or reject Autopilot tasks directly from Telegram. Reply `approve <id>` or `reject <id>`, or simple `yes`/`no` for single pending tasks.
- **Accurate API Rate Limiter**: Cost controls now count actual LLM calls per task (not 1 per task dispatch). Budget reflects real usage.

### New Features
- **Bubbles Mascot Skin**: Meet Bubbles — a playful blue liquid blob that morphs into different shapes. Selectable in Settings → Desktop Buddy alongside the original Skales gecko.
- **Feedback & Rating System**: New /feedback page with 3 sections: Rate Skales (4 emoji ratings), Report a Bug, Request a Feature. Data sent to server only with telemetry opt-in. GDPR compliant.
- **Admin Dashboard v3**: Redesigned server-side analytics dashboard with Chart.js. New Feedback tab with rating distribution pie chart, feature request table, and timeline view.

### Bug Fixes (13)
- Fixed: Telegram approval gate ignores safetyMode (Critical)
- Fixed: Telegram inline keyboard buttons never appear — replaced with text-based approval
- Fixed: Telegram agent hallucinates tool execution when blocked by approval
- Fixed: Telegram pairing shows raw translation key `system.telegram.pairingSuccess`
- Fixed: Telegram duplicate messages (409 Conflict) from multiple polling instances
- Added: Telegram purge/reset button in Settings
- Fixed: Orphaned `tool_result` blocks crash Anthropic API
- Fixed: Replicate images not saved to workspace
- Fixed: Telemetry `provider_type` fires on every message (now 1hr cooldown)
- Fixed: Telemetry `language` event fires on every app start
- Fixed: Telemetry sends data when opt-in is disabled (GDPR violation)
- Fixed: `system.errors.rateLimited` raw i18n key shown instead of translated error
- Fixed: Identity Maintenance double `.skales-data` path in file reads
- Fixed: `'medium'` priority type bug in cron task creation and agent-sync

---

## v6.0.2 (2026-03-16)

### Fixed
- **[CRITICAL] Telegram approval gate ignores safetyMode** — Unrestricted mode now bypasses approval entirely via Telegram (Bug 1)
- **[CRITICAL] Telegram inline keyboard buttons don't work** — Replaced with text-based approval ("yes"/"no" replies) (Bug 2)
- **[CRITICAL] Agent hallucinates tool execution** — Blocked tools now inject explicit BLOCKED signal into conversation, preventing LLM from claiming success (Bug 3)
- **[CRITICAL/LEGAL] Telemetry sends data when opt-in is disabled** — Added defense-in-depth opt-in check at API route level; zero network requests when telemetry is off (GDPR compliance) (Bug 11)
- **[HIGH] Orphaned tool_result blocks crash API** — Added message sanitization in agentDecide() that removes tool_results referencing non-existent tool_calls (Bug 7)
- **[HIGH] Telegram pairing shows raw translation key** — Improved pairing success/failure messages with emojis and clear guidance (Bug 4)
- **[MEDIUM] Telegram duplicate messages (409 Conflict)** — Added update_id dedup guard with bounded Set to prevent processing same update twice (Bug 5)
- **[MEDIUM] Replicate images not saved to workspace** — Fixed download path to workspace/files/images/, added explicit error checking and empty-data validation (Bug 8)
- **[LOW] Telemetry provider_type fires too often** — Changed cooldown from 1 minute to 1 hour for session-level events (Bug 9)
- **[LOW] Telemetry language event fires every start** — Now only fires when language actually changes (localStorage tracking) (Bug 10)

### Added
- **Telegram Reset button** — "Reset All" button in Settings → Telegram that purges all Telegram data (pending approvals, logs, lock files, pairing) (Bug 6)
- **Bubbles mascot skin** — New mascot option: a blue liquid blob that morphs into different shapes. Select in Settings → Desktop Buddy → Skin
- Skin descriptions now shown in the mascot selector UI

### Improved
- Gemini and Replicate images now save to consistent workspace/files/images/ path
- Telegram approval messages are clearer and more user-friendly
- All Telegram pairing and error messages use hardcoded English strings (no i18n key resolution needed)

---

## v6.0.1 (2026-03-15)

### Fixed
- Safety Mode simplified to Safe + Unrestricted (removed confusing Advanced mode)
- Approval flow no longer stalls after confirming tool execution
- Safe Mode now continues the agent loop after approval (ReAct continuation)
- Telegram bot shows proper messages instead of raw translation keys
- Telegram approve/decline inline buttons now appear correctly
- Telegram messages cleaned of markdown formatting before sending (prevents silent API failures)
- Custom Skill pages now have a working input field for all skills
- Replicate image generation works with new API format (official models endpoint)
- Telemetry ping limited to once per minute per event (no duplicate entries)
- Capabilities check now reports always-active features honestly
- Identity maintenance cron uses built-in tools instead of shell commands (cross-platform safe)
- Locale files verified: all 4 languages have identical key structures (970 keys each)

### Improved
- Agent execution mandate: agent now acts immediately instead of explaining what it could do
- Platform-aware system prompt: dynamic PowerShell vs bash rules based on OS
- Unrestricted mode injects execution override into system prompt for full autonomy
- PDF handling instructions added to system prompt (try read_file before shell tools)
- Custom skill creation instructions included in system prompt
- Enhanced anonymous telemetry: tool usage, provider type, language, feature usage
- All telemetry remains opt-in, anonymous, and GDPR compliant

---

## v6.0.0 - "The Foundation" (March 2026)

### Multilingual
- Full UI translation: English, Deutsch, Espanol, Francais (849 translated keys)
- Language picker as first onboarding screen
- Language switcher in Settings (always accessible, no restart needed)
- System messages, approval prompts, and error messages translated
- Telegram bot responses in user's selected language
- Desktop Buddy speech bubbles translated

### New Providers
- Replicate integration (BYOK) - access 50+ image and video AI models with one API key
- Custom OpenAI-compatible endpoint - supports llama.cpp, LM Studio, vLLM, koboldcpp, text-generation-webui
- Tool calling toggle for custom endpoints (on/off, for local models that don't support function calling)

### Skales+
- Tier comparison page (Free Forever / Personal / Business)
- Email waitlist for upcoming premium features
- All current features remain free and unlocked

### Desktop Buddy
- Flickering fix - smooth 150ms crossfade transitions between animations
- Dynamic folder system - new animations load automatically without code changes
- Full skin system - create a folder in public/mascot/, add .webm clips, select from Settings
- Skin selector in Settings (Desktop App section) - shown when more than one skin is installed
- Direct DOM opacity swap eliminates React state batching delay
- Buddy can now execute tools: write files, send emails, browse the web, manage calendar, and more
- Approve/Decline buttons appear inside the speech bubble when an action needs confirmation
- No more "redirect to main chat" for tool execution - the buddy handles it directly
- Auto-executed tools (safe actions) run immediately and show a result bubble
- Tool result summaries shown inline; "Open Chat for details" link for long outputs

### Privacy and Feedback
- Anonymous telemetry opt-in - disabled by default, prompt during onboarding
- Collected data: app version, OS platform, start and crash events only
- No conversations, no API keys, no file paths, no personal data ever sent
- Anonymous UUID generated once and reused - never regenerated
- Report Bug button in the sidebar (bottom, above Stop Server)
- Bug reports sent to developer via collect.php; local fallback to bugreports.jsonl if offline
- System info (OS platform) included in reports - optional checkbox, on by default
- Both telemetry and bug report endpoints: https://skales.app/api/collect.php

### Approval System
- TOOL_SAFETY default changed to 'confirm' - unknown tools require approval by default
- create_document tool implemented (aliases to write_file with workspace path)
- Telegram inline buttons now appear correctly (parse_mode fix)
- Telegram bot works on any port (dynamic SKALES_PORT, no more hardcoded localhost:3000)

### Build System
- Automated mascot/static asset copy (scripts/post-nextjs-build.js)
- Build scripts consolidated (build:web step in root package.json)
- Version string centralized via APP_VERSION in meta.ts

### Security
- Default tool safety is now 'confirm' (was 'auto') - prevents hallucinated tool execution
- Telegram port injection prevents silent callback failures
- Chat bubble overflow protection (no more horizontal scrollbar on wide content)

### Bug Fixes
- Chat bubble horizontal overflow fixed (min-w-0 + overflow-x: auto)
- Sub-component useTranslation() hooks added where missing
- pdf-lib dependency corruption handled
- Package-lock.json regenerated with correct version
- Sidebar version now imports from meta.ts instead of hardcoded string

---

## v5.5.0 - March 2026

### Security
- Approval system enforcement - destructive actions (send email, delete file, calendar changes, tweets) now require explicit user confirmation
- Browser blacklist now covers Playwright - blocked domains can no longer be bypassed
- Unrestricted Mode properly bypasses approval gate when enabled
- Screenshot auto-Telegram removed - only forwards when explicitly requested

### Accessibility
- ARIA labels on all interactive UI elements (buttons, inputs, navigation, toggles)
- Full keyboard navigation with visible focus indicators
- Screen reader support via aria-live regions on chat, buddy bubbles, and approval dialogs
- Skip-to-main-content link
- Compatible with NVDA (Windows) and VoiceOver (macOS)

### Desktop Buddy
- Friendly error messages ("Oops.. could you take a look?") instead of raw errors
- Video transition flickering fixed (requestVideoFrameCallback)
- Honest response when tools unavailable ("I can only do that in the main chat - Open Chat →")

### Bug Fixes
- Input field lock after chat deletion resolved
- Spellcheck disabled globally (both main window and buddy window)
- Custom Skill buttons now work (executeSkill IPC bridge added)
- Confirmation message shown after approved tool execution
- Browser blacklist property name fix (blocked.blocked)

### Infrastructure
- Author metadata embedded (package.json, meta.ts, /api/health, settings footer)
- Skales+ tier system foundation (lib/license.ts)
- Multilingual architecture foundation (lib/i18n.ts, locales/en.json)
- Google Analytics on skales.app with click event tracking
- Community testimonial grid on landing page

---

## **5.0.0** - The Desktop Companion Update (2026-03-02)

Skales v5.0.0 is the largest single release in the project's history. It ships the full Autopilot meta-agent, Voice Chat, a Custom Skill Ecosystem, Document Generation, Google Places, a Network Scanner, DLNA Casting, a brand-new **Desktop Buddy**, and a comprehensive v5 stability pass covering background polling crashes, Windows notification identity, mic guard on HTTP, cron scheduling, fluid identity, and multi-agent protocol.

---

### **🦎 Desktop Buddy - Floating Mascot & Spotlight Quick Action**

- **Transparent Electron Window**: A frameless, always-on-top `BrowserWindow` (400×500 px) positioned at the bottom-right corner of the primary display. No taskbar entry. No shadow. Fully draggable.
- **Finite State Machine (FSM)**: The mascot cycles through four states using `onEnded` video events: **Intro** (random welcome clip on launch) → **Idle** (looping base animation) → **Action** (random shuffle-bag clip every 45-90 s, never repeats until all played) → back to **Idle**. Clicking the mascot triggers **Query** state with the Attentive animation looping.
- **Spotlight Quick Input**: Glassmorphism input field with backdrop blur, lime-green glow border, and animated loading spinner. Random Skales-flavoured placeholders rotate on each open. Press Enter to submit, Escape to dismiss.
- **AI Response Bubble**: The AI reply is shown as a glassmorphism speech bubble with a pointer tail, auto-dismissed after 10 seconds (click to dismiss early). Replies are trimmed to 120 characters for readability.
- **Silent Session DB Sync**: Every question and answer is silently appended to `DATA_DIR/buddy/YYYY-MM-DD.json` via the new `/api/buddy-memory` route. No UI feedback, no interruption.
- **Settings Toggle**: Added 🦎 **Desktop Buddy** toggle in **Settings → Desktop App** (Electron-only section). Uses `skales.send('set-desktop-buddy', bool)` IPC. State persists in-memory via `desktopBuddyEnabled` flag in `main.js`.
- **Smart Visibility**: Buddy window appears when the main window is minimized or hidden, and hides when the main window is restored or shown. Toggling off instantly hides the buddy.

---

### **⭐ Autopilot - The Autonomous Chief of Staff**

- **🤖 Autopilot Dashboard**: Brand-new dedicated page (`/autopilot`) with four sections: Control Room, Execution Board, Identity & Memory, and Live History. Accessible via the gold-highlighted sidebar item.
- **🎤 Deep-Dive Interview**: Multi-turn LLM interview that learns your primary goal, niche, budget, and constraints. Saves profile to `user_profile.json`. Starts with a randomised epic call-to-action button.
- **🗺️ Master Plan Generation**: LLM generates a structured roadmap + task list from your profile. Tasks are pushed directly onto the Execution Board.
- **🔁 OODA Self-Correction Loop**: If a sub-task discovers new context (dead website, changed pricing, failed dependency), Autopilot autonomously rewrites, deletes, or reprioritises pending tasks and logs the reason with a full audit trail (`replanReason` / `replannedAt`).
- **🛡️ Human-in-the-Loop Approval Gates**: Tasks involving mass communications, file deletion, or financial transactions are auto-flagged (`requires_approval`). The runner pauses them until the user clicks Approve or Reject on the Execution Board.
- **💰 API Cost Control**: Configurable max LLM calls per hour (`maxCallsPerHour`) and "pause after N tasks" (`pauseAfterTasks`) session counter. If a limit is hit, Autopilot pauses and waits for user acknowledgment - no silent API overspend.
- **🔄 Anti-Loop Protocol**: Automatic retry tracking (`retryCount` / `maxRetries` = 3). After 3 consecutive failures a task is permanently `blocked` with a `blockedReason`, never retried again.
- **🗞️ Daily Stand-Up Report**: LLM generates a first-person morning briefing from completed, blocked, and in-progress tasks, plus recent log entries.
- **📋 Execution Board (Kanban)**: Full CRUD for tasks - Add, Edit, Cancel, Delete. Filter by state. Shows provider/model, re-plan badge, priority selector, and per-task approve/reject UI.
- **📟 Live History Terminal**: Dark terminal-style log viewer (`autopilot_logs.json`). Colour-coded by level (info/success/warning/error). Auto-polls every 8 seconds. Rolling 500-entry cap.

### **🧠 Meta-Agent - Universal Skill Dispatcher**

- **🔌 Headless Skill Execution**: Autopilot is a meta-agent with programmatic, isolated access to every active skill. All background executions never touch the foreground UI, chat history, or active sessions.
- **🤝 Internal Group Chat**: Spawns parallel LLM calls with different personas to reach a consensus on complex decisions.
- **`[SKILL:xxx key="val"]` Syntax**: Tasks can explicitly route to a specific skill handler via tag syntax in their description.
- **Skill Handlers**: `web_search`, `documents`, `network_scanner`, `email`, `twitter`, `googleCalendar`, `ooda_replan`, `internal_group_chat`.

### **🎙️ Voice Chat Interface**

- **Mic Button**: Amber-styled microphone button between New Session and History (visible only when Voice Chat skill is active).
- **Voice Chat Mode**: Dedicated fullscreen input overlay with status labels (Idle → Recording → Transcribing → Thinking → Speaking), animated pulse ring when recording.
- **Whisper Transcription**: Routes to Groq Whisper first, falls back to OpenAI Whisper. Endpoint: `/api/voice/transcribe`.
- **TTS Playback**: ElevenLabs TTS with browser SpeechSynthesis fallback.

### **🧩 Skill AI - Custom Skill Ecosystem**

- **ZIP Upload**: Upload a `.skill.zip` to install a completely new capability. Skales extracts, validates, and hot-reloads without restart.
- **AI Scaffolding**: Describe a skill in plain language - Skales generates the full skill definition, handler code, and metadata automatically.
- **Skills Page**: Manage installed custom skills - enable/disable, view metadata, delete. Isolated sandboxed execution.
- **Security Warning**: All uploaded skills display a security advisory banner before activation.

### **📄 Documents Generation**

- **Word (.docx)**: Generate fully-formatted Word documents from natural language using the `docx` library.
- **PDF**: Every document request simultaneously generates a PDF version via `pdf-lib`.
- **Excel (.xlsx)**: Create spreadsheets with data, formulas, and formatting via the `xlsx` library.
- **Output**: Files saved to `DATA_DIR/documents/` and linked directly in the chat response.

### **🗺️ Google Places**

- **Nearby Search**: Find restaurants, shops, services near any address or coordinates.
- **Place Details**: Fetch business hours, ratings, reviews, website, phone number.
- **Geocoding**: Convert addresses to coordinates and vice versa.
- **Directions**: Get turn-by-turn navigation data between two points.
- **Photo URLs**: Retrieve Google Places photo references.
- **Implementation**: Pure REST API fetch - no Google SDK, no native binaries.

### **🌐 Network Scanner**

- **LAN Discovery**: Scans all 254 addresses in the local subnet using raw `net.connect()` (pure Node.js - no nmap, no shell).
- **Port Detection**: Reports open ports per device. Specifically detects other Skales instances on port 3000.
- **API Endpoint**: `POST /api/network-scan` with configurable subnet and port list.

### **📺 Media Casting (DLNA/UPnP)**

- **SSDP Discovery**: Finds DLNA/UPnP media renderers on the LAN using `node-ssdp`.
- **AVTransport Control**: Play, Pause, Stop, Seek, and Set Volume on discovered devices via raw UPnP SOAP over HTTP.
- **Zero native binaries**: Pure Node.js - no `castv2-client`, no `mdns`, no Chromecast SDK.

### **🔧 v5 Polish - Stability, Identity & Infrastructure**

- **Proactive Check-In Cron Loop**: Added `tickCronJobs()` to the autonomous runner heartbeat. Cron jobs in `CRON_DIR` now automatically fire on their schedule without requiring a separate cron runner process. In-memory dedup (`cronLastRanAt` Map) prevents double-fires within 55 minutes.
- **Voice Chat Mic Crash (HTTP Guard)**: Added `if (!navigator.mediaDevices?.getUserMedia)` guard in `startRecording()`. Users on plain HTTP now receive a clear error message instead of a silent crash: *"Microphone access requires a secure connection (HTTPS or localhost)."*
- **Windows App User Model ID**: Added `app.setAppUserModelId('Skales')` for Windows before the single-instance lock. Toast notifications and taskbar entries now display "Skales" instead of the Electron app ID.
- **Capabilities Registry v5.0.0**: Bumped version to `5.0.0`, corrected `twitter` and `safety_mode` `SkillDef` shapes, added 7 new v5 skills: `autopilot`, `custom_skills`, `places`, `documents`, `voice_chat`, `network_scanner`, `casting`.
- **Mobile UI Polish**: Removed `"Talking to: "` prefix from the agent selector. Added `hidden md:inline` to New Session / Voice / History header button text so icons-only appear on mobile.
- **Network & Devices Page** (`/network`): New full `'use client'` page with two tabs - **Network Scanner** (mode selector: info/skales/full, live device list with Skales-flag badge) and **DLNA Casting** (discover renderers, device picker, cast/pause/stop controls). Added `Network` icon and sidebar entry.
- **Skill AI Enhancements**: Added `requiresApiKeys` toggle in the Custom Skills generation UI. Enabled `requiredSecrets` array in the generated skill manifest. Added a conditional UI Playbook block (CSS variables, Tailwind guidance, lucide-react tips) injected into the system prompt when `hasUI: true`.
- **Fluid Identity System Prompt**: Rewrote `buildContext()` in `identity.ts` from markdown bullets to a flowing narrative wrapped in an HTML comment. Includes current time, who Skales is, who the user is, key learnings, and recent memory highlights.
- **Agent-to-Agent Protocol** (`/api/agent-sync`): New route supporting `ping`, `handshake`, `delegate`, and `status` operations. Optional `SKALES_AGENT_SECRET` environment variable for bearer authentication. Task delegation via `createTask()`, status queries via `getTask()`.

### **🛡️ Wake-Up Crash Fix (ErrorBoundary + Polling Guards)**

- **Global ErrorBoundary** (`src/components/error-boundary.tsx`): React class component wrapping `<AppShell>`. Catches render errors via `getDerivedStateFromError`, async errors via `window.unhandledrejection` (ignores `AbortError`). Renders a Skales-themed fallback with 🦎 icon and "↺ Reload Skales" button.
- **Polling Guards** - `document.hidden` check + `visibilitychange` listener added to:
  - `chat/page.tsx`: voice `setInterval`, video poll `setTimeout` chain (with `try/catch` retry), Telegram poll effect.
  - `notification-manager.tsx`: `checkInbox`, `checkCalendarReminders`, `runMemoryScan`.
  - `app-shell.tsx`: `checkEmail`.

### **📦 New Dependencies**

- `xlsx` ^0.18.5 - Excel generation
- `docx` ^8.5.0 - Word document generation
- `pdf-lib` ^1.17.1 - PDF generation
- `node-ssdp` ^4.0.1 - SSDP device discovery

---

## **4.0.0** - The Desktop Edition (February 2026)

### **New Features**

- **🖥️ Native Desktop App**: Skales is now a proper desktop application for Windows and macOS, built with Electron. Install it once - no terminal, no manual server starts, no browser required. Launch it like any other app.
- **🔒 Single-Instance Lock**: Opening Skales a second time now focuses the existing window instead of spawning a duplicate process.
- **⚡ Smart Port Detection**: If port 3000 is occupied, Skales automatically tries 3001 and 3002 before failing gracefully - no more manual port conflicts.
- **🌅 Launch at Login**: New toggle in Settings → Desktop App to start Skales automatically when you log in. Works on both Windows (registry) and macOS (Login Items) via Electron's native API.
- **🛑 Graceful Shutdown**: Skales now sends SIGTERM to the internal Next.js server on quit and waits up to 5 seconds for in-flight tasks to finish before force-killing. No more torn bot sessions or half-written data on exit.
- **🪟 Hidden CMD Window (Windows)**: The internal Next.js server process no longer flashes a console window on Windows startup.
- **🍎 macOS Info.plist**: The `.app` bundle now includes proper copyright, version strings, privacy usage descriptions, and local networking permissions in `Info.plist`.
- **📁 Home Directory Data Storage**: All user data (`.skales-data`) now stored in the user's home directory, not inside the app bundle. Data persists across updates and reinstalls.
- **🔧 Centralized Path Resolution**: Single `paths.ts` module ensures consistent data directory across all 34 source files.
- **🍎 macOS Backup Fix**: ZIP import no longer crashes on macOS (replaced Python script with native Base64-encoded extraction).

### **Bug Fixes**

- Fixed: ZIP Import now forcefully overwrites existing data for full recovery
- Fixed: App performs full relaunch after backup import to clear Next.js cache
- Fixed: All 34 source files now use centralized DATA_DIR from paths.ts

### **📦 No New Dependencies**

All new features implemented using Electron's built-in APIs (`app.requestSingleInstanceLock`, `app.setLoginItemSettings`, Node's `net` module).

---

## **3.5.0** - The Connections Update (February 2026)

### **New Features**

- **🐦 X / Twitter Integration**: Connect your Twitter/X account via OAuth 1.0a. Skales can post tweets, read your timeline, fetch @mentions, and reply to tweets - from the chat interface or via Telegram. Full CRUD with three permission modes: Send Only, Read & Write, Full Autonomous. API keys stored securely in `.skales-data/integrations/`.
- **🛡️ Safety Mode**: Three-level command safety system (Safe / Advanced / Unrestricted). Safe mode blocks destructive shell commands (rm -rf, format, dd, fork bombs, etc.) outright. Advanced mode pauses dangerous commands and asks for Approve/Reject. Unrestricted mode disables all blocking for power users.
- **📱 OpenRouter Telegram Vision Fix**: Image uploads via Telegram now work correctly when OpenRouter is the active provider. Skales auto-detects non-vision-capable models and falls back to `openai/gpt-4o-mini` for vision tasks.
- **🔗 Secure Clipboard Fallback**: Clipboard copy now works on HTTP/Tailscale connections (not just HTTPS) by falling back to a textarea-based execCommand copy when the Clipboard API is unavailable.

### **Bug Fixes & Improvements**

- Fixed `crypto.randomUUID()` breaking on HTTP connections (Tailscale/LAN IPs) - replaced with a secure Math.random fallback across all platforms.
- Fixed mobile input bar disappearing behind the keyboard on iOS/Android.
- Fixed chat scroll-jump when new messages arrive while scrolled up.
- Fixed hydration mismatch on mobile chat page caused by SSR/client render differences.
- Fixed Telegram memory wordcloud rendering edge case.
- Fixed Playwright cookie banner auto-dismiss not triggering on some pages.
- Improved proactive AI personality - Skales now occasionally initiates conversation based on context.
- Lio AI workspace fixes: invisible projects now visible, chat history preserved across sessions, failed build status resolved.
- Email: Trusted Address Book feature, HTML email rendering, IMAP namespace fix, timezone normalization for event timestamps.
- ElevenLabs TTS fallback chain improved - now gracefully falls back to Google TTS on API errors.
- macOS: `uninstall.sh` renamed to `uninstall.command` for consistency with all other launcher scripts.
- Setup scripts: improved admin rights handling, clearer UX messages, better error reporting.

### **📦 No New Dependencies**

All new features implemented without adding external packages.

---

## **3.0.0** - The Power Update (February 2026)

### **New Features**

- **🦁 Lio AI - Code Builder**: Multi-AI code builder using Architect + Reviewer + Builder model pipeline. Build entire apps, websites, and scripts from plain-language descriptions. Navigate to the Code tab to use it.
- **🌐 Browser Control**: Headless Chromium automation via Playwright. Navigate, click, type, scrape, and screenshot any website. Requires Vision Provider.
- **👁️ Vision Provider**: Configurable vision model for image analysis, desktop screenshots, and Browser Control. Supports Google, OpenAI, Anthropic, OpenRouter, Groq.
- **🔄 Auto-Update System**: One-click update download and installation with progress tracking, automatic backup, and rollback on failure.
- **🦁 Group Chat Multi-AI**: Lio AI uses multiple AI models simultaneously for architecture review.
- **🧠 Enhanced Memory**: Improved bi-temporal memory system.

### **Bug Fixes & Improvements**

- Fixed Telegram image analysis routing (no longer triggers duplicate reasoning loops)
- Browser Control now correctly detects Playwright installation status via filesystem check
- Lio AI time estimates now show realistic values (2-7 min) instead of utopian numbers
- Vision provider label in chat correctly shows active provider name

---

## **2.0.0** - 2026-02-23

### **✨ Added**

* **Message Queue:** FIFO message queue prevents message loss when Skales is busy processing. Queued messages are shown in the chat UI with a counter badge. Users can cancel individual queued messages or the currently-processing message. Works across Chat, Telegram, and WhatsApp interfaces.

* **Google Calendar Skill:** Read, create, edit, and delete Google Calendar events via OAuth. Skales can check your schedule, add events with reminders, and surface upcoming events as context in every conversation. Configurable in Settings → Skills → Google Calendar.

* **Gmail / Email Skill:** Full IMAP/SMTP email management - fetch inbox, read threads, compose, reply, search, move, and delete emails. HTML-to-text conversion for clean LLM display. Approve/reject safety gates for send and delete operations. New email notifications appear as a banner on the dashboard. Configurable in Settings → Skills → Email.

* **Bi-Temporal Memory System:** Automatic 90-minute memory scan extracts user preferences, facts, and action items from recent conversations. Memories carry both a valid-time (when the fact is true) and a transaction-time (when it was recorded). Relevant memories are injected as context before every AI response using local keyword extraction - no external embedding API required.

* **Telegram Admin Interface:** Remote-control Skales from Telegram using inline keyboard menus. Switch providers, models, and personas; toggle skills on/off; view real-time status; export conversation data. Admin-only access with PIN protection.

* **Killswitch:** Emergency hard-stop for all AI activity, triggerable via Dashboard button, Telegram `/killswitch` command, or automatically on RAM overload and detected infinite loops. Generates a detailed incident log on the desktop on activation.

* **Multi-Persona Group Chat Skill:** Multiple LLMs with distinct personas discuss a user question in sequential rounds. Fully configurable: participants, language, number of rounds, and personas. Discussions can be exported as Markdown.

* **Autonomous Execute Mode:** An opt-in mode where Skales autonomously handles complex multi-step tasks. Presents a plan for approval, then executes step-by-step with progress updates and approve/reject checkpoints for critical actions (file writes, email sends, deletions). Available via chat and Telegram.

* **Website & Search Security Blacklists:** Domain blocklist prevents Skales from fetching dangerous or inappropriate websites. Buzzword filter blocks harmful search queries before they reach the search API. Both are toggle-controlled in Settings → Security with curated default lists included. Fully customizable - add or remove entries from the UI.

* **Responsive UI:** Full mobile and tablet support across the entire dashboard. Collapsible sidebar with overlay, mobile header, touch-optimized controls, and proper viewport handling.

### **🔄 Changed**

* Upgraded internal skill registry to support new skill types (Calendar, Email, Group Chat, Execute Mode).
* Enhanced Telegram handler to support inline keyboard menus and all new admin commands.
* Memory system now runs alongside the existing knowledge base (non-breaking additive enhancement).
* Orchestrator tool safety model extended: `delete_email` → confirm, `reply_email` → confirm, `move_email` → auto, `empty_trash` → confirm.
* Email bodies are now HTML-to-text converted before being passed to the LLM for cleaner, token-efficient context.
* Dashboard email notification bar now shows a single aggregated row (count + latest sender) instead of stacking multiple banners.

### **🐛 Fixed**

* Fixed message loss when sending messages while Skales was already processing a response (all messages are now safely queued).
* Fixed security blacklist toggle switches not animating (invalid Tailwind class `translate-x-4.5` replaced with `translate-x-[18px]`).
* Fixed IMAP MOVE operation fallback - now correctly uses COPY + addFlags(\\Deleted) + expunge on servers that don't support the MOVE extension.

### **📦 New Dependencies**

* `nodemailer` ^6.9.14 - SMTP email sending (compose, reply, forward)
* `imap-simple` ^5.1.0 - IMAP email fetching, search, flag management, folder operations

---

## **0.9.0** - 2026-02-19**

### **✨ Added**

* **Weather Tool:** Integrated Open-Meteo API for free, keyless 7-day weather forecasts and geocoding.  
* **Image Generation Skill:** Integrated Google Imagen 3 via a beautiful new Chat Skill Toolbar. Supports multiple aspect ratios and styles.  
* **Video Generation Skill:** Integrated Google Veo 2 with asynchronous polling (8s intervals) directly in the chat interface.  
* **Skills Management Page:** New UI to toggle individual skills (Image Gen, Video Gen, Summarize, Weather) on or off.  
* **Chat Skill Toolbar:** Added a "Sparkles" icon to the chat input to easily access generation panels.  
* **Smooth Preloader:** Added elegant loading animations (Spin-Ring, Gecko, Bouncing Dots) for better UX.

### **🔄 Changed**

* **Persona System Overhaul:** Completely rewrote all 5 Personas (Default, Entrepreneur, Coder, Family, Student) with 150-200 word deep-dive prompts to give them distinct, self-improving voices.  
* **Agentic Loop Enhancements:** Increased MAX\_LOOPS to 20 to allow Skales to handle highly complex, multi-file tasks. Added a visual step-indicator and fixed the stuck-state UI bug.  
* **File System Security Toggle:** Added a strict toggle in Settings (Workspace Only vs. Full Access) to sandbox file operations.  
* **Self-Awareness (Capabilities Registry v1.4):** Skales can now natively audit its own physical connections, verify identity files, and report on system health via tools.  
* **Decoupled Notifications:** The internal scheduler is no longer hard-tied to Telegram, allowing for a universal system inbox.

### **🐛 Fixed**

* Fixed Groq TTS issues by establishing a primary HTTP POST pipeline with a robust Google TTS (Translate) fallback.  
* Auto-switch logic for Vision models now correctly triggers when images are pasted or uploaded.  
* Fixed the "Enter to send" behavior when images are attached in the chat input.
