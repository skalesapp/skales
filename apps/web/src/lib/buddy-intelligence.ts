/**
 * buddy-intelligence.ts
 *
 * BRAIN of the proactive buddy system. Uses RULES + data (no LLMs).
 * Checks context and decides if there's something worth saying to the user.
 *
 * Exported functions:
 *   - gatherBuddyContext() — collects data from tasks, calendar, email, idle time
 *   - decideBuddyAction() — rule-based decision engine, returns SkalesNotification | null
 *   - tickBuddyIntelligence() — async runner heartbeat handler
 *
 * Skales v7
 */

import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '@/lib/paths';
import { serverT } from '@/lib/server-i18n';

// ─── Types ───────────────────────────────────────────────────────

export interface BuddyContext {
    tasksCount: {
        pending: number;
        inProgress: number;
        completedToday: number;
        blocked: number;
    };
    nextMeeting: {
        minutesUntilStart: number;
        title: string;
        location?: string;
        description?: string;
    } | null;
    unreadEmails: number;
    idleMinutes: number;
    currentHour: number;
}

// ─── 1. Gather Context from Multiple Sources ────────────────────

export async function gatherBuddyContext(): Promise<BuddyContext> {
    const context: BuddyContext = {
        tasksCount: {
            pending: 0,
            inProgress: 0,
            completedToday: 0,
            blocked: 0,
        },
        nextMeeting: null,
        unreadEmails: 0,
        idleMinutes: 0,
        currentHour: new Date().getHours(),
    };

    try {
        // ── Task counts ──────────────────────────────────────────
        try {
            const { getAllTasks } = await import('@/lib/agent-tasks');
            const allTasks = getAllTasks();
            const now = Date.now();
            const dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);

            for (const task of allTasks) {
                if (task.state === 'pending') context.tasksCount.pending++;
                else if (task.state === 'in_progress') context.tasksCount.inProgress++;
                else if (task.state === 'blocked') context.tasksCount.blocked++;
                else if (task.state === 'completed' && task.completedAt && task.completedAt > dayStart.getTime()) {
                    context.tasksCount.completedToday++;
                }
            }
        } catch {
            // Tasks unavailable
        }

        // ── Calendar: next event within 60 minutes ──────────────
        try {
            const { listCalendarEvents } = await import('@/actions/calendar');
            const result = await listCalendarEvents(1);
            if (result.success && result.events && result.events.length > 0) {
                const now = new Date();
                for (const event of result.events) {
                    const startStr = event.start.dateTime || event.start.date;
                    if (!startStr) continue;

                    const startTime = new Date(startStr);
                    const diffMs = startTime.getTime() - now.getTime();
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));

                    // Only consider if within next 60 minutes
                    if (diffMinutes > 0 && diffMinutes <= 60) {
                        context.nextMeeting = {
                            minutesUntilStart: diffMinutes,
                            title: event.summary,
                            location: event.location,
                            description: event.description,
                        };
                        break; // first match is the soonest
                    }
                }
            }
        } catch {
            // Calendar not available
        }

        // ── Email: pending notifications from inbox state file ───
        try {
            const emailStatePath = path.join(DATA_DIR, 'integrations', 'email-inbox-state.json');
            if (fs.existsSync(emailStatePath)) {
                const state = JSON.parse(fs.readFileSync(emailStatePath, 'utf-8'));
                context.unreadEmails = (state.pendingNotifications || []).length;
            }
        } catch {
            // Email state not available
        }

        // ── Idle time: minutes since last user interaction ───────
        try {
            const { getLastUserInteraction } = await import('@/lib/notification-router');
            const lastInteraction = getLastUserInteraction();
            const idleMs = Date.now() - lastInteraction;
            context.idleMinutes = Math.floor(idleMs / (1000 * 60));
        } catch {
            // Interaction tracking unavailable
        }
    } catch {
        // Silent on any outer exception
    }

    return context;
}

// ─── 2. Rule-Based Decision Engine ──────────────────────────────

export async function decideBuddyAction(ctx: BuddyContext, settings: any): Promise<any | null> {
    try {
        // Check if proactive buddy is enabled
        const behavior = settings?.activeUserBehavior || {};
        const proactiveEnabled = behavior.proactiveEnabled !== false; // default true
        if (!proactiveEnabled) return null;

        const notificationTypes = behavior.notificationTypes || {};

        // Rule a: Meeting in next 30 min → 'meeting-reminder' (HIGH)
        if (
            ctx.nextMeeting &&
            ctx.nextMeeting.minutesUntilStart <= 30 &&
            ctx.nextMeeting.minutesUntilStart > 0
        ) {
            if (notificationTypes['meeting-reminder'] !== false) {
                const meetingDesc = serverT('buddyIntelligence.meetingIn', { minutes: ctx.nextMeeting.minutesUntilStart });
                const locStr = ctx.nextMeeting.location ? ` @ ${ctx.nextMeeting.location}` : '';
                const msg = `⏰ ${meetingDesc}: ${ctx.nextMeeting.title}${locStr}`;
                return {
                    type: 'meeting-reminder',
                    message: msg,
                    priority: 'high',
                    emoji: '⏰',
                    cooldownMinutes: 25,
                };
            }
        }

        // Rule b: Meeting in next 60 min + has description → 'meeting-prep' (MEDIUM)
        if (
            ctx.nextMeeting &&
            ctx.nextMeeting.minutesUntilStart > 30 &&
            ctx.nextMeeting.minutesUntilStart <= 60 &&
            ctx.nextMeeting.description
        ) {
            if (notificationTypes['meeting-prep'] !== false) {
                const prepMsg = serverT('buddyIntelligence.meetingPrepReady');
                const msg = `⏰ ${prepMsg}: "${ctx.nextMeeting.title}" (${ctx.nextMeeting.minutesUntilStart}m)`;
                return {
                    type: 'meeting-prep',
                    message: msg,
                    priority: 'medium',
                    emoji: '⏰',
                    cooldownMinutes: 50,
                };
            }
        }

        // Rule c: Blocked tasks > 0 → 'overdue-tasks' (MEDIUM)
        // (Repurposing since there's no dueAt field)
        if (ctx.tasksCount.blocked > 0) {
            if (notificationTypes['overdue-tasks'] !== false) {
                const msg = `⚠️ ${serverT('buddyIntelligence.blockedTasks', { count: ctx.tasksCount.blocked })}`;
                return {
                    type: 'overdue-tasks',
                    message: msg,
                    priority: 'medium',
                    emoji: '⚠️',
                    cooldownMinutes: 120,
                };
            }
        }

        // Rule d: Unread emails > 3 → 'email-alert' (LOW)
        if (ctx.unreadEmails > 3) {
            if (notificationTypes['email-alert'] !== false) {
                const msg = `📧 ${serverT('buddyIntelligence.unreadEmails', { count: ctx.unreadEmails })}`;
                return {
                    type: 'email-alert',
                    message: msg,
                    priority: 'low',
                    emoji: '📧',
                    cooldownMinutes: 120,
                };
            }
        }

        // Rule e: Completed tasks today >= 3 → 'eod-summary' (only 16:00-19:00)
        if (ctx.tasksCount.completedToday >= 3 && ctx.currentHour >= 16 && ctx.currentHour < 19) {
            if (notificationTypes['eod-summary'] !== false) {
                const msg = `✅ ${serverT('buddyIntelligence.completedToday', { count: ctx.tasksCount.completedToday })}`;
                return {
                    type: 'eod-summary',
                    message: msg,
                    priority: 'low',
                    emoji: '✅',
                    cooldownMinutes: 480, // 8 hours — once per evening
                };
            }
        }

        // Rule f: Idle > 45 min and pending tasks > 0 → 'idle-checkin' (LOW)
        if (ctx.idleMinutes > 45 && ctx.tasksCount.pending > 0) {
            if (notificationTypes['idle-checkin'] !== false) {
                const msg = `💤 ${serverT('buddyIntelligence.idleMessage', { count: ctx.tasksCount.pending })}`;
                return {
                    type: 'idle-checkin',
                    message: msg,
                    priority: 'low',
                    emoji: '💤',
                    cooldownMinutes: 60,
                };
            }
        }

        // Rule g: Morning greeting (7:00-9:00)
        if (ctx.currentHour >= 7 && ctx.currentHour < 9) {
            if (notificationTypes['morning-greeting'] !== false) {
                const greetingMsg = serverT('buddyIntelligence.goodMorning');
                const suffix = ctx.tasksCount.pending > 0 ? ` (${ctx.tasksCount.pending} tasks)` : '';
                return {
                    type: 'morning-greeting',
                    message: `☀️ ${greetingMsg}${suffix}`,
                    priority: 'low',
                    emoji: '☀️',
                    cooldownMinutes: 720, // 12 hours
                };
            }
        }
    } catch {
        // Silent on error
    }

    return null;
}

// ─── 3. Autonomous Runner Heartbeat ─────────────────────────────

export async function tickBuddyIntelligence(): Promise<void> {
    try {
        // Load settings
        const { loadSettings } = await import('@/actions/chat');
        const settings = await loadSettings();

        // Check if active behavior is enabled and proactive is not disabled
        const behavior = settings?.activeUserBehavior || {};
        if (!behavior.enabled) return;

        // Gather context
        const ctx = await gatherBuddyContext();

        // Decide if there's something to say
        const action = await decideBuddyAction(ctx, settings);
        if (!action) return;

        // Route the notification
        const { routeNotification } = await import('@/lib/notification-router');
        await routeNotification(action);
    } catch {
        // Silent on failure
    }
}
