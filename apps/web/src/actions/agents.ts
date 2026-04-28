'use server';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { DATA_DIR } from '@/lib/paths';
import { buildAgentExecutionRequest } from '@/lib/agent-execution-request';
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
        createdAt: Date.now()
    },
    {
        id: 'writer',
        name: 'Content Writer',
        description: 'Creative writing, documentation, and content creation',
        emoji: '✍️',
        systemPrompt: 'You are a creative writer with expertise in various formats. Adapt your style to the audience and purpose. Prioritize clarity and engagement.',
        capabilities: ['writing', 'editing', 'research'],
        tools: ['grammar-check', 'research'],
        createdAt: Date.now()
    },
    {
        id: 'analyst',
        name: 'Data Analyst',
        description: 'Data analysis, visualization, and insights',
        emoji: '📊',
        systemPrompt: 'You are a data analyst. Break down complex data into actionable insights. Use clear visualizations and statistical rigor.',
        capabilities: ['analysis', 'visualization', 'statistics'],
        tools: ['data-processing', 'charts'],
        createdAt: Date.now()
    },
    {
        id: 'planner',
        name: 'Strategic Planner',
        description: 'Project planning, strategy, and organization',
        emoji: '🎯',
        systemPrompt: 'You are a strategic planner. Create detailed, actionable plans. Consider dependencies, risks, and resources.',
        capabilities: ['planning', 'organization', 'strategy'],
        tools: ['timeline', 'gantt'],
        createdAt: Date.now()
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

    return Array.from(agentsMap.values());
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
        const { processMessageWithTools } = await import('./orchestrator');

        execution.logs.push({ timestamp: Date.now(), message: 'Processing task with AI...', level: 'info' });
        fs.writeFileSync(execPath, JSON.stringify(execution, null, 2));

        const agentRequest = buildAgentExecutionRequest(agent, task);

        const result = await processMessageWithTools(agentRequest.message, [], agentRequest.options);

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
