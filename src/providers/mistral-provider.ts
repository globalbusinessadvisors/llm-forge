/**
 * Mistral Provider Parser
 *
 * Parses Mistral AI API responses and normalizes them to unified format.
 * Supports Mistral-7B, Mixtral, and all Mistral models.
 *
 * @module providers/mistral-provider
 */

import { BaseProviderParser } from './base-provider.js';
import { StopReason } from '../types/unified-response.js';
import type {
  Provider,
  UnifiedResponse,
  UnifiedStreamResponse,
  UnifiedMessage,
  TokenUsage,
  ModelInfo,
  UnifiedError,
  ProviderMetadata,
  Content,
} from '../types/unified-response.js';

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MistralProvider extends BaseProviderParser {
  constructor() {
    super('mistral' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'mistral' as Provider,
      name: 'Mistral AI',
      description: 'Mistral AI API',
      apiVersion: 'v1',
      baseUrl: 'https://api.mistral.ai/v1',
      capabilities: {
        // Streaming currently not implemented - stub methods return empty chunks
        // Set to false to accurately reflect current implementation status
        // TODO: Implement proper Mistral AI streaming format validation and parsing
        streaming: false,
        functionCalling: true,
        toolUse: true,
        vision: false,
        jsonMode: true,
        systemMessages: true,
        maxContextWindow: 32768,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [
        {
          id: 'mistral-large-latest',
          provider: 'mistral' as Provider,
          contextWindow: 32768,
          maxOutputTokens: 4096,
        },
        {
          id: 'mistral-small-latest',
          provider: 'mistral' as Provider,
          contextWindow: 32768,
          maxOutputTokens: 4096,
        },
        {
          id: 'open-mixtral-8x7b',
          provider: 'mistral' as Provider,
          contextWindow: 32768,
          maxOutputTokens: 4096,
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.mistral.ai',
    };
  }

  protected validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      this.addError('Invalid response: must be an object');
      return false;
    }

    const obj = response as Record<string, unknown>;

    // Error responses are valid
    if (obj.error) {
      return true;
    }

    // Check for at least one key field (relaxed)
    const hasId = 'id' in obj;
    const hasChoices = 'choices' in obj;
    const hasModel = 'model' in obj;
    const hasUsage = 'usage' in obj;

    if (!(hasId || hasChoices || hasModel || hasUsage)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected validateStreamChunk(chunk: unknown): boolean {
    return chunk !== null && typeof chunk === 'object';
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const mistralResponse = response as MistralResponse;

    // Check for error response
    if ('error' in mistralResponse) {
      const error = this.extractError(response);
      return {
        id: this.generateId(),
        provider: this.provider,
        model: this.createModelInfo('unknown', this.provider),
        messages: [],
        stopReason: StopReason.Unknown,
        usage: this.createDefaultUsage(),
        metadata: {
          timestamp: this.getCurrentTimestamp(),
        },
        error,
      };
    }

    return {
      id: mistralResponse.id,
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: new Date(mistralResponse.created * 1000).toISOString(),
        requestId: mistralResponse.id,
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    const streamChunk = chunk as any;
    return {
      id: streamChunk.id || this.generateId(),
      provider: this.provider,
      model: this.createModelInfo(streamChunk.model || 'unknown', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const mistralResponse = response as MistralResponse;
    const messages: UnifiedMessage[] = [];

    for (const choice of mistralResponse.choices) {
      const content: Content[] = [];

      if (choice.message.content) {
        content.push(this.createTextContent(choice.message.content));
      }

      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          content.push(
            this.createToolUseContent(
              toolCall.id,
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            )
          );
        }
      }

      messages.push({
        role: this.normalizeRole(choice.message.role),
        content,
      });
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const mistralResponse = response as MistralResponse;
    return {
      inputTokens: mistralResponse.usage.prompt_tokens,
      outputTokens: mistralResponse.usage.completion_tokens,
      totalTokens: mistralResponse.usage.total_tokens,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const mistralResponse = response as MistralResponse;
    if (mistralResponse.choices.length === 0) return StopReason.Unknown;
    return this.normalizeStopReason(mistralResponse.choices[0].finish_reason);
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const mistralResponse = response as MistralResponse;
    return this.createModelInfo(mistralResponse.model, this.provider);
  }

  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as any;
    if (!obj.error) return undefined;
    return {
      code: obj.error.code || 'unknown_error',
      message: obj.error.message,
      type: obj.error.type || 'error',
    };
  }
}
