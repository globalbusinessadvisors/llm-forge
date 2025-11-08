/**
 * Schema Validator
 *
 * Validates canonical schema instances against the UIR specification.
 * Ensures all generated schemas are well-formed and complete before
 * proceeding to code generation.
 *
 * @module schema/validator
 */

import { z } from 'zod';

import type {
  CanonicalSchema,
  TypeDefinition,
  EndpointDefinition,
  AuthScheme,
  ErrorDefinition,
} from '../types/canonical-schema.js';
import {
  HTTPMethod,
  PrimitiveTypeKind,
  TypeKind,
  AuthSchemeType,
  OAuth2FlowType,
  ParameterLocation,
} from '../types/canonical-schema.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * Zod schema for TypeReference
 */
const TypeReferenceSchema = z.object({
  typeId: z.string(),
  nullable: z.boolean().optional(),
});

/**
 * Zod schema for PrimitiveConstraints
 */
const PrimitiveConstraintsSchema = z.object({
  // String constraints
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  format: z.string().optional(),

  // Numeric constraints
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMinimum: z.boolean().optional(),
  exclusiveMaximum: z.boolean().optional(),
  multipleOf: z.number().optional(),

  // Enum values
  enum: z.array(z.union([z.string(), z.number()])).optional(),
});

/**
 * Base type definition schema
 */
const BaseTypeDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.nativeEnum(TypeKind),
  description: z.string().optional(),
  deprecated: z.boolean().optional(),
  deprecationMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Primitive type schema
 */
const PrimitiveTypeSchema = BaseTypeDefinitionSchema.extend({
  kind: z.literal(TypeKind.Primitive),
  primitiveKind: z.nativeEnum(PrimitiveTypeKind),
  constraints: PrimitiveConstraintsSchema.optional(),
});

/**
 * Property definition schema
 */
const PropertyDefinitionSchema = z.object({
  name: z.string(),
  type: TypeReferenceSchema,
  description: z.string().optional(),
  required: z.boolean(),
  default: z.unknown().optional(),
  constraints: PrimitiveConstraintsSchema.optional(),
  deprecated: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Object type schema
 */
const ObjectTypeSchema = BaseTypeDefinitionSchema.extend({
  kind: z.literal(TypeKind.Object),
  properties: z.array(PropertyDefinitionSchema),
  required: z.array(z.string()),
  additionalProperties: z.union([TypeReferenceSchema, z.boolean()]).optional(),
  discriminator: z.string().optional(),
});

/**
 * Array type schema
 */
const ArrayTypeSchema = BaseTypeDefinitionSchema.extend({
  kind: z.literal(TypeKind.Array),
  items: TypeReferenceSchema,
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  uniqueItems: z.boolean().optional(),
});

/**
 * Union type schema
 */
const UnionTypeSchema = BaseTypeDefinitionSchema.extend({
  kind: z.literal(TypeKind.Union),
  variants: z.array(TypeReferenceSchema),
  discriminator: z.string().optional(),
  discriminatorMapping: z.record(z.string()).optional(),
});

/**
 * Enum value schema
 */
const EnumValueSchema = z.object({
  value: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string().optional(),
  deprecated: z.boolean().optional(),
});

/**
 * Enum type schema
 */
const EnumTypeSchema = BaseTypeDefinitionSchema.extend({
  kind: z.literal(TypeKind.Enum),
  values: z.array(EnumValueSchema),
  valueType: z.enum(['string', 'number']),
});

/**
 * Type definition schema (discriminated union)
 */
const TypeDefinitionSchema: z.ZodType<TypeDefinition> = z.discriminatedUnion('kind', [
  PrimitiveTypeSchema,
  ObjectTypeSchema,
  ArrayTypeSchema,
  UnionTypeSchema,
  EnumTypeSchema,
]);

/**
 * Parameter definition schema
 */
const ParameterDefinitionSchema = z.object({
  name: z.string(),
  in: z.nativeEnum(ParameterLocation),
  type: TypeReferenceSchema,
  required: z.boolean(),
  description: z.string().optional(),
  default: z.unknown().optional(),
  deprecated: z.boolean().optional(),
});

/**
 * Request body definition schema
 */
const RequestBodyDefinitionSchema = z.object({
  type: TypeReferenceSchema,
  required: z.boolean(),
  contentType: z.string(),
  description: z.string().optional(),
});

/**
 * Header definition schema
 */
const HeaderDefinitionSchema = z.object({
  name: z.string(),
  type: TypeReferenceSchema,
  required: z.boolean(),
  description: z.string().optional(),
});

/**
 * Response definition schema
 */
const ResponseDefinitionSchema = z.object({
  statusCode: z.union([z.number(), z.literal('default')]),
  type: TypeReferenceSchema.optional(),
  description: z.string().optional(),
  headers: z.array(HeaderDefinitionSchema).optional(),
  contentType: z.string().optional(),
});

/**
 * Rate limit spec schema
 */
const RateLimitSpecSchema = z.object({
  requests: z.number(),
  windowSeconds: z.number(),
  scope: z.string().optional(),
});

/**
 * Endpoint definition schema
 */
const EndpointDefinitionSchema: z.ZodType<EndpointDefinition> = z.object({
  id: z.string(),
  operationId: z.string(),
  path: z.string(),
  method: z.nativeEnum(HTTPMethod),
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(ParameterDefinitionSchema).optional(),
  requestBody: RequestBodyDefinitionSchema.optional(),
  responses: z.array(ResponseDefinitionSchema),
  streaming: z.boolean(),
  authentication: z.array(z.string()),
  rateLimit: RateLimitSpecSchema.optional(),
  tags: z.array(z.string()).optional(),
  deprecated: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * OAuth2 flow schema
 */
const OAuth2FlowSchema = z.object({
  type: z.nativeEnum(OAuth2FlowType),
  authorizationUrl: z.string().optional(),
  tokenUrl: z.string().optional(),
  refreshUrl: z.string().optional(),
  scopes: z.record(z.string()).optional(),
});

/**
 * Auth scheme schemas
 */
const ApiKeyAuthSchemeSchema = z.object({
  id: z.string(),
  type: z.literal(AuthSchemeType.ApiKey),
  in: z.enum(['header', 'query']),
  name: z.string(),
  description: z.string().optional(),
});

const BearerAuthSchemeSchema = z.object({
  id: z.string(),
  type: z.literal(AuthSchemeType.Bearer),
  scheme: z.string(),
  description: z.string().optional(),
});

const OAuth2AuthSchemeSchema = z.object({
  id: z.string(),
  type: z.literal(AuthSchemeType.OAuth2),
  flows: z.array(OAuth2FlowSchema),
  description: z.string().optional(),
});

const BasicAuthSchemeSchema = z.object({
  id: z.string(),
  type: z.literal(AuthSchemeType.Basic),
  description: z.string().optional(),
});

const AuthSchemeSchema: z.ZodType<AuthScheme> = z.discriminatedUnion('type', [
  ApiKeyAuthSchemeSchema,
  BearerAuthSchemeSchema,
  OAuth2AuthSchemeSchema,
  BasicAuthSchemeSchema,
]);

/**
 * Error definition schema
 */
const ErrorDefinitionSchema: z.ZodType<ErrorDefinition> = z.object({
  code: z.string(),
  statusCode: z.number(),
  name: z.string(),
  description: z.string().optional(),
  type: TypeReferenceSchema.optional(),
  retryable: z.boolean().optional(),
});

/**
 * Schema metadata schema
 */
const SchemaMetadataSchema = z.object({
  version: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  apiVersion: z.string(),
  generatedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Canonical schema root schema
 */
export const CanonicalSchemaSchema: z.ZodType<CanonicalSchema> = z.object({
  metadata: SchemaMetadataSchema,
  types: z.array(TypeDefinitionSchema),
  endpoints: z.array(EndpointDefinitionSchema),
  authentication: z.array(AuthSchemeSchema),
  errors: z.array(ErrorDefinitionSchema),
  config: z.record(z.unknown()).optional(),
});

/**
 * SchemaValidator class
 *
 * Validates canonical schemas and provides detailed error reporting.
 */
export class SchemaValidator {
  /**
   * Validate a canonical schema
   *
   * @param schema - Schema to validate
   * @returns Validation result
   */
  validate(schema: unknown): ValidationResult {
    const result = CanonicalSchemaSchema.safeParse(schema);

    if (result.success) {
      // Additional semantic validation
      const semanticErrors = this.validateSemantics(result.data);

      if (semanticErrors.length === 0) {
        return { valid: true, errors: [] };
      }

      return { valid: false, errors: semanticErrors };
    }

    // Convert Zod errors to ValidationErrors
    const errors: ValidationError[] = result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return { valid: false, errors };
  }

  /**
   * Validate semantic constraints (beyond schema structure)
   *
   * @param schema - Canonical schema
   * @returns Array of validation errors
   */
  private validateSemantics(schema: CanonicalSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build type ID index
    const typeIds = new Set(schema.types.map((t) => t.id));

    // Validate type references
    this.validateTypeReferences(schema, typeIds, errors);

    // Validate authentication references
    this.validateAuthReferences(schema, errors);

    // Validate endpoint uniqueness
    this.validateEndpointUniqueness(schema, errors);

    // Validate required properties consistency
    this.validateRequiredProperties(schema, errors);

    return errors;
  }

  /**
   * Validate that all type references point to existing types
   */
  private validateTypeReferences(
    schema: CanonicalSchema,
    typeIds: Set<string>,
    errors: ValidationError[]
  ): void {
    // Check endpoints
    schema.endpoints.forEach((endpoint, idx) => {
      // Check request body type
      if (endpoint.requestBody?.type.typeId) {
        if (!typeIds.has(endpoint.requestBody.type.typeId)) {
          errors.push({
            path: `endpoints[${idx}].requestBody.type.typeId`,
            message: `Type '${endpoint.requestBody.type.typeId}' not found`,
            code: 'invalid_type_reference',
          });
        }
      }

      // Check response types
      endpoint.responses.forEach((response, respIdx) => {
        if (response.type?.typeId) {
          if (!typeIds.has(response.type.typeId)) {
            errors.push({
              path: `endpoints[${idx}].responses[${respIdx}].type.typeId`,
              message: `Type '${response.type.typeId}' not found`,
              code: 'invalid_type_reference',
            });
          }
        }
      });

      // Check parameter types
      endpoint.parameters?.forEach((param, paramIdx) => {
        if (!typeIds.has(param.type.typeId)) {
          errors.push({
            path: `endpoints[${idx}].parameters[${paramIdx}].type.typeId`,
            message: `Type '${param.type.typeId}' not found`,
            code: 'invalid_type_reference',
          });
        }
      });
    });
  }

  /**
   * Validate that authentication scheme references exist
   */
  private validateAuthReferences(schema: CanonicalSchema, errors: ValidationError[]): void {
    const authIds = new Set(schema.authentication.map((a) => a.id));

    schema.endpoints.forEach((endpoint, idx) => {
      endpoint.authentication.forEach((authId, authIdx) => {
        if (!authIds.has(authId)) {
          errors.push({
            path: `endpoints[${idx}].authentication[${authIdx}]`,
            message: `Authentication scheme '${authId}' not found`,
            code: 'invalid_auth_reference',
          });
        }
      });
    });
  }

  /**
   * Validate that operation IDs are unique
   */
  private validateEndpointUniqueness(schema: CanonicalSchema, errors: ValidationError[]): void {
    const operationIds = new Set<string>();

    schema.endpoints.forEach((endpoint, idx) => {
      if (operationIds.has(endpoint.operationId)) {
        errors.push({
          path: `endpoints[${idx}].operationId`,
          message: `Duplicate operation ID: '${endpoint.operationId}'`,
          code: 'duplicate_operation_id',
        });
      }
      operationIds.add(endpoint.operationId);
    });
  }

  /**
   * Validate that required properties match the required array
   */
  private validateRequiredProperties(schema: CanonicalSchema, errors: ValidationError[]): void {
    schema.types.forEach((type, idx) => {
      if (type.kind === TypeKind.Object) {
        const propertyNames = new Set(type.properties.map((p) => p.name));

        type.required.forEach((requiredProp) => {
          if (!propertyNames.has(requiredProp)) {
            errors.push({
              path: `types[${idx}].required`,
              message: `Required property '${requiredProp}' not found in properties`,
              code: 'invalid_required_property',
            });
          }
        });
      }
    });
  }

  /**
   * Assert that a schema is valid, throwing an error if not
   *
   * @param schema - Schema to validate
   * @throws Error if schema is invalid
   */
  assertValid(schema: unknown): asserts schema is CanonicalSchema {
    const result = this.validate(schema);

    if (!result.valid) {
      const errorMessages = result.errors.map(
        (err) => `  ${err.path}: ${err.message}`
      ).join('\n');

      throw new Error(`Invalid canonical schema:\n${errorMessages}`);
    }
  }
}

/**
 * Default validator instance
 */
export const validator = new SchemaValidator();
