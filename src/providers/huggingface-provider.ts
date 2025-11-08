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
  UnifiedMessage,
  TokenUsage,
  StopReason,
  ModelInfo,
  UnifiedError,
  ProviderMetadata,
  Content,
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
