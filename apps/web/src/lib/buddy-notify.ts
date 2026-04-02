/**
 * buddy-notify.ts
 *
 * Lightweight utility to push a short notification message to the Desktop Buddy
 * bubble. Any server-side code (autopilot, task runner, scheduled jobs, etc.)
 * can call `pushBuddyNotification()` and the Buddy widget will display it
 * within ~5 seconds via its polling interval.
 *
 * Storage: ~/.skales-data/buddy-queue.json  (array of { text, ts })
 * The GET /api/buddy-notifications endpoint drains this file atomically.
 */

import fs   from 'fs';
import path from 'path';
import { DATA_DIR } from '@/lib/paths';
import { serverT } from '@/lib/server-i18n';

const QUEUE_FILE = path.join(DATA_DIR, 'buddy-queue.json');
const MAX_QUEUE  = 20; // prevent unbounded growth if buddy window is closed

export interface BuddyNotification {
    text:      string;
    ts:        number;
    isError?:  boolean;   // true → buddy shows friendly "Oops" message + Open Chat button
    // ── v7 rich notification metadata (backward-compatible: all optional) ──
    type?:     string;    // NotificationType from notification-router (e.g. 'meeting-reminder')
    action?: {
        label:    string;   // button text shown in buddy bubble
        route?:   string;   // internal route to navigate to (e.g. '/settings')
        handler?: string;   // named handler the buddy page can invoke
    };
    expiresMs?: number;   // auto-dismiss after N ms (0 = use default 8s)
}

function readQueue(): BuddyNotification[] {
    try {
        if (!fs.existsSync(QUEUE_FILE)) return [];
        return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as BuddyNotification[];
    } catch {
        return [];
    }
}

function writeQueue(queue: BuddyNotification[]): void {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
    } catch { /* non-fatal */ }
}

/**
 * Push a short text notification to the Buddy bubble queue.
 * Call this from task runners, autopilot hooks, cron completions, etc.
 *
 * @example
 *   pushBuddyNotification('✅ Task "Send weekly report" completed.');
 *   pushBuddyNotification('📧 Email sent to john@example.com.');
 */
export function pushBuddyNotification(
    text: string,
    isErrorOrMeta: boolean | { type?: string; action?: BuddyNotification['action']; expiresMs?: number; isError?: boolean } = false,
): void {
    // Backward compatible: second param can be boolean (old API) or metadata object (v7)
    const meta = typeof isErrorOrMeta === 'object' ? isErrorOrMeta : { isError: isErrorOrMeta };

    // Detect raw error/XML/stack traces and replace with friendly message
    const looksLikeRawError = (
        text.includes('<tool_call') ||
        text.includes('Error:') && text.length > 200 ||
        text.includes('at Object.') ||
        text.includes('TypeError:') ||
        text.includes('SyntaxError:')
    );
    const cleanText = looksLikeRawError
        ? serverT('buddy.errorMessage')
        : text.slice(0, 300);
    const entry: BuddyNotification = {
        text: cleanText,
        ts: Date.now(),
        isError: meta.isError || looksLikeRawError,
        ...(meta.type      ? { type: meta.type }           : {}),
        ...(meta.action    ? { action: meta.action }       : {}),
        ...(meta.expiresMs ? { expiresMs: meta.expiresMs } : {}),
    };
    const queue = readQueue();
    queue.push(entry);
    // Keep only the most recent MAX_QUEUE notifications
    writeQueue(queue.slice(-MAX_QUEUE));
}

/** Push an error notification — shows friendly message + "Open Chat" button. */
export function pushBuddyError(rawError?: string): void {
    pushBuddyNotification(rawError || serverT('buddy.errorMessage'), true);
}

/**
 * Drain all pending notifications (returns them and clears the queue).
 * Called exclusively by GET /api/buddy-notifications.
 */
export function drainBuddyNotifications(): BuddyNotification[] {
    const queue = readQueue();
    if (queue.length === 0) return [];
    writeQueue([]);          // atomic clear
    return queue;
}
