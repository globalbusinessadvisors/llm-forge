/**
 * OpenAI Provider Parser
 *
 * Parses OpenAI API responses and normalizes them to unified format.
 * Supports GPT-4, GPT-3.5, O1, and all OpenAI chat models.
 *
 * @module providers/openai-provider
 */

import { BaseProviderParser } from './base-provider.js';
import { MessageRole, StopReason } from '../types/unified-response.js';
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
  StreamChunk,
} from '../types/unified-response.js';

/**
 * OpenAI chat completion response
 */
interface OpenAIChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string | null;
    logprobs?: unknown;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
    };
  };
  system_fingerprint?: string;
}

/**
 * OpenAI streaming chunk
 */
interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason: string | null;
    logprobs?: unknown;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI error response
 */
interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string | null;
  };
}

/**
 * OpenAI Provider Parser
 */
export class OpenAIProvider extends BaseProviderParser {
  constructor() {
    super('openai' as Provider);
  }

  /**
   * Get provider metadata
   */
  getMetadata(): ProviderMetadata {
    return {
      id: 'openai' as Provider,
      name: 'OpenAI',
      description: 'OpenAI API for GPT models',
      apiVersion: 'v1',
      baseUrl: 'https://api.openai.com/v1',
      capabilities: {
        streaming: true,
        functionCalling: true,
        toolUse: true,
        vision: true,
        jsonMode: true,
        systemMessages: true,
        maxContextWindow: 128000, // GPT-4 Turbo
        maxOutputTokens: 4096,
        modalities: ['text', 'image'],
      },
      models: [
        {
          id: 'gpt-4-turbo',
          provider: 'openai' as Provider,
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: ['text', 'vision', 'function_calling'],
        },
        {
          id: 'gpt-4',
          provider: 'openai' as Provider,
          contextWindow: 8192,
          maxOutputTokens: 4096,
          capabilities: ['text', 'function_calling'],
        },
        {
          id: 'gpt-3.5-turbo',
          provider: 'openai' as Provider,
          contextWindow: 16385,
          maxOutputTokens: 4096,
          capabilities: ['text', 'function_calling'],
        },
        {
          id: 'o1-preview',
          provider: 'openai' as Provider,
          contextWindow: 128000,
          maxOutputTokens: 32768,
          capabilities: ['text', 'reasoning'],
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://platform.openai.com/docs/api-reference',
    };
  }

  /**
   * Validate OpenAI response
   */
  protected validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      this.addError('Invalid response: must be an object');
      return false;
    }

    const obj = response as Record<string, unknown>;

    // Check for error - error responses are valid
    if (obj.error) {
      return true;
    }

    // Check for at least one key field (relaxed validation)
    const hasId = 'id' in obj;
    const hasChoices = 'choices' in obj;
    const hasModel = 'model' in obj;
    const hasObject = 'object' in obj;

    if (!(hasId || hasChoices || hasModel || hasObject)) {
      this.addError('Invalid response: missing required OpenAI response fields');
      return false;
    }

    return true;
  }

  /**
   * Validate streaming chunk
   */
  protected validateStreamChunk(chunk: unknown): boolean {
    if (!chunk || typeof chunk !== 'object') {
      this.addError('Invalid chunk: must be an object');
      return false;
    }

    const obj = chunk as Record<string, unknown>;

    if (!obj.id || typeof obj.id !== 'string') {
      this.addError('Invalid chunk: missing or invalid id');
      return false;
    }

    if (!obj.choices || !Array.isArray(obj.choices)) {
      this.addError('Invalid chunk: missing or invalid choices');
      return false;
    }

    return true;
  }

  /**
   * Parse OpenAI response to unified format
   */
  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const openaiResponse = response as OpenAIChatCompletion;

    // Check for error
    if ('error' in openaiResponse) {
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

    // Extract data
    const messages = this.extractMessages(response);
    const usage = this.extractUsage(response);
    const stopReason = this.extractStopReason(response);
    const modelInfo = this.extractModelInfo(response);

    return {
      id: openaiResponse.id,
      provider: this.provider,
      model: modelInfo,
      messages,
      stopReason,
      usage,
      metadata: {
        timestamp: new Date(openaiResponse.created * 1000).toISOString(),
        requestId: openaiResponse.id,
        systemFingerprint: openaiResponse.system_fingerprint,
      },
      raw: response,
    };
  }

  /**
   * Parse streaming chunk to unified format
   */
  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    const streamChunk = chunk as OpenAIStreamChunk;

    const chunks: StreamChunk[] = [];
    const modelInfo = this.createModelInfo(streamChunk.model, this.provider);

    // Process each choice
    for (const choice of streamChunk.choices) {
      if (choice.delta.content) {
        chunks.push({
          type: 'content_block_delta',
          delta: {
            type: 'text' as const,
            text: choice.delta.content,
          },
          index: choice.index,
        });
      }

      // Handle tool calls with proper accumulation for streaming
      if (choice.delta.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          // Accumulate tool call data (may span multiple chunks)
          const accumulated = this.accumulateToolCall(toolCall.index, {
            id: toolCall.id,
            name: toolCall.function?.name,
            arguments: toolCall.function?.arguments || '',
          });

          // Only emit tool use event if we have complete data
          if (this.isToolCallComplete(accumulated)) {
            // Safely parse accumulated arguments
            const parsedArgs = this.safeJsonParse(
              accumulated.arguments,
              {},
              `tool call '${accumulated.name}' arguments`
            );

            chunks.push({
              type: 'content_block_start',
              index: toolCall.index,
              contentBlock: this.createToolUseContent(
                accumulated.id!,
                accumulated.name!,
                parsedArgs
              ),
            });

            // Clear accumulated data once emitted
            this.clearAccumulatedToolCall(toolCall.index);
          }
        }
      }

      if (choice.finish_reason) {
        chunks.push({
          type: 'message_stop',
          delta: {
            stopReason: this.normalizeStopReason(choice.finish_reason),
          },
        });
      }
    }

    return {
      id: streamChunk.id,
      provider: this.provider,
      model: modelInfo,
      chunks,
      usage: streamChunk.usage ? this.extractUsage(chunk) : undefined,
      metadata: {
        timestamp: new Date(streamChunk.created * 1000).toISOString(),
        requestId: streamChunk.id,
      },
    };
  }

  /**
   * Extract messages from OpenAI response
   */
  protected extractMessages(response: unknown): UnifiedMessage[] {
    const openaiResponse = response as OpenAIChatCompletion;
    const messages: UnifiedMessage[] = [];

    for (const choice of openaiResponse.choices) {
      const content: Content[] = [];

      // Text content
      if (choice.message.content) {
        content.push(this.createTextContent(choice.message.content));
      }

      // Tool calls
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          // Safely parse tool call arguments
          const parsedArgs = this.safeJsonParse(
            toolCall.function.arguments,
            {},
            `tool call '${toolCall.function.name}' arguments`
          );

          content.push(
            this.createToolUseContent(
              toolCall.id,
              toolCall.function.name,
              parsedArgs
            )
          );
        }
      }

      // Function call (legacy)
      if (choice.message.function_call) {
        content.push(
          this.createFunctionCallContent(
            choice.message.function_call.name,
            choice.message.function_call.arguments
          )
        );
      }

      messages.push({
        role: this.normalizeRole(choice.message.role),
        content,
      });
    }

    return messages;
  }

  /**
   * Extract token usage from OpenAI response
   */
  protected extractUsage(response: unknown): TokenUsage {
    const openaiResponse = response as OpenAIChatCompletion;

    if (!openaiResponse.usage) {
      return this.createDefaultUsage();
    }

    const usage: TokenUsage = {
      inputTokens: openaiResponse.usage.prompt_tokens,
      outputTokens: openaiResponse.usage.completion_tokens,
      totalTokens: openaiResponse.usage.total_tokens,
    };

    // Add OpenAI-specific metadata
    if (openaiResponse.usage.completion_tokens_details) {
      usage.metadata = {
        reasoningTokens: openaiResponse.usage.completion_tokens_details.reasoning_tokens,
        audioTokens: openaiResponse.usage.completion_tokens_details.audio_tokens,
      };
    }

    return usage;
  }

  /**
   * Extract stop reason from OpenAI response
   */
  protected extractStopReason(response: unknown): StopReason {
    const openaiResponse = response as OpenAIChatCompletion;

    if (openaiResponse.choices.length === 0) {
      return StopReason.Unknown;
    }

    const finishReason = openaiResponse.choices[0].finish_reason;
    return this.normalizeStopReason(finishReason || undefined);
  }

  /**
   * Extract model information from OpenAI response
   */
  protected extractModelInfo(response: unknown): ModelInfo {
    const openaiResponse = response as OpenAIChatCompletion;

    return this.createModelInfo(openaiResponse.model, this.provider);
  }

  /**
   * Extract error information from OpenAI response
   */
  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as Record<string, unknown>;

    if (!obj.error || typeof obj.error !== 'object') {
      return undefined;
    }

    const errorObj = obj.error as OpenAIError['error'];

    return {
      code: errorObj.code || 'unknown_error',
      message: errorObj.message,
      type: errorObj.type,
      details: {
        param: errorObj.param,
      },
    };
  }
}
