'use client';

import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import {
    Send, User, AlertCircle,
    Paperclip, Slash, X, Plus, MessageCircle,
    Copy, Check, Trash2, Wrench, FolderPlus, FileText,
    Terminal, Globe, ListTodo, Brain, Loader2, CheckCircle,
    XCircle, ChevronDown, ChevronRight, Bot, Users, ExternalLink, Clock,
    ImageIcon, Video, Sparkles, FileSearch, ChevronUp, Mic, MicOff, PhoneOff, Zap,
} from 'lucide-react';
import {
    loadSettings, createSession, loadSession,
    saveSession, listSessions, listSessionsByAgent, deleteSession,
    type ChatMessage, type Provider
} from '@/actions/chat';
import Markdown from '@/components/Markdown';
import { agentDecide, agentExecute, type ToolResult, type ToolCall } from '@/actions/orchestrator';
import { listAgents, type AgentDefinition } from '@/actions/agents';
import { getTelegramInbox, type TelegramInboxMessage } from '@/actions/telegram';
import { extractMemoriesFromInteraction, loadHuman } from '@/actions/identity';
import { getActiveSkills, generateImage, startVideoGeneration, pollVideoGeneration } from '@/actions/skills';
import { getActiveSessionId, setActiveSessionId } from '@/actions/chat';
import { extractPdfText, savePdfToWorkspace } from '@/actions/pdf-extract';
import { analyzeTaskComplexity } from '@/actions/orchestrator';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';


const Icon = ({ icon: I, ...props }: { icon: any;[key: string]: any }) => {
    const Component = I;
    return <Component {...props} />;
};

export const dynamic = 'force-dynamic';

// Chat message type with tool results
interface DisplayMessage {
    role: 'user' | 'assistant' | 'system' | 'tool-status' | 'tool';
    content: string;
    imageUrl?: string;       // for pasted/attached images
    toolResults?: ToolResult[];
    toolCalls?: ToolCall[];
    toolCallId?: string;
    toolsExecuting?: string[];
    tokensUsed?: number;
    model?: string;
    source?: 'browser' | 'telegram' | 'buddy' | 'dashboard';
    telegramUser?: string;
    timestamp?: number;      // ms since epoch - used for chronological sorting
    memoriesRecalled?: number; // > 0 → show pulsing recall indicator briefly
    isApprovalResult?: boolean; // true → render as plain text, not inside "Reasoning Process" collapse
}

const SLASH_COMMAND_KEYS = [
    'clear', 'persona', 'model', 'help', 'new', 'sessions',
    'tools', 'workspace', 'tasks', 'stop', 'killswitch',
] as const;
const getSlashCommands = (t: (key: string) => string) =>
    SLASH_COMMAND_KEYS.map(key => ({
        cmd: `/${key}`,
        desc: t(`chat.slashCommands.${key}`),
    }));

const TOOL_ICONS: Record<string, any> = {
    'create_folder': FolderPlus,
    'list_files': FileText,
    'read_file': FileText,
    'write_file': FileText,
    'delete_file': Trash2,
    'execute_command': Terminal,
    'fetch_web_page': Globe,
    'extract_web_text': Globe,
    'get_workspace_info': Brain,
    'get_system_info': Brain,
    'create_task': ListTodo,
    'list_tasks': ListTodo,
    'delete_task': Trash2,
};

const extractImageUrls = (text: string) => {
    if (!text) return [];
    // Match http/https URLs ending in image extensions, ignoring query params for the extension check
    const regex = /(https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s<>"']*)?)/gi;
    return text.match(regex) || [];
};

// Extract non-image URLs from text for OG preview
const extractPlainUrls = (text: string): string[] => {
    if (!text) return [];
    const all = text.match(/https?:\/\/[^\s<>"'`\)]+/gi) || [];
    const imageExt = /\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|mov)(\?|$)/i;
    return all.filter(u => !imageExt.test(u));
};

// ── Link OG Preview card ──────────────────────────────────────
// Shown when the assistant's message contains exactly ONE plain URL.
function LinkPreview({ url }: { url: string }) {
    const [meta, setMeta] = useState<{
        title?: string | null;
        description?: string | null;
        image?: string | null;
        siteName?: string | null;
        favicon?: string | null;
    } | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/og?url=${encodeURIComponent(url)}`)
            .then(r => r.json())
            .then(d => {
                if (!cancelled) {
                    if (d.error || (!d.title && !d.description && !d.image)) setFailed(true);
                    else setMeta(d);
                }
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [url]);

    if (failed || !meta) return null;

    let domain = '';
    try { domain = new URL(url).hostname.replace('www.', ''); } catch { }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex gap-3 mt-3 rounded-xl overflow-hidden no-underline transition-all hover:opacity-90"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {meta.image && (
                <img src={meta.image} alt={meta.title || ''} onError={e => (e.currentTarget.style.display = 'none')}
                    className="w-24 h-20 object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 p-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                    {meta.favicon && <img src={meta.favicon} alt="" className="w-4 h-4 rounded flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />}
                    <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                        {meta.siteName || domain}
                    </span>
                </div>
                {meta.title && (
                    <p className="text-xs font-semibold leading-tight line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                        {meta.title}
                    </p>
                )}
                {meta.description && (
                    <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {meta.description}
                    </p>
                )}
            </div>
        </a>
    );
}

const SESSION_DISPLAY_LIMIT = 5;

// Generate a human-readable display message for a tool result
function generateDisplayMessage(toolName: string, result: any, success: boolean): string {
    if (!success) {
        return `❌ ${toolName.replace(/_/g, ' ')}: ${result?.error || 'Failed'}`;
    }
    switch (toolName) {
        case 'create_folder': return `📁 Folder created: \`${result?.path || ''}\``;
        case 'list_files': {
            const count = result?.files?.length ?? 0;
            return `📂 Listed ${count} item${count !== 1 ? 's' : ''}`;
        }
        case 'read_file': return `📄 Read file: \`${result?.path || ''}\``;
        case 'write_file': return `📝 File written: \`${result?.path || ''}\``;
        case 'delete_file': return `🗑️ Deleted: \`${result?.path || ''}\``;
        case 'execute_command': return `⚡ Command executed${result?.stdout ? `: ${result.stdout.slice(0, 100)}` : ''}`;
        case 'fetch_web_page': return `🌐 Fetched webpage`;
        case 'extract_web_text': return `🌐 Extracted web text`;
        case 'get_workspace_info': return `🏠 Workspace info retrieved`;
        case 'get_system_info': return `💻 System info retrieved`;
        case 'create_task': return `✅ Task created`;
        case 'list_tasks': return `📋 Tasks listed`;
        case 'delete_task': return `🗑️ Task deleted`;
        case 'send_telegram_notification': return `📱 Telegram message sent`;
        case 'schedule_recurring_task': return `📅 Task scheduled`;
        case 'list_scheduled_tasks': return `📅 Scheduled tasks listed`;
        case 'delete_scheduled_task': return `🗑️ Scheduled task deleted`;
        case 'check_capabilities': return `🛡️ Capabilities checked`;
        case 'check_identity': return `🔍 Identity checked`;
        case 'check_system_status': return `⚙️ System status checked`;
        default: return `✅ ${toolName.replace(/_/g, ' ')} completed`;
    }
}

// Format a unix-ms timestamp as "HH:MM", "Yesterday HH:MM", or "DD Mon HH:MM"
function formatMessageTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time;
}

// Helper to Reconstruction DisplayMessages from saved ChatMessages
function reconstructDisplayMessages(savedMessages: ChatMessage[]): DisplayMessage[] {
    const displayMessages: DisplayMessage[] = [];
    let i = 0;
    // Track the source of the last user message so we can infer assistant source
    // (old sessions: tool-use turns may not have source saved, but the user msg does)
    let lastUserSource: 'browser' | 'telegram' | undefined;

    while (i < savedMessages.length) {
        const msg = savedMessages[i];

        if (msg.role === 'user') {
            lastUserSource = (msg as any).source as ('browser' | 'telegram' | undefined);
        }

        if (msg.role === 'assistant') {
            const toolResults: ToolResult[] = [];
            const artificialToolCalls: any[] = [];
            let j = i + 1;
            let foundTools = false;

            // Look ahead for tool messages (consumed by this assistant message)
            while (j < savedMessages.length) {
                const nextMsg = savedMessages[j];
                if (nextMsg.role === 'tool') {
                    foundTools = true;
                    // Try to parse result
                    let result: any = null;
                    try {
                        result = JSON.parse(nextMsg.content || '{}');
                    } catch {
                        result = { output: nextMsg.content };
                    }

                    const toolName = nextMsg.name || 'unknown_tool';
                    // Derive success from the result object if available, otherwise default to true/error check
                    const success = typeof result.success === 'boolean' ? result.success : !result.error;

                    toolResults.push({
                        toolName: toolName,
                        success: success,
                        result: result,
                        displayMessage: nextMsg.display_message || generateDisplayMessage(toolName, result, success)
                    });

                    // If parent didn't have explicit tool_calls (legacy/bug), synthesize them
                    if (!msg.tool_calls || msg.tool_calls.length === 0) {
                        artificialToolCalls.push({
                            id: nextMsg.tool_call_id || 'unknown',
                            type: 'function' as const,
                            function: { name: toolName, arguments: '{}' }
                        });
                    }
                    j++;
                } else {
                    break;
                }
            }

            // Infer source: use saved value, fallback to last user's source for backwards compat
            const inferredSource = (msg as any).source || lastUserSource;

            if (foundTools || (msg.tool_calls && msg.tool_calls.length > 0)) {
                // It's a tool-use turn
                displayMessages.push({
                    role: 'assistant',
                    content: msg.content || '',
                    toolCalls: (msg.tool_calls && msg.tool_calls.length > 0) ? msg.tool_calls : artificialToolCalls,
                    toolResults: toolResults.length > 0 ? toolResults : undefined,
                    source: inferredSource,
                    tokensUsed: (msg as any).tokensUsed,
                    model: (msg as any).model || 'saved-model',
                    timestamp: msg.timestamp,
                });
                i = j;
            } else {
                // Just a thought/text response — restore token count + model from saved fields
                displayMessages.push({
                    role: 'assistant',
                    content: msg.content || '',
                    source: inferredSource,
                    timestamp: msg.timestamp,
                    tokensUsed: (msg as any).tokensUsed,
                    model: (msg as any).model,
                });
                i++;
            }
        } else {
            // User or System
            displayMessages.push({
                role: msg.role as any,
                content: msg.content || '',
                source: (msg as any).source,
                telegramUser: (msg as any).telegramUser,
                timestamp: msg.timestamp,
            });
            i++;
        }
    }
    return displayMessages;
}

// ── Module-level helper: does not depend on any component state ──
function renderToolResults(results: ToolResult[]) {
    return (
        <div className="mt-3 space-y-2">
            {results.map((result, i) => {
                const ToolIcon = TOOL_ICONS[result.toolName] || Wrench;
                return (
                    <div key={i}
                        className="flex items-start gap-2 p-2.5 rounded-xl text-xs"
                        style={{
                            background: result.success
                                ? 'rgba(34, 197, 94, 0.08)'
                                : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${result.success
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'}`,
                        }}>
                        <div className="mt-0.5">
                            {result.success
                                ? <Icon icon={CheckCircle} size={14} className="text-green-500" />
                                : <Icon icon={XCircle} size={14} className="text-red-500" />
                            }
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon icon={ToolIcon} size={12} style={{ color: 'var(--text-muted)' }} />
                                <span className="font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                    {result.toolName.replace(/_/g, ' ')}
                                </span>
                            </div>
                            {result.displayMessage?.startsWith('IMG_GEN:') ? (() => {
                                const raw = result.displayMessage.slice(8);
                                // Format: base64|mimeType|prompt|style|ratio|filename
                                const pipeIdx = raw.indexOf('|');
                                const b64 = raw.slice(0, pipeIdx);
                                const rest = raw.slice(pipeIdx + 1).split('|');
                                const [mime, prompt, style, ratio, filename] = rest;
                                return (
                                    <div className="mt-1 space-y-1.5">
                                        <img
                                            src={`data:${mime};base64,${b64}`}
                                            alt={prompt}
                                            className="max-w-full max-h-80 rounded-xl object-contain border"
                                            style={{ borderColor: 'rgba(132,204,22,0.25)' }}
                                        />
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            💾 Saved: workspace/files/images/{filename} · Style: {style} · {ratio} · Gemini 2.0 Flash
                                        </p>
                                    </div>
                                );
                            })() : result.displayMessage?.startsWith('IMG_FILE:') ? (() => {
                                const raw = result.displayMessage.slice(9);
                                const [relPath, prompt, style, ratio] = raw.split('|');
                                return (
                                    <div className="mt-1 space-y-1.5">
                                        <img
                                            src={`/api/file?path=${encodeURIComponent(relPath)}`}
                                            alt={prompt}
                                            className="max-w-full max-h-80 rounded-xl object-contain border"
                                            style={{ borderColor: 'rgba(132,204,22,0.25)' }}
                                        />
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            💾 Saved: {relPath} · {style} · {ratio}
                                        </p>
                                    </div>
                                );
                            })() : result.displayMessage?.startsWith('VIDEO_FILE:') ? (() => {
                                const raw = result.displayMessage.slice(11);
                                const [relPath, prompt] = raw.split('|');
                                return (
                                    <div className="mt-1 space-y-1.5">
                                        <video
                                            src={`/api/file?path=${encodeURIComponent(relPath)}`}
                                            controls
                                            className="max-w-full max-h-80 rounded-xl border"
                                            style={{ borderColor: 'rgba(132,204,22,0.25)' }}
                                        />
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            💾 Saved: {relPath}
                                        </p>
                                    </div>
                                );
                            })() : result.displayMessage?.startsWith('GIF_URL:') ? (() => {
                                const [gifUrl, gifTitle] = result.displayMessage.slice(8).split('|');
                                const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(gifUrl || '');
                                return (
                                    <div className="mt-1 space-y-1.5">
                                        {isVideo ? (
                                            <video src={gifUrl} autoPlay loop muted playsInline
                                                className="max-w-full max-h-56 rounded-xl object-contain border"
                                                style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                        ) : (
                                            <img src={gifUrl} alt={gifTitle || 'GIF'}
                                                className="max-w-full max-h-56 rounded-xl object-contain border"
                                                style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                        )}
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            🎬 {gifTitle || 'GIF'}
                                        </p>
                                    </div>
                                );
                            })() : (() => {
                                // Render markdown images (e.g. browser screenshots) as actual <img> previews
                                const msg = result.displayMessage || '';
                                const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                                const parts: React.ReactNode[] = [];
                                let lastIndex = 0;
                                let match;
                                let partKey = 0;
                                while ((match = imgRegex.exec(msg)) !== null) {
                                    // Text before the image
                                    if (match.index > lastIndex) {
                                        const textBefore = msg.slice(lastIndex, match.index).trim();
                                        if (textBefore) {
                                            parts.push(
                                                <p key={`t${partKey++}`} className="whitespace-pre-wrap break-words mb-1.5"
                                                    style={{ color: 'var(--text-secondary)' }}>
                                                    {textBefore}
                                                </p>
                                            );
                                        }
                                    }
                                    // The image itself
                                    const [, alt, src] = match;
                                    parts.push(
                                        <div key={`i${partKey++}`} className="mt-1.5 mb-1">
                                            <img
                                                src={src}
                                                alt={alt || 'screenshot'}
                                                className="max-w-full rounded-lg border object-contain"
                                                style={{
                                                    maxHeight: '280px',
                                                    borderColor: 'rgba(132,204,22,0.2)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            {alt && alt !== 'Browser' && (
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>📸 {alt}</p>
                                            )}
                                        </div>
                                    );
                                    lastIndex = match.index + match[0].length;
                                }
                                // Remaining text after last image
                                if (lastIndex < msg.length) {
                                    const textAfter = msg.slice(lastIndex).trim();
                                    if (textAfter) {
                                        parts.push(
                                            <p key={`t${partKey++}`} className="whitespace-pre-wrap break-words mt-1"
                                                style={{ color: 'var(--text-secondary)' }}>
                                                {textAfter}
                                            </p>
                                        );
                                    }
                                }
                                // No image found — plain text
                                if (parts.length === 0) {
                                    return (
                                        <p className="whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
                                            {msg}
                                        </p>
                                    );
                                }
                                return <div>{parts}</div>;
                            })()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── MessageListArea: memoized so it does NOT re-render on every keystroke ──
// Only re-renders when messages/copiedIdx/loading/agentEmoji actually change.
const MessageListArea = memo(function MessageListArea({
    messages,
    copiedIdx,
    loading,
    agentEmoji,
    userEmoji,
    onCopy,
    scrollRef,
}: {
    messages: DisplayMessage[];
    copiedIdx: number | null;
    loading: boolean;
    agentEmoji: string;
    userEmoji: string;
    onCopy: (text: string, idx: number) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
}) {
    const { t } = useTranslation();
    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" role="log" aria-live="polite" aria-label={t('chat.messages')}>
            {messages.map((msg, idx) => {
                if (msg.role === 'tool') return null;
                // Safely extract text — content can be a string or a multimodal array (e.g. image via Telegram)
                const _contentStr = typeof msg.content === 'string'
                    ? msg.content
                    : (Array.isArray(msg.content)
                        ? (msg.content as any[]).filter((c: any) => c.type === 'text').map((c: any) => c.text || '').join('')
                        : '');
                if (msg.role !== 'tool-status' && msg.role !== 'assistant' && !Array.isArray(msg.content) && !_contentStr.trim()) return null;

                if (msg.role === 'tool-status') {
                    return (
                        <div key={idx} className="flex gap-3 max-w-3xl mx-auto animate-fadeIn">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)' }}>
                                {agentEmoji}
                            </div>
                            <div className="rounded-2xl p-3 flex items-center gap-2 text-sm"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                <Icon icon={Loader2} size={14} className="animate-spin text-lime-500" />
                                {msg.content}
                            </div>
                        </div>
                    );
                }

                const hasText = _contentStr.trim() !== '' && _contentStr.trim() !== 'null';
                const hasToolResults = msg.toolResults && msg.toolResults.length > 0;

                if (msg.role === 'assistant' && !hasText && !hasToolResults) return null;

                // Parse file attachment out of user messages for clean display
                // Format: [📄 filename]\n```ext\ncontent\n```\n\nUser question
                const parseUserFileMsg = (content: string) => {
                    const m = content.match(/^\[📄 (.+?)\]\n```[\s\S]*?```\n\n?([\s\S]*)$/);
                    if (m) return { fileName: m[1], question: m[2].trim() };
                    // Also handle "please analyze" auto-message with no user text
                    const m2 = content.match(/^\[📄 (.+?)\]\n```[\s\S]*?```\s*$/);
                    if (m2) return { fileName: m2[1], question: '' };
                    return null;
                };

                return (
                    <div key={idx} className={`flex gap-3 max-w-3xl mx-auto group animate-fadeIn ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
                                style={{
                                    background: msg.role === 'system' ? 'var(--surface-light)' : 'var(--accent-glow)',
                                    border: '1px solid var(--border)'
                                }}>
                                {msg.role === 'system' ? '⚙️' : agentEmoji}
                            </div>
                        )}

                        <div className={`flex flex-col gap-0.5 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`relative max-w-xs sm:max-w-sm md:max-w-[80%] rounded-2xl p-3 sm:p-4 text-[14px] leading-relaxed ${msg.role === 'user'
                                ? 'bg-lime-500 text-black rounded-br-sm font-medium'
                                : msg.role === 'system'
                                    ? 'rounded-bl-sm'
                                    : 'rounded-bl-sm'
                                }`}
                                style={{
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflow: 'hidden',
                                    minWidth: '80px',
                                    ...(msg.role !== 'user' ? {
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                    } : {})
                                }}>
                                {/* User message: show compact file chip instead of raw code */}
                                {msg.role === 'user' && (() => {
                                    const parsed = parseUserFileMsg(typeof msg.content === 'string' ? msg.content : '');
                                    if (parsed) {
                                        return (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg text-xs font-mono"
                                                    style={{ background: 'rgba(0,0,0,0.15)' }}>
                                                    <span>📄</span>
                                                    <span className="font-semibold truncate max-w-[200px]">{parsed.fileName}</span>
                                                </div>
                                                {parsed.question && (
                                                    <div className="mt-1 text-sm">{parsed.question}</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {/* Approval results bypass the Reasoning Process collapse */}
                                {!(msg.role === 'user' && parseUserFileMsg(typeof msg.content === 'string' ? msg.content : '')) && ((msg as any).isApprovalResult ? (
                                    <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words overflow-x-auto">
                                        <Markdown content={_contentStr} />
                                    </div>
                                ) : hasToolResults ? (() => {
                                    // Extract any GIF/Image/Video results to show INLINE (not hidden in reasoning)
                                    const inlineMedia = msg.toolResults!.filter(r =>
                                        r.displayMessage?.startsWith('GIF_URL:') ||
                                        r.displayMessage?.startsWith('IMG_GEN:') ||
                                        r.displayMessage?.startsWith('IMG_FILE:') ||
                                        r.displayMessage?.startsWith('VIDEO_FILE:')
                                    );
                                    return (
                                        <>
                                            <details className="group/details mb-2">
                                                <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider select-none text-lime-600/70 hover:text-lime-600 transition-colors my-1">
                                                    <span className="inline-block transition-transform group-open/details:rotate-90">▶</span>
                                                    Reasoning Process
                                                </summary>
                                                <div className="mt-2 pl-3 border-l-2 border-lime-500/10 text-xs opacity-90">
                                                    {hasText && (
                                                        <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words overflow-x-auto mb-3">
                                                            <Markdown content={_contentStr} />
                                                        </div>
                                                    )}
                                                    {renderToolResults(msg.toolResults!)}
                                                </div>
                                            </details>
                                            {/* Inline media: GIFs/images rendered directly in the chat bubble */}
                                            {inlineMedia.map((r, mi) => {
                                                if (r.displayMessage?.startsWith('GIF_URL:')) {
                                                    const [gifUrl, gifTitle] = r.displayMessage.slice(8).split('|');
                                                    // Klipy and some providers return mp4/webm — use <video> for those
                                                    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(gifUrl || '');
                                                    return (
                                                        <div key={`media-${mi}`} className="mt-2 space-y-1">
                                                            {isVideo ? (
                                                                <video src={gifUrl} autoPlay loop muted playsInline
                                                                    className="max-w-full max-h-56 rounded-xl object-contain border"
                                                                    style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                                            ) : (
                                                                <img src={gifUrl} alt={gifTitle || 'GIF'}
                                                                    className="max-w-full max-h-56 rounded-xl object-contain border"
                                                                    style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                                            )}
                                                            {gifTitle && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🎬 {gifTitle}</p>}
                                                        </div>
                                                    );
                                                }
                                                if (r.displayMessage?.startsWith('IMG_GEN:')) {
                                                    const raw = r.displayMessage.slice(8);
                                                    const pipeIdx = raw.indexOf('|');
                                                    const b64 = raw.slice(0, pipeIdx);
                                                    const rest = raw.slice(pipeIdx + 1).split('|');
                                                    const [mime, prompt, style, ratio] = rest;
                                                    return (
                                                        <div key={`media-${mi}`} className="mt-2 space-y-1">
                                                            <img src={`data:${mime};base64,${b64}`} alt={prompt}
                                                                className="max-w-full max-h-80 rounded-xl object-contain border"
                                                                style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🎨 {style} · {ratio}</p>
                                                        </div>
                                                    );
                                                }
                                                if (r.displayMessage?.startsWith('IMG_FILE:')) {
                                                    const [relPath, prompt, style, ratio] = r.displayMessage.slice(9).split('|');
                                                    return (
                                                        <div key={`media-${mi}`} className="mt-2 space-y-1">
                                                            <img src={`/api/file?path=${encodeURIComponent(relPath)}`} alt={prompt}
                                                                className="max-w-full max-h-80 rounded-xl object-contain border"
                                                                style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>💾 {relPath} · {style} · {ratio}</p>
                                                        </div>
                                                    );
                                                }
                                                if (r.displayMessage?.startsWith('VIDEO_FILE:')) {
                                                    const [relPath] = r.displayMessage.slice(11).split('|');
                                                    return (
                                                        <div key={`media-${mi}`} className="mt-2">
                                                            <video src={`/api/file?path=${encodeURIComponent(relPath)}`} controls
                                                                className="max-w-full max-h-80 rounded-xl border"
                                                                style={{ borderColor: 'rgba(132,204,22,0.25)' }} />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </>
                                    );
                                })() : (
                                    hasText && (
                                        <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words overflow-x-auto">
                                            <Markdown content={_contentStr} />
                                        </div>
                                    )
                                ))}
                                {msg.imageUrl && (
                                    <img
                                        src={msg.imageUrl}
                                        alt="Attached image"
                                        className="mt-2 max-w-full rounded-xl max-h-64 object-contain"
                                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                )}
                                {/* Render images embedded in multimodal array content (e.g. Telegram image messages) */}
                                {Array.isArray(msg.content) && (msg.content as any[]).some((c: any) => c.type === 'image_url') && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(msg.content as any[])
                                            .filter((c: any) => c.type === 'image_url')
                                            .map((c: any, i: number) => (
                                                <img key={i} src={c.image_url?.url} alt="Attached image"
                                                    className="max-w-full rounded-xl max-h-64 object-contain"
                                                    style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                                            ))
                                        }
                                    </div>
                                )}
                                {!msg.imageUrl && !hasToolResults && (() => {
                                    const urls = extractImageUrls(_contentStr);
                                    if (urls && urls.length > 0) {
                                        return (
                                            <div className="mt-2 flex flex-wrap gap-2 animate-fadeIn">
                                                {urls.map((url, i) => (
                                                    <img key={i} src={url} alt="Content preview"
                                                        className="rounded-xl border border-white/10 max-h-64 max-w-full object-contain bg-black/20"
                                                        onError={(e) => e.currentTarget.style.display = 'none'} />
                                                ))}
                                            </div>
                                        );
                                    }
                                })()}
                                {/* Link OG preview - show for assistant messages with exactly 1 plain URL */}
                                {msg.role === 'assistant' && hasText && !hasToolResults && (() => {
                                    const plainUrls = extractPlainUrls(_contentStr);
                                    if (plainUrls.length === 1) {
                                        return <LinkPreview url={plainUrls[0]} />;
                                    }
                                    return null;
                                })()}
                                {msg.source === 'telegram' && (
                                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400">
                                            📱 via Telegram{msg.telegramUser ? ` • ${msg.telegramUser}` : ''}
                                        </span>
                                    </div>
                                )}
                                {msg.source === 'buddy' && (
                                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-lime-500/15 text-lime-400">
                                            🦎 via Desktop Buddy
                                        </span>
                                    </div>
                                )}
                                {((msg.tokensUsed != null && msg.tokensUsed > 0) || (msg.memoriesRecalled != null && msg.memoriesRecalled > 0)) && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t"
                                        style={{ borderColor: 'var(--border)' }}>
                                        {msg.tokensUsed != null && msg.tokensUsed > 0 && (
                                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                {msg.model} · {msg.tokensUsed} tokens
                                            </span>
                                        )}
                                        {msg.memoriesRecalled && msg.memoriesRecalled > 0 && (
                                            <span
                                                className="animate-memory-flash text-[11px] flex items-center gap-0.5 select-none"
                                                style={{ color: 'var(--text-muted)' }}
                                                title={t('chat.recalling')}
                                            >
                                                🧠
                                            </span>
                                        )}
                                    </div>
                                )}
                                {msg.role === 'assistant' && hasText && (
                                    <button
                                        onClick={() => onCopy(msg.content, idx)}
                                        className="absolute -bottom-3 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    >
                                        {copiedIdx === idx ? <Icon icon={Check} size={12} className="text-green-500" /> : <Icon icon={Copy} size={12} style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                )}
                            </div>
                            {msg.timestamp && (
                                <span className="text-[10px] px-1 select-none opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--text-muted)' }}>
                                    {formatMessageTime(msg.timestamp)}
                                </span>
                            )}
                        </div>
                        {/* User avatar emoji - right side, aligned to top of bubble */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 text-base select-none"
                                style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.25)' }}>
                                {userEmoji}
                            </div>
                        )}
                    </div>
                );
            })}

            {loading && messages[messages.length - 1]?.role !== 'tool-status' && (
                <div className="flex gap-3 max-w-3xl mx-auto">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)' }}>
                        {agentEmoji}
                    </div>
                    <div className="rounded-2xl p-4 flex gap-1.5 items-center"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <span className="w-2 h-2 bg-lime-500/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-lime-500/75 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default function ChatPage() {
    const { t } = useTranslation();
    // Safety net: if serverT() failed to resolve an i18n key (e.g. key missing at runtime),
    // the raw dot-notation key leaks through. Re-resolve it client-side before display.
    const resolveError = (msg: string | undefined): string =>
        !msg ? '' : msg.startsWith('system.') ? (t(msg) !== msg ? t(msg) : msg) : msg;
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showSlash, setShowSlash] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showSessions, setShowSessions] = useState(false);
    const [showAllSessions, setShowAllSessions] = useState(false);
    const [pastedImage, setPastedImage] = useState<string | null>(null); // base64 data URL
    const [attachedFile, setAttachedFile] = useState<{ name: string; ext: string; content: string; sizeKb: string } | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);

    // ─── Skill Toolbar State ────────────────────────────────────
    const [activeSkills, setActiveSkills] = useState<string[]>([]);
    const [showGenToolbar, setShowGenToolbar] = useState(false);
    const [genMode, setGenMode] = useState<'image' | 'video'>('image');
    const [genPrompt, setGenPrompt] = useState('');
    const [genImageStyle, setGenImageStyle] = useState<'auto' | 'photorealistic' | 'digital-art' | 'illustration' | 'sketch'>('auto');
    const [genImageRatio, setGenImageRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [genVideoRatio, setGenVideoRatio] = useState<'16:9' | '9:16'>('16:9');
    const [genVideoDuration, setGenVideoDuration] = useState<5 | 8>(5);
    const [genImageModel, setGenImageModel] = useState<'standard' | 'pro'>('standard');
    const [genLoading, setGenLoading] = useState(false);
    const [genOperationName, setGenOperationName] = useState<string | null>(null);
    // Replicate provider state
    const [genProvider, setGenProvider] = useState<'google' | 'replicate'>('google');
    const [replicateImageModelId, setReplicateImageModelId] = useState('black-forest-labs/flux-schnell');
    const [replicateVideoModelId, setReplicateVideoModelId] = useState('minimax/video-01');
    const [replicateCustomModel, setReplicateCustomModel] = useState('');
    const [replicateUseCustom, setReplicateUseCustom] = useState(false);

    // User profile avatar emoji (shown next to user bubbles)
    const [userEmoji, setUserEmoji] = useState<string>('👤');

    // Multi-Agent state
    const [isMultiAgentRunning, setIsMultiAgentRunning] = useState(false);
    const [messageQueue, setMessageQueue] = useState<string[]>([]);
    const [multiAgentJobName, setMultiAgentJobName] = useState<string>('');

    // Agent selector
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('skales');
    const [showAgentDropdown, setShowAgentDropdown] = useState(false);

    // ── Voice Chat Mode ──────────────────────────────────────────────────────
    const [isVoiceChatMode,  setIsVoiceChatMode]  = useState(false);
    const [isRecording,      setIsRecording]       = useState(false);
    const [voiceStatus,      setVoiceStatus]       = useState<'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'>('idle');
    const [voiceError,       setVoiceError]        = useState<string | null>(null);
    /** 'push-to-talk': stop mic → auto-send. 'review': stop mic → show text → user taps Send */
    const [voiceMode,        setVoiceMode]         = useState<'push-to-talk' | 'review'>('push-to-talk');
    /** Holds transcribed text in review-mode until user explicitly sends it */
    const [pendingVoiceText, setPendingVoiceText]  = useState<string | null>(null);
    const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
    const audioChunksRef     = useRef<Blob[]>([]);
    const ttsAudioRef        = useRef<HTMLAudioElement | null>(null);

    // ── Approval / Confirmation State ───────────────────────────────────────
    // When the agent wants to run a 'confirm'-level tool, execution is paused
    // and this state holds the pending context until the user approves/cancels.
    const [pendingApproval, setPendingApproval] = useState<{
        toolCalls: import('@/actions/orchestrator').ToolCall[];
        confirmedIds: string[];      // IDs already approved in this batch
        pendingIds: string[];        // IDs that still need approval
        messages: string[];          // human-readable description per pending tool
    } | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // Track whether the user is at (or near) the bottom of the message list.
    // Auto-scroll only fires when they are — so reading older messages is not interrupted.
    const isAtBottomRef = useRef<boolean>(true);
    const fileRef = useRef<HTMLInputElement>(null);
    const lastTelegramPollRef = useRef<number>(0);
    const isTelegramPollingRef = useRef<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    // Buddy session polling — tracks how many session messages are already displayed
    const lastBuddyMsgCountRef = useRef<number>(0);
    const isBuddyPollingRef = useRef<boolean>(false);


    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        // Also clear the queue so no pending messages are auto-processed after stopping
        setMessageQueue([]);
        setMessages(prev => [
            ...prev.filter(m => m.role !== 'tool-status'),
            { role: 'assistant', content: '🛑 Stopped.' }
        ]);
    };

    // ── Approval System Handlers ─────────────────────────────────────────────
    const handleApproveTools = async () => {
        if (!pendingApproval) return;
        const { toolCalls, confirmedIds, pendingIds } = pendingApproval;
        const allConfirmed = [...confirmedIds, ...pendingIds];
        setPendingApproval(null);
        setLoading(true);

        try {
            // Re-run only the tools that were pending (now confirmed)
            const pendingCalls = toolCalls.filter(tc => pendingIds.includes(tc.id));
            const confirmedResults = await agentExecute(pendingCalls, allConfirmed);

            // Build a short confirmation summary so the user knows what happened
            const succeeded = confirmedResults.filter(r => r.success);
            const failed    = confirmedResults.filter(r => !r.success);
            let confirmSummary = '';
            if (succeeded.length > 0 && failed.length === 0) {
                confirmSummary = `✅ Done - ${succeeded.map(r => r.toolName).join(', ')} completed successfully.`;
            } else if (succeeded.length > 0 && failed.length > 0) {
                confirmSummary = `⚠️ Completed with issues - ${succeeded.length} succeeded, ${failed.length} failed.`;
            } else {
                confirmSummary = `❌ All actions failed. Check the results below for details.`;
            }

            // NOTE: Do NOT attach toolCalls/toolResults to this message.
            // When toolResults is set, the chat renderer wraps the entire content
            // inside a collapsed <details> "Reasoning Process" block, making the
            // confirmation text invisible. By omitting them, the summary renders
            // as a normal visible assistant message.
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: confirmSummary,
                    timestamp: Date.now(),
                    isApprovalResult: true,
                } as any,
            ]);

            // ── FIX 8: Continue the agent loop after approval ────────────────────
            // Feed the tool results back to the LLM so it can decide if more
            // actions are needed (ReAct loop continuation).
            // Build history from current messages + tool results for context.
            const currentSessionId = sessionId;
            if (currentSessionId) {
                // Save tool results to session first
                const sess = await loadSession(currentSessionId);
                if (sess) {
                    confirmedResults.forEach((res, i) => {
                        sess.messages.push({
                            role: 'tool',
                            tool_call_id: pendingCalls[i]?.id || `approved_${i}`,
                            name: res.toolName,
                            content: JSON.stringify(res.result),
                            display_message: res.displayMessage,
                            timestamp: Date.now(),
                        } as any);
                    });
                    // Also save the summary message
                    sess.messages.push({
                        role: 'assistant',
                        content: confirmSummary,
                        timestamp: Date.now(),
                    } as any);
                    await saveSession(sess);
                }

                // Now continue the agent loop: build context and call agentDecide
                // to let the LLM decide if more actions are needed.
                const session = await loadSession(currentSessionId);
                if (session?.messages) {
                    let loopCount = 0;
                    const MAX_LOOPS = 15; // slightly lower than main loop to prevent runaway

                    // Build running history from session messages
                    let currentMessages: DisplayMessage[] = session.messages
                        .filter((m: any) => ['user', 'assistant', 'tool'].includes(m.role))
                        .slice(-40)
                        .map((m: any) => ({
                            role: m.role,
                            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                            toolCalls: m.tool_calls,
                            toolCallId: m.tool_call_id,
                        }));

                    while (loopCount < MAX_LOOPS) {
                        loopCount++;

                        // Show thinking status
                        setMessages(prev => [
                            ...prev.filter(m => m.role !== 'tool-status'),
                            {
                                role: 'tool-status',
                                content: `Continuing... (step ${loopCount})`,
                                toolsExecuting: ['thinking'],
                            }
                        ]);

                        const apiMessages = currentMessages
                            .filter(m => m.role !== 'tool-status' && m.role !== 'system')
                            .slice(-40)
                            .map(m => ({
                                role: m.role as string,
                                content: m.content,
                                tool_calls: m.toolCalls?.map((tc: any) => ({ ...tc, type: 'function' as const })),
                                tool_call_id: m.toolCallId,
                            }));

                        const decision = await agentDecide(apiMessages as any);

                        if (decision.decision === 'error') {
                            setMessages(prev => [
                                ...prev.filter(m => m.role !== 'tool-status'),
                                { role: 'assistant', content: `⚠️ Error: ${resolveError(decision.error)}` }
                            ]);
                            break;
                        }

                        if (decision.decision === 'response') {
                            // LLM is done — show final response
                            const assistantMsg: DisplayMessage = {
                                role: 'assistant',
                                content: decision.response || '',
                                tokensUsed: decision.tokensUsed,
                                model: decision.model,
                                timestamp: Date.now(),
                                memoriesRecalled: decision.memoriesRecalled,
                            };
                            setMessages(prev => [
                                ...prev.filter(m => m.role !== 'tool-status'),
                                assistantMsg,
                            ]);

                            // Save to session
                            const s = await loadSession(currentSessionId);
                            if (s) {
                                s.messages.push({
                                    role: 'assistant',
                                    content: assistantMsg.content,
                                    timestamp: Date.now(),
                                    ...(assistantMsg.tokensUsed ? { tokensUsed: assistantMsg.tokensUsed } : {}),
                                    ...(assistantMsg.model ? { model: assistantMsg.model } : {}),
                                } as any);
                                await saveSession(s);
                            }
                            break;
                        }

                        if (decision.decision === 'tool') {
                            // More tools to run — execute them
                            const toolNames = decision.toolCalls!.map(t => t.function.name);
                            setMessages(prev => [
                                ...prev.filter(m => m.role !== 'tool-status'),
                                {
                                    role: 'assistant',
                                    content: decision.response || '',
                                    toolCalls: decision.toolCalls,
                                    timestamp: Date.now(),
                                },
                                {
                                    role: 'tool-status',
                                    content: `Executing ${toolNames.join(', ')}...`,
                                    toolsExecuting: toolNames,
                                }
                            ]);

                            // Execute — first pass to check approval
                            const results = await agentExecute(decision.toolCalls!, []);
                            const needsMoreApproval = results.filter(r => r.requiresConfirmation);

                            if (needsMoreApproval.length > 0) {
                                // Another approval needed — pause again
                                const newPendingIds = decision.toolCalls!
                                    .filter((_, i) => results[i]?.requiresConfirmation)
                                    .map(tc => tc.id);
                                setPendingApproval({
                                    toolCalls: decision.toolCalls!,
                                    confirmedIds: decision.toolCalls!
                                        .filter((_, i) => !results[i]?.requiresConfirmation)
                                        .map(tc => tc.id),
                                    pendingIds: newPendingIds,
                                    messages: needsMoreApproval.map(r => r.confirmationMessage || r.displayMessage || ''),
                                });
                                setMessages(prev => prev.filter(m => m.role !== 'tool-status'));
                                setLoading(false);
                                return; // Pause again for approval
                            }

                            // All auto-executed — update UI and continue loop
                            const toolMsgs: DisplayMessage[] = results.map((res, i) => ({
                                role: 'tool' as const,
                                toolCallId: decision.toolCalls![i].id,
                                content: JSON.stringify(res.result),
                            }));
                            currentMessages.push(
                                { role: 'assistant', content: decision.response || '', toolCalls: decision.toolCalls },
                                ...toolMsgs,
                            );

                            // Save to session
                            const s2 = await loadSession(currentSessionId);
                            if (s2) {
                                s2.messages.push({
                                    role: 'assistant',
                                    content: decision.response || '',
                                    tool_calls: decision.toolCalls,
                                    timestamp: Date.now(),
                                } as any);
                                results.forEach((res, i) => {
                                    s2.messages.push({
                                        role: 'tool',
                                        tool_call_id: decision.toolCalls![i].id,
                                        name: decision.toolCalls![i].function.name,
                                        content: JSON.stringify(res.result),
                                        display_message: res.displayMessage,
                                        timestamp: Date.now(),
                                    } as any);
                                });
                                await saveSession(s2);
                            }

                            // Trim history if growing too large
                            if (currentMessages.length > 80) {
                                currentMessages = currentMessages.slice(-60);
                            }

                            // Continue loop...
                        }
                    }

                    // Clean up any lingering tool-status
                    setMessages(prev => prev.filter(m => m.role !== 'tool-status'));
                }
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error executing approved tools.', isApprovalResult: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleDenyTools = () => {
        if (!pendingApproval) return;
        setPendingApproval(null);
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: '🚫 Action cancelled - no changes were made.' },
        ]);
    };

    // ── Restore voice mode from localStorage on mount ────────────────────────
    useEffect(() => {
        try {
            const saved = localStorage.getItem('skales_voice_mode');
            if (saved === 'review' || saved === 'push-to-talk') {
                setVoiceMode(saved);
            }
        } catch { /* SSR / storage unavailable */ }
    }, []);

    // ── Chat activity heartbeat — tells buddy intelligence user is in chat ────
    useEffect(() => {
        const reportChatActive = () => {
            if (document.hidden) return;
            fetch('/api/buddy/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'chat' }),
            }).catch(() => {});
        };
        reportChatActive();
        const handler = () => reportChatActive();
        document.addEventListener('keydown', handler);
        document.addEventListener('click', handler);
        const interval = setInterval(reportChatActive, 30_000);
        return () => {
            document.removeEventListener('keydown', handler);
            document.removeEventListener('click', handler);
            clearInterval(interval);
        };
    }, []);

    // ── Voice Chat helpers ────────────────────────────────────────────────────

    /** Speak text via TTS — respects the user's chosen provider in Settings. */
    const speakText = async (text: string) => {
        if (!text.trim()) return;
        setVoiceStatus('speaking');

        try {
            const ttsConfig = settings?.ttsConfig;
            const provider  = ttsConfig?.provider || 'default';

            // Helper: play an ArrayBuffer / Blob as audio and wait for it to finish
            const playAudio = async (blob: Blob) => {
                const url   = URL.createObjectURL(blob);
                const audio = new Audio(url);
                ttsAudioRef.current = audio;
                await new Promise<void>((resolve) => {
                    audio.onended = () => resolve();
                    audio.onerror = () => resolve();
                    audio.play().catch(resolve);
                });
                URL.revokeObjectURL(url);
            };

            // ── 1. ElevenLabs (only when user selected 'elevenlabs' and key is configured) ──
            if (provider === 'elevenlabs' && ttsConfig?.elevenlabsApiKey) {
                const voiceId = ttsConfig.elevenlabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
                const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: { 'xi-api-key': ttsConfig.elevenlabsApiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
                });
                if (res.ok) {
                    await playAudio(await res.blob());
                    setVoiceStatus('idle');
                    return;
                }
            }

            // ── 2. Azure (only when user selected 'azure' and key is configured) ──
            if (provider === 'azure' && ttsConfig?.azureSpeechKey && ttsConfig?.azureSpeechRegion) {
                const voiceName = ttsConfig.azureVoiceName || 'en-US-JennyNeural';
                const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voiceName}'>${text.slice(0, 3000).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</voice></speak>`;
                const res = await fetch(`https://${ttsConfig.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': ttsConfig.azureSpeechKey,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
                    },
                    body: ssml,
                });
                if (res.ok) {
                    await playAudio(await res.blob());
                    setVoiceStatus('idle');
                    return;
                }
            }

            // ── 3. Default / fallback: browser SpeechSynthesis ──
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                const utter = new SpeechSynthesisUtterance(text.slice(0, 500));
                utter.rate = 1.05;
                utter.pitch = 1;
                utter.onend = () => setVoiceStatus('idle');
                utter.onerror = () => setVoiceStatus('idle');
                window.speechSynthesis.speak(utter);
                return;
            }
        } catch {
            // ignore TTS errors
        }
        setVoiceStatus('idle');
    };

    /** Start recording from the microphone. */
    const startRecording = async () => {
        setVoiceError(null);
        // Guard: navigator.mediaDevices is only available on HTTPS or localhost.
        // On plain HTTP (e.g. LAN access) it is undefined — calling it crashes the page.
        if (!navigator.mediaDevices?.getUserMedia) {
            setVoiceError('Microphone access requires a secure connection (HTTPS or localhost). Voice chat is unavailable on plain HTTP.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.start(200); // collect in 200ms chunks
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setVoiceStatus('recording');
        } catch (e: any) {
            setVoiceError(e.message?.includes('NotAllowed') ? 'Microphone permission denied.' : `Mic error: ${e.message}`);
        }
    };

    /** Stop recording, transcribe, run through handleSend, speak response. */
    const stopRecordingAndProcess = async () => {
        if (!mediaRecorderRef.current || !isRecording) return;
        setIsRecording(false);
        setVoiceStatus('transcribing');

        // Stop recorder and collect final data
        await new Promise<void>((resolve) => {
            const rec = mediaRecorderRef.current!;
            rec.onstop = () => resolve();
            rec.stop();
            // Stop all mic tracks
            rec.stream?.getTracks().forEach(t => t.stop());
        });

        try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            // Convert to base64 and send as JSON to avoid Next.js App Router
            // multipart body-size limits on API routes (different from serverActions limit).
            const base64Audio = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // Strip "data:audio/webm;base64," prefix
                    resolve(result.split(',')[1] ?? '');
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const res  = await fetch('/api/voice/transcribe', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ audio: base64Audio, mimeType: 'audio/webm' }),
            });
            const data = await res.json();

            if (!data.success || !data.text) {
                setVoiceError(data.error ?? 'Transcription failed.');
                setVoiceStatus('idle');
                return;
            }

            const transcript = data.text as string;

            // ── Review mode: show transcription for user to confirm before sending ──
            if (voiceMode === 'review') {
                setPendingVoiceText(transcript);
                setVoiceStatus('idle');
                return;
            }

            setVoiceStatus('thinking');

            // Inject as user message via handleSend
            // We capture the next assistant reply by watching messages
            const before = messages.length;
            await (handleSend as (text?: string) => Promise<void>)(transcript);

            // Wait for a new assistant message to appear, then speak it.
            // Guard: if the tab is hidden when the interval fires, skip the
            // state mutation — it can throw on some browsers mid-suspension.
            let waited = 0;
            const poll = setInterval(() => {
                if (document.hidden) return; // tab suspended - skip tick safely
                waited += 300;
                setMessages(prev => {
                    const newAssistant = prev.filter(
                        (m, i) => i >= before && m.role === 'assistant' && m.content && !m.content.startsWith('🛑'),
                    );
                    if (newAssistant.length > 0 && voiceStatus !== 'speaking') {
                        clearInterval(poll);
                        const reply = newAssistant[newAssistant.length - 1].content;
                        // Strip markdown for TTS
                        const plain = reply.replace(/[#*`_~>\[\]!]/g, '').replace(/\n+/g, ' ').trim();
                        speakText(plain);
                    }
                    if (waited > 30_000) clearInterval(poll);
                    return prev;
                });
            }, 300);
        } catch (e: any) {
            setVoiceError(`Error: ${e.message}`);
            setVoiceStatus('idle');
        }
    };

    /** Toggle mic on/off. */
    const toggleRecording = () => {
        if (isRecording) {
            stopRecordingAndProcess();
        } else {
            startRecording();
        }
    };

    /** Exit Voice Chat Mode — stop anything in progress. */
    const exitVoiceChat = () => {
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current.stop();
        }
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsRecording(false);
        setVoiceStatus('idle');
        setVoiceError(null);
        setIsVoiceChatMode(false);
    };

    // ── Smart Auto-scroll ─────────────────────────────────────
    // Only snap to bottom when the user is already near the bottom (≤ 120px).
    // This prevents the viewport from jumping while reading older messages.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        // Track whether the user is at the bottom via a scroll listener
        const onScroll = () => {
            const threshold = 120; // px from bottom to be considered "at bottom"
            isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (isAtBottomRef.current) {
            // Use smooth scroll only for small deltas; instant for first load
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Auto-resize textarea only — no setState calls inside
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
        }
    }, [input]);

    // ── Chat State Persistence (sessionStorage) ──────────────
    // Save messages to sessionStorage so navigation away and back is instant.
    useEffect(() => {
        if (!sessionId || messages.length === 0 || initialLoading) return;
        const key = `skales_chat_${sessionId}`;
        const timer = setTimeout(() => {
            try {
                // Only keep non-tool-status messages (transient states)
                const saveable = messages.filter(m => m.role !== 'tool-status');
                sessionStorage.setItem(key, JSON.stringify(saveable));
                sessionStorage.setItem('skales_last_session_id', sessionId);
            } catch { /* sessionStorage may be unavailable */ }
        }, 200);
        return () => clearTimeout(timer);
    }, [messages, sessionId, initialLoading]);

    // Handle input changes — update both input value and slash menu state together
    // useCallback prevents a new function ref on every render, avoiding unnecessary
    // re-renders of the textarea and eliminating perceived typing lag.
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);
        setShowSlash(val === '/');
    }, []);



    // Load sessions, settings, agents on mount + auto-load last session
    useEffect(() => {
        const init = async () => {
            // Use Promise.allSettled so a failure in one call doesn't block everything else
            const [settingsResult, agentListResult, sessionListResult, skillsResult, lastActiveIdResult, humanResult] =
                await Promise.allSettled([
                    loadSettings(),
                    listAgents(),
                    listSessions(),
                    getActiveSkills(),
                    getActiveSessionId(),
                    loadHuman(),
                ]);

            const s = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
            const agentList = agentListResult.status === 'fulfilled' ? agentListResult.value : [];
            const sessionList = sessionListResult.status === 'fulfilled' ? sessionListResult.value : [];
            const skills = skillsResult.status === 'fulfilled' ? skillsResult.value : [];
            const lastActiveId = lastActiveIdResult.status === 'fulfilled' ? lastActiveIdResult.value : null;
            const human = humanResult.status === 'fulfilled' ? humanResult.value : null;

            if (s) setSettings(s);
            setAgents(agentList);
            setSessions(sessionList);
            setActiveSkills(skills);
            if (human?.emoji) setUserEmoji(human.emoji);

            // Log any init failures for debugging
            [settingsResult, agentListResult, sessionListResult, skillsResult, lastActiveIdResult, humanResult]
                .forEach((r, i) => {
                    if (r.status === 'rejected') {
                        console.warn(`[Skales] Init step ${i} failed:`, r.reason);
                    }
                });

            try {
                // Check URL params for specific session or agent
                const urlSession = searchParams.get('session');
                const urlAgent = searchParams.get('agent');

                if (urlAgent) {
                    setSelectedAgent(urlAgent);
                }

                if (urlSession) {
                    // Load specific session from URL
                    const session = await loadSession(urlSession);
                    if (session) {
                        setSessionId(session.id);
                        // Restore agent from session if no urlAgent specified
                        if (!urlAgent && session.agentId) {
                            setSelectedAgent(session.agentId);
                        }
                        // Always reconstruct from the session file so buddy/telegram messages
                        // written externally are always visible. Then append any in-flight
                        // messages from sessionStorage that haven't been saved yet.
                        let sessionMsgs: DisplayMessage[] =
                            session.messages.length > 0
                                ? reconstructDisplayMessages(session.messages)
                                : [getWelcomeMessage(urlAgent || session.agentId)];
                        try {
                            const cached = sessionStorage.getItem(`skales_chat_${session.id}`);
                            if (cached) {
                                const cachedMsgs: DisplayMessage[] = JSON.parse(cached);
                                // Only append cache entries that aren't already represented
                                // in the session (in-flight messages sent but not yet persisted)
                                if (cachedMsgs.length > sessionMsgs.length) {
                                    sessionMsgs = [...sessionMsgs, ...cachedMsgs.slice(sessionMsgs.length)];
                                }
                            }
                        } catch { }
                        setMessages(sessionMsgs);
                        // Advance Telegram poll cursor so old inbox messages aren't re-appended
                        const maxTs = session.messages.reduce((m: number, msg: any) => Math.max(m, msg.timestamp || 0), 0);
                        if (maxTs > 0) lastTelegramPollRef.current = maxTs;
                        // Baseline for buddy session polling — full session count so polling
                        // only triggers on truly new external messages from here on
                        lastBuddyMsgCountRef.current = session.messages.length;
                    } else {
                        setMessages([getWelcomeMessage(urlAgent)]);
                    }
                } else {
                    // AUTO-LOAD LAST SESSION
                    // Priority: 1. Persisted active session ID, 2. Last updated session from list

                    let targetSession = null;
                    const activeAgentId = urlAgent || null;

                    // 1. Always try the persisted active session first, even if sessionList is empty
                    //    (this handles the case where listSessions() failed or returned empty)
                    if (lastActiveId) {
                        try {
                            const active = await loadSession(lastActiveId);
                            if (active) {
                                targetSession = active;
                                // Make sure this session appears in the list
                                if (!sessionList.find(s => s.id === active.id)) {
                                    setSessions(prev => [
                                        { id: active.id, title: active.title, updatedAt: active.updatedAt, messageCount: active.messages.length },
                                        ...prev,
                                    ]);
                                }
                            }
                        } catch { /* loadSession always returns null on error, shouldn't throw */ }
                    }

                    // 2. If no persisted active session, find the latest session matching the agent (or any)
                    if (!targetSession && sessionList.length > 0) {
                        for (const s of sessionList) {
                            try {
                                const candidate = await loadSession(s.id);
                                if (!candidate) continue;
                                if (activeAgentId) {
                                    const sessionAgent = candidate.agentId || 'skales';
                                    if (sessionAgent !== activeAgentId) continue;
                                }
                                targetSession = candidate;
                                break;
                            } catch (sessionErr) {
                                console.warn('[Skales] Could not load session', s.id, sessionErr);
                            }
                        }
                    }

                    if (targetSession) {
                        setSessionId(targetSession.id);
                        await setActiveSessionId(targetSession.id); // Persist active session
                        // Limit display to last 80 messages to avoid rendering bottlenecks with very large sessions
                        const displayMsgs = targetSession.messages.length > 80
                            ? targetSession.messages.slice(-80)
                            : targetSession.messages;

                        // ── Always reconstruct from session file first ──
                        // This ensures buddy/telegram messages added externally are always visible.
                        // sessionStorage is only used to append in-flight messages not yet persisted.
                        let sessionMsgsAuto: DisplayMessage[];
                        try {
                            sessionMsgsAuto = reconstructDisplayMessages(displayMsgs);
                        } catch (reconstructErr) {
                            console.warn('[Skales] reconstructDisplayMessages failed in init, using raw fallback:', reconstructErr);
                            const fallbackMsgs = displayMsgs
                                .filter(m => m.role === 'user' || m.role === 'assistant')
                                .map(m => ({ role: m.role as any, content: m.content || '', timestamp: m.timestamp }));
                            sessionMsgsAuto = fallbackMsgs.length > 0 ? fallbackMsgs : [getWelcomeMessage()];
                        }

                        // Append any in-flight cache entries (messages sent mid-session not yet persisted)
                        try {
                            const cached = sessionStorage.getItem(`skales_chat_${targetSession.id}`);
                            if (cached) {
                                const cachedMsgs: DisplayMessage[] = JSON.parse(cached);
                                if (cachedMsgs.length > sessionMsgsAuto.length) {
                                    sessionMsgsAuto = [...sessionMsgsAuto, ...cachedMsgs.slice(sessionMsgsAuto.length)];
                                }
                            }
                        } catch { /* sessionStorage unavailable */ }

                        setMessages(sessionMsgsAuto);

                        // If we loaded a session and didn't have a fixed URL agent, update the UI
                        if (!urlAgent && targetSession.agentId) {
                            setSelectedAgent(targetSession.agentId);
                        } else if (!urlAgent && !targetSession.agentId) {
                            setSelectedAgent('skales');
                        }

                        // Advance Telegram poll cursor to prevent old inbox messages from re-appending
                        const maxTs = targetSession.messages.reduce((m: number, msg: any) => Math.max(m, msg.timestamp || 0), 0);
                        if (maxTs > 0) lastTelegramPollRef.current = maxTs;
                        // Baseline for buddy session polling
                        lastBuddyMsgCountRef.current = targetSession.messages.length;
                    } else {
                        // No valid session found — show welcome, session creates lazily on first message
                        setSessionId(null);
                        setMessages([getWelcomeMessage(urlAgent)]);
                    }
                }
            } catch (e) {
                console.error('[Skales] Failed to restore session:', e);
                // Don't wipe the session list — just show welcome message
                setSessionId(null);
                setMessages([getWelcomeMessage()]);
            } finally {
                setInitialLoading(false);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Telegram Inbox: einmal beim Laden + bei Window-Focus ──
    // Kein Intervall mehr — polling blockierte jeden Tastendruck (full re-render alle 4s)
    useEffect(() => {
        const pollTelegram = async () => {
            if (isTelegramPollingRef.current) return;
            isTelegramPollingRef.current = true;
            try {
                const newMessages = await getTelegramInbox(lastTelegramPollRef.current || undefined);
                if (newMessages && newMessages.length > 0) {
                    const maxTs = Math.max(...newMessages.map(m => m.timestamp));
                    if (maxTs > lastTelegramPollRef.current) {
                        lastTelegramPollRef.current = maxTs;
                        const telegramMsgs: DisplayMessage[] = newMessages.map(m => ({
                            role: m.direction === 'incoming' ? 'user' as const : 'assistant' as const,
                            content: m.content,
                            source: 'telegram' as const,
                            telegramUser: m.telegramUserName,
                            timestamp: m.timestamp,
                        }));
                        setMessages(prev => {
                            const unique = telegramMsgs.filter(t =>
                                !prev.some(p => p.content === t.content && p.role === t.role && p.source === t.source)
                            );
                            if (unique.length === 0) return prev;
                            const combined = [...prev, ...unique];
                            combined.sort((a, b) => {
                                const ta = a.timestamp ?? 0;
                                const tb = b.timestamp ?? 0;
                                if (ta === 0 && tb === 0) return 0;
                                if (ta === 0) return -1;
                                if (tb === 0) return 1;
                                return ta - tb;
                            });
                            return combined;
                        });
                    }
                }
            } catch {
                // Silently fail — Telegram nicht konfiguriert
            } finally {
                isTelegramPollingRef.current = false;
            }
        };

        // Einmal beim ersten Laden
        pollTelegram();

        // Re-poll when the window regains focus (user switches back to tab/window)
        const onFocus = () => pollTelegram();
        window.addEventListener('focus', onFocus);

        // Re-poll when the page becomes visible again after being hidden
        // (OS tab suspension, mobile app-switch, minimised window wake-up).
        // This is the primary guard against the "wake-up crash" bug.
        const onVisibility = () => {
            if (!document.hidden) pollTelegram();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    // ── Desktop Buddy session polling ─────────────────────────────────────────
    // When the user types to the buddy overlay, messages are written directly to
    // the session file via /api/buddy-chat. This effect detects those external
    // additions and injects them into the chat display so they're always visible.
    useEffect(() => {
        const pollBuddy = async () => {
            if (!sessionId || isBuddyPollingRef.current) return;
            isBuddyPollingRef.current = true;
            try {
                const session = await loadSession(sessionId);
                if (!session) return;
                const total = session.messages.length;
                if (total <= lastBuddyMsgCountRef.current) return;

                // Take only the newly-added tail messages
                const newMsgs = session.messages.slice(lastBuddyMsgCountRef.current);
                lastBuddyMsgCountRef.current = total;

                // Only plain user/assistant messages (no tool_calls).
                // Skip messages with source:'browser' — those were typed directly in the
                // chat window and are already displayed. We only want externally-added
                // buddy messages (source:'buddy') or legacy messages without a source field
                // (old sessions from before we introduced source tagging).
                const buddyMsgs: DisplayMessage[] = newMsgs
                    .filter((m: any) =>
                        (m.role === 'user' || m.role === 'assistant') &&
                        !(m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) &&
                        m.source !== 'browser'  // skip messages typed directly in the chat window
                    )
                    .map((m: any) => ({
                        role: m.role as 'user' | 'assistant',
                        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                        source: 'buddy' as const,
                        timestamp: m.timestamp ?? Date.now(),
                    }));

                if (buddyMsgs.length === 0) return;

                setMessages(prev => {
                    // Deduplicate against ALL already-displayed messages regardless of
                    // their source — prevents buddy badge appearing on direct-chat msgs.
                    const unique = buddyMsgs.filter(bm =>
                        !prev.some(p =>
                            p.content === bm.content &&
                            p.role === bm.role &&
                            Math.abs((p.timestamp ?? 0) - (bm.timestamp ?? 0)) < 3000
                        )
                    );
                    return unique.length > 0 ? [...prev, ...unique] : prev;
                });
            } catch { /* session may not exist yet - ignore */ }
            finally {
                isBuddyPollingRef.current = false;
            }
        };

        const id = setInterval(pollBuddy, 5000);
        const onFocus = () => { void pollBuddy(); };
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
        };
    }, [sessionId]);

    // ── Dashboard channel polling (Friend Mode / Buddy Intelligence) ─────────
    // Drains /api/dashboard-notifications every 5 seconds.
    // Messages are injected into the chat as assistant messages with source:'dashboard'.
    useEffect(() => {
        const pollDashboard = async () => {
            if (document.hidden) return;
            try {
                const res = await fetch('/api/dashboard-notifications');
                if (!res.ok) return;
                const data = await res.json();
                if (!data?.success || !data.messages?.length) return;
                const dashMsgs: DisplayMessage[] = (data.messages as string[]).map((text: string) => ({
                    role: 'assistant' as const,
                    content: text,
                    source: 'dashboard' as const,
                    timestamp: Date.now(),
                }));
                setMessages(prev => [...prev, ...dashMsgs]);
            } catch { /* non-fatal */ }
        };
        const id = setInterval(pollDashboard, 5000);
        return () => clearInterval(id);
    }, []);


    function getWelcomeMessage(agentId?: string | null): DisplayMessage {
        const agent = agentId ? agents.find(a => a.id === agentId) : null;
        if (agent) {
            return {
                role: 'assistant',
                content: `${agent.emoji} **${agent.name}** here. ${agent.description}\n\nHow can I help you?`,
            };
        }
        return {
            role: 'assistant',
            content: "Hey! I'm Skales - your AI buddy. I can **actually do things** now! 🦎\n\nTry asking me to:\n• Create a folder\n• Write a file\n• List your tasks\n• Look up a website\n• Run a command\n\nOr just chat - I'm here either way! Type `/` for commands.",
        };
    }

    const getActiveAgentName = () => {
        if (selectedAgent === 'skales') return 'Skales';
        const agent = agents.find(a => a.id === selectedAgent);
        return agent?.name || 'Skales';
    };

    const getActiveAgentEmoji = () => {
        if (selectedAgent === 'skales') return '🦎';
        const agent = agents.find(a => a.id === selectedAgent);
        return agent?.emoji || '🦎';
    };

    // Stable emoji value for MessageListArea — only changes when agent actually switches
    const agentEmoji = useMemo(() => getActiveAgentEmoji(), [selectedAgent, agents]);

    const handleCopy = useCallback((text: string, idx: number) => {
        // navigator.clipboard is unavailable on non-HTTPS or certain mobile browsers
        // (e.g. Tailscale serve without TLS, HTTP LAN). Fall back to execCommand.
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(text).catch(() => execCommandFallback(text));
            } else {
                execCommandFallback(text);
            }
        } catch {
            execCommandFallback(text);
        }
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);

        function execCommandFallback(t: string) {
            try {
                const el = document.createElement('textarea');
                el.value = t;
                el.style.position = 'fixed';
                el.style.opacity = '0';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            } catch { /* nothing left to try */ }
        }
    }, []);

    const handleSlashCommand = async (cmd: string) => {
        setShowSlash(false);
        setInput('');

        if (cmd === '/clear') {
            setMessages([{ role: 'assistant', content: t('chat.chatCleared') }]);
            return;
        }

        if (cmd === '/help') {
            const helpText = getSlashCommands(t).map(c => `**${c.cmd}** - ${c.desc}`).join('\n');
            setMessages(prev => [...prev, { role: 'system', content: `Available commands:\n${helpText}` }]);
            return;
        }

        if (cmd === '/new') {
            handleNewSession();
            return;
        }

        if (cmd === '/sessions') {
            setShowSessions(true);
            return;
        }

        if (cmd === '/tools') {
            const toolList = [
                '**📁 Filesystem**',
                '  `create_folder` `list_files` `read_file` `write_file` `delete_file` `execute_command`',
                '',
                '**🌐 Web**',
                '  `fetch_web_page` `extract_web_text`',
                '',
                '**✅ Tasks & Scheduling**',
                '  `create_task` `list_tasks` `delete_task` `schedule_recurring_task` `list_scheduled_tasks`',
                '',
                '**📱 Messaging**',
                '  `send_telegram_notification` `send_gif_telegram` `search_gif` `send_whatsapp_message`',
                '',
                '**🖼️ Media**',
                '  **Vision** - Paste images with Ctrl+V or the file button (GPT-4o, Claude 3+, Gemini)',
                '  **Voice** - Voice messages via Telegram (STT/TTS)',
                '',
                '**🔧 System**',
                '  `get_workspace_info` `get_system_info` `check_capabilities` `check_identity`',
            ].join('\n');
            setMessages(prev => [...prev, { role: 'system', content: `**Available Tools:**\n${toolList}\n\nJust ask in plain language - I will automatically choose the right tool.` }]);
            return;
        }

        if (cmd === '/workspace') {
            setInput('Show me my workspace info');
            setTimeout(() => handleSend(), 100);
            return;
        }

        if (cmd === '/tasks') {
            setInput('Show me my tasks');
            setTimeout(() => handleSend(), 100);
            return;
        }

        if (cmd === '/model') {
            const list = settings?.providers
                ? Object.entries(settings.providers)
                    .filter(([_, v]: any) => v.enabled)
                    .map(([k, v]: any) => `- **${k}**: ${v.model}`)
                    .join('\n')
                : 'No models configured.';
            setMessages(prev => [...prev, { role: 'system', content: `**Available Models:**\n${list}\n\nType \`/model [name]\` to switch.` }]);
            return;
        }

        if (cmd === '/persona') {
            setInput(cmd + ' ');
            inputRef.current?.focus();
            return;
        }

        if (cmd === '/stop') {
            handleStop();
            return;
        }

        if (cmd === '/killswitch') {
            try {
                await fetch('/api/killswitch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'manual_chat', triggeredBy: 'chat_slash_command' }),
                });
                setMessages(prev => [...prev, { role: 'system', content: '🔴 **Killswitch activated** - all background tasks have been halted.' }]);
            } catch {
                setMessages(prev => [...prev, { role: 'system', content: '⚠️ Killswitch call failed. Try the button in the Autopilot panel.' }]);
            }
            return;
        }

        setInput(cmd + ' ');
        inputRef.current?.focus();
    };

    const handleNewSession = async () => {
        // Don't create a session yet — create it lazily when the first message is sent.
        // This prevents empty "0 messages" sessions appearing in history on refresh.
        // NOTE: We intentionally do NOT clear active-session.json here.
        // When the user navigates away and returns, they should see the last session
        // they actually communicated in — not a blank welcome screen.
        // active-session.json is only updated when a message is actually sent.
        setSessionId(null);
        // Refresh sessions list so history panel is up to date
        try { setSessions(await listSessions()); } catch { /* non-critical */ }
        setMessages([getWelcomeMessage(selectedAgent !== 'skales' ? selectedAgent : null)]);
        setShowSessions(false);
    };

    const handleLoadSession = async (id: string) => {
        try {
            const session = await loadSession(id);
            if (session) {
                setSessionId(session.id);
                await setActiveSessionId(session.id); // Persist
                if (session.messages.length > 0) {
                    // Limit to last 80 messages for large sessions to prevent render bottlenecks
                    const msgsToShow = session.messages.length > 80
                        ? session.messages.slice(-80)
                        : session.messages;
                    let displayMsgs: DisplayMessage[];
                    try {
                        displayMsgs = reconstructDisplayMessages(msgsToShow);
                    } catch (reconstructErr) {
                        console.warn('[Skales] reconstructDisplayMessages failed, showing raw messages:', reconstructErr);
                        displayMsgs = msgsToShow
                            .filter(m => m.role === 'user' || m.role === 'assistant')
                            .map(m => ({ role: m.role as any, content: m.content || '', timestamp: m.timestamp }));
                    }
                    // Prepend a notice if we clipped the session
                    if (session.messages.length > 80) {
                        displayMsgs.unshift({
                            role: 'system',
                            content: `📂 **Session loaded** - showing last 80 of ${session.messages.length} messages to keep things fast. Full history is saved.`,
                        });
                    }
                    setMessages(displayMsgs);
                } else {
                    setMessages([getWelcomeMessage()]);
                }
                // Refresh sessions list so messageCount and updatedAt are current
                try { setSessions(await listSessions()); } catch { /* non-critical */ }
            } else {
                // Session file not found — refresh list to remove stale entry
                try { setSessions(await listSessions()); } catch { /* non-critical */ }
                setMessages([{ role: 'system', content: '⚠️ Session could not be loaded. It may have been deleted or moved.' }]);
            }
            setShowSessions(false);
        } catch (e) {
            console.error('Failed to load session:', e);
            setMessages([{ role: 'system', content: '⚠️ Failed to load session. Please try again or start a new chat.' }]);
            setShowSessions(false);
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this session?')) return;
        try {
            await deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (sessionId === id) {
                // ── FIX: Input-Field Lock ──────────────────────────────────────
                // Reset ALL stateful UI that could block the input after deletion.
                // Without this reset, stale `loading` or `pendingApproval` state
                // from the deleted session would keep the input permanently locked.
                setSessionId(null);
                setMessages([{ role: 'assistant', content: t('chat.sessionDeleted') }]);
                setLoading(false);
                setInput('');
                setPastedImage(null);
                setAttachedFile(null);
                setPendingApproval(null);
                setIsMultiAgentRunning(false);
                setMessageQueue([]);
                setShowSessions(false);
                // Re-focus the input after state reset so it's immediately usable
                // Bug 18 fix: double-tap focus — first after microtask, second after paint
                setTimeout(() => inputRef.current?.focus(), 100);
                setTimeout(() => inputRef.current?.focus(), 300);
            }
        } catch (e) {
            console.error('Failed to delete session:', e);
        }
    };

    const handleAgentSwitch = async (agentId: string) => {
        setSelectedAgent(agentId);
        setShowAgentDropdown(false);

        const agent = agents.find(a => a.id === agentId);
        const name = agentId === 'skales' ? 'Skales' : (agent?.name || 'Unknown');
        const emoji = agentId === 'skales' ? '🦎' : (agent?.emoji || '🤖');

        // Load the most recent session for this specific agent
        try {
            const agentSessions = await listSessionsByAgent(agentId);
            if (agentSessions.length > 0) {
                const lastSession = await loadSession(agentSessions[0].id);
                if (lastSession && lastSession.messages.length > 0) {
                    setSessionId(lastSession.id);
                    const msgsToShow = lastSession.messages.length > 80
                        ? lastSession.messages.slice(-80)
                        : lastSession.messages;
                    setMessages(reconstructDisplayMessages(msgsToShow));
                    setSessions(await listSessions());
                    return; // Session loaded, no welcome message needed
                }
            }
        } catch (e) {
            console.error('Failed to load agent sessions:', e);
        }

        // No session found for this agent — show welcome
        setSessionId(null);
        setMessages([
            { role: 'system', content: `${emoji} Switched to **${name}**. Ready to help!` },
            getWelcomeMessage(agentId !== 'skales' ? agentId : null),
        ]);
    };

    const handleSend = async (overrideText?: string) => {
        // overrideText is used when auto-processing a queued message (bypasses input state)
        const rawText = overrideText !== undefined ? overrideText : input.trim();
        // Allow send if either text or attached file is present
        if (!rawText && !attachedFile) return;

        // Build the full text: prepend attached file as a code block if present
        let text = rawText;
        if (attachedFile && overrideText === undefined) {
            const fileBlock = `[📄 ${attachedFile.name}]\n\`\`\`${attachedFile.ext}\n${attachedFile.content}\n\`\`\``;
            text = rawText ? `${fileBlock}\n\n${rawText}` : `${fileBlock}\n\nPlease analyze this file.`;
            setAttachedFile(null);
        }
        if (!text) return;

        // If currently processing: queue the message instead of dropping or interrupting.
        // This fixes the core bug where messages were silently dropped while loading.
        if (loading) {
            if (messageQueue.length >= 20) {
                // Queue full — show a subtle indicator (message is not accepted)
                return;
            }
            // Clear the input field so the user sees their message was accepted
            if (overrideText === undefined) setInput('');
            setMessageQueue(prev => [...prev, text]);
            return;
        }

        // Handle slash commands
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.split(' ');
            if (cmd === '/clear') {
                setMessages([]);
                setInput('');
                return;
            }
            if (cmd === '/new') {
                handleNewSession();
                return;
            }
        }

        if (text.startsWith('/persona ')) {
            const persona = text.replace('/persona ', '').trim();
            setInput('');
            setMessages(prev => [...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: `Switched to **${persona}** mode! My personality is adjusted. 🎭` }
            ]);
            return;
        }

        if (text.startsWith('/model ')) {
            const model = text.replace('/model ', '').trim();
            setInput('');
            setMessages(prev => [...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: `Model changed to **${model}**. Using it for future messages. ⚙️` }
            ]);
            return;
        }

        setInput('');
        const userMsg: DisplayMessage = { role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        // Track local history for loop (since state update is async)
        let currentMessages: DisplayMessage[] = [...messages, userMsg];
        let loopCount = 0;
        const MAX_LOOPS = 20;
        let currentSessionId = sessionId;

        const currentAbortController = new AbortController();
        // unique naming to avoid collision if I made a global ref, but here I'll use a ref
        abortControllerRef.current = currentAbortController;

        try {
            // Ensure session exists (lazy creation — no empty sessions in history)
            if (!currentSessionId) {
                const newSession = await createSession(text.slice(0, 60), selectedAgent);
                setSessionId(newSession.id);
                currentSessionId = newSession.id;
                // Persist as active session so Telegram routes messages here too
                await setActiveSessionId(newSession.id);
                setSessions(prev => [{ id: newSession.id, title: newSession.title, updatedAt: newSession.updatedAt, messageCount: 0 }, ...prev]);
            } else {
                // Also update active-session.json for existing sessions — ensures navigation works correctly
                await setActiveSessionId(currentSessionId);
            }

            // ── GHOSTING FIX: Save user message immediately so navigating away & back restores context ──
            if (currentSessionId) {
                const session = await loadSession(currentSessionId);
                if (session) {
                    if (!session.messages.find(m => m.role === 'user' && m.content === text)) {
                        session.messages.push({ role: 'user', content: text, timestamp: Date.now() });
                        await saveSession(session);
                    }
                }
            }

            // Determine system prompt override and provider/model for custom agents
            let systemPromptOverride: string | undefined;
            let agentProvider: string | undefined;
            let agentModel: string | undefined;
            if (selectedAgent !== 'skales') {
                const agent = agents.find(a => a.id === selectedAgent);
                if (agent) {
                    systemPromptOverride = agent.systemPrompt;
                    agentProvider = agent.provider || undefined;
                    agentModel = agent.model || undefined;
                }
            }

            // ─── PRE-ANALYSIS: Auto-route complex tasks to Multi-Agent ──
            // Only apply routing for the main Skales agent (not custom agents with their own prompts).
            // If the task looks like it involves multiple independent items, inject a FORCE_DISPATCH
            // directive into the system prompt so the LLM immediately calls dispatch_subtasks
            // instead of grinding through items sequentially in chat.
            if (selectedAgent === 'skales') {
                try {
                    const routing = await analyzeTaskComplexity(rawText);
                    if (routing.shouldDispatch) {
                        // Inject a strong directive — the LLM will see this at the start of the context
                        // and call dispatch_subtasks as its very first action.
                        const dispatchDirective = `\n\n⚡ AUTO-ROUTING ACTIVE: The system detected this as a multi-item parallel job (${routing.reason}).\nCRITICAL - Your VERY FIRST action MUST be to call dispatch_subtasks.\n- Do NOT process any items inline in chat.\n- Build one subtask per independent item.\n- First say: "🦁 Dispatching this as a Multi-Agent job so your chat stays free - check the Tasks tab for live progress!"\n- Then immediately call dispatch_subtasks with the full list of subtasks.`;
                        systemPromptOverride = (systemPromptOverride || '') + dispatchDirective;
                    }
                } catch {
                    // Routing analysis failure is non-fatal — continue with normal chat
                }
            }

            // ─── AGENT LOOP ──────────────────────────────────────────
            while (loopCount < MAX_LOOPS) {
                if (abortControllerRef.current?.signal.aborted) break;
                loopCount++;

                // Show "Thinking..." status (remove old matching statuses first)
                setMessages(prev => [
                    ...prev.filter(m => m.role !== 'tool-status'),
                    {
                        role: 'tool-status',
                        content: loopCount > 1 ? `Thinking... (step ${loopCount}/${MAX_LOOPS})` : t('chat.thinking'),
                        toolsExecuting: ['thinking'],
                    }
                ]);

                // Prepare API messages — trim to last 40 to stay well under the 10MB body limit
                // and avoid sending massive histories to the LLM on every loop.
                // Filter out UI-only roles ('tool-status', 'system') so that agentDecide always
                // rebuilds the full identity/memory context from human.json + soul.json.
                // (UI system messages like "/help" output or model-switch notices must not
                //  replace the real system prompt inside the orchestrator.)
                const apiMessages = currentMessages
                    .filter(m => m.role !== 'tool-status' && m.role !== 'system')
                    .slice(-40)
                    .map(m => ({
                        role: m.role as string,
                        content: m.content,
                        tool_calls: m.toolCalls?.map((tc: any) => ({ ...tc, type: 'function' as const })),
                        tool_call_id: m.toolCallId
                    }));

                // 1. DECIDE (with 60s inactivity timeout to prevent frozen UI)
                const DECIDE_TIMEOUT_MS = 60_000;
                let decision: Awaited<ReturnType<typeof agentDecide>>;
                try {
                    decision = await Promise.race([
                        agentDecide(apiMessages as any, {
                            systemPrompt: systemPromptOverride,
                            provider: agentProvider as any,
                            model: agentModel,
                        }),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('STREAM_TIMEOUT')), DECIDE_TIMEOUT_MS)
                        ),
                    ]);
                } catch (timeoutErr: any) {
                    if (timeoutErr?.message === 'STREAM_TIMEOUT') {
                        setMessages(prev => [
                            ...prev.filter(m => m.role !== 'tool-status'),
                            { role: 'assistant', content: '⚠️ Response timed out after 60 seconds. Try again or start a new chat.' }
                        ]);
                        break;
                    }
                    throw timeoutErr;
                }

                if (decision.decision === 'error') {
                    setMessages(prev => [
                        ...prev.filter(m => m.role !== 'tool-status'),
                        { role: 'assistant', content: `⚠️ Error: ${resolveError(decision.error)}` }
                    ]);
                    break;
                }

                if (decision.decision === 'response') {
                    // FINAL RESPONSE
                    const assistantMsg: DisplayMessage = {
                        role: 'assistant',
                        content: decision.response || '',
                        tokensUsed: decision.tokensUsed,
                        model: decision.model,
                        timestamp: Date.now(),
                        memoriesRecalled: decision.memoriesRecalled,
                    };

                    // Update UI
                    setMessages(prev => [
                        ...prev.filter(m => m.role !== 'tool-status'),
                        assistantMsg
                    ]);

                    // Sync to Session (User msg + Assistant msg)
                    if (currentSessionId) {
                        const session = await loadSession(currentSessionId);
                        if (session) {
                            session.messages.push({
                                role: 'assistant',
                                content: assistantMsg.content,
                                timestamp: Date.now(),
                                // Persist token count + model so they survive session reload
                                ...(assistantMsg.tokensUsed ? { tokensUsed: assistantMsg.tokensUsed } : {}),
                                ...(assistantMsg.model ? { model: assistantMsg.model } : {}),
                            } as any);
                            await saveSession(session);
                        }
                    }

                    // Auto-extract memories from this interaction (fire-and-forget)
                    // Works even if the model doesn't support tool calling (e.g. minimax)
                    extractMemoriesFromInteraction(text, assistantMsg.content, settings).catch(() => { });

                    break;

                }

                if (decision.decision === 'tool') {
                    // 2. SHOW TOOL PLAN
                    const toolNames = decision.toolCalls!.map(t => t.function.name);
                    const assistantMsg: DisplayMessage = {
                        role: 'assistant',
                        content: decision.response || '',  // The "thought" before actions
                        toolCalls: decision.toolCalls,
                        model: decision.model,
                        tokensUsed: decision.tokensUsed,
                        timestamp: Date.now(),
                    };

                    currentMessages.push(assistantMsg);

                    // Update UI: Show thought + "Executing..." status
                    setMessages(prev => [
                        ...prev.filter(m => m.role !== 'tool-status'),
                        assistantMsg,
                        {
                            role: 'tool-status',
                            content: `Executing ${toolNames.join(', ')}...`,
                            toolsExecuting: toolNames
                        }
                    ]);

                    // SAVE TO SESSION: Assistant Message (Tool Plan)
                    if (currentSessionId) {
                        const sess = await loadSession(currentSessionId);
                        if (sess) {
                            sess.messages.push({
                                role: 'assistant',
                                content: decision.response || '',
                                tool_calls: decision.toolCalls,
                                timestamp: Date.now(),
                                // Persist so they survive session reload
                                ...(decision.tokensUsed ? { tokensUsed: decision.tokensUsed } : {}),
                                ...(decision.model ? { model: decision.model } : {}),
                            } as any);
                            await saveSession(sess);
                        }
                    }

                    // 3. EXECUTE TOOLS (with approval gate support)
                    // First pass: run without any confirmed IDs to discover which need approval
                    const firstPassResults = await agentExecute(decision.toolCalls!, []);
                    const needingApproval = firstPassResults.filter(r => r.requiresConfirmation);
                    let results: typeof firstPassResults;

                    if (needingApproval.length > 0) {
                        // Pause execution — show approval bubble
                        const pendingIds = decision.toolCalls!
                            .filter((_, i) => firstPassResults[i]?.requiresConfirmation)
                            .map(tc => tc.id);
                        const pendingMsgs = needingApproval.map(r => r.confirmationMessage || r.displayMessage);

                        // Update UI to show partial results already executed
                        const alreadyDone = firstPassResults.filter(r => !r.requiresConfirmation);
                        if (alreadyDone.length > 0) {
                            assistantMsg.toolResults = alreadyDone;
                            setMessages(prev => prev.map(m =>
                                (m === assistantMsg || (m.role === 'assistant' && m.toolCalls === decision.toolCalls))
                                    ? { ...m, toolResults: alreadyDone }
                                    : m
                            ));
                        }

                        // Store pending state — the approval bubble renders from this
                        setPendingApproval({
                            toolCalls: decision.toolCalls!,
                            confirmedIds: decision.toolCalls!
                                .filter((_, i) => !firstPassResults[i]?.requiresConfirmation)
                                .map(tc => tc.id),
                            pendingIds,
                            messages: pendingMsgs,
                        });

                        setMessages(prev => [
                            ...prev.filter(m => m.role !== 'tool-status'),
                        ]);
                        setLoading(false);
                        return; // pause the agent loop - user must approve to continue
                    }

                    results = firstPassResults;

                    // Detect multi-agent dispatch
                    const multiAgentResult = results.find(r => r.toolName === 'dispatch_subtasks' && r.success);
                    if (multiAgentResult) {
                        const jobName = multiAgentResult.result?.parentTitle || 'Multi-Agent Job';
                        setIsMultiAgentRunning(true);
                        setMultiAgentJobName(jobName);
                    }

                    // 4. SHOW RESULTS (Update the assistant message in local history)
                    assistantMsg.toolResults = results;

                    // Update UI: Re-render the assistant message with results attached
                    setMessages(prev => {
                        const next = [...prev];
                        return next.map(m => {
                            if (m === assistantMsg) {
                                return { ...m, toolResults: results };
                            }
                            if (m.role === 'assistant' && m.toolCalls === decision.toolCalls) {
                                return { ...m, toolResults: results };
                            }
                            return m;
                        });
                    });

                    // ── IMAGE GENERATION EARLY EXIT ─────────────────────────────────
                    // If generate_image succeeded, show the image inline and stop the loop.
                    // Without this guard the LLM sometimes re-calls generate_image on the
                    // next iteration, causing an endless "Generating…" loop until MAX_LOOPS.
                    const imageGenResult = results.find(r => r.toolName === 'generate_image' && r.success);
                    if (imageGenResult) {
                        const imgFilename = imageGenResult.result?.filename as string | undefined;
                        // Try to extract the original prompt from the tool call arguments
                        let imgPrompt = '';
                        try {
                            const imgToolCall = decision.toolCalls?.find(tc => tc.function.name === 'generate_image');
                            if (imgToolCall) imgPrompt = JSON.parse(imgToolCall.function.arguments).prompt || '';
                        } catch { /* ignore parse errors */ }

                        const imgMsg: DisplayMessage = {
                            role: 'assistant',
                            content: imgPrompt ? `🖼️ Here's your image: **"${imgPrompt}"**` : '🖼️ Image generated!',
                            imageUrl: imgFilename ? `/api/file?path=${encodeURIComponent('images/' + imgFilename)}` : undefined,
                            timestamp: Date.now(),
                        };
                        setMessages(prev => [...prev.filter(m => m.role !== 'tool-status'), imgMsg]);

                        if (currentSessionId) {
                            const sess = await loadSession(currentSessionId);
                            if (sess) {
                                sess.messages.push({ role: 'assistant', content: imgMsg.content, timestamp: Date.now(), source: 'browser' } as any);
                                lastBuddyMsgCountRef.current = sess.messages.length;
                                await saveSession(sess);
                            }
                        }
                        break; // ← stop the agent loop; image is shown
                    }

                    // 5. UPDATE HISTORY for next loop
                    // Add tool outputs as hidden messages for the LLM context
                    const toolMsgs: DisplayMessage[] = results.map((res, i) => ({
                        role: 'tool',
                        toolCallId: decision.toolCalls![i].id,
                        content: JSON.stringify(res.result),
                    }));
                    currentMessages.push(...toolMsgs);
                    // Prevent in-loop history from growing unbounded
                    if (currentMessages.length > 80) {
                        currentMessages = currentMessages.slice(-60);
                    }

                    // SAVE TO SESSION: Tool Results
                    if (currentSessionId) {
                        const sess = await loadSession(currentSessionId);
                        if (sess) {
                            results.forEach((res, i) => {
                                sess.messages.push({
                                    role: 'tool',
                                    tool_call_id: decision.toolCalls![i].id,
                                    name: decision.toolCalls![i].function.name,
                                    content: JSON.stringify(res.result),
                                    display_message: res.displayMessage,
                                    timestamp: Date.now()
                                });
                            });
                            await saveSession(sess);
                        }
                    }

                    // Loop continues to step 1 (Decide) with new history
                }
            }

            // ── CLEANUP: Remove any lingering tool-status bubble after loop ends ──
            // If we hit MAX_LOOPS without a final response, show a handover message
            setMessages(prev => {
                const hasToolStatus = prev.some(m => m.role === 'tool-status');
                if (!hasToolStatus) return prev;
                const cleaned = prev.filter(m => m.role !== 'tool-status');
                if (loopCount >= MAX_LOOPS) {
                    cleaned.push({
                        role: 'assistant',
                        content: `⚠️ Reached the step limit (${MAX_LOOPS} steps). Progress has been saved - ask me to continue and I'll pick up where I left off.`,
                    });
                }
                return cleaned;
            });

        } catch (err: any) {
            console.error('Agent loop failed:', err);
            setMessages(prev => [
                ...prev.filter(m => m.role !== 'tool-status'),
                {
                    role: 'assistant',
                    content: "⚠️ Connection error. Please try again."
                }
            ]);
        } finally {
            setLoading(false);
            // If multi-agent was running, clear the flag
            setIsMultiAgentRunning(false);
            setMultiAgentJobName('');
            // Auto-processing of the next queued message is handled by
            // the useEffect below that watches the `loading` state.
        }
    };

    // ── Auto-process queued messages ──────────────────────────
    // When `loading` transitions from true → false, check if there's a
    // queued message and automatically start processing it.
    // This is the core mechanism that makes the queue work end-to-end.
    useEffect(() => {
        if (!loading && messageQueue.length > 0) {
            const nextMsg = messageQueue[0];
            // Remove from queue BEFORE processing to prevent double-sends
            setMessageQueue(prev => prev.slice(1));
            // Small delay to let React flush all state updates from the previous response
            // before kicking off the next one (avoids stale session state reads)
            setTimeout(() => handleSend(nextMsg), 80);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    // ── Bug 18: Restore input focus after loading completes ──────────────────
    // When a response finishes (loading → false) or media arrives (e.g. Telegram GIF),
    // the input can lose focus. This ensures it's always re-focusable.
    useEffect(() => {
        if (!loading && !pendingApproval) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [loading, pendingApproval, messages.length]);

    // ─── Replicate Model Catalogue ───────────────────────────────
    const REPLICATE_IMAGE_MODELS = [
        { id: 'black-forest-labs/flux-1.1-pro',       name: 'Flux 1.1 Pro',        description: 'High quality, fast' },
        { id: 'black-forest-labs/flux-schnell',        name: 'Flux Schnell',         description: 'Fastest, good quality' },
        { id: 'stability-ai/sdxl',                    name: 'Stable Diffusion XL',  description: 'Classic, versatile' },
        { id: 'bytedance/sdxl-lightning-4step',       name: 'SDXL Lightning',       description: 'Ultra fast, 4 steps' },
    ] as const;

    const REPLICATE_VIDEO_MODELS = [
        { id: 'minimax/video-01',        name: 'MiniMax Video',  description: 'Text to video' },
        { id: 'tencent/hunyuan-video',   name: 'HunyuanVideo',   description: 'Open source video gen' },
    ] as const;

    // ─── Replicate Generation Handler ────────────────────────────
    const handleGenerateReplicate = async () => {
        if (!genPrompt.trim() || genLoading) return;
        setGenLoading(true);
        const prompt = genPrompt.trim();
        const modelId = replicateUseCustom
            ? replicateCustomModel.trim()
            : (genMode === 'image' ? replicateImageModelId : replicateVideoModelId);

        if (!modelId) {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Please select or enter a model.' }]);
            setGenLoading(false);
            return;
        }

        setMessages(prev => [...prev, {
            role: 'user',
            content: `${genMode === 'image' ? '🖼️' : '🎬'} Generate ${genMode} via Replicate (${modelId}): "${prompt}"`,
        }]);
        setMessages(prev => [...prev, {
            role: 'tool-status',
            content: `⚡ Generating with Replicate · ${modelId}…`,
        }]);

        try {
            const res = await fetch('/api/replicate/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelId,
                    input: { prompt },
                    type: genMode,
                }),
            });
            const data = await res.json();

            setMessages(prev => prev.filter(m => m.role !== 'tool-status'));

            if (!data.success || !data.outputUrl) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ ${data.error || 'Generation failed'}`,
                }]);
            } else if (genMode === 'image') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🖼️ **Generated Image** - "${prompt}"\n![Generated image](${data.outputUrl})\n\n*Model: ${modelId} · Powered by Replicate*`,
                    imageUrl: data.outputUrl,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🎬 **Generated Video** - "${prompt}"\n\n📹 [Open Video](${data.outputUrl})\n\n*Model: ${modelId} · Powered by Replicate*`,
                }]);
            }
        } catch (err: any) {
            setMessages(prev => prev.filter(m => m.role !== 'tool-status'));
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Replicate generation failed: ${err.message}`,
            }]);
        }

        setGenPrompt('');
        setGenLoading(false);
    };

    // ─── Generation Handler (Image / Video) ─────────────────────
    const handleGenerate = async () => {
        if (!genPrompt.trim() || genLoading) return;
        setGenLoading(true);
        const prompt = genPrompt.trim();

        if (genMode === 'image') {
            // Show user's request in chat
            setMessages(prev => [...prev, {
                role: 'user',
                content: `🖼️ Generate image: "${prompt}" (${genImageStyle}, ${genImageRatio})`
            }]);
            setMessages(prev => [...prev, {
                role: 'tool-status',
                content: `🎨 Generating with ${genImageModel === 'pro' ? 'Nano Banana Pro (Imagen 3)' : 'Nano Banana (Gemini Flash)'}...`
            }]);

            const result = await generateImage({
                prompt,
                style: genImageStyle,
                aspectRatio: genImageRatio,
                nanoBananaModel: genImageModel,
            });

            setMessages(prev => prev.filter(m => m.role !== 'tool-status'));

            if (!result.success || !result.images?.length) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Image generation failed: ${result.error || 'Unknown error'}\n\nMake sure your **Google AI API key** is set in Settings → AI Provider → Google.`
                }]);
            } else {
                const img = result.images[0];
                const dataUrl = `data:${img.mimeType};base64,${img.base64}`;
                const savedNote = img.filename
                    ? `\n💾 Saved: \`workspace/files/images/${img.filename}\``
                    : '';
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🖼️ **Generated Image** - "${prompt}"\n![Generated image](${dataUrl})\n\n*Style: ${genImageStyle} · Ratio: ${genImageRatio} · ${genImageModel === 'pro' ? 'Nano Banana Pro (Imagen 3)' : 'Nano Banana (Gemini Flash)'}*${savedNote}`,
                    imageUrl: dataUrl,
                }]);
            }
            setGenPrompt('');
        } else {
            // Video generation — start then poll
            setMessages(prev => [...prev, {
                role: 'user',
                content: `🎬 Generate video: "${prompt}" (${genVideoRatio}, ${genVideoDuration}s)`
            }]);
            setMessages(prev => [...prev, {
                role: 'tool-status',
                content: '🎬 Starting video generation with Google Veo 2... (this takes 1–3 minutes)'
            }]);

            const startResult = await startVideoGeneration({
                prompt,
                aspectRatio: genVideoRatio,
                durationSeconds: genVideoDuration,
            });

            if (!startResult.success || !startResult.operationName) {
                setMessages(prev => prev.filter(m => m.role !== 'tool-status'));
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Video generation failed to start: ${startResult.error || 'Unknown error'}\n\nMake sure your **Google AI API key** is set in Settings → AI Provider → Google.`
                }]);
                setGenLoading(false);
                return;
            }

            const opName = startResult.operationName;
            setGenOperationName(opName);
            setGenPrompt('');

            // Poll every 8 seconds.
            // Wrapped in try/catch: if the network is unavailable (tab was
            // suspended by the OS) the rejection is caught and retried rather
            // than crashing the entire React tree.
            const poll = async () => {
                try {
                    const pollResult = await pollVideoGeneration(opName);
                    if (pollResult.status === 'pending') {
                        setTimeout(poll, 8000);
                    } else {
                        setMessages(prev => prev.filter(m => m.role !== 'tool-status'));
                        setGenOperationName(null);
                        if (pollResult.success && (pollResult.videoUri || pollResult.filename)) {
                            const videoContent = pollResult.filename
                                ? `VIDEO_FILE:videos/${pollResult.filename}|${prompt}`
                                : `🎬 **Generated Video** - "${prompt}"\n\n📹 [Open Video](${pollResult.videoUri})\n\n*Ratio: ${genVideoRatio} · Duration: ${genVideoDuration}s · Powered by Google Veo*`;
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: videoContent,
                            }]);
                        } else {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `❌ Video generation failed: ${pollResult.error || 'Unknown error'}`
                            }]);
                        }
                        setGenLoading(false);
                    }
                } catch {
                    // Network error (tab woke up, request failed) — retry in 10s
                    setTimeout(poll, 10_000);
                }
            };
            setTimeout(poll, 8000);
            return; // Don't set genLoading to false yet - poll handles it
        }

        setGenLoading(false);
    };

    // Summarize handler — toggle on/off like the slash command button
    const isSummarizeActive = input.startsWith('Summarize this (URL, Text..): ');
    const handleSummarize = () => {
        if (isSummarizeActive) {
            // Toggle OFF — remove the prefix
            const afterPrefix = input.replace('Summarize this (URL, Text..): ', '');
            setInput(afterPrefix);
        } else {
            // Toggle ON — prefix the current input
            const text = input.trim();
            if (text) {
                setInput(`Summarize this (URL, Text..): ${text}`);
            } else {
                setInput('Summarize this (URL, Text..): ');
            }
        }
        setTimeout(() => inputRef.current?.focus(), 30);
    };

    // NOTE: NOT wrapped in useCallback — handleSend/handleSendWithImage close over `input` state.
    // useCallback with [pastedImage] dependency would capture a stale handleSend (with empty input).
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (pastedImage) {
                handleSendWithImage();
            } else {
                handleSend();
            }
        }
    };

    // ── Clipboard Image Paste ──────────────────────────────────
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = Array.from(e.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (imageItem) {
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                setPastedImage(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // Send message — with optional image (Vision)
    const handleSendWithImage = async () => {
        if (pastedImage) {
            const rawCaption = input.trim();
            // If there's also an attached file, prepend its content to the caption
            let caption = rawCaption;
            if (attachedFile) {
                const fileBlock = `[📄 ${attachedFile.name}]\n\`\`\`${attachedFile.ext}\n${attachedFile.content}\n\`\`\``;
                caption = rawCaption ? `${fileBlock}\n\n${rawCaption}` : fileBlock;
                setAttachedFile(null);
            }
            // Show image in UI
            const imgMsg: DisplayMessage = {
                role: 'user',
                content: caption || '📎 Bild analysieren',
                imageUrl: pastedImage,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, imgMsg]);
            setPastedImage(null);
            setInput('');
            setShowSlash(false);
            setLoading(true);

            // Build vision message for the API (OpenAI vision format)
            const visionContent: any[] = [];
            if (caption) visionContent.push({ type: 'text', text: caption });
            visionContent.push({
                type: 'image_url',
                image_url: { url: pastedImage, detail: 'high' },
            });
            if (!caption) visionContent.push({ type: 'text', text: 'Analyze this image and describe what you see. Also extract any text that is visible.' });

            let currentSessionId = sessionId;
            const abortCtrl = new AbortController();
            abortControllerRef.current = abortCtrl;

            try {
                if (!currentSessionId) {
                    const newSession = await createSession(caption || 'Image analysis', selectedAgent);
                    setSessionId(newSession.id);
                    currentSessionId = newSession.id;
                    await setActiveSessionId(newSession.id);
                    setSessions(prev => [{ id: newSession.id, title: newSession.title, updatedAt: newSession.updatedAt, messageCount: 0 }, ...prev]);
                } else {
                    await setActiveSessionId(currentSessionId);
                }

                // Build history without the image msg (it's display-only)
                const apiMessages = messages
                    .filter(m => m.role !== 'tool-status' && m.role !== 'tool')
                    .map(m => ({ role: m.role as string, content: m.content }));

                // Append vision message
                apiMessages.push({ role: 'user', content: visionContent as any });

                // Show which provider is actually active (not just configured)
                const activeProvider = settings?.activeProvider || 'openrouter';
                const providerVisionLabels: Record<string, string> = {
                    ollama:      '🦙 Vision via Ollama (local)',
                    google:      '✨ Vision via Google Gemini',
                    openrouter:  '🌐 Vision via OpenRouter',
                    openai:      '🤖 Vision via OpenAI',
                    anthropic:   '🧠 Vision via Anthropic',
                    groq:        '⚡ Vision via Groq',
                };
                const visionNote = providerVisionLabels[activeProvider] || '🖼️ Analysiere Bild...';
                setMessages(prev => [
                    ...prev.filter(m => m.role !== 'tool-status'),
                    { role: 'tool-status', content: visionNote, toolsExecuting: ['vision'] }
                ]);

                const decision = await agentDecide(apiMessages as any, {
                    provider: selectedAgent !== 'skales' ? agents.find(a => a.id === selectedAgent)?.provider as any : undefined,
                    model: selectedAgent !== 'skales' ? agents.find(a => a.id === selectedAgent)?.model : undefined,
                    forceVision: true, // Auto-switch to vision-capable model if needed
                    noTools: true,     // Don't offer tools - model must analyze the image directly
                });

                // Better error message for vision issues
                let errorContent = `⚠️ Error: ${resolveError(decision.error)}`;
                const errLower = resolveError(decision.error).toLowerCase();
                if (errLower.includes('no endpoints') || errLower.includes('image input') || errLower.includes('image_url')) {
                    errorContent = `🖼️ **Vision not available for the current model.**\n\nSwitch to a vision-capable model in **Settings → AI Provider**:\n- OpenRouter: \`openai/gpt-4o-mini\`\n- OpenAI: \`gpt-4o-mini\`\n- Anthropic: \`claude-3-5-haiku-20241022\`\n- Google: \`gemini-2.0-flash\``;
                } else if (errLower.includes('model') && (errLower.includes('not found') || errLower.includes('pull') || errLower.includes('does not exist'))) {
                    // Ollama: model not installed
                    errorContent = `🦙 **Vision model not installed in Ollama.**\n\nTo use vision locally, install a vision model:\n\`\`\`\nollama pull llava\n\`\`\`\nOr switch to **Google Gemini** (free) or **OpenAI** in Settings → AI Provider.\n\nℹ️ Google Gemini Flash supports vision for free - just add a Google API key in Settings.`;
                } else if (errLower.includes('api key') || errLower.includes('apikey') || errLower.includes('unauthorized') || errLower.includes('401')) {
                    errorContent = `🔑 **No API key for vision provider.**\n\nVision requires a configured provider. Go to **Settings → AI Provider** and add:\n- Google API key (Gemini Flash - free tier available)\n- OpenAI API key (GPT-4o-mini)\n- Or install Ollama with \`ollama pull llava\``;
                }

                const assistantMsg: DisplayMessage = {
                    role: 'assistant',
                    content: decision.decision === 'error'
                        ? errorContent
                        : (decision.response || ''),
                    tokensUsed: decision.tokensUsed,
                    model: decision.model,
                };

                setMessages(prev => [
                    ...prev.filter(m => m.role !== 'tool-status'),
                    assistantMsg
                ]);

                // Save to session — mark source:'browser' so buddy polling doesn't re-inject these
                if (currentSessionId) {
                    const sess = await loadSession(currentSessionId);
                    if (sess) {
                        const savedCount = sess.messages.length;
                        sess.messages.push({ role: 'user', content: caption || '[Image]', timestamp: Date.now(), source: 'browser' } as any);
                        sess.messages.push({ role: 'assistant', content: assistantMsg.content, timestamp: Date.now(), source: 'browser' } as any);
                        await saveSession(sess);
                        // Keep buddy poll baseline in sync so these don't re-appear as buddy msgs
                        lastBuddyMsgCountRef.current = savedCount + 2;
                    }
                }
            } catch (err: any) {
                setMessages(prev => [
                    ...prev.filter(m => m.role !== 'tool-status'),
                    { role: 'assistant', content: '⚠️ Bild konnte nicht analysiert werden.' }
                ]);
            } finally {
                setLoading(false);
            }
            return;
        }
        handleSend();
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ── Images: route through the same vision/paste flow as Ctrl+V ──
        // This ensures uploaded images go to the LLM with full multimodal
        // context instead of hitting the old dead-end "coming soon" branch.
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                if (dataUrl) {
                    setPastedImage(dataUrl);
                    inputRef.current?.focus();
                }
            };
            reader.readAsDataURL(file);
            e.target.value = '';
            return;
        }

        // ── PDF: try server-side text extraction ──
        if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target?.result as string;
                const sizeKb = (file.size / 1024).toFixed(1);
                setFileError(`⏳ Extracting text from ${file.name}...`);
                const result = await extractPdfText(base64);
                if (result.success && result.text) {
                    setAttachedFile({ name: file.name, ext: 'pdf', content: result.text, sizeKb });
                    setFileError(null);
                } else {
                    // Text extraction failed — auto-save the PDF to workspace so Skales can reference it,
                    // and keep a stub chip visible so the file doesn't silently disappear.
                    const saveResult = await savePdfToWorkspace(base64, file.name);
                    const savedNote = saveResult.success
                        ? `PDF saved to Workspace at: ${saveResult.relativePath}`
                        : 'Could not auto-save PDF to Workspace.';
                    // Keep the file visible as a chip — stub content tells Skales where the file is
                    setAttachedFile({
                        name: file.name,
                        ext: 'pdf',
                        content: `[PDF attached - text extraction unavailable. ${savedNote}. ${result.error || ''} Ask Skales to read it from Workspace or paste the text here.]`,
                        sizeKb,
                    });
                    setFileError(saveResult.success
                        ? `📎 ${file.name} - couldn't extract text, but PDF was saved to Workspace. Ask Skales to read it!`
                        : `📎 ${file.name} - ${result.error || 'Could not extract text from PDF.'}`);
                    setTimeout(() => setFileError(null), 8000);
                }
            };
            reader.readAsDataURL(file);
            e.target.value = '';
            return;
        }

        // ── Text / code / markdown files: inject as context block ──
        // Show filename + content block clearly separated from the user's
        // typed message so the LLM knows what file it is reading.
        const isText = file.type.startsWith('text/') ||
            file.name.endsWith('.md') ||
            file.name.endsWith('.json') ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.ts') ||
            file.name.endsWith('.tsx') ||
            file.name.endsWith('.js') ||
            file.name.endsWith('.jsx') ||
            file.name.endsWith('.py');

        if (isText) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result as string;
                const sizeKb = (file.size / 1024).toFixed(1);
                // Limit to ~8000 chars to keep context manageable
                const truncated = content.length > 8000
                    ? content.slice(0, 8000) + '\n... [truncated - file is ' + sizeKb + ' KB]'
                    : content;
                const ext = file.name.split('.').pop() || 'txt';
                // Store as a proper attachment chip — NOT dumped into the input field
                setAttachedFile({ name: file.name, ext, content: truncated, sizeKb });
                inputRef.current?.focus();
            };
            reader.readAsText(file);
            e.target.value = '';
            return;
        }

        // ── All other file types (PDF, docx, xlsx, etc.) ──
        // Show an inline error chip near the input — NOT a fake Skales bubble
        const sizeKb = (file.size / 1024).toFixed(1);
        const ext = file.name.split('.').pop()?.toLowerCase() || '?';
        setFileError(`📎 ${file.name} (${sizeKb} KB) - .${ext} files cannot be read directly. Save the file to the Workspace and ask Skales: "Read the file ${file.name}"`);
        // Auto-dismiss after 6 seconds
        setTimeout(() => setFileError(null), 6000);
        e.target.value = '';
    };

    // ─── Render ─────────────────────────────────────────────

    const displayedSessions = showAllSessions ? sessions : sessions.slice(0, SESSION_DISPLAY_LIMIT);

    // Initial loading state — smooth animated preloader
    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6" style={{ background: 'var(--background)' }}>
                {/* Gecko logo with glow ring */}
                <div className="relative flex items-center justify-center">
                    {/* Outer spinning ring */}
                    <div className="absolute w-20 h-20 rounded-full border-2 border-transparent"
                        style={{
                            borderTopColor: '#84cc16',
                            borderRightColor: 'rgba(132,204,22,0.3)',
                            animation: 'spin 1.2s linear infinite',
                        }} />
                    {/* Middle pulsing ring */}
                    <div className="absolute w-14 h-14 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(132,204,22,0.15) 0%, transparent 70%)',
                            animation: 'pulse 2s ease-in-out infinite',
                        }} />
                    {/* Gecko icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                            background: 'linear-gradient(135deg, rgba(132,204,22,0.2) 0%, rgba(34,197,94,0.1) 100%)',
                            border: '1px solid rgba(132,204,22,0.3)',
                        }}>
                        <span className="text-2xl" style={{ animation: 'float 3s ease-in-out infinite' }}>🦎</span>
                    </div>
                </div>

                {/* Loading text + dots */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('chat.loadingText')}</p>
                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    background: '#84cc16',
                                    opacity: 0.4,
                                    animation: `bounce 1.2s ease-in-out infinite`,
                                    animationDelay: `${i * 0.15}s`,
                                }} />
                        ))}
                    </div>
                </div>

                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
                    @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity:0.4; } 40% { transform: translateY(-6px); opacity:1; } }
                    @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.95); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--background)', minHeight: '100%' }}>
            {/* Header */}
            <header className="h-14 border-b flex items-center justify-between px-6 shrink-0"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-center gap-3 select-none">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center text-sm shadow-lg shadow-lime-500/20">
                        {getActiveAgentEmoji()}
                    </div>
                    <div>
                        {/* Agent Selector Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                                className="font-bold text-sm flex items-center gap-1.5 hover:text-lime-500 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {getActiveAgentName()}
                                <Icon icon={ChevronDown} size={14} className="text-lime-500" />
                            </button>

                            {showAgentDropdown && (
                                <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-xl border shadow-xl overflow-hidden animate-scaleIn"
                                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                    {/* Skales (default) */}
                                    <button
                                        onClick={() => handleAgentSwitch('skales')}
                                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${selectedAgent === 'skales' ? 'bg-lime-500/10' : 'hover:bg-[var(--surface-light)]'}`}
                                    >
                                        <span className="text-lg">🦎</span>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: selectedAgent === 'skales' ? '#84cc16' : 'var(--text-primary)' }}>
                                                Skales (Default)
                                            </p>
                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('chat.defaultAgentDesc')}</p>
                                        </div>
                                        {selectedAgent === 'skales' && <Icon icon={Check} size={14} className="text-lime-500 ml-auto" />}
                                    </button>

                                    <div className="h-px" style={{ background: 'var(--border)' }} />

                                    {/* Agent list */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {agents.map(agent => (
                                            <button
                                                key={agent.id}
                                                onClick={() => handleAgentSwitch(agent.id)}
                                                className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${selectedAgent === agent.id ? 'bg-lime-500/10' : 'hover:bg-[var(--surface-light)]'}`}
                                            >
                                                <span className="text-lg">{agent.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate" style={{ color: selectedAgent === agent.id ? '#84cc16' : 'var(--text-primary)' }}>
                                                        {agent.name}
                                                    </p>
                                                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
                                                </div>
                                                {selectedAgent === agent.id && <Icon icon={Check} size={14} className="text-lime-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse-dot" />
                            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Tools Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleNewSession}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:bg-[var(--surface-light)]"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={t('chat.input.newSession')}
                    >
                        <Icon icon={Plus} size={14} />
                        <span className="hidden md:inline">New</span>
                    </button>
                    {/* ── Voice Chat toggle - shown when voice_chat skill is active ── */}
                    {activeSkills.includes('voice_chat') && (
                        <button
                            onClick={() => isVoiceChatMode ? exitVoiceChat() : setIsVoiceChatMode(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                            style={{
                                background:   isVoiceChatMode ? 'rgba(239,68,68,0.12)' : 'transparent',
                                border:       `1px solid ${isVoiceChatMode ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                                color:        isVoiceChatMode ? '#ef4444' : 'var(--text-secondary)',
                            }}
                            title={isVoiceChatMode ? 'Leave Voice Chat' : 'Enter Voice Chat'}
                            aria-label={isVoiceChatMode ? 'Leave Voice Chat' : 'Enter Voice Chat'}
                            aria-pressed={isVoiceChatMode}
                        >
                            <Icon icon={isVoiceChatMode ? MicOff : Mic} size={14} />
                            <span className="hidden md:inline">Voice</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowSessions(!showSessions)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:bg-[var(--surface-light)]"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={showSessions ? 'Hide session history' : 'Show session history'}
                        aria-expanded={showSessions}
                    >
                        <Icon icon={MessageCircle} size={14} />
                        <span className="hidden md:inline">History</span>
                    </button>
                </div>
            </header>

            {/* Sessions Panel */}
            {showSessions && (
                <div className="absolute right-4 top-16 z-50 w-80 rounded-2xl border shadow-xl p-4 animate-scaleIn"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sessions</h3>
                        <div className="flex items-center gap-1">
                            {/* Refresh sessions list */}
                            <button
                                onClick={async () => { try { setSessions(await listSessions()); } catch { /* ignore */ } }}
                                className="p-1 rounded-lg hover:bg-[var(--surface-light)]"
                                title={t('chat.refreshSessions')}
                                aria-label={t('chat.refreshSessions')}
                            >
                                <Icon icon={Loader2} size={13} style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <button onClick={() => setShowSessions(false)} className="p-1 rounded-lg hover:bg-[var(--surface-light)]" aria-label={t('chat.closeSessions')}>
                                <Icon icon={X} size={14} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                        {sessions.length === 0 ? (
                            <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No sessions yet</p>
                        ) : (
                            <>
                                {displayedSessions.map(s => (
                                    <div key={s.id}
                                        className={`w-full text-left p-3 rounded-xl transition-all hover:bg-[var(--surface-light)] flex items-center gap-3 group relative cursor-pointer ${sessionId === s.id ? 'border border-lime-500/30 bg-lime-500/5' : ''}`}
                                        onClick={() => handleLoadSession(s.id)}>
                                        <Icon icon={MessageCircle} size={14} style={{ color: sessionId === s.id ? '#84cc16' : 'var(--text-muted)' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.messageCount} messages · {new Date(s.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteSession(e, s.id)}
                                            className="p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                                            title={t('chat.deleteSession')}
                                        >
                                            <Icon icon={Trash2} size={12} />
                                        </button>
                                    </div>
                                ))}
                                {/* Show All / Show Less button */}
                                {sessions.length > SESSION_DISPLAY_LIMIT && (
                                    <button
                                        onClick={() => setShowAllSessions(!showAllSessions)}
                                        className="w-full text-center py-2 mt-1 rounded-lg text-xs font-medium transition-all hover:bg-[var(--surface-light)] flex items-center justify-center gap-1"
                                        style={{ color: '#84cc16' }}
                                    >
                                        <Icon icon={ChevronRight} size={12} className={`transition-transform ${showAllSessions ? 'rotate-90' : ''}`} />
                                        {showAllSessions ? 'Show Less' : `Show All (${sessions.length})`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close dropdowns */}
            {(showAgentDropdown || showSessions) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowAgentDropdown(false); setShowSessions(false); }} />
            )}

            {/* ── Multi-Agent Running Banner ── */}
            {isMultiAgentRunning && (
                <div className="mx-4 mt-2 rounded-2xl border p-3 flex items-center gap-3 animate-fadeIn shrink-0"
                    style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.35)' }}>
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Icon icon={Users} size={14} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-purple-400 truncate">
                            Multi-Agent running{multiAgentJobName ? `: ${multiAgentJobName}` : ''}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Agents working in parallel - check&nbsp;
                            <Link href="/tasks" className="text-purple-400 hover:underline font-medium">Tasks</Link>
                            &nbsp;for live status. Messages typed now are queued.
                        </p>
                    </div>
                    {messageQueue.length > 0 && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center gap-1 shrink-0">
                            <Icon icon={Clock} size={9} />
                            {messageQueue.length} queued
                        </span>
                    )}
                    <div className="flex gap-1 shrink-0">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Queued messages banner (shown after multi-agent finishes) ── */}
            {!isMultiAgentRunning && !loading && messageQueue.length > 0 && (
                <div className="mx-4 mt-2 rounded-2xl border p-3 flex items-center gap-3 animate-fadeIn shrink-0"
                    style={{ background: 'rgba(132,204,22,0.06)', borderColor: 'rgba(132,204,22,0.3)' }}>
                    <div className="w-7 h-7 rounded-lg bg-lime-500/10 flex items-center justify-center shrink-0">
                        <Icon icon={Clock} size={14} className="text-lime-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-lime-500">
                            {messageQueue.length} queued message{messageQueue.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                            {messageQueue[0]}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            const [next, ...rest] = messageQueue;
                            setMessageQueue(rest);
                            setInput(next);
                            setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-lime-500 text-black hover:bg-lime-400 transition-all shrink-0"
                    >
                        Send
                    </button>
                    <button
                        onClick={() => setMessageQueue([])}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-light)] transition-all shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Icon icon={X} size={12} />
                    </button>
                </div>
            )}

            {/* Chat Area - memoized: does NOT re-render on every keystroke */}
            <MessageListArea
                messages={messages}
                copiedIdx={copiedIdx}
                loading={loading}
                agentEmoji={agentEmoji}
                userEmoji={userEmoji}
                onCopy={handleCopy}
                scrollRef={scrollRef}
            />

            {/* ── Approval Bubble ─────────────────────────────────────────────── */}
            {pendingApproval && (
                <div
                    className="mx-auto max-w-3xl w-full px-4 md:px-6 mb-2 animate-fadeIn"
                    role="alertdialog"
                    aria-live="assertive"
                    aria-label={t('chat.approvalTitle', { count: pendingApproval.pendingIds.length, s: pendingApproval.pendingIds.length > 1 ? 's' : '' })}
                >
                    <div className="rounded-2xl border p-4 space-y-3"
                        style={{ background: 'var(--surface)', borderColor: 'rgba(251,191,36,0.5)', boxShadow: '0 0 12px rgba(251,191,36,0.12)' }}>
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#fbbf24' }}>
                            <span aria-hidden="true">⚠️</span>
                            <span>{t('chat.approvalTitle', { count: pendingApproval.pendingIds.length, s: pendingApproval.pendingIds.length > 1 ? 's' : '' })}</span>
                        </div>
                        <div className="space-y-2">
                            {pendingApproval.messages.map((msg, i) => (
                                <div key={i} className="rounded-xl px-3 py-2 text-xs font-mono whitespace-pre-wrap"
                                    style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                    {msg}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleApproveTools}
                                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                                style={{ background: '#84cc16', color: '#000' }}
                                aria-label={t('chat.approval.approveAndRun')}>
                                ✅ Approve &amp; Run
                            </button>
                            <button
                                onClick={handleDenyTools}
                                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                                aria-label={t('chat.approval.cancelAndDeny')}>
                                ✋ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slash Command Menu */}
            {showSlash && (
                <div className="mx-auto max-w-3xl w-full px-6 mb-2">
                    <div className="rounded-xl border shadow-lg p-2 animate-scaleIn"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {getSlashCommands(t).map(c => (
                            <button key={c.cmd}
                                onClick={() => handleSlashCommand(c.cmd)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-light)] flex items-center gap-3 transition-colors">
                                <code className="text-xs font-bold text-lime-500">{c.cmd}</code>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Voice Chat Mode UI - replaces normal input when active ── */}
            {isVoiceChatMode && (
                <div className="border-t shrink-0 flex flex-col items-center justify-center py-6 gap-4"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', minHeight: '200px' }}>

                    {/* ── Mode toggle: Push-to-Talk / Review & Send ── */}
                    <div className="flex items-center gap-1 rounded-xl p-1"
                        style={{ background: 'var(--surface-raised, rgba(255,255,255,0.05))', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => {
                                setVoiceMode('push-to-talk');
                                try { localStorage.setItem('skales_voice_mode', 'push-to-talk'); } catch {}
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: voiceMode === 'push-to-talk' ? 'rgba(132,204,22,0.15)' : 'transparent',
                                color:      voiceMode === 'push-to-talk' ? '#84cc16' : 'var(--text-muted)',
                                border:     voiceMode === 'push-to-talk' ? '1px solid rgba(132,204,22,0.35)' : '1px solid transparent',
                            }}
                            title={t('chat.input.stopMicImmediate')}
                        >
                            <Icon icon={Zap} size={12} />
                            Push-to-Talk
                        </button>
                        <button
                            onClick={() => {
                                setVoiceMode('review');
                                try { localStorage.setItem('skales_voice_mode', 'review'); } catch {}
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: voiceMode === 'review' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color:      voiceMode === 'review' ? '#818cf8' : 'var(--text-muted)',
                                border:     voiceMode === 'review' ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                            }}
                            title={t('chat.input.stopMicReview')}
                        >
                            <Icon icon={Send} size={12} />
                            Review & Send
                        </button>
                    </div>

                    {/* ── Pending transcript review (review mode only) ── */}
                    {voiceMode === 'review' && pendingVoiceText && (
                        <div className="w-full max-w-sm mx-4 rounded-xl p-3 flex flex-col gap-2"
                            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <p className="text-xs font-medium" style={{ color: '#818cf8' }}>📝 Transcription - confirm before sending:</p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{pendingVoiceText}</p>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={async () => {
                                        const text = pendingVoiceText;
                                        setPendingVoiceText(null);
                                        setVoiceStatus('thinking');
                                        const before = messages.length;
                                        await (handleSend as (text?: string) => Promise<void>)(text);
                                        let waited = 0;
                                        const poll = setInterval(() => {
                                            if (document.hidden) return;
                                            waited += 300;
                                            setMessages(prev => {
                                                const newAssistant = prev.filter(
                                                    (m, i) => i >= before && m.role === 'assistant' && m.content && !m.content.startsWith('🛑'),
                                                );
                                                if (newAssistant.length > 0) {
                                                    clearInterval(poll);
                                                    const reply = newAssistant[newAssistant.length - 1].content;
                                                    const plain = reply.replace(/[#*`_~>\[\]!]/g, '').replace(/\n+/g, ' ').trim();
                                                    speakText(plain);
                                                }
                                                if (waited > 30_000) clearInterval(poll);
                                                return prev;
                                            });
                                        }, 300);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: 'rgba(99,102,241,0.25)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' }}
                                >
                                    <Icon icon={Send} size={12} />
                                    Send
                                </button>
                                <button
                                    onClick={() => { setPendingVoiceText(null); setVoiceStatus('idle'); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                    title={t('chat.status.discardRecording')}
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status label */}
                    {!pendingVoiceText && (
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            {voiceStatus === 'idle'         && (voiceMode === 'review' ? 'Press mic → review → send' : 'Press mic to speak')}
                            {voiceStatus === 'recording'    && '🔴 Listening...'}
                            {voiceStatus === 'transcribing' && '⏳ Transcribing...'}
                            {voiceStatus === 'thinking'     && '🤔 Thinking...'}
                            {voiceStatus === 'speaking'     && '🔊 Speaking...'}
                        </p>
                    )}

                    {/* Error */}
                    {voiceError && (
                        <p className="text-xs px-4 text-center text-red-400">{voiceError}</p>
                    )}

                    {/* Mic button */}
                    <button
                        onClick={toggleRecording}
                        disabled={voiceStatus === 'transcribing' || voiceStatus === 'thinking' || voiceStatus === 'speaking'}
                        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all focus:outline-none disabled:opacity-40"
                        style={{
                            background:   isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(132,204,22,0.10)',
                            border:       `2px solid ${isRecording ? '#ef4444' : 'rgba(132,204,22,0.4)'}`,
                            boxShadow:    isRecording ? '0 0 0 8px rgba(239,68,68,0.08), 0 0 0 16px rgba(239,68,68,0.04)' : 'none',
                        }}
                        title={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                        {/* Pulse ring when recording */}
                        {isRecording && (
                            <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                                style={{ background: 'rgba(239,68,68,0.4)' }} />
                        )}
                        <Icon
                            icon={isRecording ? MicOff : Mic}
                            size={32}
                            style={{ color: isRecording ? '#ef4444' : '#84cc16' }}
                        />
                    </button>

                    {/* Leave voice chat */}
                    <button
                        onClick={exitVoiceChat}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                        <Icon icon={PhoneOff} size={13} />
                        Leave Voice Chat
                    </button>
                </div>
            )}

            {/* Input Area - pb-safe handles iPhone home indicator + keyboard avoid */}
            {!isVoiceChatMode && <div className="border-t shrink-0"
                style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                    // Use dynamic viewport units so the bar stays above the soft keyboard on mobile
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
                }}>
                <div className="p-3 md:p-4 max-w-3xl mx-auto relative">

                    {/* ── Generation Panel (above input) - toggled by Sparkles button ── */}
                    {showGenToolbar && (activeSkills.includes('image_generation') || activeSkills.includes('video_generation')) && (
                        <div className="mb-2 rounded-xl border p-3 space-y-3"
                            style={{ background: 'var(--background)', borderColor: 'rgba(132,204,22,0.25)' }}>
                            {/* Top row: Mode tabs + Provider selector */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Mode tabs (Image / Video) */}
                                {activeSkills.includes('image_generation') && activeSkills.includes('video_generation') && (
                                    <div className="flex gap-1.5">
                                        {(['image', 'video'] as const).map(m => (
                                            <button key={m} onClick={() => setGenMode(m)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                                                style={{
                                                    background: genMode === m ? 'rgba(132,204,22,0.15)' : 'var(--surface-light)',
                                                    border: `1px solid ${genMode === m ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                    color: genMode === m ? '#84cc16' : 'var(--text-muted)',
                                                }}>
                                                <Icon icon={m === 'image' ? ImageIcon : Video} size={11} />
                                                {m === 'image' ? 'Image' : 'Video'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {/* Provider selector */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{t('chat.imageGen.provider')}:</span>
                                    {(['google', 'replicate'] as const).filter(p => p === 'google' || !!settings?.replicate_api_token).map(p => (
                                        <button key={p} onClick={() => setGenProvider(p)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genProvider === p ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genProvider === p ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genProvider === p ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {p === 'google' ? '🇬 Google' : '⚡ Replicate'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Prompt input */}
                            <div className="flex items-center gap-2">
                                <Icon icon={genMode === 'image' ? ImageIcon : Video} size={14} style={{ color: '#84cc16', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={genPrompt}
                                    onChange={e => setGenPrompt(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') (genProvider === 'replicate' ? handleGenerateReplicate : handleGenerate)(); }}
                                    placeholder={genMode === 'image' ? 'Describe the image to generate…' : 'Describe the video to generate…'}
                                    className="flex-1 bg-transparent border-none outline-none text-sm"
                                    style={{ color: 'var(--text-primary)' }}
                                    autoFocus
                                />
                            </div>

                            {/* Google-specific options (hidden when Replicate selected) */}
                            {genProvider === 'google' && genMode === 'image' && (
                                <div className="flex flex-wrap items-center gap-2 pb-1 border-b" style={{ borderColor: 'rgba(132,204,22,0.15)' }}>
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{t('chat.imageModelLabel')}</span>
                                    {(['standard', 'pro'] as const).map(m => (
                                        <button key={m} onClick={() => setGenImageModel(m)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genImageModel === m ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genImageModel === m ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genImageModel === m ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {m === 'standard' ? '🍌 Nano Banana' : '⚡ Nano Banana Pro'}
                                        </button>
                                    ))}
                                    {genImageModel === 'pro' && (
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Imagen 3 · may need special AI Studio access</span>
                                    )}
                                    {genImageModel === 'standard' && (
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gemini Flash · works with any AI Studio key</span>
                                    )}
                                </div>
                            )}
                            {genProvider === 'google' && genMode === 'image' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Style:</span>
                                    {(['auto', 'photorealistic', 'digital-art', 'illustration', 'sketch'] as const).map(s => (
                                        <button key={s} onClick={() => setGenImageStyle(s)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genImageStyle === s ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genImageStyle === s ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genImageStyle === s ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                    <span className="text-[11px] font-medium ml-2" style={{ color: 'var(--text-muted)' }}>Ratio:</span>
                                    {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map(r => (
                                        <button key={r} onClick={() => setGenImageRatio(r)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genImageRatio === r ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genImageRatio === r ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genImageRatio === r ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Google Video options */}
                            {genProvider === 'google' && genMode === 'video' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Ratio:</span>
                                    {(['16:9', '9:16'] as const).map(r => (
                                        <button key={r} onClick={() => setGenVideoRatio(r)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genVideoRatio === r ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genVideoRatio === r ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genVideoRatio === r ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {r}
                                        </button>
                                    ))}
                                    <span className="text-[11px] font-medium ml-2" style={{ color: 'var(--text-muted)' }}>Duration:</span>
                                    {([5, 8] as const).map(d => (
                                        <button key={d} onClick={() => setGenVideoDuration(d)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: genVideoDuration === d ? 'rgba(132,204,22,0.2)' : 'var(--surface)',
                                                border: `1px solid ${genVideoDuration === d ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                                                color: genVideoDuration === d ? '#84cc16' : 'var(--text-muted)',
                                            }}>
                                            {d}s
                                        </button>
                                    ))}
                                    <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>(takes 1–3 min)</span>
                                </div>
                            )}

                            {/* Replicate model selector */}
                            {genProvider === 'replicate' && (
                                <div className="space-y-2 pb-1 border-b" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-medium self-center" style={{ color: 'var(--text-muted)' }}>
                                            {t('chat.imageGen.replicateModel')}:
                                        </span>
                                        {(genMode === 'image' ? REPLICATE_IMAGE_MODELS : REPLICATE_VIDEO_MODELS).map(m => (
                                            <button key={m.id}
                                                onClick={() => {
                                                    if (genMode === 'image') setReplicateImageModelId(m.id);
                                                    else setReplicateVideoModelId(m.id);
                                                    setReplicateUseCustom(false);
                                                }}
                                                title={m.description}
                                                className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                                style={{
                                                    background: !replicateUseCustom && (genMode === 'image' ? replicateImageModelId : replicateVideoModelId) === m.id
                                                        ? 'rgba(99,102,241,0.2)' : 'var(--surface)',
                                                    border: `1px solid ${!replicateUseCustom && (genMode === 'image' ? replicateImageModelId : replicateVideoModelId) === m.id
                                                        ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                                                    color: !replicateUseCustom && (genMode === 'image' ? replicateImageModelId : replicateVideoModelId) === m.id
                                                        ? '#818cf8' : 'var(--text-muted)',
                                                }}>
                                                {m.name}
                                            </button>
                                        ))}
                                        {/* Custom model toggle */}
                                        <button
                                            onClick={() => setReplicateUseCustom(!replicateUseCustom)}
                                            className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                                            style={{
                                                background: replicateUseCustom ? 'rgba(99,102,241,0.2)' : 'var(--surface)',
                                                border: `1px solid ${replicateUseCustom ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                                                color: replicateUseCustom ? '#818cf8' : 'var(--text-muted)',
                                            }}>
                                            {t('chat.imageGen.customModel')}
                                        </button>
                                    </div>
                                    {/* Custom model input */}
                                    {replicateUseCustom && (
                                        <input
                                            type="text"
                                            value={replicateCustomModel}
                                            onChange={e => setReplicateCustomModel(e.target.value)}
                                            placeholder={t('chat.imageGen.customModelPlaceholder')}
                                            className="w-full p-2 rounded-lg text-xs outline-none"
                                            style={{
                                                background: 'var(--surface)',
                                                border: '1px solid rgba(99,102,241,0.3)',
                                                color: 'var(--text-primary)',
                                            }}
                                        />
                                    )}
                                    {/* Selected model hint */}
                                    {!replicateUseCustom && (
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            {(genMode === 'image' ? REPLICATE_IMAGE_MODELS : REPLICATE_VIDEO_MODELS)
                                                .find(m => m.id === (genMode === 'image' ? replicateImageModelId : replicateVideoModelId))?.description}
                                            {' · replicate.com'}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Footer: generate button + branding */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    {genProvider === 'google'
                                        ? (genMode === 'image'
                                            ? (genImageModel === 'pro' ? 'Nano Banana Pro · Google Imagen 3' : 'Nano Banana · Gemini 2.0 Flash')
                                            : 'Google Veo 2 · Long-running operation')
                                        : `Replicate · ${replicateUseCustom ? (replicateCustomModel || '-') : (genMode === 'image' ? replicateImageModelId : replicateVideoModelId)}`
                                    }
                                    {genOperationName && (
                                        <span className="ml-2 text-lime-400 font-medium flex items-center gap-1 inline-flex">
                                            <Icon icon={Loader2} size={10} className="animate-spin" /> Generating video…
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={genProvider === 'replicate' ? handleGenerateReplicate : handleGenerate}
                                    disabled={!genPrompt.trim() || genLoading || (genProvider === 'replicate' && replicateUseCustom && !replicateCustomModel.trim())}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 hover:brightness-110"
                                    style={{ background: genProvider === 'replicate' ? '#6366f1' : '#84cc16', color: genProvider === 'replicate' ? 'white' : 'black' }}>
                                    {genLoading
                                        ? <><Icon icon={Loader2} size={13} className="animate-spin" /> {t('chat.imageGen.generating')}</>
                                        : <><Icon icon={Sparkles} size={13} /> Generate</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pasted Image Preview */}
                    {pastedImage && (
                        <div className="mb-2 relative inline-block">
                            <img src={pastedImage} alt="Paste preview" className="h-20 rounded-xl object-cover border" style={{ borderColor: 'var(--border)' }} />
                            <button
                                onClick={() => setPastedImage(null)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                            >
                                <Icon icon={X} size={10} />
                            </button>
                            <span className="block text-[10px] mt-1 text-center" style={{ color: 'var(--text-muted)' }}>Image ready to send</span>
                        </div>
                    )}

                    {/* Binary file error notice */}
                    {fileError && (
                        <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-xl text-xs border"
                            style={{ borderColor: 'rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.08)', color: 'var(--text-primary)' }}>
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            <span className="flex-1">{fileError}</span>
                            <button onClick={() => setFileError(null)} className="shrink-0 opacity-60 hover:opacity-100 ml-1">✕</button>
                        </div>
                    )}

                    {/* Attached File Chip */}
                    {attachedFile && (
                        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: 'rgba(132,204,22,0.4)', background: 'rgba(132,204,22,0.08)' }}>
                            <span className="text-sm">📄</span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{attachedFile.name}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({attachedFile.sizeKb} KB)</span>
                            <button
                                onClick={() => setAttachedFile(null)}
                                className="w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white ml-1 flex-shrink-0"
                                title={t('chat.input.removeAttachment')}
                            >
                                <Icon icon={X} size={8} />
                            </button>
                        </div>
                    )}

                    {/*
                      * ── Input Bar — Responsive Layout ──────────────────────
                      * Desktop (md+): all icons + textarea in one flex row (original layout)
                      * Mobile (<md):  Row 1: icons (file, sparkles, summarize, slash)
                      *                Row 2: textarea (80%) + send button (20%)
                      * This prevents icons from being hidden behind SwiftKey / Gboard.
                      */}
                    <div className="rounded-2xl border transition-all focus-within:border-lime-500/50 focus-within:shadow-lg"
                        style={{ borderColor: (pastedImage || attachedFile) ? 'rgba(132,204,22,0.4)' : 'var(--border)', background: 'var(--background)' }}>

                        {/* Hidden file input */}
                        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect}
                            accept=".txt,.md,.json,.csv,.html,.js,.ts,.py,.pdf,image/*" />

                        {/* ── MOBILE: Icons row (shown only on small screens) ── */}
                        <div className="flex md:hidden items-center gap-1 px-2 pt-2 border-b"
                            style={{ borderColor: 'var(--border)' }}>
                            <button onClick={() => fileRef.current?.click()}
                                className="p-2 rounded-xl transition-all hover:bg-[var(--surface-light)]"
                                style={{ color: 'var(--text-muted)' }} title={t('chat.attachFile')}>
                                <Icon icon={Paperclip} size={18} />
                            </button>
                            {(activeSkills.includes('image_generation') || activeSkills.includes('video_generation')) && (
                                <button onClick={() => setShowGenToolbar(p => !p)}
                                    className="p-2 rounded-xl transition-all flex-shrink-0"
                                    style={{ background: showGenToolbar ? '#84cc16' : 'transparent', color: showGenToolbar ? 'black' : 'var(--text-muted)' }}
                                    title={t('chat.imageVideoGeneration')}>
                                    <Icon icon={Sparkles} size={18} />
                                </button>
                            )}
                            {activeSkills.includes('summarize') && (
                                <button onClick={handleSummarize}
                                    className="p-2 rounded-xl transition-all flex-shrink-0"
                                    style={{ background: isSummarizeActive ? 'rgba(132,204,22,0.12)' : 'transparent', color: isSummarizeActive ? '#84cc16' : 'var(--text-muted)', border: isSummarizeActive ? '1px solid rgba(132,204,22,0.3)' : '1px solid transparent' }}
                                    title={t('chat.summarize.button')}>
                                    <Icon icon={FileSearch} size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => { if (showSlash) { setShowSlash(false); if (input === '/') setInput(''); } else { setInput('/'); setShowSlash(true); inputRef.current?.focus(); } }}
                                className="p-2 rounded-xl transition-all flex-shrink-0"
                                style={{ background: showSlash ? 'rgba(132,204,22,0.12)' : 'transparent', color: showSlash ? '#84cc16' : 'var(--text-muted)', border: showSlash ? '1px solid rgba(132,204,22,0.3)' : '1px solid transparent' }}
                                title={t('chat.openSlashCommands')}>
                                <Icon icon={Slash} size={18} />
                            </button>
                        </div>

                        {/* ── MOBILE: Textarea + Send row ── */}
                        <div className="flex md:hidden items-end gap-2 p-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder={pastedImage ? 'Caption (optional)...' : attachedFile ? `About ${attachedFile.name}...` : isMultiAgentRunning ? 'Queuing...' : `Message ${getActiveAgentName()}...`}
                                rows={1}
                                spellCheck={false}
                                className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 px-1 placeholder-[var(--text-muted)]"
                                style={{ color: 'var(--text-primary)', maxHeight: '120px' }}
                                aria-label={t('chat.input.messageInput')}
                                aria-multiline="true"
                            />
                            {/* Send / Stop / Queue - mobile */}
                            {loading && !isMultiAgentRunning ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={handleStop} className="p-2.5 bg-red-500 hover:bg-red-400 rounded-xl text-white font-bold" title={t('chat.input.stop')} aria-label={t('chat.input.stopGenerating')}>
                                        <div className="w-4 h-4 bg-white rounded-sm" />
                                    </button>
                                    <button onClick={handleSendWithImage} disabled={!input.trim() && !pastedImage && !attachedFile}
                                        className="p-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-bold disabled:opacity-30"
                                        aria-label={t('chat.queueMessage')}>
                                        <Icon icon={Clock} size={18} />
                                    </button>
                                </div>
                            ) : isMultiAgentRunning ? (
                                <button onClick={handleSendWithImage} disabled={!input.trim() && !pastedImage && !attachedFile}
                                    className="p-2.5 bg-purple-500 hover:bg-purple-400 rounded-xl text-white font-bold disabled:opacity-30 shrink-0"
                                    aria-label={t('chat.queueMultiAgent')}>
                                    <Icon icon={Clock} size={18} />
                                </button>
                            ) : (
                                <button onClick={handleSendWithImage} disabled={!input.trim() && !pastedImage && !attachedFile}
                                    className="p-2.5 bg-lime-500 hover:bg-lime-400 rounded-xl text-black font-bold disabled:opacity-30 shrink-0"
                                    aria-label={t('chat.send')}>
                                    <Icon icon={Send} size={18} />
                                </button>
                            )}
                        </div>

                        {/* ── DESKTOP: Original single-row layout ── */}
                        <div className="hidden md:flex items-end gap-2 p-2">
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="p-2.5 rounded-xl transition-all hover:bg-[var(--surface-light)]"
                            style={{ color: 'var(--text-muted)' }}
                            title={t('chat.attachFile')}
                            aria-label={t('chat.attachFile')}
                        >
                            <Icon icon={Paperclip} size={18} />
                        </button>

                        {/* Sparkles - Generation Skills (Image / Video) */}
                        {(activeSkills.includes('image_generation') || activeSkills.includes('video_generation')) && (
                            <button
                                onClick={() => setShowGenToolbar(p => !p)}
                                className="p-2.5 rounded-xl transition-all flex-shrink-0"
                                style={{
                                    background: showGenToolbar ? '#84cc16' : 'transparent',
                                    color: showGenToolbar ? 'black' : 'var(--text-muted)',
                                }}
                                title={t('chat.imageVideoGeneration')}
                                aria-label={t('chat.imageVideoGeneration')}
                                aria-pressed={showGenToolbar}
                            >
                                <Icon icon={Sparkles} size={18} />
                            </button>
                        )}

                        {/* Summarize - toggle on/off like slash command */}
                        {activeSkills.includes('summarize') && (
                            <button
                                onClick={handleSummarize}
                                className="p-2.5 rounded-xl transition-all flex-shrink-0"
                                style={{
                                    background: isSummarizeActive ? 'rgba(132,204,22,0.12)' : 'transparent',
                                    color: isSummarizeActive ? '#84cc16' : 'var(--text-muted)',
                                    border: isSummarizeActive ? '1px solid rgba(132,204,22,0.3)' : '1px solid transparent',
                                }}
                                title={t('chat.summarize.tooltip')}
                                aria-label={t('chat.toggleSummarize')}
                                aria-pressed={isSummarizeActive}
                            >
                                <Icon icon={FileSearch} size={18} />
                            </button>
                        )}

                        {/* Text Input */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={
                                pastedImage
                                    ? 'Add a caption (optional)...'
                                    : attachedFile
                                        ? `Add a question about ${attachedFile.name} (optional)...`
                                        : isMultiAgentRunning
                                            ? `Multi-Agent running - type to queue your message...`
                                            : `Message ${getActiveAgentName()}... (try: create a folder called test)`
                            }
                            rows={1}
                            spellCheck={false}
                            className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2.5 px-1 placeholder-[var(--text-muted)]"
                            style={{ color: 'var(--text-primary)', maxHeight: '150px' }}
                            aria-label={t('chat.input.messageInput')}
                            aria-multiline="true"
                        />

                        {/* Slash Commands Toggle - opens command menu above input */}
                        <button
                            onClick={() => {
                                if (showSlash) {
                                    setShowSlash(false);
                                    if (input === '/') setInput('');
                                } else {
                                    setInput('/');
                                    setShowSlash(true);
                                    inputRef.current?.focus();
                                }
                            }}
                            className="p-2.5 rounded-xl transition-all flex-shrink-0"
                            style={{
                                background: showSlash ? 'rgba(132,204,22,0.12)' : 'transparent',
                                color: showSlash ? '#84cc16' : 'var(--text-muted)',
                                border: showSlash ? '1px solid rgba(132,204,22,0.3)' : '1px solid transparent',
                            }}
                            title={t('chat.openSlashCommands')}
                            aria-label={t('chat.openSlashCommands')}
                            aria-expanded={showSlash}
                        >
                            <Icon icon={Slash} size={18} />
                        </button>

                        {/* Stop / Queue / Send Button */}
                        {loading && !isMultiAgentRunning ? (
                            <div className="flex items-center gap-1.5">
                                {/* Stop button - aborts current + clears queue */}
                                <button
                                    onClick={handleStop}
                                    className="p-2.5 bg-red-500 hover:bg-red-400 rounded-xl text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
                                    title={t('chat.stop')}
                                    aria-label={t('chat.stop')}
                                >
                                    <div className="w-4 h-4 bg-white rounded-sm mb-0.5 mx-0.5" />
                                </button>
                                {/* Queue button - visible when user has typed something to queue */}
                                <button
                                    onClick={handleSendWithImage}
                                    disabled={!input.trim() && !pastedImage && !attachedFile}
                                    className="p-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                                    title={`Add to queue${messageQueue.length > 0 ? ` (${messageQueue.length} already queued)` : ''}`}
                                    aria-label={`Queue message${messageQueue.length > 0 ? ` (${messageQueue.length} already queued)` : ''}`}
                                >
                                    <Icon icon={Clock} size={18} />
                                </button>
                            </div>
                        ) : isMultiAgentRunning ? (
                            <button
                                onClick={handleSendWithImage}
                                disabled={!input.trim() && !pastedImage && !attachedFile}
                                className="p-2.5 bg-purple-500 hover:bg-purple-400 rounded-xl text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                                title={t('chat.queueMultiAgent')}
                                aria-label={t('chat.queueMultiAgent')}
                            >
                                <Icon icon={Clock} size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSendWithImage}
                                disabled={!input.trim() && !pastedImage && !attachedFile}
                                className="p-2.5 bg-lime-500 hover:bg-lime-400 rounded-xl text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-lime-500/20"
                                aria-label={t('chat.send')}
                            >
                                <Icon icon={Send} size={18} />
                            </button>
                        )}
                        </div>
                    </div>
                    {/* ── Message Queue Status Bar ──────────────────────── */}
                    {/* Shown when messages are queued while Skales is busy */}
                    {messageQueue.length > 0 && (
                        <div className="mt-2 rounded-xl overflow-hidden bg-amber-50 border border-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25">
                            {/* Header row */}
                            <div className="flex items-center justify-between px-3 py-1.5">
                                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                    <Icon icon={Clock} size={12} />
                                    <span className="text-[11px] font-medium">
                                        {messageQueue.length} message{messageQueue.length > 1 ? 's' : ''} queued
                                        {loading ? ' - will send when ready' : ''}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setMessageQueue([])}
                                    className="text-[10px] text-amber-600/70 hover:text-amber-700 dark:text-amber-400/60 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                                    title={t('chat.queue.clearAll')}
                                >
                                    <Icon icon={X} size={11} />
                                    <span>Clear all</span>
                                </button>
                            </div>
                            {/* Individual queued messages */}
                            <div className="px-3 pb-2 flex flex-col gap-1">
                                {messageQueue.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 bg-amber-100/60 dark:bg-amber-500/5"
                                    >
                                        <span className="text-[10px] truncate text-amber-900/70 dark:text-text-muted" style={{ maxWidth: '85%' }}>
                                            <span className="text-amber-600/70 dark:text-amber-500/50 mr-1">#{idx + 1}</span>
                                            {msg.length > 55 ? msg.slice(0, 55) + '…' : msg}
                                        </span>
                                        <button
                                            onClick={() => setMessageQueue(prev => prev.filter((_, i) => i !== idx))}
                                            className="flex-shrink-0 text-amber-600/60 hover:text-amber-700 dark:text-amber-400/50 dark:hover:text-amber-400 transition-colors"
                                            title={t('chat.queue.removeFromQueue')}
                                        >
                                            <Icon icon={X} size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-center text-[10px] mt-2 select-none" style={{ color: 'var(--text-muted)' }}>
                        {isMultiAgentRunning ? (
                            <>
                                <span className="text-purple-400 font-bold">🤖 Multi-Agent active</span>
                                {' '}· Messages are queued · Check{' '}
                                <Link href="/tasks" className="text-purple-400 hover:underline">Tasks</Link>
                                {' '}for live status
                            </>
                        ) : loading ? (
                            <>
                                <span className="text-amber-400/70">⏳ Processing</span>
                                {messageQueue.length > 0
                                    ? ` · ${messageQueue.length} queued · Press ⬛ to stop all`
                                    : ' · Type to queue your next message'}
                            </>
                        ) : (
                            <>
                                Type <code className="px-1 py-0.5 rounded bg-[var(--surface-light)] text-lime-500 text-[9px]">/</code> for commands · Shift+Enter for new line ·
                                <span className="text-lime-500 font-medium"> {getActiveAgentName()}</span> - I can act, not just talk
                            </>
                        )}
                    </p>
                </div>
            </div>}
        </div>
    );
}
