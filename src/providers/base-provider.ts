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
export abstract class BaseProviderParser {
  protected provider: Provider;
  protected errors: string[] = [];
  protected warnings: string[] = [];

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

      // Validate chunk
      if (!this.validateStreamChunk(chunk)) {
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Parse to unified format
      const streamResponse = await this.parseStreamChunk(chunk);

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

  /**
   * Helper: Normalize stop reason
   */
  protected normalizeStopReason(reason: string | undefined): StopReason {
    if (!reason) return StopReason.Unknown;

    const normalized = reason.toLowerCase().replace(/[_-]/g, '');

    if (normalized.includes('endturn') || normalized.includes('stop')) {
      return StopReason.EndTurn;
    }
    if (normalized.includes('length') || normalized.includes('maxtoken')) {
      return StopReason.MaxTokens;
    }
    if (normalized.includes('stopsequence')) {
      return StopReason.StopSequence;
    }
    if (normalized.includes('tool') || normalized.includes('function')) {
      return StopReason.ToolUse;
    }
    if (normalized.includes('filter') || normalized.includes('safety')) {
      return StopReason.ContentFilter;
    }

    return StopReason.Unknown;
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
}
