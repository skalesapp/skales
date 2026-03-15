/**
 * POST /api/replicate/generate
 *
 * Starts a Replicate prediction and polls until it succeeds or fails.
 *
 * Request body:
 *   {
 *     model:   string,           // "owner/model-name" or "owner/model-name:version"
 *     input:   Record<string, unknown>,  // model-specific inputs (prompt, etc.)
 *     type:    'image' | 'video',
 *   }
 *
 * Response (success):
 *   { success: true, outputUrl: string, outputUrls?: string[] }
 *
 * Response (failure):
 *   { success: false, error: string }
 *
 * Notes:
 *   - For official Replicate models use the `model` field (no `version`).
 *   - For versioned community models pass "owner/model:sha256hash" — the route
 *     will split it automatically into { version } for the predictions payload.
 *   - Timeout: 60 s for images, 120 s for videos.
 */

import { NextResponse }               from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { loadSettings }                from '@/actions/chat';
import { serverT }                     from '@/lib/server-i18n';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

// Maximum poll duration
const TIMEOUT_IMAGE_MS = 60_000;
const TIMEOUT_VIDEO_MS = 120_000;
const POLL_INTERVAL_MS = 2_000;

export async function POST(req: Request) {
    noStore();

    let body: { model?: string; input?: Record<string, unknown>; type?: 'image' | 'video' };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { model, input, type = 'image' } = body;

    if (!model?.trim()) {
        return NextResponse.json({ success: false, error: 'model is required' }, { status: 400 });
    }
    if (!input || typeof input !== 'object') {
        return NextResponse.json({ success: false, error: 'input object is required' }, { status: 400 });
    }

    // Load API token
    const settings = await loadSettings().catch(() => ({} as any));
    const token = (settings as any).replicate_api_token as string | undefined;
    if (!token?.trim()) {
        return NextResponse.json(
            { success: false, error: serverT('chat.imageGen.noReplicateKey') },
            { status: 400 }
        );
    }

    const authHeaders = {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
    };

    // Build prediction payload and endpoint URL.
    // Official models (e.g. "black-forest-labs/flux-1.1-pro") use the models endpoint.
    // Versioned models (e.g. "owner/model:abc123") use the predictions endpoint.
    const isOfficialModel = !model.includes(':');
    const predictionUrl = isOfficialModel
        ? `https://api.replicate.com/v1/models/${model}/predictions`
        : 'https://api.replicate.com/v1/predictions';

    let predictionPayload: Record<string, unknown>;
    if (isOfficialModel) {
        predictionPayload = { input };
    } else {
        const [, versionHash] = model.split(':');
        predictionPayload = { version: versionHash, input };
    }

    // ── Step 1: Create prediction ─────────────────────────────────────────────
    let predictionId: string;
    let initialStatus: string;
    let initialOutput: unknown;

    try {
        const createRes = await fetch(predictionUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(predictionPayload),
            signal: AbortSignal.timeout(30_000),
        });

        if (!createRes.ok) {
            const errText = await createRes.text().catch(() => '');
            let errMsg = `HTTP ${createRes.status}`;
            try { errMsg = JSON.parse(errText)?.detail || errMsg; } catch { /* ignore */ }
            return NextResponse.json(
                { success: false, error: serverT('chat.imageGen.generationFailed', { error: errMsg }) },
                { status: 502 }
            );
        }

        const createData = await createRes.json();
        predictionId   = createData.id as string;
        initialStatus  = createData.status as string;
        initialOutput  = createData.output;

        if (!predictionId) {
            return NextResponse.json(
                { success: false, error: 'Replicate did not return a prediction ID' },
                { status: 502 }
            );
        }
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: serverT('chat.imageGen.generationFailed', { error: err.message }) },
            { status: 500 }
        );
    }

    // If the Prefer:wait header caused immediate completion, return right away
    if (initialStatus === 'succeeded' && initialOutput) {
        return buildSuccessResponse(initialOutput);
    }
    if (initialStatus === 'failed') {
        return NextResponse.json(
            { success: false, error: serverT('chat.imageGen.generationFailed', { error: 'Prediction failed immediately' }) },
            { status: 502 }
        );
    }

    // ── Step 2: Poll until done ───────────────────────────────────────────────
    const timeout   = type === 'video' ? TIMEOUT_VIDEO_MS : TIMEOUT_IMAGE_MS;
    const deadline  = Date.now() + timeout;
    const pollUrl   = `https://api.replicate.com/v1/predictions/${predictionId}`;

    while (Date.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);

        let pollData: any;
        try {
            const pollRes = await fetch(pollUrl, {
                headers: { Authorization: `Bearer ${token.trim()}` },
                signal: AbortSignal.timeout(15_000),
            });
            if (!pollRes.ok) {
                // Transient HTTP error — keep polling
                continue;
            }
            pollData = await pollRes.json();
        } catch {
            // Network hiccup — keep polling
            continue;
        }

        if (pollData.status === 'succeeded') {
            return buildSuccessResponse(pollData.output);
        }

        if (pollData.status === 'failed' || pollData.status === 'canceled') {
            const reason = pollData.error || 'Prediction failed';
            return NextResponse.json(
                { success: false, error: serverT('chat.imageGen.generationFailed', { error: reason }) },
                { status: 502 }
            );
        }
        // status is 'starting' or 'processing' — keep polling
    }

    return NextResponse.json(
        { success: false, error: serverT('system.errors.timeout') },
        { status: 504 }
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

/** Build a uniform success response from the Replicate output (string | string[]) */
function buildSuccessResponse(output: unknown): NextResponse {
    if (Array.isArray(output)) {
        const urls = output.filter((u): u is string => typeof u === 'string');
        return NextResponse.json({
            success:    true,
            outputUrl:  urls[0] ?? '',
            outputUrls: urls,
        });
    }
    if (typeof output === 'string') {
        return NextResponse.json({ success: true, outputUrl: output, outputUrls: [output] });
    }
    // Some models return objects — try to extract a url field
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>;
        const url = (obj.url ?? obj.video ?? obj.image ?? '') as string;
        return NextResponse.json({ success: true, outputUrl: url, outputUrls: url ? [url] : [] });
    }
    return NextResponse.json({ success: false, error: 'Unexpected output format from Replicate' }, { status: 502 });
}
