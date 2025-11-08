/**
 * OpenAPI Parser
 *
 * Parses OpenAPI 3.0/3.1 specifications and converts them to canonical schema format.
 * Supports both YAML and JSON formats, with full reference resolution.
 *
 * @module parsers/openapi-parser
 */

import $RefParser from '@apidevtools/json-schema-ref-parser';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

import type {
  CanonicalSchema,
  TypeDefinition,
  EndpointDefinition,
  AuthScheme,
  ErrorDefinition,
  PropertyDefinition,
  TypeReference,
  ParameterDefinition,
  RequestBodyDefinition,
  ResponseDefinition,
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
 * OpenAPI document type (supports both 3.0 and 3.1)
 */
type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject;

/**
 * Parser options
 */
export interface OpenAPIParserOptions {
  /** Provider ID (e.g., 'openai', 'cohere') */
  providerId: string;
  /** Provider display name */
  providerName: string;
  /** Resolve external $ref references */
  resolveRefs?: boolean;
  /** Strict mode (fail on warnings) */
  strict?: boolean;
}

/**
 * Parser result
 */
export interface ParseResult {
  success: boolean;
  schema?: CanonicalSchema;
  errors: string[];
  warnings: string[];
}

/**
 * OpenAPI Parser class
 */
export class OpenAPIParser {
  private options: Required<OpenAPIParserOptions>;
  private typeIdCounter = 0;
  private typeMap = new Map<string, TypeDefinition>(); // JSON pointer -> TypeDefinition (changed from string to TypeDefinition)
  private refToType = new Map<string, TypeDefinition>(); // $ref path -> TypeDefinition
  private schemaToType = new WeakMap<object, TypeDefinition>(); // Schema object -> TypeDefinition
  private allTypes: TypeDefinition[] = []; // All type definitions (components + inline)
  private warnings: string[] = [];
  private errors: string[] = [];
  private document?: OpenAPIDocument; // Store document for $ref resolution

  constructor(options: OpenAPIParserOptions) {
    this.options = {
      resolveRefs: true,
      strict: false,
      ...options,
    };
  }

  /**
   * Parse an OpenAPI document
   *
   * @param input - OpenAPI document (object) or file path (string)
   * @returns Parse result with canonical schema
   */
  async parse(input: OpenAPIDocument | string): Promise<ParseResult> {
    try {
      // Reset state
      this.typeIdCounter = 0;
      this.typeMap.clear();
      this.refToType.clear();
      this.schemaToType = new WeakMap();
      this.allTypes = [];
      this.warnings = [];
      this.errors = [];
      this.document = undefined;

      // Load document (parse but don't dereference yet)
      let document: OpenAPIDocument;

      if (typeof input === 'string') {
        // Parse from file
        const parsed = (await $RefParser.parse(input)) as OpenAPIDocument;
        // Bundle to resolve external refs but keep internal structure
        document = (await $RefParser.bundle(parsed)) as OpenAPIDocument;
      } else {
        // Already an object
        if (this.options.resolveRefs) {
          document = (await $RefParser.bundle(input)) as OpenAPIDocument;
        } else {
          document = input;
        }
      }

      // Validate OpenAPI version
      if (!this.isOpenAPI3(document)) {
        this.errors.push('Only OpenAPI 3.0.x and 3.1.x are supported');
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Store document for $ref resolution
      this.document = document;

      // Convert to canonical schema
      const schema = this.convertToCanonicalSchema(document);

      if (this.errors.length > 0) {
        return { success: false, schema, errors: this.errors, warnings: this.warnings };
      }

      return { success: true, schema, errors: [], warnings: this.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errors.push(`Parse error: ${message}`);
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Check if document is OpenAPI 3.x
   */
  private isOpenAPI3(doc: OpenAPIDocument): boolean {
    return doc.openapi?.startsWith('3.') ?? false;
  }

  /**
   * Convert OpenAPI document to canonical schema
   */
  private convertToCanonicalSchema(document: OpenAPIDocument): CanonicalSchema {
    const endpoints: EndpointDefinition[] = [];
    const authentication: AuthScheme[] = [];
    const errors: ErrorDefinition[] = [];

    // Extract types from components/schemas
    if (document.components?.schemas) {
      for (const [name, schema] of Object.entries(document.components.schemas)) {
        // Convert schema - type is automatically added to allTypes
        this.convertSchema(schema as SchemaObject, name);
      }
    }

    // Extract endpoints from paths
    if (document.paths) {
      for (const [path, pathItem] of Object.entries(document.paths)) {
        if (!pathItem) continue;

        for (const [method, operation] of Object.entries(pathItem)) {
          if (!this.isHttpMethod(method) || !operation) continue;

          const endpoint = this.convertOperation(
            path,
            method.toUpperCase() as HTTPMethod,
            operation as OpenAPIV3.OperationObject
          );

          if (endpoint) {
            endpoints.push(endpoint);
          }
        }
      }
    }

    // Extract authentication schemes
    if (document.components?.securitySchemes) {
      for (const [name, scheme] of Object.entries(document.components.securitySchemes)) {
        const authScheme = this.convertSecurityScheme(name, scheme as SecuritySchemeObject);
        if (authScheme) {
          authentication.push(authScheme);
        }
      }
    }

    // Build metadata
    const metadata = {
      version: '1.0.0',
      providerId: this.options.providerId,
      providerName: this.options.providerName,
      apiVersion: document.info.version,
      generatedAt: new Date().toISOString(),
      metadata: {
        title: document.info.title,
        description: document.info.description,
        termsOfService: document.info.termsOfService,
        contact: document.info.contact,
        license: document.info.license,
      },
    };

    return {
      metadata,
      types: this.allTypes,
      endpoints,
      authentication,
      errors,
    };
  }

  /**
   * Convert OpenAPI schema to type definition
   */
  private convertSchema(schema: SchemaObject, name: string, pointer = ''): TypeDefinition | null {
    // Handle $ref
    const schemaWithRef = schema as SchemaObject & { $ref?: string };
    if (schemaWithRef.$ref) {
      // Check if we've already processed this $ref
      if (this.refToType.has(schemaWithRef.$ref)) {
        return this.refToType.get(schemaWithRef.$ref)!;
      }

      // Extract the type name from the $ref path
      // e.g., "#/components/schemas/ChatMessage" -> "ChatMessage"
      const refParts = schemaWithRef.$ref.split('/');
      const refName = refParts[refParts.length - 1] ?? name;

      // Get the actual schema from components
      if (this.document?.components?.schemas) {
        const refSchema = this.document.components.schemas[refName];
        if (refSchema) {
          const typeDef = this.convertSchema(refSchema as SchemaObject, refName);
          if (typeDef) {
            // Cache the $ref -> type mapping
            this.refToType.set(schemaWithRef.$ref, typeDef);
          }
          return typeDef;
        }
      }
    }

    // Check if this schema object was already converted
    if (this.schemaToType.has(schema)) {
      // Return existing type definition
      return this.schemaToType.get(schema)!;
    }

    // Check for existing type by pointer
    if (pointer && this.typeMap.has(pointer)) {
      // Return the existing type definition instead of null
      return this.typeMap.get(pointer)!;
    }

    const typeId = this.generateTypeId();

    // Handle different schema types
    let typeDef: TypeDefinition;

    if (schema.enum) {
      typeDef = this.convertEnumSchema(schema, name, typeId);
    } else if (schema.type === 'object' || schema.properties || schema.allOf || schema.anyOf) {
      typeDef = this.convertObjectSchema(schema, name, typeId);
    } else if (schema.type === 'array') {
      typeDef = this.convertArraySchema(schema, name, typeId);
    } else if (schema.oneOf) {
      typeDef = this.convertUnionSchema(schema, name, typeId);
    } else {
      // Primitive type
      typeDef = this.convertPrimitiveSchema(schema, name, typeId);
    }

    // Register this type definition
    this.schemaToType.set(schema, typeDef);
    this.allTypes.push(typeDef);

    // Also register by pointer if we have one
    if (pointer) {
      this.typeMap.set(pointer, typeDef);
    }

    return typeDef;
  }

  /**
   * Convert primitive schema
   */
  private convertPrimitiveSchema(
    schema: SchemaObject,
    name: string,
    typeId: string
  ): TypeDefinition {
    const primitiveKind = this.mapPrimitiveType(schema.type as string);

    return {
      id: typeId,
      name,
      kind: TypeKind.Primitive,
      primitiveKind,
      description: schema.description,
      deprecated: schema.deprecated,
      constraints: {
        minLength: schema.minLength,
        maxLength: schema.maxLength,
        pattern: schema.pattern,
        format: schema.format,
        minimum: schema.minimum,
        maximum: schema.maximum,
        exclusiveMinimum: schema.exclusiveMinimum as boolean | undefined,
        exclusiveMaximum: schema.exclusiveMaximum as boolean | undefined,
        multipleOf: schema.multipleOf,
      },
    };
  }

  /**
   * Convert object schema
   */
  private convertObjectSchema(
    schema: SchemaObject,
    name: string,
    typeId: string
  ): TypeDefinition {
    const properties: PropertyDefinition[] = [];
    const required = new Set(schema.required ?? []);

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propTypeDef = this.convertSchema(
          propSchema as SchemaObject,
          propName,
          `${name}.${propName}`
        );

        properties.push({
          name: propName,
          type: { typeId: propTypeDef?.id ?? this.generateTypeId() },
          description: (propSchema as SchemaObject).description,
          required: required.has(propName),
          default: (propSchema as SchemaObject).default,
          deprecated: (propSchema as SchemaObject).deprecated,
        });
      }
    }

    return {
      id: typeId,
      name,
      kind: TypeKind.Object,
      properties,
      required: Array.from(required),
      additionalProperties: schema.additionalProperties as TypeReference | boolean | undefined,
      description: schema.description,
      deprecated: schema.deprecated,
    };
  }

  /**
   * Convert array schema
   */
  private convertArraySchema(
    schema: SchemaObject,
    name: string,
    typeId: string
  ): TypeDefinition {
    const itemsSchema = (schema as { items?: SchemaObject }).items;
    if (!itemsSchema) {
      throw new Error(`Array schema ${name} has no items definition`);
    }
    const itemsType = this.convertSchema(itemsSchema, `${name}Item`);

    return {
      id: typeId,
      name,
      kind: TypeKind.Array,
      items: { typeId: itemsType?.id ?? this.generateTypeId() },
      minItems: schema.minItems,
      maxItems: schema.maxItems,
      uniqueItems: schema.uniqueItems,
      description: schema.description,
      deprecated: schema.deprecated,
    };
  }

  /**
   * Convert union schema (oneOf)
   */
  private convertUnionSchema(
    schema: SchemaObject,
    name: string,
    typeId: string
  ): TypeDefinition {
    const variants: TypeReference[] = [];

    if (schema.oneOf) {
      schema.oneOf.forEach((variant, variantIdx) => {
        const variantType = this.convertSchema(
          variant as SchemaObject,
          `${name}Variant${variantIdx + 1}`
        );

        if (variantType) {
          variants.push({ typeId: variantType.id });
        }
      });
    }

    return {
      id: typeId,
      name,
      kind: TypeKind.Union,
      variants,
      description: schema.description,
      deprecated: schema.deprecated,
    };
  }

  /**
   * Convert enum schema
   */
  private convertEnumSchema(schema: SchemaObject, name: string, typeId: string): TypeDefinition {
    const values = (schema.enum ?? []).map((value) => ({
      value: value as string | number,
      name: String(value),
      description: schema.description,
    }));

    const valueType = typeof schema.enum?.[0] === 'number' ? 'number' : 'string';

    return {
      id: typeId,
      name,
      kind: TypeKind.Enum,
      values,
      valueType,
      description: schema.description,
      deprecated: schema.deprecated,
    };
  }

  /**
   * Convert OpenAPI operation to endpoint definition
   */
  private convertOperation(
    path: string,
    method: HTTPMethod,
    operation: OpenAPIV3.OperationObject
  ): EndpointDefinition | null {
    const operationId = operation.operationId ?? `${method.toLowerCase()}_${path.replace(/[/{}]/g, '_')}`;

    // Convert parameters
    const parameters: ParameterDefinition[] = [];
    if (operation.parameters) {
      for (const param of operation.parameters) {
        const paramObj = param as ParameterObject;
        const paramDef = this.convertParameter(paramObj);
        if (paramDef) {
          parameters.push(paramDef);
        }
      }
    }

    // Convert request body
    let requestBody: RequestBodyDefinition | undefined = undefined;
    if (operation.requestBody) {
      const converted = this.convertRequestBody(operation.requestBody as RequestBodyObject);
      if (converted !== null) {
        requestBody = converted;
      }
    }

    // Convert responses
    const responses: ResponseDefinition[] = [];
    if (operation.responses) {
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        const responseDef = this.convertResponse(statusCode, response as ResponseObject);
        if (responseDef) {
          responses.push(responseDef);
        }
      }
    }

    // Check for streaming support (basic heuristic)
    const streaming =
      operation.description?.toLowerCase().includes('stream') ||
      operation.summary?.toLowerCase().includes('stream') ||
      false;

    // Extract authentication requirements
    const authentication: string[] = [];
    if (operation.security) {
      for (const secReq of operation.security) {
        authentication.push(...Object.keys(secReq));
      }
    }

    return {
      id: `${method}_${path}`,
      operationId,
      path,
      method,
      summary: operation.summary,
      description: operation.description,
      parameters,
      requestBody,
      responses,
      streaming,
      authentication,
      tags: operation.tags,
      deprecated: operation.deprecated,
    };
  }

  /**
   * Convert parameter
   */
  private convertParameter(param: ParameterObject): ParameterDefinition | null {
    const paramType = this.convertSchema(param.schema as SchemaObject, param.name);

    if (!paramType) {
      this.warnings.push(`Could not convert parameter: ${param.name}`);
      return null;
    }

    return {
      name: param.name,
      in: param.in as ParameterLocation,
      type: { typeId: paramType.id },
      required: param.required ?? false,
      description: param.description,
      deprecated: param.deprecated,
    };
  }

  /**
   * Convert request body
   */
  private convertRequestBody(requestBody: RequestBodyObject): RequestBodyDefinition | null {
    // Get JSON content (prefer application/json)
    const content = requestBody.content['application/json'] ?? Object.values(requestBody.content)[0];

    if (!content?.schema) {
      this.warnings.push('Request body has no schema');
      return null;
    }

    const bodyType = this.convertSchema(content.schema as SchemaObject, 'RequestBody');

    if (!bodyType) {
      return null;
    }

    return {
      type: { typeId: bodyType.id },
      required: requestBody.required ?? false,
      contentType: 'application/json',
      description: requestBody.description,
    };
  }

  /**
   * Convert response
   */
  private convertResponse(statusCode: string, response: ResponseObject): ResponseDefinition | null {
    const status = statusCode === 'default' ? 'default' : parseInt(statusCode, 10);

    let type: TypeReference | undefined;

    if (response.content) {
      const content =
        response.content['application/json'] ?? Object.values(response.content)[0];

      if (content?.schema) {
        const responseType = this.convertSchema(content.schema as SchemaObject, 'Response');
        if (responseType) {
          type = { typeId: responseType.id };
        }
      }
    }

    return {
      statusCode: status,
      type,
      description: response.description,
      contentType: 'application/json',
    };
  }

  /**
   * Convert security scheme
   */
  private convertSecurityScheme(
    id: string,
    scheme: SecuritySchemeObject
  ): AuthScheme | null {
    if (scheme.type === 'apiKey') {
      return {
        id,
        type: AuthSchemeType.ApiKey,
        in: scheme.in as 'header' | 'query',
        name: scheme.name,
        description: scheme.description,
      };
    }

    if (scheme.type === 'http' && scheme.scheme === 'bearer') {
      return {
        id,
        type: AuthSchemeType.Bearer,
        scheme: scheme.scheme,
        description: scheme.description,
      };
    }

    if (scheme.type === 'http' && scheme.scheme === 'basic') {
      return {
        id,
        type: AuthSchemeType.Basic,
        description: scheme.description,
      };
    }

    if (scheme.type === 'oauth2' && scheme.flows) {
      const flows = Object.entries(scheme.flows).map(([flowType, flow]) => {
        // OAuth2 flows have different required fields, so we access them safely
        const anyFlow = flow as {
          authorizationUrl?: string;
          tokenUrl?: string;
          refreshUrl?: string;
          scopes?: Record<string, string>;
        };
        return {
          type: this.mapOAuth2FlowType(flowType),
          authorizationUrl: anyFlow.authorizationUrl,
          tokenUrl: anyFlow.tokenUrl,
          refreshUrl: anyFlow.refreshUrl,
          scopes: anyFlow.scopes,
        };
      });

      return {
        id,
        type: AuthSchemeType.OAuth2,
        flows,
        description: scheme.description,
      };
    }

    this.warnings.push(`Unsupported security scheme type: ${scheme.type}`);
    return null;
  }

  /**
   * Map OpenAPI primitive type to canonical primitive type
   */
  private mapPrimitiveType(type: string): PrimitiveTypeKind {
    switch (type) {
      case 'string':
        return PrimitiveTypeKind.String;
      case 'integer':
        return PrimitiveTypeKind.Integer;
      case 'number':
        return PrimitiveTypeKind.Float;
      case 'boolean':
        return PrimitiveTypeKind.Boolean;
      case 'null':
        return PrimitiveTypeKind.Null;
      default:
        this.warnings.push(`Unknown primitive type: ${type}, defaulting to string`);
        return PrimitiveTypeKind.String;
    }
  }

  /**
   * Map OAuth2 flow type
   */
  private mapOAuth2FlowType(flowType: string): OAuth2FlowType {
    switch (flowType) {
      case 'authorizationCode':
        return OAuth2FlowType.AuthorizationCode;
      case 'clientCredentials':
        return OAuth2FlowType.ClientCredentials;
      case 'implicit':
        return OAuth2FlowType.Implicit;
      case 'password':
        return OAuth2FlowType.Password;
      default:
        return OAuth2FlowType.AuthorizationCode;
    }
  }

  /**
   * Check if method is a valid HTTP method
   */
  private isHttpMethod(method: string): boolean {
    const validMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    return validMethods.includes(method.toLowerCase());
  }

  /**
   * Generate unique type ID
   */
  private generateTypeId(): string {
    return `type_${this.typeIdCounter++}`;
  }
}

/**
 * Parse OpenAPI document (convenience function)
 *
 * @param input - OpenAPI document or file path
 * @param options - Parser options
 * @returns Parse result
 */
export async function parseOpenAPI(
  input: OpenAPIDocument | string,
  options: OpenAPIParserOptions
): Promise<ParseResult> {
  const parser = new OpenAPIParser(options);
  return parser.parse(input);
}
