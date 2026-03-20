'use server';

import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { unstable_noStore as noStore } from 'next/cache';

import { DATA_DIR } from '@/lib/paths';
const INTEGRATIONS_DIR = path.join(DATA_DIR, 'integrations');
const STATUS_FILE = path.join(INTEGRATIONS_DIR, 'whatsapp-status.json');
const CONTACTS_FILE = path.join(INTEGRATIONS_DIR, 'whatsapp-contacts.json');
const SIGNATURE_FILE = path.join(INTEGRATIONS_DIR, 'whatsapp-signature.json');

const BOT_PORT = 3009;
const BOT_URL = `http://127.0.0.1:${BOT_PORT}`;

function ensureDirs() {
    if (!fs.existsSync(INTEGRATIONS_DIR)) {
        fs.mkdirSync(INTEGRATIONS_DIR, { recursive: true });
    }
}

// ─── Types ────────────────────────────────────────────────────

export type WhatsAppState = 'idle' | 'initializing' | 'loading' | 'qr' | 'authenticated' | 'ready' | 'disconnected' | 'auth_failure' | 'error';

export interface WhatsAppStatus {
    state: WhatsAppState;
    qrCode?: string | null;
    phoneNumber?: string | null;
    pushName?: string | null;
    botPort?: number | null;
    pid?: number | null;
    isReady?: boolean;
    loadingPercent?: number;
    error?: string | null;
    updatedAt?: number;
    readyAt?: number;
}

export interface WhatsAppContact {
    id: string;
    name: string;
    phone: string;       // Digits only, international format without leading +
    permitted: boolean;  // User explicitly permitted Skales to send messages
    addedAt: number;
}

// ─── Status / Connection ──────────────────────────────────────

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
    noStore(); // Never cache - real-time bot status must always be fresh
    ensureDirs();
    // First try the live bot
    try {
        const res = await fetch(`${BOT_URL}/status`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
            const data = await res.json();
            return data as WhatsAppStatus;
        }
    } catch {
        // Bot not running — fall back to status file
    }

    // Fall back to status file
    if (!fs.existsSync(STATUS_FILE)) {
        return { state: 'idle' };
    }
    try {
        return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    } catch {
        return { state: 'idle' };
    }
}

export async function isBotRunning(): Promise<boolean> {
    noStore(); // Never cache - real-time check
    try {
        const res = await fetch(`${BOT_URL}/status`, { cache: 'no-store', signal: AbortSignal.timeout(1500) });
        return res.ok;
    } catch {
        return false;
    }
}

export async function startWhatsAppBot(): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if already running
        const running = await isBotRunning();
        if (running) {
            return { success: true };
        }

        const botPath = path.join(process.cwd(), 'whatsapp-bot.js');
        if (!fs.existsSync(botPath)) {
            return { success: false, error: 'whatsapp-bot.js not found in app directory' };
        }

        // fork() uses Electron's built-in Node runtime — no system PATH lookup needed.
        const child = fork(botPath, [], {
            detached: true,
            silent: true,
            cwd: process.cwd(),
        });
        child.unref();

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Delete only the whatsapp-session directory (Puppeteer/Chrome profile).
 * Used when a stale session from a previous install blocks the QR code from
 * appearing — the bot reads the existing session and skips QR generation.
 * Unlike disconnectWhatsApp(), this preserves contacts and settings.
 */
export async function clearWhatsAppSession(): Promise<{ success: boolean; error?: string }> {
    try {
        const sessionPath = path.join(INTEGRATIONS_DIR, 'whatsapp-session');
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('[Skales WhatsApp] Cleared stale session at:', sessionPath);
        }
        // Also reset the status file so the UI shows 'idle'
        if (fs.existsSync(STATUS_FILE)) {
            fs.writeFileSync(STATUS_FILE, JSON.stringify({ state: 'idle' }));
        }
        return { success: true };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[Skales WhatsApp] clearWhatsAppSession failed:', msg);
        return { success: false, error: msg };
    }
}

export async function disconnectWhatsApp(): Promise<{ success: boolean; error?: string }> {
    try {
        // Try to logout via bot HTTP API (also deletes session folder)
        const res = await fetch(`${BOT_URL}/logout`, {
            method: 'POST',
            signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
            // Still clean up local files even if HTTP logout succeeds
        }
    } catch {
        // Bot not running — just clean up status file
    }

    // Clear all WhatsApp-related files and folders from integrations
    try {
        const integrationsDir = path.join(INTEGRATIONS_DIR);

        // Delete all whatsapp-related files and folders
        const filesToDelete = [
            'whatsapp-session',
            'whatsapp-status.json',
            'whatsapp-contacts.json',
            'whatsapp-inbox.json',
            'whatsapp-signature.json'
        ];

        for (const item of filesToDelete) {
            const itemPath = path.join(integrationsDir, item);
            try {
                if (fs.existsSync(itemPath)) {
                    const stat = fs.statSync(itemPath);
                    if (stat.isDirectory()) {
                        fs.rmSync(itemPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(itemPath);
                    }
                }
            } catch (e) {
                // Silently ignore if file doesn't exist or can't be deleted
            }
        }

        // Also check for any other whatsapp-* entries
        if (fs.existsSync(integrationsDir)) {
            const entries = fs.readdirSync(integrationsDir);
            for (const entry of entries) {
                if (entry.startsWith('whatsapp')) {
                    const entryPath = path.join(integrationsDir, entry);
                    try {
                        const stat = fs.statSync(entryPath);
                        if (stat.isDirectory()) {
                            fs.rmSync(entryPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(entryPath);
                        }
                    } catch (e) {
                        // Silently ignore
                    }
                }
            }
        }
    } catch (e) {
        // Ignore errors during cleanup
    }

    return { success: true };
}

export async function stopWhatsAppBot(): Promise<{ success: boolean }> {
    try {
        await fetch(`${BOT_URL}/stop`, { method: 'POST', signal: AbortSignal.timeout(3000) });
    } catch { }
    return { success: true };
}

// ─── Contacts ─────────────────────────────────────────────────

export async function loadWhatsAppContacts(): Promise<WhatsAppContact[]> {
    ensureDirs();
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

export async function saveWhatsAppContact(
    contact: { name: string; phone: string; permitted: boolean }
): Promise<{ success: boolean; error?: string }> {
    try {
        const contacts = await loadWhatsAppContacts();
        const phone = contact.phone.replace(/[^0-9]/g, '');

        if (!phone || phone.length < 7) {
            return { success: false, error: 'Invalid phone number - use international format (e.g. 4917612345678)' };
        }

        const existing = contacts.find(c => c.phone === phone);
        if (existing) {
            existing.name = contact.name.trim();
            existing.permitted = contact.permitted;
        } else {
            contacts.push({
                id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: contact.name.trim(),
                phone,
                permitted: contact.permitted,
                addedAt: Date.now(),
            });
        }

        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleContactPermission(id: string, permitted: boolean): Promise<{ success: boolean }> {
    try {
        const contacts = await loadWhatsAppContacts();
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            contact.permitted = permitted;
            fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
        }
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function removeWhatsAppContact(id: string): Promise<{ success: boolean }> {
    try {
        const contacts = await loadWhatsAppContacts();
        const filtered = contacts.filter(c => c.id !== id);
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(filtered, null, 2));
        return { success: true };
    } catch {
        return { success: false };
    }
}

// ─── Signature Config ─────────────────────────────────────────

export interface WhatsAppSignatureConfig {
    enabled: boolean;
    text: string; // max 50 chars, plain text only
}

const SIGNATURE_MAX_LENGTH = 50;
const DEFAULT_SIGNATURE = '✨ Skales - your assistant';

/** Strip anything that could be HTML/code/injection */
function sanitizeSignature(raw: string): string {
    return raw
        .replace(/<[^>]*>/g, '')          // strip HTML/XML tags
        .replace(/[{}\[\]<>;`$\\]/g, '')  // strip code chars
        .replace(/\s+/g, ' ')             // collapse whitespace
        .trim()
        .slice(0, SIGNATURE_MAX_LENGTH);
}

export async function loadSignatureConfig(): Promise<WhatsAppSignatureConfig> {
    ensureDirs();
    if (!fs.existsSync(SIGNATURE_FILE)) {
        return { enabled: true, text: DEFAULT_SIGNATURE };
    }
    try {
        const raw = JSON.parse(fs.readFileSync(SIGNATURE_FILE, 'utf-8'));
        return {
            enabled: raw.enabled !== false,
            text: sanitizeSignature(raw.text || DEFAULT_SIGNATURE) || DEFAULT_SIGNATURE,
        };
    } catch {
        return { enabled: true, text: DEFAULT_SIGNATURE };
    }
}

export async function saveSignatureConfig(
    config: { enabled: boolean; text: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        ensureDirs();
        const clean = sanitizeSignature(config.text);
        if (!clean) {
            return { success: false, error: 'Signature text cannot be empty after sanitizing.' };
        }
        fs.writeFileSync(SIGNATURE_FILE, JSON.stringify({
            enabled: config.enabled,
            text: clean,
        }, null, 2));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Sending ─────────────────────────────────────────────────

export async function sendWhatsAppMessage(
    to: string,
    message: string,
    addSignature = true
): Promise<{ success: boolean; error?: string }> {
    try {
        const running = await isBotRunning();
        if (!running) {
            return { success: false, error: 'WhatsApp bot is not running. Start it in Settings → Integrations → WhatsApp.' };
        }

        const status = await getWhatsAppStatus();
        if (!status.isReady && status.state !== 'ready') {
            return { success: false, error: 'WhatsApp is not connected. Please scan the QR code first.' };
        }

        // Build message with optional italic signature (_text_ = italic in WhatsApp)
        let fullMessage = message;
        if (addSignature) {
            const sigCfg = await loadSignatureConfig();
            if (sigCfg.enabled && sigCfg.text) {
                fullMessage = `${message}\n\n_${sigCfg.text}_`;
            }
        }

        const res = await fetch(`${BOT_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message: fullMessage }),
            signal: AbortSignal.timeout(30000),
        });

        const data = await res.json();
        if (!res.ok) {
            return { success: false, error: data.error || `HTTP ${res.status}` };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


export async function sendMediaMessage(
    to: string,
    filePath: string,
    caption?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const running = await isBotRunning();
        if (!running) {
            return { success: false, error: 'WhatsApp bot is not running. Start it in Settings → Integrations → WhatsApp.' };
        }

        const status = await getWhatsAppStatus();
        if (!status.isReady && status.state !== 'ready') {
            return { success: false, error: 'WhatsApp is not connected. Please scan the QR code first.' };
        }

        const res = await fetch(`${BOT_URL}/sendMedia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, filePath, caption }),
            signal: AbortSignal.timeout(60000), // media uploads can take time
        });

        const data = await res.json();
        if (!res.ok) {
            return { success: false, error: data.error || `HTTP ${res.status}` };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── WhatsApp Mode (Send Only / Read & Write) ─────────────────

export type WhatsAppMode = 'sendOnly' | 'readWrite';

const MODE_FILE = path.join(INTEGRATIONS_DIR, 'whatsapp-mode.json');

export async function getWhatsAppMode(): Promise<WhatsAppMode> {
    try {
        if (fs.existsSync(MODE_FILE)) {
            const data = JSON.parse(fs.readFileSync(MODE_FILE, 'utf-8'));
            if (data.mode === 'readWrite') return 'readWrite';
        }
    } catch { /* fallback to default */ }
    return 'sendOnly';
}

export async function setWhatsAppMode(mode: WhatsAppMode): Promise<{ success: boolean; error?: string }> {
    try {
        ensureDirs();
        fs.writeFileSync(MODE_FILE, JSON.stringify({ mode, updatedAt: Date.now() }, null, 2));
        // Notify bot to reload mode if it's running
        try {
            await fetch(`${BOT_URL}/reload-mode`, { method: 'POST', signal: AbortSignal.timeout(1500) });
        } catch { /* bot not running - mode will be picked up on next start */ }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Permitted contact lookup (used by orchestrator) ─────────

export async function findPermittedContact(query: string): Promise<WhatsAppContact | null> {
    const contacts = await loadWhatsAppContacts();
    const q = query.toLowerCase().replace(/[^0-9a-z]/g, '');
    return contacts.find(c =>
        c.permitted && (
            c.phone.includes(q) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        )
    ) || null;
}
