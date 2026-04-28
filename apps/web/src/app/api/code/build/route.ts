export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getLioConfig, getProject, saveProject, callLlmSimple } from '@/actions/code-builder';
import { listProjectContextFiles } from '@/lib/lio-project-files';

// ─── Build API — streams step-by-step build progress ─────────

const BUILDER_SYSTEM = `You are Lio, an expert code builder. You write complete, working code for software projects.

When given a build step instruction and the project context, respond with the EXACT file content to write.
Your response must be ONLY valid code — NO markdown fences, NO \`\`\`html, NO \`\`\`css, NO \`\`\`javascript, NO explanations, NO comments about what you're doing.
Start directly with the code. No preamble. No backticks. Just the raw file content.

Rules:
- Write complete files, not partial snippets
- All code must be functional and syntactically correct
- For HTML: include <!DOCTYPE html>, <html>, <head>, <body> — full document
- For CSS: include all styles needed, use CSS variables for theming
- For JS: vanilla JS unless specified otherwise; no import statements unless it's a module setup
- Code must work standalone in a browser OR as specified by the tech stack
- NEVER start your response with \`\`\` or any markdown formatting`;

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const body = await req.json();
    const { projectId, chatMessage } = body;

    if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = await getProject(projectId);
    if (!project || !project.plan) {
        return NextResponse.json({ error: 'Project or plan not found' }, { status: 404 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            const config = await getLioConfig();
            const startTime = Date.now();

            try {
                // If a chat message was sent mid-build, acknowledge it
                if (chatMessage) {
                    send({ type: 'chat_ack', message: `Got it! I'll incorporate: "${chatMessage}"` });
                }

                // Determine which step to start from (resume support)
                const startStep = project.steps.findIndex(s => s.status === 'pending' || s.status === 'running');
                if (startStep === -1) {
                    // All steps done
                    send({ type: 'already_complete' });
                    controller.close();
                    return;
                }

                project.status = 'building';
                await saveProject(project);
                send({ type: 'build_start', totalSteps: project.steps.length, currentStep: startStep });

                // Build files list (accumulate as we create them)
                const builtFiles: { name: string; size: number }[] = [];

                for (let i = startStep; i < project.steps.length; i++) {
                    const step = project.steps[i];
                    step.status = 'running';
                    step.startedAt = Date.now();
                    project.currentStep = i;
                    await saveProject(project);

                    send({
                        type: 'step_start',
                        stepIndex: i,
                        stepLabel: step.label,
                        progress: Math.round((i / project.steps.length) * 100),
                    });

                    try {
                        // Determine what file this step creates (if any)
                        const stepFiles = inferFilesForStep(step.label, project.plan!.files, i);

                        for (const fileName of stepFiles) {
                            const contextPrompt = buildStepContext(project, i, chatMessage);
                            const fileContent = await callLlmSimple(
                                config.builderProvider,
                                config.builderModel,
                                BUILDER_SYSTEM,
                                contextPrompt,
                            );

                            // Strip markdown code fences before writing
                            const cleanContent = stripMarkdownFences(fileContent);

                            // Write file to project directory
                            const filePath = path.join(project.projectDir, fileName);
                            const fileDir = path.dirname(filePath);
                            if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
                            fs.writeFileSync(filePath, cleanContent, 'utf-8');

                            const size = Buffer.byteLength(cleanContent, 'utf-8');
                            builtFiles.push({ name: fileName, size });

                            send({
                                type: 'file_written',
                                fileName,
                                size,
                                preview: fileContent.slice(0, 500),
                            });
                        }

                        step.status = 'done';
                        step.completedAt = Date.now();
                        step.output = stepFiles.join(', ') || 'Configuration step complete';

                    } catch (stepErr: any) {
                        step.status = 'failed';
                        step.error = stepErr?.message || 'Step failed';
                        step.completedAt = Date.now();

                        send({
                            type: 'step_failed',
                            stepIndex: i,
                            stepLabel: step.label,
                            error: step.error,
                        });

                        // Auto-recovery: skip step and continue (up to config limit)
                        const failedCount = project.steps.filter(s => s.status === 'failed').length;
                        if (failedCount <= config.autoRecoveryRetries) {
                            send({ type: 'recovery', message: `Skipping step ${i + 1}, continuing...` });
                            await saveProject(project);
                            continue;
                        } else {
                            project.status = 'failed';
                            project.error = `Too many failed steps (${failedCount}). Build stopped.`;
                            await saveProject(project);
                            send({ type: 'build_failed', error: project.error });
                            controller.close();
                            return;
                        }
                    }

                    send({
                        type: 'step_done',
                        stepIndex: i,
                        stepLabel: step.label,
                        progress: Math.round(((i + 1) / project.steps.length) * 100),
                        elapsed: Date.now() - startTime,
                    });

                    project.elapsedMs = Date.now() - startTime;
                    await saveProject(project);
                }

                // ── All steps done ──────────────────────────────────────
                project.status = 'complete';
                project.completedAt = Date.now();
                project.elapsedMs = Date.now() - startTime;
                await saveProject(project);

                send({
                    type: 'build_complete',
                    projectId: project.id,
                    projectName: project.name,
                    totalSteps: project.steps.length,
                    elapsedMs: project.elapsedMs,
                    files: builtFiles,
                    projectDir: project.projectDir,
                });

            } catch (err: any) {
                project.status = 'failed';
                project.error = err?.message || 'Build failed';
                await saveProject(project);
                send({ type: 'build_failed', error: project.error });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// ─── Helpers ──────────────────────────────────────────────────

/** Strip markdown code fences from LLM output before writing files */
function stripMarkdownFences(content: string): string {
    return content
        // Remove opening fence: ```html, ```css, ```javascript, ```js, ``` etc.
        .replace(/^```[\w]*\n?/gm, '')
        // Remove closing fence: ```
        .replace(/^```\s*$/gm, '')
        .trim();
}

function inferFilesForStep(stepLabel: string, allFiles: string[], stepIndex: number): string[] {
    const lower = stepLabel.toLowerCase();

    // Try to find files mentioned in this step
    const mentioned = allFiles.filter(f => {
        const fname = f.toLowerCase();
        const ext = path.extname(f).slice(1);
        if (lower.includes(fname)) return true;
        if (lower.includes('html') && ext === 'html') return true;
        if (lower.includes('css') && ext === 'css') return true;
        if (lower.includes('javascript') && ext === 'js') return true;
        if (lower.includes('script') && ext === 'js') return true;
        if (lower.includes('style') && ext === 'css') return true;
        if (lower.includes('python') && ext === 'py') return true;
        if (lower.includes('readme') && fname.includes('readme')) return true;
        return false;
    });

    if (mentioned.length > 0) return mentioned.slice(0, 1); // one file per step

    // Fallback: assign files in order
    const fileIndex = Math.min(stepIndex, allFiles.length - 1);
    if (allFiles[fileIndex]) return [allFiles[fileIndex]];

    return []; // non-file step (setup, config, etc.)
}

function buildStepContext(project: any, stepIndex: number, chatMessage?: string): string {
    const step = project.steps[stepIndex];
    const plan = project.plan;

    // Gather existing files for context
    const existingFiles: string[] = [];
    try {
        const files = listProjectContextFiles(project.projectDir, { maxFiles: 12 });
        for (const file of files) {
            if (file.relativePath === 'project.json') continue;
            try {
                const content = fs.readFileSync(file.absolutePath, 'utf-8');
                existingFiles.push(`\n--- ${file.relativePath} ---\n${content.slice(0, 2000)}`);
            } catch { /* skip */ }
        }
    } catch { /* dir not ready */ }

    const targetFile = inferFilesForStep(step.label, plan.files, stepIndex)[0] || 'output';

    return `
Project: "${project.name}"
Prompt: "${project.prompt}"
Tech stack: ${plan.techStack}
All files to create: ${plan.files.join(', ')}
Total steps: ${plan.steps.join(' → ')}

Current step (${stepIndex + 1}/${project.steps.length}): ${step.label}
File to create/update: ${targetFile}

${existingFiles.length > 0 ? `Existing project files for context:${existingFiles.join('\n')}` : ''}
${chatMessage ? `\nUser mid-build request: "${chatMessage}" — incorporate this change.` : ''}

Write the complete content of "${targetFile}" now:`.trim();
}
