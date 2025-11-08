/**
 * Replicate Provider
 *
 * Parser for Replicate API responses.
 * Supports prediction-based execution model with streaming via SSE.
 * Handles image generation, language models, and other model types.
 *
 * @module providers/replicate-provider
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
 * Replicate prediction status values
 */
type ReplicateStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'aborted';

/**
 * Replicate prediction response
 */
interface ReplicatePrediction {
  id: string;
  model?: string;
  version: string;
  input?: Record<string, unknown>;
  output?: string | string[] | Record<string, unknown> | null;
  error?: string | null;
  logs?: string | null;
  status: ReplicateStatus;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  data_removed?: boolean;
  metrics?: {
    predict_time?: number;
    total_time?: number;
  };
  urls?: {
    web?: string;
    get?: string;
    cancel?: string;
    stream?: string;
  };
}

/**
 * Replicate SSE streaming event
 */
interface ReplicateStreamEvent {
  event: 'output' | 'logs' | 'error' | 'done';
  id?: string;
  data: string;
}

/**
 * Replicate error response
 */
interface ReplicateError {
  detail: string;
}

/**
 * Replicate Provider Parser
 */
export class ReplicateProvider extends BaseProviderParser {
  constructor() {
    super('replicate' as Provider);
  }

  /**
   * Get provider metadata
   */
  getMetadata(): ProviderMetadata {
    return {
      id: 'replicate' as Provider,
      name: 'Replicate',
      description: 'Replicate API for running ML models in the cloud',
      apiVersion: 'v1',
      baseUrl: 'https://api.replicate.com/v1',
      capabilities: {
        // Full streaming support via SSE
        streaming: true,
        functionCalling: false,
        toolUse: false,
        // Vision models available (e.g., FLUX, Stable Diffusion)
        vision: true,
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 128000, // Varies by model (e.g., Llama 3.1 405B)
        maxOutputTokens: 4096, // Varies by model
        modalities: ['text', 'image', 'audio', 'video'],
      },
      models: [
        {
          id: 'meta/meta-llama-3.1-405b-instruct',
          provider: 'replicate' as Provider,
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: ['text'],
        },
        {
          id: 'black-forest-labs/flux-pro',
          provider: 'replicate' as Provider,
          capabilities: ['image'],
        },
        {
          id: 'black-forest-labs/flux-schnell',
          provider: 'replicate' as Provider,
          capabilities: ['image'],
        },
      ],
      authenticationType: 'api_key',
      docsUrl: 'https://replicate.com/docs/reference/http',
    };
  }

  /**
   * Validate Replicate prediction response
   *
   * Validates prediction object structure including:
   * - Required fields (id, version, status)
   * - Valid status values
   * - Error handling
   *
   * @param response - Raw response from Replicate API
   * @returns True if valid
   */
  protected validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      this.addError('Invalid response: must be an object');
      return false;
    }

    const obj = response as Record<string, unknown>;

    // Check for API error response (has 'detail' field)
    if ('detail' in obj) {
      // Error responses are valid
      return true;
    }

    // Validate prediction response structure
    if (!obj.id || typeof obj.id !== 'string') {
      this.addError('Invalid response: missing or invalid id field');
      return false;
    }

    if (!obj.version || typeof obj.version !== 'string') {
      this.addError('Invalid response: missing or invalid version field');
      return false;
    }

    if (!obj.status || typeof obj.status !== 'string') {
      this.addError('Invalid response: missing or invalid status field');
      return false;
    }

    // Validate status value
    const validStatuses: ReplicateStatus[] = ['starting', 'processing', 'succeeded', 'failed', 'canceled', 'aborted'];
    if (!validStatuses.includes(obj.status as ReplicateStatus)) {
      this.addError(`Invalid status value: ${obj.status}. Must be one of: ${validStatuses.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Validate Replicate streaming event
   *
   * Validates SSE event structure for Replicate streaming:
   * - Event type must be output, logs, error, or done
   * - Data field must be present
   *
   * @param chunk - Raw SSE event from Replicate streaming API
   * @returns True if valid
   */
  protected validateStreamChunk(chunk: unknown): boolean {
    if (!chunk || typeof chunk !== 'object') {
      this.addError('Invalid streaming chunk: must be an object');
      return false;
    }

    const obj = chunk as Record<string, unknown>;

    // Validate event type
    if (!obj.event || typeof obj.event !== 'string') {
      this.addError('Invalid streaming chunk: missing or invalid event field');
      return false;
    }

    const validEvents = ['output', 'logs', 'error', 'done'];
    if (!validEvents.includes(obj.event)) {
      this.addError(`Invalid event type: ${obj.event}. Must be one of: ${validEvents.join(', ')}`);
      return false;
    }

    // Validate data field
    if (!('data' in obj)) {
      this.addError('Invalid streaming chunk: missing data field');
      return false;
    }

    return true;
  }

  /**
   * Parse Replicate prediction response to unified format
   *
   * Converts Replicate prediction object to UnifiedResponse:
   * - Handles all status states
   * - Extracts output (string, array, or object)
   * - Processes errors
   * - Includes metrics and timestamps
   *
   * Enterprise features:
   * - Comprehensive error handling
   * - Handles multiple output types
   * - Preserves all metadata
   * - Proper timestamp conversion
   *
   * @param response - Validated Replicate prediction response
   * @returns Unified response
   */
  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const obj = response as Record<string, unknown>;

    // Handle API error responses
    if ('detail' in obj) {
      const errorResp = obj as ReplicateError;
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
        error: {
          code: 'replicate_api_error',
          message: errorResp.detail,
          type: 'api_error',
        },
      };
    }

    // Parse prediction response
    const prediction = response as ReplicatePrediction;

    // Extract error if present
    const error = this.extractError(response);

    // Extract messages from output
    const messages = this.extractMessages(response);

    // Determine stop reason from status
    const stopReason = this.extractStopReason(response);

    // Extract model info
    const modelInfo = this.extractModelInfo(response);

    // Extract usage/metrics
    const usage = this.extractUsage(response);

    return {
      id: prediction.id,
      provider: this.provider,
      model: modelInfo,
      messages,
      stopReason,
      usage,
      metadata: {
        timestamp: prediction.created_at,
        requestId: prediction.id,
        status: prediction.status,
        startedAt: prediction.started_at || undefined,
        completedAt: prediction.completed_at || undefined,
        metrics: prediction.metrics,
        urls: prediction.urls,
        logs: prediction.logs || undefined,
      },
      error,
      raw: response,
    };
  }

  /**
   * Parse Replicate streaming event to unified format
   *
   * Converts Replicate SSE events to UnifiedStreamResponse:
   * - Handles output events (content chunks)
   * - Handles logs events
   * - Handles error events
   * - Handles done events (completion signal)
   *
   * Enterprise features:
   * - Comprehensive error handling
   * - Proper event type routing
   * - JSON parsing for error and done events
   * - Preserves event IDs
   *
   * @param chunk - Validated SSE event from Replicate
   * @returns Unified stream response
   */
  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    const event = chunk as ReplicateStreamEvent;
    const chunks: StreamChunk[] = [];
    let error: UnifiedError | undefined;
    let stopReason: StopReason | undefined;

    switch (event.event) {
      case 'output':
        // Content chunk from model output
        if (event.data && event.data.trim()) {
          chunks.push({
            type: 'content_block_delta',
            delta: {
              type: 'text' as const,
              text: event.data,
            },
            index: 0,
          });
        }
        break;

      case 'logs':
        // Log messages (can be included in metadata but not as content)
        // For now, we'll treat these as metadata-only events
        break;

      case 'error':
        // Error event with safe JSON parsing
        const errorData = this.safeJsonParse<{
          detail?: string;
          message?: string;
          status?: string;
        }>(
          event.data,
          {},
          'Replicate error event'
        );

        error = {
          code: 'replicate_streaming_error',
          message:
            errorData.detail ||
            errorData.message ||
            (event.data.length > 200 ? event.data.substring(0, 200) + '...' : event.data),
          type: 'streaming_error',
          details: {
            rawData: event.data,
            eventId: event.id,
          },
        };
        stopReason = StopReason.Unknown;
        break;

      case 'done':
        // Stream completion with safe JSON parsing
        const doneData = this.safeJsonParse<{
          reason?: string;
          status?: string;
        }>(
          event.data,
          { reason: 'completed' },
          'Replicate done event'
        );

        // Map completion reason to stop reason
        if (doneData.reason === 'error') {
          stopReason = StopReason.Unknown;
        } else if (doneData.reason === 'canceled' || doneData.reason === 'cancelled') {
          stopReason = StopReason.Unknown;
        } else {
          stopReason = StopReason.EndTurn;
        }

        chunks.push({
          type: 'message_stop',
          delta: {
            stopReason,
          },
          index: 0,
        });
        break;
    }

    return {
      id: event.id || this.generateId(),
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider),
      chunks,
      stopReason,
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        eventId: event.id,
        eventType: event.event,
      },
      error,
    };
  }

  /**
   * Extract messages from Replicate output
   *
   * Handles multiple output types:
   * - String output: Direct text content
   * - Array output: Multiple items (images, etc.)
   * - Object output: Structured data
   * - Null output: Pending/in-progress prediction
   *
   * @param response - Replicate prediction response
   * @returns Unified messages
   */
  protected extractMessages(response: unknown): UnifiedMessage[] {
    const prediction = response as ReplicatePrediction;
    const messages: UnifiedMessage[] = [];

    // Only extract messages if prediction succeeded
    if (prediction.status !== 'succeeded' || !prediction.output) {
      return messages;
    }

    const output = prediction.output;
    const content: Content[] = [];

    // Handle different output types
    if (typeof output === 'string') {
      // String output - direct text content
      content.push(this.createTextContent(output));
    } else if (Array.isArray(output)) {
      // Array output - typically URLs to generated files
      // Convert to text list for now
      const outputText = output
        .map((item, idx) => {
          if (typeof item === 'string') {
            // Check if it's a URL (common for image/file outputs)
            if (item.startsWith('http://') || item.startsWith('https://')) {
              return `[Output ${idx + 1}]: ${item}`;
            }
            return item;
          }
          return JSON.stringify(item);
        })
        .join('\n');

      if (outputText) {
        content.push(this.createTextContent(outputText));
      }
    } else if (typeof output === 'object') {
      // Object output - structured data
      // Convert to formatted JSON string
      content.push(this.createTextContent(JSON.stringify(output, null, 2)));
    }

    if (content.length > 0) {
      messages.push({
        role: MessageRole.Assistant,
        content,
      });
    }

    return messages;
  }

  /**
   * Extract usage/metrics from Replicate response
   *
   * Replicate provides execution metrics instead of token counts.
   * We approximate token usage based on text length and execution time.
   *
   * @param response - Replicate prediction response
   * @returns Token usage (approximated)
   */
  protected extractUsage(response: unknown): TokenUsage {
    const prediction = response as ReplicatePrediction;

    // Replicate doesn't provide token counts, only execution metrics
    // We'll return default usage, with metrics in metadata if available
    const usage: TokenUsage = this.createDefaultUsage();

    if (prediction.metrics) {
      usage.metadata = {
        predictTime: prediction.metrics.predict_time,
        totalTime: prediction.metrics.total_time,
      };
    }

    return usage;
  }

  /**
   * Extract stop reason from Replicate status
   *
   * Maps Replicate status to unified stop reasons:
   * - succeeded -> EndTurn
   * - failed -> Unknown (with error)
   * - canceled -> Unknown
   * - aborted -> Unknown
   * - processing/starting -> Unknown (still running)
   *
   * @param response - Replicate prediction response
   * @returns Stop reason
   */
  protected extractStopReason(response: unknown): StopReason {
    const prediction = response as ReplicatePrediction;

    switch (prediction.status) {
      case 'succeeded':
        return StopReason.EndTurn;
      case 'failed':
        return StopReason.Unknown;
      case 'canceled':
        return StopReason.Unknown;
      case 'aborted':
        return StopReason.Unknown;
      case 'processing':
      case 'starting':
        return StopReason.Unknown;
      default:
        return StopReason.Unknown;
    }
  }

  /**
   * Extract model information from Replicate response
   *
   * Uses model field if available, otherwise uses version hash.
   * Model format: owner/model-name or version hash
   *
   * @param response - Replicate prediction response
   * @returns Model info
   */
  protected extractModelInfo(response: unknown): ModelInfo {
    const prediction = response as ReplicatePrediction;

    // Prefer model field, fall back to version
    const modelId = prediction.model || prediction.version || 'unknown';

    return this.createModelInfo(modelId, this.provider);
  }

  /**
   * Extract error information from Replicate response
   *
   * Handles both:
   * - API errors (detail field)
   * - Prediction errors (error field when status is 'failed')
   *
   * @param response - Replicate prediction or error response
   * @returns Error info (if any)
   */
  protected extractError(response: unknown): UnifiedError | undefined {
    const obj = response as Record<string, unknown>;

    // Check for API error (detail field)
    if ('detail' in obj && typeof obj.detail === 'string') {
      return {
        code: 'replicate_api_error',
        message: obj.detail,
        type: 'api_error',
      };
    }

    // Check for prediction error
    const prediction = response as ReplicatePrediction;
    if (prediction.error) {
      return {
        code: 'replicate_prediction_error',
        message: prediction.error,
        type: 'prediction_error',
        details: {
          status: prediction.status,
          logs: prediction.logs,
        },
      };
    }

    return undefined;
  }

  /**
   * Determine if this provider can handle the response
   *
   * Detection criteria:
   * - URL contains api.replicate.com or streaming.replicate.com
   * - Authorization header contains r8_ token prefix
   * - Response has Replicate-specific fields (version, status, urls)
   *
   * @param response - Response to check
   * @param headers - Request/response headers
   * @param url - Request URL
   * @returns True if this provider should handle the response
   */
  canHandle(response: unknown, headers?: Record<string, string>, url?: string): boolean {
    // Check URL patterns
    if (url) {
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.includes('api.replicate.com') ||
        lowerUrl.includes('streaming.replicate.com') ||
        lowerUrl.includes('replicate.com/api')
      ) {
        return true;
      }
    }

    // Check authentication header for r8_ token prefix
    if (headers) {
      const lowerHeaders = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
      );
      const authHeader = lowerHeaders['authorization'] || '';
      if (authHeader.includes('r8_')) {
        return true;
      }
    }

    // Check response structure for Replicate-specific fields
    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;

      // Look for Replicate-specific field combinations
      const hasVersion = 'version' in obj && typeof obj.version === 'string';
      const hasStatus = 'status' in obj && typeof obj.status === 'string';
      const hasUrls = 'urls' in obj && typeof obj.urls === 'object';

      // If has version field (64 char hash) and status, likely Replicate
      if (hasVersion && hasStatus) {
        const version = obj.version as string;
        // Replicate version hashes are 64 hexadecimal characters
        if (version.length === 64 && /^[a-f0-9]{64}$/.test(version)) {
          return true;
        }
      }

      // If has version, status, and urls fields, definitely Replicate
      if (hasVersion && hasStatus && hasUrls) {
        return true;
      }

      // Check for Replicate SSE event format
      if ('event' in obj && 'data' in obj) {
        const event = obj.event;
        if (event === 'output' || event === 'logs' || event === 'error' || event === 'done') {
          return true;
        }
      }
    }

    return false;
  }
}
