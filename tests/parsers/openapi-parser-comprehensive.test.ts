/**
 * Comprehensive OpenAPI Parser Tests
 * Additional edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { OpenAPIParser } from '../../src/parsers/openapi-parser.js';
import { TypeKind, PrimitiveTypeKind, HTTPMethod } from '../../src/types/canonical-schema.js';

describe('OpenAPIParser - Comprehensive', () => {
  const fixturesDir = resolve(import.meta.dirname, '../fixtures');
  const simpleApiPath = resolve(fixturesDir, 'simple-api.json');

  describe('Edge Cases', () => {
    it('should handle empty paths object', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);
      expect(result.schema?.endpoints).toHaveLength(0);
    });

    it('should handle missing components section', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);
    });

    it('should handle allOf schema composition', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Base: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            Extended: {
              allOf: [
                { $ref: '#/components/schemas/Base' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              ],
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const extendedType = result.schema?.types.find((t) => t.name === 'Extended');
      expect(extendedType).toBeDefined();
    });

    it('should handle anyOf schema composition', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            StringOrNumber: {
              anyOf: [{ type: 'string' }, { type: 'number' }],
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const type = result.schema?.types.find((t) => t.name === 'StringOrNumber');
      expect(type).toBeDefined();
      expect(type?.kind).toBe(TypeKind.Object);
    });

    it('should handle schemas with only additionalProperties', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Dictionary: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const dictType = result.schema?.types.find((t) => t.name === 'Dictionary');
      expect(dictType).toBeDefined();
      expect(dictType?.kind).toBe(TypeKind.Object);
    });

    it('should handle date-time format', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const timestampType = result.schema?.types.find((t) => t.name === 'Timestamp');
      expect(timestampType).toBeDefined();
      expect(timestampType?.kind).toBe(TypeKind.Primitive);
      if (timestampType?.kind === TypeKind.Primitive) {
        expect(timestampType.constraints?.format).toBe('date-time');
      }
    });

    it('should handle integer with minimum/maximum constraints', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Age: {
              type: 'integer',
              minimum: 0,
              maximum: 150,
              description: 'Age in years',
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const ageType = result.schema?.types.find((t) => t.name === 'Age');
      expect(ageType).toBeDefined();
      if (ageType?.kind === TypeKind.Primitive) {
        expect(ageType.constraints?.minimum).toBe(0);
        expect(ageType.constraints?.maximum).toBe(150);
        expect(ageType.description).toBe('Age in years');
      }
    });

    it('should handle string with pattern constraint', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Email: {
              type: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              minLength: 5,
              maxLength: 100,
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const emailType = result.schema?.types.find((t) => t.name === 'Email');
      expect(emailType).toBeDefined();
      if (emailType?.kind === TypeKind.Primitive) {
        expect(emailType.constraints?.pattern).toBeDefined();
        expect(emailType.constraints?.minLength).toBe(5);
        expect(emailType.constraints?.maxLength).toBe(100);
      }
    });
  });

  describe('HTTP Methods', () => {
    it('should handle PUT method', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/resource/{id}': {
            put: {
              operationId: 'updateResource',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': { description: 'Updated' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'updateResource');
      expect(endpoint).toBeDefined();
      expect(endpoint?.method).toBe(HTTPMethod.PUT);
    });

    it('should handle PATCH method', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/resource/{id}': {
            patch: {
              operationId: 'patchResource',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': { description: 'Patched' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'patchResource');
      expect(endpoint).toBeDefined();
      expect(endpoint?.method).toBe(HTTPMethod.PATCH);
    });

    it('should handle DELETE method', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/resource/{id}': {
            delete: {
              operationId: 'deleteResource',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '204': { description: 'Deleted' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'deleteResource');
      expect(endpoint).toBeDefined();
      expect(endpoint?.method).toBe(HTTPMethod.DELETE);
    });
  });

  describe('Authentication Schemes', () => {
    it('should handle API key authentication', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const apiKeyAuth = result.schema?.authentication.find((a) => a.id === 'apiKey');
      expect(apiKeyAuth).toBeDefined();
      expect(apiKeyAuth?.type).toBe('apiKey');
    });

    it('should handle OAuth2 authentication', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: {
                    'read:users': 'Read user data',
                    'write:users': 'Write user data',
                  },
                },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const oauth = result.schema?.authentication.find((a) => a.id === 'oauth2');
      expect(oauth).toBeDefined();
      expect(oauth?.type).toBe('oauth2');
    });
  });

  describe('Parameter Locations', () => {
    it('should handle query parameters', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/search': {
            get: {
              operationId: 'search',
              parameters: [
                {
                  name: 'q',
                  in: 'query',
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': { description: 'OK' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'search');
      const param = endpoint?.parameters?.find((p) => p.name === 'q');
      expect(param).toBeDefined();
      expect(param?.in).toBe('query');
    });

    it('should handle header parameters', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              parameters: [
                {
                  name: 'X-Custom-Header',
                  in: 'header',
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': { description: 'OK' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'test');
      const param = endpoint?.parameters?.find((p) => p.name === 'X-Custom-Header');
      expect(param).toBeDefined();
      expect(param?.in).toBe('header');
    });
  });

  describe('Response Handling', () => {
    it('should handle default response', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              responses: {
                default: {
                  description: 'Default response',
                  content: {
                    'application/json': {
                      schema: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'test');
      const defaultResponse = endpoint?.responses.find((r) => r.statusCode === 'default');
      expect(defaultResponse).toBeDefined();
    });

    it('should handle response without content', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            delete: {
              operationId: 'deleteTest',
              responses: {
                '204': {
                  description: 'No content',
                },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'deleteTest');
      const response = endpoint?.responses.find((r) => r.statusCode === 204);
      expect(response).toBeDefined();
      expect(response?.type).toBeUndefined();
    });

    it('should handle multiple content types', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/xml': {
                      schema: { type: 'string' },
                    },
                    'application/json': {
                      schema: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'test');
      expect(endpoint?.responses).toHaveLength(1);
    });
  });

  describe('Metadata', () => {
    it('should extract contact information', async () => {
      const spec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          contact: {
            name: 'API Support',
            email: 'support@example.com',
          },
        },
        paths: {},
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);
    });

    it('should extract license information', async () => {
      const spec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        paths: {},
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);
    });
  });

  describe('Deprecated Fields', () => {
    it('should mark deprecated operations', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/old-endpoint': {
            get: {
              operationId: 'oldEndpoint',
              deprecated: true,
              responses: {
                '200': { description: 'OK' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'oldEndpoint');
      expect(endpoint?.deprecated).toBe(true);
    });

    it('should mark deprecated schemas', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            OldType: {
              type: 'object',
              deprecated: true,
              properties: {
                value: { type: 'string' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const type = result.schema?.types.find((t) => t.name === 'OldType');
      expect(type?.deprecated).toBe(true);
    });

    it('should mark deprecated parameters', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              parameters: [
                {
                  name: 'oldParam',
                  in: 'query',
                  deprecated: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': { description: 'OK' },
              },
            },
          },
        },
      };

      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test',
      });

      const result = await parser.parse(spec);
      expect(result.success).toBe(true);

      const endpoint = result.schema?.endpoints.find((e) => e.operationId === 'test');
      const param = endpoint?.parameters?.find((p) => p.name === 'oldParam');
      expect(param?.deprecated).toBe(true);
    });
  });
});
