/**
 * Integration Tests
 *
 * End-to-end integration tests with real API response examples
 * Tests the complete workflow from response parsing to unified format
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import {
  parseResponse,
  registerAllProviders,
  getRegistry,
  ProviderRegistry,
} from '../../src/providers/index.js';
import { Provider, StopReason } from '../../src/types/unified-response.js';

describe('Integration Tests - Real API Responses', () => {
  const fixturesPath = resolve(import.meta.dirname, '../fixtures/provider-responses.json');
  const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

  beforeEach(() => {
    ProviderRegistry.reset();
    registerAllProviders();
  });

  describe('OpenAI Integration', () => {
    it('should parse real OpenAI chat completion end-to-end', async () => {
      const response = fixtures.openai.chat_completion;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('openai');
      expect(result.response?.model.id).toBe('gpt-4');
      expect(result.response?.messages).toHaveLength(1);
      expect(result.response?.messages[0].content).toHaveLength(1);
      expect(result.response?.messages[0].content[0].type).toBe('text');
      expect(result.response?.usage.totalTokens).toBeGreaterThan(0);
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });

    it('should parse OpenAI function call response', async () => {
      const response = fixtures.openai.with_function_call;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);
      expect(result.response?.messages[0].content[0].type).toBe('tool_use');

      const toolUse = result.response?.messages[0].content[0];
      if (toolUse?.type === 'tool_use') {
        expect(toolUse.id).toBeDefined();
        expect(toolUse.name).toBeDefined();
        expect(toolUse.input).toBeDefined();
      }
    });

    it('should handle OpenAI error response', async () => {
      const response = fixtures.openai.error;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
      expect(result.response?.error?.code).toBe('invalid_api_key');
      expect(result.response?.error?.type).toBe('invalid_request_error');
    });
  });

  describe('Anthropic Integration', () => {
    it('should parse real Anthropic message end-to-end', async () => {
      const response = fixtures.anthropic.message;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('anthropic');
      expect(result.response?.model.id).toContain('claude');
      expect(result.response?.messages).toHaveLength(1);
      expect(result.response?.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should parse Anthropic tool use response', async () => {
      const response = fixtures.anthropic.with_tool_use;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.stopReason).toBe(StopReason.ToolUse);

      // Should have both text and tool_use content
      const contents = result.response?.messages[0].content;
      expect(contents?.some(c => c.type === 'text')).toBe(true);
      expect(contents?.some(c => c.type === 'tool_use')).toBe(true);
    });

    it('should handle Anthropic error response', async () => {
      const response = fixtures.anthropic.error;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeDefined();
    });
  });

  describe('Provider Auto-Detection Integration', () => {
    it('should auto-detect OpenAI from response structure', async () => {
      const response = fixtures.openai.chat_completion;
      const result = await parseResponse(response); // No explicit provider

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('openai');
    });

    it('should auto-detect Anthropic from response structure', async () => {
      const response = fixtures.anthropic.message;
      const result = await parseResponse(response);

      expect(result.success).toBe(true);
      expect(result.response?.provider).toBe('anthropic');
    });

    it('should detect provider from headers', async () => {
      const registry = getRegistry();
      const response = {};
      const headers = { 'openai-version': '2023-11-01' };

      const detection = registry.detectProvider(response, headers);

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('openai');
      expect(detection.method).toBe('header');
    });

    it('should detect provider from URL', async () => {
      const registry = getRegistry();
      const response = {};
      const url = 'https://api.anthropic.com/v1/messages';

      const detection = registry.detectProvider(response, {}, url);

      expect(detection.detected).toBe(true);
      expect(detection.provider).toBe('anthropic');
      expect(detection.method).toBe('url');
    });
  });

  describe('Multi-Provider Integration', () => {
    it('should parse responses from all major providers', async () => {
      const providerTests = [
        { name: 'OpenAI', fixture: fixtures.openai.chat_completion, provider: 'openai' as Provider },
        { name: 'Anthropic', fixture: fixtures.anthropic.message, provider: 'anthropic' as Provider },
        { name: 'Cohere', fixture: fixtures.cohere.generate, provider: 'cohere' as Provider },
        { name: 'Mistral', fixture: fixtures.mistral.chat_completion, provider: 'mistral' as Provider },
        { name: 'Google', fixture: fixtures.google.generate_content, provider: 'google' as Provider },
        { name: 'xAI', fixture: fixtures.xai.chat_completion, provider: 'xai' as Provider },
        { name: 'Perplexity', fixture: fixtures.perplexity.chat_completion, provider: 'perplexity' as Provider },
        { name: 'Together', fixture: fixtures.together.chat_completion, provider: 'together' as Provider },
        { name: 'Fireworks', fixture: fixtures.fireworks.chat_completion, provider: 'fireworks' as Provider },
        { name: 'Bedrock', fixture: fixtures.bedrock.invoke_model, provider: 'bedrock' as Provider },
        { name: 'Ollama', fixture: fixtures.ollama.chat, provider: 'ollama' as Provider },
        { name: 'HuggingFace', fixture: fixtures.huggingface.text_generation, provider: 'huggingface' as Provider },
      ];

      for (const test of providerTests) {
        // Parse with explicit provider to ensure correct parser is used
        const result = await parseResponse(test.fixture, test.provider);

        expect(result.success, `${test.name} parsing should succeed`).toBe(true);
        expect(result.response?.provider, `${test.name} provider should match`).toBe(test.provider);
        expect(result.response?.messages, `${test.name} should have messages`).toBeDefined();
        expect(result.response?.usage, `${test.name} should have usage`).toBeDefined();
      }
    });
  });

  describe('Unified Format Consistency', () => {
    it('should normalize all providers to consistent message format', async () => {
      const providers = [
        fixtures.openai.chat_completion,
        fixtures.anthropic.message,
        fixtures.mistral.chat_completion,
      ];

      for (const fixture of providers) {
        const result = await parseResponse(fixture);

        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();

        // All should have consistent structure
        expect(result.response).toHaveProperty('id');
        expect(result.response).toHaveProperty('provider');
        expect(result.response).toHaveProperty('model');
        expect(result.response).toHaveProperty('messages');
        expect(result.response).toHaveProperty('stopReason');
        expect(result.response).toHaveProperty('usage');
        expect(result.response).toHaveProperty('metadata');

        // Messages should have consistent format
        expect(result.response?.messages[0]).toHaveProperty('role');
        expect(result.response?.messages[0]).toHaveProperty('content');
        expect(Array.isArray(result.response?.messages[0].content)).toBe(true);

        // Usage should have consistent format
        expect(result.response?.usage).toHaveProperty('inputTokens');
        expect(result.response?.usage).toHaveProperty('outputTokens');
        expect(result.response?.usage).toHaveProperty('totalTokens');
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle provider errors', async () => {
      const errorTests = [
        { fixture: fixtures.openai.error, provider: 'openai' as Provider },
        { fixture: fixtures.anthropic.error, provider: 'anthropic' as Provider },
        { fixture: fixtures.huggingface.error, provider: 'huggingface' as Provider },
      ];

      for (const { fixture, provider } of errorTests) {
        const result = await parseResponse(fixture, provider);

        expect(result.success).toBe(true); // Errors are valid responses
        expect(result.response?.error).toBeDefined();
        expect(result.response?.error?.message).toBeDefined();
      }
    });
  });

  describe('Production Workflow Simulation', () => {
    it('should handle complete request-response lifecycle', async () => {
      // Simulate a production workflow
      const registry = getRegistry();

      // 1. Receive response from API
      const apiResponse = fixtures.openai.chat_completion;

      // 2. Parse with auto-detection
      const parseResult = await registry.parse(apiResponse);
      expect(parseResult.success).toBe(true);

      // 3. Extract and use data
      const message = parseResult.response?.messages[0];
      const textContent = message?.content.find(c => c.type === 'text');
      expect(textContent).toBeDefined();

      // 4. Track token usage
      const tokens = parseResult.response?.usage;
      expect(tokens?.totalTokens).toBeGreaterThan(0);

      // 5. Check for errors
      expect(parseResult.response?.error).toBeUndefined();
    });

    it('should support provider switching', async () => {
      // Simulate switching between providers
      const responses = [
        { data: fixtures.openai.chat_completion, expected: 'openai' as Provider },
        { data: fixtures.anthropic.message, expected: 'anthropic' as Provider },
        { data: fixtures.mistral.chat_completion, expected: 'mistral' as Provider },
      ];

      for (const { data, expected } of responses) {
        const result = await parseResponse(data, expected); // Explicit provider

        expect(result.success).toBe(true);
        expect(result.response?.provider).toBe(expected);

        // All should return valid text content
        const textContent = result.response?.messages[0].content.find(c => c.type === 'text');
        expect(textContent).toBeDefined();
      }
    });
  });
});
