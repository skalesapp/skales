'use server';

/**
 * capabilities.ts — Live Capability Registry
 *
 * Rebuilds capabilities.json from actual runtime state every time
 * a skill is toggled. Also called on system prompt generation.
 *
 * The JSON is written to .skales-data/capabilities.json and is read
 * by orchestrator.ts to inject accurate capability context into every
 * system prompt.
 */

import fs from 'fs';
import path from 'path';

import { DATA_DIR } from '@/lib/paths';
const CAPABILITIES_FILE = path.join(DATA_DIR, 'capabilities.json');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');
const INTEGRATIONS_DIR = path.join(DATA_DIR, 'integrations');

// ─── Helpers ─────────────────────────────────────────────────

/** Check if a secret key exists in the encrypted store (does not decrypt) */
function hasSecret(key: string): boolean {
    try {
        if (!fs.existsSync(SECRETS_FILE)) return false;
        const store = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf-8'));
        return Boolean(store[key] && store[key].length > 0);
    } catch { return false; }
}

/** Check if an integration config file exists with a required field set */
function integrationConfigured(file: string, requiredField: string): boolean {
    try {
        const fp = path.join(INTEGRATIONS_DIR, file);
        if (!fs.existsSync(fp)) return false;
        const cfg = JSON.parse(fs.readFileSync(fp, 'utf-8'));
        return Boolean(cfg[requiredField] && String(cfg[requiredField]).trim().length > 0);
    } catch { return false; }
}

/** Read current skills state from skills.json */
function readSkillsState(): Record<string, boolean> {
    try {
        if (!fs.existsSync(SKILLS_FILE)) return {};
        const raw = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf-8'));
        const result: Record<string, boolean> = {};
        for (const [id, cfg] of Object.entries(raw.skills || {})) {
            result[id] = (cfg as any).enabled === true;
        }
        return result;
    } catch { return {}; }
}

// ─── Skill Definitions ────────────────────────────────────────

interface SkillDef {
    name: string;
    description: string;
    available_tools: string[];
    isConfigured: (secrets: ReturnType<typeof gatherSecretStatus>) => boolean;
}

interface SecretStatus {
    hasOpenAI: boolean;
    hasAnthropic: boolean;
    hasGoogle: boolean;
    hasGroq: boolean;
    hasMistral: boolean;
    hasDeepSeek: boolean;
    hasXAI: boolean;
    hasOpenRouter: boolean;
    hasTavily: boolean;
    hasVirusTotal: boolean;
    telegramConfigured: boolean;
    whatsappConfigured: boolean;
    discordConfigured: boolean;
    emailConfigured: boolean;
    playwrightInstalled: boolean;
}

function gatherSecretStatus(): SecretStatus {
    return {
        hasOpenAI: hasSecret('openai_api_key'),
        hasAnthropic: hasSecret('anthropic_api_key'),
        hasGoogle: hasSecret('google_api_key'),
        hasGroq: hasSecret('groq_api_key'),
        hasMistral: hasSecret('mistral_api_key'),
        hasDeepSeek: hasSecret('deepseek_api_key'),
        hasXAI: hasSecret('xai_api_key'),
        hasOpenRouter: hasSecret('openrouter_api_key'),
        hasTavily: hasSecret('tavily_api_key'),
        hasVirusTotal: hasSecret('virustotal_api_key'),
        telegramConfigured: integrationConfigured('telegram.json', 'botToken'),
        whatsappConfigured: integrationConfigured('whatsapp-status.json', 'isReady'),
        discordConfigured: integrationConfigured('discord.json', 'botToken'),
        emailConfigured: integrationConfigured('email.json', 'imapHost'),
        playwrightInstalled:
            fs.existsSync(path.join(process.cwd(), 'node_modules', 'playwright')) ||
            fs.existsSync(path.join(process.cwd(), 'node_modules', 'playwright-core')),
    };
}

const SKILL_DEFINITIONS: Record<string, SkillDef> = {
    image_generation: {
        name: 'Image Generation (Nano Banana)',
        description: 'Generate images via Google Imagen 3. Use generate_image tool.',
        available_tools: ['generate_image'],
        isConfigured: (s) => s.hasGoogle,
    },
    video_generation: {
        name: 'Video Generation (Veo 2)',
        description: 'Generate short videos via Google Veo 2. Use generate_video tool.',
        available_tools: ['generate_video'],
        isConfigured: (s) => s.hasGoogle,
    },
    summarize: {
        name: 'Summarize',
        description: 'Summarize files, URLs, and documents.',
        available_tools: ['summarize_content'],
        isConfigured: () => true,
    },
    weather: {
        name: 'Weather (always on)',
        description: 'Real-time weather forecasts and conditions.',
        available_tools: ['get_weather'],
        isConfigured: () => true,
    },
    web_search: {
        name: 'Web Search (Tavily)',
        description: 'Search the web for up-to-date information.',
        available_tools: ['web_search'],
        isConfigured: (s) => s.hasTavily,
    },
    googleCalendar: {
        name: 'Google Calendar',
        description: 'Manage calendar events — list, create, update, delete.',
        available_tools: ['list_calendar_events', 'create_calendar_event', 'update_calendar_event', 'delete_calendar_event'],
        isConfigured: (s) => s.hasGoogle,
    },
    telegram: {
        name: 'Telegram Bot',
        description: 'Two-way chat via Telegram — text, voice, images, GIFs.',
        available_tools: ['send_telegram_message'],
        isConfigured: (s) => s.telegramConfigured,
    },
    whatsapp: {
        name: 'WhatsApp',
        description: 'Send and receive WhatsApp messages (approved contacts only).',
        available_tools: ['send_whatsapp_message'],
        isConfigured: (s) => s.whatsappConfigured,
    },
    discord: {
        name: 'Discord Bot',
        description: 'Discord bot — respond to @mentions and DMs.',
        available_tools: ['send_discord_message'],
        isConfigured: (s) => s.discordConfigured,
    },
    email: {
        name: 'Email (SMTP/IMAP)',
        description: 'Send and receive emails via SMTP/IMAP.',
        available_tools: ['send_email', 'list_emails', 'read_email'],
        isConfigured: (s) => s.emailConfigured,
    },
    webhooks: {
        name: 'Webhooks (Zapier/n8n/IFTTT)',
        description: 'HTTP POST endpoint for automation tool integrations.',
        available_tools: ['get_webhook_url'],
        isConfigured: () => true,
    },
    virustotal: {
        name: 'VirusTotal Scan',
        description: 'Scan files and URLs for viruses and malware.',
        available_tools: ['scan_virustotal'],
        isConfigured: (s) => s.hasVirusTotal,
    },
    group_chat: {
        name: 'Group Chat (Multi-AI)',
        description: 'Multiple AI agents collaborate in one conversation.',
        available_tools: ['group_chat_dispatch'],
        // OpenRouter is the primary provider for Group Chat (supports all major models)
        isConfigured: (s) => s.hasOpenAI || s.hasAnthropic || s.hasGoogle || s.hasOpenRouter || s.hasGroq || s.hasMistral || s.hasDeepSeek || s.hasXAI,
    },
    lio_ai: {
        name: 'Lio AI — Code Builder',
        description: 'Build full software projects via Architect → Reviewer → Builder pipeline. Direct users to the Code page (/code).',
        available_tools: ['(navigate to /code page)'],
        isConfigured: (s) => s.hasOpenAI || s.hasAnthropic || s.hasGoogle || s.hasGroq || s.hasOpenRouter || s.hasMistral || s.hasDeepSeek || s.hasXAI,
    },
    browser_control: {
        name: 'Browser Control (Playwright)',
        description: 'Automate real Chromium browser — fill forms, scrape, screenshot.',
        available_tools: ['browser_open', 'browser_navigate', 'browser_click', 'browser_type', 'browser_screenshot', 'browser_close'],
        isConfigured: (s) => s.playwrightInstalled,
    },
    vision_screenshots: {
        name: 'Desktop Screenshots + Vision',
        description: 'Take desktop screenshots and analyze with AI vision.',
        available_tools: ['take_screenshot', 'analyze_screenshot'],
        isConfigured: (s) => s.hasGoogle || s.hasOpenAI || s.hasAnthropic || s.hasOpenRouter,
    },
    system_monitor: {
        name: 'System Monitor',
        description: 'Monitor CPU, RAM, disk usage, running processes.',
        available_tools: ['shell_execute (ps, top, df, free, Get-Process)'],
        isConfigured: () => true,
    },
    local_file_chat: {
        name: 'Local File Chat',
        description: 'Read and analyze local files via chat.',
        available_tools: ['read_file', 'list_files', 'write_file'],
        isConfigured: () => true,
    },
    twitter: {
        name: 'X / Twitter',
        description: 'Post tweets, read timeline, fetch mentions, and reply via OAuth 1.0a.',
        available_tools: ['post_tweet', 'get_timeline', 'get_mentions', 'reply_tweet'],
        isConfigured: () => integrationConfigured('twitter.json', 'apiKey'),
    },
    safety_mode: {
        name: 'Safety Mode',
        description: 'Three-level shell command guard: Safe (block), Advanced (approve/reject), Unrestricted.',
        available_tools: ['(built-in shell guard)'],
        isConfigured: () => true,
    },
    // ── v5 Skills ─────────────────────────────────────────────────
    autopilot: {
        name: 'Autopilot (Background Agent)',
        description: 'Autonomous background heartbeat — executes queued tasks every 5 minutes without user interaction.',
        available_tools: ['(navigate to /autopilot page)'],
        isConfigured: () => true,
    },
    custom_skills: {
        name: 'Custom Skills (Skill AI)',
        description: 'Create, upload, and manage custom JavaScript skill modules. Use Skill AI to generate skills via LLM.',
        available_tools: ['(navigate to /custom-skills page)'],
        isConfigured: () => true,
    },
    places: {
        name: 'Google Places',
        description: 'Search nearby restaurants, shops, attractions and get place details via Google Places API.',
        available_tools: ['search_places', 'get_place_details'],
        isConfigured: () => {
            try {
                const settingsPath = path.join(DATA_DIR, 'settings.json');
                if (!fs.existsSync(settingsPath)) return false;
                const s = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                return Boolean(s.googlePlacesApiKey?.trim());
            } catch { return false; }
        },
    },
    documents: {
        name: 'Documents (Word/PDF/Excel/PPTX)',
        description: 'Create, read, and edit Word documents, PDFs, Excel spreadsheets, and PowerPoint presentations.',
        available_tools: ['create_document', 'read_document', 'create_spreadsheet', 'create_presentation'],
        isConfigured: () => true,
    },
    voice_chat: {
        name: 'Voice Chat',
        description: 'Real-time voice conversation — speak to Skales and hear responses via browser STT/TTS.',
        available_tools: ['(browser mic + TTS)'],
        isConfigured: () => true,
    },
    network_scanner: {
        name: 'Network & Devices',
        description: 'Scan local network for devices (ping sweep + port probe), and cast media to DLNA/UPnP renderers.',
        available_tools: ['scan_network', 'cast_to_device'],
        isConfigured: () => true,
    },
    casting: {
        name: 'DLNA Casting',
        description: 'Discover UPnP/DLNA media renderers on your LAN and cast audio/video URLs to them.',
        available_tools: ['discover_renderers', 'cast_media', 'pause_cast', 'stop_cast'],
        isConfigured: () => true,
    },
};

// ─── Main Rebuild Function ────────────────────────────────────

export async function rebuildCapabilities(): Promise<void> {
    try {
        const skillsState = readSkillsState();
        const secrets = gatherSecretStatus();

        // Collect configured LLM providers
        const configuredProviders: string[] = [];
        if (secrets.hasAnthropic) configuredProviders.push('Anthropic (Claude)');
        if (secrets.hasOpenAI) configuredProviders.push('OpenAI (GPT-4)');
        if (secrets.hasGoogle) configuredProviders.push('Google (Gemini)');
        if (secrets.hasGroq) configuredProviders.push('Groq');
        if (secrets.hasMistral) configuredProviders.push('Mistral');
        if (secrets.hasDeepSeek) configuredProviders.push('DeepSeek');
        if (secrets.hasXAI) configuredProviders.push('xAI (Grok)');
        if (secrets.hasOpenRouter) configuredProviders.push('OpenRouter');

        try {
            const settingsPath = path.join(DATA_DIR, 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const st = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                const qn = st.providers?.qiniu;
                if (qn?.apiKey && String(qn.apiKey).trim() && !configuredProviders.includes('Qiniu')) {
                    configuredProviders.push('Qiniu');
                }
            }
        } catch { /* ignore */ }

        // Build skill entries
        const skills: Record<string, {
            name: string; enabled: boolean; configured: boolean;
            description: string; available_tools: string[];
        }> = {};

        for (const [id, def] of Object.entries(SKILL_DEFINITIONS)) {
            const enabled = id === 'weather' ? true : (skillsState[id] === true);
            skills[id] = {
                name: def.name,
                enabled,
                configured: def.isConfigured(secrets),
                description: def.description,
                available_tools: def.available_tools,
            };
        }

        const activeSkills = Object.entries(skills)
            .filter(([, s]) => s.enabled)
            .map(([, s]) => s.name);

        const inactiveSkills = Object.entries(skills)
            .filter(([, s]) => !s.enabled)
            .map(([id, s]) => ({ id, name: s.name }));

        const caps = {
            generated_at: new Date().toISOString(),
            version_info: { skales: '6.0.0', capabilities: '6.0' },
            llm_providers: {
                configured: configuredProviders,
                missing_note: 'Add API keys in Settings → LLM Providers',
            },
            active_skill_count: activeSkills.length,
            active_skills: activeSkills,
            inactive_skills: inactiveSkills.map(s => s.name),
            inactive_skill_ids: inactiveSkills.map(s => s.id),
            skills,
            integrations: {
                telegram: { configured: secrets.telegramConfigured },
                whatsapp: { configured: secrets.whatsappConfigured },
                discord: { configured: secrets.discordConfigured },
                email: { configured: secrets.emailConfigured },
            },
            media_capabilities: {
                vision: {
                    description: 'Analyze uploaded images — read text, recognize objects, describe scenes',
                    supported_providers: ['OpenAI (GPT-4o)', 'Anthropic (Claude 3.5)', 'Google (Gemini)', 'Ollama (LLaVA)'],
                },
                stt: {
                    description: 'Transcribe voice messages from Telegram',
                    providers: { 'Groq': 'whisper-large-v3-turbo (free)', 'OpenAI': 'whisper-1' },
                },
                tts: {
                    description: 'Generate voice responses — no API key required',
                    providers: {
                        'Google TTS': 'Free (automatic fallback)',
                        'Groq PlayAI': 'Fritz voice (optional)',
                        'OpenAI': 'nova voice (optional)',
                    },
                },
            },
        };

        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(CAPABILITIES_FILE, JSON.stringify(caps, null, 2));
    } catch {
        // Non-fatal — capabilities will be rebuilt on next toggle or restart
    }
}
