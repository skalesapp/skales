export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '@/lib/paths';

const PROJECTS_DIR = path.join(DATA_DIR, 'workspace', 'projects');

/**
 * POST /api/code/snapshot
 * Creates a snapshot of the current project files before an iteration.
 * Stored in {projectDir}/_backups/{timestamp}/ for rollback.
 */
export async function POST(req: NextRequest) {
    try {
        const { projectId, projectDir } = await req.json();
        if (!projectDir || !fs.existsSync(projectDir)) {
            return NextResponse.json({ ok: false, error: 'projectDir not found' });
        }

        // Validate that projectDir is within the expected projects directory
        const resolvedDir = path.resolve(projectDir);
        const resolvedRoot = path.resolve(PROJECTS_DIR);
        if (!resolvedDir.startsWith(resolvedRoot + path.sep)) {
            return NextResponse.json({ ok: false, error: 'Invalid project directory' }, { status: 403 });
        }

        const timestamp = Date.now();
        const backupDir = path.join(resolvedDir, '_backups', String(timestamp));
        fs.mkdirSync(backupDir, { recursive: true });

        // Copy all non-backup, non-hidden files
        const files = fs.readdirSync(resolvedDir).filter(f => !f.startsWith('_') && !f.startsWith('.'));
        for (const file of files) {
            try {
                const src = path.join(resolvedDir, file);
                const dst = path.join(backupDir, file);
                if (fs.statSync(src).isFile()) {
                    fs.copyFileSync(src, dst);
                }
            } catch { /* skip unreadable files */ }
        }

        // Write snapshot metadata
        fs.writeFileSync(path.join(backupDir, '.snapshot-meta.json'), JSON.stringify({
            projectId,
            projectDir: resolvedDir,
            createdAt: new Date().toISOString(),
            fileCount: files.length,
        }, null, 2));

        return NextResponse.json({ ok: true, backupDir, timestamp });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}
