/**
 * Role Normalization Edge Case Tests
 *
 * Tests for uncovered role normalization cases in base provider
 */

import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../../src/providers/index.js';

describe('Role Normalization Edge Cases', () => {
  describe('Tool Role', () => {
    it('should normalize tool role correctly', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'tool',
              content: 'Tool result',
              tool_call_id: 'call_123',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].role).toBe('tool');
    });
  });

  describe('Function Role', () => {
    it('should normalize function role correctly', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'function',
              content: 'Function result',
              name: 'my_function',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].role).toBe('function');
    });
  });

  describe('Unknown Role', () => {
    it('should handle unknown role and default to user with warning', async () => {
      const provider = new OpenAIProvider();
      const result = await provider.parse({
        id: 'test',
        object: 'chat.completion',
        model: 'gpt-4',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'unknown_role',
              content: 'Test',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      expect(result.success).toBe(true);
      expect(result.response?.messages[0].role).toBe('user');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
