'use server';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fork } from 'child_process';
import { unstable_noStore as noStore } from 'next/cache';

import { DATA_DIR } from '@/lib/paths';
const INTEGRATIONS_DIR = path.join(DATA_DIR, 'integrations');
const TELEGRAM_FILE = path.join(INTEGRATIONS_DIR, 'telegram.json');
const TELEGRAM_INBOX = path.join(INTEGRATIONS_DIR, 'telegram-inbox.json');

function ensureDirs() {
    if (!fs.existsSync(INTEGRATIONS_DIR)) {
        fs.mkdirSync(INTEGRATIONS_DIR, { recursive: true });
    }
}

export interface TelegramConfig {
    botToken: string;
    botName?: string;
    botUsername?: string;
    enabled: boolean;
    pairingCode: string;       // 8-digit code the user must send to the bot via Telegram
    pairedChatId?: string;     // The Telegram chat_id that successfully paired
    pairedUserName?: string;   // The Telegram username that paired
    savedAt: number;
}

export interface TelegramInboxMessage {
    id: string;
    direction: 'incoming' | 'outgoing' | 'system';  // system = internal notification
    content: string;
    telegramChatId?: string;
    telegramUserName?: string;
    timestamp: number;
    source: 'telegram' | 'system';
}

// ─── Config Management ───────────────────────────────────────

export async function saveTelegramConfig(token: string): Promise<{ success: boolean; error?: string; pairingCode?: string }> {
    ensureDirs();
    try {
        // Generate an 8-digit pairing code (100 million combinations vs 1 million for 6-digit)
        const pairingCode = crypto.randomInt(10000000, 99999999).toString();

        const existing = await loadTelegramConfig();
        const config: TelegramConfig = {
            botToken: token.trim(),
            enabled: true,
            pairingCode: existing?.pairingCode || pairingCode,
            pairedChatId: existing?.pairedChatId,
            pairedUserName: existing?.pairedUserName,
            savedAt: Date.now(),
        };
        fs.writeFileSync(TELEGRAM_FILE, JSON.stringify(config, null, 2));
        return { success: true, pairingCode: config.pairingCode };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function loadTelegramConfig(): Promise<TelegramConfig | null> {
    noStore(); // Never cache - config file can change at any time
    ensureDirs();
    if (!fs.existsSync(TELEGRAM_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(TELEGRAM_FILE, 'utf-8'));
    } catch {
        return null;
    }
}

export async function deleteTelegramConfig(): Promise<{ success: boolean }> {
    if (fs.existsSync(TELEGRAM_FILE)) {
        fs.unlinkSync(TELEGRAM_FILE);
    }
    // Also clear inbox
    if (fs.existsSync(TELEGRAM_INBOX)) {
        fs.unlinkSync(TELEGRAM_INBOX);
    }
    return { success: true };
}

export async function regeneratePairingCode(): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
    const config = await loadTelegramConfig();
    if (!config) return { success: false, error: 'No Telegram config found' };

    config.pairingCode = crypto.randomInt(10000000, 99999999).toString();
    config.pairedChatId = undefined;  // Unpair
    config.pairedUserName = undefined;
    fs.writeFileSync(TELEGRAM_FILE, JSON.stringify(config, null, 2));
    return { success: true, pairingCode: config.pairingCode };
}

export async function testTelegramBot(token: string): Promise<{
    success: boolean;
    botName?: string;
    botUsername?: string;
    error?: string;
}> {
    try {
        const cleanToken = token.trim();
        if (!cleanToken) return { success: false, error: 'No bot token provided' };

        const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
            method: 'GET',
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return {
                success: false,
                error: body?.description || `HTTP ${res.status} - invalid token?`,
            };
        }

        const data = await res.json();
        if (!data.ok) {
            return { success: false, error: data.description || 'Telegram API returned ok=false' };
        }

        // Save bot info to config
        const existing = await loadTelegramConfig();
        if (existing) {
            const updated = {
                ...existing,
                botName: data.result.first_name,
                botUsername: data.result.username,
            };
            fs.writeFileSync(TELEGRAM_FILE, JSON.stringify(updated, null, 2));
        }

        return {
            success: true,
            botName: data.result.first_name,
            botUsername: data.result.username,
        };
    } catch (e: any) {
        const msg = e?.name === 'AbortError'
            ? 'Timeout - Telegram unreachable'
            : e?.message || 'Unknown error';
        return { success: false, error: msg };
    }
}

// ─── Sending ──────────────────────────────────────────────────
export async function sendMessage(token: string, chatId: string, text: string): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        if (!res.ok) {
            // Fallback without markdown if it fails (often due to unescaped chars)
            const res2 = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                }),
            });
            if (!res2.ok) return { success: false, error: `Telegram API error: ${res2.status}` };
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Send a GIF/animation via Telegram's sendAnimation endpoint
export async function sendAnimation(token: string, chatId: string, gifUrl: string, caption?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${token}/sendAnimation`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                animation: gifUrl,
                ...(caption ? { caption } : {}),
            }),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { success: false, error: body?.description || `Telegram API error: ${res.status}` };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Inline Keyboard Helpers ─────────────────────────────────

export interface InlineKeyboardButton {
    text: string;
    callback_data: string;
}

/**
 * Send a Telegram message with an inline keyboard (buttons attached below).
 * Falls back to plain text if Markdown parsing fails.
 */
export async function sendMessageWithInlineKeyboard(
    token: string,
    chatId: string,
    text: string,
    keyboard: InlineKeyboardButton[][],
): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload = {
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard },
        };

        let res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            // Retry without Markdown (unescaped special chars can fail parsing)
            const { parse_mode: _pm, ...payloadPlain } = payload;
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadPlain),
            });
            if (!res.ok) return { success: false, error: `Telegram API error: ${res.status}` };
        }

        const data = await res.json();
        return { success: true, messageId: data.result?.message_id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Answer a callback query — required after receiving an inline button press.
 * Clears the "loading spinner" state on the button in Telegram.
 */
export async function answerCallbackQuery(
    token: string,
    callbackQueryId: string,
    text?: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                ...(text ? { text, show_alert: false } : {}),
            }),
        });
        if (!res.ok) return { success: false, error: `Telegram API error: ${res.status}` };
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Send a local file as a Telegram document (e.g. backup ZIP).
 */
export async function sendDocument(
    token: string,
    chatId: string,
    filePath: string,
    caption?: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: `File not found: ${filePath}` };
        }
        const filename = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append(
            'document',
            new Blob([fileBuffer], { type: 'application/octet-stream' }),
            filename,
        );
        if (caption) formData.append('caption', caption.slice(0, 1024));

        const url = `https://api.telegram.org/bot${token}/sendDocument`;
        const res = await fetch(url, { method: 'POST', body: formData });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return {
                success: false,
                error: (body as any)?.description || `Telegram API error: ${res.status}`,
            };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Inbox (Telegram ↔ Dashboard Bridge) ─────────────────────

export async function getTelegramInbox(since?: number): Promise<TelegramInboxMessage[]> {
    noStore(); // Never cache - inbox updates in real time
    ensureDirs();
    if (!fs.existsSync(TELEGRAM_INBOX)) return [];
    try {
        const all: TelegramInboxMessage[] = JSON.parse(fs.readFileSync(TELEGRAM_INBOX, 'utf-8'));
        if (since) {
            return all.filter(m => m.timestamp > since);
        }
        // Return last 50 messages
        return all.slice(-50);
    } catch {
        return [];
    }
}

export async function clearTelegramInbox(): Promise<{ success: boolean }> {
    if (fs.existsSync(TELEGRAM_INBOX)) {
        fs.writeFileSync(TELEGRAM_INBOX, '[]');
    }
    return { success: true };
}

// Get bot info for display
export async function getTelegramBotInfo(): Promise<{
    connected: boolean;
    paired: boolean;
    botName?: string;
    botUsername?: string;
    pairingCode?: string;
    pairedUserName?: string;
    token?: string;
} | null> {
    noStore(); // Never cache - bot info reflects live config state
    const config = await loadTelegramConfig();
    if (!config) return null;

    const token = config.botToken;
    const maskedToken = token.length > 10
        ? token.slice(0, 10) + '***' + token.slice(-4)
        : '***';

    return {
        connected: config.enabled,
        paired: !!config.pairedChatId,
        botName: config.botName,
        botUsername: config.botUsername,
        pairingCode: config.pairingCode,
        pairedUserName: config.pairedUserName,
        token: maskedToken,
    };
}

// ─── Bot Process Management ───────────────────────────────────
// telegram-bot.js is a long-polling process that forwards Telegram messages
// to /api/chat/telegram. It writes its PID to a lock file so we can tell if
// it is running without having to keep a handle to the child process.
//
// Bot script location priority:
//   1. SKALES_WEB_DIR env var  — set by electron/main.js to the real apps/web path
//      (necessary because in the packaged build, process.cwd() is the Next.js
//       standalone directory, not the apps/web source root)
//   2. process.cwd() — works correctly in development (npm run dev)
const LOCK_FILE = path.join(DATA_DIR, '.telegram-bot.lock');

export async function startTelegramBot(): Promise<{ success: boolean; error?: string }> {
    try {
        // Bail out early if already running
        const running = await getTelegramBotRunning();
        if (running) return { success: true };

        // Resolve the bot script path.
        // In a packaged build, prefer the pre-bundled version (telegram-bot.bundled.js)
        // which is self-contained and requires no extraResources node_modules.
        // Fall back to the source file in development (node_modules available locally).
        const webDir = process.env.SKALES_WEB_DIR || process.cwd();
        const botPathBundled = path.join(webDir, 'telegram-bot.bundled.js');
        const botPathSource  = path.join(webDir, 'telegram-bot.js');
        const botPath = fs.existsSync(botPathBundled) ? botPathBundled : botPathSource;
        if (!fs.existsSync(botPath)) {
            console.error('[Skales Telegram] telegram-bot.js not found at:', botPath);
            return { success: false, error: `telegram-bot.js not found at: ${botPath}` };
        }

        // fork() uses Electron's built-in Node runtime — no system PATH lookup needed.
        // spawn('node', ...) breaks for end users without Node.js installed.
        const child = fork(botPath, [], {
            detached: true,
            silent: true,
            cwd: webDir,
            env: {
                ...process.env,
                SKALES_DATA_DIR: DATA_DIR,
                // Pass the actual bound port so telegram-bot.js never hardcodes 3000.
                // process.env.PORT is set by electron/main.js before spawning Next.js.
                SKALES_PORT: process.env.PORT || '3000',
            },
        });
        child.unref();

        console.log('[Skales Telegram] Bot spawned from:', botPath);
        return { success: true };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[Skales Telegram] Failed to start bot:', msg);
        return { success: false, error: msg };
    }
}

export async function getTelegramBotRunning(): Promise<boolean> {
    noStore(); // Never cache - process liveness check must be real-time
    try {
        if (!fs.existsSync(LOCK_FILE)) return false;
        const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
        if (isNaN(pid)) return false;
        // process.kill(pid, 0) throws if process doesn't exist
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

// ─── Purge / Reset ───────────────────────────────────────────
export async function purgeTelegramData(): Promise<{ success: boolean }> {
    const filesToDelete = [
        'pending-approvals',
        'telegram-bot-error.log',
        '.telegram-bot.lock',
    ];
    const integrationFiles = [
        'telegram.json',
        'telegram-inbox.json',
        'telegram-pending-approvals.json',
        'telegram-session.json',
    ];
    // Delete top-level data files
    for (const f of filesToDelete) {
        const p = path.join(DATA_DIR, f);
        try {
            if (fs.existsSync(p)) {
                const stat = fs.statSync(p);
                if (stat.isDirectory()) fs.rmSync(p, { recursive: true });
                else fs.unlinkSync(p);
            }
        } catch { /* non-fatal */ }
    }
    // Delete integration files
    for (const f of integrationFiles) {
        const p = path.join(INTEGRATIONS_DIR, f);
        try {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch { /* non-fatal */ }
    }
    return { success: true };
}
