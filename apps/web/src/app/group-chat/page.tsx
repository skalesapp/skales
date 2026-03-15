'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Users, Settings, Square, Plus, Download, AlertCircle,
    Loader2, ChevronRight, MessageSquare,
} from 'lucide-react';
import { loadGroupChatConfig } from '@/actions/skills';
import type { GroupChatConfig } from '@/actions/skills';
import type { GroupChatEvent } from '@/skills/group-chat/group-chat-engine';
import { useTranslation } from '@/lib/i18n';

// ─── Participant Color Palette ─────────────────────────────────
// A=lime, B=blue, C=orange, D=purple, E=pink

const PARTICIPANT_COLORS = [
    {
        bubble: 'bg-lime-50 border-lime-300 dark:bg-lime-500/10 dark:border-lime-500/30',
        badge: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400',
        name: 'text-lime-700 dark:text-lime-400',
        dot: 'bg-lime-500 dark:bg-lime-400',
        thinking: 'border-lime-400 dark:border-lime-500/40',
    },
    {
        bubble: 'bg-blue-50 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        name: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-500 dark:bg-blue-400',
        thinking: 'border-blue-400 dark:border-blue-500/40',
    },
    {
        bubble: 'bg-orange-50 border-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
        name: 'text-orange-700 dark:text-orange-400',
        dot: 'bg-orange-500 dark:bg-orange-400',
        thinking: 'border-orange-400 dark:border-orange-500/40',
    },
    {
        bubble: 'bg-purple-50 border-purple-300 dark:bg-purple-500/10 dark:border-purple-500/30',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        name: 'text-purple-700 dark:text-purple-400',
        dot: 'bg-purple-500 dark:bg-purple-400',
        thinking: 'border-purple-400 dark:border-purple-500/40',
    },
    {
        bubble: 'bg-pink-50 border-pink-300 dark:bg-pink-500/10 dark:border-pink-500/30',
        badge: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
        name: 'text-pink-700 dark:text-pink-400',
        dot: 'bg-pink-500 dark:bg-pink-400',
        thinking: 'border-pink-400 dark:border-pink-500/40',
    },
];

// ─── Types ────────────────────────────────────────────────────

type MessageStatus = 'thinking' | 'done' | 'error';

interface Message {
    id: string;
    type: 'response' | 'error' | 'round_label' | 'summary' | 'summary_thinking';
    round?: number;
    participantIndex?: number;
    participantName?: string;
    content?: string;
    model?: string;
    provider?: string;
    status: MessageStatus;
    error?: string;
}

interface ProgressState {
    active: boolean;
    currentRound: number;
    totalRounds: number;
    currentParticipantName: string;
}

// ─── Component ───────────────────────────────────────────────

export default function GroupChatPage() {
    const { t } = useTranslation();
    const [config, setConfig] = useState<GroupChatConfig | null>(null);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [progress, setProgress] = useState<ProgressState | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    const [discussionQuestion, setDiscussionQuestion] = useState('');

    const abortRef = useRef<AbortController | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load config on mount
    useEffect(() => {
        loadGroupChatConfig().then(setConfig);
        fetch('/api/telemetry/ping?event=feature_used&feature=group_chat').catch(() => {});
    }, []);

    // Auto-scroll to bottom as messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, progress]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [question]);

    const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
        setMessages(prev => [...prev, { ...msg, id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)) }]);
    }, []);

    const updateLastThinking = useCallback((participantIndex: number, update: Partial<Message>) => {
        setMessages(prev => {
            const idx = [...prev].reverse().findIndex(
                m => m.type === 'response' && m.participantIndex === participantIndex && m.status === 'thinking'
            );
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            const updated = [...prev];
            updated[realIdx] = { ...updated[realIdx], ...update };
            return updated;
        });
    }, []);

    const handleStart = async () => {
        if (!question.trim() || !config || isRunning) return;

        const q = question.trim();
        setDiscussionQuestion(q);
        setMessages([]);
        setHasRun(true);
        setIsRunning(true);
        setQuestion('');

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const resp = await fetch('/api/group-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: q, config }),
                signal: controller.signal,
            });

            if (!resp.ok || !resp.body) {
                addMessage({ type: 'error', status: 'error', error: `Server error: ${resp.status}` });
                setIsRunning(false);
                return;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const raw = line.slice(6).trim();
                    if (!raw) continue;

                    let event: GroupChatEvent;
                    try { event = JSON.parse(raw); } catch { continue; }

                    handleEvent(event, config);
                }
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                addMessage({ type: 'error', status: 'error', error: err?.message || 'Connection error' });
            }
        } finally {
            setIsRunning(false);
            setProgress(null);
            abortRef.current = null;
        }
    };

    const handleEvent = (event: GroupChatEvent, cfg: GroupChatConfig) => {
        switch (event.type) {
            case 'start':
                // Nothing to render — progress will appear on first 'thinking'
                break;

            case 'thinking':
                setProgress({
                    active: true,
                    currentRound: event.round || 1,
                    totalRounds: event.totalRounds || cfg.rounds,
                    currentParticipantName: event.participantName || '',
                });
                // Add a placeholder bubble
                addMessage({
                    type: 'response',
                    round: event.round,
                    participantIndex: event.participantIndex,
                    participantName: event.participantName,
                    status: 'thinking',
                    content: '',
                });
                break;

            case 'response':
                // Update the thinking placeholder with the actual response
                updateLastThinking(event.participantIndex!, {
                    content: event.content,
                    model: event.model,
                    provider: event.provider,
                    status: 'done',
                });
                break;

            case 'error':
                if (event.participantIndex !== undefined) {
                    // Participant-level error — update their bubble
                    updateLastThinking(event.participantIndex, {
                        status: 'error',
                        error: event.error,
                        content: '',
                    });
                } else {
                    // General error
                    addMessage({ type: 'error', status: 'error', error: event.error });
                }
                break;

            case 'round_complete':
                // Add visual round separator (except after last round)
                if ((event.round || 0) < (event.totalRounds || cfg.rounds)) {
                    addMessage({
                        type: 'round_label',
                        round: (event.round || 0) + 1,
                        status: 'done',
                    });
                }
                break;

            case 'summary_thinking':
                setProgress(prev => prev ? { ...prev, currentParticipantName: 'Summary' } : null);
                addMessage({ type: 'summary_thinking', status: 'thinking' });
                break;

            case 'summary':
                setMessages(prev => {
                    const idx = [...prev].reverse().findIndex(m => m.type === 'summary_thinking');
                    if (idx === -1) return prev;
                    const realIdx = prev.length - 1 - idx;
                    const updated = [...prev];
                    updated[realIdx] = {
                        ...updated[realIdx],
                        type: 'summary',
                        content: event.content,
                        model: event.model,
                        provider: event.provider,
                        status: 'done',
                    };
                    return updated;
                });
                break;

            case 'abort':
                addMessage({ type: 'error', status: 'error', error: 'Discussion was stopped.' });
                break;

            case 'done':
                setProgress(null);
                break;
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
    };

    const handleNewDiscussion = () => {
        setMessages([]);
        setHasRun(false);
        setDiscussionQuestion('');
        setProgress(null);
    };

    const handleExport = () => {
        if (messages.length === 0) return;

        const lines: string[] = [
            `# Group Chat Discussion`,
            ``,
            `**Topic:** ${discussionQuestion}`,
            `**Date:** ${new Date().toLocaleString()}`,
            `**Participants:** ${config?.participants.map(p => p.name).join(', ')}`,
            `**Rounds:** ${config?.rounds}`,
            ``,
            `---`,
            ``,
        ];

        let currentRound = 1;
        lines.push(`## Round ${currentRound}`, ``);

        for (const msg of messages) {
            if (msg.type === 'round_label') {
                currentRound = msg.round || currentRound;
                lines.push(``, `## Round ${currentRound}`, ``);
            } else if (msg.type === 'response' && msg.status === 'done' && msg.content) {
                const model = msg.model ? ` *(${msg.provider}/${msg.model})*` : '';
                lines.push(`### ${msg.participantName}${model}`, ``, msg.content, ``);
            } else if (msg.type === 'summary' && msg.content) {
                lines.push(``, `---`, ``, `## Summary`, ``, msg.content, ``);
            }
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `group-chat-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleStart();
        }
    };

    if (!config) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="animate-spin text-lime-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ minHeight: '100%' }}>

            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-md shadow-lime-500/20">
                        <Users size={16} className="text-black" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-sm">Group Chat</h1>
                        <p className="text-[10px] text-text-secondary">
                            {config.participants.length} participants · {config.rounds} rounds · {config.language}
                        </p>
                    </div>
                </div>
                <Link
                    href="/group-chat/settings"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-light"
                >
                    <Settings size={15} />
                    Configure
                </Link>
            </div>

            {/* No-history banner */}
            <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-300 dark:bg-yellow-500/10 dark:border-yellow-500/20 px-6 py-2 text-xs text-amber-800 dark:text-yellow-300 shrink-0">
                <AlertCircle size={13} />
                Discussions are not saved. Export as Markdown if you want to keep a copy.
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

                {/* Empty state */}
                {!hasRun && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
                            <MessageSquare size={28} className="text-text-muted" />
                        </div>
                        <div>
                            <p className="font-medium">Start a group discussion</p>
                            <p className="text-sm text-text-secondary mt-1">
                                Ask a question below and {config.participants.length} AI personas will debate it across {config.rounds} rounds.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                            {config.participants.map((p, i) => {
                                const colors = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                                return (
                                    <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                                        {p.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Discussion question header */}
                {hasRun && discussionQuestion && (
                    <div className="bg-surface border border-border rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1">Topic</p>
                        <p className="text-sm font-medium">{discussionQuestion}</p>
                    </div>
                )}

                {/* Round 1 label (implicit) */}
                {hasRun && messages.length > 0 && messages[0].type !== 'round_label' && (
                    <RoundLabel round={1} />
                )}

                {/* Messages */}
                {messages.map(msg => {
                    if (msg.type === 'round_label') {
                        return <RoundLabel key={msg.id} round={msg.round || 1} />;
                    }
                    if (msg.type === 'summary' || msg.type === 'summary_thinking') {
                        return <SummaryBubble key={msg.id} msg={msg} />;
                    }
                    if (msg.type === 'error') {
                        return <ErrorBubble key={msg.id} msg={msg} />;
                    }
                    if (msg.type === 'response') {
                        const colors = PARTICIPANT_COLORS[(msg.participantIndex ?? 0) % PARTICIPANT_COLORS.length];
                        return (
                            <ParticipantBubble
                                key={msg.id}
                                msg={msg}
                                colors={colors}
                                participants={config.participants}
                            />
                        );
                    }
                    return null;
                })}

                {/* Progress indicator */}
                {progress && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Loader2 size={13} className="animate-spin text-lime-500" />
                        Round {progress.currentRound}/{progress.totalRounds} · {progress.currentParticipantName} is thinking...
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border px-6 py-4 shrink-0 bg-surface">

                {/* Action bar (shown after first discussion) */}
                {hasRun && !isRunning && (
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleNewDiscussion}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-foreground hover:bg-surface-light transition-all border border-border"
                        >
                            <Plus size={13} />
                            New Discussion
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-foreground hover:bg-surface-light transition-all border border-border"
                        >
                            <Download size={13} />
                            Export .md
                        </button>
                    </div>
                )}

                {/* Input row */}
                <div className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isRunning}
                        placeholder={isRunning ? t('groupChat.input.inProgress') : t('groupChat.input.placeholder')}
                        rows={1}
                        className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-lime-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    {isRunning ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium transition-all"
                        >
                            <Square size={15} />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={!question.trim()}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-lime-500/20"
                        >
                            <ChevronRight size={16} />
                            Discuss
                        </button>
                    )}
                </div>

                <p className="text-[11px] text-text-muted mt-2">
                    Press Enter to start · Shift+Enter for new line · {config.participants.length} participants × {config.rounds} rounds = {config.participants.length * config.rounds + 1} API calls
                </p>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────

function RoundLabel({ round }: { round: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted px-2">
                Round {round}
            </span>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function ParticipantBubble({
    msg,
    colors,
    participants,
}: {
    msg: Message;
    colors: typeof PARTICIPANT_COLORS[0];
    participants: GroupChatConfig['participants'];
}) {
    const participant = participants[msg.participantIndex ?? 0];

    return (
        <div className={`border rounded-2xl px-5 py-4 space-y-2 ${colors.bubble} ${msg.status === 'thinking' ? 'opacity-70' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${colors.name}`}>
                    {msg.participantName || participant?.name}
                </span>
                <div className="flex items-center gap-2">
                    {msg.model && (
                        <span className="text-[10px] text-text-muted font-mono">
                            {msg.model}
                        </span>
                    )}
                    {msg.status === 'thinking' && (
                        <div className="flex gap-1 items-center">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '0ms' }} />
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '150ms' }} />
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                    {msg.status === 'error' && (
                        <AlertCircle size={14} className="text-red-400" />
                    )}
                </div>
            </div>

            {/* Content */}
            {msg.status === 'done' && msg.content && (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            )}
            {msg.status === 'error' && (
                <p className="text-sm text-red-400">{msg.error || 'Failed to get response.'}</p>
            )}
        </div>
    );
}

function SummaryBubble({ msg }: { msg: Message }) {
    return (
        <div className="border border-lime-300 bg-lime-50 dark:border-lime-500/20 dark:bg-lime-500/5 rounded-2xl px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-lime-700 dark:text-lime-400">Discussion Summary</span>
                {msg.status === 'thinking' && (
                    <Loader2 size={14} className="animate-spin text-lime-600 dark:text-lime-400" />
                )}
                {msg.model && (
                    <span className="text-[10px] text-text-muted font-mono">{msg.model}</span>
                )}
            </div>
            {msg.status === 'done' && msg.content && (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            )}
        </div>
    );
}

function ErrorBubble({ msg }: { msg: Message }) {
    return (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{msg.error || 'An error occurred.'}</span>
        </div>
    );
}
