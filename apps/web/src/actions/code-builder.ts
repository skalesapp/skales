'use server';

import path from 'path';
import fs from 'fs';
import { loadSettings } from './chat';

// ─── Paths ────────────────────────────────────────────────────

import { DATA_DIR } from '@/lib/paths';
const PROJECTS_DIR = path.join(DATA_DIR, 'workspace', 'projects');
const LIO_CONFIG_FILE = path.join(DATA_DIR, 'lio-config.json');

function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// ─── Types ────────────────────────────────────────────────────

export interface BuildStep {
    index: number;
    label: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    output?: string;
    error?: string;
    startedAt?: number;
    completedAt?: number;
}

export interface LioPlan {
    techStack: string;
    files: string[];
    steps: string[];
    timeEstimate: string;
    costEstimate: string;
    complexity: 'Low' | 'Medium' | 'High';
    architectNotes: string;
    reviewerNotes: string;
}

export type ProjectStatus = 'planning' | 'building' | 'complete' | 'failed' | 'paused';

export interface LioProject {
    id: string;
    name: string;
    prompt: string;
    plan: LioPlan | null;
    steps: BuildStep[];
    status: ProjectStatus;
    currentStep: number;
    totalSteps: number;
    elapsedMs: number;
    estimatedCostUsd: number;
    projectDir: string;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    error?: string;
}

export interface LioAiConfig {
    architectProvider: string;
    architectModel: string;
    reviewerProvider: string;
    reviewerModel: string;
    builderProvider: string;
    builderModel: string;
    autoInstallPackages: boolean;
    livePreview: boolean;
    previewPort: number;
    projectFolder: string;
    maxBuildSteps: number;
    autoRecoveryRetries: number;
    groupChatOnErrors: boolean;
}

const DEFAULT_LIO_CONFIG: LioAiConfig = {
    architectProvider: 'openrouter',
    architectModel: 'openai/gpt-4o',
    reviewerProvider: 'openrouter',
    reviewerModel: 'anthropic/claude-3.5-sonnet',
    builderProvider: 'openrouter',
    builderModel: 'openai/gpt-4o',
    autoInstallPackages: true,
    livePreview: true,
    previewPort: 3001,
    projectFolder: '.skales-data/workspace/projects',
    maxBuildSteps: 30,
    autoRecoveryRetries: 3,
    groupChatOnErrors: true,
};

// ─── Config ───────────────────────────────────────────────────

export async function getLioConfig(): Promise<LioAiConfig> {
    ensureDirs();
    try {
        if (fs.existsSync(LIO_CONFIG_FILE)) {
            const raw = JSON.parse(fs.readFileSync(LIO_CONFIG_FILE, 'utf-8'));
            return { ...DEFAULT_LIO_CONFIG, ...raw };
        }
    } catch { /* fallback */ }
    return { ...DEFAULT_LIO_CONFIG };
}

export async function saveLioConfig(config: LioAiConfig): Promise<{ success: boolean; error?: string }> {
    try {
        ensureDirs();
        fs.writeFileSync(LIO_CONFIG_FILE, JSON.stringify(config, null, 2));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Project Management ───────────────────────────────────────

function projectFilePath(projectId: string): string {
    return path.join(PROJECTS_DIR, projectId, 'project.json');
}

export async function createProject(name: string, prompt: string): Promise<LioProject> {
    ensureDirs();
    const id = `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;
    const projectDir = path.join(PROJECTS_DIR, id);
    fs.mkdirSync(projectDir, { recursive: true });

    const project: LioProject = {
        id,
        name,
        prompt,
        plan: null,
        steps: [],
        status: 'planning',
        currentStep: 0,
        totalSteps: 0,
        elapsedMs: 0,
        estimatedCostUsd: 0,
        projectDir,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    fs.writeFileSync(projectFilePath(id), JSON.stringify(project, null, 2));
    return project;
}

export async function getProject(projectId: string): Promise<LioProject | null> {
    try {
        const file = projectFilePath(projectId);
        if (!fs.existsSync(file)) return null;
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
        return null;
    }
}

export async function saveProject(project: LioProject): Promise<void> {
    project.updatedAt = Date.now();
    fs.writeFileSync(projectFilePath(project.id), JSON.stringify(project, null, 2));
}

export async function listProjects(): Promise<LioProject[]> {
    ensureDirs();
    try {
        const dirs = fs.readdirSync(PROJECTS_DIR).filter(d => {
            const f = path.join(PROJECTS_DIR, d, 'project.json');
            return fs.existsSync(f);
        });
        const projects: LioProject[] = [];
        for (const d of dirs) {
            try {
                const p = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, d, 'project.json'), 'utf-8'));
                projects.push(p);
            } catch { /* skip corrupt */ }
        }
        return projects.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
    } catch {
        return [];
    }
}

export async function deleteProject(projectId: string): Promise<{ success: boolean }> {
    try {
        const dir = path.join(PROJECTS_DIR, projectId);
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
        return { success: true };
    } catch {
        return { success: false };
    }
}

// ─── LLM helper (non-streaming, for planning) ─────────────────

export async function callLlmSimple(
    provider: string,
    model: string,
    systemPrompt: string,
    userMessage: string,
    signal?: AbortSignal,
): Promise<string> {
    const settings = await loadSettings();
    const providerConfig = settings.providers?.[provider as keyof typeof settings.providers];
    if (!providerConfig || !providerConfig.apiKey) {
        throw new Error(`Provider "${provider}" is not configured or missing API key.`);
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
    ];

    // Anthropic
    if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': providerConfig.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: userMessage }], system: systemPrompt, max_tokens: 4096 }),
            signal,
        });
        if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
        const data = await res.json();
        return data.content?.[0]?.text || '';
    }

    // Google
    if (provider === 'google') {
        const googleModel = model || 'gemini-2.0-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${providerConfig.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
            }),
            signal,
        });
        if (!res.ok) throw new Error(`Google error: ${res.status} ${await res.text()}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // OpenAI-compatible (OpenRouter, OpenAI, Ollama, Groq, Mistral, Together, etc.)
    const baseUrl = (providerConfig as any).baseUrl || (() => {
        if (provider === 'groq') return 'https://api.groq.com/openai/v1';
        if (provider === 'mistral') return 'https://api.mistral.ai/v1';
        if (provider === 'together') return 'https://api.together.xyz/v1';
        if (provider === 'deepseek') return 'https://api.deepseek.com/v1';
        if (provider === 'xai') return 'https://api.x.ai/v1';
        if (provider === 'qiniu') return 'https://api.qnaigc.com/v1';
        // FIX C: standardise to localhost (127.0.0.1 can cause CORS issues on some setups)
        if (provider === 'ollama') return 'http://localhost:11434/v1';
        return 'https://openrouter.ai/api/v1';
    })();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerConfig.apiKey}`,
    };
    if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://skales.app';
        headers['X-Title'] = 'Skales / Lio AI';
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7 }),
        signal,
    });
    if (!res.ok) throw new Error(`${provider} error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

// ─── Random Surprise Pool ─────────────────────────────────────

const SURPRISE_POOL = [
    'A retro Snake game with neon colors and a high score board',
    'A personal weather dashboard with animated backgrounds',
    'A Pomodoro timer with lo-fi aesthetic and sound effects',
    'A random quote generator with beautiful typography and share button',
    'A pixel art drawing tool in the browser with color palette',
    'A multiplayer tic-tac-toe game with local hot-seat mode',
    'A markdown editor with live split-pane preview',
    'A recipe book app with search, tags, and categories',
    'A budget tracker with bar charts and monthly summaries',
    'A meme generator with drag-and-drop text overlays',
    'An interactive periodic table with element details',
    'A CSS gradient generator with copy-to-clipboard',
    'A typing speed test with WPM statistics and history',
    'A countdown timer for your next event with confetti finish',
    'A virtual pet that reacts to clicks, feeding, and petting',
];

export async function getRandomSurprises(count = 6): Promise<string[]> {
    const shuffled = [...SURPRISE_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
