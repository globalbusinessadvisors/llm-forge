/**
 * Canonical Schema - Unified Intermediate Representation (UIR)
 *
 * This file defines the provider-agnostic schema format that serves as the
 * single source of truth for SDK generation across all languages.
 *
 * Design Principles:
 * 1. Lossless conversion from provider schemas
 * 2. Extensible without breaking changes
 * 3. Strongly typed and validated
 * 4. Version tracked for compatibility
 *
 * @module canonical-schema
 */

/**
 * HTTP methods supported by API endpoints
 */
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Primitive type kinds in the canonical type system
 */
export enum PrimitiveTypeKind {
  String = 'string',
  Integer = 'integer',
  Float = 'float',
  Boolean = 'boolean',
  Null = 'null',
}

/**
 * All possible type kinds in the UIR
 */
export enum TypeKind {
  Primitive = 'primitive',
  Object = 'object',
  Array = 'array',
  Union = 'union',
  Enum = 'enum',
  Reference = 'reference',
}

/**
 * Authentication scheme types
 */
export enum AuthSchemeType {
  ApiKey = 'apiKey',
  Bearer = 'bearer',
  OAuth2 = 'oauth2',
  Basic = 'basic',
}

/**
 * OAuth2 flow types
 */
export enum OAuth2FlowType {
  AuthorizationCode = 'authorizationCode',
  ClientCredentials = 'clientCredentials',
  Implicit = 'implicit',
  Password = 'password',
}

/**
 * Metadata about the canonical schema version and provider
 */
export interface SchemaMetadata {
  /** Schema version for compatibility tracking */
  version: string;
  /** Provider identifier (e.g., 'openai', 'anthropic') */
  providerId: string;
  /** Provider display name */
  providerName: string;
  /** Provider API version */
  apiVersion: string;
  /** Schema generation timestamp */
  generatedAt: string;
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Base interface for all type definitions
 */
export interface BaseTypeDefinition {
  /** Unique identifier for this type */
  id: string;
  /** Type name */
  name: string;
  /** Type kind discriminator */
  kind: TypeKind;
  /** Human-readable description */
  description?: string;
  /** Whether this type is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Reference to another type by ID
 */
export interface TypeReference {
  /** Referenced type ID */
  typeId: string;
  /** Whether the reference is nullable */
  nullable?: boolean;
}

/**
 * Primitive type definition (string, integer, float, boolean, null)
 */
export interface PrimitiveType extends BaseTypeDefinition {
  kind: TypeKind.Primitive;
  /** Primitive type kind */
  primitiveKind: PrimitiveTypeKind;
  /** Validation constraints */
  constraints?: PrimitiveConstraints;
}

/**
 * Validation constraints for primitive types
 */
export interface PrimitiveConstraints {
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string; // email, uri, date-time, uuid, etc.

  // Numeric constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  multipleOf?: number;

  // Enum values (for string/number enums without dedicated enum type)
  enum?: Array<string | number>;
}

/**
 * Property definition for object types
 */
export interface PropertyDefinition {
  /** Property name */
  name: string;
  /** Property type reference */
  type: TypeReference;
  /** Property description */
  description?: string;
  /** Whether this property is required */
  required: boolean;
  /** Default value */
  default?: unknown;
  /** Validation constraints */
  constraints?: PrimitiveConstraints;
  /** Whether this property is deprecated */
  deprecated?: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Object type definition (structs, classes, interfaces)
 */
export interface ObjectType extends BaseTypeDefinition {
  kind: TypeKind.Object;
  /** Object properties */
  properties: PropertyDefinition[];
  /** Names of required properties */
  required: string[];
  /** Additional properties type (if allowed) */
  additionalProperties?: TypeReference | boolean;
  /** Whether this is a discriminated union variant */
  discriminator?: string;
}

/**
 * Array type definition
 */
export interface ArrayType extends BaseTypeDefinition {
  kind: TypeKind.Array;
  /** Type of array items */
  items: TypeReference;
  /** Minimum number of items */
  minItems?: number;
  /** Maximum number of items */
  maxItems?: number;
  /** Whether items must be unique */
  uniqueItems?: boolean;
}

/**
 * Union type definition (oneOf, anyOf)
 */
export interface UnionType extends BaseTypeDefinition {
  kind: TypeKind.Union;
  /** Possible union variants */
  variants: TypeReference[];
  /** Discriminator property name (for tagged unions) */
  discriminator?: string;
  /** Mapping of discriminator values to variant types */
  discriminatorMapping?: Record<string, string>;
}

/**
 * Enum value definition
 */
export interface EnumValue {
  /** Enum value */
  value: string | number;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Whether this value is deprecated */
  deprecated?: boolean;
}

/**
 * Enum type definition
 */
export interface EnumType extends BaseTypeDefinition {
  kind: TypeKind.Enum;
  /** Possible enum values */
  values: EnumValue[];
  /** Type of enum values (string or number) */
  valueType: 'string' | 'number';
}

/**
 * Type definition union (discriminated by 'kind')
 */
export type TypeDefinition =
  | PrimitiveType
  | ObjectType
  | ArrayType
  | UnionType
  | EnumType;

/**
 * Parameter location in HTTP request
 */
export enum ParameterLocation {
  Path = 'path',
  Query = 'query',
  Header = 'header',
  Cookie = 'cookie',
}

/**
 * Parameter definition for API endpoints
 */
export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  /** Where the parameter appears */
  in: ParameterLocation;
  /** Parameter type */
  type: TypeReference;
  /** Whether this parameter is required */
  required: boolean;
  /** Parameter description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Deprecated flag */
  deprecated?: boolean;
}

/**
 * Request body definition
 */
export interface RequestBodyDefinition {
  /** Request body type */
  type: TypeReference;
  /** Whether request body is required */
  required: boolean;
  /** Content type (e.g., 'application/json') */
  contentType: string;
  /** Description */
  description?: string;
}

/**
 * HTTP header definition
 */
export interface HeaderDefinition {
  /** Header name */
  name: string;
  /** Header type */
  type: TypeReference;
  /** Whether this header is required */
  required: boolean;
  /** Description */
  description?: string;
}

/**
 * HTTP response definition
 */
export interface ResponseDefinition {
  /** HTTP status code or 'default' */
  statusCode: number | 'default';
  /** Response body type (if any) */
  type?: TypeReference;
  /** Response description */
  description?: string;
  /** Response headers */
  headers?: HeaderDefinition[];
  /** Content type */
  contentType?: string;
}

/**
 * Rate limit specification
 */
export interface RateLimitSpec {
  /** Requests per time window */
  requests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Rate limit scope (per user, per API key, etc.) */
  scope?: string;
}

/**
 * API endpoint definition
 */
export interface EndpointDefinition {
  /** Unique endpoint identifier */
  id: string;
  /** Operation ID (unique within API) */
  operationId: string;
  /** URL path template */
  path: string;
  /** HTTP method */
  method: HTTPMethod;
  /** Brief summary */
  summary?: string;
  /** Detailed description */
  description?: string;
  /** Path/query/header parameters */
  parameters?: ParameterDefinition[];
  /** Request body (for POST, PUT, PATCH) */
  requestBody?: RequestBodyDefinition;
  /** Possible responses */
  responses: ResponseDefinition[];
  /** Whether this endpoint supports streaming (SSE) */
  streaming: boolean;
  /** Required authentication schemes */
  authentication: string[];
  /** Rate limit specification */
  rateLimit?: RateLimitSpec;
  /** Tags for grouping */
  tags?: string[];
  /** Whether this endpoint is deprecated */
  deprecated?: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * API key authentication scheme
 */
export interface ApiKeyAuthScheme {
  id: string;
  type: AuthSchemeType.ApiKey;
  /** Where the API key appears (header or query) */
  in: 'header' | 'query';
  /** Name of the header or query parameter */
  name: string;
  /** Description */
  description?: string;
}

/**
 * Bearer token authentication scheme
 */
export interface BearerAuthScheme {
  id: string;
  type: AuthSchemeType.Bearer;
  /** Bearer scheme (usually 'Bearer') */
  scheme: string;
  /** Description */
  description?: string;
}

/**
 * OAuth2 flow definition
 */
export interface OAuth2Flow {
  /** Flow type */
  type: OAuth2FlowType;
  /** Authorization URL (for authorizationCode, implicit) */
  authorizationUrl?: string;
  /** Token URL (for authorizationCode, clientCredentials, password) */
  tokenUrl?: string;
  /** Refresh URL (optional) */
  refreshUrl?: string;
  /** Available scopes */
  scopes?: Record<string, string>;
}

/**
 * OAuth2 authentication scheme
 */
export interface OAuth2AuthScheme {
  id: string;
  type: AuthSchemeType.OAuth2;
  /** OAuth2 flows */
  flows: OAuth2Flow[];
  /** Description */
  description?: string;
}

/**
 * Basic authentication scheme
 */
export interface BasicAuthScheme {
  id: string;
  type: AuthSchemeType.Basic;
  /** Description */
  description?: string;
}

/**
 * Authentication scheme union
 */
export type AuthScheme =
  | ApiKeyAuthScheme
  | BearerAuthScheme
  | OAuth2AuthScheme
  | BasicAuthScheme;

/**
 * Error definition
 */
export interface ErrorDefinition {
  /** Error code or identifier */
  code: string;
  /** HTTP status code */
  statusCode: number;
  /** Error name */
  name: string;
  /** Error description */
  description?: string;
  /** Error type (for typed error responses) */
  type?: TypeReference;
  /** Whether this error is retryable */
  retryable?: boolean;
}

/**
 * Complete canonical schema
 *
 * This is the root type that represents a complete normalized API specification
 * from any provider, ready for code generation.
 */
export interface CanonicalSchema {
  /** Schema metadata */
  metadata: SchemaMetadata;
  /** All type definitions */
  types: TypeDefinition[];
  /** API endpoints */
  endpoints: EndpointDefinition[];
  /** Authentication schemes */
  authentication: AuthScheme[];
  /** Error definitions */
  errors: ErrorDefinition[];
  /** Additional global configuration */
  config?: Record<string, unknown>;
}
