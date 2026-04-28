import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentExecutionRequest } from '../src/lib/agent-execution-request.ts';

test('buildAgentExecutionRequest keeps task as user message and passes agent system prompt separately', () => {
    const request = buildAgentExecutionRequest({
        name: 'Code Assistant',
        systemPrompt: 'You are an expert software engineer.',
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
    }, 'Fix the failing tests');

    assert.equal(request.message, 'Fix the failing tests');
    assert.equal(request.options.systemPrompt, 'You are an expert software engineer.');
    assert.equal(request.options.provider, 'openrouter');
    assert.equal(request.options.model, 'openai/gpt-4o-mini');
});
