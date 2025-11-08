/**
 * finish_reason/stop_reason Handling Test Suite
 *
 * Comprehensive tests for enterprise-grade finish_reason handling:
 * - StopReason enum completeness
 * - Provider-specific mappings
 * - Metadata preservation
 * - Validation and warnings
 * - Edge cases and unknown values
 * - Backward compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StopReason } from '../../src/types/unified-response.js';
import { OpenAIProvider } from '../../src/providers/openai-provider.js';
import { AnthropicProvider } from '../../src/providers/anthropic-provider.js';
import { HuggingFaceProvider } from '../../src/providers/huggingface-provider.js';
import { ReplicateProvider } from '../../src/providers/replicate-provider.js';
import { MistralProvider } from '../../src/providers/mistral-provider.js';
import { GoogleProvider, CohereProvider, TogetherProvider } from '../../src/providers/all-providers.js';

describe('finish_reason/stop_reason Handling', () => {
  describe('StopReason Enum', () => {
    it('should have all required enum values', () => {
      expect(StopReason.EndTurn).toBe('end_turn');
      expect(StopReason.MaxTokens).toBe('max_tokens');
      expect(StopReason.ContextLength).toBe('context_length');
      expect(StopReason.StopSequence).toBe('stop_sequence');
      expect(StopReason.ToolUse).toBe('tool_use');
      expect(StopReason.ContentFilter).toBe('content_filter');
      expect(StopReason.Recitation).toBe('recitation');
      expect(StopReason.Error).toBe('error');
      expect(StopReason.Canceled).toBe('canceled');
      expect(StopReason.Unknown).toBe('unknown');
    });

    it('should have backward compatibility values', () => {
      expect(StopReason.Length).toBe('length');
      expect(StopReason.FunctionCall).toBe('function_call');
    });
  });

  describe('OpenAI Provider Mappings', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider();
    });

    it('should map "stop" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('stop');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.originalValue).toBe('stop');
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "length" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('length');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "tool_calls" to ToolUse', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('tool_calls');
      expect(result.stopReason).toBe(StopReason.ToolUse);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "content_filter" to ContentFilter', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('content_filter');
      expect(result.stopReason).toBe(StopReason.ContentFilter);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "function_call" to ToolUse', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('function_call');
      expect(result.stopReason).toBe(StopReason.ToolUse);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should handle null finish_reason', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata(undefined);
      expect(result.stopReason).toBe(StopReason.Unknown);
      expect(result.metadata.originalValue).toBeNull();
      expect(result.metadata.wasRecognized).toBe(true);
    });
  });

  describe('Anthropic Provider Mappings', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider();
    });

    it('should map "end_turn" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('end_turn');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "max_tokens" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('max_tokens');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });

    it('should map "stop_sequence" to StopSequence', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('stop_sequence');
      expect(result.stopReason).toBe(StopReason.StopSequence);
    });

    it('should map "tool_use" to ToolUse', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('tool_use');
      expect(result.stopReason).toBe(StopReason.ToolUse);
    });
  });

  describe('Google Gemini Provider Mappings', () => {
    let provider: GoogleProvider;

    beforeEach(() => {
      provider = new GoogleProvider();
    });

    it('should map "STOP" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('STOP');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "MAX_TOKENS" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('MAX_TOKENS');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });

    it('should map "SAFETY" to ContentFilter', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('SAFETY');
      expect(result.stopReason).toBe(StopReason.ContentFilter);
    });

    it('should map "RECITATION" to Recitation', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('RECITATION');
      expect(result.stopReason).toBe(StopReason.Recitation);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "OTHER" to Unknown', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('OTHER');
      expect(result.stopReason).toBe(StopReason.Unknown);
      expect(result.metadata.wasRecognized).toBe(true);
    });
  });

  describe('Cohere Provider Mappings', () => {
    let provider: CohereProvider;

    beforeEach(() => {
      provider = new CohereProvider();
    });

    it('should map "COMPLETE" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('COMPLETE');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "MAX_TOKENS" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('MAX_TOKENS');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });

    it('should map "ERROR" to Error', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('ERROR');
      expect(result.stopReason).toBe(StopReason.Error);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "ERROR_TOXIC" to ContentFilter', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('ERROR_TOXIC');
      expect(result.stopReason).toBe(StopReason.ContentFilter);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });
  });

  describe('Together.ai Provider Mappings', () => {
    let provider: TogetherProvider;

    beforeEach(() => {
      provider = new TogetherProvider();
    });

    it('should map "eos" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('eos');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "stop" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('stop');
      expect(result.stopReason).toBe(StopReason.EndTurn);
    });

    it('should map "length" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('length');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });
  });

  describe('HuggingFace Provider Mappings', () => {
    let provider: HuggingFaceProvider;

    beforeEach(() => {
      provider = new HuggingFaceProvider();
    });

    it('should map "eos_token" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('eos_token');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "stop" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('stop');
      expect(result.stopReason).toBe(StopReason.EndTurn);
    });

    it('should map "length" to MaxTokens', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('length');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });
  });

  describe('Mistral Provider Mappings', () => {
    let provider: MistralProvider;

    beforeEach(() => {
      provider = new MistralProvider();
    });

    it('should map "model_length" to ContextLength', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('model_length');
      expect(result.stopReason).toBe(StopReason.ContextLength);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "length" to MaxTokens (not context)', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('length');
      expect(result.stopReason).toBe(StopReason.MaxTokens);
    });

    it('should map "tool_calls" to ToolUse', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('tool_calls');
      expect(result.stopReason).toBe(StopReason.ToolUse);
    });
  });

  describe('Replicate Provider Mappings', () => {
    let provider: ReplicateProvider;

    beforeEach(() => {
      provider = new ReplicateProvider();
    });

    it('should map "succeeded" to EndTurn', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('succeeded');
      expect(result.stopReason).toBe(StopReason.EndTurn);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "failed" to Error', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('failed');
      expect(result.stopReason).toBe(StopReason.Error);
      expect(result.metadata.wasRecognized).toBe(true);
    });

    it('should map "canceled" to Canceled', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('canceled');
      expect(result.stopReason).toBe(StopReason.Canceled);
      expect(result.metadata.wasRecognized).toBe(true);
      expect(result.metadata.mappingConfidence).toBe('high');
    });

    it('should map "aborted" to Canceled', () => {
      const result = (provider as any).normalizeStopReasonWithMetadata('aborted');
      expect(result.stopReason).toBe(StopReason.Canceled);
      expect(result.metadata.wasRecognized).toBe(true);
    });
  });

  describe('Metadata Preservation', () => {
    it('should preserve original value', () => {
      const provider = new OpenAIProvider();
      const result = (provider as any).normalizeStopReasonWithMetadata('custom_stop_value');

      expect(result.metadata.originalValue).toBe('custom_stop_value');
    });

    it('should indicate unknown values correctly', () => {
      const provider = new OpenAIProvider();
      const result = (provider as any).normalizeStopReasonWithMetadata('completely_unknown');

      expect(result.stopReason).toBe(StopReason.Unknown);
      expect(result.metadata.wasRecognized).toBe(false);
      expect(result.metadata.mappingConfidence).toBe('low');
    });

    it('should differentiate confidence levels', () => {
      const provider = new OpenAIProvider();

      // High confidence - exact match
      const exact = (provider as any).normalizeStopReasonWithMetadata('stop');
      expect(exact.metadata.mappingConfidence).toBe('high');

      // Medium confidence - keyword match
      const fuzzy = (provider as any).normalizeStopReasonWithMetadata('custom_stop_marker');
      expect(fuzzy.metadata.mappingConfidence).toBe('medium');

      // Low confidence - unknown
      const unknown = (provider as any).normalizeStopReasonWithMetadata('xyz123');
      expect(unknown.metadata.mappingConfidence).toBe('low');
    });
  });

  describe('Validation and Warnings', () => {
    it('should generate warning for unknown value', () => {
      const provider = new OpenAIProvider();
      (provider as any).validateFinishReason('invalid_value');

      const warnings = (provider as any).warnings;
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('Unexpected finish_reason');
      expect(warnings[0]).toContain('invalid_value');
    });

    it('should not warn for known values', () => {
      const provider = new OpenAIProvider();
      (provider as any).validateFinishReason('stop');
      (provider as any).validateFinishReason('length');
      (provider as any).validateFinishReason('tool_calls');

      const warnings = (provider as any).warnings;
      expect(warnings.length).toBe(0);
    });

    it('should list known values in warning', () => {
      const provider = new OpenAIProvider();
      (provider as any).validateFinishReason('unknown_value');

      const warnings = (provider as any).warnings;
      expect(warnings[0]).toContain('Known values:');
      expect(warnings[0]).toContain('stop');
      expect(warnings[0]).toContain('length');
    });
  });

  describe('Edge Cases', () => {
    it('should handle case variations', () => {
      const provider = new GoogleProvider();

      const lower = (provider as any).normalizeStopReasonWithMetadata('stop');
      const upper = (provider as any).normalizeStopReasonWithMetadata('STOP');
      const mixed = (provider as any).normalizeStopReasonWithMetadata('Stop');

      expect(lower.stopReason).toBe(StopReason.EndTurn);
      expect(upper.stopReason).toBe(StopReason.EndTurn);
      expect(mixed.stopReason).toBe(StopReason.EndTurn);
    });

    it('should handle underscores and hyphens', () => {
      const provider = new OpenAIProvider();

      const underscore = (provider as any).normalizeStopReasonWithMetadata('end_turn');
      const hyphen = (provider as any).normalizeStopReasonWithMetadata('end-turn');
      const none = (provider as any).normalizeStopReasonWithMetadata('endturn');

      expect(underscore.stopReason).toBe(StopReason.EndTurn);
      expect(hyphen.stopReason).toBe(StopReason.EndTurn);
      expect(none.stopReason).toBe(StopReason.EndTurn);
    });

    it('should handle empty string', () => {
      const provider = new OpenAIProvider();
      const result = (provider as any).normalizeStopReasonWithMetadata('');

      expect(result.stopReason).toBe(StopReason.Unknown);
      expect(result.metadata.originalValue).toBeNull();
    });

    it('should handle whitespace', () => {
      const provider = new OpenAIProvider();
      const result = (provider as any).normalizeStopReasonWithMetadata('  stop  ');

      // Should handle whitespace gracefully
      expect(result.stopReason).toBeDefined();
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match values containing keywords', () => {
      const provider = new OpenAIProvider();

      const customStop = (provider as any).normalizeStopReasonWithMetadata('custom_stop_marker');
      expect(customStop.stopReason).toBe(StopReason.EndTurn);
      expect(customStop.metadata.mappingConfidence).toBe('medium');

      const customTool = (provider as any).normalizeStopReasonWithMetadata('needs_tool_call');
      expect(customTool.stopReason).toBe(StopReason.ToolUse);
      expect(customTool.metadata.mappingConfidence).toBe('medium');
    });

    it('should prioritize exact matches over fuzzy', () => {
      const provider = new OpenAIProvider();

      const exact = (provider as any).normalizeStopReasonWithMetadata('stop');
      expect(exact.metadata.mappingConfidence).toBe('high');

      const fuzzy = (provider as any).normalizeStopReasonWithMetadata('stopped');
      expect(fuzzy.metadata.mappingConfidence).toBe('medium');
    });
  });

  describe('Backward Compatibility', () => {
    it('should still accept deprecated Length enum', () => {
      expect(StopReason.Length).toBeDefined();
      expect(StopReason.Length).toBe('length');
    });

    it('should still accept deprecated FunctionCall enum', () => {
      expect(StopReason.FunctionCall).toBeDefined();
      expect(StopReason.FunctionCall).toBe('function_call');
    });

    it('should maintain existing behavior for old code', () => {
      const provider = new OpenAIProvider();

      // Old code using normalizeStopReason (without metadata)
      const oldResult = (provider as any).normalizeStopReason('stop');
      expect(oldResult).toBe(StopReason.EndTurn);

      // Should work identically to before
      expect(typeof oldResult).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should work with real OpenAI response structure', async () => {
      const provider = new OpenAIProvider();
      const response = {
        id: 'test-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const result = await provider.parse(response);

      expect(result.success).toBe(true);
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });

    it('should work with real Anthropic response structure', async () => {
      const provider = new AnthropicProvider();
      const response = {
        id: 'msg_test123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Hello!',
          },
        ],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      };

      const result = await provider.parse(response);

      expect(result.success).toBe(true);
      expect(result.response?.stopReason).toBe(StopReason.EndTurn);
    });
  });
});
