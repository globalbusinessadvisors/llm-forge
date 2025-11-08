/**
 * Anthropic Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'path';

import { AnthropicParser, parseAnthropicSchema } from '../../src/parsers/anthropic-parser.js';
import { TypeKind, PrimitiveTypeKind, HTTPMethod, AuthSchemeType, ParameterLocation } from '../../src/types/canonical-schema.js';

describe('AnthropicParser', () => {
  const fixturesDir = resolve(import.meta.dirname, '../fixtures');
  const messagesApiPath = resolve(fixturesDir, 'anthropic-messages-api.json');
  const minimalApiPath = resolve(fixturesDir, 'anthropic-minimal.json');

  describe('Constructor', () => {
    it('should create instance with required options', () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      expect(parser).toBeDefined();
    });

    it('should apply default options', () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      expect(parser).toBeDefined();
    });
  });

  describe('parse()', () => {
    it('should parse a valid Anthropic schema from file', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse a valid Anthropic schema from object', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
    });

    it('should fail on invalid JSON file', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse('/nonexistent/file.json');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail on missing version', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [],
      } as any;

      const result = await parser.parse(schema);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Schema version is required');
    });

    it('should fail on missing baseUrl', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        models: [],
        endpoints: [],
      } as any;

      const result = await parser.parse(schema);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Base URL is required');
    });

    it('should fail on missing endpoints', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('At least one endpoint is required');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract metadata correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      expect(result.schema?.metadata).toMatchObject({
        providerId: 'anthropic',
        providerName: 'Anthropic',
        apiVersion: '2023-06-01',
      });
      expect(result.schema?.metadata.version).toBe('1.0.0');
      expect(result.schema?.metadata.generatedAt).toBeDefined();
    });

    it('should include models in metadata', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      expect(result.schema?.metadata.metadata?.models).toBeDefined();
      expect(result.schema?.metadata.metadata?.models).toBeInstanceOf(Array);
      expect(result.schema?.metadata.metadata?.models.length).toBeGreaterThan(0);
    });

    it('should include baseUrl in metadata', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      expect(result.schema?.metadata.metadata?.baseUrl).toBe('https://api.anthropic.com/v1');
    });
  });

  describe('Type Parsing', () => {
    it('should parse types from schema', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      expect(result.schema?.types).toBeDefined();
      expect(result.schema?.types.length).toBeGreaterThan(0);
    });

    it('should parse object types correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      const simpleResponse = result.schema?.types.find((t) => t.name === 'SimpleResponse');

      expect(simpleResponse).toBeDefined();
      expect(simpleResponse?.kind).toBe(TypeKind.Object);

      if (simpleResponse?.kind === TypeKind.Object) {
        expect(simpleResponse.properties).toBeDefined();
        expect(simpleResponse.properties.length).toBe(2);

        const messageProperty = simpleResponse.properties.find((p) => p.name === 'message');
        expect(messageProperty).toBeDefined();
        expect(messageProperty?.required).toBe(true);

        const statusProperty = simpleResponse.properties.find((p) => p.name === 'status');
        expect(statusProperty).toBeDefined();
        expect(statusProperty?.required).toBe(true);
      }
    });

    it('should parse enum types correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const roleType = result.schema?.types.find((t) => t.name === 'Role');

      expect(roleType).toBeDefined();
      expect(roleType?.kind).toBe(TypeKind.Enum);

      if (roleType?.kind === TypeKind.Enum) {
        expect(roleType.values).toBeDefined();
        expect(roleType.values.length).toBe(2);
        expect(roleType.values.map((v) => v.value)).toContain('user');
        expect(roleType.values.map((v) => v.value)).toContain('assistant');
      }
    });

    it('should parse array types correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
        types: [
          {
            name: 'StringArray',
            kind: 'array' as const,
            items: {
              name: 'String',
              kind: 'primitive' as const,
              primitiveType: 'string' as const,
            },
          },
        ],
      };

      const result = await parser.parse(schema);

      const arrayType = result.schema?.types.find((t) => t.name === 'StringArray');

      expect(arrayType).toBeDefined();
      expect(arrayType?.kind).toBe(TypeKind.Array);

      if (arrayType?.kind === TypeKind.Array) {
        expect(arrayType.items).toBeDefined();
        expect(arrayType.items.typeId).toBeDefined();
      }
    });

    it('should parse union types correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const contentBlockType = result.schema?.types.find((t) => t.name === 'ContentBlock');

      expect(contentBlockType).toBeDefined();
      expect(contentBlockType?.kind).toBe(TypeKind.Union);

      if (contentBlockType?.kind === TypeKind.Union) {
        expect(contentBlockType.variants).toBeDefined();
        expect(contentBlockType.variants.length).toBeGreaterThan(0);
      }
    });

    it('should parse primitive types correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
        types: [
          {
            name: 'StringType',
            kind: 'primitive' as const,
            primitiveType: 'string' as const,
          },
          {
            name: 'NumberType',
            kind: 'primitive' as const,
            primitiveType: 'number' as const,
          },
          {
            name: 'IntegerType',
            kind: 'primitive' as const,
            primitiveType: 'integer' as const,
          },
          {
            name: 'BooleanType',
            kind: 'primitive' as const,
            primitiveType: 'boolean' as const,
          },
        ],
      };

      const result = await parser.parse(schema);

      const stringType = result.schema?.types.find((t) => t.name === 'StringType');
      expect(stringType?.kind).toBe(TypeKind.Primitive);
      if (stringType?.kind === TypeKind.Primitive) {
        expect(stringType.primitiveKind).toBe(PrimitiveTypeKind.String);
      }

      const numberType = result.schema?.types.find((t) => t.name === 'NumberType');
      if (numberType?.kind === TypeKind.Primitive) {
        expect(numberType.primitiveKind).toBe(PrimitiveTypeKind.Float);
      }

      const integerType = result.schema?.types.find((t) => t.name === 'IntegerType');
      if (integerType?.kind === TypeKind.Primitive) {
        expect(integerType.primitiveKind).toBe(PrimitiveTypeKind.Integer);
      }

      const booleanType = result.schema?.types.find((t) => t.name === 'BooleanType');
      if (booleanType?.kind === TypeKind.Primitive) {
        expect(booleanType.primitiveKind).toBe(PrimitiveTypeKind.Boolean);
      }
    });

    it('should handle nested object types', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const messageType = result.schema?.types.find((t) => t.name === 'Message');

      expect(messageType).toBeDefined();
      expect(messageType?.kind).toBe(TypeKind.Object);

      if (messageType?.kind === TypeKind.Object) {
        const usageProperty = messageType.properties.find((p) => p.name === 'usage');
        expect(usageProperty).toBeDefined();
      }
    });
  });

  describe('Endpoint Parsing', () => {
    it('should parse endpoints from schema', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      expect(result.schema?.endpoints).toBeDefined();
      expect(result.schema?.endpoints.length).toBeGreaterThan(0);
    });

    it('should parse endpoint metadata correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const createMessageEndpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');

      expect(createMessageEndpoint).toBeDefined();
      expect(createMessageEndpoint?.path).toBe('/messages');
      expect(createMessageEndpoint?.method).toBe(HTTPMethod.POST);
      expect(createMessageEndpoint?.description).toBeDefined();
      expect(createMessageEndpoint?.operationId).toBe('create_message');
    });

    it('should parse streaming flag correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const createMessageEndpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');

      expect(createMessageEndpoint?.streaming).toBe(true);
    });

    it('should skip deprecated endpoints when option is set', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
        includeDeprecated: false,
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
          {
            id: 'deprecated',
            path: '/deprecated',
            method: 'GET',
            deprecated: true,
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.schema?.endpoints.length).toBe(1);
      expect(result.schema?.endpoints.find((e) => e.id === 'deprecated')).toBeUndefined();
    });

    it('should include deprecated endpoints when option is set', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
        includeDeprecated: true,
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
          {
            id: 'deprecated',
            path: '/deprecated',
            method: 'GET',
            deprecated: true,
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.schema?.endpoints.length).toBe(2);
      expect(result.schema?.endpoints.find((e) => e.id === 'deprecated')).toBeDefined();
    });
  });

  describe('Parameter Parsing', () => {
    it('should parse query parameters correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      const endpoint = result.schema?.endpoints.find((e) => e.id === 'simple_endpoint');

      expect(endpoint?.parameters).toBeDefined();
      expect(endpoint?.parameters.length).toBe(1);

      const queryParam = endpoint?.parameters[0];
      expect(queryParam?.name).toBe('query');
      expect(queryParam?.in).toBe(ParameterLocation.Query);
      expect(queryParam?.required).toBe(false);
    });

    it('should parse header parameters correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            parameters: [
              {
                name: 'X-Custom-Header',
                in: 'header' as const,
                type: 'string',
                required: true,
              },
            ],
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      const endpoint = result.schema?.endpoints[0];
      const headerParam = endpoint?.parameters.find((p) => p.name === 'X-Custom-Header');

      expect(headerParam).toBeDefined();
      expect(headerParam?.in).toBe(ParameterLocation.Header);
      expect(headerParam?.required).toBe(true);
    });

    it('should parse path parameters correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test/{id}',
            method: 'GET',
            parameters: [
              {
                name: 'id',
                in: 'path' as const,
                type: 'string',
                required: true,
              },
            ],
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      const endpoint = result.schema?.endpoints[0];
      const pathParam = endpoint?.parameters.find((p) => p.name === 'id');

      expect(pathParam).toBeDefined();
      expect(pathParam?.in).toBe(ParameterLocation.Path);
      expect(pathParam?.required).toBe(true);
    });
  });

  describe('Request Body Parsing', () => {
    it('should parse request body correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const endpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');

      expect(endpoint?.requestBody).toBeDefined();
      expect(endpoint?.requestBody?.required).toBe(true);
      expect(endpoint?.requestBody?.type?.typeId).toBeDefined();
    });

    it('should handle inline request body schemas', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'POST',
            requestBody: {
              contentType: 'application/json',
              required: true,
              schema: {
                name: 'InlineRequest',
                kind: 'object' as const,
                properties: [
                  {
                    name: 'field',
                    type: 'string',
                    required: true,
                  },
                ],
              },
            },
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      const endpoint = result.schema?.endpoints[0];

      expect(endpoint?.requestBody).toBeDefined();
      expect(endpoint?.requestBody?.type?.typeId).toBeDefined();
    });
  });

  describe('Response Parsing', () => {
    it('should parse responses correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const endpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');

      expect(endpoint?.responses).toBeDefined();
      expect(endpoint?.responses.length).toBeGreaterThan(0);
    });

    it('should parse success responses', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const endpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');
      const successResponse = endpoint?.responses.find((r) => r.statusCode === 200);

      expect(successResponse).toBeDefined();
      expect(successResponse?.description).toBeDefined();
      expect(successResponse?.type?.typeId).toBeDefined();
    });

    it('should parse error responses', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const endpoint = result.schema?.endpoints.find((e) => e.id === 'create_message');
      const errorResponse = endpoint?.responses.find((r) => r.statusCode === 400);

      expect(errorResponse).toBeDefined();
      expect(errorResponse?.description).toBeDefined();
    });

    it('should default contentType to application/json', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      const endpoint = result.schema?.endpoints[0];
      const response = endpoint?.responses[0];

      expect(response?.contentType).toBe('application/json');
    });
  });

  describe('Authentication', () => {
    it('should add API key authentication by default', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      expect(result.schema?.authentication).toBeDefined();
      expect(result.schema?.authentication.length).toBe(1);

      const apiKeyAuth = result.schema?.authentication[0];
      expect(apiKeyAuth?.id).toBe('apiKey');
      expect(apiKeyAuth?.type).toBe(AuthSchemeType.ApiKey);
      expect(apiKeyAuth?.in).toBe('header');
      expect(apiKeyAuth?.name).toBe('x-api-key');
    });

    it('should require authentication for endpoints by default', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(minimalApiPath);

      const endpoint = result.schema?.endpoints[0];
      expect(endpoint?.authentication).toBeDefined();
      expect(endpoint?.authentication.length).toBeGreaterThan(0);
      expect(endpoint?.authentication).toContain('apiKey');
    });

    it('should not require authentication when requiresAuth is false', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'public',
            path: '/public',
            method: 'GET',
            requiresAuth: false,
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      const endpoint = result.schema?.endpoints[0];
      expect(endpoint?.authentication).toHaveLength(0);
    });
  });

  describe('Error Definitions', () => {
    it('should parse error definitions', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      expect(result.schema?.errors).toBeDefined();
      expect(result.schema?.errors.length).toBeGreaterThan(0);
    });

    it('should parse error properties correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const error = result.schema?.errors.find((e) => e.code === 'invalid_request_error');

      expect(error).toBeDefined();
      expect(error?.statusCode).toBe(400);
      expect(error?.message).toBeDefined();
      expect(error?.description).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should parse complete Messages API schema', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.errors).toHaveLength(0);

      // Check types
      const typeNames = result.schema?.types.map((t) => t.name) ?? [];
      expect(typeNames).toContain('Message');
      expect(typeNames).toContain('CreateMessageRequest');
      expect(typeNames).toContain('ContentBlock');
      expect(typeNames).toContain('Role');

      // Check endpoints
      expect(result.schema?.endpoints.length).toBeGreaterThan(0);
      const createMessage = result.schema?.endpoints.find((e) => e.id === 'create_message');
      expect(createMessage).toBeDefined();
      expect(createMessage?.streaming).toBe(true);

      // Check authentication
      expect(result.schema?.authentication.length).toBe(1);

      // Check errors
      expect(result.schema?.errors.length).toBeGreaterThan(0);
    });

    it('should maintain type references correctly', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const messageType = result.schema?.types.find((t) => t.name === 'Message');
      expect(messageType).toBeDefined();

      if (messageType?.kind === TypeKind.Object) {
        const contentProperty = messageType.properties.find((p) => p.name === 'content');
        expect(contentProperty).toBeDefined();
        expect(contentProperty?.type.typeId).toBeDefined();
      }
    });

    it('should handle complex nested structures', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const result = await parser.parse(messagesApiPath);

      const requestType = result.schema?.types.find((t) => t.name === 'CreateMessageRequest');
      expect(requestType).toBeDefined();

      if (requestType?.kind === TypeKind.Object) {
        expect(requestType.properties.length).toBeGreaterThan(0);

        const messagesProperty = requestType.properties.find((p) => p.name === 'messages');
        expect(messagesProperty).toBeDefined();
      }
    });
  });

  describe('Convenience Function', () => {
    it('should parse schema using convenience function', async () => {
      const result = await parseAnthropicSchema(minimalApiPath, {
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle schema with no types', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      expect(result.schema?.types).toHaveLength(0);
    });

    it('should handle schema with no errors', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      expect(result.schema?.errors).toHaveLength(0);
    });

    it('should handle unknown type kinds with warnings', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
        types: [
          {
            name: 'UnknownType',
            kind: 'unknown' as any,
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Unknown type kind'))).toBe(true);
    });

    it('should handle responses without schemas', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [
              {
                statusCode: 204,
                description: 'No content',
              },
            ],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      const endpoint = result.schema?.endpoints[0];
      const response = endpoint?.responses[0];
      expect(response?.type).toBeUndefined();
    });

    it('should handle endpoints without parameters', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      const endpoint = result.schema?.endpoints[0];
      expect(endpoint?.parameters).toHaveLength(0);
    });

    it('should handle endpoints without request body', async () => {
      const parser = new AnthropicParser({
        providerId: 'anthropic',
        providerName: 'Anthropic',
      });

      const schema = {
        version: '2023-06-01',
        baseUrl: 'https://api.anthropic.com/v1',
        models: [],
        endpoints: [
          {
            id: 'test',
            path: '/test',
            method: 'GET',
            responses: [{ statusCode: 200 }],
          },
        ],
      };

      const result = await parser.parse(schema);

      expect(result.success).toBe(true);
      const endpoint = result.schema?.endpoints[0];
      expect(endpoint?.requestBody).toBeUndefined();
    });
  });
});
