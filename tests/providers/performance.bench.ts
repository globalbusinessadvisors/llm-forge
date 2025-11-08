/**
 * Performance Benchmarks
 *
 * Measures provider detection and parsing performance
 * Run with: npm run bench
 */

import { bench, describe } from 'vitest';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import {
  parseResponse,
  registerAllProviders,
  getRegistry,
  OpenAIProvider,
  AnthropicProvider,
  MistralProvider,
  ProviderRegistry,
} from '../../src/providers/index.js';
import { Provider } from '../../src/types/unified-response.js';

// Load fixtures once
const fixturesPath = resolve(import.meta.dirname, '../fixtures/provider-responses.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Setup
ProviderRegistry.reset();
registerAllProviders();
const registry = getRegistry();

describe('Provider Detection Performance', () => {
  bench('detect OpenAI from response structure', () => {
    registry.detectProvider(fixtures.openai.chat_completion);
  });

  bench('detect Anthropic from response structure', () => {
    registry.detectProvider(fixtures.anthropic.message);
  });

  bench('detect from headers', () => {
    registry.detectProvider({}, { 'openai-version': '2023-11-01' });
  });

  bench('detect from URL', () => {
    registry.detectProvider({}, {}, 'https://api.anthropic.com/v1/messages');
  });

  bench('detect from model name', () => {
    registry.detectProvider({ model: 'gpt-4-turbo' });
  });
});

describe('Response Parsing Performance', () => {
  bench('parse OpenAI response (auto-detect)', async () => {
    await parseResponse(fixtures.openai.chat_completion);
  });

  bench('parse OpenAI response (explicit provider)', async () => {
    await parseResponse(fixtures.openai.chat_completion, 'openai' as Provider);
  });

  bench('parse Anthropic response (auto-detect)', async () => {
    await parseResponse(fixtures.anthropic.message);
  });

  bench('parse Anthropic response (explicit provider)', async () => {
    await parseResponse(fixtures.anthropic.message, 'anthropic' as Provider);
  });

  bench('parse Mistral response', async () => {
    await parseResponse(fixtures.mistral.chat_completion, 'mistral' as Provider);
  });

  bench('parse Google response', async () => {
    await parseResponse(fixtures.google.generate_content, 'google' as Provider);
  });
});

describe('Provider Instance Performance', () => {
  const openaiProvider = new OpenAIProvider();
  const anthropicProvider = new AnthropicProvider();
  const mistralProvider = new MistralProvider();

  bench('OpenAI direct parse', async () => {
    await openaiProvider.parse(fixtures.openai.chat_completion);
  });

  bench('Anthropic direct parse', async () => {
    await anthropicProvider.parse(fixtures.anthropic.message);
  });

  bench('Mistral direct parse', async () => {
    await mistralProvider.parse(fixtures.mistral.chat_completion);
  });
});

describe('Complex Response Parsing', () => {
  bench('parse OpenAI with function calls', async () => {
    await parseResponse(fixtures.openai.with_function_call, 'openai' as Provider);
  });

  bench('parse Anthropic with tool use', async () => {
    await parseResponse(fixtures.anthropic.with_tool_use, 'anthropic' as Provider);
  });

  bench('parse error response', async () => {
    await parseResponse(fixtures.openai.error, 'openai' as Provider);
  });
});

describe('Multi-Provider Batch Processing', () => {
  const responses = [
    { data: fixtures.openai.chat_completion, provider: 'openai' as Provider },
    { data: fixtures.anthropic.message, provider: 'anthropic' as Provider },
    { data: fixtures.mistral.chat_completion, provider: 'mistral' as Provider },
    { data: fixtures.google.generate_content, provider: 'google' as Provider },
  ];

  bench('process 4 different provider responses', async () => {
    await Promise.all(responses.map(({ data, provider }) => parseResponse(data, provider)));
  });

  bench('process 4 different provider responses sequentially', async () => {
    for (const { data, provider } of responses) {
      await parseResponse(data, provider);
    }
  });
});

describe('Streaming Performance', () => {
  const openaiProvider = new OpenAIProvider();
  const anthropicProvider = new AnthropicProvider();

  bench('OpenAI stream chunk parsing', async () => {
    await openaiProvider.parseStream({
      id: 'chatcmpl-123',
      object: 'chat.completion.chunk',
      created: 1677652288,
      model: 'gpt-4',
      choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: null }],
    });
  });

  bench('Anthropic stream chunk parsing', async () => {
    await anthropicProvider.parseStream({
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'Hello' },
    });
  });
});

describe('Validation Performance', () => {
  const openaiProvider = new OpenAIProvider();

  bench('validate valid OpenAI response', async () => {
    await openaiProvider.parse(fixtures.openai.chat_completion);
  });

  bench('validate invalid response', async () => {
    await openaiProvider.parse({});
  });

  bench('validate malformed response', async () => {
    await openaiProvider.parse({ id: 'test' });
  });
});

describe('Metadata Operations', () => {
  bench('get provider metadata', () => {
    registry.getMetadata('openai' as Provider);
  });

  bench('get all providers list', () => {
    registry.getProviders();
  });

  bench('get all metadata', () => {
    registry.getAllMetadata();
  });

  bench('check provider registration', () => {
    registry.isRegistered('openai' as Provider);
  });
});

describe('Large Response Handling', () => {
  // Simulate large response
  const largeResponse = {
    id: 'test',
    object: 'chat.completion',
    model: 'gpt-4',
    created: 1677652288,
    choices: Array.from({ length: 100 }, (_, i) => ({
      index: i,
      message: {
        role: 'assistant',
        content: 'A'.repeat(1000), // 1KB per message
      },
      finish_reason: 'stop',
    })),
    usage: { prompt_tokens: 100, completion_tokens: 100000, total_tokens: 100100 },
  };

  bench('parse large response (100 messages, 100KB)', async () => {
    await parseResponse(largeResponse, 'openai' as Provider);
  });
});
