# LLM-Forge: Complete System Architecture Design

**Version**: 2.0
**Date**: 2025-11-07
**Status**: Design Specification
**Author**: System Architect

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Core Components](#core-components)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
5. [Data Flow & Processing Pipeline](#data-flow--processing-pipeline)
6. [Extensibility & Plugin Architecture](#extensibility--plugin-architecture)
7. [Technology Stack](#technology-stack)
8. [Design Patterns & Best Practices](#design-patterns--best-practices)
9. [Quality Assurance & Validation](#quality-assurance--validation)
10. [Performance & Scalability](#performance--scalability)
11. [Security Architecture](#security-architecture)
12. [Deployment & Operations](#deployment--operations)
13. [Future Roadmap](#future-roadmap)

---

## 1. Executive Summary

LLM-Forge is a sophisticated multi-language SDK generator that transforms LLM provider APIs into production-ready, idiomatic client libraries for 7+ programming languages. The system employs a **four-layer architecture** with clear separation of concerns:

1. **Schema Normalization Layer**: Unifies provider-specific API definitions
2. **Type System Mapper**: Translates unified types to language-specific representations
3. **Code Generation Engine**: Produces idiomatic source code from templates
4. **Build Pipeline Orchestrator**: Validates, tests, and publishes SDKs

### Key Architectural Principles

- **Schema-First Design**: Single source of truth from provider specifications
- **Language Idiomaticity**: Generated code follows each language's best practices
- **Modularity**: Pluggable components for providers, languages, and transformations
- **Type Safety**: Strong typing throughout the generation pipeline
- **Zero-Config**: Sensible defaults with opt-in customization
- **Validation-First**: Multiple quality gates ensure correctness

---

## 2. System Overview

### 2.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          INPUT SOURCES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   OpenAI    │  │  Anthropic  │  │   Cohere    │  │   Google    │   │
│  │ OpenAPI 3.x │  │  Custom API │  │  OpenAPI    │  │   OpenAPI   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: SCHEMA NORMALIZATION                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Provider Adapters → Parser → Validator → Normalizer            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  Output: Unified Intermediate Representation (UIR)                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ {                                                               │     │
│  │   types: [...],                                                 │     │
│  │   endpoints: [...],                                             │     │
│  │   authentication: {...},                                        │     │
│  │   features: { streaming, batching, ... }                        │     │
│  │ }                                                               │     │
│  └────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: TYPE SYSTEM MAPPER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Python  │ │   TS/JS  │ │   Rust   │ │    Go    │ │   Java   │     │
│  │  Mapper  │ │  Mapper  │ │  Mapper  │ │  Mapper  │ │  Mapper  │ ... │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │            │             │
│       └────────────┴────────────┴────────────┴────────────┘             │
│                                 │                                         │
│  Output: Language-Specific Intermediate Representations (Lang-IRs)      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  LAYER 3: CODE GENERATION ENGINE                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │              Template Engine + Code Generators                  │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │     │
│  │  │Handlebars│  │   AST    │  │  Custom  │  │ Formatter│      │     │
│  │  │ Engine   │  │ Builder  │  │Generator │  │Integration│      │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  Output: Generated Source Code Files                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               LAYER 4: BUILD PIPELINE ORCHESTRATOR                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Validation → Testing → Packaging → Publishing                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Python  │ │   TS/JS  │ │   Rust   │ │    Go    │ │   Java   │     │
│  │ Pipeline │ │ Pipeline │ │ Pipeline │ │ Pipeline │ │ Pipeline │ ... │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │            │             │
│       └────────────┴────────────┴────────────┴────────────┘             │
│                                 │                                         │
│  Output: Published Package Artifacts                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          PACKAGE REGISTRIES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   PyPI   │  │   NPM    │  │crates.io │  │pkg.go.dev│  ...          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Context

```
External Systems:
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  LLM Provider   │       │  Package        │       │   CI/CD         │
│  APIs           │◄─────►│  Registries     │◄─────►│   Platform      │
│  (OpenAI, etc.) │       │  (PyPI, NPM...) │       │  (GitHub)       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         ▲                         ▲
         │                         │                         │
         ▼                         │                         │
┌─────────────────────────────────┴─────────────────────────┴────────┐
│                                                                      │
│                          LLM-FORGE                                   │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Schema    │→ │   Type     │→ │   Code     │→ │   Build    │  │
│  │Normalization│  │  Mapper    │  │  Generator │  │  Pipeline  │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Developers    │       │  Documentation  │       │   Monitoring    │
│   (SDK Users)   │       │   Sites         │       │   Systems       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 3. Core Components

### 3.1 Schema Normalization Layer

The Schema Normalization Layer is responsible for converting heterogeneous provider API specifications into a unified, canonical representation that can be processed by downstream components.

#### 3.1.1 Component Architecture

```typescript
/**
 * Schema Normalization Layer Components
 */

// 1. Provider Adapter Interface
interface IProviderAdapter {
  readonly providerId: string;
  readonly supportedVersions: string[];

  /**
   * Fetch the raw schema from the provider
   */
  fetchSchema(version?: string): Promise<RawSchema>;

  /**
   * Parse the raw schema into a provider-specific intermediate format
   */
  parseSchema(raw: RawSchema): Promise<ProviderSchema>;

  /**
   * Normalize provider schema to UIR
   */
  normalize(schema: ProviderSchema): Promise<UnifiedIR>;

  /**
   * Validate the schema for completeness and correctness
   */
  validate(schema: ProviderSchema): ValidationResult;
}

// 2. Unified Intermediate Representation (UIR)
interface UnifiedIR {
  // Metadata
  metadata: {
    provider: string;
    version: string;
    generatedAt: string;
    sourceUrl?: string;
  };

  // Type System
  types: TypeDefinition[];
  enums: EnumDefinition[];
  unions: UnionDefinition[];

  // API Surface
  endpoints: EndpointDefinition[];

  // Authentication
  authentication: {
    schemes: AuthScheme[];
    default: string;
    required: boolean;
  };

  // Provider Capabilities
  features: {
    streaming: boolean;
    batching: boolean;
    webhooks: boolean;
    fileUploads: boolean;
    pagination: PaginationStrategy | null;
    rateLimit: RateLimitConfig | null;
  };

  // Error Handling
  errors: ErrorDefinition[];

  // Additional metadata for extensions
  extensions: Record<string, unknown>;
}

// 3. Type Definitions
interface TypeDefinition {
  id: string;
  name: string;
  description?: string;
  kind: 'object' | 'primitive' | 'array' | 'map' | 'reference';

  // For object types
  properties?: PropertyDefinition[];
  required?: string[];
  additionalProperties?: boolean | TypeReference;

  // For array types
  items?: TypeReference;

  // For map types
  keyType?: TypeReference;
  valueType?: TypeReference;

  // Constraints
  constraints?: Constraint[];

  // Examples
  examples?: any[];

  // Deprecation
  deprecated?: boolean;
  deprecationMessage?: string;
}

interface PropertyDefinition {
  name: string;
  type: TypeReference;
  description?: string;
  required: boolean;
  default?: any;
  constraints?: Constraint[];
  examples?: any[];
  deprecated?: boolean;
}

type TypeReference =
  | { kind: 'primitive', type: PrimitiveType }
  | { kind: 'reference', ref: string }
  | { kind: 'array', items: TypeReference }
  | { kind: 'map', keyType: TypeReference, valueType: TypeReference }
  | { kind: 'optional', inner: TypeReference }
  | { kind: 'union', types: TypeReference[] };

type PrimitiveType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'null'
  | 'any'
  | 'binary';

interface Constraint {
  type:
    | 'min' | 'max'
    | 'minLength' | 'maxLength'
    | 'pattern'
    | 'format'
    | 'enum'
    | 'multipleOf'
    | 'custom';
  value: any;
  message?: string;
}

// 4. Endpoint Definitions
interface EndpointDefinition {
  id: string;
  name: string;
  description?: string;

  // HTTP details
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  pathParameters?: ParameterDefinition[];

  // Request
  queryParameters?: ParameterDefinition[];
  headers?: ParameterDefinition[];
  requestBody?: RequestBodyDefinition;

  // Response
  responses: ResponseDefinition[];

  // Features
  streaming: boolean;
  idempotent: boolean;

  // Authentication
  authentication: string[];  // IDs of required auth schemes

  // Rate limiting
  rateLimit?: RateLimitRule;

  // Pagination
  paginated?: boolean;
  paginationConfig?: PaginationConfig;

  // Deprecation
  deprecated?: boolean;
  deprecationMessage?: string;

  // Examples
  examples?: EndpointExample[];
}

interface ParameterDefinition {
  name: string;
  type: TypeReference;
  description?: string;
  required: boolean;
  default?: any;
  constraints?: Constraint[];
}

interface RequestBodyDefinition {
  contentType: string[];  // e.g., ['application/json']
  schema: TypeReference;
  required: boolean;
}

interface ResponseDefinition {
  statusCode: number | 'default';
  description?: string;
  contentType: string[];
  schema?: TypeReference;
  headers?: ParameterDefinition[];
}

// 5. Authentication Schemes
type AuthScheme =
  | { type: 'apiKey', name: string, in: 'header' | 'query' | 'cookie' }
  | { type: 'http', scheme: 'basic' | 'bearer' | 'digest', bearerFormat?: string }
  | { type: 'oauth2', flows: OAuth2Flow[] }
  | { type: 'openIdConnect', openIdConnectUrl: string }
  | { type: 'custom', description: string };

interface OAuth2Flow {
  type: 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode';
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

// 6. Rate Limiting
interface RateLimitConfig {
  strategy: 'token_bucket' | 'sliding_window' | 'fixed_window';
  limits: RateLimit[];
  headers: string[];  // Response headers that contain rate limit info
}

interface RateLimit {
  window: number;  // seconds
  maxRequests: number;
  scope: 'user' | 'ip' | 'api_key' | 'global';
}

interface RateLimitRule {
  limit: number;
  window: number;
  scope: string;
}

// 7. Pagination
interface PaginationConfig {
  type: 'offset' | 'cursor' | 'page';
  limitParam?: string;
  offsetParam?: string;
  cursorParam?: string;
  pageParam?: string;
  totalCountLocation?: string;
}

// 8. Error Definitions
interface ErrorDefinition {
  id: string;
  name: string;
  description?: string;
  httpStatus?: number;
  category: 'client' | 'server' | 'network' | 'auth' | 'rate_limit' | 'validation';
  retryable: boolean;
  schema?: TypeReference;
}
```

#### 3.1.2 Provider Adapter Implementations

```typescript
/**
 * OpenAI Provider Adapter
 */
class OpenAIAdapter implements IProviderAdapter {
  readonly providerId = 'openai';
  readonly supportedVersions = ['v1'];

  async fetchSchema(version = 'v1'): Promise<RawSchema> {
    // Fetch OpenAPI specification from OpenAI's GitHub or API
    const response = await fetch(
      `https://raw.githubusercontent.com/openai/openai-openapi/main/openapi.yaml`
    );
    return await response.text();
  }

  async parseSchema(raw: RawSchema): Promise<OpenAPISchema> {
    // Parse using swagger-parser or openapi-parser
    const parser = new SwaggerParser();
    return await parser.validate(raw);
  }

  async normalize(schema: OpenAPISchema): Promise<UnifiedIR> {
    const uir: UnifiedIR = {
      metadata: {
        provider: 'openai',
        version: schema.info.version,
        generatedAt: new Date().toISOString(),
        sourceUrl: 'https://platform.openai.com/docs/api-reference'
      },
      types: this.extractTypes(schema),
      enums: this.extractEnums(schema),
      unions: this.extractUnions(schema),
      endpoints: this.extractEndpoints(schema),
      authentication: this.extractAuth(schema),
      features: this.detectFeatures(schema),
      errors: this.extractErrors(schema),
      extensions: {}
    };

    return uir;
  }

  private extractTypes(schema: OpenAPISchema): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    // Extract from components.schemas
    for (const [name, schemaObj] of Object.entries(schema.components?.schemas || {})) {
      types.push(this.convertSchemaToType(name, schemaObj));
    }

    return types;
  }

  private convertSchemaToType(name: string, schema: any): TypeDefinition {
    const type: TypeDefinition = {
      id: `type_${name}`,
      name: this.normalizeTypeName(name),
      description: schema.description,
      kind: this.determineKind(schema),
      constraints: this.extractConstraints(schema),
      examples: schema.examples || [],
      deprecated: schema.deprecated || false
    };

    if (schema.type === 'object') {
      type.properties = this.extractProperties(schema.properties || {});
      type.required = schema.required || [];
      type.additionalProperties = schema.additionalProperties;
    } else if (schema.type === 'array') {
      type.items = this.convertSchemaToTypeRef(schema.items);
    }

    return type;
  }

  private extractEndpoints(schema: OpenAPISchema): EndpointDefinition[] {
    const endpoints: EndpointDefinition[] = [];

    for (const [path, pathItem] of Object.entries(schema.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          continue;
        }

        endpoints.push(this.convertOperationToEndpoint(
          path,
          method.toUpperCase() as any,
          operation
        ));
      }
    }

    return endpoints;
  }

  private detectFeatures(schema: OpenAPISchema): UnifiedIR['features'] {
    return {
      streaming: this.hasStreamingEndpoints(schema),
      batching: this.hasBatchingSupport(schema),
      webhooks: false,
      fileUploads: this.hasFileUploads(schema),
      pagination: this.detectPaginationStrategy(schema),
      rateLimit: this.extractRateLimitConfig(schema)
    };
  }

  private hasStreamingEndpoints(schema: OpenAPISchema): boolean {
    // Check if any endpoint has server-sent events or streaming response
    for (const pathItem of Object.values(schema.paths || {})) {
      for (const operation of Object.values(pathItem)) {
        if (operation.responses) {
          for (const response of Object.values(operation.responses)) {
            if (response.content?.['text/event-stream']) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  validate(schema: ProviderSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!schema.info?.version) {
      errors.push('Missing API version in schema');
    }

    // Validate paths
    if (!schema.paths || Object.keys(schema.paths).length === 0) {
      errors.push('No API paths defined');
    }

    // Validate components
    if (!schema.components?.schemas) {
      warnings.push('No schema components defined');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Anthropic Provider Adapter
 */
class AnthropicAdapter implements IProviderAdapter {
  readonly providerId = 'anthropic';
  readonly supportedVersions = ['2023-06-01'];

  async fetchSchema(version = '2023-06-01'): Promise<RawSchema> {
    // Anthropic doesn't provide OpenAPI spec, so we use a custom schema
    // This would be maintained in our repository
    return await fs.readFile(
      path.join(__dirname, '../schemas/anthropic.yaml'),
      'utf-8'
    );
  }

  async parseSchema(raw: RawSchema): Promise<AnthropicSchema> {
    // Parse custom schema format
    return yaml.parse(raw);
  }

  async normalize(schema: AnthropicSchema): Promise<UnifiedIR> {
    // Similar to OpenAI but with Anthropic-specific transformations
    return {
      metadata: {
        provider: 'anthropic',
        version: schema.version,
        generatedAt: new Date().toISOString(),
        sourceUrl: 'https://docs.anthropic.com/claude/reference'
      },
      types: this.extractTypes(schema),
      enums: this.extractEnums(schema),
      unions: this.extractUnions(schema),
      endpoints: this.extractEndpoints(schema),
      authentication: {
        schemes: [
          { type: 'apiKey', name: 'x-api-key', in: 'header' }
        ],
        default: 'apiKey',
        required: true
      },
      features: {
        streaming: true,  // Anthropic supports streaming
        batching: false,
        webhooks: false,
        fileUploads: false,
        pagination: null,
        rateLimit: {
          strategy: 'token_bucket',
          limits: [
            { window: 60, maxRequests: 50, scope: 'user' }
          ],
          headers: ['x-ratelimit-limit', 'x-ratelimit-remaining']
        }
      },
      errors: this.extractErrors(schema),
      extensions: {
        anthropicVersion: schema.version
      }
    };
  }

  validate(schema: AnthropicSchema): ValidationResult {
    // Validate Anthropic-specific schema
    return { valid: true, errors: [], warnings: [] };
  }
}
```

#### 3.1.3 Schema Validator

```typescript
/**
 * Schema Validator
 * Validates UIR for completeness and correctness
 */
class SchemaValidator {
  validate(uir: UnifiedIR): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate metadata
    if (!uir.metadata.provider) {
      errors.push('Missing provider in metadata');
    }
    if (!uir.metadata.version) {
      errors.push('Missing version in metadata');
    }

    // 2. Validate types
    const typeIds = new Set(uir.types.map(t => t.id));
    for (const type of uir.types) {
      this.validateType(type, typeIds, errors, warnings);
    }

    // 3. Validate endpoints
    for (const endpoint of uir.endpoints) {
      this.validateEndpoint(endpoint, typeIds, errors, warnings);
    }

    // 4. Validate authentication
    if (uir.authentication.schemes.length === 0) {
      warnings.push('No authentication schemes defined');
    }

    // 5. Validate error definitions
    for (const error of uir.errors) {
      this.validateError(error, typeIds, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateType(
    type: TypeDefinition,
    typeIds: Set<string>,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate type name
    if (!type.name || type.name.trim() === '') {
      errors.push(`Type ${type.id} has empty name`);
    }

    // Validate properties
    if (type.kind === 'object' && type.properties) {
      for (const prop of type.properties) {
        this.validateTypeReference(prop.type, typeIds, errors, warnings);
      }
    }

    // Validate array items
    if (type.kind === 'array' && type.items) {
      this.validateTypeReference(type.items, typeIds, errors, warnings);
    }

    // Validate constraints
    if (type.constraints) {
      for (const constraint of type.constraints) {
        this.validateConstraint(constraint, type, errors, warnings);
      }
    }
  }

  private validateTypeReference(
    ref: TypeReference,
    typeIds: Set<string>,
    errors: string[],
    warnings: string[]
  ): void {
    if (ref.kind === 'reference') {
      if (!typeIds.has(ref.ref)) {
        errors.push(`Type reference ${ref.ref} not found`);
      }
    } else if (ref.kind === 'array') {
      this.validateTypeReference(ref.items, typeIds, errors, warnings);
    } else if (ref.kind === 'map') {
      this.validateTypeReference(ref.keyType, typeIds, errors, warnings);
      this.validateTypeReference(ref.valueType, typeIds, errors, warnings);
    } else if (ref.kind === 'optional') {
      this.validateTypeReference(ref.inner, typeIds, errors, warnings);
    } else if (ref.kind === 'union') {
      for (const type of ref.types) {
        this.validateTypeReference(type, typeIds, errors, warnings);
      }
    }
  }

  private validateEndpoint(
    endpoint: EndpointDefinition,
    typeIds: Set<string>,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate endpoint name
    if (!endpoint.name) {
      errors.push(`Endpoint ${endpoint.id} has no name`);
    }

    // Validate path
    if (!endpoint.path) {
      errors.push(`Endpoint ${endpoint.id} has no path`);
    }

    // Validate parameters
    for (const param of endpoint.queryParameters || []) {
      this.validateTypeReference(param.type, typeIds, errors, warnings);
    }

    // Validate request body
    if (endpoint.requestBody) {
      this.validateTypeReference(
        endpoint.requestBody.schema,
        typeIds,
        errors,
        warnings
      );
    }

    // Validate responses
    for (const response of endpoint.responses) {
      if (response.schema) {
        this.validateTypeReference(response.schema, typeIds, errors, warnings);
      }
    }

    // Validate authentication references
    for (const authId of endpoint.authentication) {
      // Check if auth scheme exists
      // This would reference the authentication schemes
    }
  }

  private validateConstraint(
    constraint: Constraint,
    type: TypeDefinition,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate constraint values
    switch (constraint.type) {
      case 'min':
      case 'max':
        if (typeof constraint.value !== 'number') {
          errors.push(
            `Constraint ${constraint.type} must have numeric value for ${type.name}`
          );
        }
        break;

      case 'minLength':
      case 'maxLength':
        if (typeof constraint.value !== 'number' || constraint.value < 0) {
          errors.push(
            `Constraint ${constraint.type} must have non-negative number for ${type.name}`
          );
        }
        break;

      case 'pattern':
        if (typeof constraint.value !== 'string') {
          errors.push(
            `Constraint pattern must be string for ${type.name}`
          );
        }
        try {
          new RegExp(constraint.value);
        } catch (e) {
          errors.push(
            `Invalid regex pattern for ${type.name}: ${constraint.value}`
          );
        }
        break;
    }
  }

  private validateError(
    error: ErrorDefinition,
    typeIds: Set<string>,
    errors: string[],
    warnings: string[]
  ): void {
    if (!error.name) {
      errors.push(`Error ${error.id} has no name`);
    }

    if (error.schema) {
      this.validateTypeReference(error.schema, typeIds, errors, warnings);
    }
  }
}
```

#### 3.1.4 Usage Example

```typescript
// Example: Normalize OpenAI schema
async function normalizeOpenAI() {
  const adapter = new OpenAIAdapter();

  // 1. Fetch schema
  const rawSchema = await adapter.fetchSchema();

  // 2. Parse schema
  const parsedSchema = await adapter.parseSchema(rawSchema);

  // 3. Validate provider schema
  const validationResult = adapter.validate(parsedSchema);
  if (!validationResult.valid) {
    throw new Error(`Invalid schema: ${validationResult.errors.join(', ')}`);
  }

  // 4. Normalize to UIR
  const uir = await adapter.normalize(parsedSchema);

  // 5. Validate UIR
  const validator = new SchemaValidator();
  const uirValidation = validator.validate(uir);
  if (!uirValidation.valid) {
    throw new Error(`Invalid UIR: ${uirValidation.errors.join(', ')}`);
  }

  // 6. Save UIR
  await fs.writeFile(
    'schemas/normalized/openai.json',
    JSON.stringify(uir, null, 2)
  );

  return uir;
}
```

---

### 3.2 Type System Mapper

The Type System Mapper translates the unified type definitions from UIR into language-specific type representations while preserving semantic meaning.

#### 3.2.1 Type Mapper Interface

```typescript
/**
 * Type Mapper Interface
 */
interface ITypeMapper {
  readonly language: string;

  /**
   * Map a UIR type to language-specific representation
   */
  mapType(type: TypeDefinition, context: MappingContext): LanguageTypeDefinition;

  /**
   * Map a type reference to language-specific type syntax
   */
  mapTypeReference(ref: TypeReference, context: MappingContext): string;

  /**
   * Map constraints to language-specific validation code
   */
  mapConstraints(constraints: Constraint[], context: MappingContext): string[];

  /**
   * Generate language-specific imports/dependencies
   */
  generateImports(types: TypeDefinition[]): string[];

  /**
   * Get naming convention for the language
   */
  getNamingConvention(): NamingConvention;
}

interface LanguageTypeDefinition {
  name: string;
  code: string;
  imports: string[];
  dependencies: string[];
  metadata: Record<string, any>;
}

interface MappingContext {
  types: Map<string, TypeDefinition>;
  enums: Map<string, EnumDefinition>;
  currentNamespace?: string;
  options: TypeMapperOptions;
}

interface TypeMapperOptions {
  nullableStrategy: 'optional' | 'null' | 'union';
  arrayStrategy: 'array' | 'list' | 'vector';
  mapStrategy: 'map' | 'dict' | 'hashmap' | 'record';
  useBuiltinValidation: boolean;
  generateDocComments: boolean;
}

interface NamingConvention {
  type: (name: string) => string;
  property: (name: string) => string;
  method: (name: string) => string;
  constant: (name: string) => string;
  enum: (name: string) => string;
  package: (name: string) => string;
}
```

#### 3.2.2 Python Type Mapper

```typescript
/**
 * Python Type Mapper
 * Generates Pydantic models with full type hints
 */
class PythonTypeMapper implements ITypeMapper {
  readonly language = 'python';

  mapType(type: TypeDefinition, context: MappingContext): LanguageTypeDefinition {
    const className = this.toPascalCase(type.name);
    const imports = new Set<string>([
      'from pydantic import BaseModel, Field',
      'from typing import Optional, List, Dict, Any, Union'
    ]);

    let code = '';

    // Generate docstring
    if (type.description) {
      code += `class ${className}(BaseModel):\n`;
      code += `    """\n    ${type.description}\n    """\n\n`;
    } else {
      code += `class ${className}(BaseModel):\n`;
    }

    // Generate properties
    if (type.kind === 'object' && type.properties) {
      for (const prop of type.properties) {
        code += this.generateProperty(prop, type.required || [], context);
      }
    } else {
      code += '    pass\n';
    }

    // Add model config
    code += '\n    class Config:\n';
    code += '        extra = "forbid"\n';
    if (type.additionalProperties) {
      code += '        extra = "allow"\n';
    }

    return {
      name: className,
      code,
      imports: Array.from(imports),
      dependencies: ['pydantic>=2.0.0'],
      metadata: {
        baseClass: 'BaseModel',
        supportsValidation: true
      }
    };
  }

  private generateProperty(
    prop: PropertyDefinition,
    required: string[],
    context: MappingContext
  ): string {
    const propName = this.toSnakeCase(prop.name);
    const isRequired = required.includes(prop.name);

    let typeStr = this.mapTypeReference(prop.type, context);
    if (!isRequired) {
      typeStr = `Optional[${typeStr}]`;
    }

    let line = `    ${propName}: ${typeStr}`;

    // Add Field() for validation or metadata
    const fieldArgs: string[] = [];

    if (prop.description) {
      fieldArgs.push(`description="${this.escapeString(prop.description)}"`);
    }

    if (prop.default !== undefined) {
      fieldArgs.push(`default=${JSON.stringify(prop.default)}`);
    } else if (!isRequired) {
      fieldArgs.push('default=None');
    }

    // Add constraints
    if (prop.constraints) {
      for (const constraint of prop.constraints) {
        fieldArgs.push(...this.mapConstraint(constraint));
      }
    }

    if (fieldArgs.length > 0) {
      line += ` = Field(${fieldArgs.join(', ')})`;
    }

    line += '\n';

    return line;
  }

  mapTypeReference(ref: TypeReference, context: MappingContext): string {
    switch (ref.kind) {
      case 'primitive':
        return this.mapPrimitive(ref.type);

      case 'reference':
        const type = context.types.get(ref.ref);
        return type ? this.toPascalCase(type.name) : 'Any';

      case 'array':
        const itemType = this.mapTypeReference(ref.items, context);
        return `List[${itemType}]`;

      case 'map':
        const keyType = this.mapTypeReference(ref.keyType, context);
        const valueType = this.mapTypeReference(ref.valueType, context);
        return `Dict[${keyType}, ${valueType}]`;

      case 'optional':
        const innerType = this.mapTypeReference(ref.inner, context);
        return `Optional[${innerType}]`;

      case 'union':
        const types = ref.types.map(t => this.mapTypeReference(t, context));
        return `Union[${types.join(', ')}]`;

      default:
        return 'Any';
    }
  }

  private mapPrimitive(primitive: PrimitiveType): string {
    switch (primitive) {
      case 'string': return 'str';
      case 'integer': return 'int';
      case 'float': return 'float';
      case 'boolean': return 'bool';
      case 'null': return 'None';
      case 'any': return 'Any';
      case 'binary': return 'bytes';
      default: return 'Any';
    }
  }

  mapConstraints(constraints: Constraint[], context: MappingContext): string[] {
    return constraints.flatMap(c => this.mapConstraint(c));
  }

  private mapConstraint(constraint: Constraint): string[] {
    switch (constraint.type) {
      case 'min':
        return [`ge=${constraint.value}`];
      case 'max':
        return [`le=${constraint.value}`];
      case 'minLength':
        return [`min_length=${constraint.value}`];
      case 'maxLength':
        return [`max_length=${constraint.value}`];
      case 'pattern':
        return [`regex="${this.escapeString(constraint.value)}"`];
      default:
        return [];
    }
  }

  generateImports(types: TypeDefinition[]): string[] {
    const imports = new Set<string>([
      'from pydantic import BaseModel, Field',
      'from typing import Optional, List, Dict, Any, Union'
    ]);

    // Add datetime if any type uses timestamps
    const hasTimestamp = types.some(t =>
      t.properties?.some(p => this.isTimestampType(p.type))
    );
    if (hasTimestamp) {
      imports.add('from datetime import datetime');
    }

    return Array.from(imports);
  }

  getNamingConvention(): NamingConvention {
    return {
      type: (name) => this.toPascalCase(name),
      property: (name) => this.toSnakeCase(name),
      method: (name) => this.toSnakeCase(name),
      constant: (name) => this.toScreamingSnakeCase(name),
      enum: (name) => this.toPascalCase(name),
      package: (name) => this.toSnakeCase(name)
    };
  }

  // Helper methods
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (char) => char.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[^a-z0-9]+/g, '_');
  }

  private toScreamingSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  private isTimestampType(ref: TypeReference): boolean {
    // Check if type is a timestamp
    return false; // Simplified
  }
}
```

#### 3.2.3 TypeScript Type Mapper

```typescript
/**
 * TypeScript Type Mapper
 * Generates TypeScript interfaces and types with Zod validation
 */
class TypeScriptTypeMapper implements ITypeMapper {
  readonly language = 'typescript';

  mapType(type: TypeDefinition, context: MappingContext): LanguageTypeDefinition {
    const typeName = this.toPascalCase(type.name);
    const imports = new Set<string>();

    let interfaceCode = '';
    let zodSchemaCode = '';

    // Generate TypeScript interface
    if (type.description) {
      interfaceCode += `/**\n * ${type.description}\n */\n`;
    }
    interfaceCode += `export interface ${typeName} {\n`;

    if (type.kind === 'object' && type.properties) {
      for (const prop of type.properties) {
        interfaceCode += this.generateInterfaceProperty(prop, context);
      }
    }

    interfaceCode += '}\n\n';

    // Generate Zod schema for runtime validation
    imports.add("import { z } from 'zod';");
    zodSchemaCode += `export const ${typeName}Schema = z.object({\n`;

    if (type.kind === 'object' && type.properties) {
      for (const prop of type.properties) {
        zodSchemaCode += this.generateZodProperty(prop, context);
      }
    }

    zodSchemaCode += '});\n';

    const code = interfaceCode + zodSchemaCode;

    return {
      name: typeName,
      code,
      imports: Array.from(imports),
      dependencies: ['zod@^3.22.0'],
      metadata: {
        hasZodSchema: true,
        exportType: 'interface'
      }
    };
  }

  private generateInterfaceProperty(
    prop: PropertyDefinition,
    context: MappingContext
  ): string {
    const propName = this.toCamelCase(prop.name);
    let typeStr = this.mapTypeReference(prop.type, context);

    let line = '';
    if (prop.description) {
      line += `  /** ${prop.description} */\n`;
    }

    line += `  ${propName}`;
    if (!prop.required) {
      line += '?';
    }
    line += `: ${typeStr};\n`;

    return line;
  }

  private generateZodProperty(
    prop: PropertyDefinition,
    context: MappingContext
  ): string {
    const propName = this.toCamelCase(prop.name);
    let zodType = this.mapTypeReferenceToZod(prop.type, context);

    // Apply constraints
    if (prop.constraints) {
      for (const constraint of prop.constraints) {
        zodType = this.applyZodConstraint(zodType, constraint);
      }
    }

    // Make optional if not required
    if (!prop.required) {
      zodType += '.optional()';
    }

    let line = `  ${propName}: ${zodType}`;

    if (prop.description) {
      line += `.describe("${this.escapeString(prop.description)}")`;
    }

    line += ',\n';

    return line;
  }

  mapTypeReference(ref: TypeReference, context: MappingContext): string {
    switch (ref.kind) {
      case 'primitive':
        return this.mapPrimitive(ref.type);

      case 'reference':
        const type = context.types.get(ref.ref);
        return type ? this.toPascalCase(type.name) : 'any';

      case 'array':
        const itemType = this.mapTypeReference(ref.items, context);
        return `${itemType}[]`;

      case 'map':
        const keyType = this.mapTypeReference(ref.keyType, context);
        const valueType = this.mapTypeReference(ref.valueType, context);
        return `Record<${keyType}, ${valueType}>`;

      case 'optional':
        const innerType = this.mapTypeReference(ref.inner, context);
        return `${innerType} | undefined`;

      case 'union':
        const types = ref.types.map(t => this.mapTypeReference(t, context));
        return types.join(' | ');

      default:
        return 'any';
    }
  }

  private mapTypeReferenceToZod(ref: TypeReference, context: MappingContext): string {
    switch (ref.kind) {
      case 'primitive':
        return this.mapPrimitiveToZod(ref.type);

      case 'reference':
        const type = context.types.get(ref.ref);
        return type ? `${this.toPascalCase(type.name)}Schema` : 'z.any()';

      case 'array':
        const itemType = this.mapTypeReferenceToZod(ref.items, context);
        return `z.array(${itemType})`;

      case 'map':
        const valueType = this.mapTypeReferenceToZod(ref.valueType, context);
        return `z.record(${valueType})`;

      case 'optional':
        const innerType = this.mapTypeReferenceToZod(ref.inner, context);
        return innerType;

      case 'union':
        const types = ref.types.map(t => this.mapTypeReferenceToZod(t, context));
        return `z.union([${types.join(', ')}])`;

      default:
        return 'z.any()';
    }
  }

  private mapPrimitive(primitive: PrimitiveType): string {
    switch (primitive) {
      case 'string': return 'string';
      case 'integer': return 'number';
      case 'float': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      case 'any': return 'any';
      case 'binary': return 'Buffer';
      default: return 'any';
    }
  }

  private mapPrimitiveToZod(primitive: PrimitiveType): string {
    switch (primitive) {
      case 'string': return 'z.string()';
      case 'integer': return 'z.number().int()';
      case 'float': return 'z.number()';
      case 'boolean': return 'z.boolean()';
      case 'null': return 'z.null()';
      case 'any': return 'z.any()';
      case 'binary': return 'z.instanceof(Buffer)';
      default: return 'z.any()';
    }
  }

  private applyZodConstraint(zodType: string, constraint: Constraint): string {
    switch (constraint.type) {
      case 'min':
        return `${zodType}.min(${constraint.value})`;
      case 'max':
        return `${zodType}.max(${constraint.value})`;
      case 'minLength':
        return `${zodType}.min(${constraint.value})`;
      case 'maxLength':
        return `${zodType}.max(${constraint.value})`;
      case 'pattern':
        return `${zodType}.regex(/${constraint.value}/)`;
      default:
        return zodType;
    }
  }

  mapConstraints(constraints: Constraint[], context: MappingContext): string[] {
    return constraints.map(c => this.mapConstraintToCode(c));
  }

  private mapConstraintToCode(constraint: Constraint): string {
    switch (constraint.type) {
      case 'min':
        return `.min(${constraint.value})`;
      case 'max':
        return `.max(${constraint.value})`;
      case 'minLength':
        return `.min(${constraint.value})`;
      case 'maxLength':
        return `.max(${constraint.value})`;
      case 'pattern':
        return `.regex(/${constraint.value}/)`;
      default:
        return '';
    }
  }

  generateImports(types: TypeDefinition[]): string[] {
    return ["import { z } from 'zod';"];
  }

  getNamingConvention(): NamingConvention {
    return {
      type: (name) => this.toPascalCase(name),
      property: (name) => this.toCamelCase(name),
      method: (name) => this.toCamelCase(name),
      constant: (name) => this.toScreamingSnakeCase(name),
      enum: (name) => this.toPascalCase(name),
      package: (name) => this.toKebabCase(name)
    };
  }

  // Helper methods
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toScreamingSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (char) => `_${char}`)
      .replace(/^_/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toUpperCase();
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
      .replace(/^-/, '')
      .replace(/[^a-z0-9]+/g, '-');
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
```

#### 3.2.4 Rust Type Mapper

```typescript
/**
 * Rust Type Mapper
 * Generates Rust structs with serde support
 */
class RustTypeMapper implements ITypeMapper {
  readonly language = 'rust';

  mapType(type: TypeDefinition, context: MappingContext): LanguageTypeDefinition {
    const structName = this.toPascalCase(type.name);
    const imports = new Set<string>([
      'use serde::{Deserialize, Serialize};'
    ]);

    let code = '';

    // Generate doc comment
    if (type.description) {
      code += `/// ${type.description}\n`;
    }

    // Generate derives
    code += '#[derive(Debug, Clone, Serialize, Deserialize)]\n';

    // Add serde attributes
    code += '#[serde(rename_all = "snake_case")]\n';

    // Generate struct
    code += `pub struct ${structName} {\n`;

    if (type.kind === 'object' && type.properties) {
      for (const prop of type.properties) {
        code += this.generateStructField(prop, context);
      }
    }

    code += '}\n';

    return {
      name: structName,
      code,
      imports: Array.from(imports),
      dependencies: ['serde = { version = "1.0", features = ["derive"] }'],
      metadata: {
        derives: ['Debug', 'Clone', 'Serialize', 'Deserialize'],
        visibility: 'pub'
      }
    };
  }

  private generateStructField(
    prop: PropertyDefinition,
    context: MappingContext
  ): string {
    const fieldName = this.toSnakeCase(prop.name);
    let typeStr = this.mapTypeReference(prop.type, context);

    // Wrap in Option if not required
    if (!prop.required) {
      typeStr = `Option<${typeStr}>`;
    }

    let code = '';

    // Doc comment
    if (prop.description) {
      code += `    /// ${prop.description}\n`;
    }

    // Serde attributes
    if (fieldName !== prop.name) {
      code += `    #[serde(rename = "${prop.name}")]\n`;
    }
    if (!prop.required) {
      code += '    #[serde(skip_serializing_if = "Option::is_none")]\n';
    }

    // Field definition
    code += `    pub ${fieldName}: ${typeStr},\n`;

    return code;
  }

  mapTypeReference(ref: TypeReference, context: MappingContext): string {
    switch (ref.kind) {
      case 'primitive':
        return this.mapPrimitive(ref.type);

      case 'reference':
        const type = context.types.get(ref.ref);
        return type ? this.toPascalCase(type.name) : 'serde_json::Value';

      case 'array':
        const itemType = this.mapTypeReference(ref.items, context);
        return `Vec<${itemType}>`;

      case 'map':
        const keyType = this.mapTypeReference(ref.keyType, context);
        const valueType = this.mapTypeReference(ref.valueType, context);
        return `std::collections::HashMap<${keyType}, ${valueType}>`;

      case 'optional':
        const innerType = this.mapTypeReference(ref.inner, context);
        return `Option<${innerType}>`;

      case 'union':
        // Rust doesn't have direct union types, use enum
        return 'serde_json::Value';  // Simplified

      default:
        return 'serde_json::Value';
    }
  }

  private mapPrimitive(primitive: PrimitiveType): string {
    switch (primitive) {
      case 'string': return 'String';
      case 'integer': return 'i64';
      case 'float': return 'f64';
      case 'boolean': return 'bool';
      case 'null': return '()';
      case 'any': return 'serde_json::Value';
      case 'binary': return 'Vec<u8>';
      default: return 'serde_json::Value';
    }
  }

  mapConstraints(constraints: Constraint[], context: MappingContext): string[] {
    // Rust constraints are typically enforced at runtime via validation functions
    return constraints.map(c => this.mapConstraintToValidator(c));
  }

  private mapConstraintToValidator(constraint: Constraint): string {
    switch (constraint.type) {
      case 'min':
        return `value >= ${constraint.value}`;
      case 'max':
        return `value <= ${constraint.value}`;
      case 'minLength':
        return `value.len() >= ${constraint.value}`;
      case 'maxLength':
        return `value.len() <= ${constraint.value}`;
      case 'pattern':
        return `regex::Regex::new(r"${constraint.value}").unwrap().is_match(&value)`;
      default:
        return '';
    }
  }

  generateImports(types: TypeDefinition[]): string[] {
    const imports = new Set<string>([
      'use serde::{Deserialize, Serialize};'
    ]);

    // Check if HashMap is needed
    const needsHashMap = types.some(t =>
      t.properties?.some(p => this.needsHashMap(p.type))
    );
    if (needsHashMap) {
      imports.add('use std::collections::HashMap;');
    }

    return Array.from(imports);
  }

  private needsHashMap(ref: TypeReference): boolean {
    return ref.kind === 'map';
  }

  getNamingConvention(): NamingConvention {
    return {
      type: (name) => this.toPascalCase(name),
      property: (name) => this.toSnakeCase(name),
      method: (name) => this.toSnakeCase(name),
      constant: (name) => this.toScreamingSnakeCase(name),
      enum: (name) => this.toPascalCase(name),
      package: (name) => this.toSnakeCase(name)
    };
  }

  // Helper methods
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (char) => char.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[^a-z0-9]+/g, '_');
  }

  private toScreamingSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }
}
```

---

### 3.3 Code Generation Engine

The Code Generation Engine transforms language-specific IRs into actual source code files using a combination of templates and programmatic generation.

#### 3.3.1 Generator Architecture

```typescript
/**
 * Code Generator Interface
 */
interface ICodeGenerator {
  readonly language: string;

  /**
   * Generate complete SDK from UIR
   */
  generate(uir: UnifiedIR, config: GeneratorConfig): Promise<GeneratedSDK>;

  /**
   * Generate individual file
   */
  generateFile(template: string, data: any): string;

  /**
   * Format generated code
   */
  format(code: string): Promise<string>;
}

interface GeneratorConfig {
  language: string;
  outputDir: string;
  packageName: string;
  version: string;
  author?: string;
  license?: string;
  repository?: string;

  // Feature flags
  features: {
    generateTests: boolean;
    generateDocs: boolean;
    generateExamples: boolean;
    includeRateLimiting: boolean;
    includeRetry: boolean;
    includeStreaming: boolean;
  };

  // Language-specific options
  languageOptions: Record<string, any>;

  // Template overrides
  templateDir?: string;
}

interface GeneratedSDK {
  language: string;
  files: GeneratedFile[];
  metadata: SDKMetadata;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'test' | 'config' | 'doc';
}

interface SDKMetadata {
  packageName: string;
  version: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}
```

#### 3.3.2 Template-Based Generator

```typescript
/**
 * Template-Based Code Generator
 * Uses Handlebars templates for code generation
 */
class TemplateBasedGenerator implements ICodeGenerator {
  readonly language: string;
  private templateEngine: Handlebars;
  private typeMapper: ITypeMapper;
  private formatter: ICodeFormatter;

  constructor(
    language: string,
    typeMapper: ITypeMapper,
    formatter: ICodeFormatter
  ) {
    this.language = language;
    this.typeMapper = typeMapper;
    this.formatter = formatter;
    this.templateEngine = Handlebars.create();
    this.registerHelpers();
  }

  async generate(uir: UnifiedIR, config: GeneratorConfig): Promise<GeneratedSDK> {
    const files: GeneratedFile[] = [];

    // 1. Generate types/models
    files.push(...await this.generateTypes(uir, config));

    // 2. Generate client class
    files.push(await this.generateClient(uir, config));

    // 3. Generate resource classes (endpoint groups)
    files.push(...await this.generateResources(uir, config));

    // 4. Generate error classes
    files.push(await this.generateErrors(uir, config));

    // 5. Generate authentication handlers
    files.push(...await this.generateAuth(uir, config));

    // 6. Generate utilities
    files.push(...await this.generateUtilities(uir, config));

    // 7. Generate configuration files
    files.push(...await this.generateConfigFiles(uir, config));

    // 8. Generate tests (if enabled)
    if (config.features.generateTests) {
      files.push(...await this.generateTests(uir, config));
    }

    // 9. Generate documentation (if enabled)
    if (config.features.generateDocs) {
      files.push(...await this.generateDocs(uir, config));
    }

    // 10. Generate examples (if enabled)
    if (config.features.generateExamples) {
      files.push(...await this.generateExamples(uir, config));
    }

    // Format all files
    for (const file of files) {
      if (file.type === 'source' || file.type === 'test') {
        file.content = await this.format(file.content);
      }
    }

    const metadata = this.generateMetadata(uir, config);

    return { language: this.language, files, metadata };
  }

  private async generateTypes(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const context: MappingContext = {
      types: new Map(uir.types.map(t => [t.id, t])),
      enums: new Map(uir.enums.map(e => [e.id, e])),
      options: this.getTypeMapperOptions(config)
    };

    // Generate a file for each type
    for (const type of uir.types) {
      const mapped = this.typeMapper.mapType(type, context);

      files.push({
        path: this.getTypePath(type.name, config),
        content: mapped.code,
        type: 'source'
      });
    }

    // Generate enums
    for (const enumDef of uir.enums) {
      files.push({
        path: this.getEnumPath(enumDef.name, config),
        content: this.generateEnum(enumDef, config),
        type: 'source'
      });
    }

    return files;
  }

  private async generateClient(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    const template = await this.loadTemplate('client');

    const data = {
      className: this.getClientClassName(config),
      packageName: config.packageName,
      version: config.version,
      baseUrl: this.getBaseUrl(uir),
      authSchemes: uir.authentication.schemes,
      features: config.features,
      resources: this.groupEndpointsByResource(uir.endpoints)
    };

    const content = this.generateFile(template, data);

    return {
      path: this.getClientPath(config),
      content,
      type: 'source'
    };
  }

  private async generateResources(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const template = await this.loadTemplate('resource');

    const resourceGroups = this.groupEndpointsByResource(uir.endpoints);

    for (const [resourceName, endpoints] of Object.entries(resourceGroups)) {
      const data = {
        resourceName,
        endpoints: endpoints.map(e => this.prepareEndpointData(e, uir)),
        className: this.getResourceClassName(resourceName),
        features: config.features
      };

      const content = this.generateFile(template, data);

      files.push({
        path: this.getResourcePath(resourceName, config),
        content,
        type: 'source'
      });
    }

    return files;
  }

  private prepareEndpointData(
    endpoint: EndpointDefinition,
    uir: UnifiedIR
  ): any {
    return {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      pathParameters: endpoint.pathParameters || [],
      queryParameters: endpoint.queryParameters || [],
      headers: endpoint.headers || [],
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      streaming: endpoint.streaming,
      documentation: endpoint.description,
      examples: endpoint.examples || []
    };
  }

  private async generateErrors(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    const template = await this.loadTemplate('errors');

    const data = {
      errors: uir.errors,
      baseErrorClass: this.getBaseErrorClassName()
    };

    const content = this.generateFile(template, data);

    return {
      path: this.getErrorsPath(config),
      content,
      type: 'source'
    };
  }

  private async generateAuth(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const scheme of uir.authentication.schemes) {
      const template = await this.loadTemplate(`auth/${scheme.type}`);

      const data = {
        scheme,
        className: this.getAuthClassName(scheme)
      };

      const content = this.generateFile(template, data);

      files.push({
        path: this.getAuthPath(scheme.type, config),
        content,
        type: 'source'
      });
    }

    return files;
  }

  private async generateUtilities(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // HTTP client
    if (config.features.includeRetry || config.features.includeRateLimiting) {
      files.push(await this.generateHttpClient(uir, config));
    }

    // Retry logic
    if (config.features.includeRetry) {
      files.push(await this.generateRetryHandler(uir, config));
    }

    // Rate limiting
    if (config.features.includeRateLimiting && uir.features.rateLimit) {
      files.push(await this.generateRateLimiter(uir, config));
    }

    // Streaming
    if (config.features.includeStreaming && uir.features.streaming) {
      files.push(await this.generateStreamingHandler(uir, config));
    }

    return files;
  }

  private async generateHttpClient(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    const template = await this.loadTemplate('utils/http_client');

    const data = {
      baseUrl: this.getBaseUrl(uir),
      defaultHeaders: this.getDefaultHeaders(uir),
      timeout: config.languageOptions.timeout || 30000,
      features: config.features
    };

    const content = this.generateFile(template, data);

    return {
      path: this.getUtilPath('http_client', config),
      content,
      type: 'source'
    };
  }

  generateFile(template: string, data: any): string {
    const compiled = this.templateEngine.compile(template);
    return compiled(data);
  }

  async format(code: string): Promise<string> {
    return await this.formatter.format(code);
  }

  private registerHelpers(): void {
    // Register Handlebars helpers
    this.templateEngine.registerHelper('toPascalCase', (str: string) => {
      return str
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (char) => char.toUpperCase());
    });

    this.templateEngine.registerHelper('toCamelCase', (str: string) => {
      const pascal = str
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (char) => char.toUpperCase());
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    this.templateEngine.registerHelper('toSnakeCase', (str: string) => {
      return str
        .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
        .replace(/^_/, '')
        .replace(/[^a-z0-9]+/g, '_');
    });

    this.templateEngine.registerHelper('eq', (a: any, b: any) => a === b);
    this.templateEngine.registerHelper('ne', (a: any, b: any) => a !== b);
    this.templateEngine.registerHelper('and', (a: any, b: any) => a && b);
    this.templateEngine.registerHelper('or', (a: any, b: any) => a || b);

    this.templateEngine.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });
  }

  private async loadTemplate(name: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../templates',
      this.language,
      `${name}.hbs`
    );
    return await fs.readFile(templatePath, 'utf-8');
  }

  private groupEndpointsByResource(
    endpoints: EndpointDefinition[]
  ): Record<string, EndpointDefinition[]> {
    const groups: Record<string, EndpointDefinition[]> = {};

    for (const endpoint of endpoints) {
      // Extract resource name from path (e.g., /chat/completions -> chat)
      const resource = this.extractResourceName(endpoint.path);

      if (!groups[resource]) {
        groups[resource] = [];
      }

      groups[resource].push(endpoint);
    }

    return groups;
  }

  private extractResourceName(path: string): string {
    // Extract first path segment
    const match = path.match(/^\/([^\/]+)/);
    return match ? match[1] : 'default';
  }

  private generateMetadata(uir: UnifiedIR, config: GeneratorConfig): SDKMetadata {
    return {
      packageName: config.packageName,
      version: config.version,
      dependencies: this.getDependencies(config),
      devDependencies: this.getDevDependencies(config),
      scripts: this.getScripts(config)
    };
  }

  // Abstract methods to be implemented by language-specific generators
  protected getTypePath(typeName: string, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getEnumPath(enumName: string, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getClientPath(config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getResourcePath(resourceName: string, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getErrorsPath(config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getAuthPath(authType: string, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getUtilPath(utilName: string, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getClientClassName(config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected getResourceClassName(resourceName: string): string {
    throw new Error('Not implemented');
  }

  protected getAuthClassName(scheme: AuthScheme): string {
    throw new Error('Not implemented');
  }

  protected getBaseErrorClassName(): string {
    throw new Error('Not implemented');
  }

  protected getBaseUrl(uir: UnifiedIR): string {
    throw new Error('Not implemented');
  }

  protected getDefaultHeaders(uir: UnifiedIR): Record<string, string> {
    throw new Error('Not implemented');
  }

  protected getDependencies(config: GeneratorConfig): string[] {
    throw new Error('Not implemented');
  }

  protected getDevDependencies(config: GeneratorConfig): string[] {
    throw new Error('Not implemented');
  }

  protected getScripts(config: GeneratorConfig): Record<string, string> {
    throw new Error('Not implemented');
  }

  protected getTypeMapperOptions(config: GeneratorConfig): TypeMapperOptions {
    throw new Error('Not implemented');
  }

  protected generateEnum(enumDef: EnumDefinition, config: GeneratorConfig): string {
    throw new Error('Not implemented');
  }

  protected async generateTests(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    throw new Error('Not implemented');
  }

  protected async generateDocs(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    throw new Error('Not implemented');
  }

  protected async generateExamples(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    throw new Error('Not implemented');
  }

  protected async generateConfigFiles(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile[]> {
    throw new Error('Not implemented');
  }

  protected async generateRetryHandler(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    throw new Error('Not implemented');
  }

  protected async generateRateLimiter(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    throw new Error('Not implemented');
  }

  protected async generateStreamingHandler(
    uir: UnifiedIR,
    config: GeneratorConfig
  ): Promise<GeneratedFile> {
    throw new Error('Not implemented');
  }
}
```

Due to the length limitations, I'll continue this architecture document in a moment. This is a comprehensive system architecture that addresses all your requirements. Would you like me to continue with the remaining sections covering:

1. Build Pipeline Orchestrator (detailed)
2. Cross-Cutting Concerns (async/await, auth, rate limiting, streaming, error handling)
3. Data Flow & Processing Pipeline
4. Extensibility & Plugin Architecture
5. Technology Stack details
6. Quality Assurance & Validation
7. Performance & Scalability
8. Security Architecture
9. Deployment & Operations

Let me know if you'd like me to continue or if you'd like me to focus on specific sections!