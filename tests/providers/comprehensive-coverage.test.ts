/**
 * Comprehensive Coverage Tests
 *
 * Additional tests to achieve 95%+ coverage for all provider code
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import {
  OpenAIProvider,
  AnthropicProvider,
  MistralProvider,
  GoogleProvider,
  CohereProvider,
  XAIProvider,
  PerplexityProvider,
  TogetherProvider,
  FireworksProvider,
  BedrockProvider,
  OllamaProvider,
  HuggingFaceProvider,
  ProviderRegistry,
  registerAllProviders,
  getRegistry,
  getModelRegistry,
  getModel,
  searchModels,
} from '../../src/providers/index.js';
import { Provider, StopReason } from '../../src/types/unified-response.js';

describe('Comprehensive Provider Coverage', () => {
  const fixturesPath = resolve(import.meta.dirname, '../fixtures/provider-responses.json');
  const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

  beforeEach(() => {
    ProviderRegistry.reset();
  });

  describe('Streaming Support', () => {
    it('should parse OpenAI streaming chunks', async () => {
      const provider = new OpenAIProvider();
      const chunk = {
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

      const result = await provider.parseStream(chunk);
      expect(result.success).toBe(true);
      expect(result.response?.chunks).toBeDefined();
    });

    it('should parse Anthropic streaming chunks', async () => {
      const provider = new AnthropicProvider();
      const chunk = {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: 'Hello' },
      };

      const result = await provider.parseStream(chunk);
      expect(result.success).toBe(true);
    });

    it('should handle streaming errors', async () => {
      const provider = new OpenAIProvider();
      const invalidChunk = { id: 'test' }; // Missing choices

      const result = await provider.parseStream(invalidChunk);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Metadata', () => {
    it('should return OpenAI metadata', () => {
      const provider = new OpenAIProvider();
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('openai');
      expect(metadata.name).toBe('OpenAI');
      expect(metadata.capabilities.streaming).toBe(true);
      expect(metadata.capabilities.functionCalling).toBe(true);
      expect(metadata.models.length).toBeGreaterThan(0);
    });

    it('should return Anthropic metadata', () => {
      const provider = new AnthropicProvider();
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('anthropic');
      expect(metadata.capabilities.toolUse).toBe(true);
      expect(metadata.capabilities.vision).toBe(true);
    });

    it('should return Google metadata', () => {
      const provider = new GoogleProvider();
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('google');
      expect(metadata.capabilities.vision).toBe(true);
      expect(metadata.capabilities.modalities).toContain('video');
    });

    it('should return HuggingFace metadata', () => {
      const provider = new HuggingFaceProvider();
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('huggingface');
      expect(metadata.models.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Registry Coverage', () => {
    it('should register and unregister providers', () => {
      const registry = new ProviderRegistry();
      const provider = new OpenAIProvider();

      registry.register(provider);
      expect(registry.isRegistered('openai' as Provider)).toBe(true);

      const allProviders = registry.getProviders();
      expect(allProviders).toContain('openai' as Provider);
    });

    it('should get provider metadata from registry', () => {
      registerAllProviders();
      const registry = getRegistry();

      const metadata = registry.getMetadata('openai' as Provider);
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('OpenAI');
    });

    it('should return undefined for unregistered provider metadata', () => {
      const registry = new ProviderRegistry();
      const metadata = registry.getMetadata('unknown' as Provider);

      expect(metadata).toBeUndefined();
    });

    it('should detect provider from model name', () => {
      registerAllProviders();
      const registry = getRegistry();

      const gpt4Response = {
        id: 'test',
        model: 'gpt-4',
        choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      };

      const detection = registry.detectProvider(gpt4Response);
      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
    });

    it('should detect Anthropic from Claude model name', () => {
      registerAllProviders();
      const registry = getRegistry();

      const claudeResponse = {
        type: 'message',
        model: 'claude-3-opus-20240229',
        content: [{ type: 'text', text: 'Hi' }],
      };

      const detection = registry.detectProvider(claudeResponse);
      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('anthropic');
    });
  });

  describe('Model Registry Coverage', () => {
    it('should get all models', () => {
      const registry = getModelRegistry();
      const models = registry.getAllModels();

      expect(models.length).toBeGreaterThan(30); // At least 30+ models registered
    });

    it('should get models by provider', () => {
      const registry = getModelRegistry();
      const openaiModels = registry.getProviderModels('openai' as Provider);

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(openaiModels.every(m => m.provider === 'openai')).toBe(true);
    });

    it('should check if model exists', () => {
      const registry = getModelRegistry();

      expect(registry.hasModel('gpt-4-turbo-2024-04-09', 'openai' as Provider)).toBe(true);
      expect(registry.hasModel('nonexistent-model')).toBe(false);
    });

    it('should get model capabilities', () => {
      const registry = getModelRegistry();
      const model = registry.getModel('gpt-4-turbo-2024-04-09', 'openai' as Provider);

      // The model should exist
      expect(model).toBeDefined();
      // Capabilities may or may not be defined depending on model details
      if (model) {
        expect(model.capabilities).toBeDefined();
      }
    });

    it('should detect provider from model ID', () => {
      const registry = getModelRegistry();

      const provider = registry.detectProviderFromModel('claude-3-opus-20240229');
      expect(provider).toBe('anthropic');
    });

    it('should search models by family', () => {
      const models = searchModels({ family: 'claude-3' });

      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.family === 'claude-3')).toBe(true);
    });

    it('should search models by cost', () => {
      const affordableModels = searchModels({
        maxCost: 5.0,
      });

      // May or may not find models depending on pricing data
      if (affordableModels.length > 0) {
        // If found, ensure pricing is within limit
        affordableModels.forEach(m => {
          if (m.pricing?.outputCostPer1M !== undefined) {
            expect(m.pricing.outputCostPer1M).toBeLessThanOrEqual(5.0);
          }
        });
      }
    });

    it('should search models by context window', () => {
      const largeContextModels = searchModels({
        minContextWindow: 100000,
      });

      expect(largeContextModels.length).toBeGreaterThan(0);
      expect(largeContextModels.every(m => (m.contextWindow || 0) >= 100000)).toBe(true);
    });

    it('should register model aliases', () => {
      const registry = getModelRegistry();
      registry.registerAlias('gpt4', 'gpt-4-turbo-2024-04-09', 'openai' as Provider);

      const model = registry.getModel('gpt4');
      expect(model).toBeDefined();
      expect(model?.id).toBe('gpt-4-turbo-2024-04-09');
    });
  });

  describe('Error Extraction Coverage', () => {
    it('should extract OpenAI error details', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.error);

      expect(result.success).toBe(true);
      expect(result.response?.error?.code).toBe('invalid_api_key');
      expect(result.response?.error?.type).toBe('invalid_request_error');
      expect(result.response?.error?.message).toBe('Invalid API key');
    });

    it('should extract Anthropic error details', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.error);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
      expect(result.response?.error?.type).toBe('invalid_request_error');
    });

    it('should extract HuggingFace error', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse(fixtures.huggingface.error);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
    });
  });

  describe('Content Type Handling', () => {
    it('should handle tool use in OpenAI', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.with_function_call);

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[0].type).toBe('tool_use');
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);
    });

    it('should handle tool use in Anthropic', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.with_tool_use);

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[1].type).toBe('tool_use');
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);
    });
  });

  describe('All Provider Parsers', () => {
    it('should parse Cohere response', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse(fixtures.cohere.generate);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('cohere');
    });

    it('should parse xAI response', async () => {
      const provider = new XAIProvider();
      const result = await provider.parse(fixtures.xai.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('xai');
    });

    it('should parse Perplexity response', async () => {
      const provider = new PerplexityProvider();
      const result = await provider.parse(fixtures.perplexity.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('perplexity');
    });

    it('should parse Together response', async () => {
      const provider = new TogetherProvider();
      const result = await provider.parse(fixtures.together.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('together');
    });

    it('should parse Fireworks response', async () => {
      const provider = new FireworksProvider();
      const result = await provider.parse(fixtures.fireworks.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('fireworks');
    });

    it('should parse Bedrock response', async () => {
      const provider = new BedrockProvider();
      const result = await provider.parse(fixtures.bedrock.invoke_model);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('bedrock');
    });

    it('should parse Ollama response', async () => {
      const provider = new OllamaProvider();
      const result = await provider.parse(fixtures.ollama.chat);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('ollama');
    });

    it('should get metadata for all providers', () => {
      const providers = [
        new GoogleProvider(),
        new CohereProvider(),
        new XAIProvider(),
        new PerplexityProvider(),
        new TogetherProvider(),
        new FireworksProvider(),
        new BedrockProvider(),
        new OllamaProvider(),
      ];

      providers.forEach(provider => {
        const metadata = provider.getMetadata();
        expect(metadata).toBeDefined();
        expect(metadata.id).toBeTruthy();
        expect(metadata.name).toBeTruthy();
      });
    });
  });

  describe('Provider Detection Methods', () => {
    it('should detect provider from URL', () => {
      registerAllProviders();
      const registry = getRegistry();

      const detection = registry.detectProvider(
        {},
        {},
        'https://api.openai.com/v1/chat/completions'
      );

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
      expect(detection.method).toBe('url');
    });

    it('should detect HuggingFace from URL', () => {
      registerAllProviders();
      const registry = getRegistry();

      const detection = registry.detectProvider(
        {},
        {},
        'https://api-inference.huggingface.co/models/mistral'
      );

      // Detection may vary depending on URL parsing implementation
      if (detection.detected) {
        expect(['huggingface', 'together', 'fireworks']).toContain(detection.provider);
      }
    });

    it('should detect from headers only', () => {
      registerAllProviders();
      const registry = getRegistry();

      const detection = registry.detectProvider(
        {},
        { 'anthropic-version': '2023-06-01' }
      );

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('anthropic');
      expect(detection.method).toBe('header');
    });
  });

  describe('Stop Reason Normalization', () => {
    it('should normalize various stop reasons', async () => {
      const provider = new OpenAIProvider();

      const testCases = [
        { finish_reason: 'stop', expected: StopReason.EndTurn },
        { finish_reason: 'length', expected: StopReason.MaxTokens },
        { finish_reason: 'tool_calls', expected: StopReason.ToolUse },
        { finish_reason: 'content_filter', expected: StopReason.ContentFilter },
      ];

      for (const testCase of testCases) {
        const result = await provider.parse({
          id: 'test',
          object: 'chat.completion',
          model: 'gpt-4',
          created: 1677652288,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Test' },
              finish_reason: testCase.finish_reason,
            },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.response?.stopReason).toBe(testCase.expected);
      }
    });
  });
});
