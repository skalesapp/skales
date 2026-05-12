'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Save, AlertCircle, Info } from 'lucide-react';
import { loadGroupChatConfig, saveGroupChatConfig } from '@/actions/skills';
import type { GroupChatConfig, GroupChatParticipant } from '@/actions/skills';
import { loadSettings } from '@/actions/chat';

// ─── Participant Colors (A→E) ─────────────────────────────────

const PARTICIPANT_COLORS = [
    { border: 'border-lime-300 dark:border-lime-500/40', label: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400', ring: 'ring-lime-300 dark:ring-lime-500/30' },
    { border: 'border-blue-300 dark:border-blue-500/40', label: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', ring: 'ring-blue-300 dark:ring-blue-500/30' },
    { border: 'border-orange-300 dark:border-orange-500/40', label: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', ring: 'ring-orange-300 dark:ring-orange-500/30' },
    { border: 'border-purple-300 dark:border-purple-500/40', label: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', ring: 'ring-purple-300 dark:ring-purple-500/30' },
    { border: 'border-pink-300 dark:border-pink-500/40', label: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400', ring: 'ring-pink-300 dark:ring-pink-500/30' },
];

const PARTICIPANT_LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ─── Provider List ────────────────────────────────────────────

const KNOWN_PROVIDERS = [
    { id: 'openrouter', label: 'OpenRouter' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'google', label: 'Google' },
    { id: 'groq', label: 'Groq' },
    { id: 'mistral', label: 'Mistral' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'xai', label: 'xAI (Grok)' },
    { id: 'together', label: 'Together AI' },
    { id: 'qiniu', label: 'Qiniu' },
    { id: 'ollama', label: 'Ollama (local)' },
];

const LANGUAGE_OPTIONS = [
    'English', 'German', 'Spanish', 'French', 'Portuguese',
    'Italian', 'Japanese', 'Chinese', 'Korean', 'Arabic', 'Russian',
];

const DEFAULT_PARTICIPANT: GroupChatParticipant = {
    name: 'Participant',
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    persona: 'A thoughtful and balanced discussion participant.',
};

// ─── Component ───────────────────────────────────────────────

export default function GroupChatSettingsPage() {
    const { t } = useTranslation();
    const [config, setConfig] = useState<GroupChatConfig | null>(null);
    const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load config + available providers
    useEffect(() => {
        loadGroupChatConfig().then(c => setConfig(c));
        loadSettings().then(settings => {
            const configured: string[] = [];
            for (const [id, cfg] of Object.entries(settings.providers)) {
                if (id === 'ollama' ? (cfg as any).baseUrl : (cfg as any).apiKey) {
                    configured.push(id);
                }
            }
            setConfiguredProviders(configured.length > 0 ? configured : KNOWN_PROVIDERS.map(p => p.id));
        });
    }, []);

    if (!config) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const updateParticipant = (index: number, field: keyof GroupChatParticipant, value: string) => {
        setConfig(prev => {
            if (!prev) return prev;
            const participants = [...prev.participants];
            participants[index] = { ...participants[index], [field]: value };
            return { ...prev, participants };
        });
    };

    const addParticipant = () => {
        if (config.participants.length >= 5) return;
        const letter = PARTICIPANT_LETTERS[config.participants.length];
        setConfig(prev => prev ? {
            ...prev,
            participants: [...prev.participants, { ...DEFAULT_PARTICIPANT, name: `Participant ${letter}` }],
        } : prev);
    };

    const removeParticipant = (index: number) => {
        if (config.participants.length <= 3) return;
        setConfig(prev => prev ? {
            ...prev,
            participants: prev.participants.filter((_, i) => i !== index),
        } : prev);
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);
        const result = await saveGroupChatConfig(config);
        setSaving(false);
        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            setSaveError(result.error || 'Save failed.');
        }
    };

    const providerOptions = KNOWN_PROVIDERS.filter(p => configuredProviders.includes(p.id));
    if (providerOptions.length === 0) {
        providerOptions.push(...KNOWN_PROVIDERS);
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/group-chat"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors"
                >
                    <ChevronLeft size={16} />
                    {t('groupChat.settings.back')}
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold">{t('groupChat.settings.title')}</h1>
                <p className="text-text-secondary mt-1 text-sm">
                    {t('groupChat.settings.subtitle')}
                </p>
            </div>

            {/* Cost Warning */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-400 dark:bg-yellow-500/10 dark:border-yellow-500/30 rounded-xl p-4">
                <AlertCircle size={18} className="text-amber-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-yellow-300">
                    Group Chat makes one API call per participant per round, plus a final summary call.
                    With 3 participants and 3 rounds, that is <strong>10 API calls</strong>. Monitor your provider usage accordingly.
                </p>
            </div>

            {/* General Settings */}
            <section className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-base font-semibold">{t('groupChat.sections.discussion')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Language */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                            {t('groupChat.language')}
                        </label>
                        <select
                            value={config.language}
                            onChange={e => setConfig(prev => prev ? { ...prev, language: e.target.value } : prev)}
                            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                        >
                            {LANGUAGE_OPTIONS.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Rounds */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                            {t('groupChat.rounds')}
                        </label>
                        <select
                            value={config.rounds}
                            onChange={e => setConfig(prev => prev ? { ...prev, rounds: parseInt(e.target.value) } : prev)}
                            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                        >
                            {[1, 2, 3, 4, 5].map(n => (
                                <option key={n} value={n}>{n === 1 ? t('groupChat.roundsOptions.one') : t('groupChat.roundsOptions.n', { n })}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-text-muted mt-1">
                            {t('groupChat.perParticipantHint')}
                        </p>
                    </div>

                    {/* Response Timeout */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                            {t('groupChat.timeout')}
                        </label>
                        <select
                            value={config.participantTimeoutSeconds ?? 120}
                            onChange={e => setConfig(prev => prev ? { ...prev, participantTimeoutSeconds: parseInt(e.target.value) } : prev)}
                            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                        >
                            <option value={60}>{t('groupChat.timeoutOptions.60')}</option>
                            <option value={120}>{t('groupChat.timeoutOptions.120')}</option>
                            <option value={180}>{t('groupChat.timeoutOptions.180')}</option>
                            <option value={300}>{t('groupChat.timeoutOptions.300')}</option>
                        </select>
                        <p className="text-[11px] text-text-muted mt-1">
                            Per-participant limit. Slow models (Kimi, GLM, deep reasoning) need more time. If a participant times out, they are skipped for that round.
                        </p>
                    </div>
                </div>
            </section>

            {/* Participants */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">{t('groupChat.sections.participants')}</h2>
                    <span className="text-xs text-text-secondary">{config.participants.length}/5</span>
                </div>

                {config.participants.map((participant, index) => {
                    const colors = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
                    const letter = PARTICIPANT_LETTERS[index];
                    return (
                        <div
                            key={index}
                            className={`bg-surface border ${colors.border} rounded-2xl p-5 space-y-4`}
                        >
                            {/* Participant header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${colors.label}`}>
                                        {letter}
                                    </span>
                                    <div>
                                        <input
                                            type="text"
                                            value={participant.name}
                                            onChange={e => updateParticipant(index, 'name', e.target.value)}
                                            placeholder="e.g. Devil's Advocate, Optimist, Tech Expert..."
                                            className="bg-transparent text-sm font-medium border-b border-dashed border-border focus:outline-none focus:border-lime-500 pb-0.5 w-64"
                                        />
                                        <p className="text-[10px] text-text-muted mt-0.5">{t('groupChat.participantNameHint')}</p>
                                    </div>
                                </div>
                                {index >= 3 && (
                                    <button
                                        onClick={() => removeParticipant(index)}
                                        className="p-1.5 text-text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                        title={t('groupChat.removeParticipant')}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Provider + Model */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                                        {t('groupChat.provider')}
                                    </label>
                                    <select
                                        value={participant.provider}
                                        onChange={e => updateParticipant(index, 'provider', e.target.value)}
                                        className="w-full bg-surface-light border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                                    >
                                        {KNOWN_PROVIDERS.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.label}{!configuredProviders.includes(p.id) ? ' ⚠' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                                        {t('groupChat.model')}
                                    </label>
                                    <input
                                        type="text"
                                        value={participant.model}
                                        onChange={e => updateParticipant(index, 'model', e.target.value)}
                                        placeholder="e.g. openai/gpt-4o"
                                        className="w-full bg-surface-light border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Persona */}
                            <div>
                                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                                    {t('groupChat.persona')}
                                </label>
                                <textarea
                                    value={participant.persona}
                                    onChange={e => updateParticipant(index, 'persona', e.target.value)}
                                    placeholder="Describe this participant's personality, perspective, and discussion style..."
                                    rows={3}
                                    className="w-full bg-surface-light border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500 resize-none"
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Add Participant Button */}
                {config.participants.length < 5 && (
                    <button
                        onClick={addParticipant}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-text-secondary hover:text-foreground hover:border-lime-500/50 transition-all text-sm"
                    >
                        <Plus size={16} />
                        {t('groupChat.addParticipant')} ({config.participants.length}/5)
                    </button>
                )}
            </section>

            {/* Hint */}
            <div className="flex items-start gap-2 text-xs text-text-secondary">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                    Providers marked with ⚠ don&apos;t have an API key configured yet. Add keys in{' '}
                    <Link href="/settings" className="text-lime-500 hover:underline">Settings</Link>.
                </span>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-semibold text-sm transition-all disabled:opacity-60"
                >
                    <Save size={16} />
                    {saving ? t('groupChat.settings.saving') : t('groupChat.settings.save')}
                </button>
                {saveSuccess && (
                    <span className="text-sm text-lime-400">{t('groupChat.settings.saved')}</span>
                )}
                {saveError && (
                    <span className="text-sm text-red-400">{saveError}</span>
                )}
            </div>

        </div>
    );
}
