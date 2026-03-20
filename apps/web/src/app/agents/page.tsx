'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
    openrouter: [
        { value: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
        { value: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
        { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
        { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
        { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    ],
    google: [
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    ollama: [
        { value: 'llama3.2', label: 'Llama 3.2' },
        { value: 'mistral', label: 'Mistral 7B' },
        { value: 'deepseek-coder-v2', label: 'DeepSeek Coder V2' },
    ],
};

import {
    listAgents, createAgent, deleteAgent, updateAgent,
    type AgentDefinition
} from '@/actions/agents';
import { Users, Plus, Play, Trash2, Edit, Check, X, Loader2, Info, Lock } from 'lucide-react';

const Icon = ({ icon: I, ...props }: { icon: any; [key: string]: any }) => {
    const Component = I;
    return <Component {...props} />;
};

const EMPTY_FORM = {
    name: '',
    description: '',
    emoji: '🤖',
    systemPrompt: '',
    capabilities: '',
    tools: '',
    model: '',
    provider: ''
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [showTooltip, setShowTooltip] = useState(false);
    const [saving, setSaving] = useState(false);

    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const agentList = await listAgents();
            setAgents(agentList);
        } catch (e) {
            console.error('Failed to load agents:', e);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingAgent(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (agent: AgentDefinition) => {
        setEditingAgent(agent);
        setFormData({
            name: agent.name,
            description: agent.description,
            emoji: agent.emoji,
            systemPrompt: agent.systemPrompt,
            capabilities: agent.capabilities.join(', '),
            tools: agent.tools.join(', '),
            model: agent.model || '',
            provider: agent.provider || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.systemPrompt) return;
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                emoji: formData.emoji,
                systemPrompt: formData.systemPrompt,
                capabilities: formData.capabilities.split(',').map(s => s.trim()).filter(Boolean),
                tools: formData.tools.split(',').map(s => s.trim()).filter(Boolean),
                model: formData.model || undefined,
                provider: formData.provider || undefined
            };

            if (editingAgent) {
                await updateAgent(editingAgent.id, payload);
            } else {
                await createAgent(payload);
            }
            setShowModal(false);
            setFormData(EMPTY_FORM);
            setEditingAgent(null);
            loadData();
        } catch (e) {
            console.error('Failed to save agent:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('agents.deleteConfirm'))) return;
        try {
            await deleteAgent(id);
            loadData();
        } catch (e) {
            console.error('Failed to delete agent:', e);
        }
    };

    const handleExecute = (id: string) => {
        router.push(`/chat?agent=${id}`);
    };

    // OpenClaw agents are read-only (managed via OpenClaw config)
    const isOpenClaw = (id: string) => id.startsWith('oc-');
    const isBuiltIn = (id: string) => isOpenClaw(id);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Icon icon={Loader2} className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Icon icon={Users} size={28} />
                        {t('agents.title')}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {t('agents.subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold flex items-center gap-2 shadow-lg shadow-lime-500/20 transition-all"
                >
                    <Icon icon={Plus} size={18} />
                    {t('agents.createAgent')}
                </button>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Default Agent — dynamically resolved from OpenClaw or fallback */}
                {(() => {
                    const def = agents.find(a => a.isDefault);
                    const defEmoji = def?.emoji || '🦎';
                    const defName = def?.name || 'Skales';
                    const defDesc = def?.description || t('agents.skales.desc');
                    const defId = def?.id || 'skales';
                    const defCaps = def?.capabilities || ['chat', 'tasks', 'tools', 'memory'];
                    return (
                        <div className="rounded-2xl border-2 p-4 transition-all relative"
                            style={{ background: 'var(--surface)', borderColor: 'rgba(132,204,22,0.4)' }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{defEmoji}</div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{defName}</h3>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime-500/15 text-lime-500 font-bold uppercase">{t('agents.skales.default')}</span>
                                            {def?.id?.startsWith('oc-') && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                                                    OpenClaw
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('agents.skales.alwaysAvailable')}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseLeave={() => setShowTooltip(false)}
                                        className="p-1 rounded-lg hover:bg-[var(--surface-light)] transition-colors"
                                    >
                                        <Icon icon={Info} size={14} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                    {showTooltip && (
                                        <div className="absolute right-0 top-8 z-50 w-64 p-3 rounded-xl text-xs shadow-xl animate-fadeIn"
                                            style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>About {defName}</p>
                                            <p>{defName} is the default agent. {def?.id?.startsWith('oc-') ? 'Powered by the OpenClaw gateway running on Docker.' : 'Uses the active model from Settings.'} You cannot edit or delete it.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                {defDesc}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {defCaps.slice(0, 5).map(cap => (
                                    <span key={cap} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                        style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                        {cap}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExecute(defId)}
                                    className="flex-1 px-3 py-2 rounded-lg font-medium text-xs transition-all hover:bg-lime-500 hover:text-black"
                                    style={{ background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                                >
                                    <Icon icon={Play} size={12} className="inline mr-1" />
                                    {t('agents.run')}
                                </button>
                                <button
                                    disabled
                                    className="px-3 py-2 rounded-lg text-xs opacity-40 cursor-not-allowed"
                                    style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}
                                    title={t('agents.skales.cannotEdit')}
                                >
                                    <Icon icon={Lock} size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Skales Custom Agents (excluding default, shown above) */}
                {agents.filter(a => !isOpenClaw(a.id) && !a.isDefault).map(agent => (
                    <div key={agent.id}
                        className="rounded-2xl border p-4 hover:border-lime-500/50 transition-all group cursor-pointer"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        onClick={() => !isBuiltIn(agent.id) ? openEditModal(agent) : undefined}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{agent.emoji}</div>
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</h3>
                                    {agent.lastUsed && (
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {t('agents.card.lastUsed', { date: new Date(agent.lastUsed).toLocaleDateString() })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isBuiltIn(agent.id) && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon={Edit} size={14} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{agent.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {agent.capabilities.slice(0, 3).map(cap => (
                                <span key={cap} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                    style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                                    {cap}
                                </span>
                            ))}
                        </div>
                        {agent.model && (
                            <p className="text-[10px] mb-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                                {agent.provider || 'default'} / {agent.model}
                            </p>
                        )}
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => handleExecute(agent.id)}
                                className="flex-1 px-3 py-2 rounded-lg font-medium text-xs transition-all hover:bg-lime-500 hover:text-black"
                                style={{ background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                            >
                                <Icon icon={Play} size={12} className="inline mr-1" />
                                Run
                            </button>
                            {!isBuiltIn(agent.id) && (
                                <>
                                    <button
                                        onClick={() => openEditModal(agent)}
                                        className="px-3 py-2 rounded-lg text-xs transition-all hover:bg-blue-500/10 hover:text-blue-400"
                                        style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}
                                        title={t('agents.editAgent')}
                                    >
                                        <Icon icon={Edit} size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        className="px-3 py-2 rounded-lg text-xs transition-all hover:bg-red-500 hover:text-white"
                                        style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}
                                        title={t('agents.deleteAgent')}
                                    >
                                        <Icon icon={Trash2} size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* OpenClaw Agents Section */}
            {agents.filter(a => isOpenClaw(a.id) && !a.isDefault).length > 0 && (
                <>
                    <div className="flex items-center gap-2 mt-8">
                        <span className="text-xl">🦞</span>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>OpenClaw Agents</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                            via Gateway
                        </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        Managed by your local OpenClaw gateway. Edit these in OpenClaw config.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {agents.filter(a => isOpenClaw(a.id) && !a.isDefault).map(agent => (
                            <div key={agent.id}
                                className="rounded-2xl border p-4 transition-all group"
                                style={{ background: 'var(--surface)', borderColor: 'rgba(249,115,22,0.25)' }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{agent.emoji}</div>
                                        <div>
                                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</h3>
                                            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{agent.id.replace('oc-', '')}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>OpenClaw</span>
                                </div>
                                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{agent.description}</p>
                                {agent.model && (
                                    <p className="text-[10px] mb-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                                        {agent.model}
                                    </p>
                                )}
                                <button
                                    onClick={() => handleExecute(agent.id)}
                                    className="w-full px-3 py-2 rounded-lg font-medium text-xs transition-all hover:bg-orange-500 hover:text-white"
                                    style={{ background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                                >
                                    <Icon icon={Play} size={12} className="inline mr-1" />
                                    Chat
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowModal(false)}>
                    <div className="max-w-2xl w-full rounded-2xl border p-6 animate-scaleIn max-h-[90vh] overflow-y-auto"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            {editingAgent ? t('agents.modal.edit', { name: editingAgent.name }) : t('agents.modal.create')}
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.name')}</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        placeholder="Research Assistant"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.emoji')}</label>
                                    <input
                                        value={formData.emoji}
                                        onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm text-center text-xl"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        placeholder="🔬"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.description')}</label>
                                <input
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    placeholder="Specialized in research and analysis"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.systemPrompt')}</label>
                                <textarea
                                    value={formData.systemPrompt}
                                    onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    rows={4}
                                    placeholder="You are a research specialist..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.capabilities')}</label>
                                <input
                                    value={formData.capabilities}
                                    onChange={e => setFormData({ ...formData, capabilities: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    placeholder="research, analysis, writing"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.provider')}</label>
                                    <select
                                        value={formData.provider}
                                        onChange={e => setFormData({ ...formData, provider: e.target.value, model: '' })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">{t('agents.providers.default')}</option>
                                        <option value="openrouter">{t('agents.providers.openrouter')}</option>
                                        <option value="openai">{t('agents.providers.openai')}</option>
                                        <option value="anthropic">{t('agents.providers.anthropic')}</option>
                                        <option value="google">{t('agents.providers.google')}</option>
                                        <option value="ollama">{t('agents.providers.ollama')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('agents.form.model')}</label>
                                    {formData.provider && PROVIDER_MODELS[formData.provider] ? (
                                        <select
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border text-sm"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="">{t('agents.defaultModel')}</option>
                                            {PROVIDER_MODELS[formData.provider].map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border text-sm"
                                            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                            placeholder="gpt-4o, claude-3-opus..."
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowModal(false); setEditingAgent(null); }}
                                className="flex-1 px-4 py-2 rounded-xl font-medium transition-all hover:bg-[var(--surface-light)]"
                                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                {t('agents.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name || !formData.systemPrompt || saving}
                                className="flex-1 px-4 py-2 rounded-xl font-bold bg-lime-500 hover:bg-lime-400 text-black transition-all shadow-lg shadow-lime-500/20 disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {saving && <Icon icon={Loader2} size={16} className="animate-spin" />}
                                {editingAgent ? t('agents.saveChanges') : t('agents.createAgentBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
