/**
 * Test Helpers for Generator Tests
 */

import type { CanonicalSchema, TypeDefinition } from '../../src/types/canonical-schema.js';
import {
  TypeKind,
  PrimitiveTypeKind,
  HTTPMethod,
  ParameterLocation,
  AuthSchemeType,
} from '../../src/types/canonical-schema.js';

/**
 * Create a minimal valid canonical schema for testing
 */
export function createMinimalSchema(): CanonicalSchema {
  return {
    metadata: {
      version: '1.0.0',
      providerId: 'test',
      providerName: 'Test Provider',
      apiVersion: '1.0.0',
      generatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      metadata: {
        title: 'Test API',
        description: 'A test API for unit testing',
      },
    },
    types: [],
    endpoints: [],
    authentication: [],
    errors: [],
  };
}

/**
 * Create a schema with common types for testing
 */
export function createSchemaWithTypes(): CanonicalSchema {
  const schema = createMinimalSchema();

  schema.types = [
    // Primitive types
    {
      id: 'string_type',
      name: 'StringType',
      kind: TypeKind.Primitive,
      primitiveKind: PrimitiveTypeKind.String,
    },
    {
      id: 'integer_type',
      name: 'IntegerType',
      kind: TypeKind.Primitive,
      primitiveKind: PrimitiveTypeKind.Integer,
    },
    {
      id: 'float_type',
      name: 'FloatType',
      kind: TypeKind.Primitive,
      primitiveKind: PrimitiveTypeKind.Float,
    },
    {
      id: 'boolean_type',
      name: 'BooleanType',
      kind: TypeKind.Primitive,
      primitiveKind: PrimitiveTypeKind.Boolean,
    },

    // Enum type
    {
      id: 'role_enum',
      name: 'Role',
      kind: TypeKind.Enum,
      description: 'User role',
      values: [
        { value: 'admin', description: 'Administrator role' },
        { value: 'user', description: 'Regular user role' },
        { value: 'guest', description: 'Guest role' },
      ],
    },

    // Object type
    {
      id: 'user_type',
      name: 'User',
      kind: TypeKind.Object,
      description: 'User object',
      properties: [
        {
          name: 'id',
          type: { typeId: 'string_type' },
          required: true,
          description: 'User ID',
        },
        {
          name: 'name',
          type: { typeId: 'string_type' },
          required: true,
          description: 'User name',
        },
        {
          name: 'email',
          type: { typeId: 'string_type', nullable: true },
          required: false,
          description: 'User email',
        },
        {
          name: 'age',
          type: { typeId: 'integer_type', nullable: true },
          required: false,
          description: 'User age',
        },
        {
          name: 'role',
          type: { typeId: 'role_enum' },
          required: true,
          description: 'User role',
        },
      ],
      required: ['id', 'name', 'role'],
    },

    // Array type
    {
      id: 'user_array',
      name: 'UserArray',
      kind: TypeKind.Array,
      items: { typeId: 'user_type' },
    },

    // Request/Response types
    {
      id: 'create_user_request',
      name: 'CreateUserRequest',
      kind: TypeKind.Object,
      properties: [
        {
          name: 'name',
          type: { typeId: 'string_type' },
          required: true,
        },
        {
          name: 'email',
          type: { typeId: 'string_type' },
          required: true,
        },
        {
          name: 'role',
          type: { typeId: 'role_enum' },
          required: true,
        },
      ],
      required: ['name', 'email', 'role'],
    },

    {
      id: 'create_user_response',
      name: 'CreateUserResponse',
      kind: TypeKind.Object,
      properties: [
        {
          name: 'user',
          type: { typeId: 'user_type' },
          required: true,
        },
      ],
      required: ['user'],
    },
  ];

  return schema;
}

/**
 * Create a schema with endpoints for testing
 */
export function createSchemaWithEndpoints(): CanonicalSchema {
  const schema = createSchemaWithTypes();

  schema.authentication = [
    {
      id: 'bearer_auth',
      type: AuthSchemeType.Bearer,
      scheme: 'bearer',
      description: 'Bearer token authentication',
    },
  ];

  schema.endpoints = [
    {
      id: 'create_user',
      operationId: 'createUser',
      path: '/users',
      method: HTTPMethod.POST,
      summary: 'Create a new user',
      description: 'Creates a new user in the system',
      requestBody: {
        type: { typeId: 'create_user_request' },
        required: true,
        description: 'User creation data',
      },
      responses: [
        {
          statusCode: 201,
          type: { typeId: 'create_user_response' },
          description: 'User created successfully',
        },
        {
          statusCode: 400,
          type: { typeId: 'string_type' },
          description: 'Bad request',
        },
      ],
      streaming: false,
      authentication: ['bearer_auth'],
    },
    {
      id: 'get_user',
      operationId: 'getUser',
      path: '/users/{id}',
      method: HTTPMethod.GET,
      summary: 'Get a user by ID',
      parameters: [
        {
          name: 'id',
          in: ParameterLocation.Path,
          type: { typeId: 'string_type' },
          required: true,
          description: 'User ID',
        },
      ],
      responses: [
        {
          statusCode: 200,
          type: { typeId: 'user_type' },
          description: 'User found',
        },
        {
          statusCode: 404,
          type: { typeId: 'string_type' },
          description: 'User not found',
        },
      ],
      streaming: false,
      authentication: ['bearer_auth'],
    },
    {
      id: 'list_users',
      operationId: 'listUsers',
      path: '/users',
      method: HTTPMethod.GET,
      summary: 'List all users',
      parameters: [
        {
          name: 'limit',
          in: ParameterLocation.Query,
          type: { typeId: 'integer_type', nullable: true },
          required: false,
          description: 'Maximum number of users to return',
        },
        {
          name: 'offset',
          in: ParameterLocation.Query,
          type: { typeId: 'integer_type', nullable: true },
          required: false,
          description: 'Number of users to skip',
        },
      ],
      responses: [
        {
          statusCode: 200,
          type: { typeId: 'user_array' },
          description: 'List of users',
        },
      ],
      streaming: false,
      authentication: ['bearer_auth'],
    },
  ];

  return schema;
}

/**
 * Helper to validate generated file structure
 */
export interface GeneratedFileExpectations {
  path: string;
  shouldExist: boolean;
  contentIncludes?: string[];
  contentExcludes?: string[];
  minLength?: number;
}

/**
 * Validate generated files against expectations
 */
export function validateGeneratedFiles(
  files: Array<{ path: string; content: string }>,
  expectations: GeneratedFileExpectations[]
): void {
  for (const expectation of expectations) {
    const file = files.find((f) => f.path === expectation.path);

    if (expectation.shouldExist) {
      if (!file) {
        throw new Error(`Expected file not found: ${expectation.path}`);
      }

      if (expectation.minLength && file.content.length < expectation.minLength) {
        throw new Error(
          `File ${expectation.path} is too short: ${file.content.length} < ${expectation.minLength}`
        );
      }

      if (expectation.contentIncludes) {
        for (const text of expectation.contentIncludes) {
          if (!file.content.includes(text)) {
            throw new Error(`File ${expectation.path} does not include: ${text}`);
          }
        }
      }

      if (expectation.contentExcludes) {
        for (const text of expectation.contentExcludes) {
          if (file.content.includes(text)) {
            throw new Error(`File ${expectation.path} should not include: ${text}`);
          }
        }
      }
    } else {
      if (file) {
        throw new Error(`Unexpected file found: ${expectation.path}`);
      }
    }
  }
}
