/**
 * Skales Telemetry — Anonymous Usage Reporting
 *
 * PRIVACY GUARANTEE:
 * - Opt-in ONLY (telemetry_enabled must be explicitly true in settings)
 * - Never sends: API keys, conversations, personal data, file contents,
 *                stack traces, file paths, or any user-identifiable information
 * - Only sends: app version, OS platform, anonymous UUID, event name
 * - Fire-and-forget: never blocks the app, failures are silently ignored
 *
 * Server: https://skales.app/api/collect.php
 * (Mario: ensure "telemetry" is in the allowed types list in collect.php)
 */

import { DATA_DIR } from './paths';
import fs           from 'fs';
import path         from 'path';
import { APP_VERSION } from './meta';

const TELEMETRY_ENDPOINT = 'https://skales.app/api/collect.php';

// ─── Telemetry event types ────────────────────────────────────────────────────
export type TelemetryEvent =
    | 'app_start'
    | 'tool_used'       // which tool: email, calendar, browser, etc
    | 'session_end'     // duration in minutes
    | 'provider_type'   // openrouter, ollama, openai, etc (NOT the key)
    | 'language'        // ui language: en, de, es, fr
    | 'feature_used'    // buddy, group_chat, voice, lio, skills
    | 'skill_run'       // skill name only
    | 'error'           // error type only, no stack trace
    ;

// ─── Cooldown dedup (1 minute between same event+payload) ─────────────────────
const COOLDOWN_MS = 60_000;
const lastSent: Record<string, number> = {};

// ─── Telemetry event sender ────────────────────────────────────────────────────

export async function sendTelemetryEvent(
    event: string,
    extra?: Record<string, string>
): Promise<void> {
    try {
        // Dedup: skip if same event+payload sent within cooldown window
        const dedupeKey = event + JSON.stringify(extra || {});
        const now = Date.now();
        if (lastSent[dedupeKey] && now - lastSent[dedupeKey] < COOLDOWN_MS) return;
        lastSent[dedupeKey] = now;
        const settingsPath = path.join(DATA_DIR, 'settings.json');
        if (!fs.existsSync(settingsPath)) return;

        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

        // Opt-in only — never send if not explicitly enabled
        if (!settings.telemetry_enabled) return;

        // Generate or reuse anonymous ID — never regenerated once set
        if (!settings.telemetry_anonymous_id) {
            const id =
                (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2) + Date.now().toString(36);

            settings.telemetry_anonymous_id = id;
            try {
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            } catch { /* non-fatal — use the ID for this session only */ }
        }

        const payload = {
            type:         'telemetry',
            version:      APP_VERSION,
            os:           process.platform,
            event,
            anonymous_id: settings.telemetry_anonymous_id,
            // extra fields (e.g. truncated error message) — caller is responsible for
            // ensuring these contain NO personal data
            ...extra,
        };

        // Await so the /api/telemetry/ping route can await completion before responding.
        // Failures are silently swallowed — telemetry must never crash the app.
        //
        // Matches the /api/skales-plus/waitlist pattern that already reaches collect.php:
        //   - cache: 'no-store' — bypass Next.js server-side fetch cache entirely
        //   - AbortSignal.timeout(8000) — don't hang the route handler if collect.php is slow
        console.log('[telemetry] Sending event:', event);
        await fetch(TELEMETRY_ENDPOINT, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            cache:   'no-store',
            // @ts-ignore — AbortSignal.timeout is available in Node.js 17.3+ / Next.js 14
            signal:  AbortSignal.timeout(8_000),
        }).then(res => {
            console.log('[telemetry] collect.php responded:', res.status);
        }).catch(err => {
            console.error('[telemetry] fetch to collect.php failed:', err?.message ?? err);
        });

    } catch {
        // Never crash the app for telemetry
    }
}
