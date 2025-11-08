/**
 * Replicate Provider Tests
 *
 * Comprehensive test suite for Replicate provider implementation.
 * Tests standard responses, streaming, error handling, and provider detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReplicateProvider } from '../../src/providers/replicate-provider.js';
import { StopReason } from '../../src/types/unified-response.js';

describe('ReplicateProvider', () => {
  let provider: ReplicateProvider;

  beforeEach(() => {
    provider = new ReplicateProvider();
  });

  describe('Provider Metadata', () => {
    it('should have correct metadata', () => {
      const metadata = provider.getMetadata();

      expect(metadata.id).toBe('replicate');
      expect(metadata.name).toBe('Replicate');
      expect(metadata.apiVersion).toBe('v1');
      expect(metadata.baseUrl).toBe('https://api.replicate.com/v1');
      expect(metadata.authenticationType).toBe('api_key');
    });

    it('should report streaming as supported', () => {
      const metadata = provider.getMetadata();

      expect(metadata.capabilities.streaming).toBe(true);
    });

    it('should report vision as supported', () => {
      const metadata = provider.getMetadata();

      expect(metadata.capabilities.vision).toBe(true);
    });

    it('should list supported modalities', () => {
      const metadata = provider.getMetadata();

      expect(metadata.capabilities.modalities).toContain('text');
      expect(metadata.capabilities.modalities).toContain('image');
      expect(metadata.capabilities.modalities).toContain('audio');
      expect(metadata.capabilities.modalities).toContain('video');
    });
  });

  describe('Standard Response Parsing', () => {
    describe('Successful Predictions', () => {
      it('should parse succeeded prediction with string output', async () => {
        const prediction = {
          id: 'gm3qorzdhgbfurvjtvhg6dckhu',
          model: 'replicate/hello-world',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          input: { text: 'Alice' },
          output: 'hello Alice',
          error: null,
          logs: '',
          status: 'succeeded',
          created_at: '2023-09-08T16:19:34.765994Z',
          started_at: '2023-09-08T16:19:34.779176Z',
          completed_at: '2023-09-08T16:19:34.791859Z',
          metrics: {
            predict_time: 0.012683,
            total_time: 0.025366,
          },
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.id).toBe('gm3qorzdhgbfurvjtvhg6dckhu');
        expect(result.response?.provider).toBe('replicate');
        expect(result.response?.stopReason).toBe(StopReason.EndTurn);
        expect(result.response?.messages).toHaveLength(1);
        expect(result.response?.messages[0].content[0].type).toBe('text');
        expect(result.response?.messages[0].content[0].text).toBe('hello Alice');
      });

      it('should parse succeeded prediction with array output (images)', async () => {
        const prediction = {
          id: 'abc123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: [
            'https://replicate.delivery/pbxt/abc123/output-1.png',
            'https://replicate.delivery/pbxt/abc123/output-2.png',
          ],
          status: 'succeeded',
          created_at: '2023-09-08T16:19:34.765994Z',
          completed_at: '2023-09-08T16:19:35.791859Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.messages).toHaveLength(1);
        expect(result.response?.messages[0].content[0].text).toContain('[Output 1]');
        expect(result.response?.messages[0].content[0].text).toContain('[Output 2]');
      });

      it('should parse succeeded prediction with object output', async () => {
        const prediction = {
          id: 'xyz789',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: {
            text: 'Generated content',
            confidence: 0.95,
          },
          status: 'succeeded',
          created_at: '2023-09-08T16:19:34.765994Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.messages).toHaveLength(1);
        expect(result.response?.messages[0].content[0].text).toContain('Generated content');
        expect(result.response?.messages[0].content[0].text).toContain('confidence');
      });
    });

    describe('In-Progress Predictions', () => {
      it('should parse starting prediction', async () => {
        const prediction = {
          id: 'starting123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: null,
          status: 'starting',
          created_at: '2023-09-08T16:19:34.765994Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.messages).toHaveLength(0);
        expect(result.response?.metadata.status).toBe('starting');
      });

      it('should parse processing prediction', async () => {
        const prediction = {
          id: 'processing456',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: null,
          status: 'processing',
          created_at: '2023-09-08T16:19:34.765994Z',
          started_at: '2023-09-08T16:19:35.000000Z',
          logs: 'Loading model...\nGenerating output...',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.metadata.status).toBe('processing');
        expect(result.response?.metadata.logs).toContain('Loading model');
      });
    });

    describe('Failed Predictions', () => {
      it('should parse failed prediction with error', async () => {
        const prediction = {
          id: 'failed789',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: null,
          error: 'CUDA out of memory. Tried to allocate 2.00 GiB',
          status: 'failed',
          created_at: '2023-09-08T16:19:34.765994Z',
          completed_at: '2023-09-08T16:19:35.791859Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
        expect(result.response?.error?.code).toBe('replicate_prediction_error');
        expect(result.response?.error?.message).toContain('CUDA out of memory');
      });

      it('should parse canceled prediction', async () => {
        const prediction = {
          id: 'canceled123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: null,
          status: 'canceled',
          created_at: '2023-09-08T16:19:34.765994Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.stopReason).toBe(StopReason.Unknown);
      });

      it('should parse aborted prediction', async () => {
        const prediction = {
          id: 'aborted456',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: null,
          status: 'aborted',
          created_at: '2023-09-08T16:19:34.765994Z',
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.stopReason).toBe(StopReason.Unknown);
      });
    });

    describe('Metrics Extraction', () => {
      it('should extract metrics from prediction', async () => {
        const prediction = {
          id: 'metrics123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          output: 'result',
          status: 'succeeded',
          created_at: '2023-09-08T16:19:34.765994Z',
          metrics: {
            predict_time: 1.5,
            total_time: 2.3,
          },
        };

        const result = await provider.parse(prediction);

        expect(result.success).toBe(true);
        expect(result.response?.usage.metadata?.predictTime).toBe(1.5);
        expect(result.response?.usage.metadata?.totalTime).toBe(2.3);
      });
    });

    describe('API Error Responses', () => {
      it('should parse API error with detail field', async () => {
        const errorResponse = {
          detail: 'Authentication credentials were not provided',
        };

        const result = await provider.parse(errorResponse);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
        expect(result.response?.error?.code).toBe('replicate_api_error');
        expect(result.response?.error?.message).toContain('Authentication');
      });

      it('should parse 404 not found error', async () => {
        const errorResponse = {
          detail: 'Prediction not found',
        };

        const result = await provider.parse(errorResponse);

        expect(result.success).toBe(true);
        expect(result.response?.error?.message).toBe('Prediction not found');
      });
    });
  });

  describe('Streaming Response Parsing', () => {
    describe('Output Events', () => {
      it('should parse output event with content', async () => {
        const event = {
          event: 'output',
          id: '1690212292:0',
          data: 'Once upon a time',
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.chunks).toHaveLength(1);
        expect(result.response?.chunks[0].type).toBe('content_block_delta');
        expect(result.response?.chunks[0].delta?.text).toBe('Once upon a time');
      });

      it('should skip empty output events', async () => {
        const event = {
          event: 'output',
          id: '1690212292:0',
          data: '',
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.chunks).toHaveLength(0);
      });
    });

    describe('Logs Events', () => {
      it('should parse logs event', async () => {
        const event = {
          event: 'logs',
          id: '1690212292:1',
          data: 'Loading model...',
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.metadata.eventType).toBe('logs');
      });
    });

    describe('Error Events', () => {
      it('should parse error event with JSON data', async () => {
        const event = {
          event: 'error',
          id: '1690212292:2',
          data: JSON.stringify({ detail: 'Model execution failed' }),
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.error).toBeDefined();
        expect(result.response?.error?.code).toBe('replicate_streaming_error');
        expect(result.response?.error?.message).toContain('Model execution failed');
      });

      it('should parse error event with plain text', async () => {
        const event = {
          event: 'error',
          id: '1690212292:2',
          data: 'Connection timeout',
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.error?.message).toBe('Connection timeout');
      });
    });

    describe('Done Events', () => {
      it('should parse done event with success', async () => {
        const event = {
          event: 'done',
          id: '1690212295:0',
          data: '{}',
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.chunks).toHaveLength(1);
        expect(result.response?.chunks[0].type).toBe('message_stop');
        expect(result.response?.chunks[0].delta?.stopReason).toBe(StopReason.EndTurn);
      });

      it('should parse done event with error reason', async () => {
        const event = {
          event: 'done',
          id: '1690212295:0',
          data: JSON.stringify({ reason: 'error' }),
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.stopReason).toBe(StopReason.Unknown);
      });

      it('should parse done event with canceled reason', async () => {
        const event = {
          event: 'done',
          id: '1690212295:0',
          data: JSON.stringify({ reason: 'canceled' }),
        };

        const result = await provider.parseStream(event);

        expect(result.success).toBe(true);
        expect(result.response?.stopReason).toBe(StopReason.Unknown);
      });
    });
  });

  describe('Validation', () => {
    describe('Standard Response Validation', () => {
      it('should reject null response', async () => {
        const result = await provider.parse(null);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Invalid response: must be an object');
      });

      it('should reject response missing id', async () => {
        const invalidResponse = {
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          status: 'succeeded',
        };

        const result = await provider.parse(invalidResponse);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('missing or invalid id');
      });

      it('should reject response missing version', async () => {
        const invalidResponse = {
          id: 'abc123',
          status: 'succeeded',
        };

        const result = await provider.parse(invalidResponse);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('missing or invalid version');
      });

      it('should reject response with invalid status', async () => {
        const invalidResponse = {
          id: 'abc123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          status: 'invalid_status',
        };

        const result = await provider.parse(invalidResponse);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Invalid status value');
      });

      it('should accept API error response with detail field', async () => {
        const errorResponse = {
          detail: 'Some error message',
        };

        const result = await provider.parse(errorResponse);

        expect(result.success).toBe(true);
      });
    });

    describe('Streaming Validation', () => {
      it('should reject null streaming chunk', async () => {
        const result = await provider.parseStream(null);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('must be an object');
      });

      it('should reject chunk missing event field', async () => {
        const invalidChunk = {
          data: 'some data',
        };

        const result = await provider.parseStream(invalidChunk);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('missing or invalid event');
      });

      it('should reject chunk with invalid event type', async () => {
        const invalidChunk = {
          event: 'invalid_event',
          data: 'some data',
        };

        const result = await provider.parseStream(invalidChunk);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Invalid event type');
      });

      it('should reject chunk missing data field', async () => {
        const invalidChunk = {
          event: 'output',
        };

        const result = await provider.parseStream(invalidChunk);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('missing data field');
      });
    });
  });

  describe('Provider Detection', () => {
    describe('URL-based Detection', () => {
      it('should detect api.replicate.com URLs', () => {
        const url = 'https://api.replicate.com/v1/predictions';
        const canHandle = provider.canHandle({}, {}, url);

        expect(canHandle).toBe(true);
      });

      it('should detect streaming.replicate.com URLs', () => {
        const url = 'https://streaming.replicate.com/v1/predictions/abc123';
        const canHandle = provider.canHandle({}, {}, url);

        expect(canHandle).toBe(true);
      });

      it('should detect replicate.com/api URLs', () => {
        const url = 'https://replicate.com/api/predictions';
        const canHandle = provider.canHandle({}, {}, url);

        expect(canHandle).toBe(true);
      });
    });

    describe('Header-based Detection', () => {
      it('should detect r8_ token prefix in Authorization header', () => {
        const headers = {
          Authorization: 'Bearer r8_abc123def456',
        };
        const canHandle = provider.canHandle({}, headers);

        expect(canHandle).toBe(true);
      });

      it('should detect r8_ token in lowercase authorization header', () => {
        const headers = {
          authorization: 'Bearer r8_xyz789',
        };
        const canHandle = provider.canHandle({}, headers);

        expect(canHandle).toBe(true);
      });
    });

    describe('Response Structure Detection', () => {
      it('should detect response with version and status fields', () => {
        const response = {
          id: 'abc123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          status: 'succeeded',
        };
        const canHandle = provider.canHandle(response);

        expect(canHandle).toBe(true);
      });

      it('should detect response with version, status, and urls fields', () => {
        const response = {
          id: 'abc123',
          version: '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          status: 'processing',
          urls: {
            get: 'https://api.replicate.com/v1/predictions/abc123',
          },
        };
        const canHandle = provider.canHandle(response);

        expect(canHandle).toBe(true);
      });

      it('should detect SSE event format', () => {
        const response = {
          event: 'output',
          data: 'some content',
        };
        const canHandle = provider.canHandle(response);

        expect(canHandle).toBe(true);
      });

      it('should not detect non-Replicate responses', () => {
        const response = {
          id: 'abc123',
          choices: [{ message: { content: 'test' } }],
        };
        const canHandle = provider.canHandle(response);

        expect(canHandle).toBe(false);
      });
    });
  });
});
