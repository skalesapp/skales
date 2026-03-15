import { NextRequest, NextResponse } from 'next/server';
import { createSession, loadSession, saveSession, type ChatMessage } from '@/actions/chat';
import { agentDecide, agentExecute } from '@/actions/orchestrator';
import { loadSettings } from '@/actions/chat';
import { telegramQueue } from '@/lib/message-queue';
import { saveApproval, purgeExpired } from '@/lib/approval-store';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Never cache — live Telegram message handler
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { DATA_DIR } from '@/lib/paths';
const ACTIVE_SESSION_FILE = path.join(DATA_DIR, 'active-session.json');
// Keep this for backwards compat but always prefer active-session.json
const TELEGRAM_SESSION_FILE = path.join(DATA_DIR, 'integrations', 'telegram-session.json');

/**
 * Get the current Telegram session ID.
 * Priority: 1. active-session.json (the chat window's current session)
 *           2. telegram-session.json (fallback for when chat is closed)
 * This ensures Telegram always writes into whichever chat the user has open.
 */
function getActiveTelegramSessionId(): string | null {
    // 1. Try the main active-session.json first (the chat window session)
    try {
        if (fs.existsSync(ACTIVE_SESSION_FILE)) {
            const data = JSON.parse(fs.readFileSync(ACTIVE_SESSION_FILE, 'utf-8'));
            if (data.sessionId) return data.sessionId;
        }
    } catch { }

    // 2. Fallback to telegram-specific session file
    try {
        if (fs.existsSync(TELEGRAM_SESSION_FILE)) {
            const data = JSON.parse(fs.readFileSync(TELEGRAM_SESSION_FILE, 'utf-8'));
            return data.sessionId || null;
        }
    } catch { }

    return null;
}

function setActiveTelegramSessionId(sessionId: string) {
    try {
        const dir = path.dirname(TELEGRAM_SESSION_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TELEGRAM_SESSION_FILE, JSON.stringify({ sessionId, updatedAt: Date.now() }));
    } catch { }
}

// ─── Core Telegram Processing ─────────────────────────────────
// Extracted so POST can re-use it for both the immediate message
// and any messages that were queued while processing was busy.

interface TelegramProcessResult {
    success: boolean;
    response: string;
    sessionId: string | null;
    generatedMedia: Array<{ type: 'image' | 'video'; filepath: string; prompt: string }>;
    voiceAlreadySent?: boolean;
    error?: string;
}

async function processOneTelegramMessage(
    message: string,
    telegramChatId: string,
    telegramUserName: string | undefined,
    imageDataUri: string | undefined,
    signal?: AbortSignal
): Promise<TelegramProcessResult> {
    // Re-load settings fresh for every message (user may have changed provider between messages)
    const settings = await loadSettings();
    let session: any = null;

    try {
        // 1. Get or Create Session
        let sessionId = getActiveTelegramSessionId();
        session = sessionId ? await loadSession(sessionId) : null;

        if (!session) {
            // Try to find the most recent existing session rather than always creating a new one
            try {
                const sessionsDir = path.join(DATA_DIR, 'sessions');
                if (fs.existsSync(sessionsDir)) {
                    const files = fs.readdirSync(sessionsDir)
                        .filter((f: string) => f.endsWith('.json') && !f.endsWith('.tmp'))
                        .map((f: string) => {
                            try {
                                const stat = fs.statSync(path.join(sessionsDir, f));
                                return { file: f, mtime: stat.mtimeMs };
                            } catch { return null; }
                        })
                        .filter(Boolean)
                        .sort((a: any, b: any) => b.mtime - a.mtime);

                    for (const entry of files.slice(0, 3)) {
                        try {
                            const raw = fs.readFileSync(path.join(sessionsDir, (entry as any).file), 'utf-8');
                            const data = JSON.parse(raw);
                            if (data.id && Array.isArray(data.messages)) {
                                const candidate = await loadSession(data.id);
                                if (candidate) {
                                    session = candidate;
                                    sessionId = candidate.id;
                                    break;
                                }
                            }
                        } catch { /* skip */ }
                    }
                }
            } catch { /* fall through to create new */ }

            if (!session) {
                session = await createSession(`Telegram Chat with ${telegramUserName || 'User'}`, 'skales');
                sessionId = session.id;
            }

            setActiveTelegramSessionId(sessionId!);
            fs.writeFileSync(ACTIVE_SESSION_FILE, JSON.stringify({ sessionId, updatedAt: Date.now() }));
        }

        // Ensure the fallback Telegram session pointer is always synced
        if (sessionId) setActiveTelegramSessionId(sessionId);

        // 2. Add User Message to Session
        const interactionStartIdx = session.messages.length;

        const userMsgContent: any = imageDataUri
            ? [
                { type: 'text', text: message },
                { type: 'image_url', image_url: { url: imageDataUri } },
            ]
            : message;

        const userMsg: ChatMessage = {
            role: 'user',
            content: userMsgContent,
            timestamp: Date.now(),
        };
        (userMsg as any).source = 'telegram';
        (userMsg as any).telegramUser = telegramUserName;

        session.messages.push(userMsg);
        await saveSession(session);

        // 3. Build Telegram-aware system prompt
        const { buildContext } = await import('@/actions/identity');
        const identityContext = await buildContext();

        const persona = settings.persona || 'default';
        const nativeLanguage = (settings as any).nativeLanguage || null;
        const langInstruction = nativeLanguage
            ? `Always reply in ${nativeLanguage} unless the user explicitly writes in another language.`
            : `Reply in the same language the user writes in.`;

        const PERSONA_PROMPTS: Record<string, string> = {
            default: `You are Skales, a friendly and capable AI assistant. You help with daily life, work, planning, and creativity. You are direct, helpful, and have a good sense of humor. ${langInstruction}`,
            entrepreneur: `You are Skales in Entrepreneur mode. Sharp business advisor for strategy, marketing, finance, and growth. Direct, data-driven, actionable.`,
            family: `You are Skales in Family mode. Warm, patient helper for everyday tasks — recipes, scheduling, health tips, parenting. Simple and friendly.`,
            coder: `You are Skales in Coder mode. Senior software engineer. Clean, efficient code. Best practices.`,
            student: `You are Skales in Student mode. Patient tutor. Step-by-step explanations. Examples and encouragement.`,
        };
        const basePersona = settings.systemPrompt || PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.default;

        let telegramSystemPrompt = `${basePersona}

${identityContext}

## You are operating via Telegram

The user "${telegramUserName || 'User'}" is messaging you through Telegram. You have EXACTLY THE SAME capabilities as in the Skales Dashboard chat. You are NOT a limited chatbot — you are the full Skales agent with all tools.

## Your full capabilities (USE THEM!)

You have access to powerful tools that let you interact with the user's computer. If the user asks you to DO something, use the appropriate tool. NEVER say "I can't do that" or "I'm just a text chatbot" — that is WRONG.

### Available Tools:
- **create_task** — Create tasks and to-dos
- **list_tasks** — Show current tasks
- **delete_task** — Delete a task
- **schedule_recurring_task** — Set up recurring tasks/reminders (e.g. "daily at 9am")
- **list_scheduled_tasks** — Show all scheduled tasks
- **delete_scheduled_task** — Delete a scheduled task
- **send_telegram_notification** — Send a proactive Telegram message
- **create_folder** — Create a folder
- **list_files** — List files
- **read_file** — Read file content
- **write_file** — Write/create files
- **delete_file** — Delete files
- **execute_command** — Run shell commands (PowerShell on Windows)
- **fetch_web_page** — Fetch a web page
- **extract_web_text** — Extract text from a web page
- **get_workspace_info** — Get workspace info
- **get_system_info** — Get system specs
- **generate_image** — Generate an image with AI (requires Google API key in Settings)
- **generate_video** — Generate a video with AI (requires Google API key in Settings)
- **search_gif** — Search for GIFs
- **send_gif_telegram** — Send a GIF via Telegram
- **generate_voice** — Generate a TTS voice message and send via Telegram (always available, no API key needed for basic TTS)
- **analyze_image** — Analyze an image sent by the user (returns vision capability status and model guidance)
- **check_capabilities** — Check active integrations
- **check_identity** — Check onboarding status
- **check_system_status** — Check system health

### Rules:
1. ALWAYS use tools when the user wants something DONE (create, schedule, remind, check, etc.)
2. Do NOT simulate or pretend — actually execute the tool
3. For reminders/scheduling: use **schedule_recurring_task** with cron expression
4. For one-time tasks: use **create_task**
5. After tool execution: briefly and friendly confirm what was done
6. ${langInstruction}
7. Keep Telegram replies short — no long markdown walls of text
8. Sending GIFs via Telegram is possible: search_gif + send_gif_telegram
9. Image generation: use generate_image tool — the image will be automatically sent to Telegram after generation

You are the same Skales as in the Dashboard. Same brain, same tools, same capabilities. Act accordingly.`;

        // ── Prepend EXECUTION MANDATE so Telegram uses the same agent behavior as Dashboard ──
        const safetyMode: string = (settings as any).safetyMode || 'safe';
        const platformBlock = process.platform === 'win32'
            ? `PLATFORM: You are running on WINDOWS.\nWINDOWS RULES:\n- Use PowerShell syntax for ALL commands\n- Paths use backslash: C:\\Users\\...\n- NEVER use: head, tail, grep, cat, ls, rm, cp, mv, touch\n- ALWAYS use: Select-Object, Select-String, Get-Content, Get-ChildItem, Remove-Item, Copy-Item, Move-Item, New-Item\n- Home directory: $env:USERPROFILE\n`
            : `PLATFORM: You are running on macOS.\nmacOS RULES:\n- Use bash/zsh syntax for ALL commands\n- Paths use forward slash: /Users/...\n- Home directory: $HOME or ~\n`;

        const executionMandate = `EXECUTION MANDATE — THIS OVERRIDES EVERYTHING BELOW:

You are an AGENT. Your job is to EXECUTE tasks, not DISCUSS them.

RULES:
1. When a user asks you to do something: DO IT IMMEDIATELY.
   Do not explain what you will do. Do not list your capabilities.
   Do not ask for confirmation unless Safety Mode requires it.
   Just execute the task.

2. If a task fails: TRY AN ALTERNATIVE APPROACH immediately.
   Do not say "I can't do this because..."
   Say "That approach failed. Trying alternative..." and DO IT.

3. NEVER respond with just text when a tool call would accomplish
   the task. If the user says "create a file" — call write_file.
   If the user says "check my email" — call list_emails.
   If the user says "search for X" — call search_web.
   ALWAYS prefer action over explanation.

4. After completing a task: REPORT THE RESULT briefly, then
   SUGGEST THE NEXT STEP.

5. If you genuinely cannot do something (no tool exists, no API
   configured): say so in ONE sentence, then OFFER the closest
   alternative you CAN do.

6. NEVER list your capabilities unprompted. If the user asks
   what you can do, demonstrate by doing something useful
   instead of listing features.

${platformBlock}
`;

        const unrestrictedBlock = safetyMode === 'unrestricted' ? `
UNRESTRICTED MODE ACTIVE: You have full permission to execute ANY action
without asking. When you decide to do something, CALL THE TOOL IMMEDIATELY.
Do not say "I will do X" — just do X. Every message from you should
contain at least one tool call if the task requires action. Text-only
responses are only acceptable for pure questions or conversations.
` : '';

        telegramSystemPrompt = `${executionMandate}${unrestrictedBlock}${telegramSystemPrompt}`;

        // ── Vision Provider pre-analysis ─────────────────────────────────────
        // When an image arrives via Telegram, check if:
        //   (a) The Vision Provider is configured with visionUseForTelegram=true, OR
        //   (b) The active main LLM is unlikely to support vision natively
        // If either is true, use the Vision Provider to describe the image FIRST,
        // then replace the image content with a text description so ANY main LLM
        // (even non-vision models) can understand and respond to the image.
        if (imageDataUri) {
            try {
                const { getBrowserControlConfig, analyzeImageWithVisionProvider } = await import('@/actions/browser-control');
                const visionCfg = await getBrowserControlConfig();

                const activeModel = settings.providers?.[settings.activeProvider]?.model || '';
                const visionPatterns = ['gpt-4', 'claude-3', 'gemini', 'vision', 'llama-4',
                    'pixtral', 'grok', 'qvq', 'molmo', 'qwen-vl', 'mistral-large'];
                const nonVisionPatterns = ['gpt-3.5', 'llama-3.3', 'llama-3.1', 'llama-3.2', 'mixtral', 'gemma', 'mistral-7b'];
                const isLikelyVision = visionPatterns.some(p => activeModel.toLowerCase().includes(p)) &&
                    !nonVisionPatterns.some(p => activeModel.toLowerCase().includes(p));

                const shouldUseVisionProvider =
                    (visionCfg.visionApiKey && visionCfg.visionUseForTelegram) ||
                    (visionCfg.visionApiKey && !isLikelyVision);

                if (shouldUseVisionProvider) {
                    const analysisResult = await analyzeImageWithVisionProvider(imageDataUri);
                    if (analysisResult.success && analysisResult.description) {
                        // Replace the multimodal message with text-only: description prepended to user text
                        const rawContent: any = userMsg.content;
                        const userText = typeof rawContent === 'string'
                            ? rawContent
                            : (Array.isArray(rawContent)
                                ? ((rawContent as any[]).find((c: any) => c.type === 'text')?.text ?? '')
                                : '');
                        const textWithVision = `[📷 Image analyzed by Vision Provider]\n${analysisResult.description}${userText ? `\n\nUser's message: ${userText}` : ''}`;
                        userMsg.content = textWithVision;
                        // Also update session message we already pushed
                        const lastIdx = session.messages.length - 1;
                        if (session.messages[lastIdx]?.role === 'user') {
                            session.messages[lastIdx].content = textWithVision;
                        }
                        // Nullify imageDataUri so the main LLM call sends text only
                        // (we already updated the message content above)
                        (userMsg as any)._visionDescribed = true;
                        telegramSystemPrompt += `\n\nℹ️ The user sent an image. It has been analyzed by the Vision Provider and the description is included in the message above as "[📷 Image analyzed by Vision Provider]". Respond to the image content naturally.`;
                    }
                } else if (!isLikelyVision && activeModel) {
                    // Main LLM likely non-vision, no Vision Provider fallback → inform user clearly
                    telegramSystemPrompt += `\n\n⚠️ VISION NOTE: The active model "${activeModel}" may not support image analysis. If you cannot process the image, tell the user to enable the Vision Provider in Settings → Vision Provider with "Telegram" checked.`;
                }
            } catch { /* vision pre-analysis is non-fatal */ }
        }

        // 4. Run Agent Tool Loop
        const MAX_LOOPS = 4;
        let loopCount = 0;
        let finalResponse = '';

        // CRITICAL: strip tool-role messages and assistant messages that have tool_calls
        // from the initial session history. Orphaned tool messages (tool result without a
        // preceding assistant+tool_calls pair) cause API 400 "Message has tool role" errors.
        // The current-interaction tool loop (currentMessages) handles tool pairs correctly —
        // this filter only applies to the historical context loaded from the session file.
        const sessionHistory = session.messages
            .filter((m: ChatMessage) => {
                if (m.role !== 'user' && m.role !== 'assistant') return false; // exclude tool, system, etc.
                if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) return false; // exclude assistant msgs that issued tool calls
                return true;
            })
            .slice(-30);

        let currentMessages = [...sessionHistory];

        while (loopCount < MAX_LOOPS) {
            // Check for abort signal between iterations
            if (signal?.aborted) {
                finalResponse = '⚠️ Request cancelled.';
                break;
            }

            loopCount++;

            const apiMessages = [
                { role: 'system', content: telegramSystemPrompt },
                ...currentMessages.map((m: ChatMessage) => ({
                    role: m.role,
                    content: m.content,
                    tool_calls: m.tool_calls,
                    tool_call_id: m.tool_call_id,
                    name: m.name
                }))
            ];

            // If Vision Provider already described the image, skip forceVision so the main
            // LLM receives text only (no raw image). If image was NOT pre-described, still
            // use forceVision on loop 1 to let the main LLM handle it natively.
            const visionAlreadyDescribed = !!(userMsg as any)._visionDescribed;
            const decision = await agentDecide(apiMessages as any, {
                provider: settings.activeProvider,
                model: settings.providers[settings.activeProvider].model,
                ...(imageDataUri && !visionAlreadyDescribed && loopCount === 1 ? { forceVision: true, noTools: true } : {}),
                signal,
            });

            if (decision.decision === 'error') {
                const errMsg = decision.error || '';
                const isVisionError = imageDataUri && !visionAlreadyDescribed &&
                    /image|vision|404|400|endpoint|multimodal|unsupported|no.*support/i.test(errMsg);

                const lastUserIdx = session.messages.map((m: ChatMessage) => m.role).lastIndexOf('user');
                if (lastUserIdx >= 0) {
                    session.messages.splice(lastUserIdx, 1);
                }

                if (isVisionError) {
                    finalResponse = '📷 Your current model doesn\'t support image analysis directly. Enable the Vision Provider in Settings → Vision Provider and check "Telegram" to analyze images with any LLM.';
                } else {
                    finalResponse = `⚠️ Error: ${errMsg}`;
                }

                const errorAssistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: finalResponse,
                    timestamp: Date.now(),
                };
                (errorAssistantMsg as any).source = 'telegram';
                session.messages.push(errorAssistantMsg);
                await saveSession(session);
                break;
            }

            if (decision.decision === 'response') {
                finalResponse = decision.response || '';

                // ── Safe Mode reinforcement: if the agent returned a text-only
                // response on the FIRST loop for a message that looks like an
                // action request, push a reinforcement message and retry ONCE so
                // weaker models actually emit tool calls instead of describing
                // what they *would* do. ──────────────────────────────────────
                const ACTION_WORDS = /\b(create|delete|open|send|make|search|find|write|read|list|schedule|remind|check|generate|fetch|run|execute|set|add|remove|show|get|play|download|upload|pair|start|stop|turn|install)\b/i;
                if (loopCount === 1 && ACTION_WORDS.test(message)) {
                    // Add the assistant's text response to context, then inject a
                    // reinforcement user message and loop again.
                    currentMessages.push({
                        role: 'assistant',
                        content: finalResponse,
                    } as ChatMessage);
                    currentMessages.push({
                        role: 'user',
                        content: 'You MUST use tools to complete this task. Do NOT describe what you would do — call the appropriate tool NOW. If the task needs approval, return the tool call with requiresConfirmation: true.',
                    } as ChatMessage);
                    continue; // re-enter the while loop for one more agentDecide() call
                }

                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: finalResponse,
                    timestamp: Date.now(),
                };
                (assistantMsg as any).source = 'telegram';
                if (decision.tokensUsed) (assistantMsg as any).tokensUsed = decision.tokensUsed;
                if (decision.model) (assistantMsg as any).model = decision.model;
                session.messages.push(assistantMsg);
                await saveSession(session);
                break;
            }

            if (decision.decision === 'tool') {
                const toolCalls = decision.toolCalls!;

                const thoughtMsg: ChatMessage = {
                    role: 'assistant',
                    content: decision.response || '',
                    tool_calls: toolCalls,
                    timestamp: Date.now(),
                };
                (thoughtMsg as any).source = 'telegram';
                if (decision.tokensUsed) (thoughtMsg as any).tokensUsed = decision.tokensUsed;
                if (decision.model) (thoughtMsg as any).model = decision.model;
                session.messages.push(thoughtMsg);
                currentMessages.push(thoughtMsg);
                await saveSession(session);

                const results = await agentExecute(toolCalls);

                // ── Approval gate — any tool needing confirmation? ────────────────────
                const needsApproval = results.filter(r => r.requiresConfirmation);
                if (needsApproval.length > 0) {
                    // Build human-readable descriptions and persist approval state
                    const descriptions: string[] = results.map(r => r.confirmationMessage || r.toolName || 'unknown action');
                    const approvalId = randomUUID();

                    // Get Telegram config for the approval endpoint to use when resuming
                    let tgToken = '';
                    let tgChatId = telegramChatId;
                    try {
                        const { loadTelegramConfig } = await import('@/actions/telegram');
                        const cfg = await loadTelegramConfig();
                        tgToken = cfg?.botToken ?? '';
                    } catch { /* non-fatal */ }

                    purgeExpired();
                    saveApproval({
                        id:             approvalId,
                        sessionId:      session.id,
                        toolCalls,
                        descriptions,
                        createdAt:      Date.now(),
                        telegramChatId: tgChatId,
                        telegramToken:  tgToken,
                        source:         'telegram',
                    });

                    // Build the approval message with inline keyboard
                    const actionList = descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n');
                    finalResponse = `🔐 *Approval required*\n\nSkales wants to:\n${actionList}\n\nPlease confirm:`;

                    // Return with special flag so telegram-bot.js sends the inline keyboard
                    const assistantMsg: ChatMessage = {
                        role: 'assistant',
                        content: finalResponse,
                        timestamp: Date.now(),
                    };
                    (assistantMsg as any).source = 'telegram';
                    session.messages.push(assistantMsg);
                    await saveSession(session);

                    return {
                        success: true,
                        response: finalResponse,
                        sessionId: session.id,
                        generatedMedia: [],
                        requiresApproval: true,
                        approvalId,
                    } as any;
                }
                // ── Normal tool execution ──────────────────────────────────────────────

                for (let i = 0; i < results.length; i++) {
                    const res = results[i];
                    const toolMsg: ChatMessage = {
                        role: 'tool',
                        content: JSON.stringify(res.result),
                        tool_call_id: toolCalls[i].id,
                        name: toolCalls[i].function.name,
                        display_message: res.displayMessage,
                        timestamp: Date.now(),
                    };
                    session.messages.push(toolMsg);
                    currentMessages.push(toolMsg);
                }
                await saveSession(session);
            }
        }

        // 5. Save memory
        try {
            const { updateRelationship, addMemory, extractMemoriesFromInteraction } = await import('@/actions/identity');
            await updateRelationship(true);
            await addMemory('short-term', {
                // Do NOT prefix with "[Telegram]" — it pollutes the word cloud in dashboard.
                // The `context` field carries source info without affecting word frequency.
                summary: `${telegramUserName || 'User'}: ${message.slice(0, 100)}`,
                context: 'telegram',
                sessionId: session?.id || undefined,
            });
            if (finalResponse) {
                await extractMemoriesFromInteraction(message, finalResponse, settings);
            }
        } catch (memErr) {
            console.warn('[Telegram API] Memory save failed (non-critical):', memErr);
        }

        // 6. Collect generated media + detect if voice was already sent by generate_voice tool
        const generatedMedia: Array<{ type: 'image' | 'video'; filepath: string; prompt: string }> = [];
        let voiceAlreadySent = false;
        const interactionMsgs = session.messages.slice(interactionStartIdx);

        // Build a set of tool_call_ids for generate_voice calls from assistant messages
        const voiceToolCallIds = new Set<string>();
        for (const msg of interactionMsgs) {
            if (msg.role === 'assistant') {
                const tc = (msg as any).tool_calls;
                if (Array.isArray(tc)) {
                    for (const call of tc) {
                        if (call?.function?.name === 'generate_voice') {
                            voiceToolCallIds.add(call.id);
                        }
                    }
                }
            }
        }

        for (const msg of interactionMsgs) {
            if (msg.role !== 'tool') continue;
            // Check if this tool result belongs to a generate_voice call
            const callId = (msg as any).tool_call_id;
            if (callId && voiceToolCallIds.has(callId)) {
                try {
                    const result = JSON.parse(typeof msg.content === 'string' ? msg.content : '{}');
                    if (result?.sent === true || result?.provider) voiceAlreadySent = true;
                } catch { /* ignore parse error */ }
            }
            const dm = (msg as any).display_message as string | undefined;
            if (!dm) continue;
            if (dm.startsWith('IMG_FILE:')) {
                const inner = dm.replace('IMG_FILE:', '');
                const parts = inner.split('|');
                generatedMedia.push({ type: 'image', filepath: parts[0] || '', prompt: parts[1] || '' });
            } else if (dm.startsWith('VIDEO_FILE:')) {
                const inner = dm.replace('VIDEO_FILE:', '');
                const parts = inner.split('|');
                generatedMedia.push({ type: 'video', filepath: parts[0] || '', prompt: parts[1] || '' });
            }
        }

        return { success: true, response: finalResponse, sessionId: session.id, generatedMedia, voiceAlreadySent };

    } catch (error: any) {
        console.error('[Telegram API] processOneTelegramMessage error:', error);

        // Strip the broken user message from session on unexpected crashes
        if (session?.messages) {
            const lastUserIdx = session.messages.map((m: any) => m.role).lastIndexOf('user');
            if (lastUserIdx >= 0) {
                session.messages.splice(lastUserIdx, 1);
                saveSession(session).catch(() => { });
            }
        }

        return { success: false, response: '', sessionId: null, generatedMedia: [], error: error.message };
    }
}

// ─── POST Handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (req.signal.aborted) {
        return NextResponse.json({ success: false, error: 'Request aborted by client' }, { status: 499 });
    }

    try {
        const body = await req.json();
        const { message, telegramChatId, telegramUserName, imageDataUri } = body;

        if (!message || !telegramChatId) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        // ── Security: verify Telegram integration is configured and chat ID is authorized ──
        const { loadTelegramConfig, sendMessage } = await import('@/actions/telegram');
        const tgConfig = await loadTelegramConfig();

        if (!tgConfig?.enabled || !tgConfig?.botToken) {
            return NextResponse.json({ success: false, error: 'Telegram not configured' }, { status: 403 });
        }

        if (tgConfig.pairedChatId && String(tgConfig.pairedChatId) !== String(telegramChatId)) {
            console.warn('[Telegram API] Rejected unauthorized chat ID:', telegramChatId);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // ── Queue Guard ────────────────────────────────────────
        // If Skales is already processing a Telegram message, queue this one
        // and immediately return a system confirmation message (no LLM call).
        if (telegramQueue.isProcessing) {
            const result = telegramQueue.add(message, 'telegram', {
                telegramChatId,
                telegramUserName,
                imageDataUri,
                botToken: tgConfig.botToken,
            });

            if (!result.success) {
                // Queue is full — notify user without LLM
                await sendMessage(
                    tgConfig.botToken,
                    telegramChatId,
                    `❌ Message queue is full (max 20 messages). Please wait a moment and try again.`
                );
                return NextResponse.json({ success: false, error: result.error });
            }

            // Notify user their message is queued — pure system message, NO LLM call
            await sendMessage(
                tgConfig.botToken,
                telegramChatId,
                `⏳ Got it! I'm still working on your previous message. Your message is queued (position ${result.position}).`
            );
            return NextResponse.json({ success: true, queued: true, position: result.position, id: result.id });
        }

        // ── Acquire Processing Lock ────────────────────────────
        const abortController = new AbortController();
        telegramQueue.setProcessing(true, abortController);

        // ── Thinking Indicator ────────────────────────────────
        // Send immediately so the user knows the message was received,
        // even if the LLM (deep-reasoning models, tool chains) takes a long time.
        try {
            await sendMessage(tgConfig.botToken, telegramChatId, '🤔 Thinking...');
        } catch { /* non-critical — continue even if this fails */ }

        const PROCESSING_TIMEOUT_MS = 180_000; // 3 minutes max per message

        let lastResponse = '';
        let lastSessionId: string | null = null;
        let lastMedia: Array<{ type: 'image' | 'video'; filepath: string; prompt: string }> = [];
        let lastVoiceAlreadySent = false;

        try {
            // Race the main processing against a hard 3-minute timeout.
            // This prevents Telegram messages from being permanently lost when
            // extended reasoning or a long tool chain exceeds the bot's HTTP timeout.
            const timeoutPromise: Promise<TelegramProcessResult> = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PROCESSING_TIMEOUT')), PROCESSING_TIMEOUT_MS)
            );

            let result: TelegramProcessResult;
            try {
                result = await Promise.race([
                    processOneTelegramMessage(message, telegramChatId, telegramUserName, imageDataUri, abortController.signal),
                    timeoutPromise,
                ]);
            } catch (raceErr: any) {
                if (raceErr?.message === 'PROCESSING_TIMEOUT') {
                    abortController.abort();
                    try {
                        await sendMessage(
                            tgConfig.botToken, telegramChatId,
                            `⏱️ Sorry, this question took too long to process (> ${PROCESSING_TIMEOUT_MS / 1000}s). Try rephrasing or breaking it into smaller questions.`
                        );
                    } catch { /* ignore send error */ }
                    return NextResponse.json({ success: false, error: 'Processing timeout' }, { status: 504 });
                }
                throw raceErr;
            }

            lastResponse = result.response;
            lastSessionId = result.sessionId;
            lastMedia = result.generatedMedia;
            lastVoiceAlreadySent = result.voiceAlreadySent ?? false;

            // Send the response to Telegram (the telegram-bot.js handles this for the first
            // message since it awaits the response from this route, but queued messages
            // need to be sent manually since their bot-process context is gone)
            // The bot awaits this route's JSON response to send it — so only queued messages
            // need explicit sendMessage calls here.

            // ── Drain the Queue ────────────────────────────────
            // Process any messages that arrived while we were busy.
            while (telegramQueue.peek()) {
                if (abortController.signal.aborted) break;

                const next = telegramQueue.next()!;
                const nextChatId = (next.metadata?.telegramChatId as string) || telegramChatId;
                const nextUserName = (next.metadata?.telegramUserName as string | undefined) || telegramUserName;
                const nextImageUri = next.metadata?.imageDataUri as string | undefined;
                const nextToken = (next.metadata?.botToken as string) || tgConfig.botToken;

                console.log(`[Telegram Queue] Processing queued message from ${nextUserName || 'User'}: "${next.message.slice(0, 40)}..."`);

                const queuedResult = await processOneTelegramMessage(
                    next.message,
                    nextChatId,
                    nextUserName,
                    nextImageUri,
                    abortController.signal
                );

                lastResponse = queuedResult.response;
                lastSessionId = queuedResult.sessionId;
                lastMedia = queuedResult.generatedMedia;

                // Send queued message response directly to Telegram
                // (bot-process is no longer waiting for this one)
                if (queuedResult.response) {
                    try {
                        await sendMessage(nextToken, nextChatId, queuedResult.response);
                    } catch (sendErr) {
                        console.warn('[Telegram Queue] Could not send queued response:', sendErr);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                response: lastResponse,
                sessionId: lastSessionId,
                generatedMedia: lastMedia,
                voiceAlreadySent: lastVoiceAlreadySent,
            });

        } catch (error: any) {
            console.error('[Telegram API] Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        } finally {
            // Always release the lock — even if something throws
            telegramQueue.setProcessing(false);
        }

    } catch (error: any) {
        console.error('[Telegram API] Outer error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
