'use client';

import { CalendarStatusDot } from '../../components/CalendarStatusDot';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Server, Moon, Sun, Monitor, MessageSquare, Save, Settings as SettingsIcon,
    Globe, Zap, CheckCircle2, XCircle, Loader2, Download, User, Sparkles,
    Shield, Key, ExternalLink, TestTube2, WifiOff, Wifi, AlertTriangle, Trash2, Power, RotateCcw,
    ChevronDown, Upload, PackageOpen, Info, Layers, Eye, EyeOff, Crown, Star,
    Volume2, Timer,
} from 'lucide-react';
import { clearMemories, resetBootstrap, loadHuman } from '@/actions/identity';
import { clearOldLogs } from '@/actions/logs';
import {
    saveAllSettings, loadSettings, saveApiKey, testProvider,
    type Provider, type SkalesSettings
} from '@/actions/chat';
import {
    saveTelegramConfig, testTelegramBot, loadTelegramConfig, deleteTelegramConfig,
    regeneratePairingCode, getTelegramBotRunning, startTelegramBot, purgeTelegramData
} from '@/actions/telegram';
import {
    getWhatsAppStatus, startWhatsAppBot, disconnectWhatsApp, clearWhatsAppSession,
    loadWhatsAppContacts, saveWhatsAppContact, removeWhatsAppContact, toggleContactPermission,
    loadSignatureConfig, saveSignatureConfig,
    getWhatsAppMode, setWhatsAppMode,
    type WhatsAppStatus, type WhatsAppContact, type WhatsAppSignatureConfig, type WhatsAppMode,
} from '@/actions/whatsapp';
import {
    loadEmailAccounts, saveEmailAccount, deleteEmailAccount,
    testImapConnectionForAccount, testSmtpConnectionForAccount,
    type EmailAccount, type EmailPermission,
} from '@/actions/email';
import {
    loadCalendarConfig, saveCalendarConfig, deleteCalendarConfig,
    getCalendarAuthUrl, exchangeCalendarAuthCode, testCalendarConnection,
    type CalendarConfig,
} from '@/actions/calendar';
import {
    loadWebhookConfig, enableWebhook, disableWebhook, regenerateWebhookSecret,
    type WebhookConfig,
} from '@/actions/webhook';
import {
    loadDiscordConfig, saveDiscordConfig, deleteDiscordConfig,
    testDiscordBot, getDiscordBotRunning,
    type DiscordConfig,
} from '@/actions/discord';
import {
    exportData, importData, cleanupExports,
} from '@/actions/backup';
import { getUserTier, FEATURE_CONFIG, getFeatureTierLabel } from '@/lib/license';
import { useTranslation, SUPPORTED_LOCALES } from '@/lib/i18n';
import {
    setAutonomousMode,
} from '@/actions/autonomous';
import {
    loadVTConfig, saveVTConfig, deleteVTConfig, testVTApiKey,
    type VTConfig,
} from '@/actions/virustotal';
import {
    loadBlacklists, saveBlacklists, addBlockedDomain, removeBlockedDomain, addBlockedBuzzword, removeBlockedBuzzword,
    type SecurityBlacklists,
} from '@/actions/blacklist';
import {
    getBrowserControlConfig, saveBrowserControlConfig, isBrowserControlInstalled, installBrowserControl,
    type BrowserControlConfig,
} from '@/actions/browser-control';
import {
    getLioConfig, saveLioConfig,
    type LioAiConfig,
} from '@/actions/code-builder';
import { getActiveSkills, toggleSkill as persistSkillToggle } from '@/actions/skills';
import { useTheme } from 'next-themes';
import {
    loadUpdateSettings, saveUpdateSettings, getCurrentVersion,
    type UpdateSettings,
} from '@/actions/updates';

const PROVIDER_CONFIG: { id: Provider; label: string; icon: string; desc: string; color: string; needsKey: boolean; primary?: boolean }[] = [
    { id: 'openrouter', label: 'OpenRouter', icon: '🌐', desc: 'Access to GPT-4o, Claude, Gemini & more via one API', color: '#84cc16', needsKey: true, primary: true },
    { id: 'ollama', label: 'Ollama (Local)', icon: '🦙', desc: 'Run AI locally - no cloud, no costs, full privacy', color: '#a3e635', needsKey: false, primary: true },
    { id: 'custom', label: 'Custom (OpenAI-compatible)', icon: '🔌', desc: 'Connect to any OpenAI-compatible endpoint - llama.cpp, LM Studio, vLLM, koboldcpp, and more.', color: '#8b5cf6', needsKey: false, primary: true },
    { id: 'openai', label: 'OpenAI', icon: '🤖', desc: 'GPT-4o, GPT-4, DALL-E', color: '#10a37f', needsKey: true },
    { id: 'anthropic', label: 'Anthropic', icon: '🧠', desc: 'Claude 4, Claude 3.5 Sonnet', color: '#d4a167', needsKey: true },
    { id: 'google', label: 'Google AI', icon: '🔮', desc: 'Gemini 2.0 Flash, Gemini Pro', color: '#4285f4', needsKey: true },
    { id: 'groq', label: 'Groq', icon: '⚡', desc: 'Blazing fast + free STT/TTS for voice messages', color: '#f97316', needsKey: true },
    { id: 'mistral', label: 'Mistral AI', icon: '🌬️', desc: 'Mistral Large, Codestral - European AI leader', color: '#fc6b2d', needsKey: true },
    { id: 'deepseek', label: 'DeepSeek', icon: '🐋', desc: 'DeepSeek V3, R1 - ultra-affordable, strong reasoning', color: '#4d9de0', needsKey: true },
    { id: 'xai', label: 'xAI / Grok', icon: '🌌', desc: 'Grok 2 - real-time knowledge, sharp reasoning', color: '#9b5de5', needsKey: true },
    { id: 'together', label: 'Together AI', icon: '🤝', desc: 'Llama 3, Mixtral, DBRX & 100+ open models - affordable inference', color: '#6366f1', needsKey: true },
];


// Common models per provider for dropdown selection
const PROVIDER_MODELS: Record<Provider, { value: string; label: string }[]> = {
    openrouter: [
        { value: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
        { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
        { value: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Anthropic)' },
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
        { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (Fast)' },
        { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash (Google)' },
        { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5 (Google)' },
        { value: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3 (Budget)' },
        { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Meta)' },
        { value: 'mistralai/mistral-large-2411', label: 'Mistral Large (Mistral)' },
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o (Best)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast + Cheap)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
        { value: 'o1', label: 'o1 (Reasoning)' },
        { value: 'o1-mini', label: 'o1 Mini (Reasoning, Fast)' },
    ],
    anthropic: [
        { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Best)' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Legacy)' },
    ],
    google: [
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
        { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Budget)' },
        { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Stable)' },
        { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (High Quality)' },
    ],
    groq: [
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Best)' },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
        { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 (Reasoning)' },
    ],
    ollama: [
        { value: 'llama3.2', label: 'Llama 3.2 (Recommended)' },
        { value: 'llama3.1', label: 'Llama 3.1' },
        { value: 'mistral', label: 'Mistral 7B' },
        { value: 'mixtral', label: 'Mixtral 8x7B' },
        { value: 'codellama', label: 'Code Llama' },
        { value: 'deepseek-coder-v2', label: 'DeepSeek Coder V2' },
        { value: 'phi3', label: 'Phi-3 (Small)' },
        { value: 'gemma2', label: 'Gemma 2' },
    ],
    mistral: [
        { value: 'mistral-large-latest', label: 'Mistral Large (Best)' },
        { value: 'mistral-medium-latest', label: 'Mistral Medium' },
        { value: 'mistral-small-latest', label: 'Mistral Small (Budget)' },
        { value: 'codestral-latest', label: 'Codestral (Code)' },
        { value: 'open-mistral-nemo', label: 'Mistral Nemo (Free tier)' },
    ],
    deepseek: [
        { value: 'deepseek-chat', label: 'DeepSeek V3 (Recommended)' },
        { value: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoning)' },
    ],
    xai: [
        { value: 'grok-2-latest', label: 'Grok 2 (Best)' },
        { value: 'grok-2-vision-latest', label: 'Grok 2 Vision' },
        { value: 'grok-beta', label: 'Grok Beta' },
    ],
    together: [
        { value: 'meta-llama/Llama-3-70b-chat-hf', label: 'Llama 3 70B (Recommended)' },
        { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Turbo' },
        { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B (Best)' },
        { value: 'mistralai/Mixtral-8x22B-Instruct-v0.1', label: 'Mixtral 8x22B' },
        { value: 'databricks/dbrx-instruct', label: 'DBRX Instruct' },
        { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B' },
        { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
    ],
    // Custom endpoint — no predefined models; populated dynamically via "Fetch Models"
    custom: [],
};

const PERSONAS = [
    { id: 'default', label: 'Skales', emoji: '🦎', desc: 'Friendly, smart, versatile' },
    { id: 'entrepreneur', label: 'Entrepreneur', emoji: '📈', desc: 'Strategy, marketing, growth' },
    { id: 'coder', label: 'Coder', emoji: '💻', desc: 'Clean code, debugging, best practices' },
    { id: 'student', label: 'Student', emoji: '📚', desc: 'Patient tutor, step-by-step' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', desc: 'Recipes, scheduling, daily life' },
];

export default function SettingsPage() {
    const { locale, setLocale, t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [userChangedLocale, setUserChangedLocale] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');

    // Settings State
    const [activeProvider, setActiveProvider] = useState<Provider>('openrouter');
    const [persona, setPersona] = useState('default');
    const [nativeLanguage, setNativeLanguage] = useState('en');
    const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
        openrouter: '', openai: '', anthropic: '', google: '', ollama: 'ollama', groq: '',
        mistral: '', deepseek: '', xai: '', together: '', custom: '',
    });
    const [models, setModels] = useState<Record<Provider, string>>({
        openrouter: 'openai/gpt-3.5-turbo',
        openai: 'gpt-4o-mini',
        anthropic: 'claude-sonnet-4-20250514',
        google: 'gemini-2.0-flash',
        ollama: 'llama3.2',
        groq: 'llama-3.3-70b-versatile',
        mistral: 'mistral-large-latest',
        deepseek: 'deepseek-chat',
        xai: 'grok-2-latest',
        together: 'meta-llama/Llama-3-70b-chat-hf',
        custom: '',
    });

    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/v1');

    // ─── Ollama Auto-Detect State ─────────────────────────────
    const [ollamaDetected,      setOllamaDetected]      = useState(false);
    const [ollamaDetectedCount, setOllamaDetectedCount] = useState(0);
    const [ollamaDetecting,     setOllamaDetecting]     = useState(false);
    const [ollamaFetchedModels, setOllamaFetchedModels] = useState<string[]>([]);
    const [ollamaFetchingModels,setOllamaFetchingModels]= useState(false);
    const [ollamaFetchError,    setOllamaFetchError]    = useState('');

    // ─── Custom Endpoint State ────────────────────────────────
    const [customEndpointUrl, setCustomEndpointUrl] = useState('');
    const [customEndpointToolCalling, setCustomEndpointToolCalling] = useState(false);
    const [customEndpointVisionSupport, setCustomEndpointVisionSupport] = useState(false);
    const [customEndpointTtsUrl, setCustomEndpointTtsUrl] = useState('');
    const [customEndpointTimeout, setCustomEndpointTimeout] = useState(30);
    const [customFetchedModels, setCustomFetchedModels] = useState<{ id: string; name: string }[]>([]);
    const [customFetchingModels, setCustomFetchingModels] = useState(false);

    // ─── Model Auto-Fetch State (OpenAI, Anthropic, Google, OpenRouter) ────
    const [fetchedModels, setFetchedModels] = useState<Record<string, { id: string; name: string }[]>>({});
    const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
    const [fetchModelError, setFetchModelError] = useState<Record<string, string>>({});
    const [lastFetched, setLastFetched] = useState<Record<string, number>>({});

    const [moreLLMsOpen, setMoreLLMsOpen] = useState(false);

    // Test results
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
    const [testing, setTesting] = useState<string | null>(null);

    const [systemPrompt, setSystemPrompt] = useState('');
    const [customPromptActive, setCustomPromptActive] = useState(false);

    // Telegram Integration State
    const [telegramToken, setTelegramToken] = useState('');
    const [telegramSaved, setTelegramSaved] = useState(false);
    const [telegramBotName, setTelegramBotName] = useState('');
    const [telegramBotUsername, setTelegramBotUsername] = useState('');
    const [telegramTesting, setTelegramTesting] = useState(false);
    const [telegramSaving, setTelegramSaving] = useState(false);
    const [telegramResult, setTelegramResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showTelegramSetup, setShowTelegramSetup] = useState(false);
    const [telegramPairingCode, setTelegramPairingCode] = useState('');
    const [telegramPaired, setTelegramPaired] = useState(false);
    const [telegramPairedUser, setTelegramPairedUser] = useState('');
    const [telegramBotRunning, setTelegramBotRunning] = useState(false);

    // WhatsApp Integration State
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({ state: 'idle' });
    const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
    const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
    const [whatsappStarting, setWhatsappStarting] = useState(false);
    const [whatsappDisconnecting, setWhatsappDisconnecting] = useState(false);
    const [waNewName, setWaNewName] = useState('');
    const [waNewPhone, setWaNewPhone] = useState('');
    const [waAddingContact, setWaAddingContact] = useState(false);
    const [waContactError, setWaContactError] = useState('');
    const [waSignature, setWaSignature] = useState<WhatsAppSignatureConfig>({ enabled: true, text: '✨ Skales - your assistant' });
    const [waSignatureSaving, setWaSignatureSaving] = useState(false);
    const [waSignatureSaved, setWaSignatureSaved] = useState(false);
    const [waMode, setWaModeState] = useState<WhatsAppMode>('sendOnly');
    const [waModeSaving, setWaModeSaving] = useState(false);
    const [waModeSaved, setWaModeSaved] = useState(false);
    const [showWaModeWarning, setShowWaModeWarning] = useState(false);

    // State for Friend Mode (Active Behavior)
    const [activeBehavior, setActiveBehavior] = useState<SkalesSettings['activeUserBehavior']>({
        enabled: true,
        frequency: 'medium',
        quietHoursStart: 22,
        quietHoursEnd: 7,
        channels: { telegram: true, browser: true }
    });

    // State for GIF Integration
    const [gifConfig, setGifConfig] = useState<SkalesSettings['gifIntegration']>({
        enabled: false,
        provider: 'klipy',
        apiKey: '',
        autoSend: false,
    });

    // State for Email (IMAP/SMTP) Integration
    // ── Multi-account email state ──────────────────────────────
    const EMPTY_EMAIL_ACCOUNT = (): Omit<EmailAccount, 'savedAt'> => ({
        id: `account_${Date.now().toString(36)}`,
        alias: '',
        permissions: 'read-write' as EmailPermission,
        imapHost: '', imapPort: 993, imapTls: true,
        smtpHost: '', smtpPort: 587, smtpTls: false,
        username: '', password: '',
        displayName: '', signature: '',
        enabled: true,
        trustedAddresses: [],
        pollInterval: 15,
    });
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
    const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
    const [editingEmail, setEditingEmail] = useState<Omit<EmailAccount, 'savedAt'> | null>(null);
    const [trustedAddressInput, setTrustedAddressInput] = useState('');
    const [emailAccountSaving, setEmailAccountSaving] = useState(false);
    const [emailAccountTesting, setEmailAccountTesting] = useState(false);
    const [emailAccountTestResult, setEmailAccountTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showEmailSetup, setShowEmailSetup] = useState(false);

    // State for VirusTotal Integration
    const [vtApiKey, setVtApiKey] = useState('');
    const [vtEnabled, setVtEnabled] = useState(false);
    const [vtSaved, setVtSaved] = useState(false);

    // State for shutdown confirmations
    const [showKillswitchConfirm, setShowKillswitchConfirm] = useState(false);
    const [showStopServerConfirm, setShowStopServerConfirm] = useState(false);
    const [showResetSettingsConfirm, setShowResetSettingsConfirm] = useState(false);
    const [showDeleteAllDataConfirm, setShowDeleteAllDataConfirm] = useState(false);
    const [shutdownMessage, setShutdownMessage] = useState('');
    const [vtSaving, setVtSaving] = useState(false);
    const [vtError, setVtError] = useState<string | null>(null);
    const [vtTesting, setVtTesting] = useState(false);
    const [vtTestResult, setVtTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // ─── Replicate State ──────────────────────────────────────
    const [replicateToken, setReplicateToken] = useState('');
    const [replicateSaved, setReplicateSaved] = useState(false);
    const [replicateSaving, setReplicateSaving] = useState(false);
    const [replicateTesting, setReplicateTesting] = useState(false);
    const [replicateTestResult, setReplicateTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showReplicateToken, setShowReplicateToken] = useState(false);
    const [showReplicateSetup, setShowReplicateSetup] = useState(false);

    // ─── Skills State ─────────────────────────────────────────
    const [skills, setSkills] = useState<SkalesSettings['skills']>({
        systemMonitor: { enabled: false },
        localFileChat: { enabled: false },
        webhook: { enabled: false },
        googleCalendar: { enabled: false },
        discord: { enabled: false },
        browserControl: { enabled: false },
    });

    // Google Calendar
    const [calendarConfig, setCalendarConfig] = useState<Partial<CalendarConfig>>({});
    const [showCalendarSetup, setShowCalendarSetup] = useState(false);
    const [calendarSaving, setCalendarSaving] = useState(false);
    const [calendarTesting, setCalendarTesting] = useState(false);
    const [calendarResult, setCalendarResult] = useState<{ success: boolean; message: string } | null>(null);
    const [calendarAuthUrl, setCalendarAuthUrl] = useState('');
    const [calendarAuthCode, setCalendarAuthCode] = useState('');
    const [calendarExchanging, setCalendarExchanging] = useState(false);
    const [calendarSaved, setCalendarSaved] = useState(false);

    // Planner AI
    const [plannerDayStart, setPlannerDayStart] = useState('08:00');
    const [plannerDayEnd, setPlannerDayEnd] = useState('18:00');
    const [plannerWorkDays, setPlannerWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [plannerFocusHours, setPlannerFocusHours] = useState(3);
    const [plannerBreakStyle, setPlannerBreakStyle] = useState<'pomodoro' | '90min' | 'flexible' | 'none'>('flexible');
    const [plannerRegularTasks, setPlannerRegularTasks] = useState('');
    const [plannerFixedAppointments, setPlannerFixedAppointments] = useState('');
    const [plannerSaving, setPlannerSaving] = useState(false);
    const [plannerLoaded, setPlannerLoaded] = useState(false);

    // Apple Calendar (CalDAV)
    const [appleCalendarConfig, setAppleCalendarConfig] = useState<{ caldavUrl: string; username: string; password: string }>({ caldavUrl: 'https://caldav.icloud.com/', username: '', password: '' });
    const [showAppleCalendarSetup, setShowAppleCalendarSetup] = useState(false);
    const [appleCalendarTesting, setAppleCalendarTesting] = useState(false);
    const [appleCalendarResult, setAppleCalendarResult] = useState<{ success: boolean; message: string } | null>(null);
    const [appleCalendarSaved, setAppleCalendarSaved] = useState(false);

    // Outlook Calendar
    const [outlookClientId, setOutlookClientId] = useState('');
    const [outlookClientSecret, setOutlookClientSecret] = useState('');
    const [outlookAuthCode, setOutlookAuthCode] = useState('');
    const [showOutlookSetup, setShowOutlookSetup] = useState(false);
    const [outlookExchanging, setOutlookExchanging] = useState(false);
    const [outlookTesting, setOutlookTesting] = useState(false);
    const [outlookResult, setOutlookResult] = useState<{ success: boolean; message: string } | null>(null);
    const [outlookSaved, setOutlookSaved] = useState(false);

    // Webhook
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
    const [webhookEnabling, setWebhookEnabling] = useState(false);
    const [webhookRegenerating, setWebhookRegenerating] = useState(false);
    const [webhookCopied, setWebhookCopied] = useState(false);

    // Discord
    const [discordConfig, setDiscordConfig] = useState<Partial<DiscordConfig>>({ botToken: '', guildId: '', channelId: '' });
    const [showDiscordSetup, setShowDiscordSetup] = useState(false);
    const [discordSaving, setDiscordSaving] = useState(false);
    const [discordTesting, setDiscordTesting] = useState(false);
    const [discordResult, setDiscordResult] = useState<{ success: boolean; message: string } | null>(null);
    const [discordSaved, setDiscordSaved] = useState(false);
    const [discordBotRunning, setDiscordBotRunning] = useState(false);

    // ─── FTP Profile State ──────────────────────────────────
    interface FtpProfileLocal {
        id: string;
        alias: string;
        host: string;
        port: number;
        username: string;
        password: string;
        protocol: 'ftp' | 'sftp';
        remotePath: string;
        enabled: boolean;
        savedAt?: number;
    }
    const EMPTY_FTP_PROFILE = (): FtpProfileLocal => ({
        id: `ftp_${Date.now().toString(36)}`,
        alias: '',
        host: '',
        port: 21,
        username: '',
        password: '',
        protocol: 'ftp',
        remotePath: '/',
        enabled: true,
    });
    const [ftpProfiles, setFtpProfiles] = useState<FtpProfileLocal[]>([]);
    const [expandedFtpId, setExpandedFtpId] = useState<string | null>(null);
    const [editingFtp, setEditingFtp] = useState<FtpProfileLocal | null>(null);
    const [ftpSaving, setFtpSaving] = useState(false);
    const [ftpTesting, setFtpTesting] = useState(false);
    const [ftpTestResult, setFtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showFtpSetup, setShowFtpSetup] = useState(false);


    // Browser Control
    const [browserControlConfig, setBrowserControlConfig] = useState<BrowserControlConfig>({
        visionProvider: 'google',
        visionApiKey: '',
        visionModel: 'gemini-2.0-flash',
        visionUseForChat: false,
        visionUseForTelegram: false,
        visionUseForWhatsApp: false,
        visionUseForScreenshots: true,
        visionUseForBrowser: true,
        autoApproveNavigation: false,
        requireApprovalForLogin: true,
        requireApprovalForForms: true,
        requireApprovalForPurchases: true,
        requireApprovalForDownloads: true,
        maxSessionMinutes: 15,
        installed: false,
    });
    const [showBrowserSetup, setShowBrowserSetup] = useState(false);
    const [browserInstalling, setBrowserInstalling] = useState(false);
    const [browserInstallResult, setBrowserInstallResult] = useState<{ success: boolean; message: string } | null>(null);

    // ─── Lio AI State ─────────────────────────────────────────
    const [lioConfig, setLioConfig] = useState<LioAiConfig>({
        architectProvider: 'openrouter',
        architectModel: 'openai/gpt-4o',
        reviewerProvider: 'openrouter',
        reviewerModel: 'anthropic/claude-3.5-sonnet',
        builderProvider: 'openrouter',
        builderModel: 'openai/gpt-4o',
        autoInstallPackages: true,
        livePreview: true,
        previewPort: 3001,
        projectFolder: '.skales-data/workspace/projects',
        maxBuildSteps: 30,
        autoRecoveryRetries: 3,
        groupChatOnErrors: true,
    });
    const [lioSaving, setLioSaving] = useState(false);
    const [lioSaved, setLioSaved] = useState(false);
    const [browserConfigSaving, setBrowserConfigSaving] = useState(false);

    // File System Access Mode (legacy toggle)
    const [fileSystemAccess, setFileSystemAccess] = useState<'workspace' | 'full'>('workspace');
    // File Access Mode (new fine-grained control)
    const [fileAccessMode, setFileAccessMode] = useState<'workspace_only' | 'unrestricted' | 'custom'>('workspace_only');
    const [allowedFolders, setAllowedFolders] = useState<string[]>([]);
    const [newFolderInput, setNewFolderInput] = useState('');

    // Active Skill IDs — for gating settings sections
    const [activeSkillIds, setActiveSkillIds] = useState<Set<string>>(new Set());

    // Tavily Web Search
    const [tavilyApiKey, setTavilyApiKey] = useState('');
    // Google Places API
    const [googlePlacesApiKey, setGooglePlacesApiKey] = useState('');

    // Security Blacklists
    const [blacklists, setBlacklists] = useState<SecurityBlacklists | null>(null);
    const [blacklistExpanded, setBlacklistExpanded] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [newBuzzword, setNewBuzzword] = useState('');

    // Export / Import State
    const [exporting, setExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

    // TTS Configuration
    const [ttsConfig, setTtsConfig] = useState<SkalesSettings['ttsConfig']>({
        provider: 'default',
        elevenlabsApiKey: '',
        elevenlabsVoiceId: '',
        azureSpeechKey: '',
        azureSpeechRegion: '',
        azureVoiceName: '',
        localTtsUrl: '',
    });

    // Local STT (Speech-to-Text) URL
    const [localSttUrl, setLocalSttUrl] = useState('');

    // Local Image Generation URL
    const [localImageGenUrl, setLocalImageGenUrl] = useState('');

    // Task Timeout
    const [taskTimeoutSeconds, setTaskTimeoutSeconds] = useState<number>(300);

    // Safety Mode
    const [safetyMode, setSafetyMode] = useState<'safe' | 'unrestricted'>('safe');

    // Autonomous Mode — background heartbeat that processes tasks proactively
    const [isAutonomousMode, setIsAutonomousMode] = useState(false);
    const [autonomousToggling, setAutonomousToggling] = useState(false);

    // Telemetry opt-in/opt-out
    const [telemetryEnabled, setTelemetryEnabled] = useState(false);

    // Twitter/X
    const [twitterConfig, setTwitterConfig] = useState<{
        apiKey: string; apiSecret: string; accessToken: string; accessSecret: string;
        mode: 'send_only' | 'read_write' | 'full_autonomous'; autoPost: boolean;
    }>({ apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', mode: 'send_only', autoPost: false });
    const [twitterSaving, setTwitterSaving] = useState(false);
    const [twitterVerifying, setTwitterVerifying] = useState(false);
    const [twitterVerifyResult, setTwitterVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [twitterConnected, setTwitterConnected] = useState(false);

    // Updates
    const [updateSettings, setUpdateSettings] = useState<UpdateSettings>({ autoCheckOnStartup: true });
    const [currentVersion, setCurrentVersion] = useState<string>('4.0.0');
    const [updateSaving, setUpdateSaving] = useState(false);
    const [updateSaveResult, setUpdateSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    // ─── Tab Navigation State ─────────────────────────────────
    const [activeTab, setActiveTab] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.slice(1);
            if (['all', 'general', 'providers', 'integrations', 'buddy', 'security', 'advanced'].includes(hash)) return hash;
        }
        return 'general';
    });

    // Desktop App — auto-launch + desktop buddy (Electron only)
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [desktopBuddy, setDesktopBuddy] = useState(false);
    const isElectron = typeof window !== 'undefined' && !!(window as any).skales;

    // Buddy skins
    const [buddySkin, setBuddySkin] = useState('skales');
    const [availableSkins, setAvailableSkins] = useState<{ id: string; label: string; preview: string | null }[]>([]);
    const [skinSelectorOpen, setSkinSelectorOpen] = useState(false);
    const [skinRestartBanner, setSkinRestartBanner] = useState(false);

    // ── Unified health heartbeat (every 5 s) ────────────────────
    // Polls /api/health instead of individual Server Actions so the UI always
    // reflects true backend process state.  The endpoint is force-dynamic and
    // never cached, guaranteeing fresh data on every poll tick.
    useEffect(() => {
        const pollHealth = async () => {
            try {
                const res = await fetch('/api/health', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                setTelegramBotRunning(data.bots?.telegram?.running ?? false);
                setDiscordBotRunning(data.bots?.discord?.running ?? false);
                // WhatsApp has its own richer polling (QR code, loading %, etc.)
                // handled below — only sync the state string from health here
                // to keep them consistent without duplicating complex WA logic.
            } catch { /* network error - keep previous state */ }
        };

        pollHealth(); // immediate first call
        const interval = setInterval(pollHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    // Load auto-launch + desktop-buddy state from Electron (no-op in browser)
    useEffect(() => {
        if (isElectron && (window as any).skales?.invoke) {
            (window as any).skales.invoke('get-auto-launch')
                .then((enabled: boolean) => setAutoLaunch(enabled))
                .catch(() => { /* not available */ });
            (window as any).skales.invoke('get-desktop-buddy')
                .then((enabled: boolean) => setDesktopBuddy(enabled))
                .catch(() => { /* not available */ });
        }
        // Fetch available skins from the API (works in both Electron and browser)
        fetch('/api/mascot/skins', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data?.skins)) setAvailableSkins(data.skins); })
            .catch(() => { /* non-fatal */ });
    }, [isElectron]);

    // FIX A: Silently probe Ollama on page load so the banner appears immediately
    // Uses the default localhost URL; a manual "Detect" button re-probes after URL changes.
    useEffect(() => {
        const probe = async () => {
            try {
                const res = await fetch('http://localhost:11434/api/tags', {
                    signal: AbortSignal.timeout(3000),
                });
                if (res.ok) {
                    const data = await res.json();
                    const names: string[] = (data.models || []).map((m: any) => m.name as string);
                    setOllamaDetected(true);
                    setOllamaDetectedCount(names.length);
                    if (names.length > 0) setOllamaFetchedModels(names);
                }
            } catch { /* Ollama not running — silent */ }
        };
        probe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Hash sync effect for tab navigation
    useEffect(() => {
        window.location.hash = activeTab;
    }, [activeTab]);

    // Initial load
    useEffect(() => {
        setMounted(true);
        // Load Telegram config
        // Load WhatsApp status, contacts & signature config
        getWhatsAppStatus().then(s => setWhatsappStatus(s)).catch(() => { });
        loadWhatsAppContacts().then(c => setWhatsappContacts(c)).catch(() => { });
        loadSignatureConfig().then(s => setWaSignature(s)).catch(() => { });
        getWhatsAppMode().then(m => setWaModeState(m)).catch(() => { });

        loadEmailAccounts().then(accounts => {
            if (accounts.length > 0) {
                // Mask passwords for display
                setEmailAccounts(accounts.map(a => ({ ...a, password: a.password ? '••••••••' : '' })));
            }
        }).catch(() => { });

        // Load FTP profiles
        fetch('/api/ftp/profiles').then(r => r.json()).then(data => {
            if (data.profiles) setFtpProfiles(data.profiles);
        }).catch(() => {});

        // Load skills configs
        loadCalendarConfig().then(cfg => {
            if (cfg) { setCalendarConfig(cfg); setCalendarSaved(true); }
        }).catch(() => { });
        loadWebhookConfig().then(cfg => {
            if (cfg) setWebhookConfig(cfg);
        }).catch(() => { });

        // Load Planner preferences
        import('@/actions/planner').then(({ loadPlannerPreferences }) =>
            loadPlannerPreferences().then(prefs => {
                if (prefs) {
                    setPlannerDayStart(prefs.dayStart || '08:00');
                    setPlannerDayEnd(prefs.dayEnd || '18:00');
                    setPlannerWorkDays(prefs.workDays || [1, 2, 3, 4, 5]);
                    setPlannerFocusHours(prefs.focusHours || 3);
                    setPlannerBreakStyle(prefs.breakStyle || 'flexible');
                    setPlannerRegularTasks((prefs.regularTasks || []).join(', '));
                    setPlannerFixedAppointments((prefs.fixedAppointments || []).join('\n'));
                    setPlannerLoaded(true);
                }
            }).catch(() => { /* planner not yet configured */ })
        ).catch(() => { });

        loadDiscordConfig().then(cfg => {
            if (cfg) {
                setDiscordConfig({ botToken: '', guildId: cfg.guildId || '', channelId: cfg.channelId || '' });
                setDiscordSaved(true);
            }
        }).catch(() => { });

        loadTelegramConfig().then(cfg => {
            if (cfg) {
                setTelegramSaved(true);
                setTelegramBotName(cfg.botName || '');
                setTelegramBotUsername(cfg.botUsername || '');
                setTelegramPairingCode(cfg.pairingCode || '');
                setTelegramPaired(!!cfg.pairedChatId);
                setTelegramPairedUser(cfg.pairedUserName || '');
                // Mask the stored token for display
                const t = cfg.botToken || '';
                setTelegramToken(t.length > 10 ? t.slice(0, 10) + '...' : t);
            }
        }).catch(() => { });
        loadVTConfig().then(cfg => {
            if (cfg) {
                setVtApiKey(cfg.apiKey ? cfg.apiKey.slice(0, 8) + '...' : '');
                setVtEnabled(cfg.enabled ?? true);
                setVtSaved(true);
            }
        }).catch(() => { });
        loadBlacklists().then(setBlacklists).catch(() => { });

        // Load update settings & current version
        loadUpdateSettings().then(s => setUpdateSettings(s)).catch(() => { });
        getCurrentVersion().then(v => setCurrentVersion(v)).catch(() => { });
        loadSettings().then(settings => {
            setActiveProvider(settings.activeProvider);
            setPersona(settings.persona || 'default');
            setNativeLanguage(settings.nativeLanguage || 'en');

            // Load Active Behavior settings
            if (settings.activeUserBehavior) {
                setActiveBehavior(settings.activeUserBehavior);
            }

            // Load GIF Integration settings
            if (settings.gifIntegration) {
                // Migration: Tenor -> Klipy
                if (settings.gifIntegration.provider === 'tenor' as any) {
                    setGifConfig({ ...settings.gifIntegration, provider: 'klipy' });
                } else {
                    setGifConfig(settings.gifIntegration);
                }
            }

            // Load Skills settings
            if (settings.skills) {
                setSkills(prev => ({ ...prev, ...settings.skills }));
            }

            // Load File System Access setting (legacy)
            setFileSystemAccess(settings.fileSystemAccess || 'full');
            // Load new fine-grained file access mode
            if (settings.fileAccessMode) setFileAccessMode(settings.fileAccessMode as any);
            if (Array.isArray(settings.allowedFolders)) setAllowedFolders(settings.allowedFolders);

            // Load Tavily API key
            if (settings.tavilyApiKey) setTavilyApiKey(settings.tavilyApiKey);
            // Load Google Places API key
            if (settings.googlePlacesApiKey) setGooglePlacesApiKey(settings.googlePlacesApiKey);

            // Load TTS config
            if (settings.ttsConfig) setTtsConfig(settings.ttsConfig);

            // Load Local STT URL
            if ((settings as any).localSttUrl) setLocalSttUrl((settings as any).localSttUrl);

            // Load Local Image Gen URL
            if ((settings as any).localImageGenUrl) setLocalImageGenUrl((settings as any).localImageGenUrl);

            // Load Task Timeout
            if (settings.taskTimeoutSeconds) setTaskTimeoutSeconds(settings.taskTimeoutSeconds);

            // Load Safety Mode (fallback invalid values like 'advanced' to 'safe')
            if (settings.safetyMode) {
                const mode = settings.safetyMode;
                setSafetyMode((mode === 'safe' || mode === 'unrestricted') ? mode : 'safe');
            }

            // Load Autonomous Mode
            setIsAutonomousMode(settings.isAutonomousMode ?? false);

            // Load Telemetry opt-in
            setTelemetryEnabled((settings as any).telemetry_enabled ?? false);

            // Load Buddy skin
            if ((settings as any).buddy_skin) setBuddySkin((settings as any).buddy_skin);

            // Load Replicate token (masked)
            if ((settings as any).replicate_api_token) {
                const tok = (settings as any).replicate_api_token as string;
                setReplicateToken(tok.slice(0, 6) + '...');
                setReplicateSaved(true);
            }

            // Load Browser Control config
            getBrowserControlConfig().then(cfg => setBrowserControlConfig(cfg)).catch(() => { });
        getLioConfig().then(cfg => setLioConfig(cfg)).catch(() => { });
        // Load active skill IDs for section visibility gating
        getActiveSkills().then(ids => setActiveSkillIds(new Set(ids))).catch(() => { });

            // Logic for system prompt
            if (settings.systemPrompt) {
                setSystemPrompt(settings.systemPrompt);
                setCustomPromptActive(true);
            } else {
                // Load default for current persona
                setSystemPrompt(getPersonaPrompt(settings.persona || 'default'));
                setCustomPromptActive(false);
            }

            const keys: any = {};
            const mdls: any = {};
            for (const [p, cfg] of Object.entries(settings.providers)) {
                keys[p] = cfg.apiKey || '';
                mdls[p] = cfg.model || '';
            }
            setApiKeys(keys);
            setModels(mdls);

            if (settings.providers.ollama?.baseUrl) {
                setOllamaUrl(settings.providers.ollama.baseUrl);
            }
            if (settings.providers.custom?.baseUrl) {
                setCustomEndpointUrl(settings.providers.custom.baseUrl);
            }
            setCustomEndpointToolCalling(settings.customEndpointToolCalling ?? false);
            setCustomEndpointVisionSupport(settings.customEndpointVisionSupport ?? false);
            setCustomEndpointTtsUrl(settings.customEndpointTtsUrl ?? '');
            setCustomEndpointTimeout(settings.customEndpointTimeout ?? 30);

            setLoading(false);
        }).catch(() => setLoading(false));

        // Load Twitter config (async import — must be outside the .then() callback)
        import('@/actions/twitter').then(({ loadTwitterConfig }) =>
            loadTwitterConfig().then(twCfg => {
                if (twCfg) {
                    setTwitterConfig({
                        apiKey: twCfg.apiKey || '',
                        apiSecret: twCfg.apiSecret || '',
                        accessToken: twCfg.accessToken || '',
                        accessSecret: twCfg.accessSecret || '',
                        mode: twCfg.mode || 'send_only',
                        autoPost: twCfg.autoPost || false,
                    });
                    setTwitterConnected(!!(twCfg.apiKey && twCfg.accessToken));
                }
            }).catch(() => { })
        ).catch(() => { });
    }, []);

    // Helper to get prompt text (would ideally be imported, but copying for client-side valid for now)
    const getPersonaPrompt = (p: string) => {
        const prompts: Record<string, string> = {
            default: `Your name is Skales. You are a versatile AI companion who genuinely enjoys the craft of conversation. You're friendly, direct, and surprisingly funny when the moment calls for it - you have a soft spot for well-timed GIFs and the occasional meme that actually lands. You help with everything: planning, research, creative projects, daily life, and the kind of random questions that come up at 2am. You are equally comfortable being an optimist who sees the opportunity and a realist who spots the obstacle - you'll tell the user both, and let them decide. You adapt to the tone of the conversation and always respond in the language the user writes in. Over time you pay attention to what matters to this person - their projects, their communication style, their quirks - and you use that to become genuinely more useful, not just more polite. When you make a mistake you own it, learn from it, and do better next time. When something is unclear you ask rather than assume. Your goal is to be the most useful assistant this person has ever worked with - and maybe occasionally the most entertaining too.`,

            entrepreneur: `A battle-tested business strategist who has seen enough startups succeed and fail to know exactly why. You help founders, freelancers, and ambitious professionals sharpen their thinking on strategy, positioning, marketing, unit economics, and growth. You think in terms of leverage - where is the highest-impact action right now? You ask the uncomfortable questions: who is the actual customer, what problem is really being solved, is this a vitamin or a painkiller? You give direct, opinionated takes with clear reasoning, not corporate jargon or empty encouragement. When you're wrong, you say so. You believe execution beats ideas every time and that most business problems reduce to distribution, unit economics, and timing. You bring structured frameworks when they help - SWOT, jobs-to-be-done, first principles - but you're not mechanical about it; sometimes the best advice is a sharp question back. You always respond in the language the user writes in and adapt your depth to whether they need a five-minute sanity check or a deep strategic session.`,

            coder: `A senior software engineer who has shipped real products and carries the scars to prove it. Clean, readable, maintainable code matters - not for aesthetic reasons, but because messy code costs real time downstream. You favor working solutions over elegant theory. When helping with code you always use syntax-highlighted code blocks, explain what the code does and why, and flag potential edge cases or security concerns without turning every response into a lecture. You know multiple languages and paradigms well - TypeScript, Python, Rust, Go, SQL and more - and adapt your approach to the user's stack. You're honest when something is a bad idea: direct, not harsh. You ask clarifying questions rather than assume, especially on architecture decisions where context matters. You appreciate good tooling, clean commits, and tests that actually test something. You also know that shipping beats perfection in most contexts, and you won't let the perfect be the enemy of the good when there's a deadline involved. You always respond in the user's language.`,

            family: `A warm, dependable presence that feels like the most thoughtful person in the household. You help with the everyday logistics that make family life work: recipes and meal planning, scheduling, homework help, health questions, gift ideas, household budgeting, travel planning, and the kind of small decisions that somehow still take too long. You're patient, never condescending, and always speak in plain language - no jargon, no unnecessary complexity. You carry quiet optimism about people and situations, but you're honest when something deserves honest attention. You notice when someone seems stressed and you don't skip past it - you acknowledge it before jumping into task mode. You adapt naturally to whoever you're talking to: engaging and clear for kids, practical and thoughtful for adults, gentle for harder moments. Over time you remember what matters to this family - the preferences, the routines, the small things that make a household run better. You always respond in the language the user writes in, and you take the time to get things right.`,

            student: `The kind of tutor who makes difficult things actually click. You explain concepts step by step, starting from what the student already knows and building from there - never assuming too much or too little. You use concrete examples, analogies, and real-world applications to make abstract ideas tangible. When a student is stuck you don't just repeat the answer louder; you try a different angle. You encourage genuine understanding over memorization and shortcuts. You cover all subjects - maths, sciences, history, languages, literature, programming, and more. You're patient with confusion and honest about difficulty ("this is genuinely hard, but here's how to think about it"). When you don't know something you say so clearly, then help the student figure out how to find the answer themselves. You celebrate progress without being patronizing. You know that learning takes time and repetition, and you'll revisit the same concept as many times as needed without frustration. You always respond in the language the student writes in, matching your vocabulary and complexity to their apparent level.`,
        };
        return prompts[p] || prompts.default;
    };

    // ── FIX A/B: Ollama detect (manual button) + fetch model list ────────────
    const detectOllamaManual = async () => {
        setOllamaDetecting(true);
        setOllamaFetchError('');
        try {
            const base = ollamaUrl.trim().replace(/\/v1\/?$/, '');
            const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                const names: string[] = (data.models || []).map((m: any) => m.name as string);
                setOllamaDetected(true);
                setOllamaDetectedCount(names.length);
                if (names.length > 0) setOllamaFetchedModels(names);
                else setOllamaFetchError(t('settings.ollama.helpText'));
            } else {
                setOllamaDetected(false);
                setOllamaFetchError(`${t('settings.ollama.connectionFailed')} — HTTP ${res.status}`);
            }
        } catch {
            setOllamaDetected(false);
            const base = ollamaUrl.trim().replace(/\/v1\/?$/, '');
            setOllamaFetchError(`${t('settings.ollama.connectionFailed')} (${base}). ${t('settings.ollama.helpText')}`);
        } finally {
            setOllamaDetecting(false);
        }
    };

    const fetchOllamaModels = async () => {
        setOllamaFetchingModels(true);
        setOllamaFetchError('');
        try {
            const base = ollamaUrl.trim().replace(/\/v1\/?$/, '');
            const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                const names: string[] = (data.models || []).map((m: any) => m.name as string);
                if (names.length > 0) {
                    setOllamaFetchedModels(names);
                    setOllamaDetected(true);
                    setOllamaFetchError('');
                } else {
                    // FIX E: Helpful CORS/setup message when no models found
                    setOllamaFetchError('No models found. Run: ollama pull llama3.2');
                }
            } else {
                // FIX E: Clear helpful error for connection failures
                setOllamaFetchError(
                    `${t('settings.ollama.connectionFailed')} — HTTP ${res.status}.\n` +
                    `${t('settings.ollama.helpText')}\n` +
                    `macOS: ${t('settings.ollama.macOSHelp')}\n` +
                    `Windows: ${t('settings.ollama.windowsHelp')}`
                );
            }
        } catch {
            setOllamaFetchError(
                `${t('settings.ollama.connectionFailed')}.\n` +
                `${t('settings.ollama.helpText')}\n` +
                `macOS: ${t('settings.ollama.macOSHelp')}\n` +
                `Windows: ${t('settings.ollama.windowsHelp')}`
            );
        } finally {
            setOllamaFetchingModels(false);
        }
    };

    // ── Model Auto-Fetch (OpenAI, Anthropic, Google, OpenRouter) ───────────
    const fetchProviderModels = async (providerId: string) => {
        setFetchingModels(prev => ({ ...prev, [providerId]: true }));
        setFetchModelError(prev => ({ ...prev, [providerId]: '' }));
        try {
            const key = apiKeys[providerId as Provider] || '';
            let models: { id: string; name: string }[] = [];

            if (providerId === 'openai') {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${key}` },
                    signal: AbortSignal.timeout(10000),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                models = (data.data || [])
                    .filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('chatgpt-'))
                    .map((m: any) => ({ id: m.id, name: m.id }))
                    .sort((a: any, b: any) => a.id.localeCompare(b.id));
            } else if (providerId === 'anthropic') {
                // Anthropic doesn't have a public /v1/models — use updated hardcoded list
                models = [
                    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Best)' },
                    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
                    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
                    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
                    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
                    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Legacy)' },
                ];
            } else if (providerId === 'google') {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
                    signal: AbortSignal.timeout(10000),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                models = (data.models || [])
                    .filter((m: any) => m.name?.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
                    .map((m: any) => ({
                        id: m.name.replace('models/', ''),
                        name: m.displayName || m.name.replace('models/', ''),
                    }))
                    .sort((a: any, b: any) => a.id.localeCompare(b.id));
            } else if (providerId === 'openrouter') {
                const res = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: key ? { 'Authorization': `Bearer ${key}` } : {},
                    signal: AbortSignal.timeout(10000),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                models = (data.data || [])
                    .map((m: any) => ({ id: m.id, name: m.name || m.id }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));
            }

            if (models.length === 0) throw new Error('No models returned');
            setFetchedModels(prev => ({ ...prev, [providerId]: models }));
            setLastFetched(prev => ({ ...prev, [providerId]: Date.now() }));
        } catch (err: any) {
            setFetchModelError(prev => ({ ...prev, [providerId]: err?.message || 'Failed to fetch models' }));
        } finally {
            setFetchingModels(prev => ({ ...prev, [providerId]: false }));
        }
    };

    const handlePersonaChange = (newPersona: string) => {
        setPersona(newPersona);
        // If not customized, switch the prompt text to match the new persona
        if (!customPromptActive) {
            setSystemPrompt(getPersonaPrompt(newPersona));
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSystemPrompt(e.target.value);
        setCustomPromptActive(true);
    };

    const handleResetPrompt = () => {
        setSystemPrompt(getPersonaPrompt(persona));
        setCustomPromptActive(false);
    };

    const showStatus = (msg: string, type: 'success' | 'error') => {
        setStatusMessage(msg);
        setStatusType(type);
        setTimeout(() => { setStatusMessage(''); setStatusType(''); }, 4000);
    };

    const handleTelegramSave = async () => {
        if (!telegramToken || telegramToken.includes('...')) return;
        setTelegramSaving(true);
        setTelegramResult(null);
        try {
            const saveRes = await saveTelegramConfig(telegramToken);
            if (!saveRes.success) {
                setTelegramResult({ success: false, message: saveRes.error || 'Failed to save' });
                return;
            }
            if (saveRes.pairingCode) {
                setTelegramPairingCode(saveRes.pairingCode);
            }
            const testRes = await testTelegramBot(telegramToken);
            if (testRes.success) {
                setTelegramSaved(true);
                setTelegramBotName(testRes.botName || '');
                setTelegramBotUsername(testRes.botUsername || '');
                setTelegramResult({ success: true, message: `Connected as @${testRes.botUsername} (${testRes.botName})` });
                setTelegramToken(telegramToken.slice(0, 10) + '...');
                // Auto-start the bot process so the user doesn't need to restart Skales.
                // startTelegramBot() is a no-op if the process is already running.
                startTelegramBot().then(startRes => {
                    if (startRes.success) {
                        setTelegramBotRunning(true);
                    } else {
                        console.warn('[Settings] Telegram bot auto-start failed:', startRes.error);
                    }
                }).catch(() => { /* non-fatal */ });
            } else {
                setTelegramResult({ success: false, message: testRes.error || 'Connection failed' });
            }
        } catch (e: any) {
            setTelegramResult({ success: false, message: e.message });
        } finally {
            setTelegramSaving(false);
        }
    };

    const handleTelegramTest = async () => {
        const token = telegramToken;
        if (!token || token.includes('...')) {
            setTelegramResult({ success: false, message: 'Enter a valid token first' });
            return;
        }
        setTelegramTesting(true);
        setTelegramResult(null);
        try {
            const res = await testTelegramBot(token);
            if (res.success) {
                setTelegramBotName(res.botName || '');
                setTelegramBotUsername(res.botUsername || '');
                setTelegramResult({ success: true, message: `✅ Connected as @${res.botUsername} (${res.botName})` });
            } else {
                setTelegramResult({ success: false, message: res.error || 'Connection failed' });
            }
        } catch (e: any) {
            setTelegramResult({ success: false, message: e.message });
        } finally {
            setTelegramTesting(false);
        }
    };

    const handleTelegramDisconnect = async () => {
        if (!confirm('Disconnect Telegram bot? The bot token and pairing will be deleted.')) return;
        await deleteTelegramConfig();
        setTelegramSaved(false);
        setTelegramBotName('');
        setTelegramBotUsername('');
        setTelegramToken('');
        setTelegramPairingCode('');
        setTelegramPaired(false);
        setTelegramPairedUser('');
        setTelegramResult(null);
        setShowTelegramSetup(false);
    };

    const handleTelegramPurge = async () => {
        if (!confirm('Reset Telegram completely? This will delete ALL Telegram data including pairing, pending approvals, and logs. You will need to re-pair.')) return;
        await purgeTelegramData();
        setTelegramSaved(false);
        setTelegramBotName('');
        setTelegramBotUsername('');
        setTelegramToken('');
        setTelegramPairingCode('');
        setTelegramPaired(false);
        setTelegramPairedUser('');
        setTelegramResult({ success: true, message: 'Telegram disconnected. Re-pair with /pair.' });
        setShowTelegramSetup(false);
    };

    const handleRegeneratePairing = async () => {
        if (!confirm('Generate a new pairing code? The current connection will be removed.')) return;
        const res = await regeneratePairingCode();
        if (res.success && res.pairingCode) {
            setTelegramPairingCode(res.pairingCode);
            setTelegramPaired(false);
            setTelegramPairedUser('');
            setTelegramResult({ success: true, message: 'New pairing code generated. Send /pair ' + res.pairingCode + ' in Telegram.' });
        }
    };

    // ─── WhatsApp Handlers ────────────────────────────────────

    // Auto-open the WhatsApp accordion whenever the bot is already running
    // (initializing, loading QR, showing QR, authenticated, or ready).
    // Without this, if the bot was started before the page loaded, the QR
    // code would never render because showWhatsAppSetup starts as false.
    useEffect(() => {
        const activeStates = ['initializing', 'loading', 'qr', 'authenticated', 'ready'];
        if (activeStates.includes(whatsappStatus.state)) {
            setShowWhatsAppSetup(true);
        }
    }, [whatsappStatus.state]);

    // Poll WhatsApp status continuously:
    // - Fast poll (2.5s) when in transition states (initializing/loading/qr/authenticated)
    // - Slow poll (10s) always — catches bot that was already ready when page loaded,
    //   or phone that shows connected but Skales shows idle.
    useEffect(() => {
        const fastStates = ['initializing', 'loading', 'qr', 'authenticated'];
        const isFast = fastStates.includes(whatsappStatus.state) && showWhatsAppSetup;
        const interval = setInterval(async () => {
            try {
                const s = await getWhatsAppStatus();
                setWhatsappStatus(s);
            } catch { }
        }, isFast ? 2500 : 10000);
        return () => clearInterval(interval);
    }, [showWhatsAppSetup, whatsappStatus.state]);

    const handleWhatsAppStart = async () => {
        setWhatsappStarting(true);
        try {
            const res = await startWhatsAppBot();
            if (res.success) {
                setWhatsappStatus({ state: 'initializing' });
                // Start polling immediately
                setShowWhatsAppSetup(true);
            }
        } catch { }
        setWhatsappStarting(false);
    };

    const handleWhatsAppClearSession = async () => {
        if (!confirm('Clear the WhatsApp session? This removes the saved browser profile so a fresh QR code is generated on next Start Setup. Your contacts and settings are preserved.')) return;
        const res = await clearWhatsAppSession();
        if (res.success) {
            setWhatsappStatus({ state: 'idle' });
        }
    };

    const handleWhatsAppDisconnect = async () => {
        if (!confirm('Disconnect WhatsApp? The session will be deleted and you will need to scan a new QR code.')) return;
        setWhatsappDisconnecting(true);
        await disconnectWhatsApp();
        setWhatsappStatus({ state: 'idle' });
        setWhatsappDisconnecting(false);
    };

    const handleWaAddContact = async () => {
        setWaContactError('');
        if (!waNewName.trim() || !waNewPhone.trim()) {
            setWaContactError('Name and phone number are required.');
            return;
        }
        setWaAddingContact(true);
        const res = await saveWhatsAppContact({ name: waNewName.trim(), phone: waNewPhone.trim(), permitted: true });
        if (res.success) {
            const updated = await loadWhatsAppContacts();
            setWhatsappContacts(updated);
            setWaNewName('');
            setWaNewPhone('');
        } else {
            setWaContactError(res.error || 'Failed to add contact');
        }
        setWaAddingContact(false);
    };

    const handleWaToggleContact = async (id: string, permitted: boolean) => {
        await toggleContactPermission(id, permitted);
        setWhatsappContacts(prev => prev.map(c => c.id === id ? { ...c, permitted } : c));
    };

    const handleWaRemoveContact = async (id: string) => {
        await removeWhatsAppContact(id);
        setWhatsappContacts(prev => prev.filter(c => c.id !== id));
    };

    const handleWaSignatureSave = async () => {
        setWaSignatureSaving(true);
        setWaSignatureSaved(false);
        const res = await saveSignatureConfig(waSignature);
        if (res.success) {
            setWaSignatureSaved(true);
            setTimeout(() => setWaSignatureSaved(false), 2000);
        }
        setWaSignatureSaving(false);
    };

    const handleWaModeSave = async (mode: WhatsAppMode) => {
        setWaModeSaving(true);
        setWaModeSaved(false);
        const res = await setWhatsAppMode(mode);
        if (res.success) {
            setWaModeState(mode);
            setWaModeSaved(true);
            setTimeout(() => setWaModeSaved(false), 2000);
        }
        setWaModeSaving(false);
        setShowWaModeWarning(false);
    };

    // ─── Export / Import Handlers ─────────────────────────────

    const handleExport = async () => {
        setExporting(true);
        setExportResult(null);
        try {
            // exportData() uses pure Node.js archiver (no OS commands) and returns
            // the server-side zipPath so Electron can copy it without streaming binary IPC.
            const res = await exportData();
            if (!res.success) {
                setExportResult({ success: false, message: `❌ ${res.error}` });
                return;
            }

            const mb = ((res.sizeBytes || 0) / 1024 / 1024).toFixed(1);
            const skales = (window as Window & { skales?: {
                invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
            } }).skales;

            if (skales && res.zipPath) {
                // ── Electron path ──────────────────────────────────────────────
                // Show a native Save As dialog, then copy the server-created ZIP
                // to the user's chosen location — no binary data over IPC.
                const { canceled, filePath } = await skales.invoke('show-save-dialog', {
                    defaultPath: res.filename || 'skales-backup.zip',
                    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
                }) as { canceled: boolean; filePath?: string };

                if (!canceled && filePath) {
                    const copyResult = await skales.invoke('copy-file', res.zipPath, filePath) as { success: boolean; error?: string };
                    if (copyResult.success) {
                        setExportResult({ success: true, message: `✅ Backup saved (${mb} MB)` });
                    } else {
                        setExportResult({ success: false, message: `❌ Save failed: ${copyResult.error}` });
                    }
                } else {
                    // User cancelled the dialog — the ZIP still exists in DATA_DIR
                    setExportResult({ success: true, message: `Export created (${mb} MB) - save cancelled.` });
                }
                // Always clean up the server-side staging ZIP
                setTimeout(() => cleanupExports().catch(() => { }), 5000);
            } else {
                // ── Browser path ───────────────────────────────────────────────
                // Trigger a standard browser download via the API route which
                // reads the ZIP from DATA_DIR and streams it as application/zip.
                setExportResult({ success: true, message: `✅ Export ready (${mb} MB) - downloading...` });
                const a = document.createElement('a');
                a.href = '/api/export-backup';
                a.download = res.filename || 'skales-backup.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                // Cleanup server-side zip after the browser has had time to fetch it
                setTimeout(() => cleanupExports().catch(() => { }), 30_000);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setExportResult({ success: false, message: `❌ ${msg}` });
        } finally {
            setExporting(false);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            setImporting(true);
            setImportResult(null);
            try {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const base64 = (ev.target?.result as string).split(',')[1];
                    const res = await importData(base64);
                    if (res.success) {
                        // Sync locale from restored human.json → localStorage
                        try {
                            const human = await loadHuman();
                            const lang = human?.preferences?.language;
                            if (lang && lang !== 'auto') {
                                localStorage.setItem('skales-locale', lang);
                            }
                        } catch { /* non-fatal — locale will stay as-is */ }
                        setImportResult({ success: true, message: `✅ ${res.message} Page will reload in 3s...` });
                        setTimeout(() => window.location.reload(), 3000);
                    } else {
                        setImportResult({ success: false, message: `❌ ${res.error}` });
                    }
                    setImporting(false);
                };
                reader.readAsDataURL(file);
            } catch (e: any) {
                setImportResult({ success: false, message: `❌ ${e.message}` });
                setImporting(false);
            }
        };
        input.click();
    };

    // ─── Skills Handlers ──────────────────────────────────────

    const toggleSkill = async (key: string) => {
        const newEnabled = !activeSkillIds.has(key);
        // Optimistic UI update
        setActiveSkillIds(prev => {
            const next = new Set(prev);
            if (newEnabled) next.add(key); else next.delete(key);
            return next;
        });
        setSkills(prev => ({ ...prev, [key]: { enabled: newEnabled } }));
        // Persist to skills.json
        await persistSkillToggle(key, newEnabled);
    };

    // Browser Control
    const handleBrowserInstall = async () => {
        setBrowserInstalling(true);
        setBrowserInstallResult(null);
        try {
            const res = await installBrowserControl();
            if (res.success) {
                setBrowserControlConfig(prev => ({ ...prev, installed: true }));
                setBrowserInstallResult({ success: true, message: '✅ Chromium installed! Browser Control is ready.' });
            } else {
                setBrowserInstallResult({ success: false, message: `${res.error || t('settings.browser.installFailed')}\n${t('settings.browser.manualInstallHint')}` });
            }
        } catch (e: any) {
            setBrowserInstallResult({ success: false, message: `${e.message}\n${t('settings.browser.manualInstallHint')}` });
        } finally {
            setBrowserInstalling(false);
        }
    };

    const handleBrowserConfigSave = async () => {
        setBrowserConfigSaving(true);
        try {
            await saveBrowserControlConfig(browserControlConfig);
            showStatus('Browser Control settings saved! ✅', 'success');
        } catch (e: any) {
            showStatus(`Error saving browser config: ${e.message}`, 'error');
        } finally {
            setBrowserConfigSaving(false);
        }
    };

    // Lio AI
    const handleLioSave = async () => {
        setLioSaving(true);
        setLioSaved(false);
        const res = await saveLioConfig(lioConfig);
        if (res.success) {
            setLioSaved(true);
            setTimeout(() => setLioSaved(false), 2000);
        }
        setLioSaving(false);
    };

    // Calendar
    const handleCalendarSave = async () => {
        setCalendarSaving(true);
        setCalendarResult(null);
        try {
            await saveCalendarConfig(calendarConfig as CalendarConfig);
            setCalendarSaved(true);
            setCalendarResult({ success: true, message: 'Calendar config saved.' });
        } catch (e: any) {
            setCalendarResult({ success: false, message: e.message });
        } finally {
            setCalendarSaving(false);
        }
    };

    const handleCalendarTest = async () => {
        setCalendarTesting(true);
        setCalendarResult(null);
        try {
            const res = await testCalendarConnection();
            setCalendarResult({ success: res.success, message: res.success ? `✅ Connected! ${res.eventCount} upcoming events found.` : res.error || 'Connection failed' });
        } catch (e: any) {
            setCalendarResult({ success: false, message: e.message });
        } finally {
            setCalendarTesting(false);
        }
    };

    const handleCalendarGetAuthUrl = async () => {
        if (!calendarConfig.clientId) return;
        const url = await getCalendarAuthUrl(calendarConfig.clientId);
        setCalendarAuthUrl(url);
        window.open(url, '_blank');
    };

    const handleCalendarExchangeCode = async () => {
        if (!calendarAuthCode || !calendarConfig.clientId || !calendarConfig.clientSecret) return;
        setCalendarExchanging(true);
        setCalendarResult(null);
        try {
            const res = await exchangeCalendarAuthCode(calendarAuthCode, calendarConfig.clientId, calendarConfig.clientSecret);
            if (res.success) {
                const newCfg = { ...calendarConfig, refreshToken: res.refreshToken, accessToken: res.accessToken, tokenExpiry: res.tokenExpiry };
                setCalendarConfig(newCfg);
                await saveCalendarConfig(newCfg as CalendarConfig);
                setCalendarSaved(true);
                setCalendarResult({ success: true, message: '✅ OAuth connected! Calendar read/write enabled.' });
                setCalendarAuthCode('');
            } else {
                setCalendarResult({ success: false, message: res.error || 'Token exchange failed' });
            }
        } catch (e: any) {
            setCalendarResult({ success: false, message: e.message });
        } finally {
            setCalendarExchanging(false);
        }
    };

    const handleCalendarDisconnect = async () => {
        if (!confirm('Disconnect Google Calendar?')) return;
        await deleteCalendarConfig();
        setCalendarConfig({});
        setCalendarSaved(false);
        setCalendarResult(null);
        setCalendarAuthUrl('');
        setCalendarAuthCode('');
    };

    // Apple Calendar
    const handleAppleCalendarSave = async () => {
        try {
            const s = await loadSettings();
            await saveAllSettings({ ...s, appleCalendar: appleCalendarConfig });
            setAppleCalendarSaved(true);
            setAppleCalendarResult({ success: true, message: t('calendar.connectionSuccess') });
        } catch (e: any) {
            setAppleCalendarResult({ success: false, message: e.message });
        }
    };

    const handleAppleCalendarTest = async () => {
        setAppleCalendarTesting(true);
        setAppleCalendarResult(null);
        try {
            const res = await fetch('/api/calendar/apple/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appleCalendarConfig),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || t('calendar.connectionFailed'));
            setAppleCalendarResult({ success: true, message: `${t('calendar.connectionSuccess')} ${data.eventsFound} ${t('calendar.eventsToday')}` });
            setAppleCalendarSaved(true);
        } catch (e: any) {
            setAppleCalendarResult({ success: false, message: `${t('calendar.connectionFailed')}: ${e.message}` });
        } finally {
            setAppleCalendarTesting(false);
        }
    };

    const handleAppleCalendarDisconnect = async () => {
        if (!confirm('Disconnect Apple Calendar?')) return;
        const s = await loadSettings();
        await saveAllSettings({ ...s, appleCalendar: undefined });
        setAppleCalendarConfig({ caldavUrl: 'https://caldav.icloud.com/', username: '', password: '' });
        setAppleCalendarSaved(false);
        setAppleCalendarResult(null);
    };

    // Outlook Calendar
    const handleOutlookGetAuthUrl = () => {
        if (!outlookClientId) return;
        // Build OAuth URL client-side (pure URL construction — no server call needed)
        const params = new URLSearchParams({
            client_id: outlookClientId,
            response_type: 'code',
            redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
            scope: 'Calendars.ReadWrite User.Read offline_access',
            response_mode: 'query',
            prompt: 'consent',
        });
        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
        window.open(url, '_blank');
    };

    const handleOutlookExchangeCode = async () => {
        if (!outlookAuthCode || !outlookClientId) return;
        setOutlookExchanging(true);
        setOutlookResult(null);
        try {
            const res = await fetch('/api/calendar/outlook/exchange-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: outlookAuthCode, clientId: outlookClientId, clientSecret: outlookClientSecret || undefined }),
            });
            const res2 = await res.json();
            const resData = res2;
            if (resData.success) {
                setOutlookSaved(true);
                setOutlookResult({ success: true, message: t('calendar.connectionSuccess') });
                setOutlookAuthCode('');
            } else {
                setOutlookResult({ success: false, message: resData.error || t('calendar.connectionFailed') });
            }
        } catch (e: any) {
            setOutlookResult({ success: false, message: e.message });
        } finally {
            setOutlookExchanging(false);
        }
    };

    const handleOutlookTest = async () => {
        setOutlookTesting(true);
        setOutlookResult(null);
        try {
            const resp = await fetch('/api/calendar/outlook/test');
            const res = await resp.json();
            setOutlookResult({ success: res.success, message: res.success ? t('calendar.connectionSuccess') : (res.error || t('calendar.connectionFailed')) });
        } catch (e: any) {
            setOutlookResult({ success: false, message: e.message });
        } finally {
            setOutlookTesting(false);
        }
    };

    const handleOutlookDisconnect = async () => {
        if (!confirm('Disconnect Outlook Calendar?')) return;
        await fetch('/api/calendar/outlook/disconnect', { method: 'POST' });
        setOutlookSaved(false);
        setOutlookResult(null);
        setOutlookClientId('');
        setOutlookClientSecret('');
        setOutlookAuthCode('');
    };

    // Planner preferences save
    const handlePlannerSave = async () => {
        setPlannerSaving(true);
        try {
            const { savePlannerPreferences } = await import('@/actions/planner');
            await savePlannerPreferences({
                dayStart: plannerDayStart,
                dayEnd: plannerDayEnd,
                workDays: plannerWorkDays,
                focusHours: plannerFocusHours,
                breakStyle: plannerBreakStyle,
                regularTasks: plannerRegularTasks.split(',').map(s => s.trim()).filter(Boolean),
                fixedAppointments: plannerFixedAppointments.split('\n').map(s => s.trim()).filter(Boolean),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                createdAt: '',
                updatedAt: '',
            });
            setPlannerLoaded(true);
        } catch { /* ignore */ }
        setPlannerSaving(false);
    };

    // Webhook
    const handleWebhookToggle = async () => {
        setWebhookEnabling(true);
        try {
            if (webhookConfig?.enabled) {
                await disableWebhook();
                setWebhookConfig(prev => prev ? { ...prev, enabled: false } : null);
            } else {
                const res = await enableWebhook();
                if (res.success) {
                    setWebhookConfig({ enabled: true, secret: res.secret || '' });
                }
            }
        } catch { }
        setWebhookEnabling(false);
    };

    const handleWebhookRegenerate = async () => {
        if (!confirm('Regenerate webhook secret? Old secret will stop working immediately.')) return;
        setWebhookRegenerating(true);
        const res = await regenerateWebhookSecret();
        if (res.success) {
            setWebhookConfig(prev => prev ? { ...prev, secret: res.secret || '' } : null);
        }
        setWebhookRegenerating(false);
    };

    const handleWebhookCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setWebhookCopied(true);
            setTimeout(() => setWebhookCopied(false), 2000);
        });
    };

    // Discord
    const handleDiscordSave = async () => {
        if (!discordConfig.botToken || discordConfig.botToken.includes('...')) {
            setDiscordResult({ success: false, message: 'Enter a valid bot token' });
            return;
        }
        setDiscordSaving(true);
        setDiscordResult(null);
        try {
            const testRes = await testDiscordBot(discordConfig.botToken);
            if (!testRes.success) {
                setDiscordResult({ success: false, message: testRes.error || 'Invalid bot token' });
                return;
            }
            await saveDiscordConfig({
                botToken: discordConfig.botToken,
                guildId: discordConfig.guildId,
                channelId: discordConfig.channelId,
                botName: testRes.botName,
                botId: testRes.botId,
            });
            setDiscordSaved(true);
            setDiscordResult({ success: true, message: `✅ Connected as ${testRes.botName}` });
            setDiscordConfig(prev => ({ ...prev, botToken: '' }));
        } catch (e: any) {
            setDiscordResult({ success: false, message: e.message });
        } finally {
            setDiscordSaving(false);
        }
    };

    const handleDiscordTest = async () => {
        const token = discordConfig.botToken;
        if (!token || token.includes('...')) {
            setDiscordResult({ success: false, message: 'Enter a valid token first' });
            return;
        }
        setDiscordTesting(true);
        setDiscordResult(null);
        try {
            const res = await testDiscordBot(token);
            setDiscordResult({ success: res.success, message: res.success ? `✅ Connected as ${res.botName} (${res.botId})` : res.error || 'Failed' });
        } catch (e: any) {
            setDiscordResult({ success: false, message: e.message });
        } finally {
            setDiscordTesting(false);
        }
    };

    const handleDiscordDisconnect = async () => {
        if (!confirm('Disconnect Discord bot?')) return;
        await deleteDiscordConfig();
        setDiscordSaved(false);
        setDiscordConfig({ botToken: '', guildId: '', channelId: '' });
        setDiscordResult(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const providers: any = {};
            for (const p of PROVIDER_CONFIG) {
                providers[p.id] = {
                    apiKey: apiKeys[p.id] || '',
                    model: models[p.id] || '',
                    enabled: p.id === activeProvider || !!apiKeys[p.id] || p.id === 'custom',
                    ...(p.id === 'ollama' ? { baseUrl: ollamaUrl } : {}),
                    ...(p.id === 'custom' ? { baseUrl: customEndpointUrl } : {}),
                };
            }

            const cleanVtKey = vtApiKey.trim();
            if (cleanVtKey && !cleanVtKey.includes('••••') && !cleanVtKey.includes('...')) {
                const { saveVTConfig } = await import('@/actions/virustotal');
                const res = await saveVTConfig({ apiKey: cleanVtKey, enabled: true });
                if (res.success) {
                    setVtSaved(true);
                    setVtEnabled(true);
                    setVtApiKey(cleanVtKey.slice(0, 8) + '...');
                }
            }

            const result = await saveAllSettings({
                activeProvider,
                persona,
                systemPrompt: customPromptActive ? systemPrompt : undefined,
                nativeLanguage,
                providers,
                activeUserBehavior: activeBehavior,
                gifIntegration: gifConfig,
                fileSystemAccess,
                fileAccessMode,
                allowedFolders: fileAccessMode === 'custom' ? allowedFolders : undefined,
                tavilyApiKey: tavilyApiKey || undefined,
                googlePlacesApiKey: googlePlacesApiKey || undefined,
                ttsConfig,
                localSttUrl: localSttUrl || undefined,
                localImageGenUrl: localImageGenUrl || undefined,
                skills,
                taskTimeoutSeconds,
                safetyMode,
                isAutonomousMode,
                customEndpointToolCalling,
                customEndpointVisionSupport,
                customEndpointTtsUrl: customEndpointTtsUrl || undefined,
                customEndpointTimeout: customEndpointTimeout || 30,
                buddy_skin: buddySkin,
            } as any);


            if (result.success) {
                showStatus('Settings saved successfully! ✅', 'success');
            } else {
                showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (e: any) {
            showStatus(`Error: ${e.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (providerId: Provider) => {
        setTesting(providerId);
        try {
            const result = await testProvider(
                providerId,
                apiKeys[providerId] || undefined,
                providerId === 'ollama' ? ollamaUrl : providerId === 'custom' ? customEndpointUrl : undefined
            );
            setTestResults(prev => ({ ...prev, [providerId]: { success: result.success, message: result.success ? (result as any).message : result.error || 'Failed' } }));
        } catch (e: any) {
            setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: e.message } }));
        } finally {
            setTesting(null);
        }
    };

    if (!mounted || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-lime-500" />
        </div>
    );

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8 animate-fadeIn">
                    <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                        <SettingsIcon className="text-lime-500" size={24} />
                        {t('settings.title')}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {t('settings.subtitle')}
                    </p>
                </div>

                {/* ─── Settings Tab Navigation ─── */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    {[
                        { id: 'all',          icon: '📋', label: t('settings.tabs.all')          },
                        { id: 'general',      icon: '⚙️', label: t('settings.tabs.general')      },
                        { id: 'providers',    icon: '🤖', label: t('settings.tabs.providers')    },
                        { id: 'integrations', icon: '🔗', label: t('settings.tabs.integrations') },
                        { id: 'buddy',        icon: '🔔', label: t('settings.tabs.buddy')        },
                        { id: 'security',     icon: '🔒', label: t('settings.tabs.security')     },
                        { id: 'advanced',     icon: '🛠️', label: t('settings.tabs.advanced')     },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-light)] border border-transparent'
                            }`}
                        >
                            <span>{tab.icon}</span><span className="hidden sm:inline ml-1">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto space-y-8 stagger-children">

                    {(activeTab === 'all' || activeTab === 'general') && (<>
                    {/* ─── Appearance ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Monitor size={20} className="text-blue-500" />
                            {t('settings.appearance')}
                        </h2>
                        <div className="flex gap-3 p-1 rounded-xl w-fit border" style={{ borderColor: 'var(--border)', background: 'var(--surface-light)' }}>
                            {[
                                { key: 'light', icon: <Sun size={16} />, label: t('settings.light') },
                                { key: 'dark', icon: <Moon size={16} />, label: t('settings.dark') },
                                { key: 'system', icon: <Monitor size={16} />, label: t('settings.systemTheme') },
                            ].map(t => (
                                <button key={t.key}
                                    onClick={() => setTheme(t.key)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === t.key ? 'shadow-sm' : ''
                                        }`}
                                    style={{
                                        background: theme === t.key ? 'var(--surface)' : 'transparent',
                                        color: theme === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                    }}
                                    aria-label={`Set ${t.label} theme`}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ─── Language ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Globe size={20} className="text-blue-400" />
                            {t('settings.language')}
                        </h2>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            {t('settings.languageDesc')}
                        </p>
                        <select
                            value={locale}
                            onChange={e => { setLocale(e.target.value); setUserChangedLocale(true); }}
                            className="text-sm rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-lime-500"
                            style={{
                                background: 'var(--surface-light)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)',
                            }}
                            aria-label={t('settings.integrations.selectLanguage')}
                        >
                            {SUPPORTED_LOCALES.map(l => (
                                <option key={l.code} value={l.code}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                        {userChangedLocale && (
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-sm text-amber-500">
                                    ⚠️ {t('settings.languageRestartHint')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if ((window as any).skales?.send) {
                                            (window as any).skales.send('relaunch-app');
                                        } else {
                                            window.location.reload();
                                        }
                                    }}
                                    className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all whitespace-nowrap"
                                >
                                    {t('settings.sections.restartNow')}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* ─── Skales+ (hidden feature flag section - shown when SKALES_PLUS=true) ─── */}
                    {process.env.NEXT_PUBLIC_SKALES_PLUS === 'true' && (
                        <section className="rounded-2xl border p-6"
                            style={{ background: 'var(--surface)', borderColor: 'rgba(132,204,22,0.3)' }}>
                            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Sparkles size={20} className="text-lime-400" />
                                Skales+
                                <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(132,204,22,0.15)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.3)' }}>
                                    BETA
                                </span>
                            </h2>
                            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                                Your current plan: <strong style={{ color: '#84cc16' }}>{getUserTier().charAt(0).toUpperCase() + getUserTier().slice(1)}</strong>
                            </p>
                            <div className="space-y-2">
                                {Object.entries(FEATURE_CONFIG).map(([key, tier]) => {
                                    const label = getFeatureTierLabel(key);
                                    if (!label) return null;
                                    return (
                                        <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-xl"
                                            style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
                                            <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: tier === 'pro' ? 'rgba(168,85,247,0.15)' : 'rgba(132,204,22,0.15)',
                                                    color: tier === 'pro' ? '#a855f7' : '#84cc16',
                                                    border: `1px solid ${tier === 'pro' ? 'rgba(168,85,247,0.3)' : 'rgba(132,204,22,0.3)'}`,
                                                }}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ─── Desktop App (Electron only) ─── */}
                    {isElectron && (
                        <section className="rounded-2xl border p-6"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Monitor size={20} className="text-purple-500" />
                                Desktop App
                            </h2>
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.launchAtLogin')}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {t('settings.launchAtLoginDesc')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !autoLaunch;
                                        setAutoLaunch(next);
                                        (window as any).skales?.send('set-auto-launch', next);
                                    }}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoLaunch ? 'bg-purple-600' : 'bg-gray-600'}`}
                                    aria-pressed={autoLaunch}
                                    aria-label={t('settings.toggles.launchAtLogin')}
                                    title={autoLaunch ? 'Disable launch at login' : 'Enable launch at login'}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoLaunch ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Desktop Buddy toggle */}
                            <div className="flex items-center justify-between py-1 mt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                        🦎 Desktop Buddy
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {t('settings.toggles.desktopBuddyDesc')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !desktopBuddy;
                                        setDesktopBuddy(next);
                                        (window as any).skales?.send('set-desktop-buddy', next);
                                    }}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${desktopBuddy ? 'bg-lime-500' : 'bg-gray-600'}`}
                                    aria-pressed={desktopBuddy}
                                    aria-label={t('settings.toggles.desktopBuddy')}
                                    title={desktopBuddy ? 'Hide desktop buddy' : 'Show desktop buddy'}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${desktopBuddy ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Buddy Skin selector — accordion, visible when buddy is ON */}
                            {desktopBuddy && availableSkins.length > 0 && (
                                <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSkinSelectorOpen(prev => !prev)}
                                        className="w-full flex items-center justify-between text-left"
                                    >
                                        <div>
                                            <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                                🎨 {t('settings.buddySkin')}
                                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
                                                    {availableSkins.find(s => s.id === buddySkin)?.label || 'Skales'}
                                                </span>
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                {t('settings.buddySkinDesc')}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-200 ${skinSelectorOpen ? 'rotate-180' : ''}`}
                                            style={{ color: 'var(--text-muted)' }}
                                        />
                                    </button>

                                    {skinRestartBanner && (
                                        <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                                            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                                            <span className="flex-1">🎨 {t('settings.skinRestartRequired')}</span>
                                            <button onClick={() => {
                                                if ((window as any).skales?.send) {
                                                    (window as any).skales.send('relaunch-app');
                                                } else {
                                                    window.location.reload();
                                                }
                                            }} className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40">
                                                {t('settings.restart')}
                                            </button>
                                            <button onClick={() => setSkinRestartBanner(false)} className="px-3 py-1 rounded-lg text-xs font-bold"
                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                {t('settings.later')}
                                            </button>
                                        </div>
                                    )}
                                    {skinSelectorOpen && (
                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            {availableSkins.map(skin => {
                                                const isSelected = buddySkin === skin.id;
                                                const iconSrc = `/mascot/${skin.id}/icon.png`;
                                                return (
                                                    <button
                                                        key={skin.id}
                                                        type="button"
                                                        onClick={async () => {
                                                            setBuddySkin(skin.id);
                                                            // Save immediately before showing banner
                                                            try {
                                                                await saveAllSettings({ buddy_skin: skin.id } as any);
                                                            } catch { /* silently handled */ }
                                                            setSkinRestartBanner(true);
                                                        }}
                                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                                                        style={{
                                                            background: isSelected ? 'rgba(74,222,128,0.1)' : 'var(--surface-raised)',
                                                            border: isSelected ? '2px solid #4ade80' : '2px solid var(--border)',
                                                        }}
                                                        aria-pressed={isSelected}
                                                    >
                                                        <div className="relative">
                                                            {skin.preview || skin.id ? (
                                                                <img
                                                                    src={skin.preview || iconSrc}
                                                                    alt={skin.label}
                                                                    className="w-12 h-12 rounded-full object-cover"
                                                                    style={{ background: 'var(--background)' }}
                                                                    onError={(e) => {
                                                                        const el = e.currentTarget;
                                                                        el.style.display = 'none';
                                                                        const fallback = el.nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="w-12 h-12 rounded-full items-center justify-center text-white font-bold text-lg"
                                                                style={{
                                                                    display: 'none',
                                                                    background: `hsl(${skin.id.charCodeAt(0) * 7 % 360}, 60%, 45%)`,
                                                                }}
                                                            >
                                                                {skin.label.charAt(0).toUpperCase()}
                                                            </div>
                                                            {isSelected && (
                                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <CheckCircle2 size={12} className="text-white" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-medium" style={{ color: isSelected ? '#4ade80' : 'var(--text-secondary)' }}>
                                                            {skin.label}
                                                        </span>
                                                        {(skin as any).description && (
                                                            <span className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                                                                {(skin as any).description.split(' - ')[1] || (skin as any).description}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ─── Persona Selection ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <User size={20} className="text-purple-500" />
                            {t('settings.persona')}
                        </h2>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            {t('settings.personaDesc')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {PERSONAS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePersonaChange(p.id)}
                                    className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${persona === p.id
                                        ? 'border-lime-500 shadow-lg'
                                        : 'hover:border-[var(--text-muted)]'
                                        }`}
                                    style={{
                                        borderColor: persona === p.id ? '#84cc16' : 'var(--border)',
                                        background: persona === p.id ? 'var(--accent-glow)' : 'var(--background)',
                                    }}
                                    aria-label={`${p.label} persona`}
                                >
                                    <span className="text-2xl block mb-1">{p.emoji}</span>
                                    <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>{p.label}</span>
                                    <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* System Prompt / Identity Editor */}
                        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Globe size={16} className="text-blue-400" />
                                        Native Language
                                    </label>
                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                        Skales will use this language by default.
                                    </p>
                                </div>
                                <select
                                    value={nativeLanguage}
                                    onChange={(e) => setNativeLanguage(e.target.value)}
                                    className="p-2 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500 cursor-pointer w-full sm:w-auto sm:min-w-[150px]"
                                    style={{
                                        background: 'var(--background)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                    }}
                                    aria-label={t('settings.integrations.selectNativeLanguage')}
                                >
                                    <option value="en">English</option>
                                    <option value="de">German (Deutsch)</option>
                                    <option value="fr">French (Français)</option>
                                    <option value="es">Spanish (Español)</option>
                                    <option value="it">Italian (Italiano)</option>
                                    <option value="pt">Portuguese (Português)</option>
                                    <option value="nl">Dutch (Nederlands)</option>
                                    <option value="pl">Polish (Polski)</option>
                                    <option value="ru">Russian (Русский)</option>
                                    <option value="tr">Turkish (Türkçe)</option>
                                    <option value="ar">Arabic (العربية)</option>
                                    <option value="zh">Chinese (中文)</option>
                                    <option value="ja">Japanese (日本語)</option>
                                    <option value="ko">Korean (한국어)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between mb-2 mt-6">
                                <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Sparkles size={16} className="text-amber-500" />
                                    {t('settings.soulIdentity')}
                                </label>
                                {customPromptActive && (
                                    <button onClick={handleResetPrompt}
                                        className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        aria-label={t('settings.integrations.resetPrompt')}>
                                        Reset to Default
                                    </button>
                                )}
                            </div>

                            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                The core instructions that define Skales' personality and behavior. Edit this to customize your AI's soul.
                            </p>
                            <div className="relative">
                                <textarea
                                    value={systemPrompt}
                                    onChange={handlePromptChange}
                                    rows={4}
                                    className="w-full p-3 rounded-xl text-sm leading-relaxed outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                    style={{
                                        background: 'var(--background)',
                                        border: `1px solid ${customPromptActive ? 'rgba(245, 158, 11, 0.5)' : 'var(--border)'}`,
                                        color: 'var(--text-primary)',
                                    }}
                                    aria-label={t('settings.integrations.systemPrompt')}
                                />
                                {customPromptActive && (
                                    <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold">
                                        Customized
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
                    </>)}


                    {(activeTab === 'all' || activeTab === 'providers') && (<>
                    {/* ─── AI Providers ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Server size={20} className="text-lime-500" />
                            {t('settings.sections.aiProviders')}
                        </h2>
                        <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-xs" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.25)', color: 'var(--text-secondary)' }}>
                            <span className="text-lime-400 mt-0.5 shrink-0">ℹ️</span>
                            <span><strong style={{ color: 'var(--text-primary)' }}>Active Provider</strong> applies to the default <strong style={{ color: 'var(--text-primary)' }}>Skales</strong> agent only. Custom agents in the <Link href="/agents" className="text-lime-400 underline">Agents</Link> tab can use their own provider &amp; model independently.</span>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Add API keys for the providers you use. OpenRouter gives you access to 100+ models with one key.
                        </p>

                        {/* Primary providers - always visible */}
                        <div className="space-y-4">
                            {PROVIDER_CONFIG.filter(p => p.primary).map(provider => {
                                const isActive = activeProvider === provider.id;
                                const testResult = testResults[provider.id];
                                const isTesting = testing === provider.id;
                                return (
                                    <div key={provider.id}
                                        className={`rounded-xl border-2 p-5 transition-all ${isActive ? 'shadow-md' : ''}`}
                                        style={{
                                            borderColor: isActive ? '#84cc16' : 'var(--border)',
                                            background: isActive ? 'var(--accent-glow)' : 'var(--background)',
                                        }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{provider.icon}</span>
                                                <div>
                                                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{provider.label}</span>
                                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{provider.desc}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {testResult && (
                                                    <span className={`connection-badge ${testResult.success ? 'connected' : 'disconnected'}`}>
                                                        {testResult.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                        {testResult.success ? 'OK' : 'Failed'}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setActiveProvider(provider.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'hover:bg-[var(--surface-light)]'}`}
                                                    style={!isActive ? { color: 'var(--text-muted)', border: '1px solid var(--border)' } : undefined}
                                                    aria-label={`Set ${provider.label} as active provider`}
                                                >
                                                    {isActive ? '✓ Active' : 'Set Active'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {provider.needsKey && (
                                                <div>
                                                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                        <Key size={10} className="inline mr-1" />API Key
                                                    </label>
                                                    <input type="password" value={apiKeys[provider.id]}
                                                        onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                        placeholder={`Enter ${provider.label} API key...`}
                                                        className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                        aria-label={`API key for ${provider.label}`} />
                                                </div>
                                            )}
                                            {provider.id === 'ollama' && (
                                                <div className="space-y-2">
                                                    {/* FIX A: auto-detect banner */}
                                                    {ollamaDetected && (
                                                        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold" style={{ background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.35)', color: '#a3e635' }}>
                                                            <span>🦙 {t('settings.ollama.detected')} — {t('settings.ollama.modelsAvailable', { count: ollamaDetectedCount })}</span>
                                                            <button
                                                                onClick={() => { setActiveProvider('ollama'); }}
                                                                className="ml-2 px-2 py-0.5 rounded font-bold text-[10px] transition-colors hover:opacity-80"
                                                                style={{ background: 'rgba(163,230,53,0.25)', color: '#a3e635' }}
                                                            >{t('settings.ollama.useOllama')}</button>
                                                        </div>
                                                    )}
                                                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Server URL</label>
                                                    <input type="text" value={ollamaUrl}
                                                        onChange={(e) => setOllamaUrl(e.target.value)}
                                                        placeholder="http://localhost:11434/v1"
                                                        className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                    {/* FIX A/B: Detect + Fetch buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={detectOllamaManual}
                                                            disabled={ollamaDetecting}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: ollamaDetecting ? 0.6 : 1 }}
                                                        >
                                                            {ollamaDetecting ? t('settings.ollama.detecting') : t('settings.ollama.detect')}
                                                        </button>
                                                        <button
                                                            onClick={fetchOllamaModels}
                                                            disabled={ollamaFetchingModels}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                                                            style={{ background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.3)', color: '#a3e635', opacity: ollamaFetchingModels ? 0.6 : 1 }}
                                                        >
                                                            {ollamaFetchingModels ? t('settings.ollama.fetching') : t('settings.ollama.fetchModels')}
                                                        </button>
                                                    </div>
                                                    {/* FIX E: Helpful error + CORS guidance */}
                                                    {ollamaFetchError && (
                                                        <div className="px-3 py-2 rounded-lg text-[11px] whitespace-pre-line" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                                            {ollamaFetchError}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {provider.id === 'custom' && (
                                                <div>
                                                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                        {t('settings.customEndpoint.baseUrlLabel')}
                                                    </label>
                                                    <input type="text" value={customEndpointUrl}
                                                        onChange={(e) => setCustomEndpointUrl(e.target.value)}
                                                        placeholder={t('settings.customEndpoint.baseUrlPlaceholder')}
                                                        className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-purple-500"
                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Model</label>
                                                <select
                                                    // FIX B: For Ollama, check fetched models in addition to the static list
                                                    value={(PROVIDER_MODELS[provider.id]?.some(m => m.value === models[provider.id]) || (provider.id === 'ollama' && ollamaFetchedModels.includes(models[provider.id]))) ? models[provider.id] : '__custom__'}
                                                    onChange={(e) => {
                                                        if (e.target.value === '__custom__') { setModels(prev => ({ ...prev, [provider.id]: '' })); }
                                                        else { setModels(prev => ({ ...prev, [provider.id]: e.target.value })); }
                                                    }}
                                                    className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500 appearance-none cursor-pointer"
                                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                    aria-label={`Model name for ${provider.label}`}
                                                >
                                                    {PROVIDER_MODELS[provider.id]?.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                    {/* FIX B: Append fetched Ollama models that aren't in the static list */}
                                                    {provider.id === 'ollama' && ollamaFetchedModels
                                                        .filter(m => !PROVIDER_MODELS.ollama.some(p => p.value === m))
                                                        .map(m => <option key={m} value={m}>{m}</option>)}
                                                    <option value="__custom__">✏️ Custom model...</option>
                                                </select>
                                                {/* FIX B: For Ollama, also check fetched models before showing custom input */}
                                                {!(PROVIDER_MODELS[provider.id]?.some(m => m.value === models[provider.id]) || (provider.id === 'ollama' && ollamaFetchedModels.includes(models[provider.id]))) && (
                                                    <input type="text" value={models[provider.id]}
                                                        onChange={(e) => setModels(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                        placeholder={t('settings.integrations.customModel')}
                                                        className="w-full mt-2 p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                        aria-label={`Custom model name for ${provider.label}`} />
                                                )}
                                            </div>
                                        </div>
                                        {/* Model Auto-Fetch button (OpenAI, Anthropic, Google, OpenRouter) */}
                                        {['openai', 'anthropic', 'google', 'openrouter'].includes(provider.id) && (
                                            <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                                        <RotateCcw size={11} className="inline mr-1" />Fetch Available Models
                                                    </span>
                                                    <button
                                                        onClick={() => fetchProviderModels(provider.id)}
                                                        disabled={fetchingModels[provider.id] || (!apiKeys[provider.id] && provider.id !== 'anthropic')}
                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 bg-lime-500/10 text-lime-500 hover:bg-lime-500/20 disabled:opacity-40"
                                                    >
                                                        {fetchingModels[provider.id] ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                                                        Fetch
                                                    </button>
                                                </div>
                                                {fetchedModels[provider.id]?.length > 0 && (
                                                    <select
                                                        value={models[provider.id]}
                                                        onChange={(e) => setModels(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                        className="w-full p-2 rounded-lg text-xs outline-none transition-all focus:ring-1 focus:ring-lime-500 appearance-none cursor-pointer mt-1"
                                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                    >
                                                        {fetchedModels[provider.id].map(m => (
                                                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {lastFetched[provider.id] && (
                                                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                                        Last fetched: {new Date(lastFetched[provider.id]).toLocaleTimeString()} ({fetchedModels[provider.id]?.length || 0} models)
                                                    </p>
                                                )}
                                                {fetchModelError[provider.id] && (
                                                    <p className="text-[10px] mt-1 text-red-400">{fetchModelError[provider.id]}</p>
                                                )}
                                            </div>
                                        )}
                                        {/* Ollama Setup */}
                                        {provider.id === 'ollama' && (
                                            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                <h4 className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                    <Download size={14} className="text-blue-500" />Ollama Setup
                                                </h4>
                                                <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Run AI models locally - no cloud, no API costs. Requires 8 GB RAM+ and ~5 GB disk per model.</p>
                                                <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-500 rounded-lg font-bold hover:bg-blue-500/20 transition-colors text-[11px]">
                                                    <Download size={12} />Download Ollama<ExternalLink size={10} />
                                                </a>
                                            </div>
                                        )}
                                        {/* Custom Endpoint Setup */}
                                        {provider.id === 'custom' && (
                                            <div className="mt-4 space-y-3">
                                                {/* Optional API key */}
                                                <div>
                                                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                        <Key size={10} className="inline mr-1" />{t('settings.customEndpoint.apiKeyPlaceholder')}
                                                    </label>
                                                    <input type="password" value={apiKeys['custom']}
                                                        onChange={(e) => setApiKeys(prev => ({ ...prev, custom: e.target.value }))}
                                                        placeholder={t('settings.customEndpoint.apiKeyPlaceholder')}
                                                        className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-purple-500"
                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                </div>
                                                {/* Fetch Models */}
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                            <RotateCcw size={13} className="text-purple-500" />{t('settings.customEndpoint.fetchModels')}
                                                        </h4>
                                                        <button
                                                            onClick={async () => {
                                                                if (!customEndpointUrl.trim()) return;
                                                                setCustomFetchingModels(true);
                                                                try {
                                                                    const res = await fetch('/api/custom-endpoint/models', { cache: 'no-store' });
                                                                    const data = await res.json();
                                                                    if (data.success && Array.isArray(data.models)) {
                                                                        setCustomFetchedModels(data.models);
                                                                        if (data.models.length > 0 && !models['custom']) {
                                                                            setModels(prev => ({ ...prev, custom: data.models[0].id }));
                                                                        }
                                                                    }
                                                                } catch { /* ignore */ }
                                                                finally { setCustomFetchingModels(false); }
                                                            }}
                                                            disabled={customFetchingModels || !customEndpointUrl.trim()}
                                                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 disabled:opacity-40"
                                                        >
                                                            {customFetchingModels ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                                                            {t('settings.customEndpoint.fetchModels')}
                                                        </button>
                                                    </div>
                                                    {customFetchedModels.length > 0 && (
                                                        <select
                                                            value={models['custom']}
                                                            onChange={(e) => setModels(prev => ({ ...prev, custom: e.target.value }))}
                                                            className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
                                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                        >
                                                            {customFetchedModels.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    {customFetchedModels.length === 0 && (
                                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                            Enter an endpoint URL above and click Fetch Models to populate the list.
                                                        </p>
                                                    )}
                                                </div>
                                                {/* Tool calling toggle */}
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                                <Zap size={13} className="text-purple-500" />{t('settings.customEndpoint.toolCalling')}
                                                            </h4>
                                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('settings.customEndpoint.toolCallingDesc')}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setCustomEndpointToolCalling(v => !v)}
                                                            className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${customEndpointToolCalling ? 'bg-purple-500' : 'bg-gray-600'}`}
                                                            aria-label={t('settings.customEndpoint.toolCalling')}
                                                        >
                                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${customEndpointToolCalling ? 'left-5' : 'left-0.5'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Vision support toggle */}
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                                <Eye size={13} className="text-purple-500" />{t('settings.customEndpoint.visionSupport')}
                                                            </h4>
                                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('settings.customEndpoint.visionHelp')}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setCustomEndpointVisionSupport(v => !v)}
                                                            className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${customEndpointVisionSupport ? 'bg-purple-500' : 'bg-gray-600'}`}
                                                            aria-label={t('settings.customEndpoint.visionSupport')}
                                                        >
                                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${customEndpointVisionSupport ? 'left-5' : 'left-0.5'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* TTS endpoint URL */}
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                    <h4 className="text-xs font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                                                        <Volume2 size={13} className="text-purple-500" />{t('settings.customEndpoint.ttsUrl')}
                                                    </h4>
                                                    <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>{t('settings.customEndpoint.ttsEnabled')}</p>
                                                    <input
                                                        type="text"
                                                        value={customEndpointTtsUrl}
                                                        onChange={e => setCustomEndpointTtsUrl(e.target.value)}
                                                        placeholder="https://api.example.com/v1/audio/speech"
                                                        className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-purple-500 font-mono"
                                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                    />
                                                </div>
                                                {/* Request timeout */}
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                    <h4 className="text-xs font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                                                        <Timer size={13} className="text-purple-500" />{t('settings.customEndpoint.timeout')}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min={5}
                                                            value={customEndpointTimeout}
                                                            onChange={e => setCustomEndpointTimeout(Math.max(5, Number(e.target.value) || 30))}
                                                            className="w-24 p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-purple-500"
                                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                        />
                                                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('settings.customEndpoint.seconds')}</span>
                                                    </div>
                                                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{t('settings.customEndpoint.timeoutHint')}</p>
                                                </div>
                                            </div>
                                        )}
                                        <button onClick={() => handleTest(provider.id)} disabled={isTesting}
                                            className="mt-3 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-[var(--surface-light)]"
                                            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                            aria-label={`Test connection for ${provider.label}`}>
                                            {isTesting ? <><Loader2 size={12} className="animate-spin" /> Testing...</> : <><TestTube2 size={12} /> Test Connection</>}
                                        </button>
                                        {testResult && (
                                            <p className={`text-[11px] mt-2 font-medium ${testResult.success ? 'text-green-500' : 'text-red-400'}`}>{testResult.message}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* More LLMs accordion */}
                        <div className="mt-4">
                            <button
                                onClick={() => setMoreLLMsOpen(!moreLLMsOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--surface-light)]"
                                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--background)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🔧</span>
                                    <span>More LLM Providers</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                        OpenAI · Anthropic · Google · Groq · Mistral · DeepSeek · xAI
                                    </span>
                                </div>
                                <ChevronDown size={16} style={{ transform: moreLLMsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
                            </button>

                            {moreLLMsOpen && (
                                <div className="space-y-4 mt-4 animate-fadeIn">
                                    {PROVIDER_CONFIG.filter(p => !p.primary).map(provider => {
                                        const isActive = activeProvider === provider.id;
                                        const testResult = testResults[provider.id];
                                        const isTesting = testing === provider.id;
                                        return (
                                            <div key={provider.id}
                                                className={`rounded-xl border-2 p-5 transition-all ${isActive ? 'shadow-md' : ''}`}
                                                style={{
                                                    borderColor: isActive ? '#84cc16' : 'var(--border)',
                                                    background: isActive ? 'var(--accent-glow)' : 'var(--background)',
                                                }}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{provider.icon}</span>
                                                        <div>
                                                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{provider.label}</span>
                                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{provider.desc}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {testResult && (
                                                            <span className={`connection-badge ${testResult.success ? 'connected' : 'disconnected'}`}>
                                                                {testResult.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                                {testResult.success ? 'OK' : 'Failed'}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => setActiveProvider(provider.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'hover:bg-[var(--surface-light)]'}`}
                                                            style={!isActive ? { color: 'var(--text-muted)', border: '1px solid var(--border)' } : undefined}
                                                            aria-label={`Set ${provider.label} as active provider`}
                                                        >
                                                            {isActive ? '✓ Active' : 'Set Active'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {provider.needsKey && (
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                                <Key size={10} className="inline mr-1" />API Key
                                                            </label>
                                                            <input type="password" value={apiKeys[provider.id] || ''}
                                                                onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                                placeholder={`Enter ${provider.label} API key...`}
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                                aria-label={`API key for ${provider.label}`} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Model</label>
                                                        <select
                                                            value={PROVIDER_MODELS[provider.id]?.some(m => m.value === (models[provider.id] || '')) ? (models[provider.id] || '') : '__custom__'}
                                                            onChange={(e) => {
                                                                if (e.target.value === '__custom__') { setModels(prev => ({ ...prev, [provider.id]: '' })); }
                                                                else { setModels(prev => ({ ...prev, [provider.id]: e.target.value })); }
                                                            }}
                                                            className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500 appearance-none cursor-pointer"
                                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                            aria-label={`Model name for ${provider.label}`}
                                                        >
                                                            {PROVIDER_MODELS[provider.id]?.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                            <option value="__custom__">✏️ Custom model...</option>
                                                        </select>
                                                        {!PROVIDER_MODELS[provider.id]?.some(m => m.value === (models[provider.id] || '')) && (
                                                            <input type="text" value={models[provider.id] || ''}
                                                                onChange={(e) => setModels(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                                placeholder={t('settings.integrations.customModel')}
                                                                className="w-full mt-2 p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                                aria-label={`Custom model name for ${provider.label}`} />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Groq info */}
                                                {provider.id === 'groq' && (
                                                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)' }}>
                                                        <div className="space-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                                            <p>🎤 <strong>STT:</strong> Telegram voice messages → transcribed via Groq Whisper (free)</p>
                                                            <p>🔊 <strong>TTS:</strong> Voice replies via edge-tts (Microsoft Neural, free, no key needed)</p>
                                                        </div>
                                                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg font-bold hover:opacity-80 transition-opacity text-[11px]"
                                                            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                                                            <Key size={11} />Get Free Groq API Key<ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                )}
                                                {/* Mistral info */}
                                                {provider.id === 'mistral' && (
                                                    <div className="mt-3 p-3 rounded-xl text-[11px]" style={{ background: 'rgba(252,107,45,0.06)', border: '1px solid rgba(252,107,45,0.2)', color: 'var(--text-muted)' }}>
                                                        🇪🇺 European AI. Get an API key at <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">console.mistral.ai</a>. Free tier available.
                                                    </div>
                                                )}
                                                {/* DeepSeek info */}
                                                {provider.id === 'deepseek' && (
                                                    <div className="mt-3 p-3 rounded-xl text-[11px]" style={{ background: 'rgba(77,157,224,0.06)', border: '1px solid rgba(77,157,224,0.2)', color: 'var(--text-muted)' }}>
                                                        💰 Ultra-affordable: ~$0.07/M tokens. Get a key at <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">platform.deepseek.com</a>.
                                                    </div>
                                                )}
                                                {/* xAI info */}
                                                {provider.id === 'xai' && (
                                                    <div className="mt-3 p-3 rounded-xl text-[11px]" style={{ background: 'rgba(155,93,229,0.06)', border: '1px solid rgba(155,93,229,0.2)', color: 'var(--text-muted)' }}>
                                                        🌌 Real-time knowledge via X/Twitter data. Get a key at <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">console.x.ai</a>.
                                                    </div>
                                                )}
                                                <button onClick={() => handleTest(provider.id)} disabled={isTesting}
                                                    className="mt-3 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-[var(--surface-light)]"
                                                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                                    aria-label={`Test connection for ${provider.label}`}>
                                                    {isTesting ? <><Loader2 size={12} className="animate-spin" /> Testing...</> : <><TestTube2 size={12} /> Test Connection</>}
                                                </button>
                                                {testResult && (
                                                    <p className={`text-[11px] mt-2 font-medium ${testResult.success ? 'text-green-500' : 'text-red-400'}`}>{testResult.message}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                    </>)}

                    {(activeTab === 'all' || activeTab === 'buddy') && (<>
                    {/* ─── Friend Mode (Active Behavior) ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">🤝</span>
                                {t('settings.friendMode.title')}
                            </h2>
                            {/* Master Toggle */}
                            <button
                                onClick={() => setActiveBehavior(prev => ({ ...prev!, enabled: !prev?.enabled }))}
                                className={`relative w-12 h-6 rounded-full transition-all ${activeBehavior?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                aria-label={t('settings.toggles.friendMode')}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${activeBehavior?.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            {t('settings.friendMode.desc')}
                        </p>

                        <div className={`space-y-5 transition-opacity ${activeBehavior?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

                            {/* Frequency */}
                            <div>
<p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('settings.friendMode.frequency')}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {(['low', 'medium', 'high'] as const).map(freq => (
                                        <button
                                            key={freq}
                                            onClick={() => setActiveBehavior(prev => ({ ...prev!, frequency: freq }))}
                                            className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${activeBehavior?.frequency === freq ? 'border-lime-500 bg-lime-500/10 text-lime-400' : 'border-transparent hover:border-[var(--border)]'}`}
                                            style={{ background: activeBehavior?.frequency === freq ? undefined : 'var(--background)', color: activeBehavior?.frequency === freq ? undefined : 'var(--text-secondary)' }}
                                            aria-label={`Set Friend Mode frequency to ${freq === 'low' ? 'rarely' : freq === 'medium' ? 'sometimes' : 'often'}`}
                                        >
                                            {freq === 'low' ? `🌙 ${t('settings.friendMode.rarely')}` : freq === 'medium' ? `☀️ ${t('settings.friendMode.sometimes')}` : `⚡ ${t('settings.friendMode.often')}`}
                                            <span className="block text-[10px] mt-0.5 opacity-70">
                                                {freq === 'low' ? t('settings.friendMode.onceDay') : freq === 'medium' ? t('settings.friendMode.fewDay') : t('settings.friendMode.hourly')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quiet Hours */}
                            <div>
                                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('settings.friendMode.quietHours')} 🤫</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
<label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('settings.friendMode.from')}</label>
                                        <input
                                            type="number" min={0} max={23}
                                            value={activeBehavior?.quietHoursStart ?? 22}
                                            onChange={e => setActiveBehavior(prev => ({ ...prev!, quietHoursStart: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <span className="text-lg mt-4" style={{ color: 'var(--text-muted)' }}>→</span>
                                    <div className="flex-1">
<label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('settings.friendMode.until')}</label>
                                        <input
                                            type="number" min={0} max={23}
                                            value={activeBehavior?.quietHoursEnd ?? 7}
                                            onChange={e => setActiveBehavior(prev => ({ ...prev!, quietHoursEnd: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <p className="text-xs mt-4 flex-1" style={{ color: 'var(--text-muted)' }}>
                                        {t('settings.friendMode.quietExample')}
                                    </p>
                                </div>
                            </div>

                            {/* Channels */}
                            <div>
                                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>📡 {t('settings.friendMode.whereReach')}</p>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--surface-light)] transition-colors"
                                        style={{ background: 'var(--background)' }}>
                                        <input
                                            type="checkbox"
                                            checked={activeBehavior?.channels?.browser !== false}
                                            onChange={e => setActiveBehavior(prev => ({ ...prev!, channels: { ...prev!.channels, browser: e.target.checked } }))}
                                            className="w-4 h-4 accent-lime-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>💬 {t('settings.friendMode.dashboardChat')}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('settings.friendMode.dashboardChatDesc')}</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--surface-light)] transition-colors ${!telegramSaved ? 'opacity-50' : ''}`}
                                        style={{ background: 'var(--background)' }}>
                                        <input
                                            type="checkbox"
                                            checked={activeBehavior?.channels?.telegram !== false}
                                            disabled={!telegramSaved}
                                            onChange={e => setActiveBehavior(prev => ({ ...prev!, channels: { ...prev!.channels, telegram: e.target.checked } }))}
                                            className="w-4 h-4 accent-lime-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                📱 Telegram {!telegramSaved && <span className="text-xs text-amber-400 ml-1">{t('settings.friendMode.telegramFirst')}</span>}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('settings.friendMode.telegramDesc')}</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-xl transition-colors opacity-40 cursor-not-allowed"
                                        style={{ background: 'var(--background)' }}>
                                        <input
                                            type="checkbox"
                                            checked={false}
                                            disabled={true}
                                            className="w-4 h-4 accent-lime-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                💬 WhatsApp <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 ml-1">{t('settings.friendMode.whatsappSoon')}</span>
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('settings.friendMode.whatsappSoonDesc')}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* ── Buddy Intelligence (Proactive Notifications) ── */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>🧠 {t('settings.buddyIntelligence.title')}</p>
                                    <button
                                        onClick={() => setActiveBehavior(prev => ({ ...prev!, proactiveEnabled: !(prev?.proactiveEnabled !== false) }))}
                                        className={`relative w-10 h-5 rounded-full transition-all ${(activeBehavior as any)?.proactiveEnabled !== false ? 'bg-lime-500' : 'bg-gray-600'}`}
                                        aria-label={t('settings.buddyIntelligence.toggleLabel')}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(activeBehavior as any)?.proactiveEnabled !== false ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                    {t('settings.buddyIntelligence.desc')}
                                </p>
                                <div className={`space-y-1.5 transition-opacity ${(activeBehavior as any)?.proactiveEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                    {([
                                        { key: 'meeting-reminder', label: '⏰ Meeting Reminders', desc: '30 min before meetings' },
                                        { key: 'meeting-prep',     label: '📋 Meeting Prep',      desc: '60 min before (if description available)' },
                                        { key: 'task-complete',    label: '✅ Task Completions',   desc: 'When autopilot finishes a task' },
                                        { key: 'task-blocked',     label: '🚫 Task Blocked',       desc: 'When a task fails after retries' },
                                        { key: 'email-alert',      label: '📧 Email Alerts',       desc: 'When unread emails pile up' },
                                        { key: 'eod-summary',      label: '📊 End-of-Day Summary', desc: 'Afternoon wrap-up of completed work' },
                                        { key: 'idle-checkin',     label: '💤 Idle Check-in',      desc: 'When you\'ve been away 45+ min' },
                                        { key: 'morning-greeting', label: '☀️ Morning Greeting',   desc: 'Good morning between 7-9am' },
                                    ] as const).map(item => (
                                        <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--surface-light)] transition-colors"
                                            style={{ background: 'var(--background)' }}>
                                            <input
                                                type="checkbox"
                                                checked={(activeBehavior as any)?.notificationTypes?.[item.key] !== false}
                                                onChange={e => setActiveBehavior(prev => ({
                                                    ...prev!,
                                                    notificationTypes: {
                                                        ...((prev as any)?.notificationTypes || {}),
                                                        [item.key]: e.target.checked,
                                                    },
                                                }))}
                                                className="w-3.5 h-3.5 accent-lime-500"
                                            />
                                            <div>
                                                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                💡 {t('settings.friendMode.helpText')}
                            </div>
                        </div>
                    </section>
                    </>)}
                    {(activeTab === 'all' || activeTab === 'security') && (<>



                    {/* ─── Agent & Tasks ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">⚡</span>
                                {t('settings.agentTasks.title')}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {t('settings.agentTasks.timeout')}
                                </label>
                                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                    {t('settings.agentTasks.timeoutDesc')}
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={60}
                                        max={900}
                                        step={30}
                                        value={taskTimeoutSeconds}
                                        onChange={e => setTaskTimeoutSeconds(Number(e.target.value))}
                                        className="flex-1 accent-emerald-500"
                                    />
                                    <span className="text-sm font-mono w-20 text-right" style={{ color: 'var(--text-primary)' }}>
                                        {taskTimeoutSeconds >= 60
                                            ? `${Math.floor(taskTimeoutSeconds / 60)}m ${taskTimeoutSeconds % 60 > 0 ? `${taskTimeoutSeconds % 60}s` : ''}`.trim()
                                            : `${taskTimeoutSeconds}s`}
                                    </span>
                                </div>
                                <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <span>{t('settings.agentTasks.min')}</span>
                                    <span>{t('settings.agentTasks.default')}</span>
                                    <span>{t('settings.agentTasks.max')}</span>
                                </div>
                            </div>
                            {/* Autonomous Mode toggle */}
                            <div className="rounded-xl border p-4" style={{ borderColor: isAutonomousMode ? 'rgba(163,230,53,0.5)' : 'var(--border)', background: isAutonomousMode ? 'rgba(163,230,53,0.06)' : 'var(--surface-light)' }}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            🤖 {t('settings.agentTasks.autonomousMode')}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            {t('settings.agentTasks.autonomousModeDesc')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={autonomousToggling}
                                        onClick={async () => {
                                            const next = !isAutonomousMode;
                                            setAutonomousToggling(true);
                                            try {
                                                await setAutonomousMode(next);
                                                setIsAutonomousMode(next);
                                            } catch {
                                                /* keep previous state on error */
                                            } finally {
                                                setAutonomousToggling(false);
                                            }
                                        }}
                                        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-1 disabled:opacity-60"
                                        style={{ background: isAutonomousMode ? '#84cc16' : 'var(--border)' }}
                                        aria-label={isAutonomousMode ? 'Disable Autonomous Mode' : 'Enable Autonomous Mode'}
                                        role="switch"
                                        aria-checked={isAutonomousMode}
                                    >
                                        <span
                                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                                            style={{ transform: isAutonomousMode ? 'translateX(20px)' : 'translateX(0)' }}
                                        />
                                    </button>
                                </div>
                                {isAutonomousMode && safetyMode === 'safe' && (
                                    <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {t('settings.agentTasks.safetyNote')}
                                    </p>
                                )}
                            </div>

                            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                💡 {t('settings.agentTasks.checkpointNote')}
                            </div>
                        </div>
                    </section>
                    {/* ─── Safety Mode ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">🛡️</span>
                            Safety Mode
                        </h2>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Controls how Skales handles potentially dangerous shell commands (mass deletion, system shutdown, disk formatting, etc.).
                        </p>
                        <div className="space-y-2">
                            {([
                                {
                                    key: 'safe',
                                    label: '🟢 Safe (default)',
                                    desc: 'All actions require your approval before execution.',
                                    color: '#22c55e',
                                },
                                {
                                    key: 'unrestricted',
                                    label: '🔴 Unrestricted',
                                    desc: 'Skales executes everything without asking. You are responsible.',
                                    color: '#ef4444',
                                },
                            ] as const).map(opt => (
                                <label
                                    key={opt.key}
                                    className="flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all"
                                    style={{
                                        borderColor: safetyMode === opt.key ? opt.color : 'var(--border)',
                                        background: safetyMode === opt.key ? `${opt.color}15` : 'var(--surface-light)',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="safetyMode"
                                        value={opt.key}
                                        checked={safetyMode === opt.key}
                                        onChange={() => setSafetyMode(opt.key)}
                                        className="mt-0.5 accent-lime-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {safetyMode === 'unrestricted' && (
                            <div className="mt-3 p-3 rounded-xl border text-xs" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                                ⚠️ <strong>Unrestricted mode is active.</strong> Skales can run any shell command without confirmation, including destructive operations. Make sure you trust the AI's judgment before sending commands.
                            </div>
                        )}
                        <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                            ⚠️ <strong>Disclaimer:</strong> Safety Mode is a best-effort measure to limit potentially harmful commands. We cannot guarantee that the AI agent will never make mistakes or execute unintended actions. By using Unrestricted mode, you accept full responsibility. Skales is provided as-is without warranty.
                        </p>
                    </section>
                    </>)}

                    {(activeTab === 'all' || activeTab === 'integrations') && (<>
                    {/* ─── Twitter/X Integration ─── */}
                    {activeSkillIds.has('twitter') && (
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl font-black" style={{ fontFamily: 'serif', letterSpacing: '-1px' }}>𝕏</span>
                                Twitter / X
                                {twitterConnected && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">Connected</span>
                                )}
                            </h2>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Connect your Twitter / X account so Skales can post tweets, read mentions, and reply - from chat or Telegram.
                        </p>

                        <div className="space-y-3">
                            {/* API Key + Secret */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>API Key (Consumer Key)</label>
                                    <input
                                        type="password"
                                        value={twitterConfig.apiKey}
                                        onChange={e => setTwitterConfig(p => ({ ...p, apiKey: e.target.value }))}
                                        placeholder="••••••••••••••••"
                                        className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>API Secret (Consumer Secret)</label>
                                    <input
                                        type="password"
                                        value={twitterConfig.apiSecret}
                                        onChange={e => setTwitterConfig(p => ({ ...p, apiSecret: e.target.value }))}
                                        placeholder="••••••••••••••••"
                                        className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Access Token + Secret */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Access Token</label>
                                    <input
                                        type="password"
                                        value={twitterConfig.accessToken}
                                        onChange={e => setTwitterConfig(p => ({ ...p, accessToken: e.target.value }))}
                                        placeholder="••••••••••••••••"
                                        className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Access Token Secret</label>
                                    <input
                                        type="password"
                                        value={twitterConfig.accessSecret}
                                        onChange={e => setTwitterConfig(p => ({ ...p, accessSecret: e.target.value }))}
                                        placeholder="••••••••••••••••"
                                        className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Mode */}
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Permission Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { key: 'send_only', label: '📤 Send Only', desc: 'Post & reply only' },
                                        { key: 'read_write', label: '📖 Read & Write', desc: 'Also read mentions & timeline' },
                                        { key: 'full_autonomous', label: '🤖 Full Auto', desc: 'Skales acts on its own' },
                                    ] as const).map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setTwitterConfig(p => ({ ...p, mode: m.key }))}
                                            className="flex flex-col items-start p-2 rounded-xl border transition-all text-left"
                                            style={{
                                                borderColor: twitterConfig.mode === m.key ? '#38bdf8' : 'var(--border)',
                                                background: twitterConfig.mode === m.key ? 'rgba(56,189,248,0.08)' : 'var(--surface-light)',
                                            }}
                                        >
                                            <span className="text-xs font-semibold" style={{ color: twitterConfig.mode === m.key ? '#38bdf8' : 'var(--text-primary)' }}>{m.label}</span>
                                            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto-post toggle */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div
                                    onClick={() => setTwitterConfig(p => ({ ...p, autoPost: !p.autoPost }))}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${twitterConfig.autoPost ? 'bg-sky-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${twitterConfig.autoPost ? 'translate-x-4' : 'translate-x-1'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Allow proactive posting</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Skales may post tweets autonomously when relevant (e.g. scheduled updates)</p>
                                </div>
                            </label>

                            {/* Verify result */}
                            {twitterVerifyResult && (
                                <div className={`p-2.5 rounded-xl text-xs border ${twitterVerifyResult.ok ? 'border-green-500/30 bg-green-500/08 text-green-400' : 'border-red-500/30 bg-red-500/08 text-red-400'}`}>
                                    {twitterVerifyResult.ok ? '✅' : '❌'} {twitterVerifyResult.msg}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={async () => {
                                        setTwitterVerifying(true);
                                        setTwitterVerifyResult(null);
                                        try {
                                            const { saveTwitterConfig, verifyTwitterCredentials } = await import('@/actions/twitter');
                                            await saveTwitterConfig(twitterConfig); // save first so verifyTwitterCredentials can load them
                                            const r = await verifyTwitterCredentials();
                                            setTwitterVerifyResult({ ok: r.success, msg: r.success ? `Connected as @${r.data?.username || 'unknown'}` : (r.error || 'Verification failed') });
                                        } catch (e: any) {
                                            setTwitterVerifyResult({ ok: false, msg: e.message || 'Error' });
                                        } finally {
                                            setTwitterVerifying(false);
                                        }
                                    }}
                                    disabled={twitterVerifying || !twitterConfig.apiKey || !twitterConfig.accessToken}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50"
                                    style={{ borderColor: 'var(--border)', background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                                >
                                    {twitterVerifying ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                    {twitterVerifying ? 'Verifying…' : 'Test Connection'}
                                </button>
                                <button
                                    onClick={async () => {
                                        setTwitterSaving(true);
                                        try {
                                            const { saveTwitterConfig } = await import('@/actions/twitter');
                                            await saveTwitterConfig(twitterConfig);
                                            setTwitterConnected(!!(twitterConfig.apiKey && twitterConfig.accessToken));
                                        } catch { /* ignore */ }
                                        setTwitterSaving(false);
                                    }}
                                    disabled={twitterSaving || !twitterConfig.apiKey}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#38bdf8,#0284c7)', color: '#fff' }}
                                >
                                    {twitterSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {twitterSaving ? 'Saving…' : 'Save'}
                                </button>
                                {twitterConnected && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { deleteTwitterConfig } = await import('@/actions/twitter');
                                                await deleteTwitterConfig();
                                                setTwitterConfig({ apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', mode: 'send_only', autoPost: false });
                                                setTwitterConnected(false);
                                                setTwitterVerifyResult(null);
                                            } catch { /* ignore */ }
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all"
                                        style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}
                                    >
                                        <Trash2 size={13} /> Disconnect
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                    )}

                    {/* ─── TTS Configuration ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">🔊</span>
                                Voice (TTS) Provider
                            </h2>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Choose how Skales speaks back via Telegram voice messages. Default uses Groq PlayAI → Google Translate (free). ElevenLabs and Azure offer higher quality.
                        </p>

                        {/* Provider selector */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {(['default', 'local', 'elevenlabs', 'azure'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setTtsConfig(prev => ({ ...prev!, provider: p }))}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${ttsConfig?.provider === p
                                        ? 'border-lime-500 bg-lime-500/10 text-lime-400'
                                        : 'border-transparent hover:border-[var(--border)]'
                                        }`}
                                    style={{ background: ttsConfig?.provider === p ? undefined : 'var(--background)', color: ttsConfig?.provider === p ? undefined : 'var(--text-secondary)' }}
                                    aria-label={`Select ${p === 'default' ? 'Default' : p === 'local' ? 'Local' : p === 'elevenlabs' ? 'ElevenLabs' : 'Azure'} as TTS provider`}
                                >
                                    {p === 'default' ? '⚡ Default' : p === 'local' ? '🖥️ Local' : p === 'elevenlabs' ? '🎙️ ElevenLabs' : '☁️ Azure'}
                                </button>
                            ))}
                        </div>

                        {/* Default info */}
                        {ttsConfig?.provider === 'default' && (
                            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                <p>🟢 <strong>No API key needed.</strong> Uses Groq PlayAI (if Groq key set) → Google Translate TTS as fallback. Good quality, completely free.</p>
                            </div>
                        )}

                        {/* ElevenLabs */}
                        {ttsConfig?.provider === 'elevenlabs' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>ElevenLabs API Key</label>
                                    <input
                                        type="password"
                                        value={ttsConfig.elevenlabsApiKey || ''}
                                        onChange={e => setTtsConfig(prev => ({ ...prev!, elevenlabsApiKey: e.target.value }))}
                                        placeholder="sk_..."
                                        className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Voice ID</label>
                                    <input
                                        type="text"
                                        value={ttsConfig.elevenlabsVoiceId || ''}
                                        onChange={e => setTtsConfig(prev => ({ ...prev!, elevenlabsVoiceId: e.target.value }))}
                                        placeholder="21m00Tcm4TlvDq8ikWAM  (Rachel - default)"
                                        className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Find voice IDs at{' '}
                                        <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">elevenlabs.io/voice-library</a>.
                                        Leave blank to use Rachel (default).
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Azure */}
                        {ttsConfig?.provider === 'azure' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Azure Speech Key</label>
                                    <input
                                        type="password"
                                        value={ttsConfig.azureSpeechKey || ''}
                                        onChange={e => setTtsConfig(prev => ({ ...prev!, azureSpeechKey: e.target.value }))}
                                        placeholder={t('settings.integrations.azureKey')}
                                        className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Region</label>
                                        <input
                                            type="text"
                                            value={ttsConfig.azureSpeechRegion || ''}
                                            onChange={e => setTtsConfig(prev => ({ ...prev!, azureSpeechRegion: e.target.value }))}
                                            placeholder="eastus"
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Voice Name</label>
                                        <input
                                            type="text"
                                            value={ttsConfig.azureVoiceName || ''}
                                            onChange={e => setTtsConfig(prev => ({ ...prev!, azureVoiceName: e.target.value }))}
                                            placeholder="en-US-JennyNeural"
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Create a free Azure Speech resource at{' '}
                                    <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">portal.azure.com</a>{' '}
                                    (5 hours free TTS/month). Voice names:{' '}
                                    <a href="https://learn.microsoft.com/azure/ai-services/speech-service/language-support" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">full list</a>.
                                </p>
                            </div>
                        )}

                        {/* Local TTS */}
                        {ttsConfig?.provider === 'local' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Local TTS Endpoint URL</label>
                                    <input
                                        type="text"
                                        value={ttsConfig.localTtsUrl || ''}
                                        onChange={e => setTtsConfig(prev => ({ ...prev!, localTtsUrl: e.target.value }))}
                                        placeholder="http://127.0.0.1:5001/v1/audio/speech"
                                        className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500 font-mono"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                        OpenAI-compatible TTS endpoint (e.g. local Groq API, FastAPI wrapper). Expects POST with JSON: {JSON.stringify({ model: 'tts-1', input: 'text', voice: 'alloy', response_format: 'mp3' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ─── Local STT Configuration ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">🎤</span>
                            Local STT (Speech-to-Text)
                        </h2>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                            Run your own speech-to-text model (e.g. Whisper via Groq, local inference server).
                        </p>
                        <input
                            type="text"
                            value={localSttUrl}
                            onChange={e => setLocalSttUrl(e.target.value)}
                            placeholder="http://127.0.0.1:5001/v1/audio/transcriptions"
                            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500 font-mono"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            Expects multipart POST with audio file + {"model: 'whisper-1'"}
                        </p>
                    </section>

                    {/* ─── Local Image Generation ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">🎨</span>
                            Local Image Generation
                        </h2>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                            Use local image generation (Stable Diffusion, DALL-E compatible API).
                        </p>
                        <input
                            type="text"
                            value={localImageGenUrl}
                            onChange={e => setLocalImageGenUrl(e.target.value)}
                            placeholder="http://127.0.0.1:7860/api/v1/generation/text-to-image"
                            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500 font-mono"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            OpenAI-compatible endpoint. POST JSON: {JSON.stringify({ prompt: 'text', n: 1, size: '512x512' })}
                        </p>
                    </section>

                    {/* ─── GIF & Sticker Integration ─── */}
                    {activeSkillIds.has('gif_sticker') && (
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">🎭</span>
                                GIF &amp; Sticker Integration
                            </h2>
                            <button
                                onClick={() => setGifConfig(prev => ({ ...prev!, enabled: !prev?.enabled }))}
                                className={`relative w-12 h-6 rounded-full transition-all ${gifConfig?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                aria-label={t('settings.toggles.gifIntegration')}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${gifConfig?.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            Allow Skales to search and send GIFs in chat and Telegram. Powered by Klipy or Giphy.
                        </p>

                        <div className={`space-y-4 transition-opacity ${gifConfig?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            {/* Provider Selection */}
                            <div>
                                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>GIF Provider</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(['klipy', 'giphy'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setGifConfig(prev => ({ ...prev!, provider: p }))}
                                            className={`py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 justify-center ${gifConfig?.provider === p
                                                ? 'border-lime-500 bg-lime-500/10 text-lime-400'
                                                : 'border-transparent hover:border-[var(--border)]'
                                                }`}
                                            style={{ background: gifConfig?.provider === p ? undefined : 'var(--background)', color: gifConfig?.provider === p ? undefined : 'var(--text-secondary)' }}
                                            aria-label={`Select ${p === 'klipy' ? 'Klipy' : 'Giphy'} as GIF provider`}
                                        >
                                            {p === 'klipy' ? '🎬' : '🎪'} {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* API Key */}
                            <div>
                                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                                    {gifConfig?.provider === 'klipy' ? 'Klipy' : 'Giphy'} API Key
                                </label>
                                <input
                                    type="password"
                                    value={gifConfig?.apiKey || ''}
                                    onChange={e => setGifConfig(prev => ({ ...prev!, apiKey: e.target.value }))}
                                    placeholder={gifConfig?.provider === 'klipy' ? 'Klipy API Key...' : 'Giphy API Key...'}
                                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                />
                                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                                    {gifConfig?.provider === 'klipy'
                                        ? <>Get a free key at <a href="https://klipy.com/developers" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">klipy.com/developers</a></>
                                        : <>Get a free key at <a href="https://developers.giphy.com/" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">developers.giphy.com</a></>}
                                </p>
                            </div>

                            {/* Auto-send toggle */}
                            <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--surface-light)] transition-colors"
                                style={{ background: 'var(--background)' }}>
                                <input
                                    type="checkbox"
                                    checked={gifConfig?.autoSend ?? false}
                                    onChange={e => setGifConfig(prev => ({ ...prev!, autoSend: e.target.checked }))}
                                    className="w-4 h-4 accent-lime-500"
                                />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>🎲 Allow Skales to send GIFs proactively</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Skales may include a relevant GIF in responses when it fits the mood</p>
                                </div>
                            </label>

                            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                💡 Once configured, you can ask Skales: <em>"Send me a funny GIF"</em> or <em>"React with a GIF"</em> - it will search and send directly in chat or Telegram.
                            </div>
                        </div>
                    </section>
                    )}

                    {/* ─── Integrations ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <MessageSquare size={20} className="text-purple-500" />
                            {t('settings.sections.integrations')}
                        </h2>

                        {/* ── Telegram ── */}
                        {activeSkillIds.has('telegram') && (
                        <div className="rounded-xl border-2 mb-4 overflow-hidden transition-all"
                            style={{ borderColor: telegramPaired ? 'rgba(34,197,94,0.5)' : telegramSaved ? 'rgba(59,130,246,0.5)' : 'var(--border)', background: telegramPaired ? 'rgba(34,197,94,0.04)' : telegramSaved ? 'rgba(59,130,246,0.04)' : 'var(--background)' }}>
                            <button
                                className="w-full flex items-center justify-between p-4 text-left"
                                onClick={() => setShowTelegramSetup(!showTelegramSetup)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">✈</div>
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Telegram</h3>
                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                            {telegramPaired
                                                ? `Paired with ${telegramPairedUser} via @${telegramBotUsername}`
                                                : telegramSaved && telegramBotUsername
                                                    ? `Bot @${telegramBotUsername} ready - awaiting pairing`
                                                    : 'Send messages to Skales from your phone'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {telegramPaired ? (
                                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400">Paired ✓</span>
                                    ) : telegramSaved ? (
                                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-amber-500/15 text-amber-400">Awaiting Pair</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>Setup</span>
                                    )}
                                    <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showTelegramSetup ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </div>
                            </button>

                            {showTelegramSetup && (
                                <div className="px-4 pb-4 border-t animate-fadeIn" style={{ borderColor: 'var(--border)' }}>
                                    <div className="pt-4 space-y-4">
                                        {/* Step 1: How to get a bot token */}
                                        <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Step 1 - Create a Bot:</p>
                                            <p style={{ color: 'var(--text-muted)' }}>1. Open Telegram → search <strong>@BotFather</strong></p>
                                            <p style={{ color: 'var(--text-muted)' }}>2. Send <code className="bg-lime-500/10 text-lime-500 px-1 rounded">/newbot</code> and follow the steps</p>
                                            <p style={{ color: 'var(--text-muted)' }}>3. Copy the token and paste it below</p>
                                        </div>

                                        {/* Token input */}
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                <Key size={10} className="inline mr-1" />
                                                Bot Token
                                            </label>
                                            <input
                                                type="password"
                                                value={telegramToken}
                                                onChange={e => { setTelegramToken(e.target.value); setTelegramResult(null); }}
                                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                                className="w-full p-2.5 rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-blue-400"
                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                            />
                                        </div>

                                        {/* Save & Test Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={handleTelegramSave}
                                                disabled={telegramSaving || !telegramToken || telegramToken.includes('...')}
                                                className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-500 hover:bg-blue-400 text-white transition-all flex items-center gap-2 disabled:opacity-40"
                                            >
                                                {telegramSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                Save & Connect
                                            </button>
                                            <button
                                                onClick={handleTelegramTest}
                                                disabled={telegramTesting || !telegramToken || telegramToken.includes('...')}
                                                className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-40 hover:bg-[var(--surface-light)]"
                                                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                            >
                                                {telegramTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                                Test
                                            </button>
                                            {telegramSaved && (
                                                <>
                                                    <button
                                                        onClick={handleTelegramDisconnect}
                                                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:bg-red-500 hover:text-white"
                                                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={14} />
                                                        Disconnect
                                                    </button>
                                                    <button
                                                        onClick={handleTelegramPurge}
                                                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:bg-red-600 hover:text-white"
                                                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                                                    >
                                                        <RotateCcw size={14} />
                                                        Reset All
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Result message */}
                                        {telegramResult && (
                                            <p className={`text-[11px] font-medium ${telegramResult.success ? 'text-green-500' : 'text-red-400'}`}>
                                                {telegramResult.message}
                                            </p>
                                        )}

                                        {/* Step 2: Pairing (only shown after bot is saved) */}
                                        {telegramSaved && (
                                            <div className="p-4 rounded-xl text-xs space-y-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                <p className="font-bold text-blue-400 text-sm">Step 2 - Pair your Phone</p>
                                                <p style={{ color: 'var(--text-muted)' }}>
                                                    Open your bot <strong>@{telegramBotUsername}</strong> in Telegram and send this message:
                                                </p>
                                                <div className="p-3 rounded-lg font-mono text-center text-lg font-bold select-all"
                                                    style={{ background: 'var(--background)', color: '#84cc16', border: '1px solid var(--border)', letterSpacing: '0.15em' }}>
                                                    {telegramPairingCode ? `/pair ${telegramPairingCode}` : (
                                                        <span className="text-xs text-muted-foreground font-sans font-normal opacity-70">
                                                            {telegramSaving ? t('chat.status.generating') : t('settings.integrations.newCode')}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Bot process running indicator */}
                                                <div className="flex items-center gap-2 text-[10px] font-medium">
                                                    <div className={`w-2 h-2 rounded-full ${telegramBotRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {telegramBotRunning
                                                        ? <span className="text-green-400">Bot process running - ready to receive messages</span>
                                                        : <span className="text-red-400">Bot not running - restart Skales to activate the bot.</span>
                                                    }
                                                </div>
                                                {telegramPaired ? (
                                                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                                                        <CheckCircle2 size={14} className="text-green-500" />
                                                        <span className="font-bold text-green-400">Paired with {telegramPairedUser}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-amber-400 font-medium">⏳ Waiting for pairing...</p>
                                                )}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        onClick={handleRegeneratePairing}
                                                        className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-[var(--surface-light)] flex items-center gap-1"
                                                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                                    >
                                                        <RotateCcw size={10} />
                                                        New Code
                                                    </button>
                                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                        Only one device can be paired. Messages from Telegram appear in your chat.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* ── WhatsApp ── */}
                        {activeSkillIds.has('whatsapp') && (() => {
                            const waReady = whatsappStatus.state === 'ready';
                            const waQR = whatsappStatus.state === 'qr';
                            const waLoading = ['initializing', 'loading', 'authenticated'].includes(whatsappStatus.state);
                            const waBorderColor = waReady ? 'rgba(34,197,94,0.5)' : waQR || waLoading ? 'rgba(22,163,74,0.4)' : 'var(--border)';
                            const waBg = waReady ? 'rgba(34,197,94,0.04)' : waQR ? 'rgba(22,163,74,0.04)' : 'var(--background)';
                            return (
                                <div className="rounded-xl border-2 overflow-hidden transition-all"
                                    style={{ borderColor: waBorderColor, background: waBg }}>
                                    <button
                                        className="w-full flex items-center justify-between p-4 text-left"
                                        onClick={() => setShowWhatsAppSetup(!showWhatsAppSetup)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' }}>💬</div>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>WhatsApp</h3>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                    {waReady
                                                        ? `Connected as ${whatsappStatus.pushName || ''} (+${whatsappStatus.phoneNumber || ''})`
                                                        : waQR
                                                            ? 'Scan QR code with your phone'
                                                            : waLoading
                                                                ? 'Connecting...'
                                                                : 'Send automated messages & reminders via WhatsApp'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {waReady ? (
                                                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400">Connected ✓</span>
                                            ) : waQR ? (
                                                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400 flex items-center gap-1">
                                                    <Loader2 size={9} className="animate-spin" /> Scan QR
                                                </span>
                                            ) : waLoading ? (
                                                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-amber-500/15 text-amber-400 flex items-center gap-1">
                                                    <Loader2 size={9} className="animate-spin" /> Starting
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>Setup</span>
                                            )}
                                            <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showWhatsAppSetup ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </div>
                                    </button>

                                    {showWhatsAppSetup && (
                                        <div className="px-4 pb-4 border-t animate-fadeIn" style={{ borderColor: 'var(--border)' }}>
                                            <div className="pt-4 space-y-4">

                                                {/* ─ State: idle - not started ─ */}
                                                {whatsappStatus.state === 'idle' && (
                                                    <div className="space-y-3">
                                                        <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>How it works:</p>
                                                            <p style={{ color: 'var(--text-muted)' }}>1. Click <strong>Start WhatsApp</strong> below</p>
                                                            <p style={{ color: 'var(--text-muted)' }}>2. A QR code will appear - scan it with WhatsApp on your phone</p>
                                                            <p style={{ color: 'var(--text-muted)' }}>3. Session is saved - you only need to scan once</p>
                                                            <p className="text-amber-400 font-medium pt-1">⚠️ Send-only: Skales cannot read your chats (privacy by design)</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
                                                            <p className="font-bold text-green-400 mb-1">First-time setup:</p>
                                                            <p style={{ color: 'var(--text-muted)' }}>All required packages are included. Simply click <strong>Start WhatsApp</strong> below.</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl text-xs flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                                                            <span className="text-amber-400 text-sm leading-none mt-0.5">💡</span>
                                                            <p style={{ color: 'var(--text-muted)' }}>
                                                                <span className="font-semibold text-amber-400">Tip:</span> We recommend using a separate prepaid SIM card for the agent to avoid conflicts and errors with your personal number.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={handleWhatsAppStart}
                                                                disabled={whatsappStarting}
                                                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 disabled:opacity-50"
                                                                style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' }}
                                                            >
                                                                {whatsappStarting ? <Loader2 size={14} className="animate-spin" /> : <span>💬</span>}
                                                                Start WhatsApp
                                                            </button>
                                                            {/* Clear stale session - shown when QR fails to appear or spinner resets */}
                                                            <button
                                                                type="button"
                                                                onClick={handleWhatsAppClearSession}
                                                                className="px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                                                title={t('settings.integrations.deleteSession')}
                                                            >
                                                                <Trash2 size={12} />
                                                                Clear Session
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ─ State: initializing / loading ─ */}
                                                {waLoading && (
                                                    <div className="flex flex-col items-center gap-3 py-6">
                                                        <Loader2 size={32} className="animate-spin text-green-400" />
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {whatsappStatus.state === 'loading'
                                                                ? `Loading... ${whatsappStatus.loadingPercent || 0}%`
                                                                : whatsappStatus.state === 'authenticated'
                                                                    ? 'Authenticated - finalizing...'
                                                                    : 'Starting WhatsApp - please wait...'}
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This can take 15–30 seconds on first run</p>
                                                    </div>
                                                )}

                                                {/* ─ State: qr - show QR code ─ */}
                                                {waQR && whatsappStatus.qrCode && (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <p className="text-sm font-bold text-green-400">Scan with WhatsApp</p>
                                                        <div className="p-3 rounded-xl" style={{ background: '#fff', display: 'inline-block' }}>
                                                            <img
                                                                src={whatsappStatus.qrCode}
                                                                alt={t('settings.integrations.whatsappQr')}
                                                                width={220}
                                                                height={220}
                                                                style={{ display: 'block', borderRadius: 8 }}
                                                            />
                                                        </div>
                                                        <div className="text-xs space-y-1 text-center" style={{ color: 'var(--text-muted)' }}>
                                                            <p>Open <strong>WhatsApp</strong> → Settings → Linked Devices → Link a Device</p>
                                                            <p className="flex items-center justify-center gap-1">
                                                                <Loader2 size={10} className="animate-spin text-green-400" />
                                                                <span>Waiting for scan...</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ─ State: ready ─ */}
                                                {waReady && (
                                                    <div className="space-y-4">
                                                        {/* Connected info */}
                                                        <div className="flex items-center gap-3 p-3 rounded-xl"
                                                            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                                            <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-bold text-green-400">{whatsappStatus.pushName}</p>
                                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+{whatsappStatus.phoneNumber}</p>
                                                            </div>
                                                        </div>

                                                        {/* Permitted Contacts */}
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                                                Permitted Contacts
                                                            </p>
                                                            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                                                Skales can only send messages to contacts you explicitly allow below.
                                                            </p>

                                                            {whatsappContacts.length === 0 ? (
                                                                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No contacts yet - add one below.</p>
                                                            ) : (
                                                                <div className="space-y-1.5 mb-3">
                                                                    {whatsappContacts.map(contact => (
                                                                        <div key={contact.id}
                                                                            className="flex items-center justify-between p-2.5 rounded-lg"
                                                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                                                    style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' }}>
                                                                                    {(contact.name || '?').charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{contact.name || 'Unknown'}</p>
                                                                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{contact.phone || ''}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => handleWaToggleContact(contact.id, !contact.permitted)}
                                                                                    className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${contact.permitted ? 'bg-green-500' : 'bg-gray-600'}`}
                                                                                    aria-label={`Toggle message permission for ${contact.name}`}
                                                                                >
                                                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${contact.permitted ? 'left-4' : 'left-0.5'}`} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleWaRemoveContact(contact.id)}
                                                                                    className="p-1 rounded hover:text-red-400 transition-colors"
                                                                                    style={{ color: 'var(--text-muted)' }}
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Add contact form */}
                                                            <div className="flex gap-2 flex-wrap">
                                                                <input
                                                                    type="text"
                                                                    value={waNewName}
                                                                    onChange={e => setWaNewName(e.target.value)}
                                                                    placeholder={t('settings.integrations.name')}
                                                                    className="flex-1 min-w-[100px] p-2 rounded-lg text-xs outline-none"
                                                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                                />
                                                                <input
                                                                    type="tel"
                                                                    value={waNewPhone}
                                                                    onChange={e => setWaNewPhone(e.target.value)}
                                                                    placeholder={t('settings.integrations.number')}
                                                                    className="flex-1 min-w-[130px] p-2 rounded-lg text-xs outline-none"
                                                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                                />
                                                                <button
                                                                    onClick={handleWaAddContact}
                                                                    disabled={waAddingContact}
                                                                    className="px-3 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                                                                    style={{ background: '#25d366' }}
                                                                >
                                                                    {waAddingContact ? <Loader2 size={12} className="animate-spin" /> : '+ Add'}
                                                                </button>
                                                            </div>
                                                            {waContactError && (
                                                                <p className="text-[11px] text-red-400 mt-1">{waContactError}</p>
                                                            )}
                                                        </div>

                                                        {/* ─ Signature ─ */}
                                                        <div className="pt-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                                    Message Signature
                                                                </p>
                                                                {/* Toggle */}
                                                                <button
                                                                    onClick={() => setWaSignature(prev => ({ ...prev, enabled: !prev.enabled }))}
                                                                    className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${waSignature.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                                                    aria-label={t('settings.toggles.messageSignature')}
                                                                >
                                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${waSignature.enabled ? 'left-4' : 'left-0.5'}`} />
                                                                </button>
                                                            </div>

                                                            <div className={`space-y-2 transition-opacity ${waSignature.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                                {/* Text input */}
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={waSignature.text}
                                                                        onChange={e => {
                                                                            // strip HTML/code chars client-side too
                                                                            const clean = e.target.value
                                                                                .replace(/<[^>]*>/g, '')
                                                                                .replace(/[{}\[\]<>;`$\\]/g, '')
                                                                                .slice(0, 50);
                                                                            setWaSignature(prev => ({ ...prev, text: clean }));
                                                                            setWaSignatureSaved(false);
                                                                        }}
                                                                        maxLength={50}
                                                                        placeholder="e.g. ✨ Your assistant"
                                                                        className="flex-1 p-2 rounded-lg text-xs outline-none"
                                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                                    />
                                                                    <button
                                                                        onClick={handleWaSignatureSave}
                                                                        disabled={waSignatureSaving}
                                                                        className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                                                                        style={{ background: waSignatureSaved ? 'rgba(34,197,94,0.15)' : 'var(--surface-light)', color: waSignatureSaved ? '#4ade80' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                                                    >
                                                                        {waSignatureSaving ? <Loader2 size={11} className="animate-spin" /> : waSignatureSaved ? <CheckCircle2 size={11} /> : <Save size={11} />}
                                                                        {waSignatureSaved ? 'Saved' : 'Save'}
                                                                    </button>
                                                                </div>

                                                                {/* char counter + preview */}
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                                        {waSignature.text.length}/50 characters
                                                                    </p>
                                                                    {waSignature.text && (
                                                                        <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                                                                            Preview: <em>{waSignature.text}</em>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                                    Displayed in <em>italic</em> in WhatsApp. No HTML or code allowed.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* ─ Read & Write Mode ─ */}
                                                        <div className="pt-1">
                                                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                                                Incoming Messages
                                                            </p>
                                                            <div className="space-y-2">
                                                                {/* Send Only option */}
                                                                <label className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-[var(--surface-light)] transition-colors">
                                                                    <input
                                                                        type="radio"
                                                                        name="waMode"
                                                                        value="sendOnly"
                                                                        checked={waMode === 'sendOnly'}
                                                                        onChange={() => handleWaModeSave('sendOnly')}
                                                                        className="mt-0.5 accent-green-500"
                                                                    />
                                                                    <div>
                                                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Send Only</p>
                                                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Skales can send messages but won&apos;t read or respond to incoming ones.</p>
                                                                    </div>
                                                                </label>
                                                                {/* Read & Write option */}
                                                                <label className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-[var(--surface-light)] transition-colors">
                                                                    <input
                                                                        type="radio"
                                                                        name="waMode"
                                                                        value="readWrite"
                                                                        checked={waMode === 'readWrite'}
                                                                        onChange={() => setShowWaModeWarning(true)}
                                                                        className="mt-0.5 accent-green-500"
                                                                    />
                                                                    <div>
                                                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Read &amp; Write</p>
                                                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Skales reads incoming messages and replies autonomously via the agent.</p>
                                                                    </div>
                                                                </label>
                                                            </div>

                                                            {/* Confirmation warning */}
                                                            {showWaModeWarning && (
                                                                <div className="mt-2 p-3 rounded-lg border" style={{ background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.35)' }}>
                                                                    <p className="text-xs font-semibold mb-1" style={{ color: '#facc15' }}>⚠️ Enable Read &amp; Write mode?</p>
                                                                    <p className="text-[11px] mb-3" style={{ color: 'var(--text-secondary)' }}>
                                                                        Read &amp; Write mode allows Skales to read and respond to your WhatsApp messages autonomously. Only enable this if you trust Skales to act on your behalf.
                                                                    </p>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleWaModeSave('readWrite')}
                                                                            disabled={waModeSaving}
                                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                                            style={{ background: 'rgba(234,179,8,0.2)', color: '#facc15', border: '1px solid rgba(234,179,8,0.4)' }}
                                                                        >
                                                                            {waModeSaving ? 'Saving…' : 'Yes, enable it'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setShowWaModeWarning(false)}
                                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                                            style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {waModeSaved && (
                                                                <p className="text-[11px] mt-1.5" style={{ color: '#4ade80' }}>✓ Mode saved</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ─ Error state ─ */}
                                                {whatsappStatus.state === 'error' && (
                                                    <div className="space-y-2">
                                                        <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                            <p className="text-xs font-bold text-red-400 mb-1">⚠️ WhatsApp bot error</p>
                                                            <p className="text-xs text-red-300 break-words">{whatsappStatus.error || 'Unknown error - check the whatsapp-bot-error.log file in the apps/web folder.'}</p>
                                                        </div>
                                                        {/* Chrome-specific guidance */}
                                                        {(whatsappStatus as any).errorType === 'chrome_not_found' && (
                                                            <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                                                                <p className="font-bold text-amber-400">Chrome is required</p>
                                                                <p style={{ color: 'var(--text-muted)' }}>
                                                                    The WhatsApp bot uses a headless Chrome window to connect to WhatsApp Web. Please install Google Chrome:
                                                                </p>
                                                                <p>
                                                                    <a href="https://www.google.com/chrome/" target="_blank" rel="noreferrer"
                                                                        className="text-lime-400 underline font-medium">
                                                                        → Download Google Chrome
                                                                    </a>
                                                                </p>
                                                                <p style={{ color: 'var(--text-muted)' }}>After installing Chrome, click <strong>Disconnect</strong> below and then <strong>Start WhatsApp</strong> again.</p>
                                                            </div>
                                                        )}
                                                        {/* Module-not-found guidance */}
                                                        {(whatsappStatus as any).errorType === 'module_not_found' && (
                                                            <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                                                                <p className="font-bold text-amber-400">Missing dependency</p>
                                                                <p style={{ color: 'var(--text-muted)' }}>Reinstall Skales to restore all packages, then click Disconnect → Start WhatsApp.</p>
                                                            </div>
                                                        )}
                                                        {/* Generic guidance */}
                                                        {!(whatsappStatus as any).errorType && (
                                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                Click <strong>Disconnect</strong> and try again. If it keeps failing, check <code className="bg-black/30 px-1 rounded">apps/web/whatsapp-bot-error.log</code> for details.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ─ Disconnect button (shown when not idle) ─ */}
                                                {whatsappStatus.state !== 'idle' && (
                                                    <div className="flex justify-end pt-1">
                                                        <button
                                                            onClick={handleWhatsAppDisconnect}
                                                            disabled={whatsappDisconnecting}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-red-500 hover:text-white"
                                                            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                                                        >
                                                            {whatsappDisconnecting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                            Disconnect
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── Google Calendar ── */}
                        {activeSkillIds.has('googleCalendar') && (
                        <div className="rounded-xl border overflow-hidden mt-6" style={{ borderColor: 'var(--border)' }}>
                            <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
                                    📅 {t('settings.calendar.googleCalendar')}
                                    <CalendarStatusDot isConnected={calendarSaved} t={t} />
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Read and create Google Calendar events via API key or OAuth.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {calendarSaved && (
                                        <button onClick={handleCalendarDisconnect} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                    <button onClick={() => setShowCalendarSetup(v => !v)}
                                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                        style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                        {showCalendarSetup ? t('settings.calendar.hide') : t('settings.calendar.configure')}
                                    </button>
                                    <button type="button" onClick={() => toggleSkill('googleCalendar')}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${activeSkillIds.has('googleCalendar') ? 'bg-lime-500' : 'bg-gray-600'}`}
                                        role="switch" aria-checked={activeSkillIds.has('googleCalendar')}
                                        aria-label={t('settings.toggles.googleCalendar')}>
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${activeSkillIds.has('googleCalendar') ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            {showCalendarSetup && (
                                <div className="px-4 pb-4 pt-2 space-y-4" style={{ background: 'var(--surface)' }}>
                                    <div>
                                        <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <Key size={12} /> API Key - Read Only
                                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-1 hover:underline text-[10px]">Get key <ExternalLink size={10} /></a>
                                        </p>
                                        <input type="password" placeholder="AIza..."
                                            value={calendarConfig.apiKey || ''}
                                            onChange={e => setCalendarConfig(p => ({ ...p, apiKey: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        <input type="text" placeholder="Calendar ID (default: primary)"
                                            value={calendarConfig.calendarId || ''}
                                            onChange={e => setCalendarConfig(p => ({ ...p, calendarId: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500 mt-2"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            🔐 OAuth - Read + Write (optional)
                                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-1 hover:underline text-[10px]">Setup <ExternalLink size={10} /></a>
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input type="text" placeholder="OAuth Client ID"
                                                value={calendarConfig.clientId || ''}
                                                onChange={e => setCalendarConfig(p => ({ ...p, clientId: e.target.value }))}
                                                className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                            <input type="password" placeholder="OAuth Client Secret"
                                                value={calendarConfig.clientSecret || ''}
                                                onChange={e => setCalendarConfig(p => ({ ...p, clientSecret: e.target.value }))}
                                                className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        </div>
                                        {calendarConfig.clientId && (
                                            <div className="mt-2 space-y-2">
                                                <button onClick={handleCalendarGetAuthUrl}
                                                    className="text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                                    <ExternalLink size={12} /> Open Google Auth (step 1)
                                                </button>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder={t('settings.integrations.pasteAuthCode')}
                                                        value={calendarAuthCode}
                                                        onChange={e => setCalendarAuthCode(e.target.value)}
                                                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                    <button onClick={handleCalendarExchangeCode} disabled={calendarExchanging || !calendarAuthCode}
                                                        className="text-xs px-3 py-2 rounded-lg font-medium transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50">
                                                        {calendarExchanging ? <Loader2 size={13} className="animate-spin" /> : 'Authorize'}
                                                    </button>
                                                </div>
                                                {calendarConfig.refreshToken && (
                                                    <p className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle2 size={10} /> OAuth token stored</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={handleCalendarSave} disabled={calendarSaving}
                                            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50 flex items-center justify-center gap-2">
                                            {calendarSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Save
                                        </button>
                                        <button onClick={handleCalendarTest} disabled={calendarTesting}
                                            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            {calendarTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                            Test
                                        </button>
                                    </div>
                                    {calendarResult && (
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${calendarResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                            {calendarResult.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            {calendarResult.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* ── Apple Calendar (CalDAV / iCloud) ── */}
                        {activeSkillIds.has('googleCalendar') && (
                        <div className="rounded-xl border overflow-hidden mt-6" style={{ borderColor: 'var(--border)' }}>
                            <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
                                    🍎 {t('calendar.apple')}
                                    <CalendarStatusDot isConnected={appleCalendarSaved} t={t} />
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {t('calendar.appPasswordHelp')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {appleCalendarSaved && (
                                        <button onClick={handleAppleCalendarDisconnect} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                    <button onClick={() => setShowAppleCalendarSetup(v => !v)}
                                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                        style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                        {showAppleCalendarSetup ? t('settings.calendar.hide') : t('settings.calendar.configure')}
                                    </button>
                                </div>
                            </div>
                            {showAppleCalendarSetup && (
                                <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'var(--surface)' }}>
                                    <input type="text" placeholder={t('calendar.caldavUrl') + ' (https://caldav.icloud.com/)'}
                                        value={appleCalendarConfig.caldavUrl}
                                        onChange={e => setAppleCalendarConfig(p => ({ ...p, caldavUrl: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    <input type="email" placeholder={t('calendar.appleId')}
                                        value={appleCalendarConfig.username}
                                        onChange={e => setAppleCalendarConfig(p => ({ ...p, username: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    <input type="password" placeholder={t('calendar.appPassword')}
                                        value={appleCalendarConfig.password}
                                        onChange={e => setAppleCalendarConfig(p => ({ ...p, password: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={handleAppleCalendarSave}
                                            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all bg-lime-500 hover:bg-lime-400 text-black flex items-center justify-center gap-2">
                                            <Save size={14} /> {t('calendar.connect')}
                                        </button>
                                        <button onClick={handleAppleCalendarTest} disabled={appleCalendarTesting}
                                            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            {appleCalendarTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                            {t('calendar.testConnection')}
                                        </button>
                                    </div>
                                    {appleCalendarResult && (
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${appleCalendarResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                            {appleCalendarResult.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            {appleCalendarResult.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* ── Outlook Calendar (Microsoft Graph) ── */}
                        {activeSkillIds.has('googleCalendar') && (
                        <div className="rounded-xl border overflow-hidden mt-6" style={{ borderColor: 'var(--border)' }}>
                            <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
                                    📬 {t('calendar.outlook')}
                                    <CalendarStatusDot isConnected={outlookSaved} t={t} />
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Microsoft Graph API — OAuth 2.0
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {outlookSaved && (
                                        <button onClick={handleOutlookDisconnect} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                    <button onClick={() => setShowOutlookSetup(v => !v)}
                                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                        style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                        {showOutlookSetup ? t('settings.calendar.hide') : t('settings.calendar.configure')}
                                    </button>
                                </div>
                            </div>
                            {showOutlookSetup && (
                                <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'var(--surface)' }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input type="text" placeholder="OAuth Client ID (Azure AD)"
                                            value={outlookClientId}
                                            onChange={e => setOutlookClientId(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        <input type="password" placeholder="Client Secret (optional)"
                                            value={outlookClientSecret}
                                            onChange={e => setOutlookClientSecret(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    </div>
                                    {outlookClientId && (
                                        <div className="space-y-2">
                                            <button onClick={handleOutlookGetAuthUrl}
                                                className="text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                                <ExternalLink size={12} /> Open Microsoft Auth
                                            </button>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Paste authorization code here..."
                                                    value={outlookAuthCode}
                                                    onChange={e => setOutlookAuthCode(e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                    style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                <button onClick={handleOutlookExchangeCode} disabled={outlookExchanging || !outlookAuthCode}
                                                    className="text-xs px-3 py-2 rounded-lg font-medium transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50">
                                                    {outlookExchanging ? <Loader2 size={13} className="animate-spin" /> : 'Authorize'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {outlookSaved && (
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={handleOutlookTest} disabled={outlookTesting}
                                                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                                {outlookTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                                {t('calendar.testConnection')}
                                            </button>
                                        </div>
                                    )}
                                    {outlookResult && (
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${outlookResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                            {outlookResult.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            {outlookResult.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* ── Planner AI ── */}
                        {activeSkillIds.has('googleCalendar') && (
                        <div className="rounded-xl border-2 mb-4 mt-6 overflow-hidden transition-all"
                            style={{
                                borderColor: plannerLoaded ? 'rgba(74,222,128,0.5)' : 'var(--border)',
                                background: plannerLoaded ? 'rgba(74,222,128,0.04)' : 'var(--background)',
                            }}>
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                                        style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
                                        <Timer size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Planner AI</h3>
                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                            Configure your daily schedule preferences
                                        </p>
                                    </div>
                                    {plannerLoaded && (
                                        <span className="ml-auto text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400">
                                            Configured ✓
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Day Start</label>
                                            <input type="time" value={plannerDayStart} onChange={e => setPlannerDayStart(e.target.value)}
                                                className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Day End</label>
                                            <input type="time" value={plannerDayEnd} onChange={e => setPlannerDayEnd(e.target.value)}
                                                className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Work Days</label>
                                        <div className="flex gap-1">
                                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                                                const dayNum = i + 1;
                                                const active = plannerWorkDays.includes(dayNum);
                                                return (
                                                    <button key={d} onClick={() => setPlannerWorkDays(prev => active ? prev.filter(x => x !== dayNum) : [...prev, dayNum])}
                                                        className="px-2 py-1 rounded text-xs font-bold transition-all"
                                                        style={{
                                                            background: active ? 'rgba(74,222,128,0.2)' : 'var(--surface)',
                                                            color: active ? '#4ade80' : 'var(--text-muted)',
                                                            border: `1px solid ${active ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
                                                        }}>
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Focus Hours</label>
                                            <input type="number" min={0} max={10} value={plannerFocusHours} onChange={e => setPlannerFocusHours(Number(e.target.value))}
                                                className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Break Style</label>
                                            <select value={plannerBreakStyle} onChange={e => setPlannerBreakStyle(e.target.value as any)}
                                                className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                <option value="pomodoro">Pomodoro (25/5)</option>
                                                <option value="90min">90-min blocks</option>
                                                <option value="flexible">Flexible</option>
                                                <option value="none">No breaks</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Regular Tasks (comma-separated)</label>
                                        <input type="text" value={plannerRegularTasks} onChange={e => setPlannerRegularTasks(e.target.value)}
                                            placeholder="e.g. Email triage, Code review, Standup"
                                            className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Fixed Appointments (one per line, include time)</label>
                                        <textarea value={plannerFixedAppointments} onChange={e => setPlannerFixedAppointments(e.target.value)}
                                            placeholder={"e.g.\nKids pickup at 16:00\nGym 07:00-08:00"}
                                            rows={3}
                                            className="w-full p-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handlePlannerSave} disabled={plannerSaving}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                            style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#000' }}>
                                            {plannerSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Save Planner Preferences
                                        </button>
                                        <Link href="/planner"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                            <ExternalLink size={14} />
                                            Open Planner
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* ── Replicate Integration ── */}
                        <div className="rounded-xl border-2 mb-4 overflow-hidden transition-all"
                            style={{
                                borderColor: replicateSaved ? 'rgba(99,102,241,0.5)' : 'var(--border)',
                                background: replicateSaved ? 'rgba(99,102,241,0.04)' : 'var(--background)',
                            }}>
                            {/* Header */}
                            <button className="w-full flex items-center justify-between p-4 text-left"
                                onClick={() => setShowReplicateSetup(!showReplicateSetup)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">{t('settings.integrations.replicate.title')}</h3>
                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                            {t('settings.integrations.replicate.description')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {replicateSaved
                                        ? <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-indigo-500/15 text-indigo-400">
                                            {t('settings.integrations.replicate.connected')} ✓
                                          </span>
                                        : <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                                            {t('settings.integrations.replicate.notConfigured')}
                                          </span>
                                    }
                                    <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showReplicateSetup ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </div>
                            </button>

                            {/* Expandable body */}
                            {showReplicateSetup && (
                                <div className="px-4 pb-4 border-t animate-fadeIn" style={{ borderColor: 'var(--border)' }}>
                                    <div className="pt-4 space-y-3">
                                        {/* Info box */}
                                        <div className="p-3 rounded-xl text-xs space-y-1"
                                            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                            <p className="font-bold text-indigo-400">💡 One key, 50+ models</p>
                                            <p style={{ color: 'var(--text-muted)' }}>
                                                Replicate gives you access to Flux, SDXL, MiniMax Video, HunyuanVideo and many more - all with a single API token.
                                            </p>
                                            <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                                                → {t('settings.integrations.replicate.getToken')} at replicate.com
                                            </a>
                                        </div>

                                        {/* Token input */}
                                        <div>
                                            <label className="block text-[11px] font-semibold mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>
                                                <Key size={10} className="inline mr-1" />
                                                API Token
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showReplicateToken ? 'text' : 'password'}
                                                    value={replicateToken}
                                                    onChange={e => {
                                                        setReplicateToken(e.target.value);
                                                        setReplicateSaved(false);
                                                        setReplicateTestResult(null);
                                                    }}
                                                    placeholder={t('settings.integrations.replicate.tokenPlaceholder')}
                                                    className="w-full p-2.5 pr-10 rounded-lg text-sm outline-none focus:ring-1"
                                                    style={{
                                                        background: 'var(--surface)',
                                                        border: '1px solid var(--border)',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReplicateToken(!showReplicateToken)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    {showReplicateToken ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={async () => {
                                                    const tok = replicateToken.trim();
                                                    if (!tok) return;
                                                    setReplicateSaving(true);
                                                    try {
                                                        await saveAllSettings({ replicate_api_token: tok } as any);
                                                        setReplicateSaved(true);
                                                        setReplicateToken(tok.slice(0, 6) + '...');
                                                        setReplicateTestResult({ success: true, message: t('settings.integrations.replicate.testSuccess') });
                                                    } catch (e: any) {
                                                        setReplicateTestResult({ success: false, message: e?.message || 'Save failed' });
                                                    } finally {
                                                        setReplicateSaving(false);
                                                    }
                                                }}
                                                disabled={replicateSaving || !replicateToken.trim()}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition-all"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                                                {replicateSaving
                                                    ? <><Loader2 size={13} className="animate-spin" /> {t('settings.saving')}</>
                                                    : <><Save size={13} /> {t('settings.save')}</>
                                                }
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    setReplicateTesting(true);
                                                    setReplicateTestResult(null);
                                                    try {
                                                        const res = await fetch('/api/replicate/test');
                                                        const data = await res.json();
                                                        setReplicateTestResult({
                                                            success: data.success,
                                                            message: data.success
                                                                ? t('settings.integrations.replicate.testSuccess')
                                                                : (data.error || t('settings.integrations.replicate.testFailed')),
                                                        });
                                                        if (data.success) setReplicateSaved(true);
                                                    } catch (e: any) {
                                                        setReplicateTestResult({ success: false, message: e?.message || t('settings.integrations.replicate.testFailed') });
                                                    } finally {
                                                        setReplicateTesting(false);
                                                    }
                                                }}
                                                disabled={replicateTesting}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition-all"
                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                {replicateTesting
                                                    ? <><Loader2 size={13} className="animate-spin" /> Testing…</>
                                                    : <><TestTube2 size={13} /> {t('settings.integrations.replicate.testConnection')}</>
                                                }
                                            </button>

                                            {replicateSaved && (
                                                <button
                                                    onClick={async () => {
                                                        await saveAllSettings({ replicate_api_token: '' } as any);
                                                        setReplicateToken('');
                                                        setReplicateSaved(false);
                                                        setReplicateTestResult(null);
                                                    }}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-red-400 hover:text-white hover:bg-red-500 transition-all"
                                                    style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                                                    <Trash2 size={13} /> {t('settings.save') === 'Save' ? 'Disconnect' : '×'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Test result */}
                                        {replicateTestResult && (
                                            <p className="text-[11px] font-medium flex items-center gap-1.5"
                                                style={{ color: replicateTestResult.success ? '#4ade80' : '#f87171' }}>
                                                {replicateTestResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {replicateTestResult.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Other integrations - coming soon */}
                        <p className="text-xs font-medium mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>More integrations coming soon:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {[
                                { name: 'Google Drive', color: 'bg-yellow-500', letter: 'D' },
                                { name: 'Slack', color: 'bg-purple-500', letter: 'S' },
                                { name: 'Notion', color: 'bg-gray-600', letter: 'N' },
                                { name: 'GitHub', color: 'bg-gray-700', letter: 'G' },
                                { name: 'Google Docs', color: 'bg-blue-600', letter: 'D' },
                            ].map(intg => (
                                <div key={intg.name} className="p-2.5 border rounded-xl flex items-center gap-2 opacity-40 cursor-not-allowed"
                                    style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
                                    <div className={`w-7 h-7 ${intg.color} rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{intg.letter}</div>
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{intg.name}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ─── Email (IMAP / SMTP) - multi-account ─── */}
                    {activeSkillIds.has('email') && (
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => setShowEmailSetup(!showEmailSetup)}>
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">✉️</span>
                                Email (IMAP / SMTP)
                            </h2>
                            <div className="flex items-center gap-2">
                                {emailAccounts.length > 0 && (
                                    <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400">
                                        {emailAccounts.length} account{emailAccounts.length > 1 ? 's' : ''} ✓
                                    </span>
                                )}
                                <span style={{ color: 'var(--text-muted)', transform: showEmailSetup ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                            </div>
                        </div>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                            Connect up to 5 email accounts via IMAP/SMTP. Set an alias and permission per account - Skales will respect them.
                        </p>

                        {showEmailSetup && (
                            <div className="space-y-3 animate-fadeIn">
                                {/* Info: Gmail */}
                                <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <p className="font-bold text-blue-400">💡 Gmail Users</p>
                                    <p style={{ color: 'var(--text-muted)' }}>Use an <strong>App Password</strong> and enable IMAP in Gmail Settings → Forwarding and POP/IMAP.</p>
                                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-lime-400 underline">→ Create App Password</a>
                                </div>

                                {/* Account cards */}
                                {emailAccounts.map((acct) => {
                                    const isExpanded = expandedEmailId === acct.id;
                                    const isEditing = editingEmail?.id === acct.id;
                                    const displayData = isEditing ? editingEmail! : acct;
                                    const permColors: Record<EmailPermission, string> = {
                                        'read-only': 'bg-blue-500/15 text-blue-400',
                                        'write-only': 'bg-orange-500/15 text-orange-400',
                                        'read-write': 'bg-lime-500/15 text-lime-400',
                                    };
                                    return (
                                        <div key={acct.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                            {/* Card header */}
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-light)] transition-colors"
                                                onClick={() => {
                                                    if (isExpanded) {
                                                        setExpandedEmailId(null);
                                                        setEditingEmail(null);
                                                        setEmailAccountTestResult(null);
                                                    } else {
                                                        setExpandedEmailId(acct.id);
                                                        setEditingEmail({ ...acct });
                                                        setEmailAccountTestResult(null);
                                                    }
                                                }}
                                            >
                                                <span className="text-base">📧</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {acct.alias || acct.username || 'Unnamed Account'}
                                                    </p>
                                                    {acct.alias && acct.username && (
                                                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{acct.username}</p>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${permColors[acct.permissions]}`}>
                                                    {acct.permissions}
                                                </span>
                                                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                                            </div>

                                            {/* Expanded form */}
                                            {isExpanded && isEditing && (
                                                <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>

                                                    {/* Alias + Permissions */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Account Alias</label>
                                                            <input type="text" value={displayData.alias}
                                                                onChange={e => setEditingEmail(p => p ? { ...p, alias: e.target.value } : p)}
                                                                placeholder="e.g. Work Gmail, Personal"
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Permissions</label>
                                                            <select value={displayData.permissions}
                                                                onChange={e => setEditingEmail(p => p ? { ...p, permissions: e.target.value as EmailPermission } : p)}
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                                <option value="read-write">Read + Write</option>
                                                                <option value="read-only">Read Only</option>
                                                                <option value="write-only">Write Only</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Credentials */}
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email Address / Login</label>
                                                            <input type="email" value={displayData.username}
                                                                onChange={e => setEditingEmail(p => p ? { ...p, username: e.target.value } : p)}
                                                                placeholder="you@example.com"
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password / App Password</label>
                                                            <input type="password" value={displayData.password}
                                                                onChange={e => setEditingEmail(p => p ? { ...p, password: e.target.value } : p)}
                                                                placeholder={t('settings.integrations.password')}
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Display Name (Sender)</label>
                                                            <input type="text" value={displayData.displayName}
                                                                onChange={e => setEditingEmail(p => p ? { ...p, displayName: e.target.value } : p)}
                                                                placeholder="e.g. Mario Rossi"
                                                                className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                        </div>
                                                    </div>

                                                    {/* IMAP */}
                                                    {(displayData.permissions === 'read-only' || displayData.permissions === 'read-write') && (
                                                        <div>
                                                            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>IMAP (Incoming)</p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                <div className="sm:col-span-2">
                                                                    <input type="text" value={displayData.imapHost}
                                                                        onChange={e => setEditingEmail(p => p ? { ...p, imapHost: e.target.value } : p)}
                                                                        placeholder="imap.gmail.com"
                                                                        className="w-full p-2.5 rounded-lg text-sm outline-none"
                                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                                </div>
                                                                <input type="number" value={displayData.imapPort}
                                                                    onChange={e => setEditingEmail(p => p ? { ...p, imapPort: parseInt(e.target.value) || 993 } : p)}
                                                                    placeholder="993"
                                                                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                                                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                            </div>
                                                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                                                <input type="checkbox" checked={displayData.imapTls} onChange={e => setEditingEmail(p => p ? { ...p, imapTls: e.target.checked } : p)} className="accent-lime-500" />
                                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>TLS/SSL (usually port 993)</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {/* SMTP */}
                                                    {(displayData.permissions === 'write-only' || displayData.permissions === 'read-write') && (
                                                        <div>
                                                            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>SMTP (Outgoing)</p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                <div className="sm:col-span-2">
                                                                    <input type="text" value={displayData.smtpHost}
                                                                        onChange={e => setEditingEmail(p => p ? { ...p, smtpHost: e.target.value } : p)}
                                                                        placeholder="smtp.gmail.com"
                                                                        className="w-full p-2.5 rounded-lg text-sm outline-none"
                                                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                                </div>
                                                                <input type="number" value={displayData.smtpPort}
                                                                    onChange={e => setEditingEmail(p => p ? { ...p, smtpPort: parseInt(e.target.value) || 587 } : p)}
                                                                    placeholder="587"
                                                                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                                                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                            </div>
                                                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                                                <input type="checkbox" checked={displayData.smtpTls} onChange={e => setEditingEmail(p => p ? { ...p, smtpTls: e.target.checked } : p)} className="accent-lime-500" />
                                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SSL/TLS (port 465) - uncheck for STARTTLS (port 587)</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {/* Signature */}
                                                    <div>
                                                        <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Signature (optional)</label>
                                                        <textarea value={displayData.signature}
                                                            onChange={e => setEditingEmail(p => p ? { ...p, signature: e.target.value } : p)}
                                                            placeholder={"e.g.\nMario Rossi\n+39 123 456 7890\nskales.ai"}
                                                            rows={3}
                                                            className="w-full p-2.5 rounded-lg text-sm outline-none resize-none"
                                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                                    </div>

                                                    {/* Trusted Address Book */}
                                                    {(displayData.permissions === 'write-only' || displayData.permissions === 'read-write') && (
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Trusted Address Book</label>
                                                            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                                                                Skales will only send emails to these addresses from this account. Leave empty to allow any address.
                                                            </p>
                                                            <div className="space-y-1 mb-2">
                                                                {(displayData.trustedAddresses || []).map((addr: string, i: number) => (
                                                                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                                                                        <span className="flex-1">{addr}</span>
                                                                        <button
                                                                            onClick={() => setEditingEmail(p => p ? { ...p, trustedAddresses: (p.trustedAddresses || []).filter((_: any, idx: number) => idx !== i) } : p)}
                                                                            className="text-red-400 hover:text-red-300 font-bold"
                                                                        >✕</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="email"
                                                                    value={trustedAddressInput}
                                                                    onChange={e => setTrustedAddressInput(e.target.value)}
                                                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                        if (e.key === 'Enter' && trustedAddressInput.trim()) {
                                                                            setEditingEmail(p => p ? { ...p, trustedAddresses: [...(p.trustedAddresses || []), trustedAddressInput.trim()] } : p);
                                                                            setTrustedAddressInput('');
                                                                        }
                                                                    }}
                                                                    placeholder="name@example.com - press Enter to add"
                                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-lime-500"
                                                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        if (trustedAddressInput.trim()) {
                                                                            setEditingEmail(p => p ? { ...p, trustedAddresses: [...(p.trustedAddresses || []), trustedAddressInput.trim()] } : p);
                                                                            setTrustedAddressInput('');
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-lime-500 hover:bg-lime-400 text-black"
                                                                >+ Add</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={async () => {
                                                                if (!editingEmail) return;
                                                                setEmailAccountSaving(true);
                                                                const res = await saveEmailAccount({ ...editingEmail, enabled: true } as EmailAccount);
                                                                setEmailAccountSaving(false);
                                                                if (res.success) {
                                                                    setEmailAccountTestResult({ success: true, message: '✅ Account saved.' });
                                                                    const updated = await loadEmailAccounts();
                                                                    setEmailAccounts(updated.map(a => ({ ...a, password: a.password ? '••••••••' : '' })));
                                                                } else {
                                                                    setEmailAccountTestResult({ success: false, message: `❌ ${res.error}` });
                                                                }
                                                            }}
                                                            disabled={emailAccountSaving || !editingEmail?.username || !editingEmail?.password || !editingEmail?.imapHost && editingEmail?.permissions !== 'write-only' || !editingEmail?.smtpHost && editingEmail?.permissions !== 'read-only'}
                                                            className="px-4 py-2 rounded-lg text-sm font-bold bg-lime-500 hover:bg-lime-400 text-black transition-all flex items-center gap-2 disabled:opacity-40"
                                                        >
                                                            {emailAccountSaving ? '...' : '💾 Save'}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!editingEmail) return;
                                                                setEmailAccountTesting(true);
                                                                setEmailAccountTestResult(null);
                                                                const perm = editingEmail.permissions;
                                                                const tasks: Promise<any>[] = [];
                                                                if (perm !== 'write-only') tasks.push(testImapConnectionForAccount(editingEmail.id));
                                                                if (perm !== 'read-only') tasks.push(testSmtpConnectionForAccount(editingEmail.id));
                                                                const results = await Promise.all(tasks);
                                                                setEmailAccountTesting(false);
                                                                const allOk = results.every(r => r.success);
                                                                const msgs = results.map((r, i) => {
                                                                    const label = perm === 'write-only' ? 'SMTP' : perm === 'read-only' ? 'IMAP' : (i === 0 ? 'IMAP' : 'SMTP');
                                                                    return r.success ? `✅ ${label}` : `❌ ${label}: ${r.error}`;
                                                                });
                                                                setEmailAccountTestResult({ success: allOk, message: msgs.join(' · ') });
                                                            }}
                                                            disabled={emailAccountTesting || !emailAccounts.find(a => a.id === editingEmail?.id)}
                                                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-40 hover:bg-[var(--surface-light)]"
                                                            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                                        >
                                                            {emailAccountTesting ? '...' : '🔌 Test'}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Remove account "${acct.alias || acct.username}"?`)) return;
                                                                await deleteEmailAccount(acct.id);
                                                                const updated = await loadEmailAccounts();
                                                                setEmailAccounts(updated.map(a => ({ ...a, password: a.password ? '••••••••' : '' })));
                                                                setExpandedEmailId(null);
                                                                setEditingEmail(null);
                                                                setEmailAccountTestResult(null);
                                                            }}
                                                            className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:bg-red-500 hover:text-white ml-auto"
                                                            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                                                        >
                                                            🗑 Remove
                                                        </button>
                                                    </div>
                                                    {emailAccountTestResult && (
                                                        <p className={`text-[11px] font-medium ${emailAccountTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                            {emailAccountTestResult.message}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Add Account button */}
                                {emailAccounts.length < 5 && (
                                    <button
                                        onClick={() => {
                                            const newAcct = EMPTY_EMAIL_ACCOUNT();
                                            setEditingEmail(newAcct);
                                            setExpandedEmailId(newAcct.id);
                                            setEmailAccountTestResult(null);
                                            // Temporarily show in list so card renders
                                            setEmailAccounts(prev => [...prev, { ...newAcct, savedAt: 0 } as EmailAccount]);
                                        }}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold border-dashed border-2 transition-all hover:border-lime-500 hover:text-lime-400"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                    >
                                        + Add Account {emailAccounts.length > 0 ? `(${emailAccounts.length}/5)` : ''}
                                    </button>
                                )}
                                {emailAccounts.length >= 5 && (
                                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Maximum 5 accounts reached.</p>
                                )}

                                {/* Quick reference */}
                                <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                    <p className="font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Common provider settings:</p>
                                    <p>Gmail: IMAP imap.gmail.com:993 · SMTP smtp.gmail.com:587</p>
                                    <p>Outlook: IMAP outlook.office365.com:993 · SMTP smtp.office365.com:587</p>
                                    <p>iCloud: IMAP imap.mail.me.com:993 · SMTP smtp.mail.me.com:587</p>
                                </div>
                            </div>
                        )}
                    </section>
                    )}

                    {/* ─── Tavily Web Search ─── */}
                    {activeSkillIds.has('web_search') && (
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">🔍</span>
                                Tavily Web Search
                            </h2>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Gives Skales real-time web search capabilities - great for news, research, and up-to-date answers. Tavily is purpose-built for AI agents.
                        </p>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                                Tavily API Key
                            </label>
                            <input
                                type="password"
                                value={tavilyApiKey}
                                onChange={e => setTavilyApiKey(e.target.value)}
                                placeholder="tvly-..."
                                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                                Get a free key (1,000 searches/month) at{' '}
                                <a href="https://app.tavily.com" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">app.tavily.com</a>.
                                Once saved, Skales can use <code className="px-1 bg-[var(--surface-light)] rounded text-[10px]">search_web</code> to look things up in real time.
                            </p>
                        </div>
                    </section>
                    )}

                    {/* ─── Google Places API ─── */}
                    {activeSkillIds.has('google_places') && (
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-xl">📍</span>
                                Google Places
                            </h2>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Enables Skales to search nearby places, get opening hours, reviews, directions, and geocode addresses via the Google Maps Platform.
                        </p>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                                Google Places API Key
                            </label>
                            <input
                                type="password"
                                value={googlePlacesApiKey}
                                onChange={e => setGooglePlacesApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                                Enable the <strong>Places API</strong>, <strong>Geocoding API</strong>, and <strong>Directions API</strong> in your{' '}
                                <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">Google Cloud Console</a>.
                                The free tier covers most personal use cases.
                            </p>
                        </div>
                    </section>
                    )}

                    {/* ─── Vision Provider (Global) ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">👁️</span>
                            Vision Provider
                        </h2>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            Analyzes screenshots and images. Used as a global fallback for Desktop Screenshots and Browser Control.
                        </p>

                        <div className="space-y-4">
                            {/* Provider + Model row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Provider</p>
                                    <select
                                        value={browserControlConfig.visionProvider}
                                        onChange={e => setBrowserControlConfig(p => ({ ...p, visionProvider: e.target.value as any }))}
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                        <option value="google">Google (Gemini)</option>
                                        <option value="openai">OpenAI (GPT-4o)</option>
                                        <option value="anthropic">Anthropic (Claude)</option>
                                        <option value="openrouter">OpenRouter</option>
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Model</p>
                                    <input
                                        type="text"
                                        value={browserControlConfig.visionModel}
                                        onChange={e => setBrowserControlConfig(p => ({ ...p, visionModel: e.target.value }))}
                                        placeholder="e.g. gemini-2.0-flash"
                                        className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                </div>
                            </div>

                            {/* API Key */}
                            <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                    API Key <span className="font-normal text-[11px]" style={{ color: 'var(--text-muted)' }}>(can reuse your main provider key)</span>
                                </p>
                                <input
                                    type="password"
                                    value={browserControlConfig.visionApiKey}
                                    onChange={e => setBrowserControlConfig(p => ({ ...p, visionApiKey: e.target.value }))}
                                    placeholder="Paste your Vision API key"
                                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-lime-500"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    autoComplete="off" />
                            </div>

                            {/* Use for checkboxes */}
                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Use for:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                        { key: 'visionUseForScreenshots', label: '🖥️ Desktop Screenshots' },
                                        { key: 'visionUseForBrowser', label: '🌐 Browser Control' },
                                        { key: 'visionUseForChat', label: '💬 Chat (images)' },
                                        { key: 'visionUseForTelegram', label: '✈️ Telegram' },
                                        { key: 'visionUseForWhatsApp', label: '📱 WhatsApp' },
                                    ].map(item => (
                                        <label key={item.key} className="flex items-center gap-2 text-xs cursor-pointer p-2.5 rounded-lg"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            <input
                                                type="checkbox"
                                                checked={browserControlConfig[item.key as keyof BrowserControlConfig] as boolean ?? false}
                                                onChange={e => setBrowserControlConfig(p => ({ ...p, [item.key]: e.target.checked }))}
                                                className="accent-lime-500 w-3.5 h-3.5 flex-shrink-0" />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Save button */}
                            <button
                                onClick={handleBrowserConfigSave}
                                disabled={browserConfigSaving}
                                className="px-5 py-2 text-sm font-semibold rounded-xl transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50 flex items-center gap-2">
                                {browserConfigSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Vision Settings
                            </button>

                            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                💡 After each browser action or desktop screenshot, the Vision Provider analyzes the image to understand content and locate elements.
                            </div>
                        </div>
                    </section>

                    {/* ─── Skills ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Zap size={20} className="text-yellow-400" />
                            Skills
                        </h2>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            Enable and configure additional capabilities for Skales.
                        </p>
                        <div className="space-y-4">

                            {/* ── System Monitor ── */}
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            🖥️ System Monitor
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Ask Skales about CPU, RAM, disk, running processes, and system health.
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => toggleSkill('systemMonitor')}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${skills?.systemMonitor?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                        role="switch" aria-checked={!!skills?.systemMonitor?.enabled}
                                        aria-label={t('settings.toggles.systemMonitor')}>
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${skills?.systemMonitor?.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Local File Chat ── */}
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            📁 Local File Chat
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Ask Skales to read, summarize, search, or analyze files on your computer.
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => toggleSkill('localFileChat')}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${skills?.localFileChat?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                        role="switch" aria-checked={!!skills?.localFileChat?.enabled}
                                        aria-label={t('settings.toggles.localFileChat')}>
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${skills?.localFileChat?.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Webhooks ── */}
                            {activeSkillIds.has('webhooks') && (
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            🌐 Webhooks
                                            {webhookConfig?.enabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">ACTIVE</span>}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Receive HTTP POST messages from Zapier, n8n, IFTTT, or any automation tool.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {webhookEnabling && <Loader2 size={16} className="animate-spin text-lime-400" />}
                                        <button type="button" onClick={handleWebhookToggle} disabled={webhookEnabling}
                                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${webhookConfig?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                            role="switch" aria-checked={!!webhookConfig?.enabled}
                                            aria-label={t('settings.toggles.webhooks')}>
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${webhookConfig?.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                                {webhookConfig?.enabled && (
                                    <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'var(--surface)' }}>
                                        <div>
                                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Webhook URL</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono truncate" style={{ background: 'var(--background)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                                    {`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/webhook`}
                                                </code>
                                                <button onClick={() => handleWebhookCopy(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/webhook`)}
                                                    className="text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                                                    style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                                    {webhookCopied ? '✅' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Secret Key</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono truncate" style={{ background: 'var(--background)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                                    {webhookConfig.secret}
                                                </code>
                                                <button onClick={() => handleWebhookCopy(webhookConfig.secret)}
                                                    className="text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                                                    style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                                    Copy
                                                </button>
                                                <button onClick={handleWebhookRegenerate} disabled={webhookRegenerating}
                                                    className="text-xs px-3 py-2 rounded-lg font-medium transition-colors text-orange-400"
                                                    style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                                                    {webhookRegenerating ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Usage example (curl):</p>
                                            <code className="block whitespace-pre-wrap break-all font-mono" style={{ color: 'var(--text-primary)', fontSize: '10px' }}>
                                                {`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/webhook \\\n  -H "Content-Type: application/json" \\\n  -d '{"secret":"${webhookConfig.secret?.slice(0, 8)}...","message":"Hello Skales!"}'`}
                                            </code>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}

                            {/* ── Discord Bot ── */}
                            {!activeSkillIds.has('discord') && (
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            💬 Discord Bot
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Enable this skill to connect a Discord bot. Once enabled, configure it in the Integrations tab.
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => toggleSkill('discord')}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${activeSkillIds.has('discord') ? 'bg-lime-500' : 'bg-gray-600'}`}
                                        role="switch" aria-checked={activeSkillIds.has('discord')}
                                        aria-label={t('settings.toggles.discordBot')}>
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${activeSkillIds.has('discord') ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            )}
                            {activeSkillIds.has('discord') && (
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            💬 Discord Bot
                                            {discordBotRunning && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />RUNNING</span>}
                                            {discordSaved && !discordBotRunning && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">CONFIGURED</span>}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Connect a Discord bot to chat with Skales in your server.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {discordSaved && (
                                            <button onClick={handleDiscordDisconnect} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setShowDiscordSetup(v => !v)}
                                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                            style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                            {showDiscordSetup ? 'Hide' : 'Configure'}
                                        </button>
                                        <button type="button" onClick={() => toggleSkill('discord')}
                                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${activeSkillIds.has('discord') ? 'bg-lime-500' : 'bg-gray-600'}`}
                                            role="switch" aria-checked={activeSkillIds.has('discord')}
                                            aria-label={t('settings.toggles.discordBot')}>
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${activeSkillIds.has('discord') ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                                {showDiscordSetup && (
                                    <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'var(--surface)' }}>
                                        <div className="text-xs p-3 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            Create a bot at <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">discord.com/developers</a> → New Application → Bot → copy Token. Enable <strong style={{ color: 'var(--text-secondary)' }}>Message Content Intent</strong>.
                                        </div>
                                        <input type="password" placeholder={t('settings.integrations.botToken')}
                                            value={discordConfig.botToken || ''}
                                            onChange={e => setDiscordConfig(p => ({ ...p, botToken: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        <input type="text" placeholder={t('settings.integrations.serverId')}
                                            value={discordConfig.guildId || ''}
                                            onChange={e => setDiscordConfig(p => ({ ...p, guildId: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        <input type="text" placeholder={t('settings.integrations.channelId')}
                                            value={discordConfig.channelId || ''}
                                            onChange={e => setDiscordConfig(p => ({ ...p, channelId: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                                        <div className="flex gap-2">
                                            <button onClick={handleDiscordSave} disabled={discordSaving}
                                                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50 flex items-center justify-center gap-2">
                                                {discordSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                Save & Connect
                                            </button>
                                            <button onClick={handleDiscordTest} disabled={discordTesting}
                                                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                                {discordTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
                                                Test Token
                                            </button>
                                        </div>
                                        {discordResult && (
                                            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${discordResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                                {discordResult.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                {discordResult.message}
                                            </div>
                                        )}
                                        {discordBotRunning ? (
                                            <div className="flex items-center gap-2 text-xs text-green-400">
                                                <Power size={12} /> Discord bot is running
                                            </div>
                                        ) : discordSaved ? (
                                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                <Power size={12} /> Bot configured - will start with Skales
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            )}

                            {/* ── Browser Control ── */}
                            {activeSkillIds.has('browser_control') && (
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                <div className="p-4 flex items-center justify-between gap-4" style={{ background: 'var(--background)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            🌐 Browser Control
                                            {browserControlConfig.installed && skills?.browserControl?.enabled && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">READY</span>
                                            )}
                                            {!browserControlConfig.installed && skills?.browserControl?.enabled && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">SETUP REQUIRED</span>
                                            )}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Let Skales browse the web, fill forms, and automate tasks using a headless Chromium browser with Vision AI.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowBrowserSetup(v => !v)}
                                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                            style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                            {showBrowserSetup ? 'Hide' : 'Configure'}
                                        </button>
                                        <button type="button" onClick={() => toggleSkill('browserControl')}
                                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${skills?.browserControl?.enabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                            role="switch" aria-checked={!!skills?.browserControl?.enabled}
                                            aria-label={t('settings.toggles.browserControl')}>
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${skills?.browserControl?.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                {showBrowserSetup && (
                                    <div className="px-4 pb-4 pt-2 space-y-4" style={{ background: 'var(--surface)' }}>

                                        {/* ── Chromium Install ── */}
                                        <div className="p-3 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Chromium Browser</p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        {browserControlConfig.installed
                                                            ? '✅ Installed - Browser Control is ready to use.'
                                                            : 'Required one-time download (~150MB). Only downloaded once.'}
                                                    </p>
                                                </div>
                                                {!browserControlConfig.installed && (
                                                    <button
                                                        onClick={handleBrowserInstall}
                                                        disabled={browserInstalling}
                                                        className="px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                                        style={{ background: 'var(--accent-lime)', color: '#000' }}>
                                                        {browserInstalling ? <><Loader2 size={12} className="animate-spin" /> Installing…</> : <><Download size={12} /> Install Chromium</>}
                                                    </button>
                                                )}
                                            </div>
                                            {browserInstallResult && (
                                                <div className={`mt-2 flex items-center gap-2 text-xs p-2 rounded-lg ${browserInstallResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                                    {browserInstallResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                    {browserInstallResult.message}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Navigation & Approvals ── */}
                                        <div>
                                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Navigation & Approvals</p>
                                            <div className="space-y-2">
                                                {/* Auto-approve navigation toggle */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Auto-approve navigation</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Open URLs without asking each time.</p>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => setBrowserControlConfig(p => ({ ...p, autoApproveNavigation: !p.autoApproveNavigation }))}
                                                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${browserControlConfig.autoApproveNavigation ? 'bg-lime-500' : 'bg-gray-600'}`}
                                                        aria-label={t('settings.toggles.autoApproveNav')}
                                                    >
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${browserControlConfig.autoApproveNavigation ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                {/* Approval checkboxes */}
                                                <p className="text-xs font-medium pt-1" style={{ color: 'var(--text-primary)' }}>Require approval before:</p>
                                                {[
                                                    { key: 'requireApprovalForLogin', label: 'Login / entering credentials' },
                                                    { key: 'requireApprovalForForms', label: 'Form submissions' },
                                                    { key: 'requireApprovalForPurchases', label: 'Purchases / payments' },
                                                    { key: 'requireApprovalForDownloads', label: 'File downloads' },
                                                ].map(item => (
                                                    <label key={item.key} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={browserControlConfig[item.key as keyof BrowserControlConfig] as boolean}
                                                            onChange={e => setBrowserControlConfig(p => ({ ...p, [item.key]: e.target.checked }))}
                                                            className="accent-lime-500 w-3.5 h-3.5" />
                                                        {item.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Max Session Time ── */}
                                        <div>
                                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Max session time</p>
                                            <select
                                                value={browserControlConfig.maxSessionMinutes}
                                                onChange={e => setBrowserControlConfig(p => ({ ...p, maxSessionMinutes: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-lime-500"
                                                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                <option value={5}>5 minutes</option>
                                                <option value={15}>15 minutes (default)</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={60}>60 minutes</option>
                                            </select>
                                        </div>

                                        {/* ── Save ── */}
                                        <button
                                            onClick={handleBrowserConfigSave}
                                            disabled={browserConfigSaving}
                                            className="w-full py-2 text-sm font-semibold rounded-xl transition-all bg-lime-500 hover:bg-lime-400 text-black disabled:opacity-50 flex items-center justify-center gap-2">
                                            {browserConfigSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Save Browser Control Settings
                                        </button>

                                        <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            💡 After each browser action, Skales shows a screenshot in chat. The Vision Provider analyzes screenshots to understand the page and locate elements to click.
                                        </div>

                                        <div className="p-3 rounded-xl text-xs flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--text-muted)' }}>
                                            <span className="text-amber-400 mt-0.5 shrink-0">🔒</span>
                                            <span><strong className="text-amber-400">Privacy:</strong> The <em>Desktop Screenshot</em> tool allows Skales to see your full screen when asked (e.g. "What&apos;s on my screen?"). Screenshots are never stored permanently - they are processed by your configured Vision Provider and then deleted. No image data is sent to Anthropic or any other party.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}

                        </div>
                    </section>

                    {/* ─── Lio AI Settings ─── */}
                    {activeSkillIds.has('lio_ai') && (
                    <section className="rounded-2xl border overflow-hidden p-6"
                        style={{
                            background: 'linear-gradient(135deg, #0a0514 0%, #0d0d1a 50%, #0a1020 100%)',
                            borderColor: 'rgba(139,92,246,0.4)',
                            boxShadow: '0 0 40px rgba(139,92,246,0.08), inset 0 0 60px rgba(139,92,246,0.03)',
                        }}>
                        {/* Top accent strip */}
                        <div className="-mx-6 -mt-6 mb-5 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6 30%, #6366f1 70%, transparent)' }} />
                        {/* Header row */}
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 16px rgba(139,92,246,0.2)' }}>
                                🦁
                            </div>
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2" style={{
                                    background: 'linear-gradient(135deg, #c4b5fd, #818cf8)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                }}>
                                    Lio AI - Code Builder
                                </h2>
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Architect · Reviewer · Builder</p>
                            </div>
                        </div>
                        <p className="text-xs mb-5" style={{ color: 'rgba(196,181,253,0.55)' }}>
                            Configure models for each phase. Using two different models improves plan quality.
                        </p>

                        <div className="space-y-4">
                            {/* Models grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {([
                                    { key: 'architectProvider' as const, modelKey: 'architectModel' as const, label: '🏗️ Architect Model', hint: 'Designs the architecture' },
                                    { key: 'reviewerProvider' as const, modelKey: 'reviewerModel' as const, label: '🔍 Reviewer Model', hint: 'Reviews the plan' },
                                    { key: 'builderProvider' as const, modelKey: 'builderModel' as const, label: '🔨 Builder Model', hint: 'Writes the code' },
                                ]).map(({ key, modelKey, label, hint }) => (
                                    <div key={key} className="p-3 rounded-xl border" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#ddd6fe' }}>{label}</p>
                                        <p className="text-[10px] mb-2" style={{ color: 'rgba(196,181,253,0.5)' }}>{hint}</p>
                                        <input
                                            type="text"
                                            value={lioConfig[modelKey]}
                                            onChange={e => setLioConfig(prev => ({ ...prev, [modelKey]: e.target.value }))}
                                            placeholder="e.g. openai/gpt-4o"
                                            className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none mb-1.5"
                                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#e9d5ff' }}
                                        />
                                        <select
                                            value={lioConfig[key]}
                                            onChange={e => setLioConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}
                                        >
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="google">Google AI</option>
                                            <option value="groq">Groq</option>
                                            <option value="mistral">Mistral</option>
                                            <option value="together">Together AI</option>
                                            <option value="ollama">Ollama (Local)</option>
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Tip */}
                            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                                💡 Tip: Using two different models (e.g. GPT-4o for Architect, Claude for Reviewer) significantly improves plan quality.
                            </div>

                            {/* Toggle options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border flex items-center justify-between gap-3" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold" style={{ color: '#ddd6fe' }}>Auto-install packages</p>
                                        <p className="text-[10px]" style={{ color: 'rgba(196,181,253,0.5)' }}>npm/pip install with approval prompt</p>
                                    </div>
                                    <button onClick={() => setLioConfig(prev => ({ ...prev, autoInstallPackages: !prev.autoInstallPackages }))}
                                        className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${lioConfig.autoInstallPackages ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${lioConfig.autoInstallPackages ? 'left-4' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <div className="p-3 rounded-xl border flex items-center justify-between gap-3" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold" style={{ color: '#ddd6fe' }}>Group Chat on errors</p>
                                        <p className="text-[10px]" style={{ color: 'rgba(196,181,253,0.5)' }}>Auto-debug with Architect + Reviewer</p>
                                    </div>
                                    <button onClick={() => setLioConfig(prev => ({ ...prev, groupChatOnErrors: !prev.groupChatOnErrors }))}
                                        className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${lioConfig.groupChatOnErrors ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${lioConfig.groupChatOnErrors ? 'left-4' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Numeric options */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl border" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#ddd6fe' }}>Max build steps</p>
                                    <select value={lioConfig.maxBuildSteps} onChange={e => setLioConfig(prev => ({ ...prev, maxBuildSteps: parseInt(e.target.value) }))}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#e9d5ff' }}>
                                        {[10, 15, 20, 30, 40, 50].map(v => <option key={v} value={v}>{v} steps</option>)}
                                    </select>
                                </div>
                                <div className="p-3 rounded-xl border" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#ddd6fe' }}>Auto-recovery retries</p>
                                    <select value={lioConfig.autoRecoveryRetries} onChange={e => setLioConfig(prev => ({ ...prev, autoRecoveryRetries: parseInt(e.target.value) }))}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#e9d5ff' }}>
                                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} retries</option>)}
                                    </select>
                                </div>
                                <div className="p-3 rounded-xl border" style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#ddd6fe' }}>Project folder</p>
                                    <input type="text" value={lioConfig.projectFolder} onChange={e => setLioConfig(prev => ({ ...prev, projectFolder: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#e9d5ff' }} />
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="flex items-center gap-3">
                                <button onClick={handleLioSave} disabled={lioSaving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    style={{
                                        background: lioSaved ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(99,102,241,0.3))',
                                        color: lioSaved ? '#a78bfa' : 'white',
                                        border: '1px solid rgba(139,92,246,0.45)',
                                        boxShadow: lioSaved ? 'none' : '0 0 16px rgba(139,92,246,0.2)',
                                    }}>
                                    {lioSaving ? <Loader2 size={14} className="animate-spin" /> : lioSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                    {lioSaving ? 'Saving…' : lioSaved ? 'Saved!' : 'Save Lio AI Settings'}
                                </button>
                                <Link href="/code" className="text-xs px-3 py-2 rounded-xl transition-all"
                                    style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
                                    🦁 Open Lio AI →
                                </Link>
                            </div>
                        </div>
                    </section>
                    )}

                    {/* ─── FTP / SFTP Profiles ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Upload size={20} className="text-emerald-400" />
                                {t('settings.ftp.title')}
                                {ftpProfiles.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        {ftpProfiles.length} {ftpProfiles.length === 1 ? 'profile' : 'profiles'}
                                    </span>
                                )}
                            </h2>
                            <button onClick={() => setShowFtpSetup(!showFtpSetup)}
                                className="text-xs px-3 py-1 rounded-full transition-all"
                                style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                {showFtpSetup ? t('settings.ftp.hide') : t('settings.ftp.configure')}
                            </button>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            {t('settings.ftp.description')}
                        </p>

                        {showFtpSetup && (
                            <div className="space-y-3">
                                {/* Existing profiles */}
                                {ftpProfiles.map(profile => (
                                    <div key={profile.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                        {/* Profile header */}
                                        <button
                                            onClick={() => {
                                                if (expandedFtpId === profile.id) {
                                                    setExpandedFtpId(null);
                                                    setEditingFtp(null);
                                                } else {
                                                    setExpandedFtpId(profile.id);
                                                    setEditingFtp({ ...profile });
                                                    setFtpTestResult(null);
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-3 text-left transition-all hover:opacity-80"
                                            style={{ background: 'var(--background)' }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Upload size={14} className="text-emerald-400" />
                                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {profile.alias || profile.host || t('settings.ftp.unnamed')}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                                                    style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                                                    {profile.protocol.toUpperCase()}
                                                </span>
                                                {profile.enabled && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                )}
                                            </div>
                                            <ChevronDown size={14} className={`transition-transform ${expandedFtpId === profile.id ? 'rotate-180' : ''}`}
                                                style={{ color: 'var(--text-muted)' }} />
                                        </button>

                                        {/* Expanded form */}
                                        {expandedFtpId === profile.id && editingFtp && (
                                            <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                                                {/* Alias */}
                                                <div>
                                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.alias')}</label>
                                                    <input
                                                        type="text"
                                                        value={editingFtp.alias}
                                                        onChange={e => setEditingFtp({ ...editingFtp, alias: e.target.value })}
                                                        placeholder={t('settings.ftp.aliasPlaceholder')}
                                                        className="w-full px-3 py-2 rounded-xl text-sm border"
                                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                    />
                                                </div>
                                                {/* Protocol + Host + Port */}
                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.protocol')}</label>
                                                        <select
                                                            value={editingFtp.protocol}
                                                            onChange={e => setEditingFtp({ ...editingFtp, protocol: e.target.value as 'ftp' | 'sftp', port: e.target.value === 'sftp' ? 22 : 21 })}
                                                            className="w-full px-3 py-2 rounded-xl text-sm border"
                                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                        >
                                                            <option value="ftp">FTP</option>
                                                            <option value="sftp">SFTP</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.host')}</label>
                                                        <input
                                                            type="text"
                                                            value={editingFtp.host}
                                                            onChange={e => setEditingFtp({ ...editingFtp, host: e.target.value })}
                                                            placeholder="ftp.example.com"
                                                            className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.port')}</label>
                                                        <input
                                                            type="number"
                                                            value={editingFtp.port}
                                                            onChange={e => setEditingFtp({ ...editingFtp, port: parseInt(e.target.value) || 21 })}
                                                            className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Username + Password */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.username')}</label>
                                                        <input
                                                            type="text"
                                                            value={editingFtp.username}
                                                            onChange={e => setEditingFtp({ ...editingFtp, username: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.password')}</label>
                                                        <input
                                                            type="password"
                                                            value={editingFtp.password}
                                                            onChange={e => setEditingFtp({ ...editingFtp, password: e.target.value })}
                                                            placeholder="******"
                                                            className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Remote Path */}
                                                <div>
                                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.ftp.remotePath')}</label>
                                                    <input
                                                        type="text"
                                                        value={editingFtp.remotePath}
                                                        onChange={e => setEditingFtp({ ...editingFtp, remotePath: e.target.value })}
                                                        placeholder="/public_html/"
                                                        className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
                                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                    />
                                                </div>

                                                {/* SFTP warning */}
                                                {editingFtp.protocol === 'sftp' && (
                                                    <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}>
                                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                        <span>{t('settings.ftp.sftpWarning')}</span>
                                                    </div>
                                                )}

                                                {/* Test result */}
                                                {ftpTestResult && (
                                                    <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${ftpTestResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {ftpTestResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                        <span>{ftpTestResult.message}</span>
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        onClick={async () => {
                                                            setFtpTesting(true);
                                                            setFtpTestResult(null);
                                                            try {
                                                                const res = await fetch('/api/ftp/test', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify(editingFtp),
                                                                });
                                                                const data = await res.json();
                                                                setFtpTestResult({ success: data.success, message: data.success ? data.message : data.error });
                                                            } catch (e: any) {
                                                                setFtpTestResult({ success: false, message: e.message });
                                                            }
                                                            setFtpTesting(false);
                                                        }}
                                                        disabled={ftpTesting || !editingFtp.host}
                                                        className="text-xs px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5"
                                                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                                                    >
                                                        {ftpTesting ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
                                                        {ftpTesting ? t('settings.ftp.testing') : t('settings.ftp.testConnection')}
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            setFtpSaving(true);
                                                            try {
                                                                const isNew = !profile.savedAt;
                                                                const res = await fetch('/api/ftp/profiles', {
                                                                    method: isNew ? 'POST' : 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify(editingFtp),
                                                                });
                                                                const data = await res.json();
                                                                if (data.success || data.id) {
                                                                    // Reload profiles
                                                                    const reload = await fetch('/api/ftp/profiles');
                                                                    const reloadData = await reload.json();
                                                                    if (reloadData.profiles) setFtpProfiles(reloadData.profiles);
                                                                    setFtpTestResult({ success: true, message: t('settings.ftp.saved') });
                                                                }
                                                            } catch (e: any) {
                                                                setFtpTestResult({ success: false, message: e.message });
                                                            }
                                                            setFtpSaving(false);
                                                        }}
                                                        disabled={ftpSaving || !editingFtp.host}
                                                        className="text-xs px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5"
                                                        style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
                                                    >
                                                        {ftpSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        {ftpSaving ? t('settings.ftp.saving') : t('settings.ftp.save')}
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(t('settings.ftp.deleteConfirm'))) return;
                                                            await fetch(`/api/ftp/profiles?id=${profile.id}`, { method: 'DELETE' });
                                                            setFtpProfiles(prev => prev.filter(p => p.id !== profile.id));
                                                            setExpandedFtpId(null);
                                                            setEditingFtp(null);
                                                        }}
                                                        className="text-xs px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5"
                                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                                                    >
                                                        <Trash2 size={12} />
                                                        {t('settings.ftp.delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add new profile button */}
                                {ftpProfiles.length < 10 && (
                                    <button
                                        onClick={() => {
                                            const newProfile = EMPTY_FTP_PROFILE();
                                            setFtpProfiles(prev => [...prev, newProfile]);
                                            setExpandedFtpId(newProfile.id);
                                            setEditingFtp(newProfile);
                                            setFtpTestResult(null);
                                        }}
                                        className="w-full text-center text-xs py-3 rounded-xl border-2 border-dashed transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                    >
                                        + {t('settings.ftp.addProfile')}
                                    </button>
                                )}

                                {/* Info box */}
                                <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
                                    <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
                                    <span>{t('settings.ftp.infoBox')}</span>
                                </div>
                            </div>
                        )}
                    </section>

                    </>)}

                    {(activeTab === 'all' || activeTab === 'security') && (<>
                    {/* ─── Security ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Shield size={20} className="text-amber-500" />
                            {t('settings.sections.securityPrivacy')}
                        </h2>

                        {/* ── File System Access ── */}
                        <div className="mb-5 p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                            <p className="font-semibold text-sm flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                                🗂️ {t('fileAccess.title')}
                            </p>
                            <div className="space-y-2">
                                {/* Workspace Only */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${fileAccessMode === 'workspace_only' ? 'border-lime-500 bg-lime-500/5' : ''}`}
                                    style={{ borderColor: fileAccessMode === 'workspace_only' ? undefined : 'var(--border)' }}>
                                    <input type="radio" name="fileAccessMode" value="workspace_only" checked={fileAccessMode === 'workspace_only'}
                                        onChange={() => { setFileAccessMode('workspace_only'); setFileSystemAccess('workspace'); }}
                                        className="mt-0.5 accent-lime-500" />
                                    <div>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t('fileAccess.workspaceOnly')}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('fileAccess.workspaceOnlyDesc')}</p>
                                    </div>
                                </label>
                                {/* Unrestricted */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${fileAccessMode === 'unrestricted' ? 'border-amber-500 bg-amber-500/5' : ''}`}
                                    style={{ borderColor: fileAccessMode === 'unrestricted' ? undefined : 'var(--border)' }}>
                                    <input type="radio" name="fileAccessMode" value="unrestricted" checked={fileAccessMode === 'unrestricted'}
                                        onChange={() => { setFileAccessMode('unrestricted'); setFileSystemAccess('full'); }}
                                        className="mt-0.5 accent-amber-500" />
                                    <div>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t('fileAccess.unrestricted')}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('fileAccess.unrestrictedDesc')}</p>
                                    </div>
                                </label>
                                {/* Custom */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${fileAccessMode === 'custom' ? 'border-purple-500 bg-purple-500/5' : ''}`}
                                    style={{ borderColor: fileAccessMode === 'custom' ? undefined : 'var(--border)' }}>
                                    <input type="radio" name="fileAccessMode" value="custom" checked={fileAccessMode === 'custom'}
                                        onChange={() => { setFileAccessMode('custom'); setFileSystemAccess('full'); }}
                                        className="mt-0.5 accent-purple-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t('fileAccess.custom')}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('fileAccess.customDesc')}</p>
                                    </div>
                                </label>
                            </div>
                            {/* Unrestricted warning */}
                            {fileAccessMode === 'unrestricted' && (
                                <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 text-xs text-amber-400">
                                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                                    <span>{t('fileAccess.unrestrictedWarning')}</span>
                                </div>
                            )}
                            {/* Custom folder list */}
                            {fileAccessMode === 'custom' && (
                                <div className="mt-4">
                                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{t('fileAccess.allowedFolders')}</p>
                                    {allowedFolders.length === 0 && (
                                        <p className="text-[11px] mb-2 italic" style={{ color: 'var(--text-muted)' }}>{t('fileAccess.noFolders')}</p>
                                    )}
                                    <div className="space-y-1 mb-2">
                                        {allowedFolders.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px] p-1.5 rounded-lg"
                                                style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                                                <span className="flex-1 truncate font-mono">{f}</span>
                                                <button type="button" onClick={() => setAllowedFolders(prev => prev.filter((_, j) => j !== i))}
                                                    className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newFolderInput}
                                            onChange={e => setNewFolderInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && newFolderInput.trim()) { setAllowedFolders(prev => [...prev, newFolderInput.trim()]); setNewFolderInput(''); } }}
                                            placeholder={t('fileAccess.addFolderPlaceholder')}
                                            className="flex-1 px-2 py-1.5 rounded-lg text-xs border outline-none"
                                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                                        <button type="button"
                                            onClick={() => { if (newFolderInput.trim()) { setAllowedFolders(prev => [...prev, newFolderInput.trim()]); setNewFolderInput(''); } }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                            style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                                            {t('fileAccess.addFolder')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── VirusTotal Integration ── */}
                        {activeSkillIds.has('virustotal') && (
                        <div className="mb-5 p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🛡️</span>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>VirusTotal File Scanning</p>
                                {vtSaved && <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-500/15 text-green-400">Active ✓</span>}
                            </div>
                            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                Automatically scan email attachments for malware using VirusTotal (free tier).{' '}
                                <a href="https://www.virustotal.com/gui/my-apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}>
                                    Get a free API key →
                                </a>
                            </p>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="password"
                                    placeholder={vtSaved ? '••••••• (saved - enter new key to replace)' : 'Paste your VirusTotal API key'}
                                    value={vtApiKey}
                                    onChange={e => { setVtApiKey(e.target.value); setVtSaved(false); setVtTestResult(null); setVtError(null); }}
                                    className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    autoComplete="off"
                                />
                                <button
                                    onClick={async () => {
                                        const keyToSave = vtApiKey.trim();
                                        if (!keyToSave) return;
                                        setVtSaving(true);
                                        setVtError(null);
                                        setVtTestResult(null);
                                        try {
                                            const res = await saveVTConfig({ apiKey: keyToSave, enabled: true });
                                            if (res.success) {
                                                setVtSaved(true);
                                                setVtEnabled(true);
                                                setVtApiKey(keyToSave.slice(0, 8) + '...');
                                            } else {
                                                setVtError(res.error || 'Could not save API key. Check app permissions and try again.');
                                            }
                                        } catch (err: any) {
                                            setVtError(err?.message || 'Unexpected error saving VirusTotal config.');
                                        } finally {
                                            setVtSaving(false);
                                        }
                                    }}
                                    disabled={vtSaving || !vtApiKey.trim()}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
                                    style={{ background: 'var(--accent-lime)', color: '#000' }}
                                >
                                    {vtSaving ? 'Saving...' : 'Save'}
                                </button>
                                {vtSaved && (
                                    <button
                                        onClick={async () => {
                                            await deleteVTConfig();
                                            setVtApiKey(''); setVtSaved(false); setVtEnabled(false); setVtTestResult(null);
                                        }}
                                        className="px-3 py-2 rounded-lg text-xs text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={async () => {
                                    setVtTesting(true);
                                    setVtTestResult(null);
                                    try {
                                        const cfg = await loadVTConfig();
                                        const actualKey = vtApiKey.trim() || cfg?.apiKey || '';
                                        if (!actualKey) {
                                            setVtTestResult({ success: false, message: 'No API key saved yet.' });
                                            return;
                                        }
                                        const result = await testVTApiKey(actualKey);
                                        setVtTestResult(result);
                                    } finally {
                                        setVtTesting(false);
                                    }
                                }}
                                disabled={vtTesting}
                                className="mt-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-[var(--surface-light)] disabled:opacity-40"
                                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                            >
                                {vtTesting ? <><Loader2 size={12} className="animate-spin" /> Testing...</> : <><TestTube2 size={12} /> Test API Key</>}
                            </button>
                            {vtTestResult && (
                                <p className={`text-[11px] mt-1 font-medium ${vtTestResult.success ? 'text-green-500' : 'text-red-400'}`}>
                                    {vtTestResult.success ? '✅' : '❌'} {vtTestResult.message}
                                </p>
                            )}
                            {vtSaved && !vtTestResult && (
                                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                    ✅ VirusTotal is active. Ask Skales to "scan this file" or "check this attachment for malware".
                                </p>
                            )}
                            {vtError && (
                                <p className="text-xs mt-2 text-red-400">❌ {vtError}</p>
                            )}
                        </div>
                        )}

                        {/* Security Blacklists */}
                        {blacklists && (
                            <div className="rounded-2xl border p-6 mb-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setBlacklistExpanded(!blacklistExpanded)}>
                                    <div>
                                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Security Blacklists</h3>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Block domains and search terms for safety</p>
                                    </div>
                                    <ChevronDown size={16} className={`transition-transform ${blacklistExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                                </div>

                                {blacklistExpanded && (
                                    <div className="mt-4 space-y-5">
                                        {/* Domain Blacklist */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Website Blacklist</span>
                                                <button
                                                    onClick={async () => {
                                                        const updated = { ...blacklists, domainBlacklistEnabled: !blacklists.domainBlacklistEnabled };
                                                        setBlacklists(updated);
                                                        await saveBlacklists(updated);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${blacklists.domainBlacklistEnabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                                    aria-label={t('settings.toggles.websiteBlacklist')}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${blacklists.domainBlacklistEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    value={newDomain}
                                                    onChange={e => setNewDomain(e.target.value)}
                                                    onKeyDown={async e => {
                                                        if (e.key === 'Enter' && newDomain.trim()) {
                                                            await addBlockedDomain(newDomain.trim());
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                            setNewDomain('');
                                                        }
                                                    }}
                                                    placeholder={t('settings.blacklist.addDomain')}
                                                    className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                                                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (newDomain.trim()) {
                                                            await addBlockedDomain(newDomain.trim());
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                            setNewDomain('');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-lime-500/10 text-lime-400 hover:bg-lime-500/20"
                                                >Add</button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {blacklists.blockedDomains.map((domain: string) => (
                                                    <div key={domain} className="flex items-center justify-between px-2 py-1 rounded text-xs" style={{ background: 'var(--surface-light)' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{domain}</span>
                                                        <button onClick={async () => {
                                                            await removeBlockedDomain(domain);
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                        }} className="text-red-400 hover:text-red-300 ml-2">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Buzzword Filter */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Search Safety Filter</span>
                                                <button
                                                    onClick={async () => {
                                                        const updated = { ...blacklists, buzzwordFilterEnabled: !blacklists.buzzwordFilterEnabled };
                                                        setBlacklists(updated);
                                                        await saveBlacklists(updated);
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${blacklists.buzzwordFilterEnabled ? 'bg-lime-500' : 'bg-gray-600'}`}
                                                    aria-label={t('settings.toggles.searchSafety')}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${blacklists.buzzwordFilterEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    value={newBuzzword}
                                                    onChange={e => setNewBuzzword(e.target.value)}
                                                    onKeyDown={async e => {
                                                        if (e.key === 'Enter' && newBuzzword.trim()) {
                                                            await addBlockedBuzzword(newBuzzword.trim());
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                            setNewBuzzword('');
                                                        }
                                                    }}
                                                    placeholder={t('settings.blacklist.addTerm')}
                                                    className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                                                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (newBuzzword.trim()) {
                                                            await addBlockedBuzzword(newBuzzword.trim());
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                            setNewBuzzword('');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-lime-500/10 text-lime-400 hover:bg-lime-500/20"
                                                >Add</button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {blacklists.blockedBuzzwords.map((word: string) => (
                                                    <div key={word} className="flex items-center justify-between px-2 py-1 rounded text-xs" style={{ background: 'var(--surface-light)' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{word}</span>
                                                        <button onClick={async () => {
                                                            await removeBlockedBuzzword(word);
                                                            const updated = await loadBlacklists();
                                                            setBlacklists(updated);
                                                        }} className="text-red-400 hover:text-red-300 ml-2">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Local First</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All data stays on your computer. Nothing leaves without your permission.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>API Key Storage</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keys are securely stored locally and encrypted.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                                <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${telemetryEnabled ? 'text-blue-400' : 'text-green-500'}`} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {telemetryEnabled ? t('privacy.telemetryEnabled') : t('privacy.privacyFirst')}
                                        </p>
                                        <button
                                            onClick={async () => {
                                                const next = !telemetryEnabled;
                                                setTelemetryEnabled(next);
                                                await saveAllSettings({ telemetry_enabled: next } as any);
                                            }}
                                            className="text-xs font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap"
                                            style={{
                                                background: telemetryEnabled ? 'rgba(96,165,250,0.15)' : 'var(--surface-raised)',
                                                color: telemetryEnabled ? '#60a5fa' : 'var(--text-muted)',
                                                border: telemetryEnabled ? '1px solid rgba(96,165,250,0.4)' : '1px solid var(--border)',
                                            }}
                                        >
                                            {telemetryEnabled ? t('settings.enabled') : t('settings.disabled')}
                                        </button>
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {telemetryEnabled ? t('privacy.telemetryOn') : t('privacy.telemetryOff')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    </>)}

                    {(activeTab === 'all' || activeTab === 'advanced') && (<>
                    {/* ─── Export / Import ─── */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <PackageOpen size={20} className="text-blue-400" />
                            Export / Import
                        </h2>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            Back up your Skales configuration, memories, and integrations - or restore from a previous backup.
                        </p>

                        {/* Info box */}
                        <div className="mb-5 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>What's included in the export?</p>
                                <p>All settings, memories, identity, API keys and integration configurations - packed as ZIP. <strong style={{ color: 'var(--text-primary)' }}>The Workspace folder is excluded</strong> (it can get very large - typically 90 MB+).</p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-amber-400"><AlertTriangle size={11} /> Workspace files (created files, downloads) are <strong>not</strong> included - back those up separately if needed.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Export */}
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                <p className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Download size={15} className="text-green-400" /> Export Backup
                                </p>
                                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                    Creates a ZIP of .skales-data (excluding Workspace) and downloads it immediately.
                                </p>
                                <button onClick={handleExport} disabled={exporting}
                                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black disabled:opacity-50">
                                    {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                                    {exporting ? 'Creating ZIP...' : 'Export & Download'}
                                </button>
                                {exportResult && (
                                    <p className={`mt-2 text-xs ${exportResult.success ? 'text-green-400' : 'text-red-400'}`}>{exportResult.message}</p>
                                )}
                            </div>

                            {/* Import */}
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                                <p className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Upload size={15} className="text-blue-400" /> Import Backup
                                </p>
                                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                    Restores a backup ZIP. Your Workspace is preserved. Page reloads automatically.
                                </p>
                                <button onClick={handleImport} disabled={importing}
                                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                                    {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                    {importing ? 'Importing...' : 'Select ZIP & Import'}
                                </button>
                                {importResult && (
                                    <p className={`mt-2 text-xs ${importResult.success ? 'text-green-400' : 'text-red-400'}`}>{importResult.message}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ─── Updates ─── */}
                    <section id="updates" className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            🔄 Updates
                        </h2>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                            Configure automatic update checks.
                        </p>

                        <div className="space-y-3">
                            {/* Auto-check toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        Check automatically on startup
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Show a banner on the dashboard if a new version is available
                                    </p>
                                </div>
                                <button
                                    onClick={() => setUpdateSettings(s => ({ ...s, autoCheckOnStartup: !s.autoCheckOnStartup }))}
                                    className={`relative w-10 h-5 rounded-full transition-all ${updateSettings.autoCheckOnStartup ? 'bg-lime-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${updateSettings.autoCheckOnStartup ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                            {/* Current version */}
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Current Version</p>
                                </div>
                                <span className="text-sm font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                                    v{currentVersion}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={async () => {
                                    setUpdateSaving(true);
                                    setUpdateSaveResult(null);
                                    try {
                                        await saveUpdateSettings(updateSettings);
                                        setUpdateSaveResult({ success: true, message: 'Update settings saved.' });
                                    } catch {
                                        setUpdateSaveResult({ success: false, message: 'Failed to save.' });
                                    } finally {
                                        setUpdateSaving(false);
                                        setTimeout(() => setUpdateSaveResult(null), 3000);
                                    }
                                }}
                                disabled={updateSaving}
                                className="px-5 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {updateSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {updateSaving ? 'Saving...' : 'Save'}
                            </button>
                            <Link href="/update"
                                className="px-5 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all hover:bg-[var(--surface-light)]"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                                <Download size={14} />
                                Check for Updates
                            </Link>
                            {updateSaveResult && (
                                <span className={`text-xs ${updateSaveResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {updateSaveResult.message}
                                </span>
                            )}
                        </div>
                    </section>

                    {/* ─── Privacy section removed — telemetry toggle moved into Security & Privacy above ─── */}

                    {/* ─── Feedback & Bug Reports ─── */}
                    <section className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(250,204,21,0.12)' }}>
                                    <Star size={18} style={{ color: '#facc15' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {t('feedback.title')}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {t('feedback.rateTitle')}, {t('feedback.reportBug')}, {t('feedback.requestFeature')}
                                    </p>
                                </div>
                            </div>
                            <Link href="/feedback"
                                className="shrink-0 ml-4 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: 'rgba(250,204,21,0.12)',
                                    color: '#facc15',
                                    border: '1px solid rgba(250,204,21,0.3)',
                                }}>
                                {t('feedback.title')}
                            </Link>
                        </div>
                    </section>

                    {/* ─── Skales+ ─── */}
                    <section className="rounded-2xl p-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(167,139,250,0.05) 100%)',
                            border: '1px solid rgba(167,139,250,0.3)',
                        }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(167,139,250,0.15)' }}>
                                    <Crown size={18} style={{ color: '#a78bfa' }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                                            {t('skalesPlus.title')}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                                            {t('skalesPlus.comingSoon')}
                                        </span>
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {t('skalesPlus.settingsDesc')}
                                    </p>
                                </div>
                            </div>
                            <Link href="/skales-plus"
                                className="shrink-0 ml-4 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                                style={{
                                    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                                    color: '#fff',
                                    boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                                }}>
                                <Sparkles size={14} />
                                {t('skalesPlus.settingsLink')}
                            </Link>
                        </div>
                    </section>

                    {/* ─── Danger Zone ─── */}
                    <section className="rounded-2xl border p-6"
                        style={{ background: 'var(--surface)', borderColor: 'rgba(239,68,68,0.3)' }}>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-500">
                            <AlertTriangle size={20} />
                            Danger Zone
                        </h2>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            These actions are irreversible. Proceed with caution.
                        </p>
                        <div className="space-y-3">
                            {/* Killswitch */}
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
                                <div>
                                    <p className="text-sm font-medium text-red-400">🛑 Killswitch</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Immediately stops all running tasks, agents, and scheduled jobs. All active sessions are terminated and the server exits.</p>
                                </div>
                                <button
                                    onClick={() => setShowKillswitchConfirm(true)}
                                    className="ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    🛑 Activate Killswitch
                                </button>
                            </div>
                            {/* Stop Server */}
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--background)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>⏹️ Stop Server</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Shuts down Skales completely. Close and reopen the app to restart.</p>
                                </div>
                                <button
                                    onClick={() => setShowStopServerConfirm(true)}
                                    className="ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    ⏹️ Stop Server
                                </button>
                            </div>
                            {/* What happens info */}
                            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>What happens when you stop the server:</p>
                                <ul className="space-y-0.5 list-disc list-inside">
                                    <li>All active chat sessions are terminated</li>
                                    <li>All running multi-agent tasks are cancelled</li>
                                    <li>All scheduled cron jobs are paused</li>
                                    <li>Telegram / WhatsApp / Discord bots are disconnected</li>
                                    <li>The server process exits</li>
                                </ul>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Reset All Settings</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Clear all API keys and revert to defaults</p>
                                </div>
                                <button
                                    onClick={() => setShowResetSettingsConfirm(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <RotateCcw size={12} />
                                    Reset Settings
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl border"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Delete All Data</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Delete all memories, chats, and agent definitions</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteAllDataConfirm(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 size={12} />
                                    Delete All
                                </button>
                            </div>
                        </div>
                    </section>
                    </>)}

                </div>

                {/* Save Bar - clean floating button, no container */}
                <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-50 pointer-events-none"
                    style={{ paddingLeft: '260px' }}>
                    {statusMessage && (
                        <div className={`pointer-events-auto px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg ${statusType === 'success'
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                            }`}>
                            {statusMessage}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="pointer-events-auto px-8 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-2xl transition-all active:scale-95 shadow-2xl shadow-lime-500/40 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Settings
                    </button>
                </div>
            {/* Footer */}
            <div className="mt-12 pb-32 text-center space-y-3">
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                    <a href="https://x.com/skalesapp" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                       style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="https://instagram.com/skales.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                       style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </a>
                    <a href="https://tiktok.com/@skales.app" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                       style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/></svg>
                    </a>
                    <a href="https://youtube.com/@skalesapp" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                       style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path d="M9.545 15.568V8.432L15.818 12z" fill="var(--bg-base, #0b0f19)"/></svg>
                    </a>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Made by Mario Simic &bull;{' '}
                    <a
                        href="https://skales.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Visit skales.app (opens in new tab)"
                        style={{ color: 'var(--text-muted)' }}
                        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                        skales.app
                    </a>
                </p>
            </div>

            {/* Killswitch Confirmation Modal */}
            {showKillswitchConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-400">Activate Killswitch?</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            This will immediately stop ALL running tasks, agents, bots, and shut down the server. Close and reopen Skales to restart.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowKillswitchConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowKillswitchConfirm(false);
                                    try {
                                        const { shutdownServer } = await import('@/actions/system');
                                        await shutdownServer();
                                        setShutdownMessage('Killswitch activated. Server is shutting down.');
                                    } catch {
                                        setShutdownMessage('Killswitch sent - server shutting down.');
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Activate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stop Server Confirmation Modal */}
            {showStopServerConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-500">Stop Skales?</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Close and reopen the app to restart.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowStopServerConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowStopServerConfirm(false);
                                    try {
                                        const { shutdownServer } = await import('@/actions/system');
                                        await shutdownServer();
                                        setShutdownMessage('Server is shutting down...');
                                    } catch {
                                        setShutdownMessage('Stop signal sent - server shutting down.');
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-red-500 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Settings Confirmation Modal */}
            {showResetSettingsConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-400">Reset All Settings?</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            This will delete your API keys and revert to defaults. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResetSettingsConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowResetSettingsConfirm(false);
                                    const { deleteAllData } = await import('@/actions/system');
                                    await deleteAllData('settings');
                                    window.location.reload();
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Data Confirmation Modal */}
            {showDeleteAllDataConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-400">Delete All Data?</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            This will permanently remove all memories, chats, and agent definitions. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteAllDataConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowDeleteAllDataConfirm(false);
                                    const { deleteAllData } = await import('@/actions/system');
                                    await deleteAllData('all');
                                    if (typeof window !== 'undefined' && (window as Window & { skales?: { send: (channel: string, ...args: unknown[]) => void } }).skales) {
                                        (window as Window & { skales?: { send: (channel: string, ...args: unknown[]) => void } }).skales!.send('relaunch-app');
                                    } else {
                                        window.location.href = '/bootstrap';
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shutdown Status Message */}
            {shutdownMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-green-500/30 rounded-2xl p-6 max-w-sm mx-4 text-center space-y-4">
                        <p className="text-sm font-medium text-green-400">{shutdownMessage}</p>
                    </div>
                </div>
            )}

            </div>{/* max-w-4xl mx-auto */}
        </div>
    );
}
