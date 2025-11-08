/**
 * Anthropic Provider Parser
 *
 * Parses Anthropic API responses and normalizes them to unified format.
 * Supports Claude 3 (Opus, Sonnet, Haiku) and all Anthropic models.
 *
 * @module providers/anthropic-provider
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
  StreamChunk,
} from '../types/unified-response.js';

/**
 * Anthropic message response
 */
interface AnthropicMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence?: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Anthropic error response
 */
interface AnthropicError {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Anthropic Provider Parser
 */
export class AnthropicProvider extends BaseProviderParser {
  constructor() {
    super('anthropic' as Provider);
  }

  /**
   * Get provider metadata
   */
  getMetadata(): ProviderMetadata {
    return {
      id: 'anthropic' as Provider,
      name: 'Anthropic',
      description: 'Anthropic API for Claude models',
      apiVersion: '2023-06-01',
      baseUrl: 'https://api.anthropic.com/v1',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: true,
        vision: true,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 200000, // Claude 3
        maxOutputTokens: 4096,
        modalities: ['text', 'image'],
      },
      models: [
        {
          id: 'claude-3-opus-20240229',
          provider: 'anthropic' as Provider,
          contextWindow: 200000,
          maxOutputTokens: 4096,
          capabilities: ['text', 'vision', 'tool_use'],
        },
        {
          id: 'claude-3-sonnet-20240229',
          provider: 'anthropic' as Provider,
          contextWindow: 200000,
          maxOutputTokens: 4096,
          capabilities: ['text', 'vision', 'tool_use'],
        },
        {
          id: 'claude-3-haiku-20240307',
          provider: 'anthropic' as Provider,
          contextWindow: 200000,
          maxOutputTokens: 4096,
          capabilities: ['text', 'vision'],
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.anthropic.com/claude/reference',
    };
  }

  /**
   * Validate Anthropic response
   */
  protected validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      this.addError('Invalid response: must be an object');
      return false;
    }

    const obj = response as Record<string, unknown>;

    // Check for error - error responses are valid
    if (obj.type === 'error' || obj.error) {
      return true;
    }

    // Check for at least one key field (relaxed validation)
    const hasType = 'type' in obj;
    const hasId = 'id' in obj;
    const hasContent = 'content' in obj;
    const hasRole = 'role' in obj;

    if (!(hasType || hasId || hasContent || hasRole)) {
      this.addError('Invalid response: missing required Anthropic response fields');
      return false;
    }

    return true;
  }

  /**
   * Validate streaming chunk
   * Enterprise-grade validation for Anthropic Server-Sent Events
   */
  protected validateStreamChunk(chunk: unknown): boolean {
    if (!chunk || typeof chunk !== 'object') {
      this.addError('Invalid chunk: must be an object');
      return false;
    }

    const obj = chunk as Record<string, unknown>;

    // Validate event type field
    if (!obj.type || typeof obj.type !== 'string') {
      this.addError('Invalid chunk: missing or invalid type field');
      return false;
    }

    // Validate known event types
    const validTypes = [
      'message_start',
      'message_delta',
      'message_stop',
      'content_block_start',
      'content_block_delta',
      'content_block_stop',
      'ping',
      'error',
    ];

    if (!validTypes.includes(obj.type as string)) {
      this.addError(`Invalid chunk: unknown event type "${obj.type}"`);
      return false;
    }

    // Event-specific validation
    if (obj.type === 'content_block_delta') {
      if (!obj.delta || typeof obj.delta !== 'object') {
        this.addError('Invalid content_block_delta: missing delta field');
        return false;
      }
      if (typeof obj.index !== 'number') {
        this.addError('Invalid content_block_delta: missing or invalid index');
        return false;
      }
    }

    if (obj.type === 'content_block_start') {
      if (!obj.content_block || typeof obj.content_block !== 'object') {
        this.addError('Invalid content_block_start: missing content_block field');
        return false;
      }
      if (typeof obj.index !== 'number') {
        this.addError('Invalid content_block_start: missing or invalid index');
        return false;
      }
    }

    if (obj.type === 'error') {
      if (!obj.error || typeof obj.error !== 'object') {
        this.addError('Invalid error event: missing error field');
        return false;
      }
      const error = obj.error as Record<string, unknown>;
      if (!error.type || typeof error.type !== 'string') {
        this.addError('Invalid error event: error.type must be a string');
        return false;
      }
      if (!error.message || typeof error.message !== 'string') {
        this.addError('Invalid error event: error.message must be a string');
        return false;
      }
    }

    return true;
  }

  /**
   * Parse Anthropic response to unified format
   */
  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const obj = response as AnthropicMessage | AnthropicError;

    // Check for error
    if (obj.type === 'error') {
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

    const anthropicResponse = obj as AnthropicMessage;

    // Extract data
    const messages = this.extractMessages(response);
    const usage = this.extractUsage(response);
    const stopReason = this.extractStopReason(response);
    const modelInfo = this.extractModelInfo(response);

    return {
      id: anthropicResponse.id,
      provider: this.provider,
      model: modelInfo,
      messages,
      stopReason,
      usage,
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        requestId: anthropicResponse.id,
        stopSequence: anthropicResponse.stop_sequence,
      },
      raw: response,
    };
  }

  /**
   * Parse streaming chunk to unified format
   * Handles all Anthropic Server-Sent Event types including errors
   */
  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    const streamChunk = chunk as Record<string, unknown>;
    const chunks: StreamChunk[] = [];
    let error: UnifiedError | undefined;

    // Handle error events
    if (streamChunk.type === 'error') {
      const errorData = streamChunk.error as Record<string, unknown>;
      error = {
        code: errorData.type as string,
        message: errorData.message as string,
        type: 'streaming_error',
      };

      return {
        id: this.generateId(),
        provider: this.provider,
        model: this.createModelInfo('unknown', this.provider),
        chunks: [],
        metadata: {
          timestamp: this.getCurrentTimestamp(),
        },
        error,
      };
    }

    // Handle ping events (keep-alive)
    if (streamChunk.type === 'ping') {
      // Ping events don't produce chunks but are valid
      return {
        id: this.generateId(),
        provider: this.provider,
        model: this.createModelInfo('unknown', this.provider),
        chunks: [],
        metadata: {
          timestamp: this.getCurrentTimestamp(),
          eventType: 'ping',
        },
      };
    }

    // Handle different event types
    if (streamChunk.type === 'message_start') {
      chunks.push({
        type: 'message_start',
      });
    } else if (streamChunk.type === 'content_block_start') {
      const index = streamChunk.index as number;
      const contentBlock = streamChunk.content_block as Record<string, unknown>;

      if (contentBlock.type === 'text') {
        chunks.push({
          type: 'content_block_start',
          index,
          contentBlock: this.createTextContent(''),
        });
      } else if (contentBlock.type === 'tool_use') {
        // Tool use arguments may be incomplete, use safe parsing
        const input = contentBlock.input
          ? this.safeJsonParse(JSON.stringify(contentBlock.input), {}, 'tool use input')
          : {};

        chunks.push({
          type: 'content_block_start',
          index,
          contentBlock: this.createToolUseContent(
            contentBlock.id as string,
            contentBlock.name as string,
            input
          ),
        });
      }
    } else if (streamChunk.type === 'content_block_delta') {
      const delta = streamChunk.delta as Record<string, unknown>;
      chunks.push({
        type: 'content_block_delta',
        delta: {
          type: delta.type as any,
          text: delta.text as string,
        },
        index: streamChunk.index as number,
      });
    } else if (streamChunk.type === 'message_delta') {
      const delta = streamChunk.delta as Record<string, unknown>;
      if (delta.stop_reason) {
        chunks.push({
          type: 'message_delta',
          delta: {
            stopReason: this.normalizeStopReason(delta.stop_reason as string),
          },
        });
      }
    } else if (streamChunk.type === 'message_stop') {
      chunks.push({
        type: 'message_stop',
      });
    } else if (streamChunk.type === 'content_block_stop') {
      // Handle content block completion
      chunks.push({
        type: 'content_block_stop',
        index: streamChunk.index as number,
      });
    }

    return {
      id: (streamChunk.message as any)?.id || this.generateId(),
      provider: this.provider,
      model: this.createModelInfo((streamChunk.message as any)?.model || 'unknown', this.provider),
      chunks,
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        eventType: streamChunk.type as string,
      },
      error,
    };
  }

  /**
   * Extract messages from Anthropic response
   */
  protected extractMessages(response: unknown): UnifiedMessage[] {
    const anthropicResponse = response as AnthropicMessage;
    const content: Content[] = [];

    for (const block of anthropicResponse.content) {
      if (block.type === 'text' && block.text) {
        content.push(this.createTextContent(block.text));
      } else if (block.type === 'tool_use' && block.id && block.name) {
        content.push(this.createToolUseContent(block.id, block.name, block.input || {}));
      }
    }

    return [
      {
        role: this.normalizeRole(anthropicResponse.role),
        content,
      },
    ];
  }

  /**
   * Extract token usage from Anthropic response
   */
  protected extractUsage(response: unknown): TokenUsage {
    const anthropicResponse = response as AnthropicMessage;

    const usage: TokenUsage = {
      inputTokens: anthropicResponse.usage.input_tokens,
      outputTokens: anthropicResponse.usage.output_tokens,
      totalTokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens,
    };

    // Add Anthropic-specific cache metadata
    if (
      anthropicResponse.usage.cache_creation_input_tokens ||
      anthropicResponse.usage.cache_read_input_tokens
    ) {
      usage.metadata = {
        cacheCreationInputTokens: anthropicResponse.usage.cache_creation_input_tokens,
        cacheReadInputTokens: anthropicResponse.usage.cache_read_input_tokens,
      };
    }

    return usage;
  }

  /**
   * Extract stop reason from Anthropic response
   */
  protected extractStopReason(response: unknown): StopReason {
    const anthropicResponse = response as AnthropicMessage;
    return this.normalizeStopReason(anthropicResponse.stop_reason || undefined);
  }

  /**
   * Extract model information from Anthropic response
   */
  protected extractModelInfo(response: unknown): ModelInfo {
    const anthropicResponse = response as AnthropicMessage;
    return this.createModelInfo(anthropicResponse.model, this.provider);
  }

  /**
   * Extract error information from Anthropic response
   */
  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as AnthropicError;

    if (obj.type !== 'error') {
      return undefined;
    }

    return {
      code: obj.error.type,
      message: obj.error.message,
      type: obj.error.type,
    };
  }
}
