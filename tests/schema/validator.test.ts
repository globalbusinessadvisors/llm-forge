/**
 * Schema Validator Tests
 */

import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../../src/schema/validator.js';
import {
  TypeKind,
  PrimitiveTypeKind,
  HTTPMethod,
  AuthSchemeType,
  ParameterLocation,
} from '../../src/types/canonical-schema.js';
import type { CanonicalSchema } from '../../src/types/canonical-schema.js';

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  describe('validate()', () => {
    it('should validate a minimal valid schema', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [],
        endpoints: [],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a schema with primitive types', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [
          {
            id: 'type_1',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'type_2',
            name: 'IntegerType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
            constraints: {
              minimum: 0,
              maximum: 100,
            },
          },
        ],
        endpoints: [],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a schema with object types', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [
          {
            id: 'type_1',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'type_2',
            name: 'User',
            kind: TypeKind.Object,
            properties: [
              {
                name: 'id',
                type: { typeId: 'type_1' },
                required: true,
              },
              {
                name: 'name',
                type: { typeId: 'type_1' },
                required: true,
              },
              {
                name: 'email',
                type: { typeId: 'type_1', nullable: true },
                required: false,
              },
            ],
            required: ['id', 'name'],
          },
        ],
        endpoints: [],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a schema with endpoints', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [
          {
            id: 'type_1',
            name: 'Request',
            kind: TypeKind.Object,
            properties: [],
            required: [],
          },
          {
            id: 'type_2',
            name: 'Response',
            kind: TypeKind.Object,
            properties: [],
            required: [],
          },
        ],
        endpoints: [
          {
            id: 'endpoint_1',
            operationId: 'getUser',
            path: '/users/{id}',
            method: HTTPMethod.GET,
            parameters: [
              {
                name: 'id',
                in: ParameterLocation.Path,
                type: { typeId: 'type_1' },
                required: true,
              },
            ],
            responses: [
              {
                statusCode: 200,
                type: { typeId: 'type_2' },
                description: 'Successful response',
              },
            ],
            streaming: false,
            authentication: [],
          },
        ],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid type reference', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [],
        endpoints: [
          {
            id: 'endpoint_1',
            operationId: 'test',
            path: '/test',
            method: HTTPMethod.GET,
            responses: [
              {
                statusCode: 200,
                type: { typeId: 'nonexistent_type' },
              },
            ],
            streaming: false,
            authentication: [],
          },
        ],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.code === 'invalid_type_reference')).toBe(true);
    });

    it('should fail validation for duplicate operation IDs', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [],
        endpoints: [
          {
            id: 'endpoint_1',
            operationId: 'test',
            path: '/test1',
            method: HTTPMethod.GET,
            responses: [],
            streaming: false,
            authentication: [],
          },
          {
            id: 'endpoint_2',
            operationId: 'test', // Duplicate
            path: '/test2',
            method: HTTPMethod.GET,
            responses: [],
            streaming: false,
            authentication: [],
          },
        ],
        authentication: [],
        errors: [],
      };

      const result = validator.validate(schema);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'duplicate_operation_id')).toBe(true);
    });

    it('should fail validation for missing schema field', () => {
      const invalidSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
        },
        // Missing required fields
      };

      const result = validator.validate(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('assertValid()', () => {
    it('should not throw for valid schema', () => {
      const schema: CanonicalSchema = {
        metadata: {
          version: '1.0.0',
          providerId: 'test',
          providerName: 'Test Provider',
          apiVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        },
        types: [],
        endpoints: [],
        authentication: [],
        errors: [],
      };

      expect(() => validator.assertValid(schema)).not.toThrow();
    });

    it('should throw for invalid schema', () => {
      const invalidSchema = {
        metadata: {
          version: '1.0.0',
        },
      };

      expect(() => validator.assertValid(invalidSchema)).toThrow('Invalid canonical schema');
    });
  });
});
