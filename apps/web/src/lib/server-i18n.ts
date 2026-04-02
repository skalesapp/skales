/**
 * server-i18n.ts
 * Server-side translation helper for Node.js contexts (server actions, API routes).
 * Cannot use the React useTranslation() hook — reads locale files directly from disk.
 *
 * Usage:
 *   import { serverT } from '@/lib/server-i18n';
 *   serverT('system.agent.thinking')
 *   serverT('system.tools.emailSent', { recipient: 'bob@example.com' })
 */

import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './paths';
import { normalizeUiLocale } from './supported-locales';

const localeCache: Record<string, Record<string, any>> = {};

function getUserLocale(): string {
    try {
        const settingsPath = path.join(DATA_DIR, 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return normalizeUiLocale(settings.locale || settings.nativeLanguage);
    } catch {
        return 'en';
    }
}

function loadLocale(code: string): Record<string, any> {
    if (localeCache[code]) return localeCache[code];
    try {
        // Dev / production build: locales are at src/locales/ relative to cwd (apps/web/)
        const localePath = path.join(process.cwd(), 'src', 'locales', `${code}.json`);
        const data = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
        localeCache[code] = data;
        return data;
    } catch {
        // Standalone Next.js build: __dirname points to .next/server/chunks/
        try {
            const altPath = path.join(__dirname, '..', 'locales', `${code}.json`);
            const data = JSON.parse(fs.readFileSync(altPath, 'utf-8'));
            localeCache[code] = data;
            return data;
        } catch {
            // TODO: If neither path resolves at runtime, check:
            //   console.log('[server-i18n] cwd:', process.cwd());
            //   console.log('[server-i18n] __dirname:', __dirname);
            //   Adjust the path above to match the actual locale file location.
            if (code !== 'en') return loadLocale('en');
            return {};
        }
    }
}

function getNestedValue(obj: any, keyPath: string): string | undefined {
    return keyPath.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Translate a dot-notation key using the user's current locale.
 * Falls back to English if the key is missing in the user's locale.
 * Falls back to the key itself if missing in English too.
 *
 * @param key  Dot-notation key, e.g. 'system.tools.emailSent'
 * @param vars Optional interpolation variables matching {{varName}} placeholders
 */
export function serverT(key: string, vars?: Record<string, string | number>): string {
    const locale = getUserLocale();
    const messages = loadLocale(locale);
    let text = getNestedValue(messages, key) || getNestedValue(loadLocale('en'), key) || key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        }
    }
    return text;
}

/**
 * Clear the in-memory locale cache.
 * Call this after the user changes language settings so the next serverT()
 * call picks up the new locale.
 */
export function clearLocaleCache(): void {
    Object.keys(localeCache).forEach(key => delete localeCache[key]);
}
