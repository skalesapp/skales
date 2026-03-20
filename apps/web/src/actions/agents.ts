'use server';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

import { DATA_DIR } from '@/lib/paths';
const AGENTS_DIR = path.join(DATA_DIR, 'agents');
const DEFINITIONS_DIR = path.join(AGENTS_DIR, 'definitions');
const EXECUTIONS_DIR = path.join(AGENTS_DIR, 'executions');

function ensureDirs() {
    [DATA_DIR, AGENTS_DIR, DEFINITIONS_DIR, EXECUTIONS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    emoji: string;
    systemPrompt: string;
    model?: string; // Specific model for this agent
    provider?: string; // Specific provider
    capabilities: string[];
    tools: string[];
    createdAt: number;
    lastUsed?: number;
    isDefault?: boolean; // true for the default OpenClaw agent (or fallback Skales)
    openclawEquivalent?: string; // Maps to an OpenClaw agent ID (e.g. 'hexforge')
    poweredBy?: string; // Display label when upgraded via OpenClaw (e.g. "Powered by Pixel via OpenClaw")
}

export interface AgentExecution {
    id: string;
    agentId: string;
    task: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    startedAt: number;
    completedAt?: number;
    logs: Array<{ timestamp: number; message: string; level: string }>;
}

// Built-in agents
const BUILTIN_AGENTS: AgentDefinition[] = [
    {
        id: 'coder',
        name: 'Code Assistant',
        description: 'Expert in software development, debugging, and code review',
        emoji: '👨‍💻',
        systemPrompt: 'You are an expert software engineer. Focus on clean, efficient, well-documented code. Prioritize best practices and security.',
        capabilities: ['code-generation', 'debugging', 'refactoring', 'review'],
        tools: ['code-analysis', 'git'],
        createdAt: Date.now(),
        openclawEquivalent: 'hexforge', // Pixel — coding profile
    },
    {
        id: 'writer',
        name: 'Content Writer',
        description: 'Creative writing, documentation, and content creation',
        emoji: '✍️',
        systemPrompt: 'You are a creative writer with expertise in various formats. Adapt your style to the audience and purpose. Prioritize clarity and engagement.',
        capabilities: ['writing', 'editing', 'research'],
        tools: ['grammar-check', 'research'],
        createdAt: Date.now(),
        openclawEquivalent: 'luna', // Luna — writing/summarize skills
    },
    {
        id: 'analyst',
        name: 'Data Analyst',
        description: 'Data analysis, visualization, and insights',
        emoji: '📊',
        systemPrompt: 'You are a data analyst. Break down complex data into actionable insights. Use clear visualizations and statistical rigor.',
        capabilities: ['analysis', 'visualization', 'statistics'],
        tools: ['data-processing', 'charts'],
        createdAt: Date.now(),
        openclawEquivalent: 'fundbot', // FundBot — data/trend analysis
    },
    {
        id: 'planner',
        name: 'Strategic Planner',
        description: 'Project planning, strategy, and organization',
        emoji: '🎯',
        systemPrompt: 'You are a strategic planner. Create detailed, actionable plans. Consider dependencies, risks, and resources.',
        capabilities: ['planning', 'organization', 'strategy'],
        tools: ['timeline', 'gantt'],
        createdAt: Date.now(),
        openclawEquivalent: 'mystro', // Maestro — orchestration
    }
];

export async function listAgents(): Promise<AgentDefinition[]> {
    ensureDirs();

    const agentsMap = new Map<string, AgentDefinition>();

    // 1. Add built-in agents
    BUILTIN_AGENTS.forEach(agent => {
        agentsMap.set(agent.id, agent);
    });

    // 2. Load custom agents (overwriting built-ins if ID matches)
    if (fs.existsSync(DEFINITIONS_DIR)) {
        const files = fs.readdirSync(DEFINITIONS_DIR).filter(f => f.endsWith('.json'));
        files.forEach(f => {
            try {
                const agent = JSON.parse(fs.readFileSync(path.join(DEFINITIONS_DIR, f), 'utf-8'));
                if (agent.id) {
                    agentsMap.set(agent.id, agent);
                }
            } catch (e) {
                console.warn(`Failed to load agent ${f}:`, e);
            }
        });
    }

    // 3. Load OpenClaw agents from gateway config (if available)
    try {
        const openclawConfig = path.join(os.homedir(), '.openclaw', 'openclaw.json');
        if (fs.existsSync(openclawConfig)) {
            const oc = JSON.parse(fs.readFileSync(openclawConfig, 'utf-8'));
            const ocAgents: any[] = oc?.agents?.list || [];
            for (const a of ocAgents) {
                const primaryModel = typeof a.model === 'object' ? a.model.primary : (a.model || 'default');
                const modelShort = primaryModel.replace(/^anthropic\//, '');
                const emoji = a.identity?.emoji || a.identity?.avatar || '🦞';
                const name = a.identity?.name || a.name || a.id;
                const toolsProfile = a.tools?.profile || 'chat';
                const skills: string[] = Array.isArray(a.skills) ? a.skills : [];
                // Use openclaw:<agentId> as the model string so the gateway routes correctly
                agentsMap.set(`oc-${a.id}`, {
                    id: `oc-${a.id}`,
                    name,
                    description: `${modelShort} · ${toolsProfile} tools${skills.length > 0 ? ` · ${skills.length} skills` : ''}`,
                    emoji,
                    systemPrompt: '', // Empty — the OpenClaw agent has its own system prompt server-side
                    model: `openclaw:${a.id}`,
                    provider: 'custom',
                    capabilities: ['chat', 'task-delegation', toolsProfile],
                    tools: skills,
                    createdAt: Date.now(),
                    isDefault: a.default === true,
                });
            }
        }
    } catch { /* OpenClaw not installed — skip */ }

    // 4. Upgrade built-in agents with OpenClaw equivalents when available
    // If a built-in agent has an openclawEquivalent and the corresponding oc-<id> agent
    // exists, upgrade the built-in to use the OpenClaw model/provider while keeping its
    // own name, emoji, and description.
    for (const builtin of BUILTIN_AGENTS) {
        if (builtin.openclawEquivalent) {
            const ocId = `oc-${builtin.openclawEquivalent}`;
            const ocAgent = agentsMap.get(ocId);
            if (ocAgent) {
                const existing = agentsMap.get(builtin.id);
                if (existing && !existing.model?.startsWith('openclaw:')) {
                    // Upgrade: use OC model/provider but keep built-in identity
                    existing.model = ocAgent.model; // e.g. "openclaw:hexforge"
                    existing.provider = ocAgent.provider; // "custom"
                    existing.poweredBy = `Powered by ${ocAgent.name} via OpenClaw`;
                }
            }
        }
    }

    // If no agent is marked default (OpenClaw not installed), mark the first built-in as default
    const agents = Array.from(agentsMap.values());
    if (!agents.some(a => a.isDefault) && agents.length > 0) {
        agents[0].isDefault = true;
    }
    return agents;
}

export async function getDefaultAgent(): Promise<AgentDefinition | null> {
    const agents = await listAgents();
    return agents.find(a => a.isDefault) || agents[0] || null;
}

export async function getAgent(id: string): Promise<AgentDefinition | null> {
    const agents = await listAgents();
    return agents.find(a => a.id === id) || null;
}

export async function createAgent(agent: Omit<AgentDefinition, 'id' | 'createdAt'>): Promise<AgentDefinition> {
    ensureDirs();
    const newAgent: AgentDefinition = {
        ...agent,
        id: `agent-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        createdAt: Date.now()
    };
    fs.writeFileSync(
        path.join(DEFINITIONS_DIR, `${newAgent.id}.json`),
        JSON.stringify(newAgent, null, 2)
    );
    return newAgent;
}

export async function updateAgent(id: string, updates: Partial<AgentDefinition>) {
    ensureDirs();
    const agent = await getAgent(id);
    if (!agent) throw new Error('Agent not found');

    const updated = { ...agent, ...updates };
    fs.writeFileSync(
        path.join(DEFINITIONS_DIR, `${id}.json`),
        JSON.stringify(updated, null, 2)
    );
    return updated;
}

export async function deleteAgent(id: string) {
    ensureDirs();
    const filePath = path.join(DEFINITIONS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

export async function executeAgent(agentId: string, task: string): Promise<AgentExecution> {
    ensureDirs();
    const agent = await getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    const execution: AgentExecution = {
        id: `exec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        agentId,
        task,
        status: 'running',
        startedAt: Date.now(),
        logs: [
            { timestamp: Date.now(), message: `Starting agent: ${agent.name}`, level: 'info' }
        ]
    };

    // Save initial execution state
    const execPath = path.join(EXECUTIONS_DIR, `${execution.id}.json`);
    fs.writeFileSync(execPath, JSON.stringify(execution, null, 2));

    // Real execution: use the Orchestrator with the agent's custom systemPrompt
    try {
        execution.logs.push({ timestamp: Date.now(), message: 'Processing task with AI...', level: 'info' });
        fs.writeFileSync(execPath, JSON.stringify(execution, null, 2));

        // ── OpenClaw Relay Mode ──────────────────────────────────────────────
        // When the agent's model starts with "openclaw:", relay the task directly
        // to the OpenClaw gateway WITHOUT injecting Skales system prompt, agent
        // persona wrapper, or tools. The gateway handles everything.
        if (agent.model?.startsWith('openclaw:')) {
            const { agentDecide } = await import('./orchestrator');

            const result = await agentDecide(
                [{ role: 'user', content: task }],
                {
                    model: agent.model,
                    provider: agent.provider as any,
                    noTools: true, // gateway provides its own tools
                }
            );

            execution.logs.push({ timestamp: Date.now(), message: `Completed via OpenClaw relay (${agent.model})`, level: 'info' });
            execution.status = result.decision === 'error' ? 'failed' : 'completed';
            execution.completedAt = Date.now();
            if (result.decision === 'error') {
                execution.error = result.error;
            } else {
                execution.result = {
                    response: result.response || '',
                    tokensUsed: result.tokensUsed || 0,
                    tools: [],
                };
            }
        } else {
            // Standard Skales path: wrap task with agent persona + system prompt
            const { processMessageWithTools } = await import('./orchestrator');

            const agentPrompt = `[Agent: ${agent.name}]\n[System: ${agent.systemPrompt}]\n\nTask: ${task}`;

            const result = await processMessageWithTools(agentPrompt, [], {
                model: agent.model,
                provider: agent.provider as any,
            });

            execution.logs.push({ timestamp: Date.now(), message: `Completed via ${result.provider}/${result.model}`, level: 'info' });
            result.toolResults.forEach(tr => {
                execution.logs.push({
                    timestamp: Date.now(),
                    message: `Tool ${tr.toolName}: ${tr.success ? 'OK' : 'FAILED'} — ${tr.displayMessage.slice(0, 200)}`,
                    level: tr.success ? 'info' : 'error'
                });
            });

            execution.status = 'completed';
            execution.completedAt = Date.now();
            execution.result = {
                response: result.response,
                tokensUsed: result.tokensUsed,
                tools: result.toolResults.map(tr => ({ name: tr.toolName, success: tr.success })),
            };
        }
    } catch (error: any) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.completedAt = Date.now();
        execution.logs.push({ timestamp: Date.now(), message: `Error: ${error.message}`, level: 'error' });
    }

    // Save final execution state
    fs.writeFileSync(execPath, JSON.stringify(execution, null, 2));

    // Update agent's lastUsed
    try {
        await updateAgent(agentId, { lastUsed: Date.now() });
    } catch { /* built-in agents can't be updated, that's fine */ }

    return execution;
}

export async function getExecution(id: string): Promise<AgentExecution | null> {
    ensureDirs();
    const filePath = path.join(EXECUTIONS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return null;
}

export async function listExecutions(limit: number = 20): Promise<AgentExecution[]> {
    ensureDirs();
    if (!fs.existsSync(EXECUTIONS_DIR)) return [];

    const files = fs.readdirSync(EXECUTIONS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, limit);

    return files.map(f => JSON.parse(fs.readFileSync(path.join(EXECUTIONS_DIR, f), 'utf-8')));
}
