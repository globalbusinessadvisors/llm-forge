/**
 * OpenAPI Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'path';

import { OpenAPIParser } from '../../src/parsers/openapi-parser.js';
import { TypeKind, PrimitiveTypeKind, HTTPMethod } from '../../src/types/canonical-schema.js';

describe('OpenAPIParser', () => {
  const fixturesDir = resolve(import.meta.dirname, '../fixtures');
  const simpleApiPath = resolve(fixturesDir, 'simple-api.json');

  describe('parse()', () => {
    it('should parse a valid OpenAPI 3.0 specification', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should extract metadata correctly', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      expect(result.schema?.metadata).toMatchObject({
        providerId: 'test',
        providerName: 'Test Provider',
        apiVersion: '1.0.0',
      });
    });

    it('should parse types from components/schemas', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      expect(result.schema?.types).toBeDefined();
      expect(result.schema?.types.length).toBeGreaterThan(0);

      // Check for specific types
      const typeNames = result.schema?.types.map((t) => t.name) ?? [];
      expect(typeNames).toContain('ChatCompletionRequest');
      expect(typeNames).toContain('ChatMessage');
      expect(typeNames).toContain('ChatCompletionResponse');
    });

    it('should parse object types correctly', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      const chatMessageType = result.schema?.types.find((t) => t.name === 'ChatMessage');

      expect(chatMessageType).toBeDefined();
      expect(chatMessageType?.kind).toBe(TypeKind.Object);

      if (chatMessageType?.kind === TypeKind.Object) {
        expect(chatMessageType.properties).toBeDefined();
        expect(chatMessageType.properties.length).toBeGreaterThanOrEqual(2);

        const roleProperty = chatMessageType.properties.find((p) => p.name === 'role');
        expect(roleProperty).toBeDefined();
        expect(roleProperty?.required).toBe(true);

        const contentProperty = chatMessageType.properties.find((p) => p.name === 'content');
        expect(contentProperty).toBeDefined();
        expect(contentProperty?.required).toBe(true);
      }
    });

    it('should parse array types correctly', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      const requestType = result.schema?.types.find((t) => t.name === 'ChatCompletionRequest');

      expect(requestType).toBeDefined();

      if (requestType?.kind === TypeKind.Object) {
        const messagesProperty = requestType.properties.find((p) => p.name === 'messages');
        expect(messagesProperty).toBeDefined();

        // Messages should reference an array type
        const messagesTypeId = messagesProperty?.type.typeId;
        const messagesType = result.schema?.types.find((t) => t.id === messagesTypeId);

        if (messagesType?.kind === TypeKind.Array) {
          expect(messagesType.items).toBeDefined();
        }
      }
    });

    it('should parse endpoints correctly', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      expect(result.schema?.endpoints).toBeDefined();
      expect(result.schema?.endpoints.length).toBeGreaterThan(0);

      const chatEndpoint = result.schema?.endpoints.find(
        (e) => e.operationId === 'createChatCompletion'
      );

      expect(chatEndpoint).toBeDefined();
      expect(chatEndpoint?.method).toBe(HTTPMethod.POST);
      expect(chatEndpoint?.path).toBe('/chat/completions');
      expect(chatEndpoint?.requestBody).toBeDefined();
      expect(chatEndpoint?.responses.length).toBeGreaterThan(0);
    });

    it('should parse authentication schemes', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(simpleApiPath);

      expect(result.schema?.authentication).toBeDefined();
      expect(result.schema?.authentication.length).toBeGreaterThan(0);

      const bearerAuth = result.schema?.authentication.find((a) => a.id === 'bearerAuth');

      expect(bearerAuth).toBeDefined();
      expect(bearerAuth?.type).toBe('bearer');
    });

    it('should handle parse errors gracefully', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse('/nonexistent/file.json');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
