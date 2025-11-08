/**
 * Hugging Face Provider
 *
 * Parser for Hugging Face Inference API responses.
 * Supports text generation and conversational models from the Hugging Face Hub.
 *
 * @module providers/huggingface-provider
 */

import { BaseProviderParser } from './base-provider.js';
import type {
  Provider,
  UnifiedResponse,
  UnifiedStreamResponse,
  UnifiedMessage,
  TokenUsage,
  StopReason,
  ModelInfo,
  UnifiedError,
  ProviderMetadata,
  Content,
  StreamChunk,
} from '../types/unified-response.js';
import { MessageRole } from '../types/unified-response.js';

/**
 * Hugging Face text generation response
 */
interface HuggingFaceTextGenerationResponse {
  generated_text?: string;
  error?: string;
  details?: {
    finish_reason?: string;
    generated_tokens?: number;
    seed?: number;
  };
}

/**
 * Hugging Face conversational response
 */
interface HuggingFaceConversationalResponse {
  generated_text?: string;
  conversation?: {
    past_user_inputs?: string[];
    generated_responses?: string[];
  };
  error?: string;
}

/**
 * Hugging Face chat completion response (TGI format)
 */
interface HuggingFaceChatResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

/**
 * Hugging Face streaming chunk (TGI format)
 * Uses OpenAI-compatible streaming format
 */
interface HuggingFaceStreamChunk {
  id: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

/**
 * Hugging Face token-based streaming chunk (raw Inference API format)
 */
interface HuggingFaceTokenStreamChunk {
  token?: {
    id?: number;
    text: string;
    logprob?: number;
    special?: boolean;
  };
  generated_text?: string | null;
  details?: {
    finish_reason?: string;
    generated_tokens?: number;
    seed?: number;
  } | null;
  error?: string;
}

/**
 * Hugging Face provider parser
 */
export class HuggingFaceProvider extends BaseProviderParser {
  constructor() {
    super('huggingface' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'huggingface' as Provider,
      name: 'Hugging Face',
      description: 'Hugging Face Inference API for open-source models',
      apiBaseUrl: 'https://api-inference.huggingface.co',
      documentationUrl: 'https://huggingface.co/docs/api-inference',
      capabilities: {
        streaming: true,
        functionCalling: false,
        toolUse: false,
        vision: true, // Some models support vision
        jsonMode: false,
        systemMessages: true,
        maxContextWindow: 32768, // Varies by model
        maxOutputTokens: 8192, // Varies by model
        modalities: ['text', 'image'],
      },
      models: [
        'mistralai/Mistral-7B-Instruct-v0.2',
        'tiiuae/falcon-180B',
        'HuggingFaceH4/zephyr-7b-beta',
        'google/gemma-2-9b-it',
        'meta-llama/Meta-Llama-3-70B-Instruct',
        'bigcode/starcoder2-15b',
      ],
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
    const hasGeneratedText = 'generated_text' in obj;
    const hasConversation = 'conversation' in obj;
    const hasChoices = 'choices' in obj;
    const hasModel = 'model' in obj;
    const hasDetails = 'details' in obj;

    if (!(hasGeneratedText || hasConversation || hasChoices || hasModel || hasDetails)) {
      this.addError('Invalid response: missing required fields');
      return false;
    }

    return true;
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    const resp = response as Record<string, unknown>;

    // Check for error first
    const error = this.extractError(response);
    if (error) {
      return {
        id: this.generateId(),
        provider: this.provider,
        model: this.createModelInfo('unknown', this.provider),
        messages: [],
        stopReason: this.normalizeStopReason('error'),
        usage: this.createDefaultUsage(),
        metadata: { timestamp: this.getCurrentTimestamp() },
        error,
        raw: response,
      };
    }

    // Determine response format
    const isChatCompletion = 'choices' in resp && Array.isArray(resp.choices);
    const isConversational = 'conversation' in resp;

    const messages = this.extractMessages(response);
    const usage = this.extractUsage(response);
    const stopReason = this.extractStopReason(response);
    const modelInfo = this.extractModelInfo(response);

    return {
      id: (resp.id as string) || this.generateId(),
      provider: this.provider,
      model: modelInfo,
      messages,
      stopReason,
      usage,
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        format: isChatCompletion ? 'chat' : isConversational ? 'conversational' : 'text_generation',
      },
      raw: response,
    };
  }

  protected extractMessages(response: unknown): UnifiedMessage[] {
    const resp = response as Record<string, unknown>;
    const messages: UnifiedMessage[] = [];

    // Chat completion format (TGI)
    if ('choices' in resp && Array.isArray(resp.choices)) {
      const chatResp = resp as HuggingFaceChatResponse;
      for (const choice of chatResp.choices || []) {
        if (choice.message) {
          const content: Content[] = [];
          if (choice.message.content) {
            content.push(this.createTextContent(choice.message.content));
          }
          messages.push({
            role: this.normalizeRole(choice.message.role || 'assistant'),
            content,
          });
        }
      }
      return messages;
    }

    // Conversational format
    if ('conversation' in resp) {
      const convResp = resp as HuggingFaceConversationalResponse;
      const conversation = convResp.conversation;

      if (conversation) {
        // Add all past exchanges
        const userInputs = conversation.past_user_inputs || [];
        const assistantResponses = conversation.generated_responses || [];

        for (let i = 0; i < Math.max(userInputs.length, assistantResponses.length); i++) {
          if (i < userInputs.length) {
            messages.push({
              role: MessageRole.User,
              content: [this.createTextContent(userInputs[i])],
            });
          }
          if (i < assistantResponses.length) {
            messages.push({
              role: MessageRole.Assistant,
              content: [this.createTextContent(assistantResponses[i])],
            });
          }
        }
      }

      // Add current generated text if not in conversation history
      if (convResp.generated_text) {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== MessageRole.Assistant) {
          messages.push({
            role: MessageRole.Assistant,
            content: [this.createTextContent(convResp.generated_text)],
          });
        }
      }

      return messages;
    }

    // Text generation format
    if ('generated_text' in resp) {
      const textResp = resp as HuggingFaceTextGenerationResponse;
      if (textResp.generated_text) {
        messages.push({
          role: MessageRole.Assistant,
          content: [this.createTextContent(textResp.generated_text)],
        });
      }
    }

    return messages;
  }

  protected extractUsage(response: unknown): TokenUsage {
    const resp = response as Record<string, unknown>;

    // Chat completion format
    if ('usage' in resp && resp.usage && typeof resp.usage === 'object') {
      const usage = resp.usage as HuggingFaceChatResponse['usage'];
      return {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      };
    }

    // Text generation format
    if ('details' in resp && resp.details && typeof resp.details === 'object') {
      const details = resp.details as HuggingFaceTextGenerationResponse['details'];
      const outputTokens = details?.generated_tokens || 0;
      return {
        inputTokens: 0, // Not provided by HF text generation
        outputTokens,
        totalTokens: outputTokens,
      };
    }

    return this.createDefaultUsage();
  }

  protected extractStopReason(response: unknown): StopReason {
    const resp = response as Record<string, unknown>;

    // Chat completion format
    if ('choices' in resp && Array.isArray(resp.choices)) {
      const chatResp = resp as HuggingFaceChatResponse;
      const firstChoice = chatResp.choices?.[0];
      if (firstChoice?.finish_reason) {
        return this.normalizeStopReason(firstChoice.finish_reason);
      }
    }

    // Text generation format
    if ('details' in resp && resp.details && typeof resp.details === 'object') {
      const details = resp.details as HuggingFaceTextGenerationResponse['details'];
      if (details?.finish_reason) {
        return this.normalizeStopReason(details.finish_reason);
      }
    }

    return this.normalizeStopReason('stop');
  }

  protected extractModelInfo(response: unknown): ModelInfo {
    const resp = response as Record<string, unknown>;

    // Chat completion format
    if ('model' in resp && typeof resp.model === 'string') {
      return this.createModelInfo(resp.model, this.provider);
    }

    // Default - model info not provided in response
    return this.createModelInfo('unknown', this.provider);
  }

  protected extractError(response: unknown): UnifiedError | undefined {
    const resp = response as Record<string, unknown>;

    if (resp.error) {
      const errorMessage = typeof resp.error === 'string' ? resp.error : String(resp.error);
      return {
        code: 'huggingface_error',
        message: errorMessage,
        type: 'api_error',
      };
    }

    return undefined;
  }

  /**
   * Validate Hugging Face streaming chunk
   *
   * Supports TWO streaming formats:
   * 1. Token-based format (raw Inference API): { token: {...}, generated_text, details }
   * 2. TGI format (OpenAI-compatible): { id, choices: [{delta, ...}] }
   *
   * Performs strict validation to ensure:
   * - Chunk is a valid object
   * - Has required fields for one of the supported formats
   * - Error chunks are properly formatted
   *
   * @param chunk - Raw streaming chunk from Hugging Face
   * @returns True if chunk is valid, false otherwise
   */
  protected validateStreamChunk(chunk: unknown): boolean {
    // Null check
    if (!chunk || typeof chunk !== 'object') {
      this.addError('Invalid streaming chunk: must be a non-null object');
      return false;
    }

    const obj = chunk as Record<string, unknown>;

    // Check for error chunks - these are valid in both formats
    if (obj.error) {
      // Error chunks must have error field as string or object
      if (typeof obj.error !== 'string' && typeof obj.error !== 'object') {
        this.addError('Invalid error chunk: error field must be string or object');
        return false;
      }
      return true;
    }

    // Detect format: Token-based OR TGI
    const isTokenFormat = 'token' in obj || 'generated_text' in obj || 'details' in obj;
    const isTGIFormat = 'choices' in obj && 'id' in obj;

    if (isTokenFormat) {
      // Validate token-based format
      return this.validateTokenStreamChunk(obj);
    } else if (isTGIFormat) {
      // Validate TGI format
      return this.validateTGIStreamChunk(obj);
    } else {
      this.addError('Invalid streaming chunk: must be token-based format (with token/generated_text/details) or TGI format (with id/choices)');
      return false;
    }
  }

  /**
   * Validate token-based streaming chunk format
   */
  private validateTokenStreamChunk(obj: Record<string, unknown>): boolean {
    // Token field validation (if present)
    if (obj.token !== undefined && obj.token !== null) {
      if (typeof obj.token !== 'object') {
        this.addError('Invalid token-based chunk: token field must be an object');
        return false;
      }

      const token = obj.token as Record<string, unknown>;
      // Allow empty strings for special tokens (e.g., end-of-sequence)
      if (token.text === undefined || typeof token.text !== 'string') {
        this.addError('Invalid token-based chunk: token.text must be a string (can be empty for special tokens)');
        return false;
      }
    }

    // generated_text validation (optional, can be null)
    if (obj.generated_text !== undefined && obj.generated_text !== null && typeof obj.generated_text !== 'string') {
      this.addError('Invalid token-based chunk: generated_text must be string or null');
      return false;
    }

    // details validation (optional, can be null)
    if (obj.details !== undefined && obj.details !== null && typeof obj.details !== 'object') {
      this.addError('Invalid token-based chunk: details must be object or null');
      return false;
    }

    return true;
  }

  /**
   * Validate TGI streaming chunk format
   */
  private validateTGIStreamChunk(obj: Record<string, unknown>): boolean {
    // Validate required id field
    if (!obj.id || typeof obj.id !== 'string') {
      this.addError('Invalid TGI chunk: missing or invalid id field (must be non-empty string)');
      return false;
    }

    // Validate choices array
    if (!obj.choices || !Array.isArray(obj.choices)) {
      this.addError('Invalid TGI chunk: missing or invalid choices field (must be array)');
      return false;
    }

    // Validate at least one choice exists
    if (obj.choices.length === 0) {
      this.addWarning('TGI chunk has empty choices array');
      return true; // Not a hard error, just unusual
    }

    // Validate each choice structure
    for (let i = 0; i < obj.choices.length; i++) {
      const choice = obj.choices[i];

      if (!choice || typeof choice !== 'object') {
        this.addError(`Invalid TGI chunk: choice[${i}] must be an object`);
        return false;
      }

      const choiceObj = choice as Record<string, unknown>;

      // Validate index
      if (typeof choiceObj.index !== 'number') {
        this.addError(`Invalid TGI chunk: choice[${i}].index must be a number`);
        return false;
      }

      // Validate delta object (required for streaming)
      if (!choiceObj.delta || typeof choiceObj.delta !== 'object') {
        this.addError(`Invalid TGI chunk: choice[${i}].delta must be an object`);
        return false;
      }

      // Validate finish_reason (must be string or null)
      if (choiceObj.finish_reason !== null &&
          choiceObj.finish_reason !== undefined &&
          typeof choiceObj.finish_reason !== 'string') {
        this.addError(`Invalid TGI chunk: choice[${i}].finish_reason must be string or null`);
        return false;
      }
    }

    return true;
  }

  /**
   * Parse Hugging Face streaming chunk to unified format
   *
   * Supports TWO streaming formats:
   * 1. Token-based format: { token: {text: "..."}, generated_text, details }
   * 2. TGI format: { id, choices: [{delta: {content: "..."}}] }
   *
   * Converts streaming chunks to UnifiedStreamResponse format:
   * - Extracts delta content from each choice/token
   * - Processes finish_reason for completion signals
   * - Handles usage information when provided
   * - Supports error chunks with proper error extraction
   *
   * Enterprise features:
   * - Comprehensive error handling
   * - Null safety for all optional fields
   * - Proper type conversions
   * - Preserves chunk indices for multi-choice responses
   * - Auto-detection of streaming format
   *
   * @param chunk - Validated streaming chunk from Hugging Face
   * @returns Unified stream response with processed chunks
   */
  protected async parseStreamChunk(chunk: unknown): Promise<UnifiedStreamResponse> {
    const obj = chunk as Record<string, unknown>;

    // Handle error chunks (common to both formats)
    const error = this.extractError(chunk);
    if (error) {
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

    // Detect format and parse accordingly
    const isTokenFormat = 'token' in obj || 'generated_text' in obj || 'details' in obj;

    if (isTokenFormat) {
      return this.parseTokenStreamChunk(chunk as HuggingFaceTokenStreamChunk);
    } else {
      return this.parseTGIStreamChunk(chunk as HuggingFaceStreamChunk);
    }
  }

  /**
   * Parse token-based streaming chunk
   */
  private async parseTokenStreamChunk(streamChunk: HuggingFaceTokenStreamChunk): Promise<UnifiedStreamResponse> {
    const chunks: StreamChunk[] = [];
    let stopReason: StopReason | undefined;
    let usage: TokenUsage | undefined;

    // Extract token text content
    if (streamChunk.token?.text) {
      chunks.push({
        type: 'content_block_delta',
        delta: {
          type: 'text' as const,
          text: streamChunk.token.text,
        },
        index: 0,
      });
    }

    // Handle completion with generated_text (final chunk)
    if (streamChunk.generated_text) {
      chunks.push({
        type: 'message_stop',
        delta: {
          stopReason: this.normalizeStopReason('stop'),
        },
        index: 0,
      });
    }

    // Extract completion details
    if (streamChunk.details) {
      if (streamChunk.details.finish_reason) {
        stopReason = this.normalizeStopReason(streamChunk.details.finish_reason);
      }

      if (streamChunk.details.generated_tokens) {
        usage = {
          inputTokens: 0, // Not provided in token format
          outputTokens: streamChunk.details.generated_tokens,
          totalTokens: streamChunk.details.generated_tokens,
        };
      }
    }

    // Generate unique ID for chunk
    const id = this.generateId();

    return {
      id,
      provider: this.provider,
      model: this.createModelInfo('unknown', this.provider), // Model not provided in token format
      chunks,
      stopReason,
      usage,
      metadata: {
        timestamp: this.getCurrentTimestamp(),
        requestId: id,
        format: 'token',
      },
    };
  }

  /**
   * Parse TGI (OpenAI-compatible) streaming chunk
   */
  private async parseTGIStreamChunk(streamChunk: HuggingFaceStreamChunk): Promise<UnifiedStreamResponse> {
    const chunks: StreamChunk[] = [];

    // Extract model information
    const modelInfo = streamChunk.model
      ? this.createModelInfo(streamChunk.model, this.provider)
      : this.createModelInfo('unknown', this.provider);

    // Process each choice in the streaming chunk
    for (const choice of streamChunk.choices) {
      // Extract text delta content
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

      // Extract role information (typically only in first chunk)
      if (choice.delta.role) {
        chunks.push({
          type: 'message_start',
          delta: {},
          index: choice.index,
        });
      }

      // Handle completion signals
      if (choice.finish_reason) {
        chunks.push({
          type: 'message_stop',
          delta: {
            stopReason: this.normalizeStopReason(choice.finish_reason),
          },
          index: choice.index,
        });
      }
    }

    // Extract usage information if provided (typically in final chunk)
    const usage = streamChunk.usage ? this.extractUsage(streamChunk) : undefined;

    // Construct unified stream response
    return {
      id: streamChunk.id,
      provider: this.provider,
      model: modelInfo,
      chunks,
      usage,
      metadata: {
        timestamp: streamChunk.created
          ? new Date(streamChunk.created * 1000).toISOString()
          : this.getCurrentTimestamp(),
        requestId: streamChunk.id,
        format: 'tgi',
      },
    };
  }

  canHandle(response: unknown, headers?: Record<string, string>, url?: string): boolean {
    // Check URL
    if (url) {
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.includes('huggingface.co') ||
        lowerUrl.includes('api-inference.huggingface.co') ||
        lowerUrl.includes('hf.co')
      ) {
        return true;
      }
    }

    // Check headers
    if (headers) {
      const lowerHeaders = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
      );
      if (lowerHeaders['x-huggingface-api-key'] || lowerHeaders['authorization']?.includes('hf_')) {
        return true;
      }
    }

    // Check response format
    if (response && typeof response === 'object') {
      const resp = response as Record<string, unknown>;

      // Look for HF-specific fields
      const hasHFFields =
        'generated_text' in resp ||
        ('conversation' in resp && typeof resp.conversation === 'object') ||
        ('choices' in resp && 'usage' in resp); // TGI format

      return hasHFFields;
    }

    return false;
  }
}
