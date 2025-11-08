# Architecture Recommendations for LLM-Forge

**Version:** 1.0
**Date:** November 7, 2025

---

## Overview

This document provides architectural recommendations for building LLM-Forge, a multi-language SDK generator for LLM provider APIs. These recommendations are based on analysis of existing SDK generation tools, provider API patterns, and industry best practices.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Code Generation Strategy](#2-code-generation-strategy)
3. [Provider Abstraction Layer](#3-provider-abstraction-layer)
4. [Template System](#4-template-system)
5. [Testing Strategy](#5-testing-strategy)
6. [Build and Release Pipeline](#6-build-and-release-pipeline)
7. [Technology Stack Recommendations](#7-technology-stack-recommendations)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM-Forge CLI                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Schema Parser Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OpenAPI    │  │   Custom     │  │   Provider   │     │
│  │   Parser     │  │   Schema     │  │   Scrapers   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Internal Representation (IR)                    │
│  - Normalized API schema                                    │
│  - Provider metadata                                         │
│  - Type definitions                                          │
│  - Endpoint specifications                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Code Generator Layer                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │  TS  │  │  Py  │  │ Java │  │  Go  │  │ Rust │  ...    │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Generated SDKs                             │
│  - Language-specific implementations                         │
│  - Tests                                                     │
│  - Documentation                                             │
│  - Examples                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Schema Parser Layer
**Responsibility:** Parse and normalize API specifications from various sources

**Components:**
- OpenAPI 3.0/3.1 parser
- Custom schema parser (for Anthropic, etc.)
- Provider documentation scraper
- Schema validator
- Schema normalizer

**Input:**
- OpenAPI YAML/JSON files
- Custom schema definitions
- Provider documentation URLs

**Output:**
- Normalized Internal Representation (IR)

#### Internal Representation (IR)
**Responsibility:** Provide a universal, language-agnostic API definition

**Structure:**
```typescript
interface InternalRepresentation {
  metadata: {
    provider: string;
    version: string;
    baseUrl: string;
    authentication: AuthenticationSpec;
  };

  types: TypeDefinition[];
  endpoints: EndpointDefinition[];
  enums: EnumDefinition[];
  errors: ErrorDefinition[];

  providerSpecific: {
    features: string[];
    quirks: ProviderQuirk[];
    extensions: any;
  };
}
```

#### Code Generator Layer
**Responsibility:** Transform IR into language-specific SDK code

**Components per Language:**
- Template engine (Handlebars, Mustache, or custom)
- Type mapper (IR types → language types)
- Code formatter (Prettier, Black, gofmt, etc.)
- Documentation generator
- Test generator
- Example generator

**Output:**
- Source code files
- Package configuration
- Documentation
- Tests
- Examples

### 1.3 Data Flow

```
OpenAPI Spec  ─┐
Custom Schema ─┼→ [Parser] → [IR] → [Validator] → [Generator] → SDK
Provider Docs ─┘
                                                        ↓
                                                   [Formatter]
                                                        ↓
                                                   [Linter]
                                                        ↓
                                                   [Tests]
```

---

## 2. Code Generation Strategy

### 2.1 Template-Based vs. Programmatic

**Recommendation:** Hybrid approach

**Template-Based for:**
- Boilerplate code
- Package configuration
- Documentation
- Examples

**Programmatic for:**
- Complex type transformations
- Provider-specific logic
- Error handling code
- Optimization decisions

### 2.2 Incremental Generation

**Strategy:** Support incremental updates to existing SDKs

**Benefits:**
- Preserve custom modifications
- Faster regeneration
- Safer updates

**Implementation:**
```typescript
interface GenerationConfig {
  mode: 'full' | 'incremental';
  preserveFiles: string[];      // User-modified files
  customCodeMarkers: {
    start: string;               // e.g., "// BEGIN CUSTOM"
    end: string;                 // e.g., "// END CUSTOM"
  };
}
```

### 2.3 Multi-Pass Generation

**Pass 1: Types and Models**
- Generate type definitions
- Generate enum types
- Generate constants

**Pass 2: Client Classes**
- Generate base client
- Generate resource clients
- Generate request builders

**Pass 3: Utilities**
- Generate error classes
- Generate helpers
- Generate validators

**Pass 4: Documentation**
- Generate API reference
- Generate examples
- Generate README

**Pass 5: Tests**
- Generate unit tests
- Generate integration tests
- Generate mock clients

---

## 3. Provider Abstraction Layer

### 3.1 Provider Interface

```typescript
interface Provider {
  // Metadata
  name: string;
  version: string;
  baseUrl: string;

  // Schema
  getSchema(): Promise<Schema>;

  // Authentication
  getAuthenticationMethod(): AuthMethod;

  // Request/Response
  buildRequest(normalized: NormalizedRequest): ProviderRequest;
  parseResponse(raw: ProviderResponse): NormalizedResponse;

  // Streaming
  supportsStreaming(): boolean;
  parseStreamChunk(chunk: string): NormalizedChunk;

  // Errors
  parseError(error: any): NormalizedError;
  isRetryable(error: NormalizedError): boolean;

  // Features
  getFeatures(): ProviderFeature[];

  // Rate Limiting
  parseRateLimitHeaders(headers: Headers): RateLimitInfo;
}
```

### 3.2 Normalized Request/Response

```typescript
interface NormalizedRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
}

interface NormalizedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  metadata: {
    requestId?: string;
    tokenUsage?: TokenUsage;
    rateLimit?: RateLimitInfo;
  };
}

interface NormalizedError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  raw: any;
}
```

### 3.3 Provider Registry

```typescript
class ProviderRegistry {
  private providers: Map<string, Provider> = new Map();

  register(provider: Provider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Usage
const registry = new ProviderRegistry();
registry.register(new OpenAIProvider());
registry.register(new AnthropicProvider());
registry.register(new GeminiProvider());
```

---

## 4. Template System

### 4.1 Template Organization

```
templates/
├── common/                   # Shared templates
│   ├── README.md.hbs
│   ├── LICENSE.hbs
│   └── CHANGELOG.md.hbs
├── typescript/
│   ├── client.ts.hbs
│   ├── types.ts.hbs
│   ├── errors.ts.hbs
│   ├── package.json.hbs
│   ├── tsconfig.json.hbs
│   └── tests/
│       └── client.test.ts.hbs
├── python/
│   ├── client.py.hbs
│   ├── types.py.hbs
│   ├── errors.py.hbs
│   ├── setup.py.hbs
│   ├── pyproject.toml.hbs
│   └── tests/
│       └── test_client.py.hbs
├── java/
│   ├── Client.java.hbs
│   ├── models/
│   │   └── Model.java.hbs
│   ├── exceptions/
│   │   └── Exception.java.hbs
│   └── pom.xml.hbs
└── ...
```

### 4.2 Template Engine Choice

**Recommendation:** Handlebars or Mustache

**Rationale:**
- Logic-less templates
- Easy to read and maintain
- Language-agnostic
- Good community support
- Extensible with helpers

**Alternative:** Custom template system for complex scenarios

### 4.3 Template Helpers

```typescript
// Custom Handlebars helpers
Handlebars.registerHelper('camelCase', (str: string) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
});

Handlebars.registerHelper('pascalCase', (str: string) => {
  return str.charAt(0).toUpperCase() +
         str.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase());
});

Handlebars.registerHelper('snakeCase', (str: string) => {
  return str.replace(/[A-Z]/g, (g) => '_' + g.toLowerCase());
});

Handlebars.registerHelper('mapType', (type: string, lang: string) => {
  const typeMap = {
    typescript: { string: 'string', number: 'number', boolean: 'boolean' },
    python: { string: 'str', number: 'int | float', boolean: 'bool' },
    java: { string: 'String', number: 'Number', boolean: 'Boolean' }
  };
  return typeMap[lang][type] || type;
});
```

### 4.4 Example Template

**TypeScript Client Template:**
```handlebars
{{! client.ts.hbs }}
import axios, { AxiosInstance } from 'axios';
import { {{#each types}}{{pascalCase this.name}}, {{/each}} } from './types';
import { {{#each errors}}{{pascalCase this.name}}, {{/each}} } from './errors';

export class {{pascalCase provider.name}}Client {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(config: {{pascalCase provider.name}}Config) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: '{{provider.baseUrl}}',
      timeout: config.timeout || 60000,
      headers: {
        {{#if provider.authHeader}}
        '{{provider.authHeader}}': {{#if provider.authPrefix}}'{{provider.authPrefix}} ' + {{/if}}this.apiKey,
        {{/if}}
        'Content-Type': 'application/json',
      },
    });
  }

  {{#each endpoints}}
  async {{camelCase this.name}}(
    request: {{pascalCase this.requestType}}
  ): Promise<{{pascalCase this.responseType}}> {
    try {
      const response = await this.client.{{toLowerCase this.method}}(
        '{{this.path}}',
        {{#if (eq this.method 'POST')}}request{{/if}}
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  {{/each}}

  private handleError(error: any): Error {
    // Error handling logic
    {{#each errors}}
    if (error.response?.status === {{this.statusCode}}) {
      return new {{pascalCase this.name}}(error.response.data.message);
    }
    {{/each}}
    return new Error(error.message);
  }
}
```

---

## 5. Testing Strategy

### 5.1 Generator Tests

**Unit Tests:**
- Test each parser independently
- Test type mapping logic
- Test template rendering
- Test code formatting

**Integration Tests:**
- End-to-end generation
- Validate generated code compiles
- Validate generated tests pass

**Snapshot Tests:**
- Capture generated output
- Detect unintended changes
- Review changes in PRs

### 5.2 Generated SDK Tests

**Unit Tests (Generated):**
```typescript
// Generated test file
import { OpenAIClient } from '../src/client';
import { MockOpenAI } from './mocks';

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  let mock: MockOpenAI;

  beforeEach(() => {
    mock = new MockOpenAI();
    client = new OpenAIClient({ apiKey: 'test', baseUrl: mock.url });
  });

  it('should create chat completion', async () => {
    mock.addResponse('/v1/chat/completions', {
      id: 'test',
      choices: [{ message: { role: 'assistant', content: 'Hello' } }]
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }]
    });

    expect(response.choices[0].message.content).toBe('Hello');
  });
});
```

**Integration Tests (Against Real APIs):**
```typescript
// Run sparingly due to cost
describe('OpenAIClient Integration', () => {
  it('should make real API call', async () => {
    const client = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY!
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "test"' }],
      max_tokens: 10
    });

    expect(response.choices[0].message.content).toContain('test');
  }, 30000);
});
```

### 5.3 Compatibility Tests

**Provider Compatibility Matrix:**
```typescript
// Test all providers with same interface
const providers = ['openai', 'anthropic', 'gemini', 'cohere'];

describe.each(providers)('%s provider', (provider) => {
  it('should create chat completion', async () => {
    const client = createClient(provider);
    const response = await client.chat.completions.create({
      model: getDefaultModel(provider),
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(response.message.content).toBeDefined();
  });
});
```

### 5.4 Mock Server Strategy

**Recommendation:** Use WireMock, MockServer, or custom mock server

**Mock Server Features:**
- Simulate provider responses
- Test error scenarios
- Test rate limiting
- Test streaming
- Fast and deterministic
- No API costs

**Example Mock Server:**
```typescript
import { createMockServer } from './mock-server';

const mockServer = createMockServer({
  provider: 'openai',
  port: 8080,
  responses: {
    '/v1/chat/completions': {
      POST: {
        success: { /* mock response */ },
        rateLimit: { status: 429, body: { /* error */ } },
        serverError: { status: 500, body: { /* error */ } }
      }
    }
  }
});

await mockServer.start();
// Run tests
await mockServer.stop();
```

---

## 6. Build and Release Pipeline

### 6.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-generator:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run lint

  generate-sdks:
    needs: test-generator
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [typescript, python, java, go, rust, csharp, ruby]
        provider: [openai, anthropic, gemini, cohere, azure-openai, mistral]
    steps:
      - uses: actions/checkout@v3
      - name: Generate SDK
        run: |
          npm run generate -- \
            --language ${{ matrix.language }} \
            --provider ${{ matrix.provider }} \
            --output ./generated/${{ matrix.language }}/${{ matrix.provider }}
      - name: Test Generated SDK
        run: |
          cd ./generated/${{ matrix.language }}/${{ matrix.provider }}
          # Language-specific test command
          npm test  # or pytest, cargo test, etc.
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.language }}-${{ matrix.provider }}-sdk
          path: ./generated/${{ matrix.language }}/${{ matrix.provider }}

  integration-test:
    needs: generate-sdks
    runs-on: ubuntu-latest
    steps:
      - name: Download all SDKs
        uses: actions/download-artifact@v3
      - name: Run integration tests
        run: npm run test:integration
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # ... other API keys
```

### 6.2 Release Strategy

**Versioning:**
- Follow Semantic Versioning (SemVer)
- Generator version separate from SDK versions
- SDK versions track provider API versions

**Release Process:**
1. Update schemas from providers
2. Generate new SDKs
3. Run full test suite
4. Update changelogs
5. Create git tags
6. Publish to package registries
7. Generate release notes

**Automation:**
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate all SDKs
        run: npm run generate:all

      - name: Publish TypeScript SDK
        run: |
          cd generated/typescript
          npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish Python SDK
        run: |
          cd generated/python
          python -m build
          twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}

      # ... other language publications

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            generated/*/dist/*
          generate_release_notes: true
```

### 6.3 Versioning Strategy

**Generator Version:**
```
llm-forge v1.2.3
```

**SDK Versions:**
```
llm-forge-typescript-openai v1.0.0
llm-forge-python-anthropic v1.1.0
```

**Compatibility Matrix:**
```
LLM-Forge 1.x → SDK 1.x (OpenAI API 2024-10-21)
LLM-Forge 2.x → SDK 2.x (OpenAI API 2025-01-15)
```

---

## 7. Technology Stack Recommendations

### 7.1 Generator Implementation

**Primary Language:** TypeScript

**Rationale:**
- Type safety during development
- Excellent tooling
- Large ecosystem
- Easy to contribute
- Good performance for code generation
- Cross-platform (Node.js)

**Alternative:** Rust for performance-critical parts

### 7.2 Key Dependencies

**Core:**
- `@apidevtools/openapi-schemas` - OpenAPI schema validation
- `@apidevtools/swagger-parser` - OpenAPI parsing
- `handlebars` - Template engine
- `typescript` - TypeScript compiler
- `zod` - Runtime validation

**Code Formatting:**
- `prettier` - TypeScript/JavaScript formatting
- `black` - Python formatting
- `google-java-format` - Java formatting
- `gofmt` - Go formatting
- `rustfmt` - Rust formatting

**Testing:**
- `vitest` or `jest` - Unit tests
- `playwright` - E2E tests
- `nock` - HTTP mocking (for integration tests)

**CLI:**
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `ora` - Loading spinners

### 7.3 Storage and Caching

**Schema Cache:**
- Cache downloaded OpenAPI specs
- Cache parsed IR
- Invalidate on schema updates

**Implementation:**
```typescript
import { LRUCache } from 'lru-cache';

const schemaCache = new LRUCache<string, Schema>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

async function getSchema(provider: string): Promise<Schema> {
  const cached = schemaCache.get(provider);
  if (cached) return cached;

  const schema = await fetchSchema(provider);
  schemaCache.set(provider, schema);
  return schema;
}
```

### 7.4 Logging and Monitoring

**Logging:**
```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'generator.log' })
  ]
});
```

**Telemetry (Optional):**
- Track generation success/failure rates
- Track which providers/languages are most used
- Track generation time metrics
- Track error rates

### 7.5 Development Tools

**Recommended:**
- VSCode with extensions:
  - ESLint
  - Prettier
  - Handlebars
  - OpenAPI Editor
- Git hooks with Husky
- Commitlint for commit messages
- Conventional Commits

**Quality Gates:**
```json
{
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "validate": "npm run lint && npm run type-check && npm run test"
  }
}
```

---

## 8. Performance Considerations

### 8.1 Generation Speed

**Targets:**
- Parse OpenAPI spec: < 1s
- Generate single SDK: < 5s
- Generate all languages for one provider: < 30s
- Full generation (all providers × all languages): < 5min

**Optimizations:**
- Parallel generation across languages
- Incremental generation
- Template compilation cache
- Schema parsing cache

### 8.2 Generated Code Performance

**Targets:**
- SDK initialization: < 50ms
- API call overhead: < 50ms
- Streaming chunk processing: < 10ms
- Memory usage: < 50MB baseline

**Optimizations:**
- Lazy loading of optional features
- Tree-shaking support
- Efficient serialization
- Connection pooling
- Response streaming

### 8.3 Benchmarking

```typescript
// Benchmark generation
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

suite
  .add('Parse OpenAPI', () => {
    parseOpenAPISpec(spec);
  })
  .add('Generate TypeScript', () => {
    generateTypeScript(ir);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .run();
```

---

## 9. Extensibility

### 9.1 Plugin System

```typescript
interface GeneratorPlugin {
  name: string;
  version: string;

  // Hooks
  beforeParse?(spec: any): any;
  afterParse?(ir: InternalRepresentation): InternalRepresentation;
  beforeGenerate?(ir: InternalRepresentation): InternalRepresentation;
  afterGenerate?(code: GeneratedCode): GeneratedCode;

  // Custom generators
  generators?: {
    [language: string]: CustomGenerator;
  };

  // Custom templates
  templates?: {
    [language: string]: {
      [templateName: string]: string;
    };
  };
}

// Usage
const generator = new LLMForgeGenerator({
  plugins: [
    new CustomAuthPlugin(),
    new MetricsPlugin(),
    new DocumentationPlugin()
  ]
});
```

### 9.2 Custom Providers

```typescript
class CustomProvider implements Provider {
  name = 'custom-llm';
  version = '1.0.0';
  baseUrl = 'https://api.custom-llm.com';

  async getSchema(): Promise<Schema> {
    // Custom schema loading
  }

  // Implement other methods...
}

// Register custom provider
registry.register(new CustomProvider());

// Generate SDK
await generator.generate({
  provider: 'custom-llm',
  language: 'typescript',
  output: './sdk'
});
```

---

## 10. Documentation Strategy

### 10.1 Generated Documentation

**Auto-Generated:**
- API reference from code comments
- Type definitions
- Method signatures
- Parameter descriptions

**Tools:**
- TypeScript: TypeDoc
- Python: Sphinx
- Java: Javadoc
- Go: godoc
- Rust: rustdoc
- C#: DocFX
- Ruby: YARD

### 10.2 User Documentation

**Structure:**
```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quickstart.md
│   └── configuration.md
├── guides/
│   ├── authentication.md
│   ├── error-handling.md
│   ├── streaming.md
│   └── multimodal.md
├── providers/
│   ├── openai.md
│   ├── anthropic.md
│   └── gemini.md
├── languages/
│   ├── typescript.md
│   ├── python.md
│   └── java.md
├── api-reference/
│   └── [auto-generated]
└── examples/
    ├── chat-completion.md
    ├── function-calling.md
    └── streaming.md
```

---

## Conclusion

This architecture provides:

1. **Flexibility** - Support for multiple providers and languages
2. **Maintainability** - Clear separation of concerns
3. **Extensibility** - Plugin system for custom features
4. **Quality** - Comprehensive testing strategy
5. **Performance** - Optimized for both generation and runtime
6. **Developer Experience** - Easy to use and contribute to

The recommended approach balances complexity with capability, allowing LLM-Forge to grow and adapt as the LLM landscape evolves.
