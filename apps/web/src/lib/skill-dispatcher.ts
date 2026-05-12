/**
 * Skales — Meta-Agent Skill Dispatcher (Phase 5)
 *
 * Gives the Autopilot runner programmatic, isolated access to EVERY
 * active Skales skill without touching the user's foreground UI.
 *
 * Design principles:
 *  - HEADLESS: All skill invocations run in the background. They NEVER
 *    write to the user's chat history, sessions, or active UI state.
 *  - ISOLATED: Each invocation gets its own ephemeral context object.
 *    No shared mutable state bleeds between tasks.
 *  - DETERMINISTIC: Returns a structured DispatchResult — never throws
 *    to the caller; errors are always captured and returned.
 *  - EXTENSIBLE: Adding a new skill = adding one entry to SKILL_HANDLERS.
 *
 * Supported skill categories:
 *  - Web search (Tavily)
 *  - Browser/Playwright automation
 *  - Document generation (xlsx, docx, pdf)
 *  - Email send (SMTP)
 *  - Twitter/X post
 *  - Telegram message
 *  - Calendar event creation
 *  - Network scan
 *  - Code execution (LLM-generated)
 *  - OODA Re-planner (analyze + rewrite pending tasks)
 *  - Sub-agent group chat (internal multi-agent deliberation)
 */

import { AgentTask } from '@/lib/agent-tasks';
import { log }       from '@/lib/autopilot-logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DispatchResult {
    success:  boolean;
    output?:  string;   // human-readable summary of what was done
    data?:    any;      // structured result (file paths, scan results, etc.)
    error?:   string;
    skillId?: string;
}

export interface SkillContext {
    task:     AgentTask;
    settings: any;       // full SkalesSettings from loadSettings()
    /** True = running silently in background (always true for Autopilot) */
    headless: true;
}

type SkillHandler = (ctx: SkillContext, params: Record<string, any>) => Promise<DispatchResult>;

// ─── Critical Action Detector ─────────────────────────────────────────────────

/**
 * Heuristically detect if a task description implies a "critical action"
 * that requires human approval before execution.
 *
 * Returns a reason string if approval is needed, or null if safe to auto-run.
 */
export function detectCriticalAction(title: string, description: string): string | null {
    const text = `${title} ${description}`.toLowerCase();

    if (/\b(send|broadcast|mass.?email|blast|newsletter|dm.?all|bulk.?message)\b/.test(text)) {
        return 'This task involves sending mass communications.';
    }
    if (/\b(delete|remove|wipe|purge|erase|destroy|rm\s+-rf)\b/.test(text)) {
        return 'This task involves deleting files or data.';
    }
    if (/\b(purchase|buy|pay|charge|transaction|invoice|checkout|spend)\b/.test(text)) {
        return 'This task involves financial transactions.';
    }
    if (/\b(post.*(twitter|tweet|instagram|linkedin|facebook)|publish.*(article|post|blog))\b/.test(text)) {
        return 'This task involves publishing public content.';
    }
    if (/\b(share.*(credentials|password|api.?key|secret|token))\b/.test(text)) {
        return 'This task involves sharing sensitive credentials.';
    }
    return null;
}

// ─── Skill Handlers ───────────────────────────────────────────────────────────

const SKILL_HANDLERS: Record<string, SkillHandler> = {

    // ── Web Search ──────────────────────────────────────────────────────────
    web_search: async (ctx, params) => {
        const key = ctx.settings?.tavilyApiKey;
        if (!key) return { success: false, error: 'Tavily API key not configured.' };

        const query = params.query ?? ctx.task.title;
        try {
            const res = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: key, query, search_depth: 'basic', max_results: 5 }),
            });
            if (!res.ok) throw new Error(`Tavily ${res.status}`);
            const data = await res.json();
            const results: string[] = (data.results ?? []).slice(0, 5).map(
                (r: any) => `• ${r.title}: ${r.content?.slice(0, 200) ?? ''}`,
            );
            const output = `Web search for "${query}":\n${results.join('\n')}`;
            log.success('skill_used', `🔍 Web search: "${query}"`, { taskId: ctx.task.id, detail: { resultCount: results.length } });
            return { success: true, output, data: data.results, skillId: 'web_search' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'web_search' };
        }
    },

    // ── Document Generation ─────────────────────────────────────────────────
    documents: async (ctx, params) => {
        try {
            const { createDocument } = await import('@/actions/documents');
            const result = await createDocument({
                filename: params.filename ?? `autopilot_${Date.now()}`,
                sections: params.sections ?? [{ type: 'paragraph', text: ctx.task.result ?? ctx.task.description }],
                title:    params.title    ?? ctx.task.title,
                author:   'Skales Autopilot',
            });
            log.success('skill_used', `📄 Document generated: ${params.filename}`, { taskId: ctx.task.id });
            return { success: result.success, output: `Document created: ${result.docxPath ?? result.pdfPath}`, data: result, skillId: 'documents' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'documents' };
        }
    },

    // ── Network Scanner ─────────────────────────────────────────────────────
    network_scanner: async (ctx, params) => {
        try {
            const { findSkalesInstances, scanLocalNetwork } = await import('@/actions/network-scanner');
            const result = params.mode === 'full' ? await scanLocalNetwork() : await findSkalesInstances();
            log.success('skill_used', `📡 Network scan completed (${result.hosts?.length ?? 0} hosts found)`, { taskId: ctx.task.id });
            return { success: result.success, output: `Found ${result.hosts?.length ?? 0} live hosts, ${result.skalesInstances?.length ?? 0} Skales instances.`, data: result, skillId: 'network_scanner' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'network_scanner' };
        }
    },

    // ── Email ───────────────────────────────────────────────────────────────
    email: async (ctx, params) => {
        try {
            const { sendEmail } = await import('@/actions/email');
            const result = await (sendEmail as any)({ to: params.to, subject: params.subject ?? ctx.task.title, body: params.body ?? ctx.task.description });
            log.success('skill_used', `📧 Email sent to ${params.to}`, { taskId: ctx.task.id });
            return { success: true, output: `Email sent to ${params.to}`, data: result, skillId: 'email' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'email' };
        }
    },

    // ── Twitter/X ───────────────────────────────────────────────────────────
    twitter: async (ctx, params) => {
        try {
            const { postTweet } = await import('@/actions/twitter');
            const result = await (postTweet as any)({ text: params.text ?? ctx.task.description.slice(0, 280) });
            log.success('skill_used', `🐦 Tweet posted`, { taskId: ctx.task.id });
            return { success: true, output: 'Tweet posted successfully.', data: result, skillId: 'twitter' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'twitter' };
        }
    },

    // ── Google Calendar ─────────────────────────────────────────────────────
    googleCalendar: async (ctx, params) => {
        try {
            const calMod = await import('@/actions/calendar');
            const result = await (calMod as any).createCalendarEvent({ summary: params.summary ?? ctx.task.title, description: params.description, start: params.start, end: params.end });
            log.success('skill_used', `📅 Calendar event created: ${params.summary}`, { taskId: ctx.task.id });
            return { success: true, output: `Calendar event created: ${params.summary}`, data: result, skillId: 'googleCalendar' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'googleCalendar' };
        }
    },

    // ── OODA Re-Planner ─────────────────────────────────────────────────────
    // Analyzes a piece of new context and autonomously rewrites pending tasks.
    ooda_replan: async (ctx, params) => {
        try {
            const { replanTasksFromContext } = await import('@/actions/autopilot');
            const result = await replanTasksFromContext({
                newContext: params.newContext ?? ctx.task.result ?? '',
                planTitle:  params.planTitle,
            });
            log.info('plan_created', `🔄 OODA re-plan triggered: ${params.newContext?.slice(0, 80)}`, { taskId: ctx.task.id });
            return { success: result.success, output: result.summary, data: result, skillId: 'ooda_replan' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'ooda_replan' };
        }
    },

    // ── Internal Sub-Agent Group Chat ────────────────────────────────────────
    // Spins up a headless multi-agent deliberation and returns the consensus.
    internal_group_chat: async (ctx, params) => {
        try {
            const settings = ctx.settings;
            const topic    = params.topic ?? ctx.task.description;
            const agents   = (params.agents as string[]) ?? ['Strategist', 'Critic', 'Executor'];

            // Each "agent" is a separate LLM call with a different persona
            const responses: { agent: string; response: string }[] = [];
            for (const agent of agents.slice(0, 4)) { // cap at 4 to avoid API spam
                const persona = `You are ${agent}, a specialist in ${topic.slice(0, 50)}. Give your 2-3 sentence perspective. Be direct.`;
                try {
                    const { callLLMDirect } = await import('@/lib/skill-dispatcher');
                    const resp = await callLLMDirect(settings, persona, `Evaluate this strategy: ${topic}`);
                    responses.push({ agent, response: resp });
                } catch { /* skip failed agent */ }
            }

            const consensus = responses.map(r => `**${r.agent}:** ${r.response}`).join('\n\n');
            log.success('skill_used', `🤖 Internal group chat: ${agents.join(', ')} deliberated on "${topic.slice(0, 60)}"`, { taskId: ctx.task.id });
            return { success: true, output: consensus, data: { agents: responses }, skillId: 'internal_group_chat' };
        } catch (e: any) {
            return { success: false, error: e.message, skillId: 'internal_group_chat' };
        }
    },
};

// ─── Internal LLM direct caller (exported for use by internal_group_chat) ────

export async function callLLMDirect(settings: any, systemPrompt: string, userMsg: string): Promise<string> {
    const provider = settings?.activeProvider ?? 'openrouter';
    const provCfg  = settings?.providers?.[provider] ?? {};
    const model    = provCfg.model ?? 'gpt-4o-mini';
    const apiKey   = provCfg.apiKey ?? '';
    if (!apiKey) throw new Error(`No API key for ${provider}`);

    if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model, max_tokens: 512, system: systemPrompt, messages: [{ role: 'user', content: userMsg }] }),
        });
        const d = await res.json();
        return d.content?.[0]?.text?.trim() ?? '';
    }

    const url = {
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
        openai:     'https://api.openai.com/v1/chat/completions',
        groq:       'https://api.groq.com/openai/v1/chat/completions',
        mistral:    'https://api.mistral.ai/v1/chat/completions',
        deepseek:   'https://api.deepseek.com/v1/chat/completions',
        xai:        'https://api.x.ai/v1/chat/completions',
        together:   'https://api.together.xyz/v1/chat/completions',
        qiniu:      'https://api.qnaigc.com/v1/chat/completions',
    }[provider as string] ?? 'https://openrouter.ai/api/v1/chat/completions';

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens: 512, temperature: 0.5, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }] }),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() ?? '';
}

// ─── Main Dispatch Function ───────────────────────────────────────────────────

/**
 * Dispatch a skill call from the Autopilot runner.
 * ALWAYS runs headless — never touches the user's foreground UI.
 *
 * @param skillId   The skill to invoke (must match a key in SKILL_HANDLERS)
 * @param task      The AgentTask being processed
 * @param settings  Full SkalesSettings
 * @param params    Skill-specific parameters parsed from task description
 */
export async function dispatchSkill(
    skillId:  string,
    task:     AgentTask,
    settings: any,
    params:   Record<string, any> = {},
): Promise<DispatchResult> {
    const handler = SKILL_HANDLERS[skillId];
    if (!handler) {
        return { success: false, error: `Unknown skill: ${skillId}`, skillId };
    }

    const ctx: SkillContext = { task, settings, headless: true };

    try {
        const result = await handler(ctx, params);
        return result;
    } catch (e: any) {
        log.error('skill_used', `❌ Skill "${skillId}" threw unexpectedly: ${e.message}`, { taskId: task.id });
        return { success: false, error: e.message, skillId };
    }
}

/**
 * Parse a task description and extract the intended skill + parameters.
 * Uses keyword heuristics — the LLM sets explicit [SKILL:xxx] tags when
 * generating master plan tasks.
 *
 * Returns null if no specific skill is detected (runner uses generic LLM).
 */
export function parseSkillFromTask(task: AgentTask): { skillId: string; params: Record<string, any> } | null {
    const desc = task.description;

    // Explicit tag: [SKILL:web_search query="..."]
    const tagMatch = desc.match(/\[SKILL:(\w+)([^\]]*)\]/i);
    if (tagMatch) {
        const skillId  = tagMatch[1].toLowerCase();
        const paramStr = tagMatch[2].trim();
        const params: Record<string, any> = {};
        // Parse key="value" pairs
        const kvRe = /(\w+)="([^"]+)"/g;
        let m: RegExpExecArray | null;
        while ((m = kvRe.exec(paramStr)) !== null) { params[m[1]] = m[2]; }
        return { skillId, params };
    }

    return null;
}
