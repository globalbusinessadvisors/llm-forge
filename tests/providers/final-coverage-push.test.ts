/**
 * Final Coverage Push Tests
 *
 * Highly targeted tests to reach 95%+ coverage
 */

import { describe, it, expect } from 'vitest';
import {
  AnthropicProvider,
  CohereProvider,
  OllamaProvider,
} from '../../src/providers/index.js';

describe('Final Coverage Push', () => {
  describe('Anthropic Cache Metadata', () => {
    it('should extract cache metadata when present', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 25,
          cache_read_input_tokens: 10,
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.usage.metadata?.cacheCreationInputTokens).toBe(25);
      expect(result.response?.usage.metadata?.cacheReadInputTokens).toBe(10);
    });

    it('should handle cache_creation_input_tokens only', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 30,
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.usage.metadata?.cacheCreationInputTokens).toBe(30);
    });

    it('should handle cache_read_input_tokens only', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 15,
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.usage.metadata?.cacheReadInputTokens).toBe(15);
    });
  });

  describe('Anthropic Error Extraction', () => {
    it('should not extract error from non-error response', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        id: 'msg_123',
        type: 'message', // Not 'error'
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeUndefined();
    });
  });

  describe('Cohere Error Extraction', () => {
    it('should not extract error when text field is present', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse({
        id: 'test',
        text: 'Hello world',
        generation_id: 'gen-1',
        finish_reason: 'COMPLETE',
        prompt: 'test',
        message: 'Some message', // Has message but also has text
      });

      // Should parse successfully - message is ignored when text is present
      expect(result.success).toBe(true);
    });

    it('should not extract error when message field is missing', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse({
        id: 'test',
        text: 'Hello',
        generation_id: 'gen-1',
        finish_reason: 'COMPLETE',
        prompt: 'test',
        // No message field
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeUndefined();
    });
  });

  describe('Ollama Error Extraction Coverage', () => {
    it('should return undefined error when no error field', async () => {
      const provider = new OllamaProvider();
      const result = await provider.parse({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Hi' },
        done: true,
        // No error field
      });

      expect(result.success).toBe(true);
      expect(result.response?.error).toBeUndefined();
    });
  });

  describe('Cohere Streaming Variations', () => {
    it('should handle Cohere stream chunk with event_type', async () => {
      const provider = new CohereProvider();
      const result = await provider.parseStream({
        event_type: 'text-generation',
        text: 'streaming text',
      });

      expect(result.success).toBe(true);
    });

    it('should handle Cohere stream chunk with just text', async () => {
      const provider = new CohereProvider();
      const result = await provider.parseStream({
        text: 'simple stream',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Anthropic Streaming Variations', () => {
    it('should handle content_block_start event', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parseStream({
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: '',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle content_block_stop event', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parseStream({
        type: 'content_block_stop',
        index: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should handle message_start event', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parseStream({
        type: 'message_start',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'claude-3-opus',
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle message_delta event', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parseStream({
        type: 'message_delta',
        delta: {
          stop_reason: 'end_turn',
        },
        usage: {
          output_tokens: 50,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Cohere Model and Usage Defaults', () => {
    it('should use default model when model field is missing', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse({
        id: 'test',
        text: 'Hello',
        generation_id: 'gen-1',
        finish_reason: 'COMPLETE',
        // No model field - should default to 'command-r-plus'
      });

      expect(result.success).toBe(true);
      expect(result.response?.model.id).toBe('command-r-plus');
    });

    it('should handle missing meta and tokens in usage', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse({
        id: 'test',
        text: 'Hello',
        generation_id: 'gen-1',
        finish_reason: 'COMPLETE',
        // No meta or tokens field
      });

      expect(result.success).toBe(true);
      expect(result.response?.usage.inputTokens).toBe(0);
      expect(result.response?.usage.outputTokens).toBe(0);
    });

    it('should handle meta without tokens', async () => {
      const provider = new CohereProvider();
      const result = await provider.parse({
        id: 'test',
        text: 'Hello',
        generation_id: 'gen-1',
        finish_reason: 'COMPLETE',
        meta: {
          // No tokens field
        },
      });

      expect(result.success).toBe(true);
      expect(result.response?.usage.totalTokens).toBe(0);
    });
  });

  describe('Base Provider Role Normalization Edge Cases', () => {
    it('should handle tool role in Anthropic responses', async () => {
      const provider = new AnthropicProvider();
      const result = await provider.parse({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_123',
            content: 'Result',
          },
        ],
        model: 'claude-3-opus',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Ollama Response Format Alternative', () => {
    it('should handle Ollama response with obj.response instead of message.content', async () => {
      const provider = new OllamaProvider();
      const result = await provider.parse({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Direct response text',
        done: true,
        // Has 'response' field instead of 'message.content'
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].content[0]).toMatchObject({
        type: 'text',
        text: 'Direct response text',
      });
    });
  });
});

