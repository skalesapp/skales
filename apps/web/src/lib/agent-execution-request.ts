import type { Provider } from '@/actions/chat';

type AgentExecutionInput = {
    name: string;
    systemPrompt: string;
    provider?: Provider;
    model?: string;
};

type AgentExecutionRequest = {
    message: string;
    options: {
        provider?: Provider;
        model?: string;
        systemPrompt: string;
    };
};

export function buildAgentExecutionRequest(agent: AgentExecutionInput, task: string): AgentExecutionRequest {
    return {
        message: task,
        options: {
            provider: agent.provider,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
        },
    };
}
