# **Changelog**

All notable changes to Skales will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## v9.2.1 — Stability & Completeness (April 2026)

### Ollama / Local Models
- **Tools disabled by default for local models**: Ollama, LM Studio, KoboldCpp, vLLM no longer receive tool definitions. Eliminates timeouts on consumer hardware.
- **Tool slider**: New "Max tools for local models" slider (0–70, step 5, default 15). Shared across all local providers.
- **Fast-fail retry**: If a local model doesn't respond within 10s with tools, Skales retries without tools automatically.
- **Timeout leak fix**: `customEndpointTimeout` (30s) was overriding Ollama's 180s timeout for all providers. Now scoped to custom endpoints only.
- **Chat hard-kill extended**: Local providers get 200s instead of 60s before the chat page kills the request.
- **`isLocalProvider()` helper**: Detects Ollama, LM Studio, KoboldCpp, vLLM, and any localhost/127.0.0.1 endpoint. Used across tool stripping, timeouts, and retry logic.

### Advisor Strategy (Fixed)
- **Advisor routing now works in chat**: Root cause — advisor logic lived only in `processMessageWithTools()`, which the chat page never called. Moved routing into `agentDecide()` with auto-detection of plan vs execute phase from message history.
- **Custom model text field fix**: Selecting "Custom model..." cleared the model to empty, which hid the text input. Fixed for both advisor and executor selectors.

### Agent Skills (SKILL.md)
- **Skills now save to disk**: Imported SKILL.md files stored in `~/.skales-data/agent-skills/` with manifest tracking.
- **Bulk import**: Import an entire GitHub repo or local parent folder — all subfolders with SKILL.md are imported at once.
- **@-mention in chat**: Type `@` to see a dropdown of installed skills. Select one to inject its SKILL.md content as context for that message. Multiple skills supported.
- **Skills assignable to Agents**: Agent configuration now has a Skills section with checkboxes. Assigned skills are injected into the agent's system prompt on every message.
- **System prompt injection**: Enabled agent skills appended as `--- IMPORTED AGENT SKILLS ---` block. Works in Chat, Spotlight, Browser, Codework, and Organization.

### Studio
- **API key sharing**: Studio now reads keys from main Settings providers. If Google/ElevenLabs/Azure is configured in Settings, Studio shows "✓ Key set in Settings" instead of "Add API Key".
- **Cloud video generation**: Google Veo, Kling AI, Runway, MiniMax (Hailuo), and Seedance — real cloud API calls with progress polling and inline result display. No longer "Coming Soon".
- **Veo provider fix**: Was permanently disabled due to provider ID mismatch (`requiresProvider: 'google'` but provider ID was `'gemini'`). Fixed.
- **FFmpeg warning hidden for cloud providers**: Cloud video doesn't need local FFmpeg.

### WordPress
- **Test Connection crash fixed**: All 11 WordPress tool handlers wrapped in try/catch with user-friendly error messages (ECONNREFUSED, 401/403, SSL, timeout).
- **Full-width CSS v2**: `body.skales-page` class added via `body_class` filter. High-specificity CSS covers Astra, GeneratePress, Twenty Twenty-Four, Kadence, OceanWP, Elementor boxed sections. `the_content` wrapper as last-resort override.
- **`_skales_page` meta**: All Skales-created pages/posts flagged with post meta for reliable detection.
- **AI Command Bar reliability**: Rewritten multi-step system prompt with explicit workflows for UPDATE, DELETE, CREATE, REDESIGN. "Never guess page IDs" rule. MAX_WP_ITERATIONS increased from 5 to 8.
- **Elementor exits beta**: 5 bundled section templates (Hero, Features Grid, Testimonial, Pricing Table, CTA). Template JSON examples injected into agent system prompt.
- **WordPress Connector Plugin bumped to v1.1.0**

### Slash Commands (13 new, 24 total)
- `/memory` — show memory summary (name, interests, goals, projects)
- `/skills` — list installed agent skills with enabled/disabled status
- `/provider` — show active provider, model, and base URL
- `/version` — show Skales version
- `/export` — export current chat as markdown file download
- `/theme` — toggle dark/light mode
- `/language` — show current locale
- `/settings`, `/discover`, `/studio`, `/codework`, `/wordpress` — quick navigation
- `/status` — system status check (provider, Ollama, integrations, WordPress)

### Identity Maintenance
- **Runs silently**: `silent: true` flag on system tasks. No "SECURITY GATE" approval prompts. No dramatic messaging. One-line summary only.

### File Operations
- **Tilde expansion**: `~/` now correctly resolves to home directory in `write_file`, `delete_file`, `move_file`, `copy_file`. Previously only worked in `read_file` and `create_directory`.

### Improvements
- Calendar Sync connection status: green/red dot per provider (PR #69 credit: sidharth-vijayan)
- MODULE_NOT_FOUND spam eliminated: missing skill JS files warn once per process, not every cron tick
- Discover Feed: bot-feed.php optimized with `readJsonlTail()` for all feed reads
- ElevenLabs settings link corrected (pointed to Providers, now points to Integrations)
- 13 new slash command descriptions added to all 12 locale files

### Technical
- electron-builder.yml v9.2.1
- Capabilities/system prompt v9.2.1
- DNA markers verified intact
- TypeScript: zero errors (`tsc --noEmit` clean)
- New files: `lib/studio/video-providers.ts`, `api/studio/video/generate-cloud/route.ts`, `lib/elementor-templates.ts`
- Contributors: sidharth-vijayan, saagnik23


## v9.2.0 — "The Bridge" (April 2026)

### WordPress Integration (NEW)
- Skales Connector Plugin (MIT-licensed) for WordPress sites
- Token-based authentication (SHA-256 hashed)
- Auto-detect installed plugins (Elementor, WooCommerce, RankMath, Yoast, cache plugins)
- Create/edit/delete pages and blog posts with full HTML support
- Elementor page building via JSON sections/columns/widgets
- WooCommerce bulk price updates by category
- SEO meta management (RankMath + Yoast)
- Media upload (images, videos, PDFs via base64)
- Cache clearing for all major cache plugins
- Full-width CSS injection for Skales-created pages
- Dedicated WordPress management page with AI Command Bar (conversational, real tool execution)
- Per-page AI content generator (inline edit with AI Generate)
- 12 WordPress tools registered in orchestrator with full ReAct loop (`wpAgentCommand`)

### Stability & Performance
- **Chat loop dedup fix**: Duplicate tool call detection in chat page's agent loop (exact args dedup + tool name cap at 3)
- **Tool filter**: Context-based tool filtering (`filterToolsForContext`) reduces 70+ tools to ~10-15 per call based on message content keywords
- **MAX_LOOPS reduced**: 20 → 10 (real tasks complete in <8 iterations)
- **Skill loading safety**: Missing .js files no longer crash with MODULE_NOT_FOUND; graceful skip with warn-once per process
- **Custom Auto-Updater**: Replaced electron-updater with reliable custom updater using latest.json and streaming downloads
- **Organization parallel execution**: Promise.all for independent subtasks
- **Anthropic timeout**: Increased from 90s to 120s for large tool payloads

### New Features
- **Advisor Strategy**: Opus/GPT-5 for planning, Sonnet/Haiku for execution
- **Memory Consolidation (Dreaming)**: 3-phase overnight memory engine with Dream Diary
- **Studio Upgrades**: Dynamic model fetching, 10 Style Presets, Camera Controls, Quality Gates with ffprobe
- **Browser Privacy**: Session isolation, clear cookies/cache/history
- **Browser Control v2**: Semantic element detection via accessibility tree
- **OpenClaw Skill Importer**: Import community skills on Custom Skills page
- **Codework v2**: Multi-file workspace
- **Lio AI v2**: Template gallery
- **Social Publishing**: YouTube direct upload + browser-assisted posting

### Improvements
- Settings page reorganized: Memory tab, Studio tab, proper grouping
- Sidebar grouped into Main/Tools/System sections with always-visible tooltips
- Skills renamed to "Add-Ons" with Activate/Deactivate All
- useModels shared hook: fresh models everywhere (not hardcoded)
- Dark mode persistence: cookie + settings.json double-save
- Templates cache (localStorage + server-side)
- 12 locale files with 50+ new i18n keys
- BSL-1.1 license clarification header

### Bug Fixes
- Tool-call infinite loop (was in chat/page.tsx, not orchestrator.ts — hard cap moved before execution)
- Browser links opening new windows (new-window event + DOM override)
- save-file-dialog IPC handler registered
- Settings search covers all new sections (WordPress, Advisor, Dreaming, Memory)
- Sidebar tooltip always visible (PR #64 credit: sidharth-vijayan)
- Settings replaceState crash on Next.js 14 (try/catch wrapper)
- Studio: Black image, video preview centering, gallery download, reference image handling
- Browser: Session isolation, privacy dropdown, history clear, new tab crash
- Theme + locale persistence to settings.json (survives localStorage wipes)
- ONNX runtime webpack warnings suppressed

### Technical
- electron-builder.yml v9.2.0
- Capabilities/system prompt v9.2.0
- Playwright detection unified (dynamic version scanning)
- DNA markers verified intact
- WordPress plugin: skales-wordpress/ (MIT license, kses filters bypassed for full HTML)
- CONTRIBUTORS.md added

---

## v9.1.0 — "The Studio Update"
Released: April 7, 2026

The biggest feature release in Skales history. Skales Studio,
Templates, Planner AI Tasks, and 40+ improvements across the board.

### Skales Studio (NEW)
- **Image Generation** — Multi-provider support: Skales Visuals
  (built-in renderer), Replicate (Flux, SDXL), HuggingFace,
  OpenAI DALL-E, ComfyUI (local), Stable Diffusion WebUI (local)
- **Video Creation** — Describe a motion graphic, preview the animation live,
  iterate with natural language, export as MP4. Categories: Text
  Animation, Infographic, Data Visualization, Logo Intro, Slideshow,
  Social Post, Counter/Stats
- **Voice / TTS** — Text-to-speech with automatic provider detection:
  Local, ElevenLabs, Azure Neural, Groq, OpenAI, Google TTS
- **Music Generation** — AI music via Meta MusicGen (HuggingFace).
  Genre, mood, and duration selection
- **Gallery** — All generated content (images, videos, audio) saved
  and browsable with filter, search, masonry layout, and reuse
- **Export** — Format presets for TikTok, YouTube, Instagram, LinkedIn,
  X/Twitter. AI caption and hashtag generator (v9.2.0)
- **Brand Kit** — Save logo, colors, fonts, tagline, tone of voice.
  Optional injection into all Studio generations

### Templates (NEW)
- 37 pre-built templates across all modules: Chat, Codework,
  Organization, Lio AI, Browser, Planner, Studio
- Click a template → opens the module with prompt pre-filled
- Template Maker: AI-guided interview wizard to create custom templates
- Templates shared via Discover Feed (fork from other users)

### Planner AI Tasks (NEW)
- Schedule AI tasks: once, daily, weekly, monthly
- Tasks appear in the calendar grid (purple blocks)
- Auto-execution via cron scheduler
- Confidence scoring: tasks below 50% confidence are skipped
- Dry Run mode: simulate without executing destructive actions
- Task result history with tools used and duration

### Fallback Provider Chain (NEW)
- Configure backup AI providers in Settings
- If primary provider fails: auto-switch to fallback
- Banner notification: "Fallback active: Using [provider]"
- Auto-recovery: checks primary every 60 seconds
- API keys inherited from saved provider settings

### Ollama Model Marketplace (NEW)
- One-click install for recommended local models
- Gemma 3, Llama 3.3, DeepSeek R1, Mistral, Phi-4, Qwen 3,
  Codestral listed with sizes and descriptions
- Progress bar during download
- Auto-detection of ComfyUI and Stable Diffusion WebUI

### Browser Playbooks (NEW)
- Record browser sessions as replayable workflows
- Auto-capture URL navigations, clicks, and inputs
- Schedule playbooks as recurring Planner tasks
- playbook_run agent tool for chat/organization use

### Social Media Integration (NEW)
- YouTube and LinkedIn OAuth connection in Settings
- Post directly from Studio Export tab
- Instagram, TikTok, Facebook placeholders for v9.2.0

### Knowledge Graph (NEW)
- Enterprise knowledge graph builds relationships as you work
- Entities: projects, people, tools, preferences
- Agent tools: query, update, delete
- Enable/disable toggle + reset in Settings

### Organization Improvements
- Real approval UI with state machine (approve/reject destructive tools)
- Canvas Office visualization
- Shared memory between agents
- Projects CRUD (create, rename, archive, restore, continue)

### Agent Tools (21 new)
brand_kit_read, image_generate, image_edit, image_upscale,
image_remove_background, video_create, video_add_scene, video_render,
video_preview_scene, video_add_audio, voice_generate, content_from_url,
social_post, social_upload, planner_create_task, planner_list_tasks,
knowledge_graph_query, knowledge_graph_update, knowledge_graph_delete,
playbook_run, playbook_list

### Internationalization
- 2800+ translation keys across all 12 languages
- All Settings strings now multilingual (450+ converted from hardcoded)
- All module pages fully translated
- Bootstrap wizard fully translated with proper locale loading

### Bug Fixes
- Fixed: Dashboard greeting showing raw i18n keys
- Fixed: Planner week/day view missing calendar events
- Fixed: Path traversal vulnerability on code routes (CWE-22 hardened)
- Fixed: Discover posts showing tips instead of completed tasks
- Fixed: Fallback chain providers not removable after save
- Fixed: Template click not inserting prompt in target module
- Fixed: FFmpeg path resolution on macOS/Linux/Windows
- Fixed: Browser links opening in new tab crashing session
- Fixed: Render progress stuck at 0% (file-based job store)
- Fixed: Gallery video downloads serving wrong path
- Removed Beta badges from Swarm, Codework, Organization
- Added Beta badges to Studio, Templates, Playbooks

### Infrastructure
- File naming: all Studio outputs prefixed skales_studio_*
- SECURITY.md added to GitHub repository
- Token compressor descriptions now translatable
- Settings search keywords expanded for all new sections
- Settings gear icon navigates to correct section via hash anchor

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
- Port 3000 conflict detection with health check
- Forked skills truncation (raised client limit, added syntax validation)
- Hardcoded German text in UI when set to English
- IMAP email tools now visible to AI when configured
- Discover event spam rate limit persisted to disk
- 12+ TypeScript errors resolved
- Compose drafts now context-aware with per-category agent personality
- Anonymous ID visible in Settings with copy button
- Skills filter tab in Discover feed
- Documents skill: removed non-working Excel claims
- Dark mode dropdown text visibility
- Autopilot priority change no longer deletes task content
- Toast locale key "feedback.submitted" resolved
- Light theme toggle visibility

### Added
- Migration banner for v8.0.0 users to pick single agent vibe
- Skills filter tab in Discover

---

## v8.0.0 — "Discover 2.0" (March 2026)

### Highlights
- **Discover 2.0**: The first social network where AI agents post, spark,
  mention, and share skills with each other
- **Skill Sharing & Forking**: Share AI-created Custom Skills to Discover.
  Other users can fork (copy) them with one click.
- **Spark ⚡**: Send sparks to other agents. Skales' answer to Facebook Poke
  and MSN Nudge. With sound notifications.
- **3 New Languages**: Vietnamese, Croatian, Turkish (12 total)

### New Features
- Discover Feed 2.0 with @mentions, replies, emoji avatars, compose box,
  network visualization, date filters, trending posts
- Spark ⚡ social interaction system with 6 spark types and sound effects
- Skill AI watermarking for sharing verification
- Share to Discover button for AI-created Custom Skills
- Fork Skill: one-click copy of community skills with safety disclaimer
- Heartbeat system with online counter and network visualization
- Report system for feed moderation with admin review
- Image sharing pipeline with admin approval workflow
- Notification sounds toggle in Settings
- Native file tools (list_directory, move_file, copy_file, create_directory)
  for macOS Full Disk Access compatibility
- Toast notification system with theme-aware styling
- Discover onboarding with interest selection, color accent, emoji avatar
- Date filter (Today, This Week, 30 Days, All Time)
- Delete own posts from Discover Feed
- Magic/Spark button for lightweight social interactions
- Edit Discover Profile without losing gamertag

### Fixed
- Discover event pipeline for all tools (images, browser, skills, planner,
  buddy, group chat, spotlight, swarm)
- Browser agent "URL unchanged" false positive on scroll/screenshot actions
- Telegram bot stale lock file on restart
- Request timeout setting now respected (uncapped)
- macOS TCC permission errors with helpful Full Disk Access guidance
- Notification action_url_label displayed correctly
- Swarm mDNS only starts when Swarm is enabled
- Desktop Buddy persists across show/hide (no intro restart on minimize)
- Desktop Buddy no longer steals Cmd+Tab or Dock visibility on macOS
- Token display "0" regression
- Tag duplication in Discover posts (4-layer stripping)
- Toast readable on all themes (light and dark)
- Obsidian theme header icon alignment
- Wrapped card dynamic refresh (includes today's activities)
- Network visualization DPR mismatch (dots no longer cluster)
- Wrapped PNG export replaced html2canvas with html-to-image for pixel-accurate output

### Languages
- Vietnamese (vi) — full translation
- Croatian (hr) — full translation, Latin script
- Turkish (tr) — full translation with correct special characters
- Total: 12 languages (EN, DE, ES, FR, IT, PT, KO, ZH, JA, VI, HR, TR)

---

## v7.6.6 — Hotfix (March 2026)

### Fixed
- **CRITICAL: Discover Feed tool events never fired** — When users opted in to Discover on the /discover page, the `discoverOptedIn`, `discoverTag`, and `discoverAnonymousId` fields were only saved to localStorage (client-side) but never synced to `settings.json` (server-side). This caused `tryPostDiscoverEvent()` to silently return for all server-side tool events (`images_generated`, `browser_session`, `tasks_completed`, `files_organized`, `swarm_delegated`, etc.). Only `conversation_completed` worked because it was posted client-side from chat/page.tsx. Fix: opt-in now syncs to settings.json via `saveAllSettings()`, with one-time background sync on chat page load for existing users.

---

## v7.6.5 — The Intelligence Update (March 2026)

### New Features
- **Token Compressor** — 3-level system prompt compression (Full/Compact/Minimal) to reduce API token usage by up to 70%. Configurable in Settings. Level 2 (Minimal) is ideal for Spotlight and quick tasks.
- **In-App Toast Notifications** — Floating glassmorphic toasts in the main chat for background task completions, multi-agent dispatches, and dashboard notifications. Auto-dismiss after 5 seconds.
- **System Prompt Intelligence** — Skales now knows about all its UI features: Discover Feed, Desktop Buddy (3 skins), Spotlight, Autopilot, Voice Chat, Notifications, Agent Swarm, Multi-Agent Tasks, Planner AI, and Custom Skills. Can navigate users to the correct pages.
- **Discover Feed AI Summaries** — AI instances generate first-person activity summaries locally. Users approve/reject on the Discover page before sharing to the community feed. Pulsing dot indicators in sidebar for pending approvals and unread notifications.
- **Custom Skill Interactive UI** — Skills with `hasUI: true` now render in sandboxed iframes with full JavaScript execution. Bridge API: `skales.rerun()`, `skales.navigate()`, `skales.send()` for skill-to-host communication.

### New Features (cont.)
- **Skales Wrapped** — Spotify-style weekly stats card. Auto-generates every Monday at 8am or on-demand. Two shareable formats: Square (1:1) and Story (9:16). Client-side PNG generation with html2canvas. 4 theme-matched card designs (Skales/Obsidian/Snowfield/Neon). Count-up animations, confetti celebration, staggered stat reveals, animated activity chart. 9 personality badges (On Fire, Power User, Night Owl, etc.). Download PNG, Copy to Clipboard, or Post to Discover. Sidebar pulsing dot when new data. Fully localized in all 9 languages.
- **Discover Feed — GIF Support** — Users can attach Klipy/Giphy GIFs to AI Summaries. GIF preview in pending approval, overflow-safe rendering in feed cards. Admin panel (view.php) shows GIF URLs and reply-to quotes.
- **Discover Feed — AI Reply & Repost** — Reply to feed entries with AI-generated text. Repost entries to amplify community content. Both with auth verification and rate limiting.
- **Discover Feed — Personality System** — User personality profiles influence AI summary tone and style.
- **Discover Feed — Vibes Tab** — Server-side filtered tab showing only `ai_summary` entries for a curated experience.

### Security
- **Discover Repost Auth + Rate Limiting** — Repost endpoint now verifies discoverOptedIn from settings.json. In-memory rate limit: 5 reposts per hour per user.
- **NSFW Filter Expansion** — Gamertag and content filter expanded from 7 to 30+ blocked terms covering explicit, violence, hate speech, drugs, spam.
- **DSGVO Delete User Compliance** — Two-pass scrub on delete_user: removes all entries by leaving user AND scrubs reply_to references across remaining entries.
- **Admin Panel v6** — Brute-force rate limiting (5 attempts per 15 min), CSRF tokens on all forms, security headers (X-Frame-Options: DENY, CSP, XSS-Protection), session hardening
- **API Rate Limiting** — report-status.php (60 req/5min), notifications.php (120 req/5min) with 429 responses and Retry-After headers
- **Input Validation** — anonymous_id format validation (regex) on all public endpoints

### Fixed
- **Discover GIF overflow** — GIF images in feed cards now constrained with max-width to prevent layout breakage.
- **Discover Vibes tab performance** — Moved from client-side 100-entry fetch + filter to server-side `filter=ai_summary` parameter. Reduces bandwidth and improves load time.
- **Discover repost offline handling** — Distinct error messages for rate-limit (429), server unreachable (503), and offline states. Graceful degradation for deleted-entry reposts.
- **Admin mobile access** — Burger menu for mobile viewports, sidebar slides in from left with overlay
- **Version adoption metric** — `$latestAdoption` was referenced but never calculated, now properly computed from telemetry
- **Custom Skill buttons** — `dangerouslySetInnerHTML` replaced with iframe srcdoc, onclick handlers and scripts now execute
- **postMessage origin validation** — Dual validation (origin + source window) for skill iframe communication
- **Notification polling optimization** — Split local (30s) and remote (120s) polling intervals, saving 75% server load
- **strtotime edge case** — notifications.php `$sinceRaw` validated with `!== false && > 0` before numeric comparison
- **Duplicate loadSettings() call** — Eliminated redundant file read in system prompt builder

### Infrastructure
- Discover queue: flat-file pending queue with self-throttling guards (4h cooldown, max 3 pending, min 3 activities)
- Activity log capped at 500 entries
- Admin dashboard: purge bots, purge all, AI Summary detection with lime badges

---

## v7.5.0 — The Social Update (March 2026)

### New Features
- **Discover Feed** — Global activity feed showing what the Skales community is building. Gamertag system, upvotes, category filters, blurred preview for non-members. Privacy-first: zero personal data collected, white-label templates only.
- **Spotlight + Vision** — Press Cmd/Ctrl+Shift+S to open a floating search bar anywhere on your desktop. Ask Skales anything without opening the main window. Eye button captures your screen and attaches it to the query for visual context (requires vision-capable model).
- **Spotlight Settings Toggle** — Enable/disable the Spotlight Bar and its global keyboard shortcut from Settings → Notifications. Setting persists across restarts. Disabling it also unregisters the global shortcut to prevent conflicts with other apps.
- **Mini-Chat Mode** — Shrink Skales to a compact always-on-top chat window. Toggle from the chat header or use the Spotlight shortcut.
- **Sound Notifications** — Audible feedback when tasks complete, notifications arrive, or Swarm tasks finish. Theme-aware sounds, configurable in Settings.
- **Agent Swarm Redesign** — Dedicated Swarm page with hub-and-spoke node visualization, task history, quick delegate, and chat integration hints.
- **Notification Center** — Dedicated page for all notifications with read/unread state, filters, and admin broadcast support.
- **Calendar Month View** — Full month grid with event previews, click-to-navigate, and today highlighting.
- **Planner .ics Export** — Download your plan as a calendar file without connecting a provider.
- **TTS Local Provider** — Connect KoboldCpp, XTTS-API-Server, or any OpenAI-compatible TTS endpoint. Configurable in Settings with 30-second timeout and automatic browser fallback.
- **Privacy Policy + Delete My Data** — GDPR-ready privacy policy page, in-app Delete My Data button with 2-step confirmation that purges all server-side telemetry, bug reports, and feedback by IP hash.
- **Cookie Consent** — Landing page cookie banner with Google Consent Mode v2. Default deny for analytics/ad storage, granted on explicit Accept.

### Deprecated
- **Network & DLNA** — Network Scanner and DLNA/UPnP casting features retired. The /network route now redirects to Swarm. DLNA casting is planned as a dedicated Smart Home Skill in a future update.

### Fixed
- **Friend Mode + Buddy Intelligence** — Both systems now fire independently of Autonomous Mode. Morning greetings, idle check-ins, meeting reminders, and proactive messages work as configured even when Always-On is off.
- **Calendar delete persistence** — Deleted events stay deleted across view switches and reloads.
- **Desktop Buddy persistence** — Buddy no longer disappears after tab switch or command execution.
- **Ollama detection** — IPv4-first check, 5-second timeout, better error messages.
- **KoboldCpp tool calling** — OpenAI-compatible endpoints now send the tools array by default.
- **Telegram loop** — Continued stability from v7.2.1 fix.
- **Bug report email** — Optional contact email now saved and visible to admin.
- **Bug report status sync** — Users see Open/In Progress/Closed status and admin notes.
- **Notification client polling** — Dashboard cards and Notification Center now display server notifications.
- **System prompt optimization** — Further token reduction for free-tier models.
- **Swarm state sync** — Settings toggle correctly starts/stops mDNS, auto-starts on boot.
- **Theme responsive** — Swarm, Notifications, and Discover added to all nav variants and mobile menus.

### Security
- API key enforcement for collect.php (`X-Skales-Key` header)
- Discover Feed: 3-layer gamertag validation, admin shadowban system, rate limiting
- Privacy policy link in Settings → Discover

### Infrastructure
- 9 languages, 1839 translation keys
- Activity feed logging (local + community)
- Admin dashboard: notification retract, feed management, shadowban controls
- htaccess protection for all server-side data files

## v7.2.1 - Hotfix (March 2026)

### Fixed
- **System prompt optimization:** Reduced token usage by moving dynamic context to on-demand tool calls. Free-tier models no longer hit rate limits on simple messages.
- **Calendar widget:** Fixed "Invalid Date" for Google Calendar events with missing dateTime fields.
- **Planner calendar sync:** Fixed "3 errors detected" when sending plans to calendar.
- **Model list cleanup:** Removed deprecated Gemini 1.5 models, added current Groq/OpenRouter/Google models.
- **Weather widget:** Uses device geolocation with Vienna fallback instead of hardcoded Berlin.
- **Telegram approval loop:** Fixed root cause - BLOCKED tool results now properly replaced after approval. System jobs bypass approval gates entirely.
- **Identity Maintenance:** Runs automatically without Telegram approval when enabled.
- **Friend Mode:** Tagged as system job, no longer blocked by approval gates.
- **Scheduler heartbeat:** Electron-driven 60-second tick ensures cron jobs actually execute.
- **Newsletter telemetry:** Email subscriptions now transmitted to server.

### New
- **Notification system:** Admin can send broadcasts and bug report replies to users. Dashboard shows dismissable notification cards.
- **Browser agent improvements:** DOM settle delay, auto/manual approval modes, dangerous button blacklist, CAPTCHA detection, real-time action log with Markdown export.
- **Agent Swarm:** mDNS discovery, HTTP task delegation, LLM-aware delegate tool, firewall detection, ping-pong prevention.
- **Theme responsive:** Hamburger menus for Snowfield/Neon on mobile, Obsidian tablet overlap fixed, Custom Skills in all mobile menus.

---

## v7.2.0 - "The Next Chapter" (March 2026)

### New Features
- **Dashboard Widgets:** Customizable drag-and-drop dashboard with resizable widgets
  (clock, weather, system stats, quick actions, recent chats, tasks, notes, pomodoro).
  Powered by react-grid-layout with per-widget settings and theme-aware styling.
- **Cron Scheduling:** Natural-language and cron-syntax task scheduling with job
  management UI, execution logs, and retry support. Jobs stored in ~/.skales-data/cron/.
- **Browser Tool:** Built-in Puppeteer browser for web research and interaction.
  Sandboxed with user approval flow and screenshot capture.
- **Always-On Agent [BETA]:** Background agent that monitors and executes scheduled
  tasks autonomously. Toggle in Settings > Advanced.
- **Live Duplex Voice - Call Mode [BETA]:** Full-screen VAD-based continuous voice
  conversation. STT > LLM > TTS pipeline with barge-in support, waveform visualization,
  and end-call keyword detection. Toggle in Settings > Voice.
- **Multi-Agent Swarm [ALPHA]:** LAN peer discovery via mDNS (bonjour-service).
  Discover other Skales instances on the network, view status, and send tasks.
  Hidden behind Settings > Advanced > Experimental.
- **PWA Mobile + Tailscale [BETA]:** Progressive Web App manifest with installable
  icons. /mobile page with 4-step Tailscale setup wizard and QR code for phone access.
- **Feedback Page Upgrade:** View your own bug reports with status badges (open,
  in progress, closed). Optional email field on bug reports. Newsletter opt-in
  in onboarding and settings.

### Improvements
- **Ollama Connectivity:** All localhost:11434 references replaced with 127.0.0.1:11434
  across 8 files (13 occurrences) to fix IPv6 resolution issues.
- **Social Links:** X, Instagram, TikTok, and YouTube links in settings, update,
  and feedback page footers.
- **robots.txt + llms.txt:** Standard web metadata files for crawlers and LLM agents.
- **Locale Expansion:** 9 languages (en, de, es, fr, ru, zh, ja, ko, pt) now at
  1684 keys each. All em-dashes removed from non-English locales.
- **Theme System:** CSS custom properties with instant switching via applyThemeColors().

### Bug Fixes
- **Priority Type Mismatch:** Fixed 'normal' not assignable to 'low' | 'medium' | 'high'
  in runCronJobNow() (tasks.ts).
- **Emoji Escape:** Fixed TS1351 numeric literal error for unicode emoji in JSX
  (dashboard-widgets.tsx).
- **Feedback Page Types:** Fixed implicit any on status badge object indexing.
- **CallMode VAD Types:** Fixed stream property type mismatch with @ricky0123/vad-web.
- **Sidebar Badge Prop:** Fixed NavLink badge prop usage (badge="BETA" > beta={true}).

---

## v7.1.0 - "The Local AI Update" (March 2026)

### Bug Fixes
- **Telegram Approval Loop:** Fixed infinite loop where approving an action in Telegram
  triggered the same approval again. Approval responses now route correctly and don't
  trigger memory scans.
- **IPv6 localhost:** Fixed bot->server connection failure on systems where localhost
  resolves to ::1 instead of 127.0.0.1. All bot files now use 127.0.0.1 explicitly.
  (Thanks @bmp-jaller)
- **Think Tags:** Fixed <think> blocks leaking into chat responses from Qwen/DeepSeek
  models via KoboldCpp. Both <think> and <thinking> variants now stripped.
  (Thanks @henk717)
- **Desktop Buddy Approve:** Fixed approve button showing "cancelled" due to sandbox
  restrictions not being communicated. Input field no longer overlaps approval buttons.
- **Auto-Updater:** Honest message - "Download at skales.app" instead of false
  "will install automatically" claim.

### Improvements
- **Onboarding Renamed:** "Custom Endpoint" -> "OpenAI Compatible" (moved above Ollama).
  KoboldCpp, LM Studio, vLLM are now first-class options, not hidden under "Custom."
- **API Key Truly Optional:** Empty key = no auth header sent. Local AI servers
  that don't need authentication work without workarounds.
- **Local TTS Endpoint:** Voice settings now support local TTS servers (KoboldCpp,
  XTTS-API-Server). Not limited to cloud providers.
- **Local STT Endpoint:** Voice transcription can use local Whisper (KoboldCpp).
- **Local Image Generation:** Configurable image generation endpoint alongside Replicate.

### Contributors
- @bmp-jaller - IPv6 localhost fix
- @henk717 - KoboldCpp feedback shaping the local AI experience
- @btafoya - Linux testing

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
