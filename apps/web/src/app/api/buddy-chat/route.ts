/**
 * POST /api/buddy-chat
 *
 * REST wrapper for the Desktop Buddy window that supports full tool execution.
 * The buddy can now DO things (write files, search web, send emails, etc.),
 * not just answer text questions.
 *
 * Request body:  { message: string }
 * Response:
 *   { content: string }                       — plain text response
 *   { type: 'approval_needed', tools: [...] } — tool calls needing user approval
 *   { type: 'tool_result', content: string }  — auto-executed tool result
 *   { error: string }                         — failure (HTTP 4xx/5xx)
 *
 * Side effects:
 *   • Appends user + assistant messages to the currently active chat session
 *     so buddy conversations appear in the main Skales chat history.
 */

import { NextResponse }                  from 'next/server';
import { unstable_noStore as noStore }   from 'next/cache';

import {
    getActiveSessionId,
    loadSession,
    saveSession,
} from '@/actions/chat';
import {
    agentDecide,
    agentExecute,
} from '@/actions/orchestrator';
import { serverT } from '@/lib/server-i18n';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

// ─── Buddy system prompt ──────────────────────────────────────────────────────
// Passed as options.systemPrompt to agentDecide so the full tool-routing
// context (CORE_TOOLS, DATA_DIR paths, skill guidance) is ALSO built.
// Before v6.0.1 this was injected as a system message, which caused
// agentDecide to skip its own comprehensive prompt — leading to wrong-tool
// selection (e.g. web_search instead of write_file) and wrong DATA_DIR paths.
const BUDDY_SYSTEM_PROMPT =
    'EXECUTE tasks immediately. Never explain what you could do — just do it. ' +
    'If something fails, try an alternative. Always prefer tool calls over text responses.\n\n' +
    '## Desktop Buddy — Skales\n' +
    'You are Skales, a proactive desktop AI assistant living in a compact overlay widget.\n' +
    'Keep ALL answers to 1-3 sentences maximum unless a tool result requires more.\n\n' +
    '### Buddy-specific rules:\n' +
    '- You have full access to all tools: file operations, shell commands, email, browser, calendar, and more.\n' +
    '- Execute tasks directly when asked. Do NOT just describe what you would do.\n' +
    '- Some actions require user approval — the widget shows approve/decline buttons.\n' +
    '- For tool results longer than 200 characters: summarise in 1-2 sentences and\n' +
    '  mention the user can "Open Chat for details".\n' +
    '- For questions and conversation: respond in 1-3 sentences.\n' +
    '- Be helpful, proactive, and get things done.\n\n' +
    '### Proactive Behaviour (Buddy):\n' +
    '- After completing a task, suggest 1 logical next step.\n' +
    '- If a tool fails, try an alternative before giving up.\n' +
    '- If you spot issues in files or configs while working, flag them briefly.\n' +
    '- If the user seems stuck or vague, make your best guess and act — then confirm.\n' +
    '- Never say "I can\'t" without checking your tools and capabilities first.';

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    noStore();

    let message: string;
    try {
        const body = await req.json() as { message?: string };
        message = (body.message ?? '').trim();
        if (!message) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        // ── Get active session for history context ────────────────────────────
        const sessionId = (await getActiveSessionId()) ?? undefined;

        // Load short context window (last 10 plain messages, strip orphan tool msgs)
        let history: { role: string; content: string }[] = [];
        if (sessionId) {
            const session = await loadSession(sessionId);
            if (session?.messages) {
                history = session.messages
                    .filter((m: any) => {
                        if (m.role !== 'user' && m.role !== 'assistant') return false;
                        if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) return false;
                        return true;
                    })
                    .slice(-10)
                    .map((m: any) => ({
                        role:    m.role as 'user' | 'assistant',
                        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                    }));
            }
        }

        // ── Build messages for agentDecide ────────────────────────────────────
        // NOTE: No system message in this array! The buddy system prompt is
        // passed via options.systemPrompt so agentDecide builds its FULL
        // tool-routing context on top of it (CORE_TOOLS, DATA_DIR, skills).
        const messages = [
            ...history,
            { role: 'user', content: message },
        ];

        // ── Ask the LLM (with tools) ──────────────────────────────────────────
        const decision = await agentDecide(messages, {
            systemPrompt: BUDDY_SYSTEM_PROMPT,
        });

        if (decision.decision === 'error') {
            return NextResponse.json(
                { error: decision.error ?? serverT('system.errors.generic') },
                { status: 502 }
            );
        }

        // ── Tool call path ────────────────────────────────────────────────────
        if (decision.decision === 'tool' && decision.toolCalls && decision.toolCalls.length > 0) {
            // Run agentExecute WITHOUT confirmedIds first to classify each call
            const initialResults = await agentExecute(decision.toolCalls);

            // Split into: needs approval vs. auto-executed
            const needsApproval = decision.toolCalls.filter((_, i) =>
                initialResults[i]?.requiresConfirmation === true
            );
            const autoResults = initialResults.filter(r => !r.requiresConfirmation);

            if (needsApproval.length > 0) {
                // Store pending tool calls in session for approval route to pick up
                if (sessionId) {
                    const session = await loadSession(sessionId);
                    if (session) {
                        (session as any).buddyPendingToolCalls = needsApproval;
                        await saveSession(session);
                    }
                }

                // Build approval message describing each pending action
                const toolDescriptions = needsApproval.map(tc => {
                    const result = initialResults.find(r => r.toolName === tc.function.name);
                    return result?.confirmationMessage || tc.function.name;
                });

                return NextResponse.json({
                    type: 'approval_needed',
                    tools: toolDescriptions,
                    toolCallIds: needsApproval.map(tc => tc.id),
                    sessionId,
                });
            }

            // All auto-executed — build a summary response
            const summaryParts = autoResults.map(r => {
                const msg = r.displayMessage || (r.success ? 'Done.' : 'Failed.');
                return msg.length > 150 ? msg.slice(0, 147) + '...' : msg;
            });

            const summary = summaryParts.join(' ');
            const wasLong = summary.length > 200;

            // Save to session
            if (sessionId) {
                const session = await loadSession(sessionId);
                if (session) {
                    session.messages.push(
                        { role: 'user', content: message, timestamp: Date.now(), source: 'buddy' },
                        { role: 'assistant', content: summary, timestamp: Date.now(), source: 'buddy' }
                    );
                    await saveSession(session);
                }
            }

            return NextResponse.json({
                type: 'tool_result',
                content: summary,
                wasLong,
            });
        }

        // ── Plain text response ───────────────────────────────────────────────
        const content = (decision.response ?? '').trim() || 'No response.';

        // Save to session
        if (sessionId) {
            const session = await loadSession(sessionId);
            if (session) {
                session.messages.push(
                    { role: 'user', content: message, timestamp: Date.now(), source: 'buddy' },
                    { role: 'assistant', content, timestamp: Date.now(), source: 'buddy' }
                );
                await saveSession(session);
            }
        }

        return NextResponse.json({ content });

    } catch (err: any) {
        console.error('[Skales Buddy] /api/buddy-chat error:', err?.message ?? err);
        return NextResponse.json(
            { error: err?.message ?? serverT('system.errors.generic') },
            { status: 500 }
        );
    }
}
