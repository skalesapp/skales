import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    copyProjectSnapshot,
    listProjectContextFiles,
} from '../src/lib/lio-project-files.ts';

function makeTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'skales-lio-test-'));
}

function writeFile(rootDir, relativePath, content) {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}

test('copyProjectSnapshot copies nested source files and skips generated folders', () => {
    const projectDir = makeTempDir();
    const backupDir = path.join(projectDir, '_backups', String(Date.now()));

    writeFile(projectDir, 'index.html', '<!doctype html>');
    writeFile(projectDir, 'src/app/page.tsx', 'export default function Page() { return null; }');
    writeFile(projectDir, 'components/header.tsx', 'export function Header() { return null; }');
    writeFile(projectDir, 'public/logo.svg', '<svg></svg>');
    writeFile(projectDir, '_backups/old/index.html', 'old');
    writeFile(projectDir, '.next/server/app.js', 'compiled');
    writeFile(projectDir, 'node_modules/pkg/index.js', 'dependency');
    writeFile(projectDir, '.env', 'SECRET=1');

    const copied = copyProjectSnapshot(projectDir, backupDir);

    assert.equal(copied.length, 4);
    assert.deepEqual(
        copied.map(entry => entry.relativePath).sort(),
        ['components/header.tsx', 'index.html', 'public/logo.svg', 'src/app/page.tsx']
    );

    assert.ok(fs.existsSync(path.join(backupDir, 'src/app/page.tsx')));
    assert.ok(fs.existsSync(path.join(backupDir, 'components/header.tsx')));
    assert.ok(fs.existsSync(path.join(backupDir, 'public/logo.svg')));
    assert.ok(!fs.existsSync(path.join(backupDir, '_backups/old/index.html')));
    assert.ok(!fs.existsSync(path.join(backupDir, '.next/server/app.js')));
    assert.ok(!fs.existsSync(path.join(backupDir, 'node_modules/pkg/index.js')));
    assert.ok(!fs.existsSync(path.join(backupDir, '.env')));
});

test('listProjectContextFiles discovers nested project files with relative paths', () => {
    const projectDir = makeTempDir();

    writeFile(projectDir, 'src/app/page.tsx', 'export default function Page() { return null; }');
    writeFile(projectDir, 'src/components/button.tsx', 'export const Button = () => null;');
    writeFile(projectDir, 'README.md', '# Demo');
    writeFile(projectDir, '_backups/old/page.tsx', 'stale');
    writeFile(projectDir, 'dist/bundle.js', 'compiled');

    const files = listProjectContextFiles(projectDir, {
        maxFiles: 10,
        allowedExtensions: ['.tsx', '.md'],
    });

    assert.deepEqual(
        files.map(entry => entry.relativePath).sort(),
        ['README.md', 'src/app/page.tsx', 'src/components/button.tsx']
    );
});
