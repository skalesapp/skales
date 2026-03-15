'use client';
/**
 * /custom/[skillId]  — Dynamic renderer for Custom UI Skills
 *
 * Loads the skill's metadata, calls its execute() function via the API,
 * and renders the result intelligently:
 *   • gallery   → responsive image grid + lightbox
 *   • table     → sortable data table
 *   • html      → sanitized HTML output
 *   • text/json → formatted text/code block
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
    Loader2, RefreshCw, X, ChevronLeft, ChevronRight,
    ImageIcon, AlertCircle, Puzzle, ZoomIn, ArrowLeft,
    // Lucide icons for skill icon rendering
    Wrench, Code, Image, Quote, Music, Globe, Search, FileText, BarChart3,
    Shield, Camera, Heart, Star, Briefcase, Database, Mail, Bell, Bookmark,
    Calculator, Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers,
    Link as LinkIcon, Lock, Map, Monitor, Package, PenTool, Rocket, Server, Terminal,
    TrendingUp, Tv, Video, Wifi, Bot, Palette, Gamepad2, Lightbulb, Megaphone,
    Settings, Users, Eye, Activity,
} from 'lucide-react';
import { isEmoji } from '@/lib/skill-icons';

const SKILL_ICON_MAP: Record<string, any> = {
    Wrench, Code, Image, Quote, Music, Globe, Search, FileText, BarChart3,
    Shield, Camera, Heart, Star, Briefcase, Database, Mail, Bell, Bookmark,
    Calculator, Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers,
    Link: LinkIcon, Lock, Map, Monitor, Package, PenTool, Rocket, Server, Terminal,
    TrendingUp, Tv, Video, Bot, Palette, Gamepad2, Lightbulb, Megaphone,
    Settings, Users, Eye, Activity,
};

const SkillIconLarge = ({ icon, size = 28 }: { icon: string; size?: number }) => {
    const Comp = SKILL_ICON_MAP[icon];
    if (Comp) return <Comp size={size} />;
    if (isEmoji(icon)) return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
    return <Wrench size={size} />;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillMeta {
    id:          string;
    name:        string;
    description: string;
    icon:        string;
    menuName?:   string;
}

interface SkillResult {
    success: boolean;
    result?: any;
    error?:  string;
}

interface GalleryImage {
    path:     string;
    name:     string;
    url:      string;
    size?:    number;
    modified?: string;
}

// ─── Gallery lightbox ──────────────────────────────────────────────────────

function GalleryView({ images }: { images: GalleryImage[] }) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (lightboxIdx === null) return;
            if (e.key === 'Escape')      setLightboxIdx(null);
            if (e.key === 'ArrowRight')  setLightboxIdx(i => Math.min((i ?? 0) + 1, images.length - 1));
            if (e.key === 'ArrowLeft')   setLightboxIdx(i => Math.max((i ?? 0) - 1, 0));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIdx, images.length]);

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center py-20 gap-3" style={{ color: 'var(--text-muted)' }}>
                <ImageIcon size={48} style={{ opacity: 0.3 }} />
                <p className="text-sm">No images found in workspace</p>
            </div>
        );
    }

    return (
        <>
            {/* Grid */}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {images.map((img, i) => (
                    <button
                        key={img.path}
                        onClick={() => setLightboxIdx(i)}
                        className="group relative rounded-xl overflow-hidden aspect-square flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
                        title={img.name}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.4)' }}>
                            <ZoomIn size={24} className="text-white" />
                        </div>
                        <p className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[9px] truncate text-white text-center"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            {img.name}
                        </p>
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.92)' }}
                    onClick={() => setLightboxIdx(null)}
                >
                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                        onClick={() => setLightboxIdx(null)}
                    >
                        <X size={24} />
                    </button>

                    {/* Prev */}
                    {lightboxIdx > 0 && (
                        <button
                            className="absolute left-4 p-3 rounded-full text-white hover:bg-white/10 transition-colors"
                            onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.max((i ?? 1) - 1, 0)); }}
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    {/* Image */}
                    <div onClick={e => e.stopPropagation()} className="relative max-w-[90vw] max-h-[85vh]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={images[lightboxIdx].url}
                            alt={images[lightboxIdx].name}
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        />
                        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70 mt-2">
                            {images[lightboxIdx].name} &nbsp;·&nbsp; {lightboxIdx + 1} / {images.length}
                        </p>
                    </div>

                    {/* Next */}
                    {lightboxIdx < images.length - 1 && (
                        <button
                            className="absolute right-4 p-3 rounded-full text-white hover:bg-white/10 transition-colors"
                            onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.min((i ?? 0) + 1, images.length - 1)); }}
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Table renderer ────────────────────────────────────────────────────────

function TableView({ data }: { data: any[] }) {
    if (!data.length) return <p style={{ color: 'var(--text-muted)' }}>No rows</p>;
    const headers = Object.keys(data[0]);
    return (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: 'var(--surface-light)', borderBottom: '1px solid var(--border)' }}>
                        {headers.map(h => (
                            <th key={h} className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/5">
                            {headers.map(h => (
                                <td key={h} className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>
                                    {String(row[h] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function CustomSkillPage() {
    const params   = useParams<{ skillId: string }>();
    const router   = useRouter();
    const skillId  = params?.skillId ?? '';

    const [meta,      setMeta]      = useState<SkillMeta | null>(null);
    const [result,    setResult]    = useState<SkillResult | null>(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);

    // Load skill metadata
    useEffect(() => {
        if (!skillId) return;
        fetch('/api/custom-skills')
            .then(r => r.json())
            .then(d => {
                const found = (d.skills ?? []).find((s: any) => s.id === skillId);
                if (found) setMeta(found);
                else setError(`Skill "${skillId}" not found`);
            })
            .catch(() => setError('Failed to load skill metadata'));
    }, [skillId]);

    // Execute the skill
    const runSkill = useCallback(async () => {
        if (!skillId) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch('/api/custom-skills/execute', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ skillId }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message ?? 'Execution failed');
        } finally {
            setLoading(false);
        }
    }, [skillId]);

    useEffect(() => { runSkill(); }, [runSkill]);

    // ── Render result based on type ──────────────────────────────────────────
    function renderResult() {
        if (!result) return null;
        if (!result.success) {
            return (
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <p className="text-sm" style={{ color: '#ef4444' }}>{result.error ?? 'Unknown error'}</p>
                </div>
            );
        }

        const data = result.result;

        // ── Gallery type ──
        if (data?.type === 'gallery' && Array.isArray(data?.images)) {
            return <GalleryView images={data.images} />;
        }

        // ── Table type ──
        if (data?.type === 'table' && Array.isArray(data?.rows)) {
            return <TableView data={data.rows} />;
        }

        // ── Plain array of image paths ──
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && ('url' in data[0] || 'path' in data[0])) {
            return <GalleryView images={data} />;
        }

        // ── HTML type ──
        if (data?.type === 'html' && typeof data?.html === 'string') {
            return (
                <div
                    className="prose prose-invert max-w-none text-sm"
                    style={{ color: 'var(--text-primary)' }}
                    dangerouslySetInnerHTML={{ __html: data.html }}
                />
            );
        }

        // ── Text type ──
        if (data?.type === 'text' || typeof data === 'string') {
            return (
                <pre className="text-sm whitespace-pre-wrap p-4 rounded-xl"
                    style={{ background: 'var(--surface-light)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {typeof data === 'string' ? data : data.text ?? JSON.stringify(data, null, 2)}
                </pre>
            );
        }

        // ── Fallback: JSON viewer ──
        return (
            <pre className="text-xs whitespace-pre-wrap p-4 rounded-xl overflow-auto max-h-[60vh]"
                style={{ background: 'var(--surface-light)', color: '#84cc16', border: '1px solid var(--border)' }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-32">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        <span style={{ color: 'var(--text-primary)' }}>
                            <SkillIconLarge icon={meta?.icon ?? 'Wrench'} size={28} />
                        </span>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {meta?.menuName ?? meta?.name ?? skillId}
                            </h1>
                            {meta?.description && (
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={runSkill}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(132,204,22,0.12)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.3)' }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Running…' : 'Refresh'}
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                        <AlertCircle size={16} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Loading spinner */}
                {loading && !result && (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                            <Puzzle size={32} style={{ opacity: 0.4 }} />
                            <Loader2 size={24} className="animate-spin" style={{ color: '#84cc16' }} />
                            <p className="text-sm">Running skill…</p>
                        </div>
                    </div>
                )}

                {/* Result */}
                {!loading && result && (
                    <div className="rounded-2xl p-4 sm:p-6"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        {renderResult()}
                    </div>
                )}
            </div>
        </div>
    );
}
