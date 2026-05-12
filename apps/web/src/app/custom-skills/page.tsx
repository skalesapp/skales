'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
    Loader2, Trash2, ToggleLeft, ToggleRight, Upload, Sparkles,
    AlertTriangle, Copy, CheckCheck, ChevronDown, Puzzle, Zap, Code2,
    Download, Wrench, XCircle, CheckCircle2, Pencil, Package, RefreshCw,
    // Lucide icons for the icon picker
    Code, Image, Quote, Music, Globe, Search, FileText, BarChart3,
    Shield, Camera, Heart, Star, Briefcase, Database, Mail, Bell, Bookmark,
    Calculator, Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers,
    Link as LinkIcon, Lock, Map, Monitor, PenTool, Rocket, Server, Terminal, TrendingUp,
    Tv, Video, Wifi, Bot, Palette, Gamepad2, Lightbulb, Megaphone, Settings,
    Users, Eye, Activity,
} from 'lucide-react';
import type { CustomSkillMeta, SkillCategory } from '@/actions/custom-skills';
import { SKILL_ICON_NAMES, DEFAULT_SKILL_ICON, isEmoji } from '@/lib/skill-icons';

// ── Lucide icon name → component map ────────────────────────────
const ICON_MAP: Record<string, any> = {
    Wrench, Code, Image, Quote, Music, Globe, Search, FileText, BarChart3, Zap,
    Shield, Camera, Heart, Star, Briefcase, Database, Mail, Bell, Bookmark,
    Calculator, Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers,
    Link: LinkIcon, Lock, Map, Monitor, Package, PenTool, Rocket, Server, Terminal,
    TrendingUp, Tv, Video, Wifi, Bot, Palette, Gamepad2, Lightbulb, Megaphone,
    Settings, Users, Eye, Activity,
};

/** Render a skill icon — Lucide component by name or emoji fallback */
const SkillIconDisplay = ({ icon, size = 20 }: { icon: string; size?: number }) => {
    const Comp = ICON_MAP[icon];
    if (Comp) return <Comp size={size} />;
    if (isEmoji(icon)) return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
    return <Wrench size={size} />;
};

// ─── Constants ─────────────────────────────────────────────────────

const CATEGORIES: { value: SkillCategory; label: string; emoji: string }[] = [
    { value: 'productivity',   label: 'Productivity',   emoji: '📋' },
    { value: 'communication',  label: 'Communication',  emoji: '💬' },
    { value: 'automation',     label: 'Automation',     emoji: '⚙️'  },
    { value: 'creative',       label: 'Creative',       emoji: '🎨' },
    { value: 'security',       label: 'Security',       emoji: '🛡️'  },
    { value: 'other',          label: 'Other',          emoji: '🔧' },
];

const PROVIDERS = [
    { value: 'openrouter', label: 'OpenRouter'    },
    { value: 'openai',     label: 'OpenAI'        },
    { value: 'anthropic',  label: 'Anthropic'     },
    { value: 'groq',       label: 'Groq'          },
    { value: 'mistral',    label: 'Mistral AI'    },
    { value: 'deepseek',   label: 'DeepSeek'      },
    { value: 'xai',        label: 'xAI / Grok'    },
    { value: 'together',   label: 'Together AI'   },
    { value: 'qiniu',      label: 'Qiniu'          },
    { value: 'ollama',     label: 'Ollama (Local)' },
    { value: 'google',     label: 'Google AI'     },
];

/** Rotating messages shown inside the generation overlay */
const GEN_MESSAGES = [
    '📝  Writing skill code...',
    '🔍  Checking code structure...',
    '⚙️   Running validation tests...',
    '🔄  Auto-correcting any issues...',
    '💾  Preparing to save...',
];

const BOILERPLATE = `// ─── Skales Custom Skill ─────────────────────────────────────────
// Place this file in ~/.skales-data/skills/ or upload it from this page.
'use strict';

module.exports = {
  // ── Required metadata ──────────────────────────────────────────
  name:        "Hello World",
  id:          "hello-world",          // kebab-case, must be unique
  description: "A minimal Skales skill that greets the user.",
  category:    "other",               // productivity | communication | automation | creative | security | other
  icon:        "Wrench",              // Lucide icon name shown in the sidebar + skill list
  version:     "1.0.0",
  author:      "Your Name",

  // ── Optional: sidebar integration ─────────────────────────────
  // Set hasUI: true to add a dedicated page in the sidebar.
  hasUI:     false,
  menuName:  "Hello World",            // Sidebar label  (only when hasUI: true)
  menuRoute: "/custom/hello-world",    // URL path       (only when hasUI: true)

  // ── Main function ──────────────────────────────────────────────
  /**
   * @param {object} input   - Depends on how the skill is invoked (prompt, params, etc.)
   * @param {object} context - Skales context: { dataDir: string, workspacePath: string, settings: object }
   * @returns {Promise<{ success: boolean, result?: any, error?: string }>}
   */
  async execute(input, context) {
    try {
      const name = input?.name ?? "World";
      return { success: true, result: \`Hello, \${name}! This skill is working.\` };
    } catch (err) {
      return { success: false, error: err.message ?? String(err) };
    }
  },
};`;

// ─── Helpers ─────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: SkillCategory }) {
    const found = CATEGORIES.find(c => c.value === cat);
    return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'var(--surface-light)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {found?.emoji} {found?.label ?? cat}
        </span>
    );
}

function StatusBadge({ status }: { status: CustomSkillMeta['status'] }) {
    if (!status || status === 'active') return null;
    if (status === 'error') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                <XCircle size={10} /> broken
            </span>
        );
    }
    if (status === 'generating') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' }}>
                <Loader2 size={10} className="animate-spin" /> generating
            </span>
        );
    }
    return null;
}

// ─── Blocking Overlay ────────────────────────────────────────────────

interface OverlayProps {
    title:   string;
    msgIdx:  number;
    messages: string[];
    result:  { success: boolean; message: string } | null;
}

function GeneratingOverlay({ title, msgIdx, messages, result }: OverlayProps) {
    const { t } = useTranslation();
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="rounded-2xl border p-8 max-w-sm w-full mx-4 text-center space-y-6"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                {!result ? (
                    <>
                        {/* Spinner + title */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))', border: '2px solid rgba(139,92,246,0.4)' }}>
                                    <Sparkles size={24} className="text-purple-400" />
                                </div>
                                <Loader2
                                    size={58}
                                    className="animate-spin absolute inset-0"
                                    style={{ color: 'rgba(139,92,246,0.5)' }}
                                />
                            </div>
                            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                                {title}
                            </h3>
                        </div>

                        {/* Rotating status message */}
                        <div
                            className="px-4 py-3 rounded-xl text-sm font-medium transition-all"
                            style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)', minHeight: 42 }}
                        >
                            {messages[msgIdx % messages.length]}
                        </div>

                        {/* Warning */}
                        <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                            <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
                            {t('skills.skillAI.navWarning')}
                        </p>
                    </>
                ) : (
                    /* Done state — shown briefly before overlay closes */
                    <div className="flex flex-col items-center gap-4">
                        {result.success ? (
                            <CheckCircle2 size={48} className="text-lime-500" />
                        ) : (
                            <AlertTriangle size={48} className="text-yellow-500" />
                        )}
                        <p className="text-sm font-medium leading-relaxed"
                            style={{ color: result.success ? '#84cc16' : '#facc15' }}>
                            {result.message}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function CustomSkillsPage() {
    const { t } = useTranslation();
    // ── Skill list state ──────────────────────────────────────────
    const [skills,      setSkills]      = useState<CustomSkillMeta[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [togglingId,  setTogglingId]  = useState<string | null>(null);
    const [deletingId,  setDeletingId]  = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    // ── Skill AI state ────────────────────────────────────────────
    const [aiName,            setAiName]            = useState('');
    const [aiCategory,        setAiCategory]        = useState<SkillCategory>('productivity');
    const [aiIcon,            setAiIcon]            = useState(DEFAULT_SKILL_ICON);
    const [showIconPicker,    setShowIconPicker]    = useState(false);
    const [showEditIconPicker, setShowEditIconPicker] = useState(false);
    const [aiHasUI,           setAiHasUI]           = useState(false);
    const [aiMenuName,        setAiMenuName]        = useState('');
    const [aiRequiresApiKeys, setAiRequiresApiKeys] = useState(false);
    const [aiProvider,        setAiProvider]        = useState('openrouter');
    const [aiModel,           setAiModel]           = useState('openai/gpt-4o');
    const [aiPrompt,          setAiPrompt]          = useState('');
    const [modelSaved,        setModelSaved]        = useState(false);   // feedback flash

    // ── Restore saved provider/model from localStorage ────────────
    useEffect(() => {
        try {
            const p = localStorage.getItem('skales_skill_ai_provider');
            const m = localStorage.getItem('skales_skill_ai_model');
            if (p) setAiProvider(p);
            if (m) setAiModel(m);
        } catch { /* SSR / storage unavailable */ }
    }, []);

    // ── Generation overlay state ──────────────────────────────────
    const [generating,    setGenerating]    = useState(false);
    const [genMsgIdx,     setGenMsgIdx]     = useState(0);
    const [genResult,     setGenResult]     = useState<{ success: boolean; message: string } | null>(null);
    const [overlayResult, setOverlayResult] = useState<{ success: boolean; message: string } | null>(null);

    // ── Fix state ─────────────────────────────────────────────────
    const [fixingId,   setFixingId]   = useState<string | null>(null);
    const [fixMsgIdx,  setFixMsgIdx]  = useState(0);
    const [fixResult,  setFixResult]  = useState<{ skillId: string; success: boolean; message: string } | null>(null);
    const [fixOverlay, setFixOverlay] = useState<{ success: boolean; message: string } | null>(null);

    // ── Upload state ──────────────────────────────────────────────
    const [dragging,     setDragging]     = useState(false);
    const [uploading,    setUploading]    = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
    const [codeCopied,   setCodeCopied]   = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Edit state ─────────────────────────────────────────────
    const [editingSkill,    setEditingSkill]    = useState<CustomSkillMeta | null>(null);
    const [editName,        setEditName]        = useState('');
    const [editIcon,        setEditIcon]        = useState('');
    const [editCategory,    setEditCategory]    = useState<SkillCategory>('other');
    const [editDescription, setEditDescription] = useState('');
    const [editHasUI,       setEditHasUI]       = useState(false);
    const [editMenuName,    setEditMenuName]    = useState('');
    const [savingEdit,      setSavingEdit]      = useState(false);
    const [regenPrompt,     setRegenPrompt]     = useState('');
    const [regenerating,    setRegenerating]    = useState(false);

    // ── Install sample skills state ────────────────────────────
    const [installingSamples, setInstallingSamples] = useState(false);

    // ── Prevent navigation while generating/fixing ────────────────
    useEffect(() => {
        const busy = generating || !!fixingId;
        if (!busy) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [generating, fixingId]);

    // ── Rotate generation overlay messages ────────────────────────
    useEffect(() => {
        if (!generating) { setGenMsgIdx(0); return; }
        const id = setInterval(() => setGenMsgIdx(i => i + 1), 4000);
        return () => clearInterval(id);
    }, [generating]);

    useEffect(() => {
        if (!fixingId) { setFixMsgIdx(0); return; }
        const id = setInterval(() => setFixMsgIdx(i => i + 1), 4000);
        return () => clearInterval(id);
    }, [fixingId]);

    // ── Fetch skill list ──────────────────────────────────────────
    const fetchSkills = useCallback(async () => {
        try {
            const res = await fetch('/api/custom-skills', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            setSkills(data.skills ?? []);
        } catch { /* ignore */ } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { fetchSkills(); }, [fetchSkills]);

    // ── Toggle skill ──────────────────────────────────────────────
    const handleToggle = async (id: string, current: boolean) => {
        setTogglingId(id);
        try {
            await fetch(`/api/custom-skills?id=${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ enabled: !current }),
            });
            setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !current } : s));
            window.dispatchEvent(new Event('skalesSkillsChanged'));
        } catch { /* ignore */ } finally {
            setTogglingId(null);
        }
    };

    // ── Delete skill ──────────────────────────────────────────────
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await fetch(`/api/custom-skills?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            setSkills(prev => prev.filter(s => s.id !== id));
            window.dispatchEvent(new Event('skalesSkillsChanged'));
        } catch { /* ignore */ } finally {
            setDeletingId(null);
        }
    };

    // ── Export skill as ZIP ───────────────────────────────────────
    const handleExport = async (id: string, name: string) => {
        setExportingId(id);
        setExportError(null);
        try {
            const res = await fetch(`/api/custom-skills/export?skillId=${encodeURIComponent(id)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Export failed' }));
                setExportError(`Export failed: ${err.error ?? res.statusText}`);
                return;
            }
            const blob   = await res.blob();
            const url    = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href  = url;
            anchor.download = `${id}-skill.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            setExportError(`Export error: ${e.message ?? 'Unknown error'}`);
        } finally {
            setExportingId(null);
        }
    };

    // ── Generate skill ────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!aiName.trim() || !aiPrompt.trim()) {
            setGenResult({ success: false, message: 'Please fill in Skill Name and the prompt.' });
            return;
        }
        setGenerating(true);
        setGenResult(null);
        setOverlayResult(null);

        try {
            const res = await fetch('/api/custom-skills/generate', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name:            aiName.trim(),
                    category:        aiCategory,
                    icon:            aiIcon.trim() || DEFAULT_SKILL_ICON,
                    hasUI:           aiHasUI,
                    menuName:        aiHasUI ? (aiMenuName.trim() || aiName.trim()) : undefined,
                    requiresApiKeys: aiRequiresApiKeys,
                    prompt:          aiPrompt.trim(),
                    provider:        aiProvider,
                    model:           aiModel.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                const attemptsStr = data.attempts > 1 ? ` (${data.attempts} attempts)` : '';
                if (data.warning) {
                    // Saved with errors — show warning, keep skill in list with error badge
                    const msg = `⚠️ Skill "${data.skill?.name}" saved but validation failed${attemptsStr}. Use the Fix button to auto-repair it.`;
                    setOverlayResult({ success: false, message: msg });
                    setGenResult({ success: false, message: msg });
                } else {
                    const msg = `✅ Skill "${data.skill?.name}" generated and validated${attemptsStr}!`;
                    setOverlayResult({ success: true, message: msg });
                    setGenResult({ success: true, message: msg });
                    setAiName(''); setAiPrompt(''); setAiMenuName('');
                }
                await fetchSkills();
                window.dispatchEvent(new Event('skalesSkillsChanged'));
            } else {
                const msg = data.error ?? 'Generation failed. Try a different model.';
                setOverlayResult({ success: false, message: `❌ ${msg}` });
                setGenResult({ success: false, message: msg });
            }
        } catch (e: any) {
            const msg = e.message ?? 'Network error';
            setOverlayResult({ success: false, message: `❌ ${msg}` });
            setGenResult({ success: false, message: msg });
        } finally {
            // Show result in overlay for 2s then close
            setTimeout(() => {
                setGenerating(false);
                setOverlayResult(null);
            }, 2000);
        }
    };

    // ── Fix broken skill ──────────────────────────────────────────
    const handleFix = async (skill: CustomSkillMeta) => {
        setFixingId(skill.id);
        setFixResult(null);
        setFixOverlay(null);

        try {
            const res = await fetch('/api/custom-skills/fix', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    skillId:          skill.id,
                    provider:         aiProvider,
                    model:            aiModel.trim(),
                    errorDescription: skill.lastError,
                }),
            });
            const data = await res.json();

            if (data.success) {
                const attemptsStr = data.attempts > 1 ? ` (${data.attempts} attempts)` : '';
                if (data.warning) {
                    const msg = `⚠️ "${skill.name}" still has issues${attemptsStr}. Try a more capable model.`;
                    setFixOverlay({ success: false, message: msg });
                    setFixResult({ skillId: skill.id, success: false, message: msg });
                } else {
                    const msg = `✅ "${skill.name}" fixed and validated${attemptsStr}!`;
                    setFixOverlay({ success: true, message: msg });
                    setFixResult({ skillId: skill.id, success: true, message: msg });
                }
                await fetchSkills();
                window.dispatchEvent(new Event('skalesSkillsChanged'));
            } else {
                const msg = data.error ?? 'Fix failed. Try a different model.';
                setFixOverlay({ success: false, message: `❌ ${msg}` });
                setFixResult({ skillId: skill.id, success: false, message: msg });
            }
        } catch (e: any) {
            const msg = e.message ?? 'Network error';
            setFixOverlay({ success: false, message: `❌ ${msg}` });
            setFixResult({ skillId: skill.id, success: false, message: msg });
        } finally {
            setTimeout(() => {
                setFixingId(null);
                setFixOverlay(null);
            }, 2000);
        }
    };

    // ── File upload ───────────────────────────────────────────────
    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const ext  = file.name.split('.').pop()?.toLowerCase();
        if (!['js', 'ts', 'zip'].includes(ext ?? '')) {
            setUploadResult({ success: false, message: 'Only .js, .ts, or .zip files are accepted.' });
            return;
        }
        setUploading(true);
        setUploadResult(null);
        try {
            // Send as JSON/base64 — avoids multipart parsing issues in Next.js standalone + Electron.
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '');
                reader.onerror   = reject;
                reader.readAsDataURL(file);
            });
            const res  = await fetch('/api/custom-skills/upload', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ filename: file.name, data: base64 }),
            });
            const data = await res.json();
            if (data.success) {
                const installed = data.installed ?? 1;
                setUploadResult({ success: true, message: `✅ ${installed} skill(s) installed from "${file.name}"!` });
                await fetchSkills();
                window.dispatchEvent(new Event('skalesSkillsChanged'));
            } else {
                setUploadResult({ success: false, message: data.error ?? 'Upload failed.' });
            }
        } catch (e: any) {
            setUploadResult({ success: false, message: e.message ?? 'Upload error' });
        } finally {
            setUploading(false);
        }
    };

    const handleCopyBoilerplate = () => {
        const succeed = () => {
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2500);
        };
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(BOILERPLATE).then(succeed).catch(() => {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = BOILERPLATE;
                    ta.style.position = 'fixed';
                    ta.style.opacity  = '0';
                    document.body.appendChild(ta);
                    ta.focus(); ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    succeed();
                } catch { /* silently ignore */ }
            });
        } else {
            try {
                const ta = document.createElement('textarea');
                ta.value = BOILERPLATE;
                ta.style.position = 'fixed';
                ta.style.opacity  = '0';
                document.body.appendChild(ta);
                ta.focus(); ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                succeed();
            } catch { /* silently ignore */ }
        }
    };

    // ── Edit skill metadata ────────────────────────────────────
    const openEdit = (skill: CustomSkillMeta) => {
        setEditingSkill(skill);
        setEditName(skill.name);
        setEditIcon(skill.icon);
        setEditCategory(skill.category);
        setEditDescription(skill.description);
        setEditHasUI(skill.hasUI);
        setEditMenuName(skill.menuName ?? '');
    };

    const handleSaveEdit = async () => {
        if (!editingSkill) return;
        setSavingEdit(true);
        try {
            const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            await fetch(`/api/custom-skills?id=${encodeURIComponent(editingSkill.id)}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name:        editName.trim(),
                    icon:        editIcon.trim() || DEFAULT_SKILL_ICON,
                    category:    editCategory,
                    description: editDescription.trim(),
                    hasUI:       editHasUI,
                    menuName:    editHasUI ? (editMenuName.trim() || editName.trim()) : '',
                    menuRoute:   editHasUI ? `/custom/${slug}` : '',
                }),
            });
            await fetchSkills();
            window.dispatchEvent(new Event('skalesSkillsChanged'));
            setEditingSkill(null);
        } catch { /* ignore */ } finally {
            setSavingEdit(false);
        }
    };

    const [regenError, setRegenError] = useState('');

    const handleRegenerate = async () => {
        if (!editingSkill || !regenPrompt.trim()) return;
        setRegenerating(true);
        setRegenError('');
        try {
            const res = await fetch('/api/custom-skills/generate', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name:            editName.trim(),
                    category:        editCategory,
                    icon:            editIcon.trim() || DEFAULT_SKILL_ICON,
                    hasUI:           editHasUI,
                    menuName:        editHasUI ? (editMenuName.trim() || editName.trim()) : undefined,
                    requiresApiKeys: false,
                    prompt:          regenPrompt.trim(),
                    provider:        aiProvider,
                    model:           aiModel.trim(),
                    existingSkillId: editingSkill.id,   // tells endpoint to edit in-place
                }),
            });
            const data = await res.json();
            if (data.success && data.skill) {
                // Skill was updated in-place — no delete needed
                await fetchSkills();
                window.dispatchEvent(new Event('skalesSkillsChanged'));
                setEditingSkill(null);
                setRegenPrompt('');
            } else {
                setRegenError(data.error || data.warning || 'Generation failed. Check your LLM provider/model settings.');
            }
        } catch (e: any) {
            setRegenError(e.message || 'Network error — please try again.');
        } finally {
            setRegenerating(false);
        }
    };

    // ── Install sample skills ──────────────────────────────────
    const handleInstallSamples = async () => {
        setInstallingSamples(true);
        try {
            // Fetch built-in skill code from project data
            const [galleryRes, quotyRes] = await Promise.all([
                fetch('/api/custom-skills/builtin?skill=gallery'),
                fetch('/api/custom-skills/builtin?skill=quoty'),
            ]);
            const galleryData = galleryRes.ok ? await galleryRes.json() : null;
            const quotyData   = quotyRes.ok   ? await quotyRes.json()   : null;

            let installed = 0;
            if (galleryData?.success) installed++;
            if (quotyData?.success)   installed++;

            if (installed > 0) {
                await fetchSkills();
                window.dispatchEvent(new Event('skalesSkillsChanged'));
            }
        } catch { /* ignore */ } finally {
            setInstallingSamples(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────

    const isBusy = generating || !!fixingId;

    return (
        <>
            {/* ── Generating overlay ──────────────────────────── */}
            {generating && (
                <GeneratingOverlay
                    title={t('skills.status.working')}
                    msgIdx={genMsgIdx}
                    messages={GEN_MESSAGES}
                    result={overlayResult}
                />
            )}

            {/* ── Fix overlay ─────────────────────────────────── */}
            {fixingId && (
                <GeneratingOverlay
                    title={t('skills.status.repairing')}
                    msgIdx={fixMsgIdx}
                    messages={[
                        '🔬  Analyzing the broken code...',
                        '🛠️   Writing a fix...',
                        '🔍  Validating the repaired skill...',
                        '🔄  Auto-correcting remaining issues...',
                        '💾  Saving the fixed skill...',
                    ]}
                    result={fixOverlay}
                />
            )}

            <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-32"
                style={{ pointerEvents: isBusy ? 'none' : undefined }}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* ── Header ──────────────────────────────────────────── */}
                    <div className="animate-fadeIn">
                        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                            <Puzzle className="text-lime-500" size={24} />
                            {t('skills.title')}
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {t('skills.subtitle')}
                        </p>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        A) SKILL MANAGER
                    ════════════════════════════════════════════════════════ */}
                    <section className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="text-lg">📦</span>
                                {t('skills.installed.title')}
                                {skills.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: 'rgba(132,204,22,0.12)', color: '#84cc16' }}>
                                        {t('skills.installed.activeBadge', { active: skills.filter(s => s.enabled && s.status !== 'error').length, total: skills.length })}
                                    </span>
                                )}
                                {skills.some(s => s.status === 'error') && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                        {t('skills.installed.brokenBadge', { count: skills.filter(s => s.status === 'error').length })}
                                    </span>
                                )}
                            </h2>
                        </div>

                        {loadingList ? (
                            <div className="flex items-center gap-2 py-8 justify-center">
                                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</span>
                            </div>
                        ) : skills.length === 0 ? (
                            <div className="py-10 text-center rounded-xl" style={{ background: 'var(--surface-light)', border: '1px dashed var(--border)' }}>
                                <p className="text-3xl mb-2">🧩</p>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('skills.empty')}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('skills.installed.emptyHint')}</p>
                                <button
                                    onClick={handleInstallSamples}
                                    disabled={installingSamples}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                                >
                                    {installingSamples ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                    {t('skills.installed.installSamples')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {skills.map(skill => {
                                    const isBroken  = skill.status === 'error';
                                    const fixResult_ = fixResult?.skillId === skill.id ? fixResult : null;

                                    return (
                                        <div key={skill.id}>
                                            <div
                                                className="flex items-center gap-4 p-4 rounded-xl border transition-all"
                                                style={{
                                                    background: isBroken
                                                        ? 'rgba(239,68,68,0.04)'
                                                        : skill.enabled
                                                            ? 'rgba(132,204,22,0.04)'
                                                            : 'var(--surface-light)',
                                                    borderColor: isBroken
                                                        ? 'rgba(239,68,68,0.25)'
                                                        : skill.enabled
                                                            ? 'rgba(132,204,22,0.25)'
                                                            : 'var(--border)',
                                                }}>
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        background: isBroken
                                                            ? 'rgba(239,68,68,0.12)'
                                                            : skill.enabled
                                                                ? 'rgba(132,204,22,0.12)'
                                                                : 'var(--background)',
                                                        border: `1px solid ${isBroken
                                                            ? 'rgba(239,68,68,0.3)'
                                                            : skill.enabled
                                                                ? 'rgba(132,204,22,0.25)'
                                                                : 'var(--border)'}`,
                                                        color: isBroken ? '#ef4444' : skill.enabled ? '#84cc16' : 'var(--text-muted)',
                                                    }}>
                                                    <SkillIconDisplay icon={skill.icon} size={20} />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{skill.name}</p>
                                                        <CategoryBadge cat={skill.category} />
                                                        <StatusBadge status={skill.status} />
                                                        {skill.hasUI && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                                {t('skills.installed.hasUI')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                        {isBroken && skill.lastError
                                                            ? skill.lastError
                                                            : skill.description || skill.file}
                                                    </p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        v{skill.version} · by {skill.author}
                                                    </p>
                                                </div>

                                                {/* Fix button — only for broken skills */}
                                                {isBroken && (
                                                    <button
                                                        onClick={() => handleFix(skill)}
                                                        disabled={!!fixingId}
                                                        title={`Auto-fix "${skill.name}" with Skill AI`}
                                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        style={{
                                                            background: 'rgba(139,92,246,0.15)',
                                                            color: '#a78bfa',
                                                            border: '1px solid rgba(139,92,246,0.35)',
                                                        }}
                                                    >
                                                        {fixingId === skill.id
                                                            ? <Loader2 size={13} className="animate-spin" />
                                                            : <Wrench size={13} />
                                                        }
                                                        {t('skills.installed.fix')}
                                                    </button>
                                                )}

                                                {/* Export ZIP */}
                                                <button
                                                    onClick={() => handleExport(skill.id, skill.name)}
                                                    disabled={exportingId === skill.id}
                                                    title={t('skills.installed.exportZipTitle')}
                                                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:bg-lime-500/10"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {exportingId === skill.id
                                                        ? <Loader2  size={16} className="animate-spin" />
                                                        : <Download size={16} className="hover:text-lime-500 transition-colors" />
                                                    }
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(skill)}
                                                    title={t('skills.installed.editTitle')}
                                                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-indigo-500/10"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Pencil size={16} className="hover:text-indigo-400 transition-colors" />
                                                </button>

                                                {/* Toggle */}
                                                <button
                                                    onClick={() => handleToggle(skill.id, skill.enabled)}
                                                    disabled={togglingId === skill.id}
                                                    title={skill.enabled ? t('skills.installed.deactivate') : t('skills.installed.activate')}
                                                    className="flex-shrink-0 disabled:opacity-50"
                                                >
                                                    {togglingId === skill.id
                                                        ? <Loader2    size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                                                        : skill.enabled
                                                            ? <ToggleRight size={28} style={{ color: '#84cc16' }} />
                                                            : <ToggleLeft  size={28} style={{ color: 'var(--text-muted)' }} />
                                                    }
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(skill.id, skill.name)}
                                                    disabled={deletingId === skill.id}
                                                    title={t('skills.deletion.deleteSkill')}
                                                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:bg-red-500/10"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {deletingId === skill.id
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <Trash2  size={16} className="hover:text-red-500 transition-colors" />
                                                    }
                                                </button>
                                            </div>

                                            {/* Inline fix result banner */}
                                            {fixResult_ && (
                                                <div className="mt-1 px-4 py-2 rounded-xl text-xs border"
                                                    style={{
                                                        background: fixResult_.success ? 'rgba(132,204,22,0.08)' : 'rgba(239,68,68,0.07)',
                                                        borderColor: fixResult_.success ? 'rgba(132,204,22,0.3)' : 'rgba(239,68,68,0.3)',
                                                        color: fixResult_.success ? '#84cc16' : '#f87171',
                                                    }}>
                                                    {fixResult_.message}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ════════════════════════════════════════════════════════
                        B) SKILL AI (SELF-PROGRAMMING)
                    ════════════════════════════════════════════════════════ */}
                    <section className="rounded-2xl border overflow-hidden"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {/* Header */}
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-base font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                                <Sparkles size={18} className="text-purple-400" />
                                {t('skills.skillAI.title')}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {t('skills.skillAI.description')}
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* ── SECURITY WARNING ── */}
                            <div className="flex gap-3 p-4 rounded-xl border"
                                style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.35)' }}>
                                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
                                <p className="text-sm leading-relaxed" style={{ color: '#f87171' }}>
                                    <strong>{t('skills.skillAI.warningTitle')}</strong>
                                    {' '}{t('skills.skillAI.warningBody')}
                                </p>
                            </div>

                            {/* ── Metadata form ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Skill Name */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.skillNameRequired')} <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={aiName}
                                        onChange={e => setAiName(e.target.value)}
                                        placeholder={t('skills.form.namePlaceholder')}
                                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Icon Picker */}
                                <div className="relative">
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.iconLabel')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowIconPicker(v => !v)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                        <SkillIconDisplay icon={aiIcon} size={16} />
                                        <span className="text-xs truncate">{aiIcon}</span>
                                        <ChevronDown size={12} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                    {showIconPicker && (
                                        <div className="absolute z-50 mt-1 rounded-xl border p-3 shadow-xl max-h-52 overflow-y-auto"
                                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', width: '280px' }}>
                                            <div className="grid grid-cols-8 gap-1">
                                                {SKILL_ICON_NAMES.map(name => {
                                                    const Comp = ICON_MAP[name];
                                                    if (!Comp) return null;
                                                    return (
                                                        <button key={name} type="button" title={name}
                                                            onClick={() => { setAiIcon(name); setShowIconPicker(false); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                                                            style={{
                                                                background: aiIcon === name ? 'rgba(132,204,22,0.15)' : 'transparent',
                                                                color: aiIcon === name ? '#84cc16' : 'var(--text-muted)',
                                                                border: aiIcon === name ? '1px solid rgba(132,204,22,0.3)' : '1px solid transparent',
                                                            }}>
                                                            <Comp size={15} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.categoryLabel')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={aiCategory}
                                            onChange={e => setAiCategory(e.target.value as SkillCategory)}
                                            className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50 appearance-none pr-8"
                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>

                                {/* Needs Sidebar Menu toggle */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.needsSidebar')}
                                    </label>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setAiHasUI(v => !v)}
                                            className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none"
                                            style={{ background: aiHasUI ? '#84cc16' : 'var(--border)' }}
                                        >
                                            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                                                style={{ transform: aiHasUI ? 'translateX(16px)' : 'translateX(0)' }} />
                                        </button>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {aiHasUI ? t('skills.form.sidebarYes') : t('skills.form.sidebarNo')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Name (conditional) */}
                            {aiHasUI && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.sidebarMenuName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={aiMenuName}
                                        onChange={e => setAiMenuName(e.target.value)}
                                        placeholder={aiName || "My Skill"}
                                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50"
                                        style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            )}

                            {/* Requires API Keys checkbox */}
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    {t('skills.form.requiresApiKeys')}
                                </label>
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                                    style={{ background: 'var(--surface-light)', borderColor: 'var(--border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAiRequiresApiKeys(v => !v)}
                                        className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none"
                                        style={{ background: aiRequiresApiKeys ? '#84cc16' : 'var(--border)' }}
                                    >
                                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                                            style={{ transform: aiRequiresApiKeys ? 'translateX(16px)' : 'translateX(0)' }} />
                                    </button>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {aiRequiresApiKeys
                                            ? t('skills.form.requiresApiKeysYes')
                                            : t('skills.form.requiresApiKeysNo')}
                                    </span>
                                </div>
                            </div>

                            {/* Provider + Model */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.llmProvider')}
                                        <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>{t('skills.form.llmProviderNote')}</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={aiProvider}
                                            onChange={e => setAiProvider(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50 appearance-none pr-8"
                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {t('skills.form.modelId')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiModel}
                                            onChange={e => setAiModel(e.target.value)}
                                            placeholder="openai/gpt-4o"
                                            className="flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50 font-mono"
                                            style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                try {
                                                    localStorage.setItem('skales_skill_ai_provider', aiProvider);
                                                    localStorage.setItem('skales_skill_ai_model', aiModel);
                                                    setModelSaved(true);
                                                    setTimeout(() => setModelSaved(false), 2000);
                                                } catch { /* storage unavailable */ }
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0"
                                            style={{
                                                background: modelSaved ? 'rgba(132,204,22,0.15)' : 'var(--surface-light)',
                                                color: modelSaved ? '#84cc16' : 'var(--text-muted)',
                                                border: `1px solid ${modelSaved ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                            }}
                                            title={t('skills.form.saveDefault')}
                                        >
                                            {modelSaved ? <CheckCheck size={13} /> : <CheckCheck size={13} style={{ opacity: 0.5 }} />}
                                            {modelSaved ? t('skills.form.modelSaved') : t('skills.form.modelSave')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt */}
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    {t('skills.form.promptLabel')} <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    rows={5}
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder={t('skills.form.promptPlaceholder')}
                                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-lime-500/50 resize-y"
                                    style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)', minHeight: 100 }}
                                />
                            </div>

                            {/* Generate result banner */}
                            {genResult && (
                                <div className="px-4 py-3 rounded-xl text-sm border"
                                    style={{
                                        background: genResult.success ? 'rgba(132,204,22,0.08)' : 'rgba(239,68,68,0.07)',
                                        borderColor: genResult.success ? 'rgba(132,204,22,0.3)' : 'rgba(239,68,68,0.3)',
                                        color: genResult.success ? '#84cc16' : '#f87171',
                                    }}>
                                    {genResult.message}
                                </div>
                            )}

                            {/* Generate button */}
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !aiName.trim() || !aiPrompt.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: generating ? 'var(--surface-light)' : 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(99,102,241,0.9))',
                                    color: generating ? 'var(--text-muted)' : 'white',
                                }}
                            >
                                {generating
                                    ? <><Loader2 size={16} className="animate-spin" /> {t('skills.form.generating')}</>
                                    : <><Zap size={16} /> {t('skills.form.generateButton')}</>
                                }
                            </button>
                        </div>
                    </section>

                    {/* ════════════════════════════════════════════════════════
                        C) UPLOAD CUSTOM SKILL
                    ════════════════════════════════════════════════════════ */}
                    <section className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                                <Upload size={18} className="text-lime-500" />
                                {t('skills.upload.title')}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {t('skills.upload.description')}
                            </p>
                        </div>

                        {/* Boilerplate code block */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <Code2 size={13} /> {t('skills.form.boilerplateTemplate')}
                                </p>
                                <button
                                    onClick={handleCopyBoilerplate}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors"
                                    style={{ background: 'var(--surface-light)', color: codeCopied ? '#84cc16' : 'var(--text-muted)', border: '1px solid var(--border)' }}
                                >
                                    {codeCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                                    {codeCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-[11px] leading-relaxed overflow-x-auto p-4 rounded-xl"
                                style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                                <code>{BOILERPLATE}</code>
                            </pre>
                        </div>

                        {/* Drop zone */}
                        <div
                            onDragOver={e  => { e.preventDefault(); setDragging(true);  }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e  => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                            style={{
                                borderColor: dragging ? '#84cc16' : 'var(--border)',
                                background:  dragging ? 'rgba(132,204,22,0.05)' : 'var(--surface-light)',
                            }}
                        >
                            {uploading ? (
                                <Loader2 size={28} className="animate-spin" style={{ color: '#84cc16' }} />
                            ) : (
                                <Upload size={28} style={{ color: dragging ? '#84cc16' : 'var(--text-muted)' }} />
                            )}
                            <div className="text-center">
                                <p className="text-sm font-medium" style={{ color: uploading ? '#84cc16' : 'var(--text-secondary)' }}>
                                    {uploading ? t('skills.upload.installing') : dragging ? t('skills.upload.dropToInstall') : t('skills.upload.clickToUpload')}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    .js · .ts · .zip (max 10 MB)
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".js,.ts,.zip"
                                className="hidden"
                                onChange={e => handleUpload(e.target.files)}
                            />
                        </div>

                        {/* Upload result */}
                        {uploadResult && (
                            <div className="px-4 py-3 rounded-xl text-sm border"
                                style={{
                                    background: uploadResult.success ? 'rgba(132,204,22,0.08)' : 'rgba(239,68,68,0.07)',
                                    borderColor: uploadResult.success ? 'rgba(132,204,22,0.3)' : 'rgba(239,68,68,0.3)',
                                    color: uploadResult.success ? '#84cc16' : '#f87171',
                                }}>
                                {uploadResult.message}
                            </div>
                        )}

                        {/* SDK info footer */}
                        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: 'rgba(132,204,22,0.1)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.2)' }}>
                                Skill SDK
                            </span>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {t('skills.sdk.info')}
                            </p>
                        </div>
                    </section>

                </div>
            </div>

            {/* ── Edit skill modal ────────────────────────────── */}
            {editingSkill && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                    onClick={() => { setEditingSkill(null); setRegenPrompt(''); setRegenError(''); setShowEditIconPicker(false); }}
                >
                    <div
                        className="rounded-2xl border p-6 max-w-md w-full mx-4 space-y-4"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Pencil size={16} className="text-indigo-400" />
                            {t('skills.edit.title')}
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('skills.edit.nameLabel')}</label>
                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500/50"
                                style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('skills.edit.iconLabel')}</label>
                            <button type="button" onClick={() => setShowEditIconPicker(v => !v)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500/50"
                                style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                <SkillIconDisplay icon={editIcon} size={16} />
                                <span className="text-xs truncate">{editIcon}</span>
                                <ChevronDown size={12} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
                            </button>
                            {showEditIconPicker && (
                                <div className="absolute z-50 mt-1 rounded-xl border p-3 shadow-xl max-h-52 overflow-y-auto"
                                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', width: '280px' }}>
                                    <div className="grid grid-cols-8 gap-1">
                                        {SKILL_ICON_NAMES.map(name => {
                                            const Comp = ICON_MAP[name];
                                            if (!Comp) return null;
                                            return (
                                                <button key={name} type="button" title={name}
                                                    onClick={() => { setEditIcon(name); setShowEditIconPicker(false); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                                                    style={{
                                                        background: editIcon === name ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                        color: editIcon === name ? '#818cf8' : 'var(--text-muted)',
                                                        border: editIcon === name ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                                    }}>
                                                    <Comp size={15} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('skills.edit.descriptionLabel')}</label>
                            <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500/50"
                                style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('skills.edit.categoryLabel')}</label>
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value as SkillCategory)}
                                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500/50 appearance-none"
                                style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setEditHasUI(v => !v)}
                                className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors"
                                style={{ background: editHasUI ? '#818cf8' : 'var(--border)' }}>
                                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                                    style={{ transform: editHasUI ? 'translateX(16px)' : 'translateX(0)' }} />
                            </button>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {editHasUI ? t('skills.edit.hasSidebarYes') : t('skills.edit.hasSidebarNo')}
                            </span>
                        </div>

                        {editHasUI && (
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('skills.edit.menuNameLabel')}</label>
                                <input type="text" value={editMenuName} onChange={e => setEditMenuName(e.target.value)}
                                    placeholder={editName}
                                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500/50"
                                    style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                            </div>
                        )}

                        {/* Re-generate section */}
                        <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                            <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                <RefreshCw size={11} className="text-purple-400" /> {t('skills.form.regenLabel')}
                            </label>
                            <textarea
                                value={regenPrompt}
                                onChange={e => setRegenPrompt(e.target.value)}
                                placeholder={t('skills.form.regenPlaceholder')}
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-purple-500/50 resize-none"
                                style={{ background: 'var(--surface-light)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating || !regenPrompt.trim()}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                                {regenerating ? <><Loader2 size={12} className="animate-spin" /> {t('skills.form.regenerating')}</> : <><Sparkles size={12} /> {t('skills.form.regenButton')}</>}
                            </button>
                            {regenError && (
                                <p className="text-[10px] mt-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    {regenError}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setEditingSkill(null); setRegenPrompt(''); }}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{ background: 'var(--surface-light)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                {t('skills.edit.cancelButton')}
                            </button>
                            <button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                                {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                                {t('skills.edit.saveButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Error Modal */}
            {exportError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-400">Export Failed</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {exportError}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setExportError(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
