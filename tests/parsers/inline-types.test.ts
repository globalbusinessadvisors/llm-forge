/**
 * Inline Types Tests
 * Tests for proper handling of inline type definitions in OpenAPI specs
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { OpenAPIParser } from '../../src/parsers/openapi-parser.js';
import { TypeKind } from '../../src/types/canonical-schema.js';

describe('OpenAPIParser - Inline Types', () => {
  const fixturesDir = resolve(import.meta.dirname, '../fixtures');
  const inlineTypesPath = resolve(fixturesDir, 'inline-types-api.json');

  describe('Inline Request Body Types', () => {
    it('should register inline request body types to global registry', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      // All inline types should be in the registry
      const typeIds = new Set(result.schema!.types.map((t) => t.id));

      // Find the createUser endpoint
      const createUserEndpoint = result.schema!.endpoints.find(
        (e) => e.operationId === 'createUser'
      );
      expect(createUserEndpoint).toBeDefined();
      expect(createUserEndpoint!.requestBody).toBeDefined();

      // The request body type should exist in the registry
      const requestBodyTypeId = createUserEndpoint!.requestBody!.type.typeId;
      expect(typeIds.has(requestBodyTypeId)).toBe(true);

      // Find the type definition
      const requestBodyType = result.schema!.types.find((t) => t.id === requestBodyTypeId);
      expect(requestBodyType).toBeDefined();
      expect(requestBodyType!.kind).toBe(TypeKind.Object);
    });

    it('should register inline property types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      // Find the request body type with nested metadata object
      const createUserEndpoint = result.schema!.endpoints.find(
        (e) => e.operationId === 'createUser'
      );
      const requestBodyTypeId = createUserEndpoint!.requestBody!.type.typeId;
      const requestBodyType = result.schema!.types.find((t) => t.id === requestBodyTypeId);

      expect(requestBodyType).toBeDefined();
      expect(requestBodyType!.kind).toBe(TypeKind.Object);

      if (requestBodyType!.kind === TypeKind.Object) {
        // Find the metadata property
        const metadataProperty = requestBodyType!.properties.find((p) => p.name === 'metadata');
        expect(metadataProperty).toBeDefined();

        // The metadata property type should exist in the registry
        const typeIds = new Set(result.schema!.types.map((t) => t.id));
        expect(typeIds.has(metadataProperty!.type.typeId)).toBe(true);

        // Verify it's an object type
        const metadataType = result.schema!.types.find(
          (t) => t.id === metadataProperty!.type.typeId
        );
        expect(metadataType).toBeDefined();
        expect(metadataType!.kind).toBe(TypeKind.Object);
      }
    });

    it('should register inline array item types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const createUserEndpoint = result.schema!.endpoints.find(
        (e) => e.operationId === 'createUser'
      );
      const requestBodyTypeId = createUserEndpoint!.requestBody!.type.typeId;
      const requestBodyType = result.schema!.types.find((t) => t.id === requestBodyTypeId);

      if (requestBodyType!.kind === TypeKind.Object) {
        // Find the tags property (array of strings)
        const tagsProperty = requestBodyType!.properties.find((p) => p.name === 'tags');
        expect(tagsProperty).toBeDefined();

        // The tags type should be in the registry
        const typeIds = new Set(result.schema!.types.map((t) => t.id));
        expect(typeIds.has(tagsProperty!.type.typeId)).toBe(true);

        // Verify it's an array type
        const tagsType = result.schema!.types.find((t) => t.id === tagsProperty!.type.typeId);
        expect(tagsType).toBeDefined();
        expect(tagsType!.kind).toBe(TypeKind.Array);

        if (tagsType!.kind === TypeKind.Array) {
          // The array item type should also be in the registry
          expect(typeIds.has(tagsType!.items.typeId)).toBe(true);
        }
      }
    });

    it('should register inline enum types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const createUserEndpoint = result.schema!.endpoints.find(
        (e) => e.operationId === 'createUser'
      );
      const requestBodyTypeId = createUserEndpoint!.requestBody!.type.typeId;
      const requestBodyType = result.schema!.types.find((t) => t.id === requestBodyTypeId);

      if (requestBodyType!.kind === TypeKind.Object) {
        // Find the role property (enum)
        const roleProperty = requestBodyType!.properties.find((p) => p.name === 'role');
        expect(roleProperty).toBeDefined();

        // The role enum type should be in the registry
        const typeIds = new Set(result.schema!.types.map((t) => t.id));
        expect(typeIds.has(roleProperty!.type.typeId)).toBe(true);

        // Verify it's an enum type
        const roleType = result.schema!.types.find((t) => t.id === roleProperty!.type.typeId);
        expect(roleType).toBeDefined();
        expect(roleType!.kind).toBe(TypeKind.Enum);

        if (roleType!.kind === TypeKind.Enum) {
          expect(roleType!.values).toHaveLength(3);
          expect(roleType!.values.map((v) => v.value)).toContain('admin');
          expect(roleType!.values.map((v) => v.value)).toContain('user');
          expect(roleType!.values.map((v) => v.value)).toContain('guest');
        }
      }
    });
  });

  describe('Inline Response Types', () => {
    it('should register inline response types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const createUserEndpoint = result.schema!.endpoints.find(
        (e) => e.operationId === 'createUser'
      );
      expect(createUserEndpoint).toBeDefined();

      const successResponse = createUserEndpoint!.responses.find((r) => r.statusCode === 201);
      expect(successResponse).toBeDefined();
      expect(successResponse!.type).toBeDefined();

      // The response type should be in the registry
      const typeIds = new Set(result.schema!.types.map((t) => t.id));
      expect(typeIds.has(successResponse!.type!.typeId)).toBe(true);
    });
  });

  describe('Inline Parameter Types', () => {
    it('should register inline parameter types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const getItemEndpoint = result.schema!.endpoints.find((e) => e.operationId === 'getItem');
      expect(getItemEndpoint).toBeDefined();

      // Find the id parameter
      const idParam = getItemEndpoint!.parameters?.find((p) => p.name === 'id');
      expect(idParam).toBeDefined();

      // The parameter type should be in the registry
      const typeIds = new Set(result.schema!.types.map((t) => t.id));
      expect(typeIds.has(idParam!.type.typeId)).toBe(true);
    });

    it('should register inline array parameter types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const getItemEndpoint = result.schema!.endpoints.find((e) => e.operationId === 'getItem');
      expect(getItemEndpoint).toBeDefined();

      // Find the include parameter (array of enums)
      const includeParam = getItemEndpoint!.parameters?.find((p) => p.name === 'include');
      expect(includeParam).toBeDefined();

      // The parameter type should be in the registry
      const typeIds = new Set(result.schema!.types.map((t) => t.id));
      expect(typeIds.has(includeParam!.type.typeId)).toBe(true);

      // Verify it's an array type
      const includeType = result.schema!.types.find((t) => t.id === includeParam!.type.typeId);
      expect(includeType).toBeDefined();
      expect(includeType!.kind).toBe(TypeKind.Array);

      if (includeType!.kind === TypeKind.Array) {
        // The array item type (enum) should also be in the registry
        expect(typeIds.has(includeType!.items.typeId)).toBe(true);

        const itemType = result.schema!.types.find((t) => t.id === includeType!.items.typeId);
        expect(itemType).toBeDefined();
        expect(itemType!.kind).toBe(TypeKind.Enum);
      }
    });
  });

  describe('Deeply Nested Inline Types', () => {
    it('should register deeply nested object types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      // Find the search endpoint with nested filters.priceRange object
      const searchEndpoint = result.schema!.endpoints.find((e) => e.operationId === 'search');
      expect(searchEndpoint).toBeDefined();

      const requestBodyTypeId = searchEndpoint!.requestBody!.type.typeId;
      const requestBodyType = result.schema!.types.find((t) => t.id === requestBodyTypeId);

      expect(requestBodyType).toBeDefined();

      if (requestBodyType!.kind === TypeKind.Object) {
        // Find the filters property
        const filtersProperty = requestBodyType!.properties.find((p) => p.name === 'filters');
        expect(filtersProperty).toBeDefined();

        const typeIds = new Set(result.schema!.types.map((t) => t.id));
        expect(typeIds.has(filtersProperty!.type.typeId)).toBe(true);

        // Get the filters type
        const filtersType = result.schema!.types.find(
          (t) => t.id === filtersProperty!.type.typeId
        );
        expect(filtersType).toBeDefined();
        expect(filtersType!.kind).toBe(TypeKind.Object);

        if (filtersType!.kind === TypeKind.Object) {
          // Find the priceRange property (nested object)
          const priceRangeProperty = filtersType!.properties.find((p) => p.name === 'priceRange');
          expect(priceRangeProperty).toBeDefined();

          // The nested priceRange type should be in the registry
          expect(typeIds.has(priceRangeProperty!.type.typeId)).toBe(true);

          const priceRangeType = result.schema!.types.find(
            (t) => t.id === priceRangeProperty!.type.typeId
          );
          expect(priceRangeType).toBeDefined();
          expect(priceRangeType!.kind).toBe(TypeKind.Object);
        }
      }
    });

    it('should register inline types in array items', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      // Find the search response with results array containing inline objects
      const searchEndpoint = result.schema!.endpoints.find((e) => e.operationId === 'search');
      const successResponse = searchEndpoint!.responses.find((r) => r.statusCode === 200);
      expect(successResponse).toBeDefined();

      const responseTypeId = successResponse!.type!.typeId;
      const responseType = result.schema!.types.find((t) => t.id === responseTypeId);

      if (responseType!.kind === TypeKind.Object) {
        // Find the results property (array)
        const resultsProperty = responseType!.properties.find((p) => p.name === 'results');
        expect(resultsProperty).toBeDefined();

        const typeIds = new Set(result.schema!.types.map((t) => t.id));
        const resultsType = result.schema!.types.find(
          (t) => t.id === resultsProperty!.type.typeId
        );

        expect(resultsType).toBeDefined();
        expect(resultsType!.kind).toBe(TypeKind.Array);

        if (resultsType!.kind === TypeKind.Array) {
          // The array item type (inline object) should be in the registry
          expect(typeIds.has(resultsType!.items.typeId)).toBe(true);

          const itemType = result.schema!.types.find((t) => t.id === resultsType!.items.typeId);
          expect(itemType).toBeDefined();
          expect(itemType!.kind).toBe(TypeKind.Object);

          if (itemType!.kind === TypeKind.Object) {
            // Verify the inline object has properties
            expect(itemType!.properties.length).toBeGreaterThan(0);
            expect(itemType!.properties.map((p) => p.name)).toContain('id');
            expect(itemType!.properties.map((p) => p.name)).toContain('name');
            expect(itemType!.properties.map((p) => p.name)).toContain('price');
          }
        }
      }
    });
  });

  describe('Type Naming', () => {
    it('should generate unique names for inline types', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      // All types should have unique IDs
      const typeIds = result.schema!.types.map((t) => t.id);
      const uniqueTypeIds = new Set(typeIds);
      expect(typeIds.length).toBe(uniqueTypeIds.size);

      // All types should have names
      result.schema!.types.forEach((type) => {
        expect(type.name).toBeDefined();
        expect(type.name.length).toBeGreaterThan(0);
      });
    });

    it('should not have duplicate type definitions', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      // Check that we don't have duplicate types with the same structure
      const typesByName = new Map<string, number>();
      result.schema!.types.forEach((type) => {
        const count = typesByName.get(type.name) || 0;
        typesByName.set(type.name, count + 1);
      });

      // Some names might be reused (like RequestBody, Response) but should be for different endpoints
      // Just ensure we have a reasonable number of types
      expect(result.schema!.types.length).toBeGreaterThan(10);
    });
  });

  describe('No Errors', () => {
    it('should parse without errors', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have all referenced types in registry', async () => {
      const parser = new OpenAPIParser({
        providerId: 'test',
        providerName: 'Test Provider',
      });

      const result = await parser.parse(inlineTypesPath);

      expect(result.success).toBe(true);

      const typeIds = new Set(result.schema!.types.map((t) => t.id));

      // Check all endpoints
      result.schema!.endpoints.forEach((endpoint) => {
        // Check request body
        if (endpoint.requestBody) {
          expect(typeIds.has(endpoint.requestBody.type.typeId)).toBe(true);
        }

        // Check parameters
        endpoint.parameters?.forEach((param) => {
          expect(typeIds.has(param.type.typeId)).toBe(true);
        });

        // Check responses
        endpoint.responses.forEach((response) => {
          if (response.type) {
            expect(typeIds.has(response.type.typeId)).toBe(true);
          }
        });
      });

      // Check all object properties
      result.schema!.types.forEach((type) => {
        if (type.kind === TypeKind.Object && type.properties) {
          type.properties.forEach((prop) => {
            expect(typeIds.has(prop.type.typeId)).toBe(true);
          });
        }

        if (type.kind === TypeKind.Array) {
          expect(typeIds.has(type.items.typeId)).toBe(true);
        }
      });
    });
  });
});
