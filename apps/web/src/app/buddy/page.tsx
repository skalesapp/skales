'use client';

/**
 * /buddy - Skales Desktop Buddy (v6.0.0)
 *
 * Renders inside a frameless, transparent Electron BrowserWindow (300×400).
 * The AppShell is bypassed for this route (see app-shell.tsx).
 *
 * FSM:
 *   INTRO  → random intro clip once → IDLE
 *   IDLE   → random idle clip looping; timer 30–60 s → ACTION
 *   ACTION → random action clip once (shuffle bag, no repeats) → IDLE
 *
 * VIDEO DOUBLE-BUFFER (flicker-free):
 *   Two <video> elements are stacked at the same position.
 *   The INACTIVE slot loads the next clip while the ACTIVE slot plays.
 *
 *   FLICKER FIX (v6.1):
 *   Opacity is managed ENTIRELY via direct DOM refs — never via React state.
 *   React state updates are async/batched, which means setOpacity() may not
 *   fire until AFTER the rVFC frame-presentation guarantee has expired.
 *   Direct DOM: `vidA.current.style.opacity = '1'` is synchronous with rVFC.
 *   Combined with a 150 ms CSS crossfade (Option C), this makes the swap
 *   completely invisible even if frame decode is slightly delayed.
 *
 *   Sequence:
 *     1. Load next clip into the INACTIVE slot (opacity: 0)
 *     2. Call .play() on the inactive slot
 *     3. Wait for requestVideoFrameCallback (first frame composited on GPU)
 *     4. Directly set .style.opacity on both elements (sync — no batching)
 *     5. 150 ms CSS crossfade masks any remaining decode jitter
 *     6. After fade-out completes, pause/reset the old slot
 *
 * DYNAMIC CLIPS (v6.1):
 *   No hardcoded filenames. On mount the component fetches clip lists from
 *   /api/mascot/clips?skin=skales&category=idle|action|intro.
 *   Drop a .webm into public/mascot/skales/<category>/ and it auto-appears.
 *   Skin name is always 'skales' for now; Phase 4 will read it from settings.
 *
 * CHAT:
 *   Clicking the gecko opens a persistent input pill (stays open until
 *   the user clicks the gecko again or the window loses focus).
 *   Responses come from /api/buddy-chat and are saved to the active session.
 *   If the reply was truncated an "Open Chat →" link reveals the full answer.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

// ─── Utilities ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function nextDelay(): number { return (30 + Math.random() * 30) * 1_000; }

// Bug 28: Strip LLM think/reasoning XML tags before showing text in the buddy bubble.
// Applied ONLY here — not in the main chat UI where collapsible reasoning sections live.
function stripThinkingTags(text: string): string {
    let cleaned = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    const trimmed = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return trimmed || text.trim(); // fall back to raw text if stripping empties the string
}

type FSM = 'intro' | 'idle' | 'action';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuddyPage() {

    const { t } = useTranslation();

    // ── Double-buffer: two video slots ────────────────────────────────────────
    // Opacity is managed ONLY by direct DOM manipulation (not React state).
    // Keeping opacity OUT of React's props means re-renders never reset it.
    const vidA       = useRef<HTMLVideoElement>(null);
    const vidB       = useRef<HTMLVideoElement>(null);
    const activeSlot = useRef<'a' | 'b'>('a');

    // ── Generation counter — cancels stale async callbacks ────────────────────
    const playGen = useRef(0);

    // ── FSM ───────────────────────────────────────────────────────────────────
    const fsm         = useRef<FSM>('intro');
    const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bag         = useRef<string[]>([]);

    // ── Dynamic clip lists (loaded from /api/mascot/clips) ────────────────────
    // Stored in refs so FSM callbacks always read the latest values without
    // stale-closure issues.  The corresponding state values exist only to
    // trigger the "boot FSM" useEffect when all three lists arrive.
    const idleClipsRef   = useRef<string[]>([]);
    const actionClipsRef = useRef<string[]>([]);
    const introClipsRef  = useRef<string[]>([]);
    const [clipsReady, setClipsReady] = useState(false);
    const hasStartedFSM = useRef(false);

    // ── Chat ──────────────────────────────────────────────────────────────────
    const [spotOpen,      setSpotOpen]      = useState(false);
    const [query,         setQuery]         = useState('');
    const [thinking,      setThinking]      = useState(false);
    const [bubble,        setBubble]        = useState<string | null>(null);
    const [bubbleLong,    setBubbleLong]    = useState(false);
    const [bubbleIsError, setBubbleIsError] = useState(false);
    const inputRef    = useRef<HTMLInputElement>(null);
    const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Approval state ────────────────────────────────────────────────────────
    type ApprovalState = {
        tools: string[];
        toolCallIds: string[];
        sessionId: string;
    } | null;
    const [approval, setApproval] = useState<ApprovalState>(null);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const clearAction = useCallback(() => {
        if (actionTimer.current) { clearTimeout(actionTimer.current); actionTimer.current = null; }
    }, []);
    const clearBubble = useCallback(() => {
        if (bubbleTimer.current) { clearTimeout(bubbleTimer.current); bubbleTimer.current = null; }
    }, []);
    const nextAction = useCallback((): string | null => {
        const actions = actionClipsRef.current;
        if (actions.length === 0) return null;
        if (bag.current.length === 0) bag.current = shuffled(actions);
        return bag.current.pop() ?? null;
    }, []);

    // ── FLICKER-FREE double-buffer play ───────────────────────────────────────
    //
    // Loads `url` into the INACTIVE video slot.  Waits for the browser to
    // confirm the FIRST FRAME is actually composited on the GPU before swapping.
    //
    // KEY FIX: opacity is set via .style.opacity (direct DOM) so the swap is
    // synchronous with the rVFC callback — React batching cannot delay it.
    // A 150 ms CSS transition masks any residual frame-decode jitter (Option C).
    //
    const play = useCallback((url: string, shouldLoop: boolean, retries = 3): void => {
        const gen = ++playGen.current;

        const isAActive = activeSlot.current === 'a';
        const nextVid   = isAActive ? vidB.current : vidA.current;
        const prevVid   = isAActive ? vidA.current : vidB.current;
        if (!nextVid) return;

        nextVid.loop = shouldLoop;
        nextVid.src  = url;
        nextVid.load();

        const onCanPlay = () => {
            nextVid.removeEventListener('canplay', onCanPlay);
            nextVid.removeEventListener('error',   onError);
            if (gen !== playGen.current) return;

            // ── FLICKER FIX: direct DOM swap, synchronous with rVFC ──────────
            // doSwap is called exactly when a decoded frame has been presented
            // to the compositor (rVFC), or after two paint cycles (double-rAF
            // fallback).  Direct .style.opacity assignment is synchronous —
            // no React batching delay between "frame ready" and "pixels change".
            const doSwap = () => {
                if (gen !== playGen.current) return;
                activeSlot.current = isAActive ? 'b' : 'a';

                // Synchronous DOM write — zero gap between guarantee and pixel change
                if (nextVid) nextVid.style.opacity = '1';
                if (prevVid) prevVid.style.opacity = '0';

                // After the 150 ms crossfade completes, pause + reset the old slot
                // so it doesn't consume CPU/GPU resources
                setTimeout(() => {
                    if (gen !== playGen.current) return; // newer swap already happened
                    if (prevVid) {
                        prevVid.pause();
                        prevVid.src  = '';
                        prevVid.load();
                    }
                }, 200); // slightly longer than the 150 ms CSS transition
            };

            nextVid.play().catch(() => { /* muted autoplay always works in Electron */ }).finally(() => {
                if (gen !== playGen.current) return;

                if (typeof (nextVid as any).requestVideoFrameCallback === 'function') {
                    // Chromium / Electron 86+: fires when a frame is presented to the
                    // compositor — the strongest guarantee that pixels are on screen
                    (nextVid as any).requestVideoFrameCallback(doSwap);
                } else {
                    // Fallback: two rAFs ensure the GPU compositor has rendered
                    requestAnimationFrame(() => requestAnimationFrame(doSwap));
                }
            });
        };

        const onError = () => {
            nextVid.removeEventListener('canplay', onCanPlay);
            nextVid.removeEventListener('error',   onError);
            if (gen !== playGen.current) return;
            if (retries > 0) setTimeout(() => play(url, shouldLoop, retries - 1), 1500);
        };

        nextVid.addEventListener('canplay', onCanPlay);
        nextVid.addEventListener('error',   onError);
    }, []);

    // ── FSM: Idle ─────────────────────────────────────────────────────────────
    const goIdle = useCallback(() => {
        clearAction();
        fsm.current = 'idle';
        const idles = idleClipsRef.current;
        if (idles.length === 0) return; // no clips loaded yet - wait silently
        play(pick(idles), true);
        actionTimer.current = setTimeout(() => {
            clearAction();
            fsm.current = 'action';
            const url = nextAction();
            if (url) {
                play(url, false);
            } else {
                // No action clips available — go back to idle
                goIdle();
            }
        }, nextDelay());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [play, clearAction, nextAction]);

    // ── FSM: onEnded — drives intro→idle and action→idle ─────────────────────
    const onEnded = useCallback(() => {
        if (fsm.current === 'intro' || fsm.current === 'action') goIdle();
    }, [goIdle]);

    // ── Step 1: Fetch clip lists from the API ─────────────────────────────────
    // Runs once on mount.  Reads the active skin from settings (defaults to
    // 'skales' if not set).  All three categories are fetched in parallel.
    // Telemetry: buddy page opened
    useEffect(() => {
        fetch('/api/telemetry/ping?event=feature_used&feature=buddy').catch(() => {});
    }, []);

    // When the response arrives the refs are updated and clipsReady is set to
    // true, which triggers the boot FSM useEffect below.
    useEffect(() => {
        const loadClips = async () => {
            // Read active skin from settings; fall back to 'skales'
            let skin = 'skales';
            try {
                const settingsRes = await fetch('/api/settings/get', { cache: 'no-store' });
                if (settingsRes.ok) {
                    const s = await settingsRes.json();
                    if (typeof s?.buddy_skin === 'string' && /^[a-z0-9_-]+$/i.test(s.buddy_skin)) {
                        skin = s.buddy_skin;
                    }
                }
            } catch { /* non-fatal: use default */ }

            try {
                const [idle, action, intro] = await Promise.all([
                    fetch(`/api/mascot/clips?skin=${skin}&category=idle`)
                        .then(r => r.json()).catch(() => ({ clips: [] })),
                    fetch(`/api/mascot/clips?skin=${skin}&category=action`)
                        .then(r => r.json()).catch(() => ({ clips: [] })),
                    fetch(`/api/mascot/clips?skin=${skin}&category=intro`)
                        .then(r => r.json()).catch(() => ({ clips: [] })),
                ]);
                idleClipsRef.current   = (idle.clips   as string[]) ?? [];
                actionClipsRef.current = (action.clips as string[]) ?? [];
                introClipsRef.current  = (intro.clips  as string[]) ?? [];
            } catch { /* non-fatal */ }

            setClipsReady(true);
        };

        loadClips();
    }, []);

    // ── Step 2: Boot FSM — runs once after clips are loaded ───────────────────
    // Separated from Step 1 so the DOM refs (vidA, vidB) are available.
    useEffect(() => {
        if (!clipsReady) return;               // wait for clip lists
        if (hasStartedFSM.current) return;     // idempotency guard
        hasStartedFSM.current = true;

        // Set initial DOM opacities — NOT via React style props so React never resets them
        if (vidA.current) vidA.current.style.opacity = '1';
        if (vidB.current) vidB.current.style.opacity = '0';

        const introClips = introClipsRef.current;

        // If no intro clips exist, skip straight to idle
        if (introClips.length === 0) {
            goIdle();
            return;
        }

        fsm.current = 'intro';
        const vid = vidA.current;
        if (!vid) return;
        const url     = pick(introClips);
        let   retries = 4;

        const tryLoad = () => {
            vid.loop = false;
            vid.src  = url;
            vid.load();
            vid.play().catch(() => {});
        };
        const onError = () => {
            if (retries-- > 0) setTimeout(tryLoad, 1500);
        };
        vid.addEventListener('error', onError);
        tryLoad();

        return () => {
            vid.removeEventListener('error', onError);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clipsReady]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => { clearAction(); clearBubble(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Focus input on open ───────────────────────────────────────────────────
    useEffect(() => {
        if (spotOpen) setTimeout(() => inputRef.current?.focus(), 80);
    }, [spotOpen]);

    // ── Close on window blur (user switches to another app) ──────────────────
    useEffect(() => {
        const onBlur = () => { if (!thinking) { setSpotOpen(false); setQuery(''); } };
        window.addEventListener('blur', onBlur);
        return () => window.removeEventListener('blur', onBlur);
    }, [thinking]);

    // ── Rich notification type for v7 buddy intelligence ───────────────────────
    type RichNotif = {
        text: string;
        type?: string;
        action?: { label: string; route?: string; handler?: string };
        expiresMs?: number;
        isError?: boolean;
    };
    const notifQueue = useRef<RichNotif[]>([]);
    const [activeAction, setActiveAction] = useState<RichNotif['action'] | null>(null);

    const showBubble = useCallback((text: string, ms = 8000) => {
        clearBubble();
        setBubble(text);
        setBubbleLong(false);
        setBubbleIsError(false);
        bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); setActiveAction(null); }, ms);
    }, [clearBubble]);

    // ── Notification polling (task/cron completions + buddy intelligence) ─────
    useEffect(() => {
        const tryFlush = () => {
            if (notifQueue.current.length === 0 || bubble) return;
            const next = notifQueue.current.shift()!;
            const displayMs = next.expiresMs || (next.action ? 15000 : 8000);
            setActiveAction(next.action || null);
            setBubbleIsError(next.isError || false);
            showBubble(next.text, displayMs);
        };
        const poll = async () => {
            try {
                const res = await fetch('/api/buddy-notifications');
                if (!res.ok) return;
                const data = await res.json() as { notifications: RichNotif[] };
                for (const n of data.notifications) {
                    notifQueue.current.push({
                        text: n.text,
                        type: n.type,
                        action: n.action,
                        expiresMs: n.expiresMs,
                        isError: n.isError,
                    });
                }
                tryFlush();
            } catch { /* ignore network errors */ }
        };
        const id = setInterval(poll, 5000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bubble]);

    // ── Activity heartbeat — reports user presence for idle detection ─────────
    useEffect(() => {
        const ping = () => {
            if (document.hidden) return;
            fetch('/api/buddy/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'buddy' }) }).catch(() => {});
        };
        ping(); // immediate first ping
        const id = setInterval(ping, 60_000); // every 60s
        return () => clearInterval(id);
    }, []);

    // ── Mascot click — toggle input ───────────────────────────────────────────
    const handleMascotClick = useCallback(() => {
        if (thinking) return;
        if (spotOpen) { setSpotOpen(false); setQuery(''); return; }
        // Clear any pending approval so the input pill becomes accessible again
        if (approval) {
            fetch('/api/buddy-chat/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: approval.sessionId, toolCallIds: approval.toolCallIds, approved: false }),
            }).catch(() => {});
            setApproval(null);
        }
        clearBubble(); setBubble(null); setBubbleLong(false); setBubbleIsError(false);
        setSpotOpen(true);
    }, [thinking, spotOpen, clearBubble, approval]);

    // ── Submit to /api/buddy-chat ─────────────────────────────────────────────
    const submit = async () => {
        const text = query.trim();
        if (!text || thinking) return;
        setThinking(true);
        setQuery('');
        setApproval(null);

        try {
            const res  = await fetch('/api/buddy-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errMsg = `Error ${res.status}: ${data.error ?? 'unknown'}`;
                setBubble(errMsg);
                setBubbleLong(false);
                setBubbleIsError(true);
                clearBubble();
                bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); }, 15_000);
                return;
            }

            // ── Sandbox blocked — file access restricted ───────────────────────
            if (data.type === 'sandbox_blocked') {
                setBubble(data.content || t('buddy.sandboxRestricted'));
                setBubbleLong(false);
                setBubbleIsError(true);
                clearBubble();
                bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); }, 15_000);
                return;
            }

            // ── Approval needed ───────────────────────────────────────────────
            if (data.type === 'approval_needed') {
                const toolList = (data.tools as string[]).join('\n• ');
                const preview = `${t('buddy.approvalNeeded')}\n• ${toolList}`;
                setBubble(preview);
                setBubbleLong(false);
                setBubbleIsError(false);
                clearBubble(); // cancel any auto-dismiss
                setApproval({
                    tools: data.tools,
                    toolCallIds: data.toolCallIds,
                    sessionId: data.sessionId,
                });
                return;
            }

            // ── Tool result (auto-executed) or plain text ─────────────────────
            // Bug 28: strip think/reasoning XML before displaying in the buddy bubble
            let reply = stripThinkingTags((data.content ?? '').trim() || 'No response.');
            const wasLong = data.wasLong === true || reply.length > 110;
            if (!data.wasLong && reply.length > 110) reply = reply.slice(0, 107) + '…';

            setBubble(reply);
            setBubbleLong(wasLong);
            setBubbleIsError(false);
            clearBubble();
            bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleLong(false); }, 18_000);
        } catch {
            setBubble(t('buddy.errorMessage'));
            setBubbleLong(true);
            setBubbleIsError(true);
            clearBubble();
            bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); }, 15_000);
        } finally {
            setThinking(false);
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    };

    // ── Handle approval / decline ─────────────────────────────────────────────
    const handleApprove = async (approved: boolean) => {
        if (!approval) return;
        const { toolCallIds, sessionId } = approval;
        setApproval(null);

        if (!approved) {
            setBubble(t('buddy.cancelled'));
            setBubbleLong(false);
            setBubbleIsError(false);
            clearBubble();
            bubbleTimer.current = setTimeout(() => setBubble(null), 5_000);
            // Notify backend to clear pending calls
            fetch('/api/buddy-chat/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, toolCallIds, approved: false }),
            }).catch(() => {});
            return;
        }

        // Show working indicator
        setBubble(t('buddy.working'));
        setBubbleLong(false);
        setBubbleIsError(false);
        clearBubble();

        try {
            const res = await fetch('/api/buddy-chat/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, toolCallIds, approved: true }),
            });
            const data = await res.json().catch(() => ({}));

            if (data.type === 'executed') {
                // Bug 28: strip think/reasoning XML before displaying in the buddy bubble
                let result = stripThinkingTags((data.content ?? t('buddy.working')).trim());
                const wasLong = data.wasLong === true;
                if (!wasLong && result.length > 110) result = result.slice(0, 107) + '…';
                setBubble(result);
                setBubbleLong(wasLong);
                bubbleTimer.current = setTimeout(() => setBubble(null), 18_000);
            } else {
                // BUG 5 FIX: Show meaningful error instead of generic "Abgebrochen".
                // Check for sandbox/file-access errors and show a clear message.
                const rawErr = data.error || '';
                const isSandbox = /sandbox|restricted|not allowed|permission|access denied/i.test(rawErr);
                const errorMsg = isSandbox
                    ? t('buddy.sandboxRestricted')
                    : (rawErr || (!res.ok ? `Error (${res.status})` : t('buddy.errorMessage')));
                setBubble(errorMsg);
                setBubbleIsError(true);
                bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); }, 10_000);
            }
        } catch {
            setBubble(t('buddy.errorMessage'));
            setBubbleIsError(true);
            bubbleTimer.current = setTimeout(() => { setBubble(null); setBubbleIsError(false); }, 12_000);
        }
    };

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter')  void submit();
        if (e.key === 'Escape') { setSpotOpen(false); setQuery(''); }
    };

    const openChat = () => (window as any).skales?.send('open-chat');

    // ── Shared video style ─────────────────────────────────────────────────────
    // IMPORTANT: 'opacity' is NOT in this object.  Opacity is managed entirely
    // via direct DOM manipulation (.style.opacity) so React never resets it.
    // The CSS 'transition' here creates the 150 ms crossfade (Option C) which
    // masks any remaining frame-decode jitter.
    const videoStyle = {
        position:        'absolute',
        bottom:          0,
        right:           0,
        width:           '150px',
        height:          'auto',
        cursor:          'pointer',
        // 150 ms crossfade — both clips briefly overlap, masking decode lag
        transition:      'opacity 0.15s ease-in-out',
        WebkitAppRegion: 'no-drag',
        // GPU compositor layer — opacity transition on GPU, zero CPU repaint
        willChange:      'opacity',
        transform:       'translateZ(0)',
        // Transparent background prevents white/black flash when no frame is decoded
        background:      'transparent',
    } as React.CSSProperties;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div style={{
            width:           '100%',
            height:          '100%',
            background:      'transparent',
            position:        'fixed',
            top:             0,
            left:            0,
            right:           0,
            bottom:          0,
            overflow:        'hidden',
            userSelect:      'none',
            WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>

            {/* ── Speech Bubble ────────────────────────────────────────────── */}
            {bubble && (
                <div
                    aria-live="polite"
                    onClick={() => {
                        // When approval buttons are showing, only the buttons themselves
                        // (or the mascot click) should dismiss — don't auto-decline on
                        // accidental bubble text clicks
                        if (approval) return;
                        clearBubble(); setBubble(null); setBubbleLong(false); setBubbleIsError(false);
                    }}
                    style={{
                        position:             'absolute',
                        // Position the bubble ABOVE the input pill (input is at bottom:195px).
                        // When approval is showing the bubble must be clearly above the input
                        // so buttons are never obscured. Normal bubble sits higher at 248px.
                        bottom:               approval ? '230px' : '248px',
                        right:                '5px',
                        width:                '185px',
                        // Solid dark background — buddy window is transparent/frameless,
                        // so glassmorphism is invisible on light wallpapers. Must be opaque.
                        background:           approval
                            ? 'rgba(24, 28, 24, 0.95)'
                            : bubbleIsError
                                ? 'rgba(30, 20, 20, 0.95)'
                                : 'rgba(20, 24, 20, 0.95)',
                        backdropFilter:       'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border:               approval
                            ? '1px solid rgba(74, 222, 128, 0.4)'
                            : bubbleIsError
                                ? '1px solid rgba(248, 113, 113, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.10)',
                        borderRadius:         '18px',
                        padding:              approval ? '10px 14px' : '10px 14px',
                        fontSize:             '12px',
                        lineHeight:           1.5,
                        color:                '#e8e8e8',
                        cursor:               'pointer',
                        // Shadow kept tight (4px blur) so it doesn't clip at the
                        // Electron BrowserWindow edge (300x400px frameless window)
                        boxShadow:            approval
                            ? '0 2px 6px rgba(0, 0, 0, 0.3)'
                            : bubbleIsError
                                ? '0 2px 6px rgba(0, 0, 0, 0.3)'
                                : '0 2px 6px rgba(0, 0, 0, 0.25)',
                        animation:            'slideUp 0.3s ease-out',
                        // When approval buttons are showing, bubble must sit above the input
                        // (input z-index is 20, so approval bubble needs higher)
                        zIndex:               approval ? 30 : 10,
                        // Bug 26: long tool commands / file paths must not overflow the bubble
                        wordBreak:            'break-word',
                        overflowWrap:         'anywhere',
                    }}
                >
                    {bubble}

                    {/* ── Approval buttons ────────────────────────────── */}
                    {approval && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}
                            onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => handleApprove(true)}
                                style={{
                                    flex:           1,
                                    padding:        '5px 10px',
                                    borderRadius:   '12px',
                                    background:     'rgba(74, 222, 128, 0.2)',
                                    border:         'none',
                                    color:          '#4ade80',
                                    fontSize:       '11px',
                                    fontWeight:     600,
                                    cursor:         'pointer',
                                    transition:     'all 0.15s ease',
                                    whiteSpace:     'nowrap',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74, 222, 128, 0.35)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)')}
                            >
                                {t('buddy.approve')}
                            </button>
                            <button
                                onClick={() => handleApprove(false)}
                                style={{
                                    flex:           1,
                                    padding:        '5px 10px',
                                    borderRadius:   '12px',
                                    background:     'rgba(248, 113, 113, 0.15)',
                                    border:         'none',
                                    color:          '#f87171',
                                    fontSize:       '11px',
                                    fontWeight:     600,
                                    cursor:         'pointer',
                                    transition:     'all 0.15s ease',
                                    whiteSpace:     'nowrap',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248, 113, 113, 0.3)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)')}
                            >
                                {t('buddy.decline')}
                            </button>
                        </div>
                    )}

                    {/* ── Rich notification action button ──────────── */}
                    {activeAction && !approval && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                if (activeAction.route) {
                                    (window as any).skales?.send('navigate', activeAction.route);
                                }
                                if (activeAction.handler) {
                                    (window as any).skales?.send('buddy-action', activeAction.handler);
                                }
                            }}
                            style={{
                                display:        'block',
                                marginTop:      '6px',
                                padding:        '5px 10px',
                                borderRadius:   '12px',
                                background:     'rgba(96, 165, 250, 0.2)',
                                border:         'none',
                                color:          '#60a5fa',
                                fontSize:       '11px',
                                fontWeight:     600,
                                cursor:         'pointer',
                                width:          '100%',
                                textAlign:      'center',
                                transition:     'all 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96, 165, 250, 0.35)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)')}
                        >
                            {activeAction.label}
                        </button>
                    )}

                    {bubbleLong && !approval && !activeAction && (
                        <button
                            onClick={e => { e.stopPropagation(); openChat(); }}
                            style={{
                                display:        'block',
                                marginTop:      '6px',
                                background:     'rgba(255, 255, 255, 0.08)',
                                border:         'none',
                                padding:        '4px 10px',
                                borderRadius:   '10px',
                                color:          'rgba(255, 255, 255, 0.65)',
                                fontSize:       '11px',
                                cursor:         'pointer',
                                fontWeight:     500,
                                width:          '100%',
                                textAlign:      'center',
                                transition:     'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#e8e8e8'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'; }}
                            aria-label="Open Skales Chat"
                        >
                            {t('buddy.openChatDetails')} →
                        </button>
                    )}

                    {/* Tail pointer — matches dark bubble background */}
                    <div style={{
                        position:     'absolute',
                        bottom:       '-6px',
                        right:        '55px',
                        width:        0,
                        height:       0,
                        borderLeft:   '6px solid transparent',
                        borderRight:  '6px solid transparent',
                        borderTop:    '6px solid rgba(20, 24, 20, 0.95)',
                    }} />
                </div>
            )}

            {/* ── Input pill — hidden when approval is pending ──────────────── */}
            <div style={{
                position:             'absolute',
                bottom:               '195px',
                right:                '5px',
                width:                '175px',
                background:           'rgba(20, 24, 20, 0.92)',
                backdropFilter:       'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border:               '1px solid rgba(132, 204, 22, 0.35)',
                borderRadius:         '16px',
                padding:              '8px 10px',
                display:              'flex',
                alignItems:           'center',
                gap:                  '8px',
                zIndex:               20,
                // Hide input when approval buttons are showing to prevent overlap
                opacity:          (spotOpen && !approval) ? 1 : 0,
                pointerEvents:    (spotOpen && !approval) ? 'auto' : 'none',
                transform:        (spotOpen && !approval) ? 'translateY(0)' : 'translateY(4px)',
                transition:       'opacity 0.15s ease, transform 0.15s ease',
            } as React.CSSProperties}>
                {thinking ? (
                    <div style={{
                        width:           14,
                        height:          14,
                        border:          '2px solid #84cc16',
                        borderTopColor:  'transparent',
                        borderRadius:    '50%',
                        animation:       'spin 0.7s linear infinite',
                        flexShrink:      0,
                    }} />
                ) : (
                    <span style={{ fontSize: 14, flexShrink: 0 }}>🦎</span>
                )}
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={t('buddy.placeholder')}
                    disabled={thinking || !spotOpen}
                    aria-label={t('buddy.ariaLabel')}
                    style={{
                        flex:        1,
                        minWidth:    0,
                        background:  'transparent',
                        border:      'none',
                        outline:     'none',
                        color:       '#f0f0f0',
                        fontSize:    '12px',
                        caretColor:  '#84cc16',
                        opacity:     thinking ? 0.5 : 1,
                        transition:  'opacity 0.15s',
                    }}
                />
            </div>

            {/* ── Mascot video - slot A ─────────────────────────────────────── */}
            {/* Opacity is NOT set here - managed exclusively via .style.opacity in doSwap */}
            <video
                ref={vidA}
                muted
                playsInline
                onEnded={onEnded}
                onClick={handleMascotClick}
                style={videoStyle}
                aria-hidden="true"
            />

            {/* ── Mascot video - slot B ─────────────────────────────────────── */}
            <video
                ref={vidB}
                muted
                playsInline
                onEnded={onEnded}
                onClick={handleMascotClick}
                style={videoStyle}
                aria-hidden="true"
            />

            {/* ── Global keyframes ─────────────────────────────────────────── */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to   { opacity: 0; transform: translateY(-5px); }
                }
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { background: transparent !important; overflow: hidden; -webkit-app-region: drag; }
                html { border: none !important; outline: none !important; box-shadow: none !important; }
                body { border: none !important; outline: none !important; }
            `}</style>
        </div>
    );
}
