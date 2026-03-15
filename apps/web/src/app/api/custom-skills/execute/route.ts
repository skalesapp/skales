/**
 * POST /api/custom-skills/execute
 *
 * Server-side execution of a custom skill's execute() function.
 * Safely loads the skill file from SKILLS_DIR, calls execute(),
 * and returns the result as JSON.
 *
 * Body: { skillId: string, input?: any }
 * Response: { success: boolean, result?: any, error?: string }
 */
import { NextResponse }               from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import fs                              from 'fs';
import path                            from 'path';
import { SKILLS_DIR, SKILLS_MANIFEST } from '@/lib/paths';
import { loadSettings }                from '@/actions/chat';
import { sendTelemetryEvent }          from '@/lib/telemetry';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

/**
 * Native Node.js require — bypasses webpack's __webpack_require__.
 * This is essential because webpack's require cannot load files from arbitrary
 * paths at runtime (like ~/.skales-data/skills/some-skill.js).
 */
// eslint-disable-next-line no-eval
const nativeRequire: NodeRequire = eval('require');

export async function POST(req: Request) {
    noStore();

    let body: { skillId?: string; input?: any };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { skillId, input = {} } = body ?? {};
    if (!skillId) {
        return NextResponse.json({ error: 'Missing skillId' }, { status: 400 });
    }

    // ── Load manifest to find skill metadata ─────────────────────────────────
    let skill: any = null;
    try {
        const raw    = fs.readFileSync(SKILLS_MANIFEST, 'utf8');
        const parsed = JSON.parse(raw);
        const map: Record<string, any> = Array.isArray(parsed)
            ? Object.fromEntries(parsed.map((s: any) => [s.id, s]))
            : (parsed?.skills ?? {});
        skill = map[skillId] ?? null;
    } catch {
        return NextResponse.json({ error: 'Manifest unreadable' }, { status: 500 });
    }

    if (!skill) {
        return NextResponse.json({ error: `Skill "${skillId}" not found` }, { status: 404 });
    }

    if (!skill.enabled) {
        return NextResponse.json({ error: `Skill "${skillId}" is disabled` }, { status: 403 });
    }

    // ── Ensure skill file exists — auto-restore from manifest backup if quarantined ─
    const skillFile = path.join(SKILLS_DIR, skill.file ?? `${skillId}.js`);
    if (!fs.existsSync(skillFile)) {
        // Try to restore from manifest backup (Windows Defender quarantine recovery)
        if (skill._codeBackup) {
            try {
                if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
                fs.writeFileSync(skillFile, skill._codeBackup, 'utf8');
                console.log(`[CustomSkills] Restored "${skillId}" from manifest backup (file was missing/quarantined)`);
            } catch (restoreErr: any) {
                return NextResponse.json(
                    { error: `Skill file missing and restore failed: ${restoreErr.message}` },
                    { status: 404 },
                );
            }
        } else {
            return NextResponse.json(
                { error: `Skill file "${skill.file}" is missing from disk and no backup exists. Use "Fix" to regenerate it.` },
                { status: 404 },
            );
        }
    }

    // ── Load and execute the skill module ────────────────────────────────────
    try {
        // Clear require cache so edits / restores take effect without server restart
        try { delete nativeRequire.cache[nativeRequire.resolve(skillFile)]; } catch { /* first load */ }

        const mod = nativeRequire(skillFile);

        if (typeof mod?.execute !== 'function') {
            return NextResponse.json({ error: 'Skill does not export an execute() function' }, { status: 422 });
        }

        const settings = await loadSettings();

        const { WORKSPACE_DIR } = await import('@/lib/paths');
        const configuredWorkspace = (settings as any)?.workspacePath as string | undefined;
        const workspacePath = configuredWorkspace && configuredWorkspace.trim()
            ? configuredWorkspace.trim()
            : WORKSPACE_DIR;

        const context  = {
            dataDir:       path.dirname(SKILLS_DIR),
            workspacePath,
            settings:      settings as any,
        };

        const result = await mod.execute(input, context);
        sendTelemetryEvent('skill_run', { skill: skillId }).catch(() => {});
        return NextResponse.json(result ?? { success: false, error: 'No result returned' });

    } catch (e: any) {
        console.error(`[CustomSkills] execute error for "${skillId}":`, e.message);
        return NextResponse.json({ success: false, error: e.message ?? 'Execution failed' }, { status: 500 });
    }
}
