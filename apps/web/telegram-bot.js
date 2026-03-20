#!/usr/bin/env node
// ============================================================
// Skales Telegram Bot — Full Agent Gateway
// ============================================================
// Flow:
//   1. User types /pair <CODE> in Telegram to connect
//   2. Only paired users can send messages
//   3. Messages from Telegram → /api/chat/telegram (Full Agent Brain)
//   4. AI response (with tools!) → sent back via Telegram
//   5. Dashboard chat shows ALL messages (browser + telegram)
//   6. Scheduler fires cron jobs → sends Telegram reminders directly
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const http = require('http');
// const { t } = require('./telegram-i18n'); // Replaced with hardcoded strings in v6.0.1

const DATA_DIR = process.env.SKALES_DATA_DIR || path.join(os.homedir(), '.skales-data');

// Dynamic API base URL — reads the port Electron/Next.js is actually bound to.
// SKALES_PORT is injected by telegram.ts when spawning this process.
// Fallback to 3000 for backwards compatibility and standalone invocations.
const API_BASE = `http://127.0.0.1:${process.env.SKALES_PORT || 3000}`;

const TELEGRAM_FILE = path.join(DATA_DIR, 'integrations', 'telegram.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const INBOX_FILE = path.join(DATA_DIR, 'integrations', 'telegram-inbox.json');
const CRON_DIR = path.join(DATA_DIR, 'cron');
const LOG_FILE = path.join(DATA_DIR, 'telegram-bot-error.log');
const WHATSAPP_BOT_PORT = 3009;

// ─── Process Lock (prevents multiple parallel instances) ────
// If telegram-bot.js is started multiple times (e.g. multiple start-dashboard.bat calls),
// the lock ensures only ONE instance runs — all others exit immediately.
const LOCK_FILE = path.join(DATA_DIR, '.telegram-bot.lock');

(function acquireLock() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            const existingPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
            if (!isNaN(existingPid) && existingPid !== process.pid) {
                try {
                    process.kill(existingPid, 0); // Throws if process doesn't exist
                    console.error(`[Lock] Telegram Bot already running (PID ${existingPid}). This instance (PID ${process.pid}) will exit.`);
                    process.exit(0);
                } catch {
                    // Old process no longer exists → overwrite stale lock
                    console.log(`[Lock] Stale lock (PID ${existingPid} no longer active). Taking over...`);
                }
            }
        }
        fs.writeFileSync(LOCK_FILE, process.pid.toString());
        const releaseLock = () => { try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch { } };
        process.on('exit', releaseLock);
        process.on('SIGTERM', () => { releaseLock(); process.exit(0); });
        process.on('SIGINT', () => { releaseLock(); process.exit(0); });
    } catch {
        // Lock errors are not critical — continue starting
    }
})();

// ─── Friend Mode cooldown state ───────────────────────────────
// Keeps track of when the last proactive message was sent.
// Persisted to a small file so restarts don't reset the cooldown.
const FRIEND_STATE_FILE = path.join(DATA_DIR, 'integrations', 'friend-mode-state.json');

function loadFriendState() {
    try {
        if (fs.existsSync(FRIEND_STATE_FILE)) {
            return JSON.parse(fs.readFileSync(FRIEND_STATE_FILE, 'utf-8'));
        }
    } catch { }
    return { lastSentAt: 0 };
}

function saveFriendState(state) {
    try {
        const dir = path.dirname(FRIEND_STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(FRIEND_STATE_FILE, JSON.stringify(state, null, 2));
    } catch { }
}

// ─── Logging ─────────────────────────────────────────────────

function log(msg) {
    const time = new Date().toLocaleTimeString('en-US');
    console.log(`[${time}] ${msg}`);
}

function logError(msg, err) {
    const line = `[${new Date().toISOString()}] ${msg}${err ? ': ' + (err.stack || err.message || err) : ''}\n`;
    console.error(line.trim());
    try { fs.appendFileSync(LOG_FILE, line); } catch { }
}

// ─── Config ──────────────────────────────────────────────────

function loadTelegramConfig() {
    try {
        if (!fs.existsSync(TELEGRAM_FILE)) return null;
        return JSON.parse(fs.readFileSync(TELEGRAM_FILE, 'utf-8'));
    } catch { return null; }
}

function saveTelegramConfig(config) {
    try {
        const dir = path.dirname(TELEGRAM_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TELEGRAM_FILE, JSON.stringify(config, null, 2));
    } catch (e) { logError('Failed to save config', e); }
}

function loadSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return null;
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch { return null; }
}

// ─── Inbox (Bridge to Dashboard) ─────────────────────────────

function loadInbox() {
    try {
        if (!fs.existsSync(INBOX_FILE)) return [];
        return JSON.parse(fs.readFileSync(INBOX_FILE, 'utf-8'));
    } catch { return []; }
}

function appendToInbox(message) {
    try {
        const dir = path.dirname(INBOX_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const inbox = loadInbox();
        inbox.push(message);
        const trimmed = inbox.slice(-200);
        fs.writeFileSync(INBOX_FILE, JSON.stringify(trimmed, null, 2));
    } catch (e) { logError('Failed to save to inbox', e); }
}

// ─── Telegram API ────────────────────────────────────────────

async function telegramRequest(token, method, body = null) {
    const url = `https://api.telegram.org/bot${token}/${method}`;
    const options = { method: body ? 'POST' : 'GET' };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    return res.json();
}

/**
 * Clean text for safe Telegram delivery.
 * Removes markdown formatting that Telegram's parser can't handle,
 * collapses excessive whitespace, and trims to a safe length.
 */
function cleanForTelegram(text) {
    if (!text) return '';
    return text
        // Remove code blocks (``` ... ```)
        .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim())
        // Remove inline code backticks
        .replace(/`([^`]+)`/g, '$1')
        // Remove bold/italic markers
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        // Remove strikethrough
        .replace(/~~(.+?)~~/g, '$1')
        // Remove markdown links, keep text: [text](url) → text (url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
        // Remove heading markers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove horizontal rules
        .replace(/^[-*_]{3,}\s*$/gm, '')
        // Collapse multiple blank lines into one
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function sendMessage(token, chatId, text) {
    if (!text || !text.trim()) return;
    const cleaned = cleanForTelegram(text);
    if (!cleaned) return;

    // Split long messages
    if (cleaned.length > 4000) {
        const chunks = [];
        for (let i = 0; i < cleaned.length; i += 4000) {
            chunks.push(cleaned.slice(i, i + 4000));
        }
        for (const chunk of chunks) {
            await telegramRequest(token, 'sendMessage', {
                chat_id: chatId, text: chunk,
            }).catch(() => {});
        }
        return;
    }
    await telegramRequest(token, 'sendMessage', {
        chat_id: chatId, text: cleaned,
    }).catch(() => {});
}

async function sendTyping(token, chatId) {
    await telegramRequest(token, 'sendChatAction', {
        chat_id: chatId, action: 'typing',
    }).catch(() => { });
}

/**
 * Send a local image file as a Telegram photo.
 * Uses native Node 20 FormData + Blob (no extra dependencies).
 */
async function sendPhoto(token, chatId, filePath, caption) {
    try {
        const buffer = fs.readFileSync(filePath);
        const filename = path.basename(filePath);
        const ext = (filename.split('.').pop() || 'png').toLowerCase();
        const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
        const mime = mimeMap[ext] || 'image/png';

        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('photo', new Blob([buffer], { type: mime }), filename);
        if (caption) formData.append('caption', String(caption).slice(0, 1024));

        const url = `https://api.telegram.org/bot${token}/sendPhoto`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const result = await res.json();
        if (!result.ok) log(`⚠️ sendPhoto failed: ${result.description}`);
        return result;
    } catch (e) {
        log(`⚠️ sendPhoto error: ${e.message}`);
        return null;
    }
}

/**
 * Send a local video/gif file via Telegram.
 */
async function sendMediaFile(token, chatId, filePath, caption) {
    try {
        const buffer = fs.readFileSync(filePath);
        const filename = path.basename(filePath);
        const ext = (filename.split('.').pop() || 'mp4').toLowerCase();
        const isGif = ext === 'gif';
        const mime = isGif ? 'image/gif' : 'video/mp4';
        const method = isGif ? 'sendAnimation' : 'sendVideo';
        const fieldName = isGif ? 'animation' : 'video';

        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append(fieldName, new Blob([buffer], { type: mime }), filename);
        if (caption) formData.append('caption', String(caption).slice(0, 1024));

        const url = `https://api.telegram.org/bot${token}/${method}`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const result = await res.json();
        if (!result.ok) log(`⚠️ ${method} failed: ${result.description}`);
        return result;
    } catch (e) {
        log(`⚠️ sendMediaFile error: ${e.message}`);
        return null;
    }
}

async function sendAnimation(token, chatId, gifUrl, caption) {
    const body = { chat_id: chatId, animation: gifUrl };
    if (caption) body.caption = caption;
    await telegramRequest(token, 'sendAnimation', body).catch(() => { });
}

// ─── Admin UI Helpers ─────────────────────────────────────────

/** Send a message with inline keyboard buttons. */
async function sendMessageWithKeyboard(token, chatId, text, keyboard) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    // NOTE: parse_mode is intentionally omitted here.
    // Telegram's Markdown parser silently drops the entire reply_markup
    // (inline keyboard) when the message text contains emojis or special
    // characters — which approval messages always do. Sending as plain text
    // guarantees the inline keyboard is always delivered.
    //
    // Strip markdown special chars from text to prevent Telegram API from
    // silently dropping the inline keyboard (BUG 4 fix).
    const safeText = text.replace(/[*_`\[\]()~>#+\-=|{}.!]/g, '');
    const payload = {
        chat_id: chatId,
        text: safeText,
        reply_markup: { inline_keyboard: keyboard },
    };
    try {
        let res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            // Retry once on transient HTTP errors
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
        return await res.json();
    } catch (e) {
        logError('sendMessageWithKeyboard failed', e);
        return null;
    }
}

/** Answer a callback query to clear the spinner on the pressed button. */
async function answerCbQuery(token, callbackQueryId, text) {
    const body = { callback_query_id: callbackQueryId };
    if (text) { body.text = text; body.show_alert = false; }
    await telegramRequest(token, 'answerCallbackQuery', body).catch(() => { });
}

/** Send a local file as a Telegram document (e.g. backup ZIP). */
async function sendDocumentFile(token, chatId, filePath, caption) {
    try {
        if (!fs.existsSync(filePath)) {
            await sendMessage(token, chatId, '❌ Export file not found. Generate a backup first in Settings → Export/Import.');
            return;
        }
        const buffer = fs.readFileSync(filePath);
        const filename = path.basename(filePath);
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('document', new Blob([buffer], { type: 'application/zip' }), filename);
        if (caption) formData.append('caption', String(caption).slice(0, 1024));
        const url = `https://api.telegram.org/bot${token}/sendDocument`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const result = await res.json();
        if (!result.ok) log(`⚠️ sendDocument failed: ${result.description}`);
    } catch (e) {
        logError('sendDocumentFile failed', e);
    }
}

// ─── Settings/Skills File Helpers ─────────────────────────────

function loadSkillsState() {
    try {
        const skillsFile = path.join(DATA_DIR, 'skills.json');
        if (fs.existsSync(skillsFile)) {
            return JSON.parse(fs.readFileSync(skillsFile, 'utf-8'));
        }
    } catch { }
    return {
        skills: {
            image_generation: { id: 'image_generation', enabled: false },
            video_generation: { id: 'video_generation', enabled: false },
            summarize: { id: 'summarize', enabled: false },
            weather: { id: 'weather', enabled: true },
            googleCalendar: { id: 'googleCalendar', enabled: false },
        },
    };
}

function saveSkillEnabled(skillId, enabled) {
    try {
        const skillsFile = path.join(DATA_DIR, 'skills.json');
        const state = loadSkillsState();
        if (!state.skills[skillId]) state.skills[skillId] = { id: skillId };
        if (skillId !== 'weather') {
            state.skills[skillId].enabled = enabled;
            if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(skillsFile, JSON.stringify(state, null, 2));
            return true;
        }
    } catch (e) { logError('saveSkillEnabled failed', e); }
    return false;
}

// ─── Tasks helper ─────────────────────────────────────────────
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function loadTasks() {
    try {
        if (fs.existsSync(TASKS_FILE)) return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
    } catch { }
    return [];
}

/** Human-friendly label for a task state. */
function taskStateIcon(state) {
    return { pending: '⏳', in_progress: '⚙️', completed: '✅', blocked: '🚫', failed: '❌', cancelled: '🚫' }[state] || '❓';
}

// ─── Pending Approval helpers (text-based approval for Telegram) ──
const PENDING_APPROVALS_FILE = path.join(DATA_DIR, 'integrations', 'telegram-pending-approvals.json');
const APPROVAL_EXPIRY_MS = 300_000; // 5 minutes

// ─── Dedup guard (prevents processing same update twice on 409 conflict) ──
const processedUpdateIds = new Set();

function loadPendingApprovals() {
    try {
        if (fs.existsSync(PENDING_APPROVALS_FILE)) {
            return JSON.parse(fs.readFileSync(PENDING_APPROVALS_FILE, 'utf-8'));
        }
    } catch { }
    return {};
}

function savePendingApprovals(data) {
    try {
        const dir = path.dirname(PENDING_APPROVALS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(PENDING_APPROVALS_FILE, JSON.stringify(data, null, 2));
    } catch (e) { logError('savePendingApprovals failed', e); }
}

function getPendingApproval(chatId) {
    const all = loadPendingApprovals();
    const entry = all[`chat_${chatId}`];
    if (!entry) return null;
    // Auto-expire after 5 minutes
    if (Date.now() - entry.timestamp > APPROVAL_EXPIRY_MS) {
        delete all[`chat_${chatId}`];
        savePendingApprovals(all);
        return null;
    }
    return entry;
}

function setPendingApproval(chatId, approvalId) {
    const all = loadPendingApprovals();
    all[`chat_${chatId}`] = { approvalId, timestamp: Date.now() };
    savePendingApprovals(all);
}

function clearPendingApproval(chatId) {
    const all = loadPendingApprovals();
    delete all[`chat_${chatId}`];
    savePendingApprovals(all);
}

function saveSettingsField(updates) {
    try {
        const settings = loadSettings() || {};
        Object.assign(settings, updates);
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) { logError('saveSettingsField failed', e); }
    return false;
}

// ─── Admin Menu Builders ──────────────────────────────────────

/** Build and send the /settings main menu. */
async function sendSettingsMenu(token, chatId) {
    const settings = loadSettings() || {};
    const provider = settings.activeProvider || 'unknown';
    const model = settings.providers?.[provider]?.model || 'unknown';
    const persona = settings.persona || 'default';

    const text =
        `⚙️ *Skales Settings*\n\n` +
        `Provider : \`${provider}\`\n` +
        `Model    : \`${model}\`\n` +
        `Persona  : \`${persona}\`\n\n` +
        `Tap a button to change:`;

    const keyboard = [
        [
            { text: '🤖 Provider', callback_data: 'menu:provider' },
            { text: '🎭 Persona', callback_data: 'menu:persona' },
        ],
        [{ text: '❌ Close', callback_data: 'menu:close' }],
    ];
    await sendMessageWithKeyboard(token, chatId, text, keyboard);
}

/** Build and send the provider selection sub-menu. */
async function sendProviderMenu(token, chatId) {
    const settings = loadSettings() || {};
    const current = settings.activeProvider || 'unknown';

    const PROVIDERS = [
        ['openrouter', 'OpenRouter'], ['openai', 'OpenAI'],
        ['anthropic', 'Anthropic'],   ['google', 'Google'],
        ['groq', 'Groq'],             ['mistral', 'Mistral'],
        ['deepseek', 'DeepSeek'],     ['ollama', 'Ollama'],
    ];

    const rows = [];
    for (let i = 0; i < PROVIDERS.length; i += 2) {
        const row = [];
        for (const [id, label] of PROVIDERS.slice(i, i + 2)) {
            row.push({
                text: id === current ? `✅ ${label}` : label,
                callback_data: `set:provider:${id}`,
            });
        }
        rows.push(row);
    }
    rows.push([{ text: '← Back', callback_data: 'menu:settings' }]);

    await sendMessageWithKeyboard(token, chatId,
        `🤖 *Select AI Provider*\n_(current: \`${current}\`)_`, rows);
}

/** Build and send the persona selection sub-menu. */
async function sendPersonaMenu(token, chatId) {
    const settings = loadSettings() || {};
    const current = settings.persona || 'default';

    const PERSONAS = [
        ['default', '🤝 Default'],   ['entrepreneur', '💼 Entrepreneur'],
        ['family', '🏠 Family'],      ['coder', '💻 Coder'],
        ['student', '📚 Student'],
    ];

    const rows = [];
    for (let i = 0; i < PERSONAS.length; i += 2) {
        const row = [];
        for (const [id, label] of PERSONAS.slice(i, i + 2)) {
            row.push({
                text: id === current ? `${label} ✅` : label,
                callback_data: `set:persona:${id}`,
            });
        }
        rows.push(row);
    }
    rows.push([{ text: '← Back', callback_data: 'menu:settings' }]);

    await sendMessageWithKeyboard(token, chatId,
        `🎭 *Select Persona*\n_(current: \`${current}\`)_`, rows);
}

// Friendly labels for known built-in skill IDs
const SKILL_META = {
    image_generation:  '🖼️ Image Gen',
    video_generation:  '🎬 Video Gen',
    summarize:         '📝 Summarize',
    googleCalendar:    '📅 Calendar',
    weather:           '🌤️ Weather',
    systemMonitor:     '🖥️ Sys Monitor',
    localFileChat:     '📁 File Chat',
    webhook:           '🔗 Webhooks',
    browserControl:    '🌐 Browser Ctrl',
    discord:           '💬 Discord',
    whatsapp:          '💬 WhatsApp',
    email:             '📧 Email',
    twitter:           '🐦 Twitter',
    googleSearch:      '🔍 Google Search',
    tavilySearch:      '🌐 Tavily Search',
    codeExecution:     '⚡ Code Run',
    googleDrive:       '☁️ Google Drive',
    notion:            '📔 Notion',
    slack:             '💬 Slack',
    github:            '🐙 GitHub',
};
const SKILLS_PER_PAGE = 8; // 4 rows × 2 columns

/** Build and send the /skills toggle menu — paginated, shows ALL skills dynamically. */
async function sendSkillsMenu(token, chatId, page) {
    page = parseInt(page) || 0;
    const state = loadSkillsState();
    const skills = state.skills || {};

    // Combine all known skill IDs from state + built-in meta
    const allIds = Array.from(new Set([
        ...Object.keys(SKILL_META),
        ...Object.keys(skills),
    ]));

    const totalPages = Math.ceil(allIds.length / SKILLS_PER_PAGE);
    page = Math.max(0, Math.min(page, totalPages - 1));
    const pageIds = allIds.slice(page * SKILLS_PER_PAGE, (page + 1) * SKILLS_PER_PAGE);

    const rows = [];
    for (let i = 0; i < pageIds.length; i += 2) {
        const row = [];
        for (const id of pageIds.slice(i, i + 2)) {
            const enabled = skills[id]?.enabled ?? false;
            const locked  = id === 'weather';
            const label   = SKILL_META[id] || `🔧 ${id}`;
            row.push({
                text: locked
                    ? `${label} ✅`
                    : `${enabled ? '✅' : '☐'} ${label}`,
                callback_data: locked ? 'noop' : `skill:toggle:${id}:${page}`,
            });
        }
        rows.push(row);
    }

    // Pagination row
    const navRow = [];
    if (page > 0) navRow.push({ text: '◀ Prev', callback_data: `skill:page:${page - 1}` });
    if (totalPages > 1) navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) navRow.push({ text: 'Next ▶', callback_data: `skill:page:${page + 1}` });
    if (navRow.length > 0) rows.push(navRow);

    rows.push([
        { text: '← Settings', callback_data: 'menu:settings' },
        { text: '❌ Close', callback_data: 'menu:close' },
    ]);

    await sendMessageWithKeyboard(token, chatId,
        `🔧 *Skills — tap to toggle* _(${allIds.length} total, page ${page + 1}/${totalPages})_`,
        rows
    );
}

/** Send the /tasks menu — shows active/pending/blocked tasks with action buttons. */
async function sendTasksMenu(token, chatId) {
    const tasks = loadTasks();
    const active = tasks.filter(t => ['pending', 'in_progress', 'blocked', 'failed'].includes(t.state));

    if (active.length === 0) {
        const done = tasks.filter(t => t.state === 'completed').length;
        await sendMessage(token, chatId,
            `✅ *No active tasks.*\n${done > 0 ? `_(${done} completed tasks in history)_` : '_Queue is empty._'}`
        );
        return;
    }

    let text = `📋 *Tasks (${active.length} active)*\n\n`;
    const rows = [];

    for (const t of active.slice(0, 8)) { // max 8 shown
        const icon = taskStateIcon(t.state);
        const titleShort = (t.title || 'Unnamed').slice(0, 35);
        text += `${icon} *${titleShort}*\n`;
        if (t.state === 'blocked' || t.state === 'failed') {
            const err = (t.blockedReason || t.error || '').slice(0, 60);
            text += `   └ _${err}_\n`;
        }
        text += '\n';

        // Action buttons per task
        const btnRow = [];
        if (t.state === 'blocked' || t.state === 'failed') {
            btnRow.push({ text: `🔄 Retry: ${titleShort.slice(0, 18)}`, callback_data: `task:retry:${t.id}` });
        }
        if (t.state !== 'completed' && t.state !== 'cancelled') {
            btnRow.push({ text: `🗑️ Cancel`, callback_data: `task:cancel:${t.id}` });
        }
        if (btnRow.length > 0) rows.push(btnRow);
    }

    if (active.length > 8) text += `_...and ${active.length - 8} more_\n`;
    rows.push([{ text: '❌ Close', callback_data: 'menu:close' }]);

    await sendMessageWithKeyboard(token, chatId, text, rows);
}

/** Send the /jobs menu — cron jobs with enable/disable toggle buttons. */
async function sendJobsMenu(token, chatId) {
    if (!fs.existsSync(CRON_DIR)) {
        await sendMessage(token, chatId, '📅 No scheduled jobs configured.');
        return;
    }
    const files = fs.readdirSync(CRON_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        await sendMessage(token, chatId, '📅 No scheduled jobs configured.');
        return;
    }

    const jobs = files.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(CRON_DIR, f), 'utf-8')); }
        catch { return null; }
    }).filter(Boolean);

    let text = `📅 *Cron Jobs (${jobs.length})*\n\n`;
    const rows = [];

    for (const job of jobs) {
        const on = job.enabled !== false;
        text += `${on ? '✅' : '⏸️'} *${(job.name || 'Unnamed').slice(0, 30)}*\n`;
        text += `   \`${job.schedule || '?'}\` — ${(job.task || '').slice(0, 50)}\n\n`;

        rows.push([
            {
                text: on ? '⏸️ Disable' : '▶️ Enable',
                callback_data: `job:toggle:${job.id}`,
            },
            {
                text: '🗑️ Delete',
                callback_data: `job:delete:${job.id}`,
            },
        ]);
    }

    rows.push([{ text: '❌ Close', callback_data: 'menu:close' }]);
    await sendMessageWithKeyboard(token, chatId, text, rows);
}

/** Send the /autopilot menu — show status + toggle. */
async function sendAutopilotMenu(token, chatId) {
    const settings = loadSettings() || {};
    const enabled   = settings.isAutonomousMode === true;
    const tasks     = loadTasks();
    const pending   = tasks.filter(t => t.state === 'pending').length;
    const running   = tasks.filter(t => t.state === 'in_progress').length;
    const blocked   = tasks.filter(t => t.state === 'blocked' || t.state === 'failed').length;
    const completed = tasks.filter(t => t.state === 'completed').length;

    const text =
        `🤖 *Autopilot*\n\n` +
        `Status   : ${enabled ? '🟢 Running' : '🔴 Stopped'}\n` +
        `Pending  : ${pending}\n` +
        `Running  : ${running}\n` +
        `Blocked  : ${blocked}\n` +
        `Completed: ${completed}\n`;

    const rows = [
        [{ text: enabled ? '⏹️ Stop Autopilot' : '▶️ Start Autopilot', callback_data: 'autopilot:toggle' }],
        [
            { text: '📋 View Tasks', callback_data: 'menu:tasks' },
            { text: '❌ Close', callback_data: 'menu:close' },
        ],
    ];

    await sendMessageWithKeyboard(token, chatId, text, rows);
}

/** Send the /help command list. */
async function sendHelpMenu(token, chatId) {
    const text =
        `📖 *Skales Commands*\n\n` +
        `*Navigation*\n` +
        `/status — Current model, provider & uptime\n` +
        `/settings — Change AI provider, model, persona\n` +
        `/skills — Toggle all skills on/off\n` +
        `/tasks — View & manage background tasks\n` +
        `/jobs — View & manage cron jobs\n` +
        `/autopilot — Enable/disable autonomous mode\n\n` +
        `*Actions*\n` +
        `/clear — Reset conversation context\n` +
        `/export — Download a full data backup\n` +
        `/killswitch — Emergency stop Skales\n\n` +
        `*Chat*\n` +
        `Just send any message to talk to Skales.\n` +
        `Send a voice message for voice replies.\n` +
        `Send a photo to analyze it with vision.\n` +
        `Send a document (PDF, .txt, .py…) to process it.`;

    await sendMessage(token, chatId, text);
}

/** Build and send the /killswitch confirmation keyboard. */
async function sendKillswitchConfirm(token, chatId) {
    const keyboard = [
        [
            { text: '✅ Yes, stop Skales', callback_data: 'ks:confirm:0' },
            { text: '❌ Cancel', callback_data: 'ks:cancel' },
        ],
        [{ text: '⚠️ Stop + Shutdown PC', callback_data: 'ks:confirm:1' }],
    ];

    await sendMessageWithKeyboard(token, chatId,
        `🛑 *KILLSWITCH*\n\n` +
        `This will *immediately stop Skales* and write a log to your Desktop.\n\n` +
        `Are you sure?`,
        keyboard
    );
}

// ─── Callback Query Handler ───────────────────────────────────

async function processCallbackQuery(token, callbackQuery, config) {
    const cbId = callbackQuery.id;
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat?.id?.toString();

    if (!chatId) { await answerCbQuery(token, cbId); return; }

    // Security: only the paired chat can use the admin interface
    if (!config.pairedChatId || config.pairedChatId !== chatId) {
        await answerCbQuery(token, cbId, '🔒 Not authorized');
        return;
    }

    log(`🔘 Callback: ${data}`);

    // ── Navigation ────────────────────────────────────────────
    if (data === 'menu:settings') {
        await answerCbQuery(token, cbId);
        await sendSettingsMenu(token, chatId);
        return;
    }
    if (data === 'menu:provider') {
        await answerCbQuery(token, cbId);
        await sendProviderMenu(token, chatId);
        return;
    }
    if (data === 'menu:persona') {
        await answerCbQuery(token, cbId);
        await sendPersonaMenu(token, chatId);
        return;
    }
    if (data === 'menu:skills') {
        await answerCbQuery(token, cbId);
        await sendSkillsMenu(token, chatId);
        return;
    }
    if (data === 'menu:close') {
        await answerCbQuery(token, cbId);
        return;
    }
    if (data === 'noop') {
        await answerCbQuery(token, cbId, '🌤️ Weather is always enabled');
        return;
    }

    // ── Set Provider ──────────────────────────────────────────
    if (data.startsWith('set:provider:')) {
        const providerId = data.replace('set:provider:', '');
        saveSettingsField({ activeProvider: providerId });
        await answerCbQuery(token, cbId, `✅ Switched to ${providerId}`);
        await sendSettingsMenu(token, chatId);
        return;
    }

    // ── Set Persona ───────────────────────────────────────────
    if (data.startsWith('set:persona:')) {
        const personaId = data.replace('set:persona:', '');
        saveSettingsField({ persona: personaId });
        await answerCbQuery(token, cbId, `✅ Persona: ${personaId}`);
        await sendSettingsMenu(token, chatId);
        return;
    }

    // ── Skills: pagination ────────────────────────────────────
    if (data.startsWith('skill:page:')) {
        const page = parseInt(data.replace('skill:page:', '')) || 0;
        await answerCbQuery(token, cbId);
        await sendSkillsMenu(token, chatId, page);
        return;
    }

    // ── Toggle Skill ──────────────────────────────────────────
    if (data.startsWith('skill:toggle:')) {
        // Format: skill:toggle:skillId:page
        const rest = data.replace('skill:toggle:', '');
        const lastColon = rest.lastIndexOf(':');
        const skillId = lastColon > 0 ? rest.slice(0, lastColon) : rest;
        const page = lastColon > 0 ? parseInt(rest.slice(lastColon + 1)) || 0 : 0;
        const state = loadSkillsState();
        const currentlyEnabled = state.skills[skillId]?.enabled ?? false;
        const newState = !currentlyEnabled;
        saveSkillEnabled(skillId, newState);
        await answerCbQuery(token, cbId,
            `${newState ? '✅' : '❌'} ${skillId} ${newState ? 'enabled' : 'disabled'}`);
        await sendSkillsMenu(token, chatId, page);
        return;
    }

    // ── Tasks: retry ──────────────────────────────────────────
    if (data.startsWith('task:retry:')) {
        const taskId = data.replace('task:retry:', '');
        try {
            const res = await fetch(`${API_BASE}/api/autopilot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'retry_task', taskId }),
                signal: AbortSignal.timeout(10000),
            });
            if (res.ok) {
                await answerCbQuery(token, cbId, '🔄 Task queued for retry');
            } else {
                await answerCbQuery(token, cbId, '⚠️ Retry failed — is the Dashboard running?');
            }
        } catch {
            await answerCbQuery(token, cbId, '⚠️ Dashboard offline');
        }
        await sendTasksMenu(token, chatId);
        return;
    }

    // ── Tasks: cancel ─────────────────────────────────────────
    if (data.startsWith('task:cancel:')) {
        const taskId = data.replace('task:cancel:', '');
        try {
            const res = await fetch(`${API_BASE}/api/autopilot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel_task', taskId }),
                signal: AbortSignal.timeout(10000),
            });
            if (res.ok) {
                await answerCbQuery(token, cbId, '🗑️ Task cancelled');
            } else {
                await answerCbQuery(token, cbId, '⚠️ Cancel failed — is the Dashboard running?');
            }
        } catch {
            await answerCbQuery(token, cbId, '⚠️ Dashboard offline');
        }
        await sendTasksMenu(token, chatId);
        return;
    }

    // ── Jobs: toggle enable/disable ───────────────────────────
    if (data.startsWith('job:toggle:')) {
        const jobId = data.replace('job:toggle:', '');
        try {
            const files = fs.existsSync(CRON_DIR) ? fs.readdirSync(CRON_DIR).filter(f => f.endsWith('.json')) : [];
            let found = false;
            for (const f of files) {
                const fp = path.join(CRON_DIR, f);
                try {
                    const job = JSON.parse(fs.readFileSync(fp, 'utf-8'));
                    if (job.id === jobId) {
                        job.enabled = !(job.enabled !== false);
                        fs.writeFileSync(fp, JSON.stringify(job, null, 2));
                        await answerCbQuery(token, cbId,
                            `${job.enabled ? '▶️ Enabled' : '⏸️ Disabled'}: ${job.name || jobId}`);
                        found = true;
                        break;
                    }
                } catch { }
            }
            if (!found) await answerCbQuery(token, cbId, '⚠️ Job not found');
        } catch (e) {
            await answerCbQuery(token, cbId, '⚠️ Could not update job');
        }
        await sendJobsMenu(token, chatId);
        return;
    }

    // ── Jobs: delete ──────────────────────────────────────────
    if (data.startsWith('job:delete:')) {
        const jobId = data.replace('job:delete:', '');
        try {
            const files = fs.existsSync(CRON_DIR) ? fs.readdirSync(CRON_DIR).filter(f => f.endsWith('.json')) : [];
            let found = false;
            for (const f of files) {
                const fp = path.join(CRON_DIR, f);
                try {
                    const job = JSON.parse(fs.readFileSync(fp, 'utf-8'));
                    if (job.id === jobId) {
                        fs.unlinkSync(fp);
                        await answerCbQuery(token, cbId, `🗑️ Deleted: ${job.name || jobId}`);
                        found = true;
                        break;
                    }
                } catch { }
            }
            if (!found) await answerCbQuery(token, cbId, '⚠️ Job not found');
        } catch {
            await answerCbQuery(token, cbId, '⚠️ Could not delete job');
        }
        await sendJobsMenu(token, chatId);
        return;
    }

    // ── Autopilot: toggle ─────────────────────────────────────
    if (data === 'autopilot:toggle') {
        const settings = loadSettings() || {};
        const newVal = !(settings.isAutonomousMode === true);
        saveSettingsField({ isAutonomousMode: newVal });
        await answerCbQuery(token, cbId, newVal ? '▶️ Autopilot started' : '⏹️ Autopilot stopped');
        await sendAutopilotMenu(token, chatId);
        return;
    }

    // ── Navigation: tasks / jobs / autopilot ──────────────────
    if (data === 'menu:tasks') {
        await answerCbQuery(token, cbId);
        await sendTasksMenu(token, chatId);
        return;
    }
    if (data === 'menu:jobs') {
        await answerCbQuery(token, cbId);
        await sendJobsMenu(token, chatId);
        return;
    }
    if (data === 'menu:autopilot') {
        await answerCbQuery(token, cbId);
        await sendAutopilotMenu(token, chatId);
        return;
    }

    // ── Killswitch: Cancel ────────────────────────────────────
    if (data === 'ks:cancel') {
        await answerCbQuery(token, cbId, '✅ Cancelled');
        await sendMessage(token, chatId, 'Killswitch cancelled. Skales continues running.');
        return;
    }

    // ── Killswitch: Confirm ───────────────────────────────────
    if (data.startsWith('ks:confirm:')) {
        const shutdownPC = data.endsWith(':1');
        await answerCbQuery(token, cbId, '🛑 Triggering killswitch...');
        await sendMessage(token, chatId,
            `🛑 *Killswitch Activated*\n\n` +
            `Skales is shutting down now.\n` +
            (shutdownPC ? '⚠️ PC shutdown also initiated.' : '💻 PC will stay on.') + '\n\n' +
            `_A killswitch log has been written to your Desktop._`
        );
        // Call the Next.js API to actually stop the server process
        try {
            await fetch(`${API_BASE}/api/killswitch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: 'manual_telegram',
                    shutdownPC,
                    triggeredBy: config.pairedUserName || 'Telegram',
                    details: `Triggered via Telegram by ${config.pairedUserName || 'paired user'}`,
                }),
                signal: AbortSignal.timeout(5000),
            });
        } catch { /* Next.js may already be stopped */ }
        return;
    }

    // ── Tool Approval: Approve / Deny ────────────────────────
    if (data.startsWith('approval:approve:') || data.startsWith('approval:deny:')) {
        const decision  = data.startsWith('approval:approve:') ? 'approve' : 'deny';
        const approvalId = data.split(':').slice(2).join(':'); // UUID may contain colons
        await answerCbQuery(token, cbId, decision === 'approve' ? '✅ Approving...' : '❌ Denied');
        try {
            const res = await fetch(`${API_BASE}/api/chat/telegram/approval`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ approvalId, decision }),
                signal:  AbortSignal.timeout(120_000),
            });
            const responseData = await res.json();
            const reply = responseData.response || (decision === 'approve' ? '✅ Approved and executed.' : '❌ Action declined.');
            await sendMessage(token, chatId, reply);
        } catch (e) {
            await sendMessage(token, chatId, `⚠️ Could not process approval: ${e.message}`);
        }
        return;
    }

    // Unknown callback — just acknowledge
    await answerCbQuery(token, cbId);
}

/** Search for a GIF using the configured provider (Klipy or Giphy). Returns a URL or null. */
async function searchGif(query) {
    try {
        const settings = loadSettings();
        const gif = settings?.gifIntegration;
        if (!gif?.enabled || !gif?.apiKey) return null;

        if (gif.provider === 'klipy' || !gif.provider) {
            const res = await fetch(
                `https://g.klipy.co/api/v1/providers/klipy/search?q=${encodeURIComponent(query)}&api_key=${gif.apiKey}&limit=5`,
                { signal: AbortSignal.timeout(5000) }
            );
            const data = await res.json();
            const items = data?.data || data?.results || [];
            if (items.length > 0) {
                const pick = items[Math.floor(Math.random() * Math.min(items.length, 5))];
                return pick?.media?.gif?.url || pick?.url || null;
            }
        } else if (gif.provider === 'giphy') {
            const res = await fetch(
                `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${gif.apiKey}&limit=5&rating=g`,
                { signal: AbortSignal.timeout(5000) }
            );
            const data = await res.json();
            const items = data?.data || [];
            if (items.length > 0) {
                const pick = items[Math.floor(Math.random() * Math.min(items.length, 5))];
                return pick?.images?.original?.url || null;
            }
        }
    } catch { }
    return null;
}

/** Send a WhatsApp message via the WhatsApp bot process (fire-and-forget). */
async function sendWhatsApp(phone, message) {
    return new Promise((resolve) => {
        try {
            const body = JSON.stringify({ to: phone, message, addSignature: true });
            const req = http.request(
                {
                    hostname: '127.0.0.1', port: WHATSAPP_BOT_PORT, path: '/send', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
                },
                (res) => { resolve(res.statusCode === 200); }
            );
            req.on('error', () => resolve(false));
            req.setTimeout(10000, () => { req.destroy(); resolve(false); });
            req.write(body);
            req.end();
        } catch { resolve(false); }
    });
}

// ─── Agent API Call ───────────────────────────────────────────
// This calls the full Skales Agent — same brain as the Dashboard.
// The agent has access to ALL tools: tasks, cron, files, web, etc.

// ─── Typing Keepalive ─────────────────────────────────────────
// Sends "typing..." to Telegram every 4s so the indicator stays visible
// while the agent is working. Returns a stopper function.
function startTypingKeepalive(token, chatId) {
    const interval = setInterval(() => {
        sendTyping(token, chatId).catch(() => { });
    }, 4000);
    return () => clearInterval(interval);
}

async function callAgentAPI(userMessage, telegramChatId, telegramUserName, token, imageDataUri = null) {
    const API_URL = `${API_BASE}/api/chat/telegram`;

    // Start typing keepalive so user sees "..." while agent works
    const stopTyping = token ? startTypingKeepalive(token, telegramChatId) : () => { };

    try {
        const payload = {
            message: userMessage,
            telegramChatId: telegramChatId.toString(),
            telegramUserName: telegramUserName || 'User',
        };
        if (imageDataUri) {
            payload.imageDataUri = imageDataUri;
        }
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            // 5 minutes — agent loops with up to 4 steps × 90s each = 360s max
            signal: AbortSignal.timeout(300000),
        });

        stopTyping();

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Agent API Error ${res.status}: ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Unknown agent error');
        }

        // ── Approval required: attach approvalId so caller sends inline keyboard ──
        if (data.requiresApproval && data.approvalId) {
            return {
                success:          true,
                response:         data.response,
                generatedMedia:   data.generatedMedia || [],
                voiceAlreadySent: false,
                requiresApproval: true,
                approvalId:       data.approvalId,
            };
        }

        return { success: true, response: data.response, generatedMedia: data.generatedMedia || [], voiceAlreadySent: !!data.voiceAlreadySent };

    } catch (e) {
        stopTyping();
        if (e.cause?.code === 'ECONNREFUSED') {
            return {
                success: false,
                error: '🧠 Skales brain is offline. Please start the Dashboard first (npm run dev).'
            };
        }
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
            return {
                success: false,
                error: '⏱️ Skales is still working — the task is complex. Please check back in a minute or view progress in the Dashboard.'
            };
        }
        return { success: false, error: e.message };
    }
}

// ─── Voice & TTS — Fallback Stack ────────────────────────────
// STT Priority: OpenAI Whisper → Groq Whisper (whisper-large-v3-turbo) → Error
// ─── VOICE HANDLING: STT (Speech-To-Text) & TTS (Text-To-Speech) ────────────────
// IMPORTANT: STT and TTS are COMPLETELY INDEPENDENT services!
//
// STT (Transcription - Input):
//   • Needed to convert user's voice message → text
//   • Priority: OpenAI Whisper (whisper-1) → Groq Whisper (whisper-large-v3-turbo, FREE) → Error
//   • Uses API keys from: settings.providers.openai.apiKey OR settings.providers.groq.apiKey
//   • ElevenLabs/Azure TTS config does NOT enable STT
//
// TTS (Voice Output - Output):
//   • Needed to convert bot's response → voice message
//   • Priority: ElevenLabs → Azure → Groq PlayAI → Google Translate (free, HTTP)
//   • Uses config from: settings.ttsConfig
//   • OpenAI/Groq STT keys do NOT affect TTS provider
//
// NOTE: edge-tts removed — WebSocket hangs on this system (network incompatibility)
const { execFile } = require('child_process');

async function getFileUrl(token, fileId) {
    const res = await telegramRequest(token, 'getFile', { file_id: fileId });
    if (!res.ok || !res.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${token}/${res.result.file_path}`;
}

// ── STT: Spracherkennung ──────────────────────────────────────

async function transcribeWithOpenAI(audioBuffer, apiKey) {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'voice.ogg');
    formData.append('model', 'whisper-1');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
}

async function transcribeWithGroq(audioBuffer, apiKey) {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'voice.ogg');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
}

async function transcribeVoice(token, fileId, settings) {
    try {
        const fileUrl = await getFileUrl(token, fileId);
        if (!fileUrl) return null;
        const audioRes = await fetch(fileUrl);
        if (!audioRes.ok) return null;
        const audioBuffer = await audioRes.arrayBuffer();

        // Check which STT providers are available
        const openaiKey = settings?.providers?.openai?.apiKey;
        const groqKey = settings?.providers?.groq?.apiKey;
        
        // Log available STT options (for debugging)
        if (!openaiKey && !groqKey) {
            log('⚠️  STT: No API keys available (OpenAI or Groq needed)');
        }

        // 1. OpenAI Whisper (if key available) — Reliable, paid
        if (openaiKey) {
            try {
                const text = await transcribeWithOpenAI(audioBuffer, openaiKey);
                if (text) { 
                    log('🎤 STT: OpenAI Whisper (whisper-1)');
                    return text;
                }
            } catch (err) {
                log('⚠️  STT: OpenAI Whisper failed - ' + (err.message || 'Unknown error'));
            }
        }

        // 2. Groq Whisper (free with account, very fast)
        if (groqKey) {
            try {
                const text = await transcribeWithGroq(audioBuffer, groqKey);
                if (text) { 
                    log('🎤 STT: Groq Whisper (whisper-large-v3-turbo)');
                    return text;
                }
            } catch (err) {
                log('⚠️  STT: Groq Whisper failed - ' + (err.message || 'Unknown error'));
            }
        }

        // 3. No STT available
        return '__NO_STT__';
    } catch (e) {
        logError('transcribeVoice failed', e);
        return null;
    }
}

// ── TTS: Sprachausgabe ────────────────────────────────────────

async function ttsWithOpenAI(text, apiKey) {
    try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4096), voice: 'nova', response_format: 'ogg_opus' }),
        });
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch { return null; }
}

async function ttsWithGroq(text, apiKey) {
    // Groq PlayAI TTS — HTTP-based, no WebSocket, Any language OK
    try {
        const res = await fetch('https://api.groq.com/openai/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'playai-tts',
                input: text.slice(0, 4096),
                voice: 'Fritz-PlayAI',        // Male voice, best multilingual pronunciation
                response_format: 'mp3',
            }),
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            logError('Groq TTS HTTP error', new Error(`${res.status}: ${errText.slice(0, 150)}`));
            return null;
        }
        log('🔊 TTS: Groq PlayAI (Fritz)');
        return await res.arrayBuffer();
    } catch (e) {
        logError('Groq TTS failed', e);
        return null;
    }
}

async function ttsWithGoogleFree(text, lang) {
    // Google Translate TTS — 100% free, no API key, pure HTTP (no WebSocket!)
    // Limit: ~180 chars per request → automatic chunking for long texts
    try {
        // Use the provided language or fall back to English
        const ttsLang = (lang || 'en').split('-')[0].toLowerCase();
        const MAX_CHARS = 180;
        const chunks = [];
        let remaining = text.trim().slice(0, 2000); // max 2000 chars total
        while (remaining.length > 0) {
            if (remaining.length <= MAX_CHARS) {
                chunks.push(remaining);
                break;
            }
            // Find sentence boundary (space)
            let splitAt = remaining.lastIndexOf(' ', MAX_CHARS);
            if (splitAt < 10) splitAt = MAX_CHARS;
            chunks.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt).trim();
        }

        const audioBuffers = [];
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=${ttsLang}&q=${encodeURIComponent(chunk)}`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) continue;
            audioBuffers.push(await res.arrayBuffer());
        }

        if (audioBuffers.length === 0) return null;

        // Merge all audio chunks (MP3 concatenation)
        const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffers) {
            combined.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
        }

        log('🔊 TTS: Google Translate (kostenlos, kein Key, kein WebSocket)');
        return combined.buffer;
    } catch (e) {
        logError('Google TTS failed', e);
        return null;
    }
}

async function ttsWithElevenLabs(text, apiKey, voiceId) {
    // ElevenLabs TTS — high quality, HTTP-based
    const vid = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)
    try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: text.slice(0, 5000),
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
        });
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch { return null; }
}

async function ttsWithAzure(text, subscriptionKey, region, voiceName) {
    // Azure Cognitive Services TTS — HTTP REST, no SDK needed
    const voice = voiceName || 'en-US-JennyNeural';
    const r = region || 'eastus';
    try {
        // Get access token
        const tokenRes = await fetch(`https://${r}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
            method: 'POST',
            headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey, 'Content-Length': '0' },
        });
        if (!tokenRes.ok) return null;
        const token = await tokenRes.text();

        // Synthesize speech
        const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${text.slice(0, 5000)}</voice></speak>`;
        const synthRes = await fetch(`https://${r}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                'User-Agent': 'SkalesBot',
            },
            body: ssml,
        });
        if (!synthRes.ok) return null;
        return await synthRes.arrayBuffer();
    } catch { return null; }
}

async function textToSpeech(text, settings) {
    const ttsConf = settings?.ttsConfig;
    const provider = ttsConf?.provider || 'default';

    // 1. ElevenLabs (only when user selected 'elevenlabs')
    if (provider === 'elevenlabs' && ttsConf?.elevenlabsApiKey) {
        const audio = await ttsWithElevenLabs(text, ttsConf.elevenlabsApiKey, ttsConf.elevenlabsVoiceId);
        if (audio) return audio;
    }

    // 2. Azure TTS (only when user selected 'azure')
    if (provider === 'azure' && ttsConf?.azureSpeechKey && ttsConf?.azureSpeechRegion) {
        const audio = await ttsWithAzure(text, ttsConf.azureSpeechKey, ttsConf.azureSpeechRegion, ttsConf.azureVoiceName);
        if (audio) return audio;
    }

    // 3. Default stack: Groq TTS (PlayAI — HTTP, fast)
    const groqKey = settings?.providers?.groq?.apiKey;
    if (groqKey) {
        const audio = await ttsWithGroq(text, groqKey);
        if (audio) return audio;
    }

    // 4. Google Translate TTS (completely free, no key, pure HTTP)
    // Pass the user's configured language so TTS speaks the correct language
    const userLang = settings?.nativeLanguage || settings?.locale || 'en';
    return await ttsWithGoogleFree(text, userLang);
}

async function sendVoice(token, chatId, audioBuffer, isMP3 = false) {
    try {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        const mimeType = isMP3 ? 'audio/mpeg' : 'audio/ogg';
        const filename = isMP3 ? 'reply.mp3' : 'reply.ogg';
        const blob = new Blob([audioBuffer], { type: mimeType });
        formData.append('voice', blob, filename);
        await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
            method: 'POST',
            body: formData,
        });
    } catch (e) {
        logError('sendVoice failed', e);
    }
}

// ─── Message Processing ──────────────────────────────────────

async function processUpdate(token, update, config) {
    // ── Inline keyboard button press ──
    if (update.callback_query) {
        await processCallbackQuery(token, update.callback_query, config);
        return;
    }

    const msg = update.message || update.edited_message;
    if (!msg) return;

    // Determine message type and extract text
    const isVoice = !!(msg.voice || msg.audio);
    const isPhoto = !!(msg.photo && msg.photo.length > 0);
    const hasText = !!msg.text;
    const isDocument = !!(msg.document); // PDFs, text files, code files, etc.

    if (!hasText && !isVoice && !isPhoto && !isDocument) return; // Ignore stickers, etc.

    const chatId = msg.chat.id.toString();
    const userName = msg.from?.first_name || 'User';
    const fullName = `${msg.from?.first_name || ''} ${msg.from?.last_name || ''}`.trim();

    // ── Get text (from text message or voice transcription) ──
    let userText = '';
    let wasVoice = false;

    if (hasText) {
        userText = msg.text.trim();
    } else if (isVoice) {
        // Transcribe voice message via Whisper (OpenAI → Groq → error)
        const fileId = msg.voice?.file_id || msg.audio?.file_id;
        await sendTyping(token, chatId);
        const settings = loadSettings();
        const transcript = await transcribeVoice(token, fileId, settings);
        if (!transcript) {
            await sendMessage(token, chatId, '🎤 Could not download your voice message. Please try again.');
            return;
        }
        if (transcript === '__NO_STT__') {
            await sendMessage(token, chatId,
                '🎤 *Speech Recognition (STT) Not Available*\n\n' +
                'To transcribe voice messages, you need one of these API keys:\n' +
                '• *OpenAI API Key* — for Whisper (paid, reliable)\n' +
                '• *Groq API Key* — for Whisper (free, very fast!)\n\n' +
                '_Important: STT (transcription) is separate from TTS (voice responses)._\n' +
                '_Having ElevenLabs/Azure for TTS does NOT enable STT._\n\n' +
                '🔗 Get API Keys:\n' +
                '→ OpenAI: https://platform.openai.com/account/api-keys\n' +
                '→ Groq: https://console.groq.com/keys (free)'
            );
            return;
        }
        userText = transcript;
        wasVoice = true;
        log(`🎤 Voice transcribed: ${userText.slice(0, 60)}`);
        // Show the user what was understood
        await sendMessage(token, chatId, `🎤 _"${userText}"_`);
    } else if (isPhoto) {
        // Get the largest photo
        const photoFileId = msg.photo[msg.photo.length - 1].file_id;
        const caption = msg.caption || 'Analyze this image and describe what you see.';
        userText = caption;
        log(`🖼️ Photo received: ${caption.slice(0, 40)}`);

        // Download the photo and convert to base64 Data-URI for vision routing
        try {
            const fileUrl = await getFileUrl(token, photoFileId);
            if (fileUrl) {
                const imgRes = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
                if (imgRes.ok) {
                    const imgBuf = await imgRes.arrayBuffer();
                    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                    const b64 = Buffer.from(imgBuf).toString('base64');
                    const dataUri = `data:${contentType};base64,${b64}`;
                    // We'll attach this as imageDataUri in the agent API call below
                    // Store it so processUpdate can forward it
                    msg._imageDataUri = dataUri;
                    log(`🖼️ Photo downloaded and converted to base64 (${Math.round(imgBuf.byteLength / 1024)}KB)`);
                }
            }
        } catch (imgErr) {
            log(`⚠️ Could not download photo for vision: ${imgErr.message}`);
            // Fallback to text description
            userText = `[Image received - could not download] ${caption}`;
        }
    } else if (isDocument) {
        // ── Document / File received ──────────────────────────────────────
        const doc = msg.document;
        const fileName = doc.file_name || 'document';
        const fileSize = doc.file_size || 0;
        const mimeType = doc.mime_type || 'application/octet-stream';
        const caption = msg.caption || '';

        log(`📎 Document received: ${fileName} (${mimeType}, ${Math.round(fileSize / 1024)}KB)`);

        // Decide if we can/should download and read it
        const isTextLike = mimeType.includes('text/') || mimeType.includes('json') ||
            mimeType.includes('xml') || mimeType.includes('javascript') ||
            /\.(txt|md|csv|js|ts|py|html|css|json|yaml|yml|sh|bat|log|ini|cfg|conf|xml)$/i.test(fileName);
        const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
        const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024; // 5MB

        if (fileSize > MAX_DOWNLOAD_BYTES) {
            // File too large for inline processing — inform user explicitly, NEVER silently drop
            const fileMb = Math.round(fileSize / 1024 / 1024 * 10) / 10;
            userText = `[📎 File received: ${fileName} (${mimeType}, ${fileMb}MB)]\n` +
                `Tell the user exactly: "I received your file '${fileName}' (${fileMb}MB), but it exceeds the 5MB inline processing limit. ` +
                `Telegram's API supports uploads up to ~20MB. To work with this file, please upload it through the Skales Dashboard directly, ` +
                `or if it's a text/code file, you can paste the content directly into the chat."` +
                `${caption ? '\nUser added: ' + caption : ''}`;
        } else if (isTextLike) {
            try {
                const fileUrl = await getFileUrl(token, doc.file_id);
                if (fileUrl) {
                    const fileRes = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
                    if (fileRes.ok) {
                        const fileText = await fileRes.text();
                        const truncated = fileText.slice(0, 8000);
                        userText = `[📄 ${fileName}]\n\`\`\`\n${truncated}${fileText.length > 8000 ? '\n...[truncated]' : ''}\n\`\`\`\n${caption || 'Please analyze this file.'}`;
                        log(`📄 Text file read: ${fileName} (${fileText.length} chars)`);
                    } else {
                        userText = `[📄 File: ${fileName} — could not download]${caption ? '\n' + caption : ''}`;
                    }
                }
            } catch (docErr) {
                log(`⚠️ Could not download document: ${docErr.message}`);
                userText = `[📄 File: ${fileName} — download failed: ${docErr.message}]${caption ? '\n' + caption : ''}`;
            }
        } else if (isPdf) {
            // PDF — download and pass as metadata (vision models can't process binary PDFs via Telegram)
            userText = `[📄 PDF received: ${fileName} (${Math.round(fileSize / 1024)}KB)]${caption ? '\n' + caption : '\nI received a PDF file. Note: To read PDF content, use the read_file tool after saving it to the Workspace, or describe what you need from this document.'}`;
        } else {
            // Binary/other file — describe it
            userText = `[📎 File received: ${fileName} (${mimeType}, ${Math.round(fileSize / 1024)}KB)]${caption ? '\n' + caption : '\nWhat would you like to do with this file?'}`;
        }
    }

    // ── /start command ──
    if (userText === '/start') {
        await sendMessage(token, chatId,
            `👋 Hi ${userName}! I'm *Skales AI*.\n\n` +
            `🔐 To connect, open the Skales Dashboard → Settings → Telegram and get your *Pairing Code*.\n\n` +
            `Then type:\n/pair YOUR_CODE\n\n` +
            `Example: /pair 123456`
        );
        return;
    }

    // ── /pair command ──
    if (userText.startsWith('/pair')) {
        const code = userText.replace('/pair', '').trim();
        if (!code) {
            await sendMessage(token, chatId, '❌ Please provide your pairing code.\nExample: `/pair 123456`');
            return;
        }
        if (code === config.pairingCode) {
            config.pairedChatId = chatId;
            config.pairedUserName = fullName || userName;
            saveTelegramConfig(config);
            log(`✅ PAIRED with ${userName} (chat ${chatId})`);
            await sendMessage(token, chatId, `✅ Successfully connected!\n\nHi ${userName}, you are now paired with Skales.\nJust send me a message and I'll respond.\n\nYour messages will also appear in the Skales Dashboard.`);
            return;
        } else {
            await sendMessage(token, chatId, '❌ Wrong pairing code. Please check the code in your Skales Dashboard → Settings → Telegram and try again.');
            return;
        }
    }

    // ── Check if user is paired ──
    if (!config.pairedChatId || config.pairedChatId !== chatId) {
        await sendMessage(token, chatId, 'Not paired yet. Use /pair <code> to connect.');
        return;
    }

    // ── Pending approval check (text-based approval for Safe Mode) ──
    const pendingApproval = getPendingApproval(chatId);
    if (pendingApproval) {
        const lowerText = userText.toLowerCase().trim();
        const isApprove = ['yes', 'ok', 'ja', 'approve', 'do it', 'mach', 'y', 'si', 'oui'].includes(lowerText);
        const isDecline = ['no', 'nein', 'decline', 'cancel', 'stop', 'n', 'abort'].includes(lowerText);

        if (isApprove || isDecline) {
            clearPendingApproval(chatId);
            const decision = isApprove ? 'approve' : 'deny';
            try {
                const res = await fetch(`${API_BASE}/api/chat/telegram/approval`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ approvalId: pendingApproval.approvalId, decision }),
                    signal:  AbortSignal.timeout(120_000),
                });
                const data = await res.json();
                const reply = data.response || (isApprove ? '✅ Approved and executed.' : '❌ Action declined.');
                await sendMessage(token, chatId, reply);
            } catch (e) {
                await sendMessage(token, chatId, `⚠️ Could not process approval: ${e.message}`);
            }
            return;
        }
        // Not a yes/no answer — clear pending and process as new message
        clearPendingApproval(chatId);
    }

    // ── /clear command ──
    if (userText === '/clear') {
        await sendMessage(token, chatId, 'Context cleared. Starting fresh.');
        return;
    }

    // ── /status command ──
    if (userText === '/status') {
        const settings = loadSettings();
        const providerName = settings?.activeProvider || 'unknown';
        const model = settings?.providers?.[providerName]?.model || 'unknown';
        const cronCount = fs.existsSync(CRON_DIR) ? fs.readdirSync(CRON_DIR).filter(f => f.endsWith('.json')).length : 0;
        await sendMessage(token, chatId,
            `📊 *Skales Status*\n• Provider: \`${providerName}\`\n• Model: \`${model}\`\n• Connected as: ${config.pairedUserName || userName}\n• Active scheduled jobs: ${cronCount}`
        );
        return;
    }

    // ── /jobs command — cron jobs with interactive buttons ──
    if (userText === '/jobs') {
        await sendJobsMenu(token, chatId);
        return;
    }

    // ── /tasks command — task queue with action buttons ──
    if (userText === '/tasks') {
        await sendTasksMenu(token, chatId);
        return;
    }

    // ── /autopilot command — autopilot status + toggle ──
    if (userText === '/autopilot') {
        await sendAutopilotMenu(token, chatId);
        return;
    }

    // ── /help command — full command reference ──
    if (userText === '/help') {
        await sendHelpMenu(token, chatId);
        return;
    }

    // ── /settings command — inline keyboard for provider/model/persona ──
    if (userText === '/settings') {
        await sendSettingsMenu(token, chatId);
        return;
    }

    // ── /skills command — inline keyboard to toggle skills ──
    if (userText === '/skills') {
        await sendSkillsMenu(token, chatId);
        return;
    }

    // ── /export command — generate backup ZIP and send via Telegram ──
    if (userText === '/export') {
        await sendMessage(token, chatId, '📦 Generating backup... please wait.');
        await sendTyping(token, chatId);
        try {
            // Trigger export generation via the Next.js API
            const genRes = await fetch(`${API_BASE}/api/export-backup/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000),
            });
            if (!genRes.ok) {
                await sendMessage(token, chatId, '❌ Export generation failed. Make sure Skales Dashboard is running.');
                return;
            }
            const genData = await genRes.json();
            if (!genData.success || !genData.filename) {
                await sendMessage(token, chatId, `❌ Export failed: ${genData.error || 'Unknown error'}`);
                return;
            }
            const zipPath = path.join(DATA_DIR, genData.filename);
            const sizeKb = genData.sizeBytes ? Math.round(genData.sizeBytes / 1024) : 0;
            await sendDocumentFile(token, chatId, zipPath,
                `📦 Skales Backup — ${genData.filename} (${sizeKb} KB)`);
            log(`📦 Export sent to ${userName}: ${genData.filename}`);
        } catch (e) {
            logError('/export failed', e);
            await sendMessage(token, chatId, '❌ Export failed. Is the Skales Dashboard running?');
        }
        return;
    }

    // ── /killswitch command — confirmation keyboard ──
    if (userText === '/killswitch') {
        await sendKillswitchConfirm(token, chatId);
        return;
    }

    log(`📨 ${userName}: ${userText.slice(0, 60)}${userText.length > 60 ? '...' : ''}`);

    // ── Save incoming message to inbox (for Dashboard) ──
    appendToInbox({
        id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        direction: 'incoming',
        content: wasVoice ? `🎤 ${userText}` : userText,
        telegramChatId: chatId,
        telegramUserName: userName,
        timestamp: Date.now(),
        source: 'telegram',
    });

    // ── Typing indicator ──
    await sendTyping(token, chatId);

    // ── Call Full Agent (same brain as Dashboard) ──
    const result = await callAgentAPI(userText, chatId, config.pairedUserName || userName, token, msg._imageDataUri || null);

    // An empty response is valid when a reasoning model emits only tool_calls (content is "").
    // Only treat it as an error when result.success is explicitly false.
    if (result.success) {
        // ── Approval required: send plain text and store pending approval ──
        if (result.requiresApproval && result.approvalId) {
            const approvalText = result.response || 'Approval required - Skales wants to perform an action.';
            const fullText = `${approvalText}\n\nReply "yes" to approve or "no" to decline.`;
            await sendMessage(token, chatId, fullText);
            setPendingApproval(chatId, result.approvalId);
            return;
        }

        // Only send text / save to inbox when there is actual response content.
        // Reasoning models (Minimax, o-series) may return an empty string after
        // executing tool calls — that is a successful, silent completion.
        if (result.response) {
            // Save outgoing response to inbox (for Dashboard)
            appendToInbox({
                id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                direction: 'outgoing',
                content: result.response,
                telegramChatId: chatId,
                telegramUserName: 'Skales',
                timestamp: Date.now(),
                source: 'telegram',
            });

            // ── TTS: Voice reply when user sent a voice message ──
            // Skip if the LLM already called generate_voice tool (which sends TTS
            // to Telegram itself) — otherwise we'd send two voice messages.
            if (wasVoice && !result.voiceAlreadySent) {
                const ttsSettings = loadSettings();
                const audioBuffer = await textToSpeech(result.response, ttsSettings);
                if (audioBuffer) {
                    const isMP3 = true;
                    await sendVoice(token, chatId, audioBuffer, isMP3);
                    await sendMessage(token, chatId, result.response);
                    log(`🔊 TTS reply sent to ${userName}`);
                    return;
                }
            } else if (wasVoice && result.voiceAlreadySent) {
                // Voice was already sent by generate_voice tool — just send the text
                log(`🔊 Voice already sent by generate_voice tool — skipping bot TTS`);
            }

            await sendMessage(token, chatId, result.response);
        }

        // ── Send any generated media (images / videos) ──
        // Always runs on success, even when the text response is empty,
        // so media produced by tool calls is never silently dropped.
        if (result.generatedMedia && result.generatedMedia.length > 0) {
            for (const media of result.generatedMedia) {
                try {
                    // filepath is relative to workspace/ inside DATA_DIR
                    // e.g. 'images/gemini_img_1234567890.png' → ~/.skales-data/workspace/images/gemini_img_xxx.png
                    const fullPath = path.join(DATA_DIR, 'workspace', media.filepath);
                    if (!fs.existsSync(fullPath)) {
                        log(`⚠️ Generated media file not found: ${fullPath}`);
                        continue;
                    }
                    const caption = media.prompt ? `🎨 ${media.prompt.slice(0, 200)}` : undefined;
                    if (media.type === 'image') {
                        await sendPhoto(token, chatId, fullPath, caption);
                        log(`🖼️ Sent generated image to ${userName}`);
                    } else if (media.type === 'video') {
                        await sendMediaFile(token, chatId, fullPath, caption);
                        log(`🎬 Sent generated video to ${userName}`);
                    }
                } catch (mediaErr) {
                    log(`⚠️ Failed to send generated media: ${mediaErr.message}`);
                }
            }
        }

        log(`✅ Replied to ${userName}`);
    } else {
        log(`❌ Agent error: ${result.error}`);
        await sendMessage(token, chatId,
            `⚠️ ${result.error || 'Could not get a response. Please try again.'}`
        );
    }
}

// ─── Scheduler ───────────────────────────────────────────────
// Tracks which jobs fired in the current minute to prevent double-triggers.

const firedThisMinute = new Set();
let lastMinuteKey = '';

function getMinuteKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
}

function checkCronMatch(expression, date) {
    try {
        const parts = expression.trim().split(/\s+/);
        if (parts.length < 5) return false;

        const minutes = date.getMinutes();
        const hours = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const dayOfWeek = date.getDay();

        const checkPart = (part, value) => {
            if (part === '*') return true;
            if (part.includes('/')) {
                const [, step] = part.split('/');
                return value % parseInt(step) === 0;
            }
            if (part.includes(',')) {
                return part.split(',').map(p => parseInt(p)).includes(value);
            }
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                return value >= start && value <= end;
            }
            return parseInt(part) === value;
        };

        return checkPart(parts[0], minutes) &&
            checkPart(parts[1], hours) &&
            checkPart(parts[2], day) &&
            checkPart(parts[3], month) &&
            checkPart(parts[4], dayOfWeek);
    } catch {
        return false;
    }
}

// Save lastRun to cron job file to prevent re-firing on restart
function updateCronLastRun(filePath, jobData) {
    try {
        jobData.lastRun = Date.now();
        fs.writeFileSync(filePath, JSON.stringify(jobData, null, 2));
    } catch (e) { logError('Failed to update lastRun', e); }
}

async function runScheduler() {
    if (!fs.existsSync(CRON_DIR)) return;

    const now = new Date();
    const currentMinuteKey = getMinuteKey(now);

    // Reset fired set when minute changes
    if (currentMinuteKey !== lastMinuteKey) {
        firedThisMinute.clear();
        lastMinuteKey = currentMinuteKey;
    }

    const telegramConfig = loadTelegramConfig();
    const isPaired = telegramConfig?.pairedChatId && telegramConfig?.botToken;

    const files = fs.readdirSync(CRON_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(CRON_DIR, file);
        try {
            const jobData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (!jobData.enabled) continue;

            // Prevent double-firing in same minute
            const jobKey = `${file}_${currentMinuteKey}`;
            if (firedThisMinute.has(jobKey)) continue;

            // Also check lastRun to prevent re-firing when the bot restarts mid-minute
            const alreadyRanThisMinute = jobData.lastRun &&
                getMinuteKey(new Date(jobData.lastRun)) === currentMinuteKey;

            if (checkCronMatch(jobData.schedule, now) && !alreadyRanThisMinute) {
                firedThisMinute.add(jobKey);
                updateCronLastRun(filePath, jobData);

                log(`🔔 Triggering: ${jobData.name}`);

                // Log to inbox that job is starting
                appendToInbox({
                    id: `cron_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    direction: 'system',
                    content: `⚙️ *Scheduled job starting:* ${jobData.name}`,
                    timestamp: Date.now(),
                    telegramChatId: 'system',
                    telegramUserName: 'Scheduler',
                    source: 'system',
                });

                // EXECUTE the job via AI (not just send the task text as a reminder).
                // The AI gets the task description and runs it with full tool access.
                const execResult = await callAgentAPI(
                    jobData.task,
                    isPaired ? telegramConfig.pairedChatId : 'system',
                    'Scheduler',
                    isPaired ? telegramConfig.botToken : null
                );

                const resultText = execResult.success
                    ? execResult.response
                        ? `✅ *${jobData.name}*\n\n${execResult.response.slice(0, 800)}${execResult.response.length > 800 ? '…' : ''}`
                        : `✅ *${jobData.name}* — Completed successfully.`
                    : `⚠️ *${jobData.name}* — ${execResult.error || 'No result returned'}`;

                // Save result to inbox
                appendToInbox({
                    id: `cron_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    direction: 'outgoing',
                    content: resultText,
                    timestamp: Date.now(),
                    telegramChatId: 'system',
                    telegramUserName: 'Skales',
                    source: 'system',
                });

                // Send ONE Telegram message with the result
                if (isPaired) {
                    await sendMessage(telegramConfig.botToken, telegramConfig.pairedChatId, resultText);
                    log(`📱 Job result sent to Telegram: ${jobData.name}`);
                }
            }
        } catch (e) {
            logError(`Failed to process job ${file}`, e);
        }
    }

    // ─── FRIEND MODE ────────────────────────────────────────────
    // Friend Mode is handled exclusively by the TypeScript autonomous-runner
    // (tickFriendMode in autonomous-runner.ts), which uses agentDecide() with
    // noTools=true and writes NO session messages.
    //
    // The old implementation here was REMOVED because it passed the system prompt
    // directly as a user message to callAgentAPI(), causing it to appear as a
    // green user bubble in the Skales chat UI, and because both implementations
    // shared different cooldown states leading to double-sends.
}

// Run scheduler every 10 seconds (checks minute-level cron, but more responsive)
setInterval(() => {
    runScheduler().catch(e => logError('Scheduler error', e));
}, 10000);

// Run once on startup after 5s
setTimeout(() => {
    runScheduler().catch(e => logError('Scheduler startup error', e));
}, 5000);

// ─── Main Polling Loop ───────────────────────────────────────

// ─── Bot Meta Initialization (Commands + Profile Picture) ─────
async function initBotMeta(token) {
    // setMyCommands — registers the commands in the Telegram menu
    try {
        const commands = [
            { command: 'start',       description: 'Skales AI — Welcome & connect' },
            { command: 'pair',        description: 'Connect to Skales: /pair YOUR_CODE' },
            { command: 'status',      description: 'Show current status and model' },
            { command: 'settings',    description: 'Change provider, model, persona' },
            { command: 'skills',      description: 'Toggle all 20+ skills on/off (paginated)' },
            { command: 'tasks',       description: 'View & manage background task queue' },
            { command: 'jobs',        description: 'View & manage scheduled cron jobs' },
            { command: 'autopilot',   description: 'Enable/disable autonomous mode' },
            { command: 'clear',       description: 'Reset conversation context' },
            { command: 'export',      description: 'Download a backup ZIP of your data' },
            { command: 'help',        description: 'Full command reference' },
            { command: 'killswitch',  description: 'Emergency stop — immediately shut Skales down' },
        ];
        const cmdRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands }),
            signal: AbortSignal.timeout(10000),
        });
        const cmdData = await cmdRes.json();
        if (cmdData.ok) log('✅ Telegram commands registered');
        else log(`⚠️ setMyCommands: ${cmdData.description || 'unknown error'}`);
    } catch (e) {
        logError('setMyCommands error', e);
    }

    // setMyProfilePhoto — sets the bot profile picture (Bot API 7.3+)
    try {
        const profilePhotoPath = path.join(__dirname, 'ressources', 'profile.png');
        if (!fs.existsSync(profilePhotoPath)) {
            log('⚠️ Profile picture not found: ressources/profile.png');
            return;
        }
        const photoData = fs.readFileSync(profilePhotoPath);
        const blob = new Blob([photoData], { type: 'image/png' });
        const formData = new FormData();
        formData.append('photo', blob, 'profile.png');
        const photoRes = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(15000),
        });
        const photoData2 = await photoRes.json();
        if (photoData2.ok) log('✅ Bot profile picture set');
        else log(`⚠️ setMyProfilePhoto: ${photoData2.description || 'unknown error'}`);
    } catch (e) {
        logError('setMyProfilePhoto error', e);
    }
}

// ─── node-telegram-bot-api — Polling via library (auto-deletes webhook) ──────
// Using node-telegram-bot-api with polling:true automatically calls
// deleteWebhook before starting getUpdates long-polling.  This is the
// definitive fix for the 409-Conflict / "can send but not receive" bug that
// occurs whenever a webhook was previously registered with BotFather or via
// setWebhook — something that silently blocks all getUpdates calls.
const TelegramBot = require('node-telegram-bot-api');

async function startPolling() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   Skales Telegram Bot — Full Agent Mode  ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    let telegramConfig = loadTelegramConfig();
    if (!telegramConfig?.enabled || !telegramConfig?.botToken) {
        log('⏳ No Telegram bot configured. Waiting...');
        log('   Go to Skales Settings → Integrations → Telegram.');
        while (!telegramConfig?.enabled || !telegramConfig?.botToken) {
            await new Promise(r => setTimeout(r, 10000));
            telegramConfig = loadTelegramConfig();
        }
    }

    log(`✅ Bot: @${telegramConfig.botUsername || telegramConfig.botName || 'your-bot'}`);
    if (telegramConfig.pairedChatId) {
        log(`🔗 Connected to: ${telegramConfig.pairedUserName || telegramConfig.pairedChatId}`);
    } else {
        log(`🔐 Pairing code: ${telegramConfig.pairingCode || 'not set'}`);
        log('   User must send /pair <CODE> in Telegram.');
    }
    log('🧠 Agent mode: ACTIVE (full brain via Dashboard API)');
    console.log('');

    // ── Bot-Initialisierung: Commands + Profilbild ──────────────
    await initBotMeta(telegramConfig.botToken).catch(e => logError('Bot-Meta init error', e));

    // ── Start polling via node-telegram-bot-api ─────────────────
    // polling:true automatically calls deleteWebhook() first, which clears
    // any previously registered webhook and prevents the 409 Conflict error.
    let currentToken = telegramConfig.botToken;

    function createBot(token) {
        const bot = new TelegramBot(token, {
            polling: {
                interval: 300,          // ms between getUpdates calls when queue is empty
                autoStart: true,        // start immediately
                params: {
                    timeout: 30,        // long-poll seconds (keeps connection open)
                    allowed_updates: ['message', 'callback_query', 'edited_message'],
                },
            },
        });

        // ── Incoming text / photo / voice / document messages ──
        bot.on('message', async (msg) => {
            const freshConfig = loadTelegramConfig();
            if (!freshConfig?.botToken) return;
            // Dedup check: skip if we've already processed this message
            const msgId = `msg_${msg.chat.id}_${msg.message_id}`;
            if (processedUpdateIds.has(msgId)) return;
            processedUpdateIds.add(msgId);
            // Cleanup: keep set bounded
            if (processedUpdateIds.size > 1000) {
                const arr = [...processedUpdateIds];
                arr.slice(0, 500).forEach(id => processedUpdateIds.delete(id));
            }
            // Wrap into the update-object shape that processUpdate() expects
            await processUpdate(freshConfig.botToken, { message: msg }, freshConfig).catch(e => {
                logError('Error processing message', e);
            });
        });

        // ── Edited messages (user edits a sent message) ──
        bot.on('edited_message', async (msg) => {
            const freshConfig = loadTelegramConfig();
            if (!freshConfig?.botToken) return;
            // Dedup check: skip if we've already processed this message
            const msgId = `edit_${msg.chat.id}_${msg.message_id}`;
            if (processedUpdateIds.has(msgId)) return;
            processedUpdateIds.add(msgId);
            await processUpdate(freshConfig.botToken, { edited_message: msg }, freshConfig).catch(e => {
                logError('Error processing edited_message', e);
            });
        });

        // ── Inline-keyboard button presses ──
        bot.on('callback_query', async (query) => {
            const freshConfig = loadTelegramConfig();
            if (!freshConfig?.botToken) return;
            // Dedup check: skip if we've already processed this callback
            const callbackId = `cb_${query.id}`;
            if (processedUpdateIds.has(callbackId)) return;
            processedUpdateIds.add(callbackId);
            await processUpdate(freshConfig.botToken, { callback_query: query }, freshConfig).catch(e => {
                logError('Error processing callback_query', e);
            });
        });

        // ── Polling error handler ──
        bot.on('polling_error', (error) => {
            // EFATAL = unrecoverable (bad token, bot deleted); log and let the
            // periodic token-check below handle a restart if the token changes.
            if (error.code === 'EFATAL') {
                logError('Fatal polling error (EFATAL) — bot may have an invalid token', error);
            } else {
                logError('Polling error', error);
            }
        });

        log('✅ Polling started via node-telegram-bot-api (webhook cleared automatically)');
        return bot;
    }

    let bot = createBot(currentToken);

    // ── Periodic token-change detection (every 30 s) ─────────────
    // If the user saves a new token in Settings, stop the old bot
    // instance and start a fresh one with the updated token.
    setInterval(async () => {
        const freshConfig = loadTelegramConfig();
        if (!freshConfig?.botToken) return;
        if (freshConfig.botToken !== currentToken) {
            log('🔄 Bot token changed — restarting polling...');
            try {
                await bot.stopPolling();
            } catch (e) {
                logError('stopPolling during token change', e);
            }
            currentToken = freshConfig.botToken;
            bot = createBot(currentToken);
        }
    }, 30000);

    // Keep the async function alive; all work is done in event handlers above.
    await new Promise(() => { /* never resolves — process stays alive */ });
}

// Graceful shutdown
process.on('SIGINT', () => { console.log(''); log('Bot stopped.'); process.exit(0); });
process.on('SIGTERM', () => { log('Bot stopped.'); process.exit(0); });
process.on('unhandledRejection', (reason) => { logError('Unhandled rejection', reason); });

startPolling().catch(e => {
    logError('FATAL', e);
    process.exit(1);
});
