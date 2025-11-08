/**
 * Comprehensive Streaming Tests
 *
 * Tests streaming functionality across Hugging Face, Together AI providers.
 * Note: Replicate provider is not currently implemented in the codebase.
 *
 * Test coverage includes:
 * - Basic streaming functionality
 * - Error handling during streaming
 * - Stream interruption and recovery
 * - Provider-specific edge cases
 * - Performance characteristics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HuggingFaceProvider } from '../../src/providers/huggingface-provider.js';
import { TogetherProvider } from '../../src/providers/all-providers.js';
import {
  registerAllProviders,
  getRegistry,
  ProviderRegistry,
} from '../../src/providers/index.js';
import type { UnifiedStreamResponse, Provider, StopReason } from '../../src/types/unified-response.js';

describe('Streaming Tests - Comprehensive Coverage', () => {
  beforeEach(() => {
    ProviderRegistry.reset();
    registerAllProviders();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hugging Face Streaming Tests', () => {
    let provider: HuggingFaceProvider;

    beforeEach(() => {
      provider = new HuggingFaceProvider();
    });

    describe('Basic Streaming Functionality', () => {
      it('should parse a basic streaming chunk', async () => {
        const chunk = {
          token: {
            id: 128,
            text: ' Hello',
            logprob: -0.5,
            special: false,
          },
          generated_text: null,
          details: null,
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
        expect(result.response?.provider).toBe('huggingface');
      });

      it('should parse a final streaming chunk with complete text', async () => {
        const chunk = {
          token: {
            id: 2,
            text: '</s>',
            logprob: 0,
            special: true,
          },
          generated_text: 'Hello! How can I help you today?',
          details: {
            finish_reason: 'eos_token',
            generated_tokens: 8,
            seed: 42,
          },
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
      });

      it('should handle streaming chunks with different token types', async () => {
        const chunks = [
          { token: { text: 'Hello', special: false } },
          { token: { text: ' ', special: false } },
          { token: { text: 'world', special: false } },
          { token: { text: '!', special: false } },
        ];

        for (const chunk of chunks) {
          const result = await provider.parseStream(chunk);
          expect(result.success).toBe(true);
        }
      });

      it('should parse TGI (Text Generation Inference) streaming format', async () => {
        const chunk = {
          id: 'cmpl-123',
          object: 'chat.completion.chunk',
          created: 1677652288,
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
                content: 'Hello',
              },
              finish_reason: null,
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
      });
    });

    describe('Error Handling During Streaming', () => {
      it('should handle error in streaming chunk', async () => {
        const errorChunk = {
          error: 'Model is currently loading. Please retry in a few seconds.',
        };

        const result = await provider.parseStream(errorChunk);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
      });

      it('should handle malformed streaming chunk gracefully', async () => {
        const malformedChunk = {
          unexpected_field: 'unexpected_value',
        };

        const result = await provider.parseStream(malformedChunk);

        // Should fail validation
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle null streaming chunk', async () => {
        const result = await provider.parseStream(null);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle empty streaming chunk', async () => {
        const result = await provider.parseStream({});

        expect(result.success).toBe(false);
      });

      it('should handle streaming chunk with network timeout simulation', async () => {
        // Simulate timeout by not providing expected fields
        const timeoutChunk = {
          status: 'timeout',
        };

        const result = await provider.parseStream(timeoutChunk);

        expect(result.success).toBe(false);
      });
    });

    describe('Stream Interruption and Recovery', () => {
      it('should handle stream interruption with partial content', async () => {
        const chunks = [
          { token: { text: 'Hello', special: false } },
          { token: { text: ' there', special: false } },
          // Stream interrupted here
        ];

        const results = [];
        for (const chunk of chunks) {
          const result = await provider.parseStream(chunk);
          results.push(result);
        }

        expect(results.every((r) => r.success)).toBe(true);
      });

      it('should handle recovery after error chunk', async () => {
        const chunks = [
          { token: { text: 'Hello', special: false } },
          { error: 'Temporary error' },
          { token: { text: ' world', special: false } },
        ];

        const results = [];
        for (const chunk of chunks) {
          const result = await provider.parseStream(chunk);
          results.push(result);
        }

        expect(results[1].response?.error).toBeDefined();
        expect(results[2].success).toBe(true);
      });

      it('should handle stream with finish_reason indicating completion', async () => {
        const finalChunk = {
          token: { text: '', special: true },
          generated_text: 'Complete response',
          details: {
            finish_reason: 'stop',
            generated_tokens: 10,
          },
        };

        const result = await provider.parseStream(finalChunk);

        expect(result.success).toBe(true);
      });
    });

    describe('Provider-Specific Edge Cases', () => {
      it('should handle conversational format streaming', async () => {
        const chunk = {
          generated_text: 'Hello!',
          conversation: {
            past_user_inputs: ['Hi'],
            generated_responses: ['Hello!'],
          },
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });

      it('should handle different finish_reason values', async () => {
        const finishReasons = ['stop', 'eos_token', 'length', 'model_length'];

        for (const reason of finishReasons) {
          const chunk = {
            generated_text: 'Test',
            details: {
              finish_reason: reason,
              generated_tokens: 5,
            },
          };

          const result = await provider.parseStream(chunk);
          expect(result.success).toBe(true);
        }
      });

      it('should handle streaming with special tokens', async () => {
        const chunk = {
          token: {
            id: 1,
            text: '<|endoftext|>',
            special: true,
          },
          generated_text: 'Response text',
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });

      it('should validate metadata is included', async () => {
        const metadata = provider.getMetadata();

        expect(metadata.id).toBe('huggingface');
        expect(metadata.capabilities.streaming).toBe(true);
        expect(metadata.name).toBe('Hugging Face');
      });
    });

    describe('Performance Characteristics', () => {
      it('should parse streaming chunks efficiently', async () => {
        const chunks = Array.from({ length: 100 }, (_, i) => ({
          token: { text: `word${i}`, special: false },
        }));

        const startTime = Date.now();
        for (const chunk of chunks) {
          await provider.parseStream(chunk);
        }
        const duration = Date.now() - startTime;

        // Should process 100 chunks in less than 1 second
        expect(duration).toBeLessThan(1000);
      });

      it('should handle rapid successive chunks', async () => {
        const chunks = [
          { token: { text: 'A', special: false } },
          { token: { text: 'B', special: false } },
          { token: { text: 'C', special: false } },
        ];

        const results = await Promise.all(chunks.map((c) => provider.parseStream(c)));

        expect(results.every((r) => r.success)).toBe(true);
      });
    });
  });

  describe('Together AI Streaming Tests', () => {
    let provider: TogetherProvider;

    beforeEach(() => {
      provider = new TogetherProvider();
    });

    describe('Basic Streaming Functionality', () => {
      it('should parse a basic Together AI streaming chunk', async () => {
        const chunk = {
          id: 'tog-stream-123',
          object: 'chat.completion.chunk',
          created: 1677652288,
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
                content: 'Hello',
              },
              finish_reason: null,
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
        expect(result.response?.provider).toBe('together');
      });

      it('should parse final streaming chunk with finish_reason', async () => {
        const chunk = {
          id: 'tog-stream-456',
          object: 'chat.completion.chunk',
          created: 1677652288,
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'eos',
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });

      it('should handle streaming chunks with tool calls', async () => {
        const chunk = {
          id: 'tog-stream-789',
          object: 'chat.completion.chunk',
          created: 1677652288,
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: 'call_abc',
                    type: 'function',
                    function: {
                      name: 'get_weather',
                      arguments: '{"location": "SF"}',
                    },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });
    });

    describe('Error Handling During Streaming', () => {
      it('should handle error in Together AI streaming', async () => {
        const errorChunk = {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
            code: 'rate_limit',
          },
        };

        const result = await provider.parseStream(errorChunk);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
      });

      it('should handle authentication errors during streaming', async () => {
        const errorChunk = {
          error: {
            message: 'Invalid API key',
            type: 'authentication_error',
            code: 'invalid_api_key',
          },
        };

        const result = await provider.parseStream(errorChunk);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
        expect(result.response?.error?.code).toBe('invalid_api_key');
      });

      it('should handle model loading errors', async () => {
        const errorChunk = {
          error: {
            message: 'Model is currently loading',
            type: 'model_error',
            code: 'model_loading',
          },
        };

        const result = await provider.parseStream(errorChunk);

        expect(result.success).toBe(true);
      });
    });

    describe('Stream Interruption and Recovery', () => {
      it('should handle partial streaming completion', async () => {
        const chunks = [
          {
            choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: null }],
          },
          {
            choices: [{ index: 0, delta: { content: ' world' }, finish_reason: null }],
          },
          {
            choices: [{ index: 0, delta: {}, finish_reason: 'eos' }],
          },
        ];

        const results = [];
        for (const chunk of chunks) {
          const result = await provider.parseStream(chunk);
          results.push(result);
        }

        expect(results.every((r) => r.success)).toBe(true);
      });

      it('should handle stream interruption mid-response', async () => {
        const chunks = [
          {
            choices: [{ index: 0, delta: { content: 'This is a' }, finish_reason: null }],
          },
          // Stream interrupted - no more chunks
        ];

        const results = [];
        for (const chunk of chunks) {
          const result = await provider.parseStream(chunk);
          results.push(result);
        }

        expect(results[0].success).toBe(true);
      });
    });

    describe('Provider-Specific Edge Cases', () => {
      it('should handle different finish_reason values from Together', async () => {
        const finishReasons = ['eos', 'stop', 'length', 'tool_calls'];

        for (const reason of finishReasons) {
          const chunk = {
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: reason,
              },
            ],
          };

          const result = await provider.parseStream(chunk);
          expect(result.success).toBe(true);
        }
      });

      it('should validate Together AI metadata', async () => {
        const metadata = provider.getMetadata();

        expect(metadata.id).toBe('together');
        expect(metadata.capabilities.streaming).toBe(true);
        expect(metadata.capabilities.functionCalling).toBe(true);
        expect(metadata.capabilities.jsonMode).toBe(true);
        expect(metadata.name).toBe('Together.ai');
      });

      it('should handle empty delta objects', async () => {
        const chunk = {
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: null,
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });

      it('should handle multiple choices in streaming response', async () => {
        const chunk = {
          choices: [
            {
              index: 0,
              delta: { content: 'Response 1' },
              finish_reason: null,
            },
            {
              index: 1,
              delta: { content: 'Response 2' },
              finish_reason: null,
            },
          ],
        };

        const result = await provider.parseStream(chunk);

        expect(result.success).toBe(true);
      });
    });

    describe('Performance Characteristics', () => {
      it('should parse Together AI streaming chunks efficiently', async () => {
        const chunks = Array.from({ length: 50 }, (_, i) => ({
          choices: [
            {
              index: 0,
              delta: { content: `token${i}` },
              finish_reason: null,
            },
          ],
        }));

        const startTime = Date.now();
        for (const chunk of chunks) {
          await provider.parseStream(chunk);
        }
        const duration = Date.now() - startTime;

        // Should process 50 chunks efficiently
        expect(duration).toBeLessThan(500);
      });
    });
  });

  describe('Replicate Provider Status', () => {
    it('should verify that Replicate provider is now implemented', () => {
      const registry = getRegistry();
      const providers = registry.getProviders();

      // Verify Replicate is in the provider list (now implemented)
      expect(providers).toContain('replicate');
    });

    it('should list all available providers', () => {
      const registry = getRegistry();
      const providers = registry.getProviders();

      // Verify expected providers are available
      expect(providers).toContain('huggingface');
      expect(providers).toContain('together');
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
    });
  });

  describe('Cross-Provider Streaming Comparison', () => {
    it('should compare streaming capabilities across providers', async () => {
      const hfProvider = new HuggingFaceProvider();
      const togetherProvider = new TogetherProvider();

      const hfMetadata = hfProvider.getMetadata();
      const togetherMetadata = togetherProvider.getMetadata();

      // Both should support streaming
      expect(hfMetadata.capabilities.streaming).toBe(true);
      expect(togetherMetadata.capabilities.streaming).toBe(true);

      // Compare other capabilities
      expect(togetherMetadata.capabilities.functionCalling).toBe(true);
      expect(hfMetadata.capabilities.functionCalling).toBe(false);
    });

    it('should verify streaming format consistency', async () => {
      // All providers should return UnifiedStreamResponse
      const hfProvider = new HuggingFaceProvider();
      const togetherProvider = new TogetherProvider();

      const hfChunk = { token: { text: 'test', special: false } };
      const togetherChunk = {
        choices: [{ index: 0, delta: { content: 'test' }, finish_reason: null }],
      };

      const hfResult = await hfProvider.parseStream(hfChunk);
      const togetherResult = await togetherProvider.parseStream(togetherChunk);

      // Both should have consistent response structure
      expect(hfResult.response).toHaveProperty('provider');
      expect(togetherResult.response).toHaveProperty('provider');
      expect(hfResult.response).toHaveProperty('model');
      expect(togetherResult.response).toHaveProperty('model');
    });
  });

  describe('Integration with Registry', () => {
    it('should detect streaming providers via registry', () => {
      const registry = getRegistry();

      // Check Hugging Face
      const hfResponse = { generated_text: 'test' };
      const hfUrl = 'https://api-inference.huggingface.co/models/test';
      const hfDetection = registry.detectProvider(hfResponse, {}, hfUrl);

      expect(hfDetection.detected).toBe(true);
      expect(hfDetection.provider).toBe('huggingface');

      // Check Together
      const togetherResponse = { choices: [{ message: { content: 'test' } }] };
      const togetherUrl = 'https://api.together.xyz/v1/chat/completions';
      const togetherDetection = registry.detectProvider(togetherResponse, {}, togetherUrl);

      expect(togetherDetection.detected).toBe(true);
      expect(togetherDetection.provider).toBe('together');
    });
  });
});
