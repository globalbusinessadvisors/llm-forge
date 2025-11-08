/**
 * Anthropic Parser - Custom schema support
 *
 * Parses Anthropic-specific API schemas and converts them to canonical format.
 * Supports Messages API, streaming, tool calling, and vision capabilities.
 *
 * @module parsers/anthropic-parser
 */

import type {
  CanonicalSchema,
  TypeDefinition,
  EndpointDefinition,
  ParameterDefinition,
  RequestBodyDefinition,
  ResponseDefinition,
  AuthScheme,
  ErrorDefinition,
} from '../types/canonical-schema.js';
import {
  TypeKind,
  PrimitiveTypeKind,
  HTTPMethod,
  AuthSchemeType,
  ParameterLocation,
} from '../types/canonical-schema.js';

/**
 * Anthropic API schema structure
 */
export interface AnthropicSchema {
  /** API version */
  version: string;
  /** API base URL */
  baseUrl: string;
  /** API description */
  description?: string;
  /** Available models */
  models: AnthropicModel[];
  /** API endpoints */
  endpoints: AnthropicEndpoint[];
  /** Type definitions */
  types?: AnthropicTypeDefinition[];
  /** Error definitions */
  errors?: AnthropicError[];
}

/**
 * Anthropic model definition
 */
export interface AnthropicModel {
  /** Model ID */
  id: string;
  /** Model name */
  name: string;
  /** Model description */
  description?: string;
  /** Maximum tokens */
  maxTokens: number;
  /** Context window size */
  contextWindow: number;
  /** Supports vision */
  supportsVision?: boolean;
  /** Supports tools */
  supportsTools?: boolean;
  /** Supports streaming */
  supportsStreaming?: boolean;
  /** Training data cutoff */
  trainingCutoff?: string;
}

/**
 * Anthropic endpoint definition
 */
export interface AnthropicEndpoint {
  /** Endpoint ID */
  id: string;
  /** HTTP method */
  method: string;
  /** URL path */
  path: string;
  /** Endpoint description */
  description?: string;
  /** Request parameters */
  parameters?: AnthropicParameter[];
  /** Request body schema */
  requestBody?: AnthropicRequestBody;
  /** Response schemas */
  responses: AnthropicResponse[];
  /** Supports streaming */
  streaming?: boolean;
  /** Requires authentication */
  requiresAuth?: boolean;
  /** Deprecated */
  deprecated?: boolean;
}

/**
 * Anthropic parameter definition
 */
export interface AnthropicParameter {
  /** Parameter name */
  name: string;
  /** Parameter location */
  in: 'query' | 'header' | 'path';
  /** Parameter type */
  type: string;
  /** Required */
  required?: boolean;
  /** Description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Enum values */
  enum?: string[];
}

/**
 * Anthropic request body definition
 */
export interface AnthropicRequestBody {
  /** Content type */
  contentType: string;
  /** Schema reference or inline definition */
  schema: string | AnthropicTypeDefinition;
  /** Required */
  required?: boolean;
  /** Description */
  description?: string;
}

/**
 * Anthropic response definition
 */
export interface AnthropicResponse {
  /** HTTP status code */
  statusCode: number | 'default';
  /** Response description */
  description?: string;
  /** Content type */
  contentType?: string;
  /** Schema reference or inline definition */
  schema?: string | AnthropicTypeDefinition;
}

/**
 * Anthropic type definition
 */
export interface AnthropicTypeDefinition {
  /** Type name */
  name: string;
  /** Type kind */
  kind: 'object' | 'enum' | 'array' | 'union' | 'primitive';
  /** Description */
  description?: string;
  /** Properties (for object types) */
  properties?: AnthropicProperty[];
  /** Required properties */
  required?: string[];
  /** Enum values */
  values?: Array<{ value: string | number; description?: string }>;
  /** Array item type */
  items?: string | AnthropicTypeDefinition;
  /** Union variants */
  variants?: Array<string | AnthropicTypeDefinition>;
  /** Primitive type */
  primitiveType?: 'string' | 'number' | 'integer' | 'boolean' | 'null';
}

/**
 * Anthropic property definition
 */
export interface AnthropicProperty {
  /** Property name */
  name: string;
  /** Property type */
  type: string | AnthropicTypeDefinition;
  /** Description */
  description?: string;
  /** Required */
  required?: boolean;
  /** Default value */
  default?: unknown;
}

/**
 * Anthropic error definition
 */
export interface AnthropicError {
  /** Error code */
  code: string;
  /** HTTP status code */
  statusCode: number;
  /** Error description */
  description: string;
  /** Error type */
  type?: string;
}

/**
 * Anthropic parser options
 */
export interface AnthropicParserOptions {
  /** Provider ID */
  providerId: string;
  /** Provider name */
  providerName: string;
  /** Include deprecated endpoints */
  includeDeprecated?: boolean;
  /** API version to use */
  apiVersion?: string;
}

/**
 * Parse result
 */
export interface ParseResult {
  /** Success flag */
  success: boolean;
  /** Parsed schema */
  schema?: CanonicalSchema;
  /** Errors */
  errors: string[];
  /** Warnings */
  warnings: string[];
}

/**
 * Anthropic Schema Parser
 *
 * Parses Anthropic-specific API schemas and converts them to canonical format.
 *
 * @example
 * ```typescript
 * const parser = new AnthropicParser({
 *   providerId: 'anthropic',
 *   providerName: 'Anthropic'
 * });
 *
 * const result = await parser.parse(anthropicSchema);
 * if (result.success) {
 *   // Use result.schema
 * }
 * ```
 */
export class AnthropicParser {
  private options: Required<AnthropicParserOptions>;
  private errors: string[] = [];
  private warnings: string[] = [];
  private typeIdCounter = 0;
  private typeMap = new Map<string, TypeDefinition>();

  constructor(options: AnthropicParserOptions) {
    this.options = {
      includeDeprecated: false,
      apiVersion: 'latest',
      ...options,
    };
  }

  /**
   * Parse an Anthropic schema
   *
   * @param input - Anthropic schema object or file path
   * @returns Parse result with canonical schema
   */
  async parse(input: AnthropicSchema | string): Promise<ParseResult> {
    try {
      // Reset state
      this.errors = [];
      this.warnings = [];
      this.typeIdCounter = 0;
      this.typeMap.clear();

      let schema: AnthropicSchema;

      if (typeof input === 'string') {
        // Load from file
        const fs = await import('fs/promises');
        const content = await fs.readFile(input, 'utf-8');
        schema = JSON.parse(content) as AnthropicSchema;
      } else {
        schema = input;
      }

      // Validate schema
      if (!this.validateSchema(schema)) {
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Convert to canonical schema
      const canonicalSchema = this.convertToCanonicalSchema(schema);

      if (this.errors.length > 0) {
        return { success: false, schema: canonicalSchema, errors: this.errors, warnings: this.warnings };
      }

      return { success: true, schema: canonicalSchema, errors: [], warnings: this.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errors.push(`Parse error: ${message}`);
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Validate Anthropic schema
   */
  private validateSchema(schema: AnthropicSchema): boolean {
    if (!schema.version) {
      this.errors.push('Schema version is required');
      return false;
    }

    if (!schema.baseUrl) {
      this.errors.push('Base URL is required');
      return false;
    }

    if (!schema.endpoints || schema.endpoints.length === 0) {
      this.errors.push('At least one endpoint is required');
      return false;
    }

    return true;
  }

  /**
   * Convert Anthropic schema to canonical schema
   */
  private convertToCanonicalSchema(schema: AnthropicSchema): CanonicalSchema {
    const types: TypeDefinition[] = [];
    const endpoints: EndpointDefinition[] = [];
    const authentication: AuthScheme[] = [];
    const errors: ErrorDefinition[] = [];

    // Convert types
    if (schema.types) {
      for (const type of schema.types) {
        const typeDef = this.convertType(type);
        if (typeDef) {
          types.push(typeDef);
          this.typeMap.set(type.name, typeDef);
        }
      }
    }

    // Convert endpoints
    for (const endpoint of schema.endpoints) {
      if (!this.options.includeDeprecated && endpoint.deprecated) {
        continue;
      }

      const endpointDef = this.convertEndpoint(endpoint, schema);
      if (endpointDef) {
        endpoints.push(endpointDef);
      }
    }

    // Add API key authentication
    authentication.push({
      id: 'apiKey',
      type: AuthSchemeType.ApiKey,
      in: 'header',
      name: 'x-api-key',
      description: 'Anthropic API key authentication',
    });

    // Convert errors
    if (schema.errors) {
      for (const error of schema.errors) {
        errors.push({
          code: error.code,
          statusCode: error.statusCode,
          message: error.description,
          description: error.description,
        });
      }
    }

    // Build metadata
    const metadata = {
      version: '1.0.0',
      providerId: this.options.providerId,
      providerName: this.options.providerName,
      apiVersion: schema.version,
      generatedAt: new Date().toISOString(),
      metadata: {
        baseUrl: schema.baseUrl,
        description: schema.description,
        models: schema.models,
      },
    };

    return {
      metadata,
      types,
      endpoints,
      authentication,
      errors,
    };
  }

  /**
   * Convert Anthropic type to canonical type
   */
  private convertType(type: AnthropicTypeDefinition): TypeDefinition | null {
    const typeId = this.generateTypeId();

    switch (type.kind) {
      case 'object':
        return this.convertObjectType(type, typeId);
      case 'enum':
        return this.convertEnumType(type, typeId);
      case 'array':
        return this.convertArrayType(type, typeId);
      case 'union':
        return this.convertUnionType(type, typeId);
      case 'primitive':
        return this.convertPrimitiveType(type, typeId);
      default:
        this.warnings.push(`Unknown type kind: ${type.kind}`);
        return null;
    }
  }

  /**
   * Convert object type
   */
  private convertObjectType(type: AnthropicTypeDefinition, typeId: string): TypeDefinition {
    const properties: Array<{ name: string; type: { typeId: string }; description?: string; required: boolean; default?: unknown }> = [];
    const required = new Set(type.required ?? []);

    if (type.properties) {
      for (const prop of type.properties) {
        let propTypeId: string;

        if (typeof prop.type === 'string') {
          // Reference to existing type
          const existingType = this.typeMap.get(prop.type);
          if (existingType) {
            propTypeId = existingType.id;
          } else {
            // Create inline primitive type
            const inlineType = this.convertType({
              name: `${type.name}_${prop.name}`,
              kind: 'primitive',
              primitiveType: prop.type as 'string' | 'number' | 'integer' | 'boolean',
            });
            propTypeId = inlineType?.id ?? this.generateTypeId();
            if (inlineType) {
              this.typeMap.set(`${type.name}_${prop.name}`, inlineType);
            }
          }
        } else {
          // Inline type definition
          const inlineType = this.convertType(prop.type);
          propTypeId = inlineType?.id ?? this.generateTypeId();
          if (inlineType) {
            this.typeMap.set(prop.type.name, inlineType);
          }
        }

        properties.push({
          name: prop.name,
          type: { typeId: propTypeId },
          description: prop.description,
          required: required.has(prop.name) || !!prop.required,
          default: prop.default,
        });
      }
    }

    return {
      id: typeId,
      name: type.name,
      kind: TypeKind.Object,
      properties,
      required: Array.from(required),
      description: type.description,
    };
  }

  /**
   * Convert enum type
   */
  private convertEnumType(type: AnthropicTypeDefinition, typeId: string): TypeDefinition {
    const values = (type.values ?? []).map((v) => ({
      value: v.value,
      description: v.description,
    }));

    return {
      id: typeId,
      name: type.name,
      kind: TypeKind.Enum,
      values,
      description: type.description,
    };
  }

  /**
   * Convert array type
   */
  private convertArrayType(type: AnthropicTypeDefinition, typeId: string): TypeDefinition {
    let itemsTypeId: string;

    if (typeof type.items === 'string') {
      const existingType = this.typeMap.get(type.items);
      itemsTypeId = existingType?.id ?? this.generateTypeId();
    } else if (type.items) {
      const itemsType = this.convertType(type.items);
      itemsTypeId = itemsType?.id ?? this.generateTypeId();
      if (itemsType) {
        this.typeMap.set(type.items.name, itemsType);
      }
    } else {
      itemsTypeId = this.generateTypeId();
    }

    return {
      id: typeId,
      name: type.name,
      kind: TypeKind.Array,
      items: { typeId: itemsTypeId },
      description: type.description,
    };
  }

  /**
   * Convert union type
   */
  private convertUnionType(type: AnthropicTypeDefinition, typeId: string): TypeDefinition {
    const variants: Array<{ typeId: string }> = [];

    if (type.variants) {
      for (const variant of type.variants) {
        let variantTypeId: string;

        if (typeof variant === 'string') {
          const existingType = this.typeMap.get(variant);
          variantTypeId = existingType?.id ?? this.generateTypeId();
        } else {
          const variantType = this.convertType(variant);
          variantTypeId = variantType?.id ?? this.generateTypeId();
          if (variantType) {
            this.typeMap.set(variant.name, variantType);
          }
        }

        variants.push({ typeId: variantTypeId });
      }
    }

    return {
      id: typeId,
      name: type.name,
      kind: TypeKind.Union,
      variants,
      description: type.description,
    };
  }

  /**
   * Convert primitive type
   */
  private convertPrimitiveType(type: AnthropicTypeDefinition, typeId: string): TypeDefinition {
    const primitiveKindMap: Record<string, PrimitiveTypeKind> = {
      string: PrimitiveTypeKind.String,
      number: PrimitiveTypeKind.Float,
      integer: PrimitiveTypeKind.Integer,
      boolean: PrimitiveTypeKind.Boolean,
      null: PrimitiveTypeKind.Null,
    };

    const primitiveKind = primitiveKindMap[type.primitiveType ?? 'string'] ?? PrimitiveTypeKind.String;

    return {
      id: typeId,
      name: type.name,
      kind: TypeKind.Primitive,
      primitiveKind,
      description: type.description,
    };
  }

  /**
   * Convert endpoint to canonical format
   */
  private convertEndpoint(endpoint: AnthropicEndpoint, schema: AnthropicSchema): EndpointDefinition | null {
    const parameters: ParameterDefinition[] = [];

    // Convert parameters
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        const paramDef = this.convertParameter(param);
        if (paramDef) {
          parameters.push(paramDef);
        }
      }
    }

    // Convert request body
    let requestBody: RequestBodyDefinition | undefined;
    if (endpoint.requestBody) {
      requestBody = this.convertRequestBody(endpoint.requestBody);
    }

    // Convert responses
    const responses: ResponseDefinition[] = [];
    for (const response of endpoint.responses) {
      const responseDef = this.convertResponse(response);
      if (responseDef) {
        responses.push(responseDef);
      }
    }

    return {
      id: endpoint.id,
      operationId: endpoint.id,
      path: endpoint.path,
      method: endpoint.method.toUpperCase() as HTTPMethod,
      description: endpoint.description,
      parameters,
      requestBody,
      responses,
      streaming: endpoint.streaming ?? false,
      authentication: endpoint.requiresAuth !== false ? ['apiKey'] : [],
      deprecated: endpoint.deprecated,
    };
  }

  /**
   * Convert parameter to canonical format
   */
  private convertParameter(param: AnthropicParameter): ParameterDefinition | null {
    // Create inline type for parameter
    const typeId = this.generateTypeId();
    const paramType: TypeDefinition = {
      id: typeId,
      name: `${param.name}Type`,
      kind: TypeKind.Primitive,
      primitiveKind: this.mapPrimitiveType(param.type),
    };

    return {
      name: param.name,
      in: param.in as ParameterLocation,
      type: { typeId: paramType.id },
      required: param.required ?? false,
      description: param.description,
      default: param.default,
    };
  }

  /**
   * Convert request body to canonical format
   */
  private convertRequestBody(requestBody: AnthropicRequestBody): RequestBodyDefinition | null {
    let typeId: string;

    if (typeof requestBody.schema === 'string') {
      const existingType = this.typeMap.get(requestBody.schema);
      typeId = existingType?.id ?? this.generateTypeId();
    } else {
      const bodyType = this.convertType(requestBody.schema);
      typeId = bodyType?.id ?? this.generateTypeId();
      if (bodyType) {
        this.typeMap.set(requestBody.schema.name, bodyType);
      }
    }

    return {
      type: { typeId },
      required: requestBody.required ?? true,
      contentType: requestBody.contentType,
      description: requestBody.description,
    };
  }

  /**
   * Convert response to canonical format
   */
  private convertResponse(response: AnthropicResponse): ResponseDefinition | null {
    let type: { typeId: string } | undefined;

    if (response.schema) {
      if (typeof response.schema === 'string') {
        const existingType = this.typeMap.get(response.schema);
        if (existingType) {
          type = { typeId: existingType.id };
        }
      } else {
        const responseType = this.convertType(response.schema);
        if (responseType) {
          type = { typeId: responseType.id };
          this.typeMap.set(response.schema.name, responseType);
        }
      }
    }

    return {
      statusCode: response.statusCode,
      type,
      description: response.description,
      contentType: response.contentType ?? 'application/json',
    };
  }

  /**
   * Map primitive type string to canonical primitive type kind
   */
  private mapPrimitiveType(type: string): PrimitiveTypeKind {
    const typeMap: Record<string, PrimitiveTypeKind> = {
      string: PrimitiveTypeKind.String,
      number: PrimitiveTypeKind.Float,
      integer: PrimitiveTypeKind.Integer,
      boolean: PrimitiveTypeKind.Boolean,
      null: PrimitiveTypeKind.Null,
    };

    return typeMap[type.toLowerCase()] ?? PrimitiveTypeKind.String;
  }

  /**
   * Generate unique type ID
   */
  private generateTypeId(): string {
    return `type_${this.typeIdCounter++}`;
  }
}

/**
 * Parse Anthropic schema (convenience function)
 *
 * @param input - Anthropic schema object or file path
 * @param options - Parser options
 * @returns Parse result
 */
export async function parseAnthropicSchema(
  input: AnthropicSchema | string,
  options: AnthropicParserOptions
): Promise<ParseResult> {
  const parser = new AnthropicParser(options);
  return parser.parse(input);
}
