# LLM-Forge Architecture

## Executive Summary

LLM-Forge is a cross-provider SDK generator that produces typed, idiomatic client libraries for multiple LLM APIs across 7 languages. The system employs a unified schema normalization layer, template-based code generation, and native build pipelines to deliver production-ready SDKs.

## System Overview

### Core Design Principles

1. **Schema-First Design**: All provider APIs are normalized into a canonical schema
2. **Language Idiomaticity**: Generated code respects each language's conventions and best practices
3. **Type Safety**: Strong typing across all generated clients
4. **Extensibility**: Plugin architecture for adding new providers and languages
5. **Zero-Runtime Dependencies**: Generated SDKs have minimal external dependencies

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   CLI & Orchestration                    │
│              (Configuration, Build Pipeline)             │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Provider Adapters Layer                 │
│    (OpenAI, Anthropic, Cohere, Google AI, Mistral...)  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                 Schema Normalization Layer               │
│         (Canonical Schema, Type Mapping Engine)         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Code Generation Engine Layer                │
│    (Template Engine, AST Builders, Type Generators)     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Language Target Renderers                   │
│  (Rust, TS, Python, JS, C#, Go, Java Generators)       │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Build & Package Layer                   │
│     (Cargo, npm, pip, Maven, NuGet, Go Modules...)      │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Schema Normalization Layer

**Responsibility**: Convert provider-specific API specifications into a unified canonical schema.

**Key Components**:
- **OpenAPI Parser**: Reads OpenAPI 3.x specifications
- **Schema Validator**: Ensures provider schemas are complete and valid
- **Type Normalizer**: Maps provider types to canonical types
- **Capability Detector**: Identifies provider-specific features (streaming, function calling, vision, etc.)

**Canonical Schema Structure**:
```typescript
interface CanonicalSchema {
  providers: Provider[];
  commonTypes: TypeDefinition[];
  operations: Operation[];
  authentication: AuthScheme[];
}

interface Provider {
  id: string;
  name: string;
  version: string;
  baseUrl: string;
  capabilities: Capability[];
  models: Model[];
  endpoints: Endpoint[];
}

interface Operation {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  parameters: Parameter[];
  requestBody?: TypeDefinition;
  responses: Response[];
  streaming: boolean;
}
```

**Design Decisions**:
- Language-agnostic type system (primitives, composites, generics)
- Normalization rules stored in JSON Schema
- Support for provider-specific extensions via metadata field
- Version tracking for schema evolution

### 2. Code Generation Engine

**Responsibility**: Transform canonical schema into language-specific code using templates and AST builders.

**Key Components**:
- **Template Engine**: Handlebars-based with custom helpers
- **AST Builder**: Language-specific abstract syntax tree construction
- **Type Mapper**: Canonical types to language types
- **Code Formatter**: Integration with language formatters (rustfmt, prettier, black, etc.)

**Template Structure**:
```
templates/
├── common/
│   ├── client.hbs
│   ├── types.hbs
│   ├── request.hbs
│   └── response.hbs
├── rust/
│   ├── lib.rs.hbs
│   ├── types.rs.hbs
│   ├── client.rs.hbs
│   └── errors.rs.hbs
├── typescript/
│   ├── index.ts.hbs
│   ├── types.ts.hbs
│   └── client.ts.hbs
└── [other languages]
```

**Type Mapping Examples**:

| Canonical Type | Rust | TypeScript | Python | Go |
|---------------|------|------------|--------|-----|
| String | String | string | str | string |
| Integer | i64 | number | int | int64 |
| Float | f64 | number | float | float64 |
| Boolean | bool | boolean | bool | bool |
| Array<T> | Vec<T> | T[] | List[T] | []T |
| Optional<T> | Option<T> | T \| undefined | Optional[T] | *T |
| Map<K,V> | HashMap<K,V> | Map<K,V> | Dict[K,V] | map[K]V |

### 3. Language Target Renderers

**Per-Language Specifications**:

#### Rust
- **Package Manager**: Cargo
- **HTTP Client**: reqwest with async/await
- **JSON**: serde_json
- **Error Handling**: Result<T, E> with custom error types
- **Testing**: Built-in test framework + cargo-nextest
- **Idioms**: Builder pattern, trait-based clients, zero-copy where possible

#### TypeScript
- **Package Manager**: npm/pnpm
- **HTTP Client**: fetch API with typed responses
- **Validation**: zod for runtime type checking
- **Error Handling**: Custom error classes
- **Testing**: vitest or jest
- **Idioms**: Promises/async-await, class-based clients, discriminated unions

#### Python
- **Package Manager**: pip/poetry
- **HTTP Client**: httpx with async support
- **Type Hints**: Full typing with mypy compliance
- **Error Handling**: Custom exception hierarchy
- **Testing**: pytest
- **Idioms**: Context managers, dataclasses, async generators for streaming

#### JavaScript
- **Package Manager**: npm
- **HTTP Client**: fetch API
- **Error Handling**: Error classes
- **Testing**: jest/vitest
- **Idioms**: Promises, functional style, modern ES2022+

#### C#
- **Package Manager**: NuGet
- **HTTP Client**: HttpClient with async/await
- **JSON**: System.Text.Json
- **Error Handling**: Custom exceptions
- **Testing**: xUnit
- **Idioms**: LINQ, async streams, nullable reference types

#### Go
- **Package Manager**: Go modules
- **HTTP Client**: net/http
- **JSON**: encoding/json
- **Error Handling**: Error return values
- **Testing**: Built-in testing package
- **Idioms**: Interfaces, functional options, context propagation

#### Java
- **Package Manager**: Maven
- **HTTP Client**: java.net.http (Java 11+)
- **JSON**: Jackson
- **Error Handling**: Custom exception hierarchy
- **Testing**: JUnit 5
- **Idioms**: Builder pattern, Optional, CompletableFuture for async

### 4. Provider Adapters

**Initial Provider Support**:
1. **OpenAI** (GPT-4, GPT-3.5, embeddings, vision)
2. **Anthropic** (Claude 3 family, streaming)
3. **Cohere** (Command, Generate, Embed)
4. **Google AI** (Gemini Pro, Gemini Vision)
5. **Mistral** (Mistral-7B, Mixtral)

**Adapter Interface**:
```typescript
interface ProviderAdapter {
  // Fetch and parse provider API specification
  fetchSchema(): Promise<ProviderSchema>;

  // Normalize to canonical schema
  normalize(schema: ProviderSchema): CanonicalSchema;

  // Provider-specific transformations
  transformRequest(req: CanonicalRequest): ProviderRequest;
  transformResponse(res: ProviderResponse): CanonicalResponse;

  // Authentication strategy
  getAuthStrategy(): AuthStrategy;
}
```

### 5. Build & Package Pipeline

**Per-Language Build Configuration**:

```yaml
# Example: rust target
rust:
  package_manager: cargo
  build_commands:
    - cargo fmt
    - cargo clippy
    - cargo test
    - cargo build --release
  publish:
    registry: crates.io
    auth: CARGO_REGISTRY_TOKEN

# Example: typescript target
typescript:
  package_manager: npm
  build_commands:
    - npm run lint
    - npm run type-check
    - npm test
    - npm run build
  publish:
    registry: npmjs.org
    auth: NPM_TOKEN
```

**CI/CD Integration**:
- GitHub Actions workflows for each language
- Automated version bumping
- Changelog generation
- Multi-platform testing (Linux, macOS, Windows)
- Security scanning (SAST, dependency audit)

## Testing Strategy

### 1. Schema Normalization Tests
- Unit tests for each provider adapter
- Schema validation tests
- Type mapping verification
- Edge case handling (optional fields, unions, etc.)

### 2. Code Generation Tests
- Template rendering tests
- AST construction verification
- Generated code compilation tests
- Output format validation

### 3. Integration Tests
- End-to-end SDK generation
- Real API calls (using test accounts)
- Streaming response handling
- Error handling verification
- Rate limiting behavior

### 4. Cross-Language Tests
- Type equivalence tests
- Behavior parity tests
- Performance benchmarks
- Memory usage profiling

### 5. Generated SDK Tests
- Each generated SDK includes comprehensive test suite
- Mock server for offline testing
- Real provider integration tests (opt-in)
- Examples as executable tests

## Extensibility Architecture

### 1. Plugin System

**Provider Plugins**:
```typescript
// plugins/providers/custom-provider/index.ts
export class CustomProviderAdapter implements ProviderAdapter {
  // Implementation
}

export default {
  type: 'provider',
  name: 'custom-provider',
  adapter: CustomProviderAdapter
};
```

**Language Target Plugins**:
```typescript
// plugins/languages/kotlin/index.ts
export class KotlinRenderer implements LanguageRenderer {
  // Implementation
}

export default {
  type: 'language',
  name: 'kotlin',
  renderer: KotlinRenderer,
  templateDir: './templates'
};
```

### 2. Configuration Hooks

Users can customize generation via `llm-forge.config.json`:

```json
{
  "providers": ["openai", "anthropic"],
  "languages": ["rust", "typescript", "python"],
  "outputDir": "./generated",
  "packageNamespace": "mycompany",
  "hooks": {
    "preGenerate": "./scripts/pre-generate.js",
    "postGenerate": "./scripts/post-generate.js"
  },
  "customizations": {
    "rust": {
      "additionalDependencies": ["tokio-util"],
      "features": ["streaming", "async"]
    }
  }
}
```

### 3. Template Overrides

Users can override default templates:
```
project/
├── llm-forge.config.json
└── templates/
    └── rust/
        └── client.rs.hbs  # Overrides default
```

## Security Considerations

### 1. API Key Management
- Never include API keys in generated code
- Environment variable support
- Secure credential storage recommendations
- Key rotation guidance

### 2. Input Validation
- Request parameter validation
- Type checking before API calls
- Sanitization of user inputs

### 3. Dependency Management
- Minimal dependencies in generated SDKs
- Regular security audits
- Automated dependency updates
- Vulnerability scanning in CI/CD

### 4. Code Generation Security
- Template injection prevention
- Safe AST manipulation
- Output sanitization
- No arbitrary code execution

## Performance Considerations

### 1. Generation Performance
- Parallel code generation for multiple targets
- Incremental builds (only regenerate changed providers)
- Template caching
- AST reuse across similar structures

### 2. Runtime Performance
- Connection pooling in generated clients
- Request batching where supported
- Streaming response handling
- Efficient JSON parsing

### 3. Memory Management
- Streaming for large responses
- Lazy loading of provider schemas
- Resource cleanup in generated code
- Memory-efficient type representations

## Monitoring & Observability

### 1. Generation Metrics
- Time to generate per language
- Template rendering performance
- Schema parsing duration
- Build success/failure rates

### 2. SDK Telemetry (Optional)
- API call success/failure rates
- Latency distributions
- Error categorization
- Usage patterns (opt-in only)

## Documentation Strategy

### 1. Generated Documentation
- API reference for each SDK
- Type documentation
- Usage examples
- Migration guides

### 2. Developer Documentation
- Architecture overview
- Contributing guidelines
- Plugin development guide
- Template authoring guide

### 3. User Documentation
- Getting started guide
- Configuration reference
- Provider-specific guides
- Troubleshooting

## Technology Stack

### Core Generator (Node.js/TypeScript)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **Template Engine**: Handlebars
- **Schema Validation**: JSON Schema (Ajv)
- **CLI Framework**: Commander.js
- **HTTP Client**: node-fetch
- **Testing**: Vitest
- **Build**: tsup

### Generated SDKs
- Each language uses its native ecosystem
- Minimal external dependencies
- Modern language versions (Rust 2021, ES2022, Python 3.9+, etc.)

## Integration Points

### 1. CI/CD Platforms
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

### 2. Package Registries
- crates.io (Rust)
- npmjs.org (JavaScript/TypeScript)
- PyPI (Python)
- NuGet (.NET)
- Maven Central (Java)
- Go modules proxy

### 3. Development Tools
- IDE extensions for autocomplete
- Debug symbol generation
- Source maps for TypeScript
- Doc comment generation

## Future Enhancements

### Phase 2 (Post-MVP)
- Additional languages: Swift, Kotlin, PHP, Ruby
- GraphQL provider support
- WebSocket/SSE streaming optimizations
- Browser-specific builds (WASM)
- CLI tool generation alongside SDKs

### Phase 3
- Visual schema editor
- Provider API mocking server
- Cost estimation tools
- Multi-provider request orchestration
- Automated provider adapter generation from OpenAPI specs

## Coordination Protocols

### Inter-Agent Communication
1. **Schema Normalization Agent** publishes canonical schema to `schemas/canonical/`
2. **Language Renderer Agents** consume canonical schema and publish templates to `templates/{language}/`
3. **Build Pipeline Agent** orchestrates generation and packaging
4. **Testing Agent** validates all outputs
5. **Documentation Agent** generates user-facing docs

### Dependency Graph
```
Provider Adapters → Schema Normalization → Code Generation → Language Renderers → Build Pipeline
                                                          ↓
                                                    Testing Suite
                                                          ↓
                                                   Documentation
```

### Conflict Resolution
- Schema changes require SwarmLead approval
- Breaking changes trigger major version bump
- Language-specific customizations must not break cross-language parity
- Performance regressions require investigation before merge
