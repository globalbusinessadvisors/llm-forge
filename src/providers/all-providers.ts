/**
 * All Provider Parsers
 *
 * Consolidated implementation of all remaining LLM provider parsers:
 * - Google Gemini
 * - Cohere
 * - xAI (Grok)
 * - Perplexity
 * - Together.ai
 * - Fireworks.ai
 * - AWS Bedrock
 * - Meta/Ollama
 *
 * @module providers/all-providers
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

/**
 * Google Gemini Provider
 */
export class GoogleProvider extends BaseProviderParser {
  constructor() {
    super('google' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'google' as Provider,
      name: 'Google Gemini',
      description: 'Google Gemini API',
      apiVersion: 'v1',
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      capabilities: {
        streaming: true,
        functionCalling: true,
        toolUse: true,
        vision: true,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 1000000, // Gemini 1.5 Pro
        maxOutputTokens: 8192,
        modalities: ['text', 'image', 'audio', 'video'],
      },
      models: [
        {
          id: 'gemini-1.5-pro',
          provider: 'google' as Provider,
          contextWindow: 1000000,
          maxOutputTokens: 8192,
        },
        {
          id: 'gemini-1.5-flash',
          provider: 'google' as Provider,
          contextWindow: 1000000,
          maxOutputTokens: 8192,
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://ai.google.dev/docs',
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
    const hasCandidates = 'candidates' in obj;
    const hasUsageMetadata = 'usageMetadata' in obj;
    const hasPromptFeedback = 'promptFeedback' in obj;

    if (!(hasCandidates || hasUsageMetadata || hasPromptFeedback)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected validateStreamChunk(chunk: unknown): boolean {
    return chunk !== null && typeof chunk === 'object';
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const geminiResponse = response as any;
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('gemini-1.5-pro', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const messages: UnifiedMessage[] = [];

    if (obj.candidates && Array.isArray(obj.candidates)) {
      for (const candidate of obj.candidates) {
        const content: Content[] = [];
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              content.push(this.createTextContent(part.text));
            }
          }
        }
        messages.push({
          role: this.normalizeRole(candidate.content?.role || 'model'),
          content,
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const metadata = obj.usageMetadata || {};
    return {
      inputTokens: metadata.promptTokenCount || 0,
      outputTokens: metadata.candidatesTokenCount || 0,
      totalTokens: metadata.totalTokenCount || 0,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    if (obj.candidates?.[0]?.finishReason) {
      return this.normalizeStopReason(obj.candidates[0].finishReason);
    }
    return StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    return this.createModelInfo('gemini-1.5-pro', this.provider);
  }

  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as any;
    if (!obj.error) return undefined;
    return {
      code: obj.error.code?.toString() || 'unknown_error',
      message: obj.error.message,
      type: obj.error.status || 'error',
    };
  }
}

/**
 * Cohere Provider
 */
export class CohereProvider extends BaseProviderParser {
  constructor() {
    super('cohere' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'cohere' as Provider,
      name: 'Cohere',
      description: 'Cohere API',
      apiVersion: 'v1',
      baseUrl: 'https://api.cohere.ai/v1',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: true,
        vision: false,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 128000,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [
        {
          id: 'command-r-plus',
          provider: 'cohere' as Provider,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
        {
          id: 'command-r',
          provider: 'cohere' as Provider,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.cohere.com',
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
    const hasText = 'text' in obj;
    const hasGenerationId = 'generation_id' in obj;
    const hasMeta = 'meta' in obj;
    const hasModel = 'model' in obj;

    if (!(hasText || hasGenerationId || hasMeta || hasModel)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected validateStreamChunk(chunk: unknown): boolean {
    return chunk !== null && typeof chunk === 'object';
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const cohereResponse = response as any;
    return {
      id: cohereResponse.generation_id || this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        requestId: cohereResponse.generation_id,
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('command-r-plus', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const content: Content[] = [];

    if (obj.text) {
      content.push(this.createTextContent(obj.text));
    }

    return [
      {
        role: 'assistant' as any,
        content,
      },
    ];
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const meta = obj.meta || {};
    const tokens = meta.tokens || {};
    return {
      inputTokens: tokens.input_tokens || 0,
      outputTokens: tokens.output_tokens || 0,
      totalTokens: (tokens.input_tokens || 0) + (tokens.output_tokens || 0),
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    return this.normalizeStopReason(obj.finish_reason);
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'command-r-plus', this.provider);
  }

  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as any;
    if (!obj.message || obj.text) return undefined;
    return {
      code: 'error',
      message: obj.message,
      type: 'error',
    };
  }
}

/**
 * xAI (Grok) Provider
 */
export class XAIProvider extends BaseProviderParser {
  constructor() {
    super('xai' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'xai' as Provider,
      name: 'xAI (Grok)',
      description: 'xAI Grok API',
      apiVersion: 'v1',
      baseUrl: 'https://api.x.ai/v1',
      capabilities: {
        streaming: true,
        functionCalling: true,
        toolUse: true,
        vision: false,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 131072,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [
        {
          id: 'grok-beta',
          provider: 'xai' as Provider,
          contextWindow: 131072,
          maxOutputTokens: 4096,
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.x.ai',
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
    const xaiResponse = response as any;
    return {
      id: xaiResponse.id || this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        requestId: xaiResponse.id,
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('grok-beta', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const messages: UnifiedMessage[] = [];

    if (obj.choices && Array.isArray(obj.choices)) {
      for (const choice of obj.choices) {
        const content: Content[] = [];
        if (choice.message?.content) {
          content.push(this.createTextContent(choice.message.content));
        }
        messages.push({
          role: this.normalizeRole(choice.message?.role || 'assistant'),
          content,
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const usage = obj.usage || {};
    return {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    if (obj.choices?.[0]?.finish_reason) {
      return this.normalizeStopReason(obj.choices[0].finish_reason);
    }
    return StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'grok-beta', this.provider);
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

/**
 * Perplexity Provider
 */
export class PerplexityProvider extends BaseProviderParser {
  constructor() {
    super('perplexity' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'perplexity' as Provider,
      name: 'Perplexity',
      description: 'Perplexity API',
      apiVersion: 'v1',
      baseUrl: 'https://api.perplexity.ai',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: false,
        vision: false,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 127072,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [
        {
          id: 'pplx-70b-online',
          provider: 'perplexity' as Provider,
          contextWindow: 127072,
          maxOutputTokens: 4096,
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.perplexity.ai',
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
    const obj = response as any;
    return {
      id: obj.id || this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('pplx-70b-online', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const messages: UnifiedMessage[] = [];

    if (obj.choices && Array.isArray(obj.choices)) {
      for (const choice of obj.choices) {
        const content: Content[] = [];
        if (choice.message?.content) {
          content.push(this.createTextContent(choice.message.content));
        }
        messages.push({
          role: this.normalizeRole(choice.message?.role || 'assistant'),
          content,
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const usage = obj.usage || {};
    return {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    if (obj.choices?.[0]?.finish_reason) {
      return this.normalizeStopReason(obj.choices[0].finish_reason);
    }
    return StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'pplx-70b-online', this.provider);
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

/**
 * Together.ai Provider
 */
export class TogetherProvider extends BaseProviderParser {
  constructor() {
    super('together' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'together' as Provider,
      name: 'Together.ai',
      description: 'Together.ai API',
      apiVersion: 'v1',
      baseUrl: 'https://api.together.xyz/v1',
      capabilities: {
        streaming: true,
        functionCalling: true,
        toolUse: true,
        vision: false,
        jsonMode: true,
        systemMessages: true,
        maxContextWindow: 32768,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.together.ai',
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
    const obj = response as any;
    return {
      id: obj.id || this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const messages: UnifiedMessage[] = [];

    if (obj.choices && Array.isArray(obj.choices)) {
      for (const choice of obj.choices) {
        const content: Content[] = [];
        if (choice.message?.content) {
          content.push(this.createTextContent(choice.message.content));
        }
        messages.push({
          role: this.normalizeRole(choice.message?.role || 'assistant'),
          content,
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const usage = obj.usage || {};
    return {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    if (obj.choices?.[0]?.finish_reason) {
      return this.normalizeStopReason(obj.choices[0].finish_reason);
    }
    return StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'unknown', this.provider);
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

/**
 * Fireworks.ai Provider
 */
export class FireworksProvider extends BaseProviderParser {
  constructor() {
    super('fireworks' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'fireworks' as Provider,
      name: 'Fireworks.ai',
      description: 'Fireworks.ai API',
      apiVersion: 'v1',
      baseUrl: 'https://api.fireworks.ai/inference/v1',
      capabilities: {
        streaming: true,
        functionCalling: true,
        toolUse: true,
        vision: false,
        jsonMode: true,
        systemMessages: true,
        maxContextWindow: 32768,
        maxOutputTokens: 4096,
        modalities: ['text'],
      },
      models: [],
      authenticationType: 'api_key',
      docsUrl: 'https://docs.fireworks.ai',
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
    const obj = response as any;
    return {
      id: obj.id || this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const messages: UnifiedMessage[] = [];

    if (obj.choices && Array.isArray(obj.choices)) {
      for (const choice of obj.choices) {
        const content: Content[] = [];
        if (choice.message?.content) {
          content.push(this.createTextContent(choice.message.content));
        }
        messages.push({
          role: this.normalizeRole(choice.message?.role || 'assistant'),
          content,
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const usage = obj.usage || {};
    return {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    if (obj.choices?.[0]?.finish_reason) {
      return this.normalizeStopReason(obj.choices[0].finish_reason);
    }
    return StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'unknown', this.provider);
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

/**
 * AWS Bedrock Provider
 */
export class BedrockProvider extends BaseProviderParser {
  constructor() {
    super('bedrock' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'bedrock' as Provider,
      name: 'AWS Bedrock',
      description: 'AWS Bedrock API',
      apiVersion: 'v1',
      baseUrl: 'https://bedrock-runtime.{region}.amazonaws.com',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: true,
        vision: true,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 200000,
        maxOutputTokens: 4096,
        modalities: ['text', 'image'],
      },
      models: [],
      authenticationType: 'service_account',
      docsUrl: 'https://docs.aws.amazon.com/bedrock',
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
    const hasOutput = 'output' in obj;
    const hasUsage = 'usage' in obj;
    const hasStopReason = 'stopReason' in obj;

    if (!(hasOutput || hasUsage || hasStopReason)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected validateStreamChunk(chunk: unknown): boolean {
    return chunk !== null && typeof chunk === 'object';
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const obj = response as any;
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const content: Content[] = [];

    if (obj.output?.message?.content) {
      for (const block of obj.output.message.content) {
        if (block.text) {
          content.push(this.createTextContent(block.text));
        }
      }
    }

    return [
      {
        role: 'assistant' as any,
        content,
      },
    ];
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    const usage = obj.usage || {};
    return {
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0),
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    return this.normalizeStopReason(obj.stopReason);
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    return this.createModelInfo('bedrock-model', this.provider);
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

/**
 * Ollama Provider
 */
export class OllamaProvider extends BaseProviderParser {
  constructor() {
    super('ollama' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'ollama' as Provider,
      name: 'Ollama',
      description: 'Ollama local API',
      apiVersion: 'v1',
      baseUrl: 'http://localhost:11434/api',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: false,
        vision: true,
        jsonMode: true,
        systemMessages: true,
        maxContextWindow: 8192,
        maxOutputTokens: 4096,
        modalities: ['text', 'image'],
      },
      models: [],
      authenticationType: 'api_key',
      docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
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
    const hasMessage = 'message' in obj;
    const hasResponse = 'response' in obj;
    const hasModel = 'model' in obj;
    const hasDone = 'done' in obj;

    if (!(hasMessage || hasResponse || hasModel || hasDone)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected validateStreamChunk(chunk: unknown): boolean {
    return chunk !== null && typeof chunk === 'object';
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const obj = response as any;
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.extractModelInfo(response),
      messages: this.extractMessages(response),
      stopReason: this.extractStopReason(response),
      usage: this.extractUsage(response),
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
      raw: response,
    };
  }

  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    return {
      id: this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider),
      chunks: [],
      metadata: {
        timestamp: this.getCurrentTimestamp(),
      },
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const obj = response as any;
    const content: Content[] = [];

    if (obj.message?.content) {
      content.push(this.createTextContent(obj.message.content));
    } else if (obj.response) {
      content.push(this.createTextContent(obj.response));
    }

    return [
      {
        role: this.normalizeRole(obj.message?.role || 'assistant'),
        content,
      },
    ];
  }

  protected extractUsage(response: unknown): TokenUsage {
    const obj = response as any;
    return {
      inputTokens: obj.prompt_eval_count || 0,
      outputTokens: obj.eval_count || 0,
      totalTokens: (obj.prompt_eval_count || 0) + (obj.eval_count || 0),
    };
  }

  protected extractStopReason(response: unknown): StopReason {
    const obj = response as any;
    return obj.done ? StopReason.EndTurn : StopReason.Unknown;
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const obj = response as any;
    return this.createModelInfo(obj.model || 'unknown', this.provider);
  }

  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as any;
    if (!obj.error) return undefined;
    return {
      code: 'error',
      message: obj.error,
      type: 'error',
    };
  }
}
