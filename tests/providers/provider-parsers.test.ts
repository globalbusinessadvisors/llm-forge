/**
 * Provider Parsers Tests
 *
 * Comprehensive tests for all LLM provider parsers
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
} from '../../src/providers/index.js';

import { Provider, StopReason, MessageRole } from '../../src/types/unified-response.js';

describe('Provider Parsers', () => {
  const fixturesPath = resolve(import.meta.dirname, '../fixtures/provider-responses.json');
  const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

  beforeEach(() => {
    ProviderRegistry.reset();
  });

  describe('OpenAI Provider', () => {
    it('should parse chat completion response', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response?.provider).toBe('openai');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.messages[0].role).toBe(MessageRole.Assistant);
      expect(result.response?.messages[0].content.length).toBeGreaterThan(0);
      expect(result.response?.usage.inputTokens).toBe(9);
      expect(result.response?.usage.outputTokens).toBe(12);
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });

    it('should parse function call response', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.with_function_call);

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content.length).toBe(1);
      expect(result.response?.messages[0].content[0].type).toBe('tool_use');
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);
    });

    it('should parse error response', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.error);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
      expect(result.response?.error?.code).toBe('invalid_api_key');
    });

    it('should get provider metadata', () => {
      const provider = new OpenAIProvider();
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('openai');
      expect(metadata.name).toBe('OpenAI');
      expect(metadata.capabilities.streaming).toBe(true);
      expect(metadata.capabilities.functionCalling).toBe(true);
      expect(metadata.models.length).toBeGreaterThan(0);
    });
  });

  describe('Anthropic Provider', () => {
    it('should parse message response', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.message);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('anthropic');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.messages[0].content[0].type).toBe('text');
      expect(result.response?.usage.inputTokens).toBe(10);
      expect(result.response?.usage.outputTokens).toBe(15);
    });

    it('should parse tool use response', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.with_tool_use);

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content.length).toBe(2);
      expect(result.response?.messages[0].content[1].type).toBe('tool_use');
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);
    });

    it('should parse error response', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.error);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
    });
  });

  describe('Mistral Provider', () => {
    it('should parse chat completion', async () => {
      const provider = new MistralProvider();
      const result = await provider.parse(fixtures.mistral.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('mistral');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.usage.totalTokens).toBe(18);
    });
  });

  describe('Google Provider', () => {
    it('should parse generate content response', async () => {
      const provider = new GoogleProvider();
      const result = await provider.parse(fixtures.google.generate_content);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('google');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.usage.inputTokens).toBe(5);
    });
  });

  describe('Cohere Provider', () => {
    it('should parse generate response', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse(fixtures.cohere.generate);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('cohere');
      expect(result.response?.messages[0].content[0].type).toBe('text');
    });
  });

  describe('xAI Provider', () => {
    it('should parse chat completion', async () => {
      const provider = new XAIProvider();
      const result = await provider.parse(fixtures.xai.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('xai');
      expect(result.response?.messages.length).toBe(1);
    });
  });

  describe('Perplexity Provider', () => {
    it('should parse chat completion', async () => {
      const provider = new PerplexityProvider();
      const result = await provider.parse(fixtures.perplexity.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('perplexity');
    });
  });

  describe('Together Provider', () => {
    it('should parse chat completion', async () => {
      const provider = new TogetherProvider();
      const result = await provider.parse(fixtures.together.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('together');
    });
  });

  describe('Fireworks Provider', () => {
    it('should parse chat completion', async () => {
      const provider = new FireworksProvider();
      const result = await provider.parse(fixtures.fireworks.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('fireworks');
    });
  });

  describe('Bedrock Provider', () => {
    it('should parse invoke model response', async () => {
      const provider = new BedrockProvider();
      const result = await provider.parse(fixtures.bedrock.invoke_model);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('bedrock');
    });
  });

  describe('Ollama Provider', () => {
    it('should parse chat response', async () => {
      const provider = new OllamaProvider();
      const result = await provider.parse(fixtures.ollama.chat);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('ollama');
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });
  });

  describe('Hugging Face Provider', () => {
    it('should parse text generation response', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse(fixtures.huggingface.text_generation);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('huggingface');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.messages[0].role).toBe(MessageRole.Assistant);
      expect(result.response?.usage.outputTokens).toBe(15);
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });

    it('should parse chat completion response', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse(fixtures.huggingface.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('huggingface');
      expect(result.response?.messages.length).toBe(1);
      expect(result.response?.model.id).toBe('mistralai/Mistral-7B-Instruct-v0.2');
      expect(result.response?.usage.inputTokens).toBe(10);
      expect(result.response?.usage.outputTokens).toBe(12);
    });

    it('should parse conversational response', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse(fixtures.huggingface.conversational);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('huggingface');
      expect(result.response?.messages.length).toBeGreaterThan(0);
    });

    it('should parse error response', async () => {
      const provider = new HuggingFaceProvider();
      const result = await provider.parse(fixtures.huggingface.error);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
    });
  });

  describe('Provider Registry', () => {
    it('should register all providers', () => {
      registerAllProviders();
      const registry = getRegistry();

      expect(registry.isRegistered('openai' as Provider)).toBe(true);
      expect(registry.isRegistered('anthropic' as Provider)).toBe(true);
      expect(registry.isRegistered('mistral' as Provider)).toBe(true);
      expect(registry.isRegistered('google' as Provider)).toBe(true);
      expect(registry.isRegistered('cohere' as Provider)).toBe(true);
      expect(registry.isRegistered('xai' as Provider)).toBe(true);
      expect(registry.isRegistered('perplexity' as Provider)).toBe(true);
      expect(registry.isRegistered('together' as Provider)).toBe(true);
      expect(registry.isRegistered('fireworks' as Provider)).toBe(true);
      expect(registry.isRegistered('bedrock' as Provider)).toBe(true);
      expect(registry.isRegistered('ollama' as Provider)).toBe(true);
      expect(registry.isRegistered('huggingface' as Provider)).toBe(true);
    });

    it('should get all registered providers', () => {
      registerAllProviders();
      const registry = getRegistry();
      const providers = registry.getProviders();

      expect(providers.length).toBe(12);
    });

    it('should get provider metadata', () => {
      registerAllProviders();
      const registry = getRegistry();
      const metadata = registry.getMetadata('openai' as Provider);

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('OpenAI');
    });

    it('should detect OpenAI from response format', () => {
      registerAllProviders();
      const registry = getRegistry();
      const detection = registry.detectProvider(fixtures.openai.chat_completion);

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
    });

    it('should detect Anthropic from response format', () => {
      registerAllProviders();
      const registry = getRegistry();
      const detection = registry.detectProvider(fixtures.anthropic.message);

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('anthropic');
    });

    it('should detect provider from URL', () => {
      registerAllProviders();
      const registry = getRegistry();
      const detection = registry.detectProvider({}, {}, 'https://api.openai.com/v1/chat/completions');

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
    });

    it('should detect provider from headers', () => {
      registerAllProviders();
      const registry = getRegistry();
      const detection = registry.detectProvider({}, { 'openai-version': '2023-11-01' });

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
    });

    it('should parse with automatic provider detection', async () => {
      registerAllProviders();
      const registry = getRegistry();
      const result = await registry.parse(fixtures.openai.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('openai');
    });

    it('should parse with explicit provider', async () => {
      registerAllProviders();
      const registry = getRegistry();
      const result = await registry.parse(
        fixtures.anthropic.message,
        'anthropic' as Provider
      );

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('anthropic');
    });

    it('should handle unregistered provider', async () => {
      const registry = getRegistry();
      const result = await registry.parse({}, 'unknown' as Provider);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid response structure', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({ invalid: 'response' });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle null response', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(null);

      expect(result.success).toBe(false);
    });

    it('should handle undefined response', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(undefined);

      expect(result.success).toBe(false);
    });
  });

  describe('Message Normalization', () => {
    it('should normalize role names', async () => {
      const provider = new GoogleProvider();
      const result = await provider.parse(fixtures.google.generate_content);

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].role).toBe(MessageRole.Assistant);
    });

    it('should normalize stop reasons', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.chat_completion);

      expect(result.success).toBe(true);
      expect(result.response?.stopReason).toBeDefined();
    });
  });

  describe('Token Usage', () => {
    it('should extract token usage from OpenAI', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.chat_completion);

      expect(result.response?.usage.inputTokens).toBe(9);
      expect(result.response?.usage.outputTokens).toBe(12);
      expect(result.response?.usage.totalTokens).toBe(21);
    });

    it('should extract token usage from Anthropic', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse(fixtures.anthropic.message);

      expect(result.response?.usage.inputTokens).toBe(10);
      expect(result.response?.usage.outputTokens).toBe(15);
      expect(result.response?.usage.totalTokens).toBe(25);
    });

    it('should calculate total tokens from input + output', async () => {
      const provider = new BedrockProvider();
      const result = await provider.parse(fixtures.bedrock.invoke_model);

      expect(result.response?.usage.totalTokens).toBe(
        result.response?.usage.inputTokens + result.response?.usage.outputTokens
      );
    });
  });

  describe('Content Types', () => {
    it('should handle text content', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.chat_completion);

      expect(result.response?.messages[0].content[0].type).toBe('text');
    });

    it('should handle tool use content', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.with_function_call);

      expect(result.response?.messages[0].content[0].type).toBe('tool_use');
    });

    it('should extract tool call parameters', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse(fixtures.openai.with_function_call);

      const toolContent = result.response?.messages[0].content[0];
      if (toolContent?.type === 'tool_use') {
        expect(toolContent.name).toBe('get_weather');
        expect(toolContent.input).toBeDefined();
      }
    });
  });
});
