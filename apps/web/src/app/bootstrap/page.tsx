'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation, SUPPORTED_LOCALES } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { completeBootstrap } from '@/actions/identity';
import { saveApiKey, saveAllSettings } from '@/actions/chat';
import type { Provider } from '@/actions/chat';

const CLOUD_PROVIDERS = [
    { id: 'openrouter', name: 'OpenRouter', placeholder: 'sk-or-v1-...' },
    { id: 'openai',     name: 'OpenAI',     placeholder: 'sk-...' },
    { id: 'anthropic',  name: 'Anthropic',  placeholder: 'sk-ant-...' },
    { id: 'google',     name: 'Google Gemini', placeholder: 'AIza...' },
    { id: 'groq',       name: 'Groq',       placeholder: 'gsk_...' },
    { id: 'mistral',    name: 'Mistral',    placeholder: 'key...' },
    { id: 'deepseek',   name: 'DeepSeek',   placeholder: 'sk-...' },
    { id: 'xai',        name: 'xAI (Grok)', placeholder: 'xai-...' },
    { id: 'together',   name: 'Together AI', placeholder: 'key...' },
];

export default function BootstrapPage() {
    const router = useRouter();
    const { t, setLocale, locale } = useTranslation();
    const [showLangPicker, setShowLangPicker] = useState(true); // shown before step 0
    const [step, setStep] = useState(0); // 0 = Security Disclaimer (mandatory)
    const [saving, setSaving] = useState(false);
    const [securityAccepted, setSecurityAccepted] = useState(false);
    // useRef guard prevents double-submission from double-clicking
    const submitting = useRef(false);

    // ── Provider step state ──
    const [providerChoice, setProviderChoice] = useState<'cloud' | 'local' | 'custom' | null>(null);
    const [cloudProvider, setCloudProvider] = useState('openrouter');
    const [ollamaDetected, setOllamaDetected] = useState(false);
    const [ollamaChecking, setOllamaChecking] = useState(false);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [selectedOllamaModel, setSelectedOllamaModel] = useState('');
    const [customEndpointUrl, setCustomEndpointUrl] = useState('');
    const [customEndpointKey, setCustomEndpointKey] = useState('');

    // ── Cloud model selection ──
    const [availableCloudModels, setAvailableCloudModels] = useState<string[]>([]);
    const [selectedCloudModel, setSelectedCloudModel] = useState('');
    const [cloudModelLoading, setCloudModelLoading] = useState(false);

    // ── Buddy & safety state ──
    const [selectedSkin, setSelectedSkin] = useState('skales');
    const [safetyChoice, setSafetyChoice] = useState<'safe' | 'unrestricted'>('safe');

    const [formData, setFormData] = useState({
        name: '',
        occupation: '',
        goals: '',
        interests: '',
        language: 'auto',
        apiKey: '',
        telemetryEnabled: false, // opt-in default OFF
    });

    const SETUP_STEPS = 7; // Steps 1–7 (step 0 is the disclaimer)

    const availableSkins = [
        { id: 'skales',  name: 'Skales',  emoji: '🦎', desc: t('onboarding.skalesDesc') },
        { id: 'bubbles', name: 'Bubbles', emoji: '💧', desc: t('onboarding.bubblesDesc') },
        { id: 'capy',    name: 'Capy',    emoji: '🦫', desc: t('onboarding.capyDesc') },
    ];

    // ── Fetch models for cloud provider ──
    async function fetchModelsForProvider(provider: string, apiKey: string): Promise<string[]> {
        if (provider === 'openrouter') {
            try {
                const res = await fetch('https://openrouter.ai/api/v1/models');
                const data = await res.json();
                return (data.data || [])
                    .filter((m: any) => m.id && !m.id.includes('embed') && !m.id.includes('audio'))
                    .sort((a: any, b: any) => (b.created || 0) - (a.created || 0))
                    .slice(0, 50)
                    .map((m: any) => m.id);
            } catch { return []; }
        }
        if (provider === 'openai') {
            try {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });
                const data = await res.json();
                return (data.data || [])
                    .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('o4'))
                    .map((m: any) => m.id)
                    .sort();
            } catch { return []; }
        }
        if (provider === 'anthropic') {
            return ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250515'];
        }
        if (provider === 'google') {
            return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
        }
        if (provider === 'groq') {
            return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
        }
        if (provider === 'mistral') {
            return ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'];
        }
        if (provider === 'deepseek') {
            return ['deepseek-chat', 'deepseek-reasoner'];
        }
        if (provider === 'xai') {
            return ['grok-3', 'grok-3-mini', 'grok-2'];
        }
        if (provider === 'together') {
            return ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo', 'mistralai/Mixtral-8x22B-Instruct-v0.1'];
        }
        return [];
    }

    // Auto-fetch models when API key is entered (debounced)
    useEffect(() => {
        if (formData.apiKey.trim().length > 10 && cloudProvider && providerChoice === 'cloud') {
            setCloudModelLoading(true);
            const timer = setTimeout(async () => {
                const models = await fetchModelsForProvider(cloudProvider, formData.apiKey);
                setAvailableCloudModels(models);
                if (models.length > 0 && !selectedCloudModel) {
                    const preferred = models.find(m =>
                        m.includes('gpt-4o') || m.includes('claude-sonnet') || m.includes('gemini-2') || m.includes('llama-3.3')
                    ) || models[0];
                    setSelectedCloudModel(preferred);
                }
                setCloudModelLoading(false);
            }, 500);
            return () => { clearTimeout(timer); setCloudModelLoading(false); };
        } else if (providerChoice === 'cloud' && cloudProvider) {
            // For providers with static lists, load immediately
            const timer = setTimeout(async () => {
                const models = await fetchModelsForProvider(cloudProvider, '');
                setAvailableCloudModels(models);
                if (models.length > 0 && !selectedCloudModel) {
                    setSelectedCloudModel(models[0]);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.apiKey, cloudProvider, providerChoice]);

    async function detectOllamaForOnboarding() {
        setOllamaChecking(true);
        try {
            const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                const models = (data.models || []).map((m: any) => m.name);
                setOllamaDetected(true);
                setOllamaModels(models);
                if (models.length > 0) setSelectedOllamaModel(models[0]);
            }
        } catch { /* Ollama not running */ }
        setOllamaChecking(false);
    }

    const handleSubmit = async () => {
        if (submitting.current || saving) return;
        submitting.current = true;
        setSaving(true);
        try {
            const goals     = formData.goals.split(',').map(g => g.trim()).filter(Boolean);
            const interests = formData.interests.split(',').map(i => i.trim()).filter(Boolean);

            // Provider saving
            if (providerChoice === 'cloud') {
                if (formData.apiKey.trim()) await saveApiKey(cloudProvider as Provider, formData.apiKey.trim());
                const cloudSettings: any = { activeProvider: cloudProvider as Provider };
                if (selectedCloudModel) {
                    cloudSettings.activeModel = selectedCloudModel;
                    // Write into providers[provider].model so orchestrator picks it up
                    cloudSettings.providers = { [cloudProvider]: { model: selectedCloudModel } };
                }
                await saveAllSettings(cloudSettings as any);
            } else if (providerChoice === 'local' && selectedOllamaModel) {
                await saveAllSettings({
                    activeProvider: 'ollama' as Provider,
                    providers: { ollama: { apiKey: 'ollama', baseUrl: 'http://localhost:11434/v1', model: selectedOllamaModel, enabled: true } } as any,
                } as any);
            } else if (providerChoice === 'custom' && customEndpointUrl.trim()) {
                await saveAllSettings({
                    activeProvider: 'custom' as Provider,
                    providers: { custom: { apiKey: customEndpointKey.trim(), baseUrl: customEndpointUrl.trim(), model: '', enabled: true } } as any,
                } as any);
            }

            // Buddy skin
            if (selectedSkin !== 'skales') { await saveAllSettings({ buddy_skin: selectedSkin } as any); }

            // Safety mode
            await saveAllSettings({ safetyMode: safetyChoice } as any);

            // Telemetry preference (opt-in only) + UI language (for Desktop Buddy & server i18n)
            await saveAllSettings({ telemetry_enabled: formData.telemetryEnabled, locale } as any);

            // Identity (completion sentinel — writes both soul.json and human.json)
            await completeBootstrap({
                name: formData.name || undefined,
                context: {
                    occupation: formData.occupation || undefined,
                    goals,
                    challenges: []
                },
                interests,
                preferences: {
                    language: formData.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            } as any);

            router.push('/chat');
        } finally {
            setSaving(false);
            submitting.current = false;
        }
    };

    const handleSkip = async () => {
        if (submitting.current || saving) return;
        submitting.current = true;
        setSaving(true);
        try {
            await saveAllSettings({ safetyMode: 'safe', locale } as any);
            await completeBootstrap({} as any);
            router.push('/chat');
        } finally {
            setSaving(false);
            submitting.current = false;
        }
    };

    // Back navigation — skip buddy step if only one skin
    const handleBack = () => {
        if (step === 5 && availableSkins.length <= 1) {
            setStep(3);
        } else {
            setStep(step - 1);
        }
    };

    // ── Language Picker (pre-step, shown before step 0) ──
    if (showLangPicker) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
                <div className="max-w-md w-full rounded-3xl border p-8 shadow-2xl animate-fadeIn"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center text-4xl shadow-lg shadow-lime-500/20">
                            🦎
                        </div>
                        <h1 className="text-xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                            Choose your language
                        </h1>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Wähle deine Sprache · Elige tu idioma · Choisissez votre langue · Выберите язык · 选择语言 · 言語を選択
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {SUPPORTED_LOCALES.map(loc => (
                            <button
                                key={loc.code}
                                onClick={() => {
                                    setLocale(loc.code);
                                    setShowLangPicker(false);
                                }}
                                className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all hover:border-lime-500 hover:bg-lime-500/5 active:scale-95"
                                style={{ borderColor: 'var(--border)', background: 'var(--surface-light)' }}
                            >
                                {loc.flag && <span className="text-xl leading-none">{loc.flag}</span>}
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{loc.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
            <div className="max-w-2xl w-full rounded-3xl border p-8 shadow-2xl animate-fadeIn"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center overflow-hidden shadow-lg shadow-lime-500/20 animate-float">
                        {step >= 4 ? (
                            <img
                                src={`/mascot/${selectedSkin}/icon.png`}
                                alt="Buddy"
                                className="w-14 h-14 object-contain"
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <span className="text-4xl">🦎</span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-lime-400 to-green-600 bg-clip-text text-transparent">
                        {t('onboarding.bootstrap.welcome')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {step === 0
                            ? t('onboarding.bootstrap.step0.readAndAccept')
                            : t('onboarding.bootstrap.setupProgress', { step, total: SETUP_STEPS })}
                    </p>
                </div>

                {/* ── Progress Bar (only after disclaimer) ── */}
                {step > 0 && (
                    <div className="mb-8 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                        <div className="h-full bg-gradient-to-r from-lime-400 to-green-600 transition-all duration-500"
                            style={{ width: `${(step / SETUP_STEPS) * 100}%` }} />
                    </div>
                )}

                {/* ── Step 0: Security & Privacy Disclaimer (MANDATORY) ── */}
                {step === 0 && (
                    <div className="space-y-5 animate-fadeIn">
                        {/* Privacy block */}
                        <div className="p-4 rounded-xl border" style={{ background: 'rgba(132,204,22,0.05)', borderColor: 'rgba(132,204,22,0.25)' }}>
                            <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                🔒 {t('disclaimer.privacyTitle')}
                            </p>
                            <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <li>✅ {t('disclaimer.privacyLocal')}</li>
                                <li>✅ {t('disclaimer.privacyTelemetry')}</li>
                                <li>✅ {t('disclaimer.privacyBYOK')}</li>
                                <li>✅ {t('disclaimer.privacyOffline')}</li>
                            </ul>
                        </div>

                        {/* Autonomy warning block */}
                        <div className="p-4 rounded-xl border" style={{ background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.3)' }}>
                            <p className="font-bold text-sm mb-2 flex items-center gap-2 text-amber-400">
                                ⚠️ {t('disclaimer.autonomyTitle')}
                            </p>
                            <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <li>⚡ {t('disclaimer.autonomyExecute')}</li>
                                <li>🔑 {t('disclaimer.autonomyCloud')}</li>
                                <li>🛡️ {t('disclaimer.autonomySafeguards')}</li>
                                <li>🚨 {t('disclaimer.autonomyInjection')}</li>
                                <li>📂 {t('disclaimer.autonomyFileAccess')}</li>
                            </ul>
                        </div>

                        {/* Acceptance checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <div className="relative mt-0.5 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={securityAccepted}
                                    onChange={e => setSecurityAccepted(e.target.checked)}
                                    className="sr-only"
                                />
                                <div
                                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
                                    style={{
                                        borderColor: securityAccepted ? '#84cc16' : 'var(--border)',
                                        background: securityAccepted ? '#84cc16' : 'transparent',
                                    }}>
                                    {securityAccepted && <span className="text-black text-xs font-bold">✓</span>}
                                </div>
                            </div>
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {t('onboarding.bootstrap.step0.checkboxLabel')}
                            </span>
                        </label>

                        <button
                            onClick={() => { if (securityAccepted) setStep(1); }}
                            disabled={!securityAccepted}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                            style={{
                                background: securityAccepted ? '#84cc16' : 'var(--surface-light)',
                                color: securityAccepted ? 'black' : 'var(--text-muted)',
                                cursor: securityAccepted ? 'pointer' : 'not-allowed',
                                opacity: securityAccepted ? 1 : 0.5,
                            }}
                        >
                            {t('onboarding.bootstrap.step0.continueButton')}
                        </button>
                        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                            {t('onboarding.bootstrap.step0.cannotSkip')}
                        </p>
                    </div>
                )}

                {/* ── Step 1: Name + Occupation ── */}
                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('onboarding.bootstrap.steps.name')} <span style={{ color: 'var(--text-muted)' }}>{t('common.optional')}</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('onboarding.placeholders.name')}
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-lime-500 transition-colors"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('onboarding.bootstrap.steps.occupation')}
                            </label>
                            <input
                                type="text"
                                value={formData.occupation}
                                onChange={(e: any) => setFormData({ ...formData, occupation: e.target.value })}
                                placeholder={t('onboarding.placeholders.occupation')}
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-lime-500 transition-colors"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Step 2: Goals, Interests, Language ── */}
                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('onboarding.bootstrap.steps.goals')}
                            </label>
                            <textarea
                                value={formData.goals}
                                onChange={(e: any) => setFormData({ ...formData, goals: e.target.value })}
                                placeholder={t('onboarding.placeholders.goals')}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-lime-500 transition-colors resize-none"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('onboarding.bootstrap.separateWithCommas')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('onboarding.bootstrap.steps.interests')}
                            </label>
                            <textarea
                                value={formData.interests}
                                onChange={(e: any) => setFormData({ ...formData, interests: e.target.value })}
                                placeholder={t('onboarding.placeholders.interests')}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-lime-500 transition-colors resize-none"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('onboarding.bootstrap.separateWithCommas')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('onboarding.bootstrap.steps.nativeLang')}
                            </label>
                            <select
                                value={formData.language}
                                onChange={(e: any) => setFormData({ ...formData, language: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-lime-500 transition-colors"
                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)', appearance: 'none' }}
                            >
                                <option value="auto">Auto-Detect (Follows your input)</option>
                                <option value="en">English</option>
                                <option value="de">German (Deutsch)</option>
                                <option value="fr">French (Français)</option>
                                <option value="es">Spanish (Español)</option>
                                <option value="ru">Russian (Русский)</option>
                                <option value="zh">Chinese (中文)</option>
                                <option value="ja">Japanese (日本語)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Choose Your Provider ── */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="mb-1">
                            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('onboarding.chooseProvider')}</h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('onboarding.chooseProviderDesc')}</p>
                        </div>

                        {/* ── Cloud AI Card ── */}
                        <div
                            onClick={() => setProviderChoice('cloud')}
                            className="p-4 rounded-xl border cursor-pointer transition-all"
                            style={{
                                background: providerChoice === 'cloud' ? 'rgba(132,204,22,0.08)' : 'var(--surface-light)',
                                borderColor: providerChoice === 'cloud' ? 'rgba(132,204,22,0.6)' : 'var(--border)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('onboarding.cloudLabel')}</span>
                                {providerChoice === 'cloud' && <span className="ml-auto text-lime-400 text-xs font-bold">✓</span>}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.cloudDesc')}</p>
                            {providerChoice === 'cloud' && (
                                <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            {t('onboarding.selectCloudProvider')}
                                        </label>
                                        <select
                                            value={cloudProvider}
                                            onChange={e => { setCloudProvider(e.target.value); setFormData({ ...formData, apiKey: '' }); setAvailableCloudModels([]); setSelectedCloudModel(''); }}
                                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)', appearance: 'none' }}
                                        >
                                            {CLOUD_PROVIDERS.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            {t('onboarding.apiKeyFor', { provider: CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.name || cloudProvider })}{' '}
                                            <span style={{ color: 'var(--text-muted)' }}>{t('onboarding.apiKeyOptional')}</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.apiKey}
                                            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                            placeholder={CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.placeholder || 'API key...'}
                                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors font-mono"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    {/* ── Model selection dropdown ── */}
                                    {availableCloudModels.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                                {t('onboarding.selectModel')}
                                            </label>
                                            <select
                                                value={selectedCloudModel}
                                                onChange={e => setSelectedCloudModel(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors"
                                                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)', appearance: 'none' }}
                                            >
                                                {availableCloudModels.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            {!selectedCloudModel && (
                                                <p className="text-xs mt-1 text-amber-400">{t('onboarding.selectModelHint')}</p>
                                            )}
                                        </div>
                                    )}
                                    {cloudModelLoading && (
                                        <p className="text-xs text-lime-400 animate-pulse">{t('onboarding.loadingModels')}</p>
                                    )}
                                    {!cloudModelLoading && formData.apiKey.trim().length > 10 && availableCloudModels.length === 0 && (
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.noModelsFound')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── OpenAI Compatible Card (moved above Ollama per H2) ── */}
                        <div
                            onClick={() => setProviderChoice('custom')}
                            className="p-4 rounded-xl border cursor-pointer transition-all"
                            style={{
                                background: providerChoice === 'custom' ? 'rgba(132,204,22,0.08)' : 'var(--surface-light)',
                                borderColor: providerChoice === 'custom' ? 'rgba(132,204,22,0.6)' : 'var(--border)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('onboarding.customLabel')}</span>
                                {providerChoice === 'custom' && <span className="ml-auto text-lime-400 text-xs font-bold">✓</span>}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.customDesc')}</p>
                            {providerChoice === 'custom' && (
                                <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            {t('onboarding.customEndpointUrl')}
                                        </label>
                                        <input
                                            type="text"
                                            value={customEndpointUrl}
                                            onChange={e => setCustomEndpointUrl(e.target.value)}
                                            placeholder={t('onboarding.customEndpointPlaceholder')}
                                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors font-mono"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            {t('onboarding.customEndpointKey')}
                                        </label>
                                        <input
                                            type="password"
                                            value={customEndpointKey}
                                            onChange={e => setCustomEndpointKey(e.target.value)}
                                            placeholder={t('onboarding.customEndpointKeyPlaceholder')}
                                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors font-mono"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Ollama Card ── */}
                        <div
                            onClick={() => {
                                setProviderChoice('local');
                                if (!ollamaDetected && !ollamaChecking) detectOllamaForOnboarding();
                            }}
                            className="p-4 rounded-xl border cursor-pointer transition-all"
                            style={{
                                background: providerChoice === 'local' ? 'rgba(132,204,22,0.08)' : 'var(--surface-light)',
                                borderColor: providerChoice === 'local' ? 'rgba(132,204,22,0.6)' : 'var(--border)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('onboarding.localLabel')}</span>
                                {providerChoice === 'local' && <span className="ml-auto text-lime-400 text-xs font-bold">✓</span>}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.localDesc')}</p>
                            {providerChoice === 'local' && (
                                <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                                    {ollamaChecking && (
                                        <p className="text-xs text-lime-400 animate-pulse">{t('onboarding.detectingOllama')}</p>
                                    )}
                                    {!ollamaChecking && ollamaDetected && (
                                        <>
                                            <p className="text-xs text-lime-400">✓ {t('onboarding.ollamaDetected')}</p>
                                            {ollamaModels.length > 0 ? (
                                                <div>
                                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                                        {t('onboarding.ollamaSelectModel')}
                                                    </label>
                                                    <select
                                                        value={selectedOllamaModel}
                                                        onChange={e => setSelectedOllamaModel(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-lime-500 transition-colors"
                                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)', appearance: 'none' }}
                                                    >
                                                        {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.ollamaNoModels')}</p>
                                            )}
                                        </>
                                    )}
                                    {!ollamaChecking && !ollamaDetected && (
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('onboarding.ollamaNotFound')}</p>
                                            <button
                                                onClick={detectOllamaForOnboarding}
                                                className="text-xs px-3 py-1.5 rounded-lg border hover:border-lime-500 transition-colors shrink-0"
                                                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                            >
                                                {t('onboarding.detectOllama')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Choose Your Buddy ── */}
                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="mb-1">
                            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('onboarding.chooseBuddy')}</h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('onboarding.chooseBuddyDesc')}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {availableSkins.map(skin => (
                                <div
                                    key={skin.id}
                                    onClick={() => setSelectedSkin(skin.id)}
                                    className="p-5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-3 text-center"
                                    style={{
                                        background: selectedSkin === skin.id ? 'rgba(132,204,22,0.08)' : 'var(--surface-light)',
                                        borderColor: selectedSkin === skin.id ? 'rgba(132,204,22,0.6)' : 'var(--border)',
                                    }}
                                >
                                    <div className="w-16 h-16 flex items-center justify-center">
                                        <img
                                            src={`/mascot/${skin.id}/icon.png`}
                                            alt={skin.name}
                                            className="w-14 h-14 object-contain"
                                            onError={(e: any) => {
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <span className="text-4xl hidden">{skin.emoji}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{skin.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{skin.desc}</p>
                                    </div>
                                    {selectedSkin === skin.id && (
                                        <span className="text-xs font-bold text-lime-400">✓ Selected</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 5: Safety Mode ── */}
                {step === 5 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="mb-1">
                            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('onboarding.chooseSafety')}</h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('onboarding.chooseSafetyDesc')}</p>
                        </div>
                        {([
                            { id: 'safe'          as const, label: t('onboarding.safeLabel'),         desc: t('onboarding.safeDesc'),         bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.5)'  },
                            { id: 'unrestricted'  as const, label: t('onboarding.unrestrictedLabel'), desc: t('onboarding.unrestrictedDesc'), bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.4)'  },
                        ] as const).map(mode => (
                            <div
                                key={mode.id}
                                onClick={() => setSafetyChoice(mode.id)}
                                className="p-4 rounded-xl border cursor-pointer transition-all"
                                style={{
                                    background: safetyChoice === mode.id ? mode.bg : 'var(--surface-light)',
                                    borderColor: safetyChoice === mode.id ? mode.border : 'var(--border)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{mode.label}</span>
                                    {safetyChoice === mode.id && <span className="ml-auto text-lime-400 text-xs font-bold">✓</span>}
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{mode.desc}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Step 6: Telemetry opt-in ── */}
                {step === 6 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                            <div className="text-3xl mb-3 text-center">📊</div>
                            <h3 className="font-bold mb-3 text-center" style={{ color: 'var(--text-primary)' }}>
                                {t('telemetry.title')}
                            </h3>
                            <p className="text-xs mb-5 text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {t('telemetry.description')}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setFormData({ ...formData, telemetryEnabled: true })}
                                    className="w-full px-6 py-3 rounded-xl font-medium transition-all text-sm"
                                    style={{
                                        background: formData.telemetryEnabled ? 'rgba(132,204,22,0.15)' : 'var(--surface)',
                                        border: `1px solid ${formData.telemetryEnabled ? 'rgba(132,204,22,0.6)' : 'var(--border)'}`,
                                        color: formData.telemetryEnabled ? '#84cc16' : 'var(--text-secondary)',
                                    }}
                                >
                                    {formData.telemetryEnabled ? '✓ ' : ''}{t('telemetry.yesLabel')}
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, telemetryEnabled: false })}
                                    className="w-full px-6 py-3 rounded-xl font-medium transition-all text-sm"
                                    style={{
                                        background: !formData.telemetryEnabled ? 'var(--surface-light)' : 'var(--surface)',
                                        border: `1px solid ${!formData.telemetryEnabled ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                                        color: !formData.telemetryEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
                                    }}
                                >
                                    {!formData.telemetryEnabled ? '✓ ' : ''}{t('telemetry.noLabel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 7: Summary + Launch ── */}
                {step === 7 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('onboarding.bootstrap.ready')}</h3>
                            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {formData.name      && <p>👤 <strong>{t('onboarding.bootstrap.summaryName')}:</strong> {formData.name}</p>}
                                {formData.occupation && <p>💼 <strong>{t('onboarding.bootstrap.summaryOccupation')}:</strong> {formData.occupation}</p>}
                                {formData.goals     && <p>🎯 <strong>{t('onboarding.bootstrap.summaryGoals')}:</strong> {formData.goals}</p>}
                                {formData.interests && <p>⭐ <strong>{t('onboarding.bootstrap.summaryInterests')}:</strong> {formData.interests}</p>}
                                <p>🤖 <strong>{t('onboarding.bootstrap.summaryProvider')}:</strong>{' '}
                                    {providerChoice === 'cloud'
                                        ? <span style={{ color: '#84cc16' }}>{CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.name || cloudProvider}{formData.apiKey.trim() ? ' ✓' : ' (no key)'}</span>
                                        : providerChoice === 'local'
                                        ? <span style={{ color: '#84cc16' }}>Ollama{selectedOllamaModel ? ` — ${selectedOllamaModel}` : ''}</span>
                                        : providerChoice === 'custom'
                                        ? <span style={{ color: '#84cc16' }}>Custom endpoint</span>
                                        : <span style={{ color: 'var(--text-muted)' }}>Not set — add in Settings</span>
                                    }
                                </p>
                                <p>🎨 <strong>{t('onboarding.bootstrap.summaryBuddy')}:</strong>{' '}
                                    <span style={{ color: '#84cc16' }}>{availableSkins.find(s => s.id === selectedSkin)?.name || selectedSkin}</span>
                                </p>
                                <p>🛡️ <strong>{t('onboarding.bootstrap.summarySafety')}:</strong>{' '}
                                    <span style={{ color: '#84cc16' }}>{safetyChoice}</span>
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                            {t('onboarding.bootstrap.summaryNote')}
                        </p>
                    </div>
                )}

                {/* ── Navigation (Steps 1–7) ── */}
                {step > 0 && (
                    <>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl font-medium transition-all hover:bg-[var(--surface-light)]"
                                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                {t('onboarding.bootstrap.back')}
                            </button>
                            {step < SETUP_STEPS ? (
                                <button
                                    onClick={() => {
                                        if (step === 3) {
                                            // Skip buddy step if only one skin available
                                            setStep(availableSkins.length <= 1 ? 5 : 4);
                                        } else {
                                            setStep(step + 1);
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-lime-500 hover:bg-lime-400 text-black transition-all shadow-lg shadow-lime-500/20"
                                >
                                    {t('onboarding.bootstrap.continue')}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-lime-500 hover:bg-lime-400 text-black transition-all shadow-lg shadow-lime-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? t('onboarding.bootstrap.settingUp') : t('onboarding.bootstrap.letsGo')}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSkip}
                            disabled={saving}
                            className="w-full mt-4 text-xs hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {saving ? t('onboarding.bootstrap.pleaseWait') : t('onboarding.bootstrap.skip')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
