/**
 * Base Provider Parser
 *
 * Abstract base class for all LLM provider parsers.
 * Defines the interface that all provider-specific parsers must implement.
 *
 * @module providers/base-provider
 */

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
} from '../types/unified-response.js';

/**
 * Parse result from provider parser
 */
export interface ParseResult {
  /** Whether parsing succeeded */
  success: boolean;

  /** Parsed response (if successful) */
  response?: UnifiedResponse;

  /** Parse errors */
  errors: string[];

  /** Parse warnings */
  warnings: string[];
}

/**
 * Stream parse result
 */
export interface StreamParseResult {
  /** Whether parsing succeeded */
  success: boolean;

  /** Parsed stream response (if successful) */
  response?: UnifiedStreamResponse;

  /** Parse errors */
  errors: string[];

  /** Parse warnings */
  warnings: string[];
}

/**
 * Base provider parser
 *
 * All provider-specific parsers extend this class and implement
 * the abstract methods for parsing responses from their API.
 */
/**
 * Tool call accumulation state for streaming
 */
export interface PartialToolCall {
  id?: string;
  name?: string;
  arguments: string;
}

/**
 * Stream state for managing partial chunks
 */
export interface StreamState {
  /** Partial content accumulation by content block index */
  partialContent: Map<number, string>;
  /** Partial tool calls by index */
  partialToolCalls: Map<number, PartialToolCall>;
  /** Last processed chunk ID */
  lastChunkId?: string;
  /** Stream buffer size for memory management */
  bufferSize: number;
  /** Stream start time for metrics */
  startTime?: number;
  /** Total chunks processed */
  chunkCount: number;
}

/**
 * Base provider parser
 *
 * All provider-specific parsers extend this class and implement
 * the abstract methods for parsing responses from their API.
 */
export abstract class BaseProviderParser {
  protected provider: Provider;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  /**
   * Stream state management for partial chunks and tool calls
   * Enables proper handling of data split across multiple chunks
   */
  protected streamState: StreamState = {
    partialContent: new Map(),
    partialToolCalls: new Map(),
    bufferSize: 0,
    chunkCount: 0,
  };

  /**
   * Maximum stream buffer size (1MB) to prevent memory exhaustion
   */
  protected readonly MAX_STREAM_BUFFER_SIZE = 1024 * 1024;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Get provider identifier
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Get provider metadata
   */
  abstract getMetadata(): ProviderMetadata;

  /**
   * Parse a standard (non-streaming) response
   *
   * @param response - Raw response from provider API
   * @returns Parsed unified response
   */
  async parse(response: unknown): Promise<ParseResult> {
    try {
      // Reset state
      this.errors = [];
      this.warnings = [];

      // Validate response
      if (!this.validateResponse(response)) {
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Parse to unified format
      const unifiedResponse = await this.parseResponse(response);

      if (this.errors.length > 0) {
        return { success: false, response: unifiedResponse, errors: this.errors, warnings: this.warnings };
      }

      return { success: true, response: unifiedResponse, errors: [], warnings: this.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errors.push(`Parse error: ${message}`);
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Parse a streaming response chunk
   *
   * @param chunk - Raw chunk from provider streaming API
   * @returns Parsed stream response
   */
  async parseStream(chunk: unknown): Promise<StreamParseResult> {
    try {
      // Reset state
      this.errors = [];
      this.warnings = [];

      // Check memory usage and update metrics
      this.checkStreamBufferSize(chunk);

      // Validate chunk
      if (!this.validateStreamChunk(chunk)) {
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Parse to unified format
      const streamResponse = await this.parseStreamChunk(chunk);

      // Add streaming metrics to metadata if available
      if (streamResponse && streamResponse.metadata) {
        const metrics = this.getStreamMetrics();
        streamResponse.metadata.streamingMetrics = metrics;
      }

      if (this.errors.length > 0) {
        return { success: false, response: streamResponse, errors: this.errors, warnings: this.warnings };
      }

      return { success: true, response: streamResponse, errors: [], warnings: this.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errors.push(`Stream parse error: ${message}`);
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Validate provider response
   *
   * @param response - Raw response to validate
   * @returns True if valid
   */
  protected abstract validateResponse(response: unknown): boolean;

  /**
   * Validate streaming chunk
   *
   * @param chunk - Raw chunk to validate
   * @returns True if valid
   */
  protected abstract validateStreamChunk(chunk: unknown): boolean;

  /**
   * Parse provider response to unified format
   *
   * @param response - Raw response from provider
   * @returns Unified response
   */
  protected abstract parseResponse(response: unknown): Promise<UnifiedResponse>;

  /**
   * Parse streaming chunk to unified format
   *
   * @param chunk - Raw chunk from provider
   * @returns Unified stream response
   */
  protected abstract parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse>;

  /**
   * Extract messages from provider response
   *
   * @param response - Provider response
   * @returns Unified messages
   */
  protected abstract extractMessages(response: unknown): UnifiedMessage[];

  /**
   * Extract token usage from provider response
   *
   * @param response - Provider response
   * @returns Token usage
   */
  protected abstract extractUsage(response: unknown): TokenUsage;

  /**
   * Extract stop reason from provider response
   *
   * @param response - Provider response
   * @returns Stop reason
   */
  protected abstract extractStopReason(response: unknown): StopReason;

  /**
   * Extract model information from provider response
   *
   * @param response - Provider response
   * @returns Model info
   */
  protected abstract extractModelInfo(response: unknown): ModelInfo;

  /**
   * Extract error information from provider response
   *
   * @param response - Provider response
   * @returns Error info (if any)
   */
  protected abstract extractError(response: unknown): UnifiedError | undefined;

  /**
   * Helper: Create text content
   */
  protected createTextContent(text: string): Content {
    return {
      type: 'text' as const,
      text,
    };
  }

  /**
   * Helper: Create tool use content
   */
  protected createToolUseContent(id: string, name: string, input: Record<string, unknown>): Content {
    return {
      type: 'tool_use' as const,
      id,
      name,
      input,
    };
  }

  /**
   * Helper: Create function call content
   */
  protected createFunctionCallContent(name: string, args: string): Content {
    return {
      type: 'function_call' as const,
      name,
      arguments: args,
    };
  }

  /**
   * Helper: Create unified message
   */
  protected createMessage(role: MessageRole, content: Content[]): UnifiedMessage {
    return {
      role,
      content,
    };
  }

  /**
   * Helper: Create default token usage
   */
  protected createDefaultUsage(): TokenUsage {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
  }

  /**
   * Helper: Create model info
   */
  protected createModelInfo(id: string, provider: Provider): ModelInfo {
    return {
      id,
      provider,
    };
  }

  /**
   * Helper: Add error
   */
  protected addError(message: string): void {
    this.errors.push(message);
  }

  /**
   * Helper: Add warning
   */
  protected addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Helper: Check if object has property
   */
  protected hasProperty<T extends object>(obj: T, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * Helper: Safely get property
   */
  protected getProperty<T>(obj: unknown, key: string, defaultValue: T): T {
    if (obj && typeof obj === 'object' && key in obj) {
      return (obj as Record<string, unknown>)[key] as T;
    }
    return defaultValue;
  }

  // ==================== Stop Reason Normalization ====================

  /**
   * Known finish_reason values by provider
   * Used for validation and warnings
   */
  private readonly KNOWN_FINISH_REASONS: Record<string, string[]> = {
    openai: ['stop', 'length', 'tool_calls', 'function_call', 'content_filter'],
    anthropic: ['end_turn', 'max_tokens', 'stop_sequence', 'tool_use'],
    mistral: ['stop', 'length', 'model_length', 'tool_calls'],
    google: ['STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER'],
    cohere: ['COMPLETE', 'MAX_TOKENS', 'ERROR', 'ERROR_TOXIC'],
    xai: ['stop', 'length', 'tool_calls'],
    perplexity: ['stop', 'length'],
    together: ['stop', 'eos', 'length', 'tool_calls'],
    fireworks: ['stop', 'length', 'tool_calls'],
    bedrock: ['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'content_filtered'],
    ollama: ['true', 'false'], // done boolean
    huggingface: ['stop', 'length', 'eos_token'],
    replicate: ['succeeded', 'failed', 'canceled', 'aborted'],
  };

  /**
   * Normalize stop reason with metadata
   * Enterprise-grade normalization with provider-specific handling
   *
   * @param reason - Provider-specific finish_reason/stop_reason value
   * @returns Stop reason and metadata
   */
  protected normalizeStopReason(reason: string | undefined): StopReason {
    const result = this.normalizeStopReasonWithMetadata(reason);
    return result.stopReason;
  }

  /**
   * Normalize stop reason with full metadata
   * Provides original value, recognition status, and confidence level
   *
   * @param reason - Provider-specific finish_reason/stop_reason value
   * @returns Stop reason with metadata
   */
  protected normalizeStopReasonWithMetadata(
    reason: string | undefined
  ): {
    stopReason: StopReason;
    metadata: {
      originalValue: string | null;
      wasRecognized: boolean;
      mappingConfidence: 'high' | 'medium' | 'low';
    };
  } {
    const originalValue = reason || null;

    // Handle null/undefined
    if (!reason) {
      return {
        stopReason: StopReason.Unknown,
        metadata: { originalValue, wasRecognized: true, mappingConfidence: 'high' },
      };
    }

    // Try provider-specific exact matching first (high confidence)
    const exactMapping = this.getExactStopReasonMapping(reason);
    if (exactMapping) {
      return {
        stopReason: exactMapping,
        metadata: { originalValue, wasRecognized: true, mappingConfidence: 'high' },
      };
    }

    // Try keyword-based fuzzy matching (medium confidence)
    const fuzzyMapping = this.getFuzzyStopReasonMapping(reason);
    if (fuzzyMapping) {
      return {
        stopReason: fuzzyMapping,
        metadata: { originalValue, wasRecognized: true, mappingConfidence: 'medium' },
      };
    }

    // Unknown value - log warning for monitoring
    this.addWarning(
      `Unrecognized finish_reason value: "${reason}" for provider: ${this.provider}. ` +
        `Known values: ${this.KNOWN_FINISH_REASONS[this.provider]?.join(', ') || 'not defined'}`
    );

    return {
      stopReason: StopReason.Unknown,
      metadata: { originalValue, wasRecognized: false, mappingConfidence: 'low' },
    };
  }

  /**
   * Get exact stop reason mapping for provider-specific values
   * Handles exact matches with high confidence
   *
   * @param value - Provider finish_reason value
   * @returns Mapped StopReason or null if no exact match
   */
  private getExactStopReasonMapping(value: string): StopReason | null {
    const normalizedValue = value.toLowerCase().replace(/[_-]/g, '');
    const upperValue = value.toUpperCase();

    // Provider-agnostic exact matches
    const exactMatches: Record<string, StopReason> = {
      // Normal completion
      stop: StopReason.EndTurn,
      endturn: StopReason.EndTurn,
      complete: StopReason.EndTurn,
      eos: StopReason.EndTurn,
      eostoken: StopReason.EndTurn,
      succeeded: StopReason.EndTurn,

      // Token limits
      length: StopReason.MaxTokens,
      maxtokens: StopReason.MaxTokens,

      // Context length (different from output token limit)
      modellength: StopReason.ContextLength,
      contextlength: StopReason.ContextLength,

      // Stop sequences
      stopsequence: StopReason.StopSequence,

      // Tool use
      toolcalls: StopReason.ToolUse,
      tooluse: StopReason.ToolUse,
      functioncall: StopReason.ToolUse,

      // Content filtering
      contentfilter: StopReason.ContentFilter,
      contentfiltered: StopReason.ContentFilter,
      safety: StopReason.ContentFilter,
      errortoxic: StopReason.ContentFilter,

      // Recitation (plagiarism)
      recitation: StopReason.Recitation,

      // Errors
      error: StopReason.Error,
      failed: StopReason.Error,

      // Cancellation
      canceled: StopReason.Canceled,
      cancelled: StopReason.Canceled,
      aborted: StopReason.Canceled,
    };

    // Check normalized value
    if (exactMatches[normalizedValue]) {
      return exactMatches[normalizedValue];
    }

    // Check uppercase value (for providers like Cohere, Google)
    const upperMatches: Record<string, StopReason> = {
      STOP: StopReason.EndTurn,
      COMPLETE: StopReason.EndTurn,
      'MAX_TOKENS': StopReason.MaxTokens,
      SAFETY: StopReason.ContentFilter,
      RECITATION: StopReason.Recitation,
      ERROR: StopReason.Error,
      ERROR_TOXIC: StopReason.ContentFilter,
      OTHER: StopReason.Unknown,
    };

    if (upperMatches[upperValue]) {
      return upperMatches[upperValue];
    }

    return null;
  }

  /**
   * Get fuzzy stop reason mapping using keyword matching
   * Fallback for values not in exact mapping
   *
   * @param value - Provider finish_reason value
   * @returns Mapped StopReason or null if no match
   */
  private getFuzzyStopReasonMapping(value: string): StopReason | null {
    const normalized = value.toLowerCase().replace(/[_-]/g, '');

    // Keyword-based matching (order matters - more specific first)
    if (normalized.includes('stopsequence')) {
      return StopReason.StopSequence;
    }
    if (normalized.includes('endturn') || normalized.includes('stop')) {
      return StopReason.EndTurn;
    }
    if (normalized.includes('modellength') || normalized.includes('contextlength')) {
      return StopReason.ContextLength;
    }
    if (normalized.includes('maxtoken') || normalized.includes('length')) {
      return StopReason.MaxTokens;
    }
    if (normalized.includes('toolcall') || normalized.includes('tooluse') || normalized.includes('function')) {
      return StopReason.ToolUse;
    }
    if (normalized.includes('contentfilter') || normalized.includes('filter') || normalized.includes('safety')) {
      return StopReason.ContentFilter;
    }
    if (normalized.includes('recitation') || normalized.includes('plagiarism')) {
      return StopReason.Recitation;
    }
    if (normalized.includes('error') || normalized.includes('failed')) {
      return StopReason.Error;
    }
    if (normalized.includes('cancel') || normalized.includes('abort')) {
      return StopReason.Canceled;
    }

    return null;
  }

  /**
   * Validate finish_reason value against known values
   * Helps track API changes and unexpected values
   *
   * @param value - Provider finish_reason value
   */
  protected validateFinishReason(value: string | null | undefined): void {
    if (!value) return;

    const knownValues = this.KNOWN_FINISH_REASONS[this.provider];
    if (knownValues && !knownValues.includes(value)) {
      this.addWarning(
        `Unexpected finish_reason "${value}" for provider ${this.provider}. ` +
          `Known values: ${knownValues.join(', ')}. ` +
          `This may indicate an API change or new feature.`
      );
    }
  }

  /**
   * Helper: Normalize message role
   */
  protected normalizeRole(role: string): MessageRole {
    const normalized = role.toLowerCase();

    switch (normalized) {
      case 'system':
        return MessageRole.System;
      case 'user':
        return MessageRole.User;
      case 'assistant':
      case 'model':
        return MessageRole.Assistant;
      case 'tool':
        return MessageRole.Tool;
      case 'function':
        return MessageRole.Function;
      default:
        this.addWarning(`Unknown role: ${role}, defaulting to user`);
        return MessageRole.User;
    }
  }

  /**
   * Helper: Generate unique ID
   */
  protected generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Get current ISO timestamp
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // ==================== Stream State Management ====================

  /**
   * Reset stream state
   * Call this when starting a new stream or when stream completes
   */
  protected resetStreamState(): void {
    this.streamState.partialContent.clear();
    this.streamState.partialToolCalls.clear();
    this.streamState.lastChunkId = undefined;
    this.streamState.bufferSize = 0;
    this.streamState.startTime = undefined;
    this.streamState.chunkCount = 0;
  }

  /**
   * Initialize stream metrics
   * Call this when starting a new stream
   */
  protected initStreamMetrics(): void {
    this.streamState.startTime = Date.now();
    this.streamState.chunkCount = 0;
    this.streamState.bufferSize = 0;
  }

  /**
   * Accumulate partial content for a content block
   * Handles content split across multiple chunks
   *
   * @param index - Content block index
   * @param delta - Content delta to accumulate
   * @returns Accumulated content so far
   */
  protected accumulateContent(index: number, delta: string): string {
    const existing = this.streamState.partialContent.get(index) || '';
    const updated = existing + delta;
    this.streamState.partialContent.set(index, updated);
    return updated;
  }

  /**
   * Get accumulated content for a content block
   *
   * @param index - Content block index
   * @returns Accumulated content or empty string
   */
  protected getAccumulatedContent(index: number): string {
    return this.streamState.partialContent.get(index) || '';
  }

  /**
   * Clear accumulated content for a content block
   * Call this when content block is complete
   *
   * @param index - Content block index
   */
  protected clearAccumulatedContent(index: number): void {
    this.streamState.partialContent.delete(index);
  }

  /**
   * Accumulate partial tool call data
   * Handles tool calls split across multiple chunks
   *
   * @param index - Tool call index
   * @param delta - Partial tool call data
   * @returns Current accumulated tool call
   */
  protected accumulateToolCall(index: number, delta: Partial<PartialToolCall>): PartialToolCall {
    const existing = this.streamState.partialToolCalls.get(index) || { arguments: '' };

    const updated: PartialToolCall = {
      id: delta.id || existing.id,
      name: delta.name || existing.name,
      arguments: existing.arguments + (delta.arguments || ''),
    };

    this.streamState.partialToolCalls.set(index, updated);
    return updated;
  }

  /**
   * Get accumulated tool call
   *
   * @param index - Tool call index
   * @returns Accumulated tool call or undefined
   */
  protected getAccumulatedToolCall(index: number): PartialToolCall | undefined {
    return this.streamState.partialToolCalls.get(index);
  }

  /**
   * Clear accumulated tool call
   * Call this when tool call is complete
   *
   * @param index - Tool call index
   */
  protected clearAccumulatedToolCall(index: number): void {
    this.streamState.partialToolCalls.delete(index);
  }

  /**
   * Check if tool call is complete and ready to parse
   *
   * @param toolCall - Partial tool call
   * @returns True if tool call has all required fields
   */
  protected isToolCallComplete(toolCall: PartialToolCall): boolean {
    return !!(toolCall.id && toolCall.name && toolCall.arguments);
  }

  // ==================== Safe JSON Parsing ====================

  /**
   * Safely parse JSON with error handling and fallback
   * Enterprise-grade JSON parsing that never throws
   *
   * @param json - JSON string to parse
   * @param fallback - Fallback value if parsing fails
   * @param context - Context string for error messages (e.g., "tool call arguments")
   * @returns Parsed object or fallback value
   *
   * @example
   * ```typescript
   * const args = this.safeJsonParse(toolCall.arguments, {}, 'tool arguments');
   * ```
   */
  protected safeJsonParse<T = any>(json: string, fallback: T, context: string): T {
    if (!json || json.trim() === '') {
      return fallback;
    }

    try {
      return JSON.parse(json) as T;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addWarning(
        `Failed to parse JSON in ${context}: ${errorMsg}. ` +
        `Input: ${json.substring(0, 100)}${json.length > 100 ? '...' : ''}`
      );
      return fallback;
    }
  }

  /**
   * Attempt to parse potentially incomplete JSON
   * Returns partial parse result or undefined if not parseable
   *
   * @param json - Potentially incomplete JSON string
   * @returns Parsed object or undefined
   */
  protected tryParseIncompleteJson<T = any>(json: string): T | undefined {
    if (!json || json.trim() === '') {
      return undefined;
    }

    try {
      return JSON.parse(json) as T;
    } catch {
      // Try to fix common issues
      const trimmed = json.trim();

      // If it starts with { but doesn't end with }, try adding }
      if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
        try {
          return JSON.parse(trimmed + '}') as T;
        } catch {
          // Keep trying
        }
      }

      // If it starts with [ but doesn't end with ], try adding ]
      if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed + ']') as T;
        } catch {
          // Keep trying
        }
      }

      return undefined;
    }
  }

  // ==================== Memory Management ====================

  /**
   * Check and update stream buffer size
   * Prevents memory exhaustion in long-running streams
   *
   * @param chunk - Current chunk being processed
   */
  protected checkStreamBufferSize(chunk: unknown): void {
    try {
      const chunkSize = JSON.stringify(chunk).length;
      this.streamState.bufferSize += chunkSize;
      this.streamState.chunkCount++;

      if (this.streamState.bufferSize > this.MAX_STREAM_BUFFER_SIZE) {
        this.addWarning(
          `Stream buffer exceeded ${this.MAX_STREAM_BUFFER_SIZE} bytes ` +
          `(current: ${this.streamState.bufferSize}). ` +
          `Resetting stream state to prevent memory exhaustion.`
        );
        this.resetStreamState();
      }
    } catch (error) {
      // If we can't stringify the chunk, just log a warning
      this.addWarning(`Unable to measure chunk size: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get stream buffer usage percentage
   *
   * @returns Buffer usage as percentage (0-100)
   */
  protected getStreamBufferUsage(): number {
    return Math.round((this.streamState.bufferSize / this.MAX_STREAM_BUFFER_SIZE) * 100);
  }

  // ==================== Streaming Metrics ====================

  /**
   * Get streaming performance metrics
   * Provides observability into stream processing
   *
   * @returns Metrics object with performance data
   */
  protected getStreamMetrics(): {
    duration?: number;
    chunksProcessed: number;
    averageChunkSize?: number;
    bufferUsagePercent: number;
  } {
    const metrics = {
      chunksProcessed: this.streamState.chunkCount,
      bufferUsagePercent: this.getStreamBufferUsage(),
      duration: undefined as number | undefined,
      averageChunkSize: undefined as number | undefined,
    };

    if (this.streamState.startTime) {
      metrics.duration = Date.now() - this.streamState.startTime;
    }

    if (this.streamState.chunkCount > 0) {
      metrics.averageChunkSize = Math.round(this.streamState.bufferSize / this.streamState.chunkCount);
    }

    return metrics;
  }

  /**
   * Check if error is retryable
   * Helps consumers implement retry logic
   *
   * @param error - Unified error
   * @returns True if error is transient and retryable
   */
  protected isRetryableError(error: UnifiedError): boolean {
    const retryableTypes = ['rate_limit_error', 'timeout_error', 'connection_error'];
    const retryableCodes = ['model_loading', 'service_unavailable', 'timeout'];

    return (
      retryableTypes.includes(error.type) ||
      retryableCodes.includes(error.code) ||
      (error.statusCode !== undefined && error.statusCode >= 500 && error.statusCode < 600)
    );
  }

  /**
   * Get suggested retry delay for an error
   * Returns delay in milliseconds
   *
   * @param error - Unified error
   * @returns Retry delay in milliseconds, or undefined if not retryable
   */
  protected getRetryDelay(error: UnifiedError): number | undefined {
    if (!this.isRetryableError(error)) {
      return undefined;
    }

    // Check for Retry-After header in error details
    if (error.details?.retryAfter && typeof error.details.retryAfter === 'number') {
      return error.details.retryAfter * 1000;
    }

    // Default delays by error type
    if (error.type === 'rate_limit_error') {
      return 60000; // 1 minute
    }
    if (error.code === 'model_loading') {
      return 5000; // 5 seconds
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 10000; // 10 seconds for server errors
    }

    return 1000; // Default 1 second
  }
}
