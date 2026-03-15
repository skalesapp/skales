/**
 * GET /api/telemetry/ping
 *
 * Fires a telemetry event if telemetry is enabled in settings.
 *
 * Query params (all optional):
 *   event  — event name (default: 'app_start')
 *   Any additional query params are forwarded as extra fields.
 *
 * Returns 200 always — telemetry must never block the UI.
 */

import { NextRequest, NextResponse }     from 'next/server';
import { unstable_noStore as noStore }   from 'next/cache';
import { sendTelemetryEvent }            from '@/lib/telemetry';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    noStore();

    try {
        const params = req.nextUrl.searchParams;
        const event  = params.get('event') || 'app_start';

        // Collect extra fields (everything except 'event')
        const extra: Record<string, string> = {};
        params.forEach((val: string, key: string) => {
            if (key !== 'event') extra[key] = val;
        });

        await sendTelemetryEvent(event, Object.keys(extra).length ? extra : undefined);
    } catch {
        // Never fail — telemetry is fire-and-forget
    }

    return NextResponse.json({ ok: true });
}
