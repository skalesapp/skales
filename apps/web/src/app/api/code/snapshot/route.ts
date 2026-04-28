export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { copyProjectSnapshot } from '@/lib/lio-project-files';

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

        const timestamp = Date.now();
        const backupDir = path.join(projectDir, '_backups', String(timestamp));
        fs.mkdirSync(backupDir, { recursive: true });

        const files = copyProjectSnapshot(projectDir, backupDir);

        // Write snapshot metadata
        fs.writeFileSync(path.join(backupDir, '.snapshot-meta.json'), JSON.stringify({
            projectId,
            projectDir,
            createdAt: new Date().toISOString(),
            fileCount: files.length,
        }, null, 2));

        return NextResponse.json({ ok: true, backupDir, timestamp });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}
