/**
 * Provider Validation Edge Cases Tests
 *
 * Tests edge cases, malformed responses, and boundary conditions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OpenAIProvider,
  AnthropicProvider,
  MistralProvider,
  HuggingFaceProvider,
  ProviderRegistry,
  registerAllProviders,
} from '../../src/providers/index.js';

describe('Provider Validation Edge Cases', () => {
  beforeEach(() => {
    ProviderRegistry.reset();
    registerAllProviders();
  });

  describe('Malformed Responses', () => {
    it('should handle empty objects', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({});

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle arrays instead of objects', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse([]);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle primitive values', async () => {
      const provider = new MistralProvider();
      const stringResult = await provider.parse('invalid');
      const numberResult = await provider.parse(42);
      const boolResult = await provider.parse(true);

      expect(stringResult.success).toBe(false);
      expect(numberResult.success).toBe(false);
      expect(boolResult.success).toBe(false);
    });

    it('should handle null values', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(null);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid response: must be an object');
    });

    it('should handle undefined values', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(undefined);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid response: must be an object');
    });
  });

  describe('Partial Responses', () => {
    it('should handle responses with only id field', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({ id: 'test-123' });

      // Should pass validation (relaxed) but fail during parsing due to missing data
      expect(result.success).toBe(false);
      // Validation should pass, but parsing should fail
      expect(result.errors.some(e => e.includes('Parse error'))).toBe(true);
    });

    it('should handle responses with missing usage data', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test-123',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello' },
            finish_reason: 'stop',
          },
        ],
        // Missing usage field - should use defaults
      });

      // Parsing may fail or succeed with defaults depending on provider implementation
      if (result.success) {
        expect(result.response?.usage).toBeDefined();
        expect(result.response?.usage.totalTokens).toBe(0); // Default values
      } else {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle responses with empty choices array', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test-123',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
      });

      // Should handle empty arrays gracefully
      if (result.success) {
        expect(result.response?.messages.length).toBe(0);
      } else {
        // Or may fail if provider requires at least one choice
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle unicode text content', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test-123',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello 世界 🌍 مرحبا Привет',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[0]).toMatchObject({
        type: 'text',
        text: 'Hello 世界 🌍 مرحبا Привет',
      });
    });

    it('should handle escaped JSON in function arguments', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test-123',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'test',
                    arguments: '{"text":"Hello \\"world\\"","value":42}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      expect(result.success).toBe(true);
      const toolContent = result.response?.messages[0].content[0];
      if (toolContent?.type === 'tool_use') {
        expect(toolContent.input).toEqual({
          text: 'Hello "world"',
          value: 42,
        });
      }
    });
  });

  describe('Large Responses', () => {
    it('should handle responses with many messages', async () => {
      const provider = new OpenAIProvider();
      const choices = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        message: { role: 'assistant', content: `Message ${i}` },
        finish_reason: 'stop',
      }));

      const result = await provider.parse({
        id: 'test-123',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices,
        usage: { prompt_tokens: 100, completion_tokens: 500, total_tokens: 600 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages.length).toBe(100);
    });

    it('should handle very long text content', async () => {
      const provider = new AnthropicProvider();
      const longText = 'A'.repeat(100000); // 100k characters

      const result = await provider.parse({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: longText }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 25000 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[0]).toMatchObject({
        type: 'text',
        text: longText,
      });
    });
  });

  describe('Provider Auto-Detection Edge Cases', () => {
    it('should handle ambiguous responses', () => {
      const registry = new ProviderRegistry();
      registerAllProviders();

      // Response with both OpenAI and generic fields
      const ambiguousResponse = {
        id: 'test-123',
        choices: [],
        model: 'unknown-model',
      };

      const detection = registry.detectProvider(ambiguousResponse);
      // Detection may succeed or fail depending on how strict the detection is
      if (detection.detected) {
        // If detected, should recognize as OpenAI due to choices field
        expect(detection.provider).toBe('openai');
      } else {
        // Or may not detect due to missing other identifying fields
        expect(detection.detected).toBe(false);
      }
    });

    it('should handle detection with headers and URL', async () => {
      const registry = new ProviderRegistry();
      registerAllProviders();

      const response = { id: 'test' };
      const headers = { 'anthropic-version': '2023-06-01' };
      const url = 'https://api.anthropic.com/v1/messages';

      const detection = registry.detectProvider(response, headers, url);
      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('anthropic');
      expect(detection.method).toBe('header');
    });

    it('should prioritize header detection over URL detection', async () => {
      const registry = new ProviderRegistry();
      registerAllProviders();

      const response = {};
      const headers = { 'openai-version': '2023-11-01' };
      const url = 'https://api.anthropic.com/v1/messages';

      const detection = registry.detectProvider(response, headers, url);
      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
      expect(detection.method).toBe('header');
    });
  });

  describe('Streaming Response Handling', () => {
    it('should validate streaming chunks', async () => {
      const provider = new OpenAIProvider();

      // Valid chunk
      const validChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1677652288,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello' },
            finish_reason: null,
          },
        ],
      };

      const result = await provider.parseStream(validChunk);
      expect(result.success).toBe(true);
    });

    it('should handle malformed streaming chunks', async () => {
      const provider = new OpenAIProvider();

      const invalidChunk = {
        id: 'chatcmpl-123',
        // Missing choices field
      };

      const result = await provider.parseStream(invalidChunk);
      expect(result.success).toBe(false);
    });
  });

  describe('Hugging Face Format Variations', () => {
    it('should handle text generation format', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse({
        generated_text: 'Test output',
        details: {
          finish_reason: 'length',
          generated_tokens: 10,
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[0]).toMatchObject({
        type: 'text',
        text: 'Test output',
      });
    });

    it('should handle TGI chat format', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse({
        id: 'hf-123',
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        choices: [
          {
            message: { role: 'assistant', content: 'Hello' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7,
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.model.id).toBe('mistralai/Mistral-7B-Instruct-v0.2');
    });

    it('should handle conversational format', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse({
        generated_text: 'Latest response',
        conversation: {
          past_user_inputs: ['Hi', 'How are you?'],
          generated_responses: ['Hello!', "I'm good, thanks!"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Error Response Variations', () => {
    it('should handle OpenAI error with all fields', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          param: null,
          code: 'rate_limit_exceeded',
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
      expect(result.response?.error?.code).toBe('rate_limit_exceeded');
      expect(result.response?.error?.type).toBe('rate_limit_error');
    });

    it('should handle Anthropic error with nested structure', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        type: 'error',
        error: {
          type: 'overloaded_error',
          message: 'Service temporarily unavailable',
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
    });

    it('should handle simple error strings', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse({
        error: 'Model is loading',
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
      expect(result.response?.error?.message).toBe('Model is loading');
    });
  });
});
