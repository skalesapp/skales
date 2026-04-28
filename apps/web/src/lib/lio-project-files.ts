import fs from 'fs';
import path from 'path';

export interface ProjectFileEntry {
    relativePath: string;
    absolutePath: string;
}

interface ListProjectContextFilesOptions {
    maxFiles?: number;
    allowedExtensions?: string[];
}

const DEFAULT_ALLOWED_EXTENSIONS = new Set([
    '.html', '.css', '.js', '.ts', '.tsx', '.json', '.py', '.md',
]);

const SKIP_DIRS = new Set([
    '_backups',
    '.git',
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
]);

function shouldSkipDir(dirName: string): boolean {
    return dirName.startsWith('.') || SKIP_DIRS.has(dirName);
}

function shouldIncludeFile(fileName: string, allowedExtensions: Set<string>): boolean {
    if (fileName.startsWith('.')) return false;
    return allowedExtensions.has(path.extname(fileName).toLowerCase());
}

function compareDirents(a: fs.Dirent, b: fs.Dirent): number {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
}

function walkProjectFiles(
    rootDir: string,
    currentDir: string,
    allowedExtensions: Set<string>,
    maxFiles: number,
    results: ProjectFileEntry[]
) {
    if (results.length >= maxFiles) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true }).sort(compareDirents);
    for (const entry of entries) {
        if (results.length >= maxFiles) return;

        const absolutePath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootDir, absolutePath);

        if (entry.isDirectory()) {
            if (shouldSkipDir(entry.name)) continue;
            walkProjectFiles(rootDir, absolutePath, allowedExtensions, maxFiles, results);
            continue;
        }

        if (!entry.isFile()) continue;
        if (!shouldIncludeFile(entry.name, allowedExtensions)) continue;

        results.push({ relativePath, absolutePath });
    }
}

export function listProjectContextFiles(
    projectDir: string,
    options: ListProjectContextFilesOptions = {}
): ProjectFileEntry[] {
    if (!fs.existsSync(projectDir)) return [];

    const allowedExtensions = new Set(
        (options.allowedExtensions || [...DEFAULT_ALLOWED_EXTENSIONS]).map(ext => ext.toLowerCase())
    );
    const maxFiles = options.maxFiles ?? 8;
    const results: ProjectFileEntry[] = [];

    walkProjectFiles(projectDir, projectDir, allowedExtensions, maxFiles, results);
    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function copyProjectSnapshot(projectDir: string, backupDir: string): ProjectFileEntry[] {
    if (!fs.existsSync(projectDir)) return [];

    const copied: ProjectFileEntry[] = [];
    const stack: string[] = [projectDir];

    while (stack.length > 0) {
        const currentDir = stack.pop()!;
        const entries = fs.readdirSync(currentDir, { withFileTypes: true }).sort(compareDirents);

        for (const entry of entries) {
            const absolutePath = path.join(currentDir, entry.name);
            const relativePath = path.relative(projectDir, absolutePath);

            if (entry.isDirectory()) {
                if (shouldSkipDir(entry.name)) continue;
                stack.push(absolutePath);
                continue;
            }

            if (!entry.isFile()) continue;
            if (entry.name.startsWith('.')) continue;

            try {
                const destination = path.join(backupDir, relativePath);
                fs.mkdirSync(path.dirname(destination), { recursive: true });
                fs.copyFileSync(absolutePath, destination);
                copied.push({ relativePath, absolutePath });
            } catch {
                // Snapshotting is best-effort; skip unreadable files.
            }
        }
    }

    return copied.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
