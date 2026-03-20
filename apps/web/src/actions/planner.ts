'use server';

/**
 * Planner AI — Day Plan Generation Engine
 * Reads calendar events from ALL providers, user preferences, and uses LLM to generate daily schedules.
 * Skales v7 — Session 14
 */

import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { DATA_DIR } from '@/lib/paths';
import { loadSettings } from './chat';

// ─── Types ──────────────────────────────────────────────────────

export interface PlannerPreferences {
    dayStart: string;           // "08:00"
    dayEnd: string;             // "18:00"
    workDays: number[];         // [1,2,3,4,5] (1=Mon, 7=Sun)
    regularTasks: string[];     // parsed from free text
    fixedAppointments: string[];// parsed from free text
    focusHours: number;         // 3
    breakStyle: 'pomodoro' | '90min' | 'flexible' | 'none';
    timezone: string;           // from Intl
    createdAt: string;          // ISO date
    updatedAt: string;
}

export interface TimeBlock {
    id: string;
    start: string;              // "09:00"
    end: string;                // "10:00"
    title: string;
    type: 'focus' | 'meeting' | 'task' | 'break' | 'fixed' | 'free';
    source: 'calendar' | 'planner' | 'user';
    color: string;
    editable: boolean;
}

export interface DayPlan {
    date: string;               // "2026-03-19"
    blocks: TimeBlock[];
    generatedAt: string;
    preferences: PlannerPreferences;
}

// ─── Paths ──────────────────────────────────────────────────────

const PLANNER_DIR = path.join(DATA_DIR, 'planner');
const PREFS_FILE = path.join(PLANNER_DIR, 'preferences.json');
const PLANS_DIR = path.join(PLANNER_DIR, 'plans');

function ensureDirs() {
    if (!fs.existsSync(PLANNER_DIR)) fs.mkdirSync(PLANNER_DIR, { recursive: true });
    if (!fs.existsSync(PLANS_DIR)) fs.mkdirSync(PLANS_DIR, { recursive: true });
}

// ─── Preferences ────────────────────────────────────────────────

export async function loadPlannerPreferences(): Promise<PlannerPreferences | null> {
    try {
        if (fs.existsSync(PREFS_FILE)) {
            return JSON.parse(fs.readFileSync(PREFS_FILE, 'utf-8'));
        }
    } catch { /* ignore */ }
    return null;
}

export async function savePlannerPreferences(prefs: PlannerPreferences): Promise<{ success: boolean }> {
    ensureDirs();
    try {
        prefs.updatedAt = new Date().toISOString();
        if (!prefs.createdAt) prefs.createdAt = prefs.updatedAt;
        fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2));
        return { success: true };
    } catch {
        return { success: false };
    }
}

// ─── Plan Generation ────────────────────────────────────────────

export async function generateDayPlan(
    date: string,
    preferences: PlannerPreferences,
): Promise<DayPlan> {
    // 1. Load calendar events for this date
    let calendarBlocks: TimeBlock[] = [];
    try {
        const { getCalendarManager } = await import('@/lib/calendar-manager');
        const manager = await getCalendarManager();
        const events = await manager.getAllEvents(date);
        calendarBlocks = events.map(e => ({
            id: crypto.randomUUID(),
            start: extractTime(e.startTime),
            end: extractTime(e.endTime),
            title: e.title,
            type: 'meeting' as const,
            source: 'calendar' as const,
            color: '#60a5fa',
            editable: false,
        }));
    } catch { /* calendar not connected — continue without */ }

    // 2. Add fixed appointments from preferences
    const fixedBlocks: TimeBlock[] = preferences.fixedAppointments
        .map(apt => parseFixedAppointment(apt))
        .filter((b): b is TimeBlock => b !== null);

    // 3. Build occupied slots string for LLM
    const occupiedSlots = [...calendarBlocks, ...fixedBlocks]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map(b => `${b.start}-${b.end}: ${b.title}`)
        .join('\n');

    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayOfWeek = new Date(date).getDay(); // 0=Sun
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=Mon ... 7=Sun
    const isWorkDay = preferences.workDays.includes(adjustedDay);

    const prompt = `You are a personal day planner. Generate a detailed schedule for ${date} (${dayNames[adjustedDay]}).

User preferences:
- Day starts at ${preferences.dayStart}, ends at ${preferences.dayEnd}
- Work days: ${preferences.workDays.map(d => dayNames[d]).join(', ')}
- Today is ${isWorkDay ? 'a WORK DAY' : 'NOT a work day (weekend/off)'}
- Needs ${preferences.focusHours}h of deep focus time${isWorkDay ? '' : ' (skip if not a work day)'}
- Break style: ${preferences.breakStyle}
- Regular tasks: ${preferences.regularTasks.length > 0 ? preferences.regularTasks.join(', ') : 'None specified'}

Already scheduled (do NOT move these):
${occupiedSlots || 'Nothing scheduled yet.'}

Generate a JSON array of time blocks to fill the remaining free slots.
Each block: { "start": "HH:MM", "end": "HH:MM", "title": "...", "type": "focus|task|break" }

IMPORTANT: Parse the user's fixed appointments into INDIVIDUAL time blocks.
For example: "10 uhr essen, 14 uhr nachbar treffen" should become TWO separate blocks:
- 10:00-10:30: Essen
- 14:00-15:00: Nachbar treffen
Do NOT combine multiple appointments into one block.

Rules:
- Do NOT overlap with existing events
- Place focus blocks in the morning when possible
- Add breaks according to the user's preference:
  ${preferences.breakStyle === 'pomodoro' ? '25 min work / 5 min break cycles' : ''}
  ${preferences.breakStyle === '90min' ? '90 min work / 15 min break cycles' : ''}
  ${preferences.breakStyle === 'flexible' ? 'Add breaks where they feel natural' : ''}
  ${preferences.breakStyle === 'none' ? 'No breaks — plan tasks back-to-back' : ''}
- Fill gaps with regular tasks
- Leave at least 10 minutes between blocks for transitions
- Be realistic about time — don't overschedule
- Times in HH:MM 24-hour format only

Respond ONLY with a valid JSON array. No markdown, no explanation.`;

    // 4. Call the LLM
    const settings = await loadSettings();
    const llmResponse = await callLLMForPlanner(prompt, settings);

    // 5. Parse response
    let aiBlocks: TimeBlock[] = [];
    try {
        const cleaned = llmResponse.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            aiBlocks = parsed.map((b: any) => ({
                id: crypto.randomUUID(),
                start: b.start || '00:00',
                end: b.end || '00:00',
                title: b.title || 'Task',
                type: (['focus', 'task', 'break', 'meeting', 'fixed', 'free'].includes(b.type) ? b.type : 'task') as TimeBlock['type'],
                source: 'planner' as const,
                color: b.type === 'focus' ? '#4ade80' : b.type === 'break' ? '#94a3b8' : '#fb923c',
                editable: true,
            }));
        }
    } catch (e) {
        console.error('Planner: Failed to parse LLM plan:', e);
    }

    const allBlocks = [...calendarBlocks, ...fixedBlocks, ...aiBlocks]
        .sort((a, b) => a.start.localeCompare(b.start));

    const plan: DayPlan = {
        date,
        blocks: allBlocks,
        generatedAt: new Date().toISOString(),
        preferences,
    };

    // Save the plan
    ensureDirs();
    const planFile = path.join(PLANS_DIR, `${date}.json`);
    fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));

    return plan;
}

export async function loadDayPlan(date: string): Promise<DayPlan | null> {
    try {
        const planFile = path.join(PLANS_DIR, `${date}.json`);
        if (fs.existsSync(planFile)) {
            return JSON.parse(fs.readFileSync(planFile, 'utf-8'));
        }
    } catch { /* ignore */ }
    return null;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Extract HH:MM from ISO datetime or HH:MM string */
function extractTime(dt: string): string {
    if (!dt) return '00:00';
    // Already HH:MM
    if (/^\d{2}:\d{2}$/.test(dt)) return dt;
    // ISO string
    const match = dt.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    return '00:00';
}

/** Parse "Kids pickup at 16:00" → TimeBlock or null */
function parseFixedAppointment(text: string): TimeBlock | null {
    // Match patterns like "at HH:MM", "HH:MM", "HH:MM-HH:MM"
    const timeMatch = text.match(/(\d{1,2}:\d{2})\s*(?:-|to|until)?\s*(\d{1,2}:\d{2})?/);
    if (!timeMatch) return null;

    const start = timeMatch[1].padStart(5, '0');
    const end = timeMatch[2]?.padStart(5, '0') || addMinutes(start, 30);

    // Remove the time from the text to get the title
    let title = text.replace(/\s*(at\s+)?\d{1,2}:\d{2}(\s*(-|to|until)\s*\d{1,2}:\d{2})?/g, '').trim();
    if (!title) title = 'Fixed appointment';

    return {
        id: crypto.randomUUID(),
        start,
        end,
        title,
        type: 'fixed',
        source: 'user',
        color: '#c084fc',
        editable: false,
    };
}

/** Add minutes to HH:MM string */
function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** Call the user's active LLM for planning (no tools needed) */
async function callLLMForPlanner(prompt: string, settings: any): Promise<string> {
    // Use agentDecide from orchestrator — simplest path
    try {
        const { agentDecide } = await import('./orchestrator');

        // ── OpenClaw Relay Mode ──────────────────────────────────────────
        // If the active provider's model is an OpenClaw agent, relay the plan
        // request without injecting Skales' scheduling system prompt.
        // The OpenClaw gateway's agent already has its own planning persona.
        const activeModel = settings?.providers?.[settings.activeProvider]?.model || '';
        const isOpenClaw = activeModel.startsWith('openclaw:');

        const result = await agentDecide(
            [{ role: 'user', content: prompt }],
            {
                // Skip Skales system prompt for OpenClaw — the gateway handles identity
                systemPrompt: isOpenClaw ? undefined : 'You are a scheduling assistant. Respond only with valid JSON arrays. No markdown, no commentary.',
                noTools: true,
            }
        );
        // agentDecide returns { response: string } — not .text or .content
        return result?.response || '[]';
    } catch (e) {
        console.error('Planner LLM call failed:', e);
        return '[]';
    }
}
