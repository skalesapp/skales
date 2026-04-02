/**
 * UI locale codes supported by Skales (shared by client i18n and server-i18n).
 * Keep in sync with SUPPORTED_LOCALES in lib/i18n.ts.
 */

export const UI_LOCALE_CODES = ['en', 'de', 'es', 'fr', 'ru', 'zh', 'ja', 'ko', 'pt'] as const;

export type UiLocaleCode = (typeof UI_LOCALE_CODES)[number];

export function normalizeUiLocale(code: string | undefined | null): UiLocaleCode {
    const c = String(code || 'en').toLowerCase().split('-')[0];
    return (UI_LOCALE_CODES as readonly string[]).includes(c) ? (c as UiLocaleCode) : 'en';
}
