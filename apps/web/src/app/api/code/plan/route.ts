export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLioConfig, callLlmSimple, createProject, getProject, saveProject, type LioPlan } from '@/actions/code-builder';
import { listProjectContextFiles } from '@/lib/lio-project-files';

// ─── Planning API — streams Architect + Reviewer discussion ──

const ARCHITECT_SYSTEM = `You are an expert software architect named Architect. Your job is to create a clear, focused, implementable technical plan for a software project.

When given a project description, respond with:
1. A brief architectural overview (2-3 sentences)
2. Your recommended tech stack (be specific — e.g. "HTML5, CSS3 (CSS Grid + Flexbox), Vanilla JS")
3. A list of files to create (be precise)
4. A numbered list of build steps (each step = one logical unit of work)
5. Estimated build time and complexity

Be practical, not over-engineered. Prefer simple, working solutions over complex architectures.
When the user requests multiple pages, create SEPARATE HTML files for each page (e.g. index.html, services.html, contact.html). Link them via navigation. NEVER put everything on one page unless explicitly asked for a single-page website.
Keep your response concise — under 300 words.`;

const ARCHITECT_REVISION_SYSTEM = `You are an expert software architect named Architect. You are REVISING a previously proposed architecture plan based on user feedback.

You will receive:
- The original project request
- Your previous architecture proposal
- The reviewer's feedback on your previous plan
- The user's specific modification request

Your task: Revise the plan to address the user's feedback. Be specific about what changed and why.
Keep the same format as before, but make the requested changes clearly.
When the user requests multiple pages, create SEPARATE HTML files for each page (e.g. index.html, services.html, contact.html). Link them via navigation. NEVER put everything on one page unless explicitly asked for a single-page website.
Keep your response concise — under 300 words.`;

const REVIEWER_SYSTEM = `You are an expert code reviewer named Reviewer. Your job is to review and improve a software architecture plan.

When given a plan, identify:
1. Any missing important features or considerations
2. Potential problems or gotchas
3. 1-2 specific improvements to the plan

Be constructive and specific. Focus on what would make the final result better.
Keep your response concise — under 200 words. End with "APPROVED" or "NEEDS REVISION".`;

const REVIEWER_REVISION_SYSTEM = `You are an expert code reviewer named Reviewer. You are reviewing a REVISED architecture plan.

The architect has updated the plan based on user feedback. Your task:
1. Confirm whether the user's feedback was properly addressed
2. Note any remaining issues or new concerns introduced by the revision
3. 1-2 specific improvements if still needed

Be concise and constructive. Keep your response under 200 words. End with "APPROVED" or "NEEDS REVISION".`;

const FINALIZER_SYSTEM = `You are Lio AI. Given a project description and architectural discussion, output ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "techStack": "...",
  "files": ["file1.html", "styles.css", ...],
  "steps": ["Step description 1", "Step description 2", ...],
  "timeEstimate": "~X minutes",
  "costEstimate": "~$X.XX",
  "complexity": "Low|Medium|High",
  "architectNotes": "brief summary",
  "reviewerNotes": "brief summary"
}

Rules:
- steps array: 4-12 items, each a concrete action like "Create HTML skeleton with semantic structure"
- files array: exact filenames to be created — use SEPARATE files for each HTML page (index.html, about.html, etc.)
- complexity: Low (<5 steps), Medium (5-8), High (>8)
- costEstimate: rough estimate using $0.002 per 1K tokens, typical project = $0.01-0.10
- timeEstimate: REALISTIC build time in minutes. Each step takes ~20-40 seconds. Low = "~2 min", Medium = "~4 min", High = "~7 min". NEVER output values above 15 minutes. Never output 600 or 1200 or any utopian numbers.`;

interface PreviousMessage {
    role: 'architect' | 'reviewer' | 'system' | 'user_feedback';
    text: string;
}

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const { prompt, projectName, projectId: existingProjectId, previousMessages, isReplan, iterationMode, projectDir: existingProjectDir } = await req.json();

    if (!prompt) {
        return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const config = await getLioConfig();

                // Create or reuse project
                let project;
                if (isReplan && existingProjectId) {
                    project = await getProject(existingProjectId);
                    if (!project) {
                        const name = projectName || prompt.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'project';
                        project = await createProject(name, prompt);
                    } else {
                        // Reset plan state for replan
                        project.plan = null;
                        project.steps = [];
                        project.status = 'planning';
                        await saveProject(project);
                    }
                } else {
                    const name = projectName || prompt.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'project';
                    project = await createProject(name, prompt);
                }

                send({ type: 'project', projectId: project.id, projectName: project.name });

                // ── Build history context for re-plans ──────────────────
                let prevArchitectText = '';
                let prevReviewerText = '';
                let userFeedback = '';

                if (isReplan && previousMessages && previousMessages.length > 0) {
                    for (const msg of (previousMessages as PreviousMessage[])) {
                        if (msg.role === 'architect') prevArchitectText = msg.text;
                        if (msg.role === 'reviewer') prevReviewerText = msg.text;
                        if (msg.role === 'user_feedback') userFeedback = msg.text;
                    }
                }

                const isRevision = isReplan && (prevArchitectText || prevReviewerText || userFeedback);

                // ── Read existing project files for iteration context ─────
                let existingFilesContext = '';
                if (iterationMode && (existingProjectDir || project.projectDir)) {
                    const dir = existingProjectDir || project.projectDir;
                    try {
                        if (fs.existsSync(dir)) {
                            const files = listProjectContextFiles(dir, { maxFiles: 8 })
                                .filter(file => file.relativePath !== 'project.json');
                            if (files.length > 0) {
                                const snippets = files.map(file => {
                                    try {
                                        const content = fs.readFileSync(file.absolutePath, 'utf-8');
                                        const preview = content.length > 600 ? content.slice(0, 600) + '\n... (truncated)' : content;
                                        return `### ${file.relativePath}\n\`\`\`\n${preview}\n\`\`\``;
                                    } catch { return `### ${file.relativePath}\n(could not read)`; }
                                });
                                existingFilesContext = `\n\n## Existing project files (showing ${files.length}):\n${snippets.join('\n\n')}`;
                            }
                        }
                    } catch { /* non-fatal */ }
                }

                // ── Architect ──────────────────────────────────────────────
                send({ type: 'phase', phase: 'architect', message: iterationMode ? 'Analyzing existing project...' : isRevision ? 'Revising plan...' : 'Analyzing your idea...' });

                const architectUserMessage = iterationMode
                    ? `EXISTING PROJECT — change request: "${prompt}"

The project already has working code. Your job is to plan ONLY the changes needed, modifying existing files where possible rather than rewriting everything from scratch.

DO NOT create a new project structure. Work with what exists.${existingFilesContext}

Plan the minimal changes to fulfill: "${prompt}"`
                    : isRevision
                    ? `Original project request: "${prompt}"

Previous architecture proposal:
${prevArchitectText}

Reviewer's feedback on previous plan:
${prevReviewerText}

User's modification request: "${userFeedback}"

Please revise the architecture plan based on the user's feedback above.`
                    : `Project to build: ${prompt}`;

                const architectResponse = await callLlmSimple(
                    config.architectProvider,
                    config.architectModel,
                    isRevision ? ARCHITECT_REVISION_SYSTEM : ARCHITECT_SYSTEM,
                    architectUserMessage,
                );
                send({ type: 'architect', text: architectResponse });

                // ── Reviewer ───────────────────────────────────────────────
                send({ type: 'phase', phase: 'reviewer', message: isRevision ? 'Reviewing revision...' : 'Getting second opinion...' });

                const reviewerUserMessage = isRevision
                    ? `Original request: "${prompt}"

User's modification request: "${userFeedback}"

Revised architecture plan:
${architectResponse}

Previous plan for context:
${prevArchitectText}`
                    : `Original request: "${prompt}"\n\nArchitect's plan:\n${architectResponse}`;

                const reviewerResponse = await callLlmSimple(
                    config.reviewerProvider,
                    config.reviewerModel,
                    isRevision ? REVIEWER_REVISION_SYSTEM : REVIEWER_SYSTEM,
                    reviewerUserMessage,
                );
                send({ type: 'reviewer', text: reviewerResponse });

                // ── Finalize plan ──────────────────────────────────────────
                send({ type: 'phase', phase: 'finalizing', message: 'Creating build plan...' });

                const finalizerResponse = await callLlmSimple(
                    config.architectProvider,
                    config.architectModel,
                    FINALIZER_SYSTEM,
                    `Project: "${prompt}"${userFeedback ? `\nUser modification: "${userFeedback}"` : ''}\n\nArchitect:\n${architectResponse}\n\nReviewer:\n${reviewerResponse}`,
                );

                // Parse JSON plan
                let plan: LioPlan;
                try {
                    const jsonMatch = finalizerResponse.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error('No JSON found');
                    plan = JSON.parse(jsonMatch[0]);
                } catch {
                    // Fallback plan
                    plan = {
                        techStack: 'HTML5, CSS3, JavaScript',
                        files: ['index.html', 'styles.css', 'script.js'],
                        steps: ['Create project structure', 'Build HTML skeleton', 'Add CSS styling', 'Add JavaScript logic', 'Test and polish'],
                        timeEstimate: '~5 minutes',
                        costEstimate: '~$0.02',
                        complexity: 'Medium',
                        architectNotes: architectResponse.slice(0, 200),
                        reviewerNotes: reviewerResponse.slice(0, 200),
                    };
                }

                // Save plan to project
                project.plan = plan;
                project.totalSteps = plan.steps.length;
                project.steps = plan.steps.map((label, i) => ({
                    index: i,
                    label,
                    status: 'pending',
                }));
                await saveProject(project);

                send({ type: 'plan', plan, projectId: project.id });

            } catch (err: any) {
                send({ type: 'error', message: err?.message || 'Planning failed' });
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
