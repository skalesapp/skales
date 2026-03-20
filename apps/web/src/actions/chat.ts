'use server';

import path from 'path';
import fs from 'fs';

// ============================================================
// Skales Chat Server Actions — v2.0
// ============================================================
// Multi-provider support: OpenRouter, OpenAI, Anthropic, Google, Ollama
// Session persistence in .skales-sessions/
// English UI, clean error handling
// ============================================================

import { DATA_DIR } from '@/lib/paths';
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');

// Ensure data directories exist
function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// ─── Types ───────────────────────────────────────────────────

export type Provider = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'groq' | 'mistral' | 'deepseek' | 'xai' | 'together' | 'custom';


export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enabled: boolean;
}

export interface SkalesSettings {
    activeProvider: Provider;
    persona: string;
    providers: Record<Provider, ProviderConfig>;
    systemPrompt?: string;
    nativeLanguage?: string; // User's preferred language (e.g. 'en', 'de', 'fr') — tells Skales which language to use
    // UI settings
    locale?: string;      // UI language code (e.g. 'en', 'de', 'es', 'fr')
    theme?: string;       // 'dark' | 'light' | 'system'
    buddy_skin?: string;  // Buddy avatar skin ID
    // Telemetry (opt-in only)
    telemetry_enabled?: boolean;
    telemetry_anonymous_id?: string;
    // Active User Behavior (Skales Proactive Mode)
    activeUserBehavior?: {
        enabled: boolean;
        frequency: 'low' | 'medium' | 'high';
        quietHoursStart: number; // 0-23
        quietHoursEnd: number;   // 0-23
        channels: {
            telegram: boolean;
            browser: boolean;
            dashboard?: boolean;  // v7: show in Dashboard Chat
            whatsapp?: boolean;   // v7: reserved (Coming Soon)
        };
        // v7 Buddy Intelligence extensions
        proactiveEnabled?: boolean;    // master toggle for rule-based proactive notifications (default: true)
        notificationTypes?: Record<string, boolean>;  // per-type enable/disable (e.g. { 'meeting-reminder': true, 'idle-checkin': false })
    };
    // GIF / Sticker Integration
    gifIntegration?: {
        enabled: boolean;
        provider: 'klipy' | 'giphy' | 'tenor'; // which API to use
        apiKey: string;
        autoSend: boolean; // Skales can proactively send GIFs
    };
    // File System Access (legacy toggle — kept for backward compatibility with computer-use.ts)
    // 'workspace' = Skales stays inside its own .skales-data/workspace sandbox (safe default)
    // 'full'      = Skales can read/write anywhere on the local drive (system paths still blocked)
    fileSystemAccess?: 'workspace' | 'full';
    // File Access Mode (new, fine-grained — supersedes the simple toggle above)
    // 'workspace_only' = sandbox only (maps to fileSystemAccess: 'workspace')
    // 'unrestricted'   = full disk access (maps to fileSystemAccess: 'full')
    // 'custom'         = allow only paths listed in allowedFolders
    fileAccessMode?: 'workspace_only' | 'unrestricted' | 'custom';
    allowedFolders?: string[]; // absolute paths; effective only when fileAccessMode === 'custom'
    // Tavily Web Search API
    tavilyApiKey?: string;
    // TTS Configuration
    ttsConfig?: {
        provider: 'default' | 'local' | 'elevenlabs' | 'azure';
        localTtsUrl?: string;
        elevenlabsApiKey?: string;
        elevenlabsVoiceId?: string;  // e.g. "21m00Tcm4TlvDq8ikWAM" (Rachel)
        azureSpeechKey?: string;
        azureSpeechRegion?: string;  // e.g. "eastus"
        azureVoiceName?: string;     // e.g. "en-US-JennyNeural"
    };
    // Task / Multi-Agent timeout settings
    // taskTimeoutSeconds: max wall-clock time for a single sub-agent task (default 300 = 5 min)
    // High-priority tasks always get 2× this value automatically.
    taskTimeoutSeconds?: number; // default: 300
    // Safety Mode — controls how dangerous shell/file commands are handled
    // 'safe'         (default) — risky commands blocked outright
    // 'advanced'     — risky commands ask for Approve/Reject before execution
    // 'unrestricted' — no blocking (user takes full responsibility)
    safetyMode?: 'safe' | 'advanced' | 'unrestricted';
    // Autonomous Mode — background agent heartbeat processes tasks every 5 minutes
    // When false (default), the heartbeat is stopped and no tasks run proactively.
    isAutonomousMode?: boolean;
    // Google Places API key
    googlePlacesApiKey?: string;
    // Replicate API token (BYOK — gives access to 50+ image/video models)
    replicate_api_token?: string;
    // Image/video generation provider preference ('google' | 'replicate' | 'local')
    imageGenProvider?: 'google' | 'replicate' | 'local';
    // Local image generation endpoint URL
    localImageGenUrl?: string;
    // Local STT (Speech-to-Text) endpoint URL
    localSttUrl?: string;
    // Custom OpenAI-compatible endpoint — whether to enable tool/function calling
    // Some local models (llama.cpp, LM Studio, etc.) don't support the tools array
    customEndpointToolCalling?: boolean;
    // Custom endpoint — vision support toggle (user declares endpoint accepts image content)
    customEndpointVisionSupport?: boolean;
    // Custom endpoint — TTS base URL (optional, for text-to-speech via the custom endpoint)
    customEndpointTtsUrl?: string;
    // Custom endpoint — request timeout in seconds (default: 30)
    customEndpointTimeout?: number;
    // Skills — enabled/disabled flags for built-in skill modules
    skills?: {
        systemMonitor?: { enabled: boolean };
        localFileChat?: { enabled: boolean };
        webhook?: { enabled: boolean };
        googleCalendar?: { enabled: boolean };
        discord?: { enabled: boolean };
        // Browser Control skill — requires a one-time Chromium download
        browserControl?: { enabled: boolean };
        [key: string]: { enabled: boolean } | undefined;
    };
    // Browser Control vision + approval settings
    browserControlConfig?: {
        visionProvider: 'google' | 'openai' | 'anthropic' | 'openrouter';
        visionApiKey: string;
        visionModel: string;
        autoApproveNavigation: boolean;
        requireApprovalForLogin: boolean;
        requireApprovalForForms: boolean;
        requireApprovalForPurchases: boolean;
        requireApprovalForDownloads: boolean;
        maxSessionMinutes: number;
        installed?: boolean;
    };
}

// ─── Default Settings ────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp?: number;
    /** Message origin — written to session file so polling can distinguish sources */
    source?: 'browser' | 'buddy';
    // Tool calling support
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
    display_message?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    provider: Provider;
    model: string;
    agentId?: string; // Which agent this session belongs to
    createdAt: number;
    updatedAt: number;
}

const DEFAULT_SETTINGS: SkalesSettings = {
    activeProvider: 'openrouter',
    persona: 'default',
    activeUserBehavior: {
        enabled: true,
        frequency: 'medium',
        quietHoursStart: 22, // 10 PM
        quietHoursEnd: 7,    // 7 AM
        channels: { telegram: true, browser: true }
    },
    providers: {
        openrouter: {
            apiKey: '',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'openai/gpt-3.5-turbo',
            enabled: true,
        },
        openai: {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            enabled: false,
        },
        anthropic: {
            apiKey: '',
            baseUrl: 'https://api.anthropic.com/v1',
            model: 'claude-sonnet-4-20250514',
            enabled: false,
        },
        google: {
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.0-flash',
            enabled: false,
        },
        ollama: {
            apiKey: 'ollama',
            baseUrl: 'http://localhost:11434/v1',
            model: 'llama3.2',
            enabled: false,
        },
        groq: {
            apiKey: '',
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'llama-3.3-70b-versatile',
            enabled: false,
        },
        mistral: {
            apiKey: '',
            baseUrl: 'https://api.mistral.ai/v1',
            model: 'mistral-large-latest',
            enabled: false,
        },
        deepseek: {
            apiKey: '',
            baseUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat',
            enabled: false,
        },
        xai: {
            apiKey: '',
            baseUrl: 'https://api.x.ai/v1',
            model: 'grok-2-latest',
            enabled: false,
        },
        together: {
            apiKey: '',
            baseUrl: 'https://api.together.xyz/v1',
            model: 'meta-llama/Llama-3-70b-chat-hf',
            enabled: false,
        },
        custom: {
            apiKey: '',
            baseUrl: '',
            model: '',
            enabled: false,
        },
    },
};


// ─── Persona System Prompts ──────────────────────────────────

const PERSONA_PROMPTS: Record<string, string> = {
    default: `You are Skales, a friendly and smart AI assistant. You help with everything — daily life, work, planning, creativity. You are direct, helpful, and have a good sense of humor. Keep responses concise but informative. Respond in the user's language.`,
    entrepreneur: `You are Skales in Entrepreneur mode. You're a sharp business advisor who helps with strategy, marketing, finance, and growth. You think in terms of ROI, market fit, and execution speed. Be direct, data-driven, and actionable.`,
    family: `You are Skales in Family mode. You're a warm, patient helper for everyday family tasks — recipes, homework help, scheduling, health tips, parenting advice. Keep things simple and friendly, suitable for all ages.`,
    coder: `You are Skales in Coder mode. You're a senior software engineer who writes clean, efficient code. You explain technical concepts clearly, suggest best practices, and help debug issues. Use code blocks with syntax highlighting.`,
    student: `You are Skales in Student mode. You're a patient tutor who explains concepts step by step. You encourage curiosity, break down complex topics, and use examples. Help with homework, exam prep, and research.`,
};

// ─── Settings Load/Save ──────────────────────────────────────

export async function loadSettings(): Promise<SkalesSettings> {
    ensureDirs();
    try {
        // Also check legacy settings file
        const legacyFile = path.join(process.cwd(), '.skales-settings.json');

        if (fs.existsSync(SETTINGS_FILE)) {
            const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));

            // ── Auto-migrate deprecated Google models ──
            const DEPRECATED_GOOGLE_MODELS: Record<string, string> = {
                'gemini-2.0-flash-exp': 'gemini-2.0-flash',
                'gemini-2.5-pro': 'gemini-2.0-flash',
                'gemini-1.5-flash': 'gemini-2.0-flash',
            };
            const gModel = raw.providers?.google?.model;
            if (gModel && DEPRECATED_GOOGLE_MODELS[gModel]) {
                console.log(`[Skales] Auto-migrating Google model "${gModel}" → "${DEPRECATED_GOOGLE_MODELS[gModel]}"`);
                raw.providers.google.model = DEPRECATED_GOOGLE_MODELS[gModel];
                // Persist the fix so it doesn't re-trigger every load
                try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(raw, null, 2)); } catch { /* ignore */ }
            }

            return { ...DEFAULT_SETTINGS, ...raw, providers: { ...DEFAULT_SETTINGS.providers, ...raw.providers } };
        }

        // Migrate from legacy settings
        if (fs.existsSync(legacyFile)) {
            const legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf-8'));
            const migrated: SkalesSettings = {
                ...DEFAULT_SETTINGS,
                activeProvider: legacy.provider || 'openrouter',
                providers: {
                    ...DEFAULT_SETTINGS.providers,
                    openrouter: {
                        ...DEFAULT_SETTINGS.providers.openrouter,
                        apiKey: legacy.apiKey || '',
                        model: legacy.model || 'openai/gpt-3.5-turbo',
                        enabled: true,
                    },
                    ollama: {
                        ...DEFAULT_SETTINGS.providers.ollama,
                        baseUrl: legacy.localUrl || 'http://localhost:11434/v1',
                        enabled: legacy.provider === 'ollama',
                    },
                },
            };
            // Save migrated settings
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(migrated, null, 2));
            return migrated;
        }
    } catch (e) {
        console.warn('[Skales] Could not load settings:', e);
    }
    return DEFAULT_SETTINGS;
}

export async function saveAllSettings(newSettings: Partial<SkalesSettings>) {
    ensureDirs();
    try {
        const current = await loadSettings();
        const merged: SkalesSettings = {
            ...current,
            ...newSettings,
            providers: newSettings.providers
                ? Object.keys({ ...current.providers, ...newSettings.providers }).reduce((acc, key) => {
                    acc[key as Provider] = { ...(current.providers[key as Provider] || {}), ...(newSettings.providers?.[key as Provider] || {}) };
                    return acc;
                  }, {} as typeof current.providers)
                : current.providers,
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
        return { success: true, settings: merged };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveApiKey(provider: Provider, key: string) {
    const settings = await loadSettings();
    settings.providers[provider] = {
        ...settings.providers[provider],
        apiKey: key,
        enabled: true,
    };
    return saveAllSettings(settings);
}

// ─── Provider API Call ───────────────────────────────────────

async function callProvider(
    provider: Provider,
    config: ProviderConfig,
    messages: { role: string; content: string }[]
): Promise<{ success: boolean; response?: string; error?: string; tokensUsed?: number }> {

    // Special case: Anthropic uses a different API format
    if (provider === 'anthropic') {
        return callAnthropic(config, messages);
    }

    // Special case: Google Gemini
    if (provider === 'google') {
        return callGoogle(config, messages);
    }

    // OpenAI-compatible: OpenRouter, OpenAI, Ollama, custom, etc.
    let baseUrl = config.baseUrl || DEFAULT_SETTINGS.providers[provider].baseUrl!;
    // For custom endpoints, normalise the base URL — append /v1 if the user didn't include it
    if (provider === 'custom' && baseUrl) {
        const trimmed = baseUrl.trim().replace(/\/$/, '');
        baseUrl = trimmed.endsWith('/v1') ? trimmed : trimmed + '/v1';
    }
    const model = config.model || DEFAULT_SETTINGS.providers[provider].model!;
    // Bug 30: Only send Authorization header when there is actually an API key.
    // Sending "Bearer " (empty) causes KoboldCpp / vLLM / LM Studio to reject
    // the request with 401 even though they don't require authentication at all.
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey && config.apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://skales.app';
        headers['X-Title'] = 'Skales';
    }
    // OpenClaw gateway: pass agent ID header for routing
    if (model.startsWith('openclaw:')) {
        headers['x-openclaw-agent-id'] = model.replace('openclaw:', '');
    }

    // Bug 29: Custom/local endpoints (Ollama, KoboldCpp, vLLM, LM Studio) can take
    // 5-30 s on cold starts. No timeout was set, so this path could hang forever.
    // Read user-configured timeout for custom endpoints; 15s for cloud providers.
    let timeoutMs = 15_000;
    if (provider === 'custom' || provider === 'ollama') {
        try {
            const _s = await loadSettings();
            timeoutMs = ((_s as any).customEndpointTimeout || 120) * 1000;
        } catch { timeoutMs = 120_000; }
    }
    // Pass user identifier for OpenClaw gateway session persistence
    const isOpenClaw = model.startsWith('openclaw:');
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 2048,
            temperature: 0.7,
            ...(isOpenClaw ? { user: require('os').userInfo().username || 'user' } : {}),
        }),
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) return { success: false, error: 'Invalid API key. Please check your key in Settings.' };
        if (response.status === 429) return { success: false, error: 'Rate limited. Please wait a moment and try again.' };
        if (response.status === 402) return { success: false, error: 'Insufficient credits. Please top up your account.' };
        return { success: false, error: `API Error (${response.status}): ${errorBody.slice(0, 200)}` };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response received.';
    const tokensUsed = data.usage?.total_tokens || 0;
    return { success: true, response: reply, tokensUsed };
}

async function callAnthropic(
    config: ProviderConfig,
    messages: { role: string; content: string }[]
): Promise<{ success: boolean; response?: string; error?: string; tokensUsed?: number }> {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey || '',
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: config.model || 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemMsg,
            messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) return { success: false, error: 'Invalid Anthropic API key.' };
        if (response.status === 429) return { success: false, error: 'Rate limited. Please wait.' };
        return { success: false, error: `Anthropic Error (${response.status}): ${errorBody.slice(0, 200)}` };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'No response received.';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return { success: true, response: reply, tokensUsed };
}

async function callGoogle(
    config: ProviderConfig,
    messages: { role: string; content: string }[]
): Promise<{ success: boolean; response?: string; error?: string; tokensUsed?: number }> {
    const model = config.model || 'gemini-2.0-flash';
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemMsg }] },
                contents: chatMessages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
            }),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) return { success: false, error: 'Invalid Google API key. Please check your key in Settings.' };
        if (response.status === 429) return { success: false, error: 'Google API rate limited. Please wait a moment.' };
        if (response.status === 400) return { success: false, error: 'Invalid Google API key or request.' };
        // 404 = model not found (e.g. deprecated or experimental model)
        // Auto-retry with stable fallback model
        if (response.status === 404 && model !== 'gemini-2.0-flash') {
            console.warn(`[Skales] Google model "${model}" not found (404). Retrying with gemini-2.0-flash...`);
            const fallbackResp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemMsg }] },
                        contents: chatMessages.map(m => ({
                            role: m.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: m.content }],
                        })),
                        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
                    }),
                }
            );
            if (fallbackResp.ok) {
                const fallbackData = await fallbackResp.json();
                const reply = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
                const tokensUsed = (fallbackData.usageMetadata?.promptTokenCount || 0) + (fallbackData.usageMetadata?.candidatesTokenCount || 0);
                return { success: true, response: reply, tokensUsed };
            }
        }
        return { success: false, error: `Google Error (${response.status}): ${errorBody.slice(0, 200)}` };
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
    return { success: true, response: reply, tokensUsed };
}

// ─── Test Provider Connection ────────────────────────────────

export async function testProvider(provider: Provider, apiKey?: string, baseUrl?: string) {
    try {
        const settings = await loadSettings();
        const config: ProviderConfig = {
            ...settings.providers[provider],
            ...(apiKey !== undefined ? { apiKey } : {}),
            ...(baseUrl !== undefined ? { baseUrl } : {}),
        };

        if (provider === 'ollama') {
            // Actually test if Ollama server is reachable and responding
            const url = (config.baseUrl || 'http://localhost:11434/v1').replace('/v1', '');
            let res: Response;
            try {
                res = await fetch(`${url}/api/tags`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(4000),
                });
            } catch (fetchErr: any) {
                // Connection refused, timeout, or network error
                const msg = fetchErr?.name === 'AbortError'
                    ? 'Ollama timeout — server not responding. Is it running?'
                    : 'Cannot reach Ollama. Start Ollama app or run: ollama serve';
                return { success: false, error: msg };
            }
            if (!res.ok) {
                return { success: false, error: `Ollama returned HTTP ${res.status}. Try restarting Ollama.` };
            }
            let data: any;
            try { data = await res.json(); } catch { data = {}; }
            const models: string[] = data.models?.map((m: any) => m.name) || [];
            if (models.length === 0) {
                return { success: true, message: `Ollama connected but no models installed. Run: ollama pull llama3.2` };
            }
            return { success: true, message: `Ollama connected! Models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? ` (+${models.length - 3} more)` : ''}`, models };
        }

        // For cloud providers, send a tiny test message
        const result = await callProvider(provider, config, [
            { role: 'user', content: 'Say "Connected!" in one word.' }
        ]);

        if (result.success) {
            return { success: true, message: `Connected to ${provider}!` };
        }
        return { success: false, error: result.error };
    } catch (e: any) {
        if (e.cause?.code === 'ECONNREFUSED') {
            return { success: false, error: 'Connection refused. Is the service running?' };
        }
        return { success: false, error: e.message || 'Connection failed.' };
    }
}

// ─── Session Management ──────────────────────────────────────

function getSessionPath(id: string) {
    return path.join(SESSIONS_DIR, `${id}.json`);
}

// Migrate old sessions with agentId 'skales' to the current OpenClaw default agent
export async function migrateSessionsToDefaultAgent(newDefaultId: string): Promise<number> {
    ensureDirs();
    if (!newDefaultId || newDefaultId === 'skales') return 0;
    let migrated = 0;
    try {
        const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
        for (const f of files) {
            try {
                const filePath = path.join(SESSIONS_DIR, f);
                const raw = fs.readFileSync(filePath, 'utf-8');
                if (!raw || raw.trim().length === 0) continue;
                const data = JSON.parse(raw);
                if (data.agentId === 'skales' || !data.agentId) {
                    data.agentId = newDefaultId;
                    const tmpPath = filePath + '.tmp';
                    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
                    fs.renameSync(tmpPath, filePath);
                    migrated++;
                }
            } catch { /* skip corrupt files */ }
        }
    } catch (e) {
        console.error('[Skales] Session migration error:', e);
    }
    return migrated;
}

export async function createSession(title?: string, agentId?: string): Promise<ChatSession> {
    ensureDirs();
    const settings = await loadSettings();
    const providerConfig = settings.providers[settings.activeProvider];
    // Resolve default agent ID dynamically from OpenClaw config
    let resolvedAgentId = agentId;
    if (!resolvedAgentId) {
        try {
            const { getDefaultAgent } = await import('./agents');
            const def = await getDefaultAgent();
            resolvedAgentId = def?.id || 'skales';
        } catch { resolvedAgentId = 'skales'; }
    }
    const session: ChatSession = {
        id: `session_${Date.now()}_${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 12)}`,
        title: title || 'New Chat',
        messages: [],
        provider: settings.activeProvider,
        model: providerConfig.model || 'unknown',
        agentId: resolvedAgentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    fs.writeFileSync(getSessionPath(session.id), JSON.stringify(session, null, 2));
    return session;
}

// List sessions filtered by agentId
export async function listSessionsByAgent(agentId: string): Promise<{ id: string; title: string; updatedAt: number; messageCount: number }[]> {
    const allSessions = await listSessions();
    const result: { id: string; title: string; updatedAt: number; messageCount: number }[] = [];
    for (const s of allSessions) {
        try {
            const filePath = getSessionPath(s.id);
            if (!fs.existsSync(filePath)) continue;
            const raw = fs.readFileSync(filePath, 'utf-8');
            if (!raw || raw.trim().length === 0) continue;
            const session = JSON.parse(raw) as ChatSession;
            const sessionAgent = session.agentId || 'skales';
            if (sessionAgent === agentId) {
                result.push(s);
            }
        } catch {
            // Skip this session silently
        }
    }
    return result;
}

export async function loadSession(id: string): Promise<ChatSession | null> {
    ensureDirs();
    try {
        const filePath = getSessionPath(id);
        // Clean up any leftover .tmp file from a previous interrupted write
        const tmpPath = filePath + '.tmp';
        if (fs.existsSync(tmpPath)) {
            try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        }
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (!raw || raw.trim().length === 0) {
            console.warn(`[Skales] Session file empty: ${id}`);
            return null;
        }
        const parsed = JSON.parse(raw);
        // Basic validation
        if (!parsed.id || !Array.isArray(parsed.messages)) {
            console.warn(`[Skales] Session file invalid structure: ${id}`);
            return null;
        }
        return parsed as ChatSession;
    } catch (e) {
        console.error(`[Skales] Could not load session ${id}:`, e);
    }
    return null;
}

// ─── Active Session Persistence ──────────────────────────────
// Stores the last active session ID so it can be restored on page reload
const ACTIVE_SESSION_FILE = path.join(DATA_DIR, 'active-session.json');

export async function getActiveSessionId(): Promise<string | null> {
    try {
        if (fs.existsSync(ACTIVE_SESSION_FILE)) {
            const data = JSON.parse(fs.readFileSync(ACTIVE_SESSION_FILE, 'utf-8'));
            return data.sessionId || null;
        }
    } catch { }
    return null;
}

export async function setActiveSessionId(sessionId: string | null): Promise<void> {
    ensureDirs();
    try {
        fs.writeFileSync(ACTIVE_SESSION_FILE, JSON.stringify({ sessionId, updatedAt: Date.now() }));
    } catch { }
}

const MAX_SAVED_MESSAGES = 10000; // keep last N messages per session on disk (no practical limit)

export async function saveSession(session: ChatSession) {
    ensureDirs();
    session.updatedAt = Date.now();

    // Auto-title from first user message
    if (session.title === 'New Chat' && session.messages.length > 0) {
        const firstUserMsg = session.messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            session.title = firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
        }
    }

    // --- Trim to prevent disk / body size blow-up ---
    const MAX_TOOL_CONTENT = 8000; // max chars per tool result stored on disk

    // 1. Strip base64 image data from message content (images are display-only, not needed for history)
    //    Also truncate oversized tool results (e.g. read_file on a large file)
    const cleanMessages = session.messages.map(m => {
        // Truncate tool result content that is too large (e.g. read_file on a big file)
        if (m.role === 'tool' && typeof m.content === 'string' && m.content.length > MAX_TOOL_CONTENT) {
            return { ...m, content: m.content.slice(0, MAX_TOOL_CONTENT) + '\n[...truncated for storage]' };
        }
        if (Array.isArray(m.content)) {
            return {
                ...m,
                content: m.content.map((part: any) => {
                    if (part?.type === 'image_url' && typeof part?.image_url?.url === 'string' && part.image_url.url.startsWith('data:')) {
                        return { type: 'image_url', image_url: { url: '[image removed for storage]' } };
                    }
                    return part;
                }),
            };
        }
        // Also strip inline base64 from string content (e.g. embedded data URIs)
        if (typeof m.content === 'string' && m.content.includes('data:image/')) {
            return { ...m, content: m.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, '[image]') };
        }
        return m;
    });

    // 2. Keep only the last MAX_SAVED_MESSAGES messages
    const trimmedMessages = cleanMessages.slice(-MAX_SAVED_MESSAGES);

    const toSave = { ...session, messages: trimmedMessages };
    const targetPath = getSessionPath(session.id);
    const tmpPath = targetPath + '.tmp';
    // Atomic write: write to .tmp first, then rename — prevents corruption on crash/restart
    fs.writeFileSync(tmpPath, JSON.stringify(toSave, null, 2));
    fs.renameSync(tmpPath, targetPath);
}

export async function listSessions(): Promise<{ id: string; title: string; updatedAt: number; messageCount: number; agentId?: string }[]> {
    ensureDirs();
    try {
        const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
        const sessions: { id: string; title: string; updatedAt: number; messageCount: number; agentId?: string }[] = [];
        for (const f of files) {
            try {
                const raw = fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf-8');
                if (!raw || raw.trim().length === 0) continue; // skip empty files
                const data = JSON.parse(raw);
                // Validate required fields — skip corrupt or incomplete sessions
                if (!data.id || typeof data.id !== 'string') continue;
                if (!Array.isArray(data.messages)) continue;
                // Ensure the file-based ID matches the internal ID (detect renames/mismatches)
                const expectedFilename = `${data.id}.json`;
                if (f !== expectedFilename) continue; // skip mismatched files (e.g. .BACKUP.json)
                sessions.push({
                    id: data.id,
                    title: data.title || 'Untitled',
                    updatedAt: data.updatedAt || 0,
                    messageCount: data.messages.length,
                    agentId: data.agentId,
                });
            } catch {
                // Skip this file — don't let one bad file break the whole list
                console.warn(`[Skales] Skipping corrupt session file: ${f}`);
            }
        }
        return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
        console.error('[Skales] listSessions error:', e);
        return [];
    }
}

export async function deleteSession(id: string) {
    const filePath = getSessionPath(id);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
    }
    return { success: false, error: 'Session not found.' };
}

// ─── Process Chat Message ────────────────────────────────────

export async function processMessage(
    message: string,
    history: ChatMessage[] = [],
    options?: {
        sessionId?: string;
        provider?: Provider;
        model?: string;
        /** Extra text appended to the full system prompt (used by buddy-chat). */
        systemPromptSuffix?: string;
        /**
         * Source label written into the session file with each saved message.
         * 'buddy'   → came from the Desktop Buddy overlay (polling detects + displays it)
         * 'browser' → typed directly in the main chat window (already displayed — polling skips it)
         * Defaults to 'browser' when omitted so existing callers are unaffected.
         */
        msgSource?: 'browser' | 'buddy';
    }
) {
    // ── Slash-command killswitch: /stop  /killswitch  /kill ──────────────────
    // Intercept BEFORE any AI call so an agent that keeps calling processMessage
    // is always stopped immediately, even if it ignores conversational messages.
    const trimmed = message.trim().toLowerCase();
    if (trimmed === '/stop' || trimmed === '/killswitch' || trimmed === '/kill') {
        try {
            const { executeKillswitch } = await import('@/lib/killswitch');
            executeKillswitch({ reason: 'manual_chat', triggeredBy: 'chat_command', details: `User typed: ${message.trim()}` });
        } catch { /* non-fatal if killswitch module unavailable */ }
        return {
            success: true,
            response: '🛑 **Killswitch triggered.** All agent activity has been stopped. You can restart via Settings → Autopilot.',
        };
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
        const settings = await loadSettings();
        let provider = options?.provider || settings.activeProvider;
        let providerConfig = { ...settings.providers[provider] };

        if (options?.model) {
            providerConfig.model = options.model;
        }

        // Intelligent Fallback System: Check environment variable as fallback
        if (!providerConfig.apiKey) {
            const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
            if (envKey) providerConfig.apiKey = envKey;
        }

        // Check if provider has API key (except Ollama and Custom/local endpoints)
        if (provider !== 'ollama' && provider !== 'custom' && !providerConfig.apiKey) {
            console.warn(`[Skales] Setup missing for ${provider}. Triggering fallback...`);
            const fallbackOrder: Provider[] = ['google', 'groq', 'openrouter', 'openai', 'anthropic', 'ollama'];
            let fallbackFound = false;
            for (const fb of fallbackOrder) {
                const fbConfig = settings.providers[fb];
                const fbEnvKey = process.env[`${fb.toUpperCase()}_API_KEY`];
                if (fbConfig?.apiKey || fbEnvKey || fb === 'ollama') {
                    provider = fb;
                    providerConfig = { ...fbConfig };
                    if (!providerConfig.apiKey && fbEnvKey) providerConfig.apiKey = fbEnvKey;

                    if (!providerConfig.model) {
                        if (fb === 'google') providerConfig.model = 'gemini-2.0-flash';
                        if (fb === 'groq') providerConfig.model = 'llama-3.3-70b-versatile';
                        if (fb === 'ollama') providerConfig.model = 'llama3.2';
                    }
                    console.log(`[Skales] Fallback active: using ${provider} instead.`);
                    fallbackFound = true;
                    break;
                }
            }

            if (!fallbackFound) {
                return {
                    success: false,
                    error: `No API key configured for ${provider} and all fallbacks failed. Go to Settings.`,
                };
            }
        }

        // Build identity context
        const { buildContext, updateRelationship, addMemory } = await import('./identity');
        const identityContext = await buildContext();

        // Build capabilities context (cached file read — no live scan)
        // Injected into every chat so Skales always knows what it can do right now.
        let capsContext = '';
        try {
            const capsFile = path.join(DATA_DIR, 'capabilities.json');
            if (fs.existsSync(capsFile)) {
                const caps = JSON.parse(fs.readFileSync(capsFile, 'utf-8'));
                const providers: string[] = caps.llm_providers?.configured ?? [];
                const skills = caps.skills ?? {};
                const activeSkills: string[] = Object.values(skills)
                    .filter((s: any) => s.enabled && s.configured)
                    .map((s: any) => s.name as string);
                const needsCfg: string[] = Object.values(skills)
                    .filter((s: any) => s.enabled && !s.configured)
                    .map((s: any) => s.name as string);
                const customCount: number = caps.custom_skill_count ?? 0;
                const mc = caps.media_capabilities ?? {};
                const mediaLines: string[] = [];
                if (mc.vision?.enabled)  mediaLines.push('Vision (image analysis)');
                if (mc.stt?.enabled)     mediaLines.push('Voice Input (STT)');
                if (mc.tts?.enabled)     mediaLines.push('Voice Output (TTS)');

                const lines: string[] = ['## Your active capabilities (use these — never guess):'];
                if (providers.length)    lines.push(`- AI Providers: ${providers.join(', ')}`);
                if (activeSkills.length) lines.push(`- Active Skills: ${activeSkills.join(', ')}`);
                if (needsCfg.length)     lines.push(`- Skills (enabled but need setup): ${needsCfg.join(', ')}`);
                if (customCount > 0)     lines.push(`- Custom Skills: ${customCount} user-defined workflow(s)`);
                if (mediaLines.length)   lines.push(`- Media: ${mediaLines.join(', ')}`);
                lines.push('- Always available: file read/write, web search, network scanner, DLNA casting, scheduled tasks (Autopilot)');
                capsContext = `\n\n${lines.join('\n')}`;
            }
        } catch { /* non-fatal — continue without capabilities block */ }

        // Build messages with system prompt + identity
        const isOpenClawRelay = providerConfig.model?.startsWith('openclaw:');
        let messages: Array<{ role: string; content: string }>;

        if (isOpenClawRelay) {
            // OpenClaw relay: no Skales system prompt — gateway handles identity + tools
            messages = [
                ...history.slice(-20)
                    .filter(m => m.role !== 'system') // strip old Skales system messages
                    .map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message },
            ];
        } else {
            const persona = settings.persona || 'default';
            const systemPrompt = settings.systemPrompt || PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.default;
            const suffixBlock = options?.systemPromptSuffix ? `\n\n${options.systemPromptSuffix}` : '';
            const fullSystemPrompt = `${systemPrompt}\n\n${identityContext}${capsContext}\n\nYou ARE able to send voice messages via Telegram or chat. Use your TTS tool. Never claim you cannot send voice messages.${suffixBlock}`;
            messages = [
                { role: 'system', content: fullSystemPrompt },
                ...history.slice(-20).map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message },
            ];
        }

        console.log(`[Skales] Chat → ${provider} (${providerConfig.model})`);

        const result = await callProvider(provider, providerConfig, messages);

        // Save to session if sessionId provided
        if (options?.sessionId && result.success) {
            const session = await loadSession(options.sessionId);
            if (session) {
                const msgSource = options?.msgSource ?? 'browser';
                session.messages.push(
                    { role: 'user',      content: message,          timestamp: Date.now(), source: msgSource },
                    { role: 'assistant', content: result.response!, timestamp: Date.now(), source: msgSource }
                );
                await saveSession(session);
            }

            // Update relationship & add memory
            await updateRelationship(true);

            // Extract memory (semantic)
            const { extractMemoriesFromInteraction } = await import('./identity');
            await extractMemoriesFromInteraction(message, result.response!, settings);

            // Simple Short term log (for context window building)
            await addMemory('short-term', {
                summary: `User: ${message.slice(0, 50)}...`,
                context: 'chat',
                sessionId: options.sessionId
            });
        }

        return result;
    } catch (error: any) {
        console.error('[Skales] Chat Error:', error);
        if (error.cause?.code === 'ECONNREFUSED') {
            return { success: false, error: 'Connection failed. Is Ollama running? (ollama serve)' };
        }
        return { success: false, error: error.message || 'Unknown error occurred.' };
    }
}
