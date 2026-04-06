# **Changelog**

All notable changes to Skales will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## v9.0.5 — "The Organization Update" (April 2026)

### Highlights
- **Canvas Office**: Organization executions now play out in an animated office. Agents sit at desks, speech bubbles show tool usage, monitors glow during work, confetti on completion. 15 diverse character designs.
- **Live Polling**: Organization canvas updates in real-time as agents work. No more waiting for the entire task to finish before seeing results.
- **Memory System**: Persistent agent memory via MEMORY.md index with topic-based files. Tools: memory_read, memory_write, memory_delete. Relevant memories injected as context before every response.
- **Auto-Compress**: Automatic context compression at 75% capacity. Keeps last 8 messages, compresses older ones. Silent fallback on error. Works alongside Token Compressor.

### New Features
- Organization: Canvas Office with 17 drawing functions, animated agents, z-ordered desks and monitors
- Organization: Live execution polling via API route (Next.js serialization fix)
- Organization: Abort button to cancel running tasks
- Organization: Shared memory between agents during execution
- Organization: Projects CRUD (create, assign teams, track history)
- Organization: Tool awareness audit (agents know what tools they have)
- Organization: Timeout increased from 180s to 600s for research tasks
- Organization: Safe Mode instructs agents to prepare emails/commands as files instead of executing them
- Organization: Dynamic warning text (Safe Mode vs Unrestricted)
- Settings: Native folder picker (Browse button) for file system access
- Swarm: "How it Works" explainer page
- Email: Sent folder logging via IMAP APPEND after send_email
- Chromium: Auto-install via resolveNodeBin (no system npx dependency)

### Fixed
- **Critical**: sanitizeMessages removes orphaned `tool_result` blocks that crashed Anthropic and Gemini providers
- **Critical**: Organization agents now inherit all default Skales agent tool capabilities (tools propagate automatically)
- **Critical**: "Done" loop detection — short replies (<10 chars) matching done/fertig/task complete after tool calls trigger re-prompt for actual answer
- **Critical**: Tool loop limiter — max 2 identical calls + max 20 total per turn prevents infinite tool retry loops (especially Gemini Flash)
- **Critical**: send_email in Organization no longer silently fails — previously returned success without sending (orchestrator approval gate returned pendingConfirmation:true)
- Settings: Danger Zone button text shortened (was repeating entire description paragraph)
- Identity Maintenance no longer crashes on orphaned tool_result blocks
- Planner: Calendar events timezone offset fixed (UTC handling)
- Planner: Notification dismissed state now persists
- Organization: Page no longer scrolls away from canvas during execution (scrollIntoView replaced with container-internal scroll)
- Organization: Canvas state recovers when navigating away and returning
- Organization: Loading indicator during LLM planning phase ("Planning subtasks...")
- Organization: Light mode CSS variables for canvas
- Discover: Activity posts now describe what user actually did (not generic tips)
- Feature request hint added to feedback flow
- Gamertag: Change now updates existing entry instead of appending duplicate (feed.php)
- Bot-feed: Automatic votes cleanup for performance (feed-votes.jsonl)

### Changed
- Version bumped from 9.0.2 to 9.0.5
- Organization page fully reworked with canvas-first layout
- API route polling replaces client-side interval for Organization status

---

## v9.0.2 — Patch (April 2026)

### Fixed
- Settings: API keys no longer disappear when switching models (useRef fallback)
- Codework: Project names are now sanitized to valid npm-compatible slugs
- Organization: Clipboard copy now works in Electron with visual feedback
- Organization: Agents now respond in the user's configured language
- Discover: Post templates rewritten to describe user activity (user-centric)
- Discover: Added events for Codework and Organization completions

### Added
- YouTube Data API v3 integration (search, video details, channel info, trending, captions)
- Codework: web_search tool for AI-powered code generation

---

## v9.0.1 — Hotfix (April 2026)

### Fixed
- **Organization**: White screen crash when executing tasks (React Error #31)
- **Organization**: CEO routing now parses JSON responses correctly
- **Organization**: Agents now have full tool access (email, files, browser)
- **Organization**: Results saved as markdown files, History tab expandable
- **Organization**: Safety Mode warning banner
- **Codework**: Shell command errors no longer abort the session
- **Codework**: Duplicate file write detection (prevents infinite loops)
- **Codework**: Agent reasoning/thinking visible in Activity Log
- **Codework**: Step limit increased to 50 (was 25)
- **Codework**: Session resume loads full history
- **Codework**: Undo works without git (backup-based)
- **Codework**: Safety Mode warning banner
- Shared `safeRender` utility for safe JSX rendering


## v9.0.0 — "For the People" (April 2026)

### Highlights
- **Agent Skills Import**: Native support for the SKILL.md open standard. Import from Claude Code, Codex, Copilot, Cursor. GitHub URL, local folder, or paste. Works across Chat, Codework, Browser, Spotlight, and Lio AI.
- **Skales Codework**: Autonomous coding agent. Select project folder, describe task, pick model, watch live diffs in 3-panel GUI. Session history and follow-up conversations.
- **Organization**: Multi-agent teams with CEO delegation, departments, Company Packs.
- **Computer Use**: Desktop automation via screenshots, clicks, keyboard, scrolling.
- **Calendar Sync**: Google, Apple, Outlook, CalDAV unified in Planner.
- **7 Integrations**: Notion, Todoist, Spotify, Smart Home, Google Drive, GitHub, Google Docs.

### New Features
- DevKit with API Playground, Debug Panel, CLI, 50+ tool reference
- Migration Importer (ChatGPT, Claude, Copilot, Gemini, OpenClaw, Hermes)
- MCP Server Support (Model Context Protocol)
- New default theme "Skales Modern" (navy + emerald, light/dark)
- Messaging Gateway (Slack, Signal actions)
- 9 professional agents with real system prompts
- DeepSeek direct provider
- Browser Workspaces and Playbooks
- Custom model ID input per agent
- Settings dynamic search (35+ sections)
- Swarm VPN fallback with manual peer IP
- OG preview cards in Discover

### Changed
- Default theme from Classic to Skales Modern
- Light mode as default on first launch
- Skills default state: core features ON, experimental OFF
- Browser loop detection relaxed to 5x (was 2x)
- Bubble dismiss timer to 60s
- Badge color from lime to emerald
- Removed "2.0" from Discover branding
- Removed "Beta" from Browser
- 12 languages (added Turkish, Croatian)

### Fixed
- Calendar events async export crash
- Codework tool hallucination (customTools in agentDecide)
- Spotlight white flash on open (layout.tsx backgroundColor)
- Theme flash on restart
- Migration importer IPC channel error (select-file)
- Telegram inline keyboard, toast dedup, key persistence
- Settings search not finding Planner/Calendar
- Advanced Integrations in wrong Settings tab
- Raw translation keys in UI
- write EIO crash in main.js
- Codework/Organization skill check logic
- Swarm sidebar gating and Skills page toggle
- border-dashed replaced throughout

---

## v8.0.2 — Hotfix (April 2026)

### Fixed
- Chat Error 400: reverted apiMessages reconstruction to simple mapping
- Agent "Done" response: removed incorrect tool_calls stripping that caused infinite ReAct loops with Gemini
- IMAP Email: reverted broken host resolution (connects to real server again)
- Custom Skills iframe: buttons, inputs, and saves now functional
- Planner weekdays: now respect app language setting instead of system locale
- Chat message source badges restored (Desktop, Buddy, Telegram, Spotlight)
- Toast notifications: added X button and click-to-close
- AbortController: reverted to stable unmount behavior
- Chat bubble word-break: fixed mid-word splitting ("correc\nt?" → "correct?")
- Think tags (`<think>…</think>`) no longer leak in Lio AI and Skill AI outputs
- TTS "default" provider: added browser voice selector with async voice loading
- Custom OpenAI-compatible provider: status indicator reflects actual URL config
- Skill Generator: defaults to user's active provider instead of hardcoded OpenRouter
- Telegram bot: auto-reconnects on app restart via `ensureTelegramBot()`
- Telegram Safety Mode: approval buttons (Approve/Deny) now use inline keyboard
- Desktop Buddy: sound/notification suppressed when main chat window is focused
- macOS auto-updater: added required ZIP target alongside DMG

### Added
- Notification delete: X button per notification + "Clear All" to dismiss all
- ReAct loop debug logging for provider-specific exit condition diagnostics

---

## v8.0.1 — Hotfix (March 2026)

### Fixed
- Chat crash after multiple messages (null content in history)
