# Specialist Agent Responsibilities

## Overview

This document defines the specific responsibilities, deliverables, and success criteria for each specialist agent in the LLM-Forge swarm. Each agent is an expert in their domain and works semi-autonomously within the coordination framework.

---

## SwarmLead Coordinator

**Role**: Overall project coordination, architecture decisions, conflict resolution

### Responsibilities
- Monitor progress across all agents
- Ensure architectural coherence
- Resolve cross-agent conflicts
- Make final decisions on breaking changes
- Coordinate phase transitions
- Maintain dependency graph
- Review integration points
- Approve releases

### Deliverables
- Architecture documentation
- Build roadmap
- Agent coordination protocols
- Integration point specifications
- Architecture decision records
- Phase transition approvals
- Release planning and execution

### Key Metrics
- Phase completion on schedule
- Integration conflicts resolved within 48 hours
- Zero architectural regressions
- All agents unblocked and productive

### Communication Patterns
- Daily review of all agent standups
- Weekly integration review meetings
- On-demand conflict resolution
- Phase transition coordination

---

## Schema Architect Agent

**Role**: Design and implement the canonical schema and provider adapters

### Responsibilities
- Design canonical schema type system
- Create provider adapters (OpenAI, Anthropic, Cohere, Google AI, Mistral)
- Implement schema normalization engine
- Define type mapping rules
- Ensure language-agnostic schema design
- Version schema for backward compatibility
- Validate provider API specifications

### Deliverables

#### Phase 1 (Weeks 3-6)
- [ ] Canonical schema specification (`schemas/canonical-schema.json`)
- [ ] Type system definition (`core/schema/types.ts`)
- [ ] Schema validator (`core/schema/validator.ts`)
- [ ] Type normalizer (`core/schema/normalizer.ts`)
- [ ] Capability detector (`core/schema/capabilities.ts`)
- [ ] OpenAI adapter (`adapters/openai/`)
- [ ] Anthropic adapter (`adapters/anthropic/`)
- [ ] Schema versioning system
- [ ] Unit tests (>90% coverage)
- [ ] Schema documentation

#### Phase 3 (Weeks 11-16)
- [ ] Cohere adapter (`adapters/cohere/`)
- [ ] Google AI adapter (`adapters/google/`)
- [ ] Mistral adapter (`adapters/mistral/`)
- [ ] Extended type mappings

### Key Decisions
- Canonical type system design (primitives, composites, generics)
- How to handle provider-specific features
- Schema versioning strategy
- Type normalization rules

### Integration Points
- **Downstream**: All code generators consume canonical schema
- **Upstream**: Provider API specifications (OpenAPI, proprietary)

### Success Criteria
- Canonical schema validates against JSON Schema spec
- All 5 providers normalized successfully
- Zero information loss during normalization
- Type mappings cover 100% of provider types
- Schema versioning allows backward compatibility
- Language generators can consume schema without ambiguity

### Example Output
```typescript
// schemas/canonical-schema.json
{
  "version": "1.0.0",
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "version": "v1",
      "baseUrl": "https://api.openai.com/v1",
      "capabilities": ["streaming", "function_calling", "vision"],
      "models": [...],
      "endpoints": [...]
    }
  ],
  "commonTypes": [...],
  "operations": [...]
}
```

---

## Template Engine Agent

**Role**: Build and maintain the template rendering system

### Responsibilities
- Implement Handlebars-based template engine
- Create custom template helpers
- Build common template library
- Optimize template rendering performance
- Validate template syntax
- Support template inheritance
- Enable template debugging

### Deliverables

#### Phase 1 (Weeks 3-6)
- [ ] Template engine core (`templates/engine.ts`)
- [ ] Custom Handlebars helpers (`templates/helpers/`)
  - [ ] Type mapping helpers
  - [ ] Naming convention helpers (camelCase, snake_case, PascalCase)
  - [ ] Conditional rendering helpers
  - [ ] Collection iteration helpers
- [ ] Common template library (`templates/common/`)
  - [ ] client.hbs
  - [ ] types.hbs
  - [ ] request.hbs
  - [ ] response.hbs
  - [ ] errors.hbs
- [ ] Template validator
- [ ] Template testing framework
- [ ] Performance optimization (caching)
- [ ] Unit tests (>90% coverage)
- [ ] Template authoring guide

### Key Decisions
- Template engine choice (Handlebars vs. alternatives)
- Helper function API design
- Template inheritance strategy
- Caching strategy for performance

### Integration Points
- **Upstream**: Canonical schema from Schema Architect
- **Downstream**: All language agents use this engine

### Success Criteria
- Templates render in <100ms
- All helpers well-documented with examples
- Template validation catches 100% of syntax errors
- Template debugging shows clear error messages
- Language agents can easily create new templates
- Common templates reduce duplication >80%

### Example Output
```typescript
// templates/engine.ts
export interface TemplateEngine {
  render(templatePath: string, context: TemplateContext): string;
  registerHelper(name: string, fn: HelperFunction): void;
  validateTemplate(templatePath: string): ValidationResult;
}

// templates/helpers/types.ts
Handlebars.registerHelper('typeMap', function(canonicalType, targetLang) {
  return TYPE_MAPPINGS[targetLang][canonicalType];
});

// Usage in template:
// {{typeMap "String" "rust"}} -> "String"
// {{typeMap "String" "typescript"}} -> "string"
```

---

## TypeScript Agent

**Role**: Generate TypeScript SDKs

### Responsibilities
- Implement TypeScript code generator
- Create TypeScript templates
- Generate type definitions (interfaces, enums, unions)
- Build fetch-based HTTP client
- Implement streaming support
- Generate package.json and tsconfig.json
- Create TypeScript examples
- Ensure TypeScript best practices

### Deliverables

#### Phase 2 (Weeks 7-10)
- [ ] TypeScript generator (`core/generators/typescript/`)
- [ ] TypeScript templates (`templates/typescript/`)
  - [ ] index.ts.hbs
  - [ ] client.ts.hbs
  - [ ] types.ts.hbs (per provider)
  - [ ] errors.ts.hbs
  - [ ] streaming.ts.hbs
- [ ] Build configuration generation
  - [ ] package.json.hbs
  - [ ] tsconfig.json.hbs
  - [ ] README.md.hbs
- [ ] Example applications (`examples/typescript/`)
- [ ] Generated SDK tests
- [ ] Type checking validation
- [ ] Documentation

### Key Decisions
- Use classes vs. functional approach
- Interface design for client
- Streaming implementation (async iterators)
- Error handling strategy
- Dependency management (fetch polyfill?)

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code compiles with zero errors
- Full type inference (no `any` types)
- Streaming responses work correctly
- All provider features accessible
- Package can be published to npm
- Examples run successfully
- Documentation is comprehensive

### Example Output
```typescript
// generated/typescript/src/client.ts
export class OpenAIClient {
  constructor(private apiKey: string, private options?: ClientOptions) {}

  async chat(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    // Implementation
  }

  chatStream(
    request: ChatCompletionRequest
  ): AsyncIterableIterator<ChatCompletionChunk> {
    // Streaming implementation
  }
}
```

---

## Python Agent

**Role**: Generate Python SDKs

### Responsibilities
- Implement Python code generator
- Create Python templates
- Generate type hints (mypy compliant)
- Build httpx-based async client
- Implement async generators for streaming
- Generate setup.py and pyproject.toml
- Create Python examples
- Ensure Pythonic idioms

### Deliverables

#### Phase 3 (Weeks 11-12)
- [ ] Python generator (`core/generators/python/`)
- [ ] Python templates (`templates/python/`)
  - [ ] __init__.py.hbs
  - [ ] client.py.hbs
  - [ ] types/ (per provider)
  - [ ] errors.py.hbs
  - [ ] streaming.py.hbs
- [ ] Build configuration generation
  - [ ] setup.py.hbs
  - [ ] pyproject.toml.hbs
  - [ ] README.md.hbs
- [ ] Example applications (`examples/python/`)
- [ ] Generated SDK tests (pytest)
- [ ] Type checking validation (mypy)
- [ ] Documentation

### Key Decisions
- Use dataclasses vs. Pydantic for types
- Sync vs. async client (or both?)
- Streaming with async generators
- Error hierarchy design
- Support for Python 3.9+ features

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code passes mypy strict mode
- All type hints are accurate
- Async/await patterns are idiomatic
- Streaming with async for works correctly
- Package can be published to PyPI
- Examples run successfully
- pytest tests all pass

### Example Output
```python
# generated/python/llm_forge/client.py
from dataclasses import dataclass
from typing import AsyncIterator

@dataclass
class ChatCompletionRequest:
    model: str
    messages: list[Message]
    temperature: float = 1.0

class OpenAIClient:
    def __init__(self, api_key: str, options: ClientOptions | None = None):
        self.api_key = api_key

    async def chat(
        self, request: ChatCompletionRequest
    ) -> ChatCompletionResponse:
        # Implementation

    async def chat_stream(
        self, request: ChatCompletionRequest
    ) -> AsyncIterator[ChatCompletionChunk]:
        # Streaming implementation
```

---

## Rust Agent

**Role**: Generate Rust SDKs

### Responsibilities
- Implement Rust code generator
- Create Rust templates
- Generate structs and enums with serde
- Build reqwest-based async client
- Implement async streams for streaming
- Generate Cargo.toml
- Create Rust examples
- Ensure Rust idioms (builder patterns, Result<T,E>)

### Deliverables

#### Phase 3 (Weeks 12-13)
- [ ] Rust generator (`core/generators/rust/`)
- [ ] Rust templates (`templates/rust/`)
  - [ ] lib.rs.hbs
  - [ ] client.rs.hbs
  - [ ] types/mod.rs.hbs (per provider)
  - [ ] errors.rs.hbs
  - [ ] streaming.rs.hbs
- [ ] Build configuration generation
  - [ ] Cargo.toml.hbs
  - [ ] README.md.hbs
- [ ] Example applications (`examples/rust/`)
- [ ] Generated SDK tests
- [ ] Clippy validation
- [ ] Documentation with rustdoc

### Key Decisions
- Async runtime (tokio vs. async-std)
- Builder pattern implementation
- Error type design
- Lifetime annotations strategy
- Feature flags for optional capabilities

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code compiles with zero warnings
- All clippy lints pass
- Async/await patterns are idiomatic
- Builder patterns for complex requests
- Streaming with async streams works
- Package can be published to crates.io
- Examples run successfully
- rustdoc documentation is comprehensive

### Example Output
```rust
// generated/rust/src/client.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
}

pub struct OpenAIClient {
    api_key: String,
    client: reqwest::Client,
}

impl OpenAIClient {
    pub async fn chat(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse, Error> {
        // Implementation
    }

    pub async fn chat_stream(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<impl Stream<Item = Result<ChatCompletionChunk, Error>>, Error> {
        // Streaming implementation
    }
}
```

---

## JavaScript Agent

**Role**: Generate JavaScript (ES2022+) SDKs

### Responsibilities
- Implement JavaScript code generator
- Create JavaScript templates
- Build fetch-based client (CommonJS and ESM)
- Implement streaming support
- Generate package.json
- Create JavaScript examples
- Ensure modern JavaScript idioms

### Deliverables

#### Phase 3 (Weeks 14-16)
- [ ] JavaScript generator (`core/generators/javascript/`)
- [ ] JavaScript templates (`templates/javascript/`)
- [ ] Dual build (CJS + ESM)
- [ ] Example applications
- [ ] Generated SDK tests
- [ ] Documentation

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Works in Node.js and browsers
- Both CJS and ESM exports work
- Streaming with async iterators
- Published to npm
- Examples run successfully

---

## C# Agent

**Role**: Generate C# SDKs

### Responsibilities
- Implement C# code generator
- Create C# templates
- Build HttpClient-based client
- Implement async streams for streaming
- Generate .csproj file
- Create C# examples
- Ensure C# idioms (async/await, LINQ, nullable types)

### Deliverables

#### Phase 3 (Weeks 14-16)
- [ ] C# generator (`core/generators/csharp/`)
- [ ] C# templates (`templates/csharp/`)
- [ ] Build configuration generation (.csproj)
- [ ] Example applications
- [ ] Generated SDK tests (xUnit)
- [ ] Documentation

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code compiles with zero warnings
- Async/await patterns are idiomatic
- Nullable reference types enabled
- Package can be published to NuGet
- Examples run successfully

---

## Go Agent

**Role**: Generate Go SDKs

### Responsibilities
- Implement Go code generator
- Create Go templates
- Build net/http client
- Implement context propagation
- Generate go.mod
- Create Go examples
- Ensure Go idioms (interfaces, functional options)

### Deliverables

#### Phase 3 (Weeks 13-14)
- [ ] Go generator (`core/generators/go/`)
- [ ] Go templates (`templates/go/`)
- [ ] Build configuration generation (go.mod)
- [ ] Example applications
- [ ] Generated SDK tests
- [ ] Documentation

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code passes `go vet` and `golint`
- Context propagation is correct
- Functional options pattern for client config
- Published to Go modules proxy
- Examples run successfully

---

## Java Agent

**Role**: Generate Java SDKs

### Responsibilities
- Implement Java code generator
- Create Java templates
- Build java.net.http client (Java 11+)
- Implement CompletableFuture for async
- Generate pom.xml
- Create Java examples
- Ensure Java idioms (builder pattern, Optional)

### Deliverables

#### Phase 3 (Weeks 14-16)
- [ ] Java generator (`core/generators/java/`)
- [ ] Java templates (`templates/java/`)
- [ ] Build configuration generation (pom.xml)
- [ ] Example applications
- [ ] Generated SDK tests (JUnit 5)
- [ ] Documentation

### Integration Points
- **Upstream**: Canonical schema, Template engine
- **Downstream**: Build pipeline, Testing agent

### Success Criteria
- Generated code compiles with zero warnings
- CompletableFuture patterns are idiomatic
- Builder pattern for complex types
- Package can be published to Maven Central
- Examples run successfully

---

## Build Pipeline Agent

**Role**: Orchestrate code generation and package building

### Responsibilities
- Coordinate generation across all languages
- Integrate with package managers (npm, pip, cargo, etc.)
- Set up CI/CD pipelines
- Automate version bumping
- Manage publishing to registries
- Create GitHub Actions workflows
- Implement incremental builds
- Optimize build performance

### Deliverables

#### Phase 1 (Weeks 3-6)
- [ ] Build orchestration system (`cli/build/`)
- [ ] Package manager integrations
- [ ] CI/CD workflow templates (`.github/workflows/`)

#### Phase 4 (Weeks 17-20)
- [ ] Publishing automation
- [ ] Version management
- [ ] Changelog generation
- [ ] Release process automation

### Key Decisions
- Build order and parallelization
- Caching strategy
- Version bumping strategy (semantic versioning)
- Publishing workflow (manual approval vs. automatic)

### Integration Points
- **Upstream**: All language generators
- **Downstream**: Package registries, GitHub releases

### Success Criteria
- All languages build successfully
- Build completes in <5 minutes
- Incremental builds work correctly
- Publishing is automated and reliable
- CI/CD pipelines are maintainable
- Zero manual steps in release process

---

## Testing & Quality Agent

**Role**: Ensure comprehensive testing and quality assurance

### Responsibilities
- Design testing strategy
- Implement cross-language tests
- Create integration test framework
- Set up performance benchmarking
- Implement code coverage tracking
- Create quality gates for CI/CD
- Monitor test results and report issues

### Deliverables

#### Phase 1 (Weeks 3-6)
- [ ] Testing framework setup
- [ ] Unit test infrastructure
- [ ] Integration test framework
- [ ] Coverage reporting

#### Phase 3 (Weeks 11-16)
- [ ] Cross-language test suite
- [ ] Performance benchmarks
- [ ] API compatibility tests

#### Phase 4 (Weeks 17-20)
- [ ] End-to-end test suite
- [ ] Security testing
- [ ] Quality metrics dashboard

### Key Decisions
- Test framework choices per language
- Coverage targets (>90%)
- Performance benchmarks definition
- Integration testing approach (mock vs. real APIs)

### Integration Points
- **Upstream**: All components
- **Downstream**: CI/CD pipeline

### Success Criteria
- >90% code coverage across all components
- All integration tests pass
- Performance benchmarks met
- Zero security vulnerabilities
- Quality gates enforced in CI/CD

---

## Documentation Agent

**Role**: Create and maintain comprehensive documentation

### Responsibilities
- Generate API documentation
- Write user guides
- Create examples and tutorials
- Maintain architectural documentation
- Generate changelogs
- Create contribution guidelines
- Build documentation website

### Deliverables

#### Phase 2 (Weeks 7-10)
- [ ] API reference generation
- [ ] Getting started guides
- [ ] TypeScript SDK documentation

#### Phase 3 (Weeks 11-16)
- [ ] All language SDK documentation
- [ ] Provider-specific guides

#### Phase 4 (Weeks 17-20)
- [ ] Complete documentation website
- [ ] Video tutorials
- [ ] Advanced usage guides
- [ ] Troubleshooting guide
- [ ] Migration guides
- [ ] Plugin development guide

### Key Decisions
- Documentation tooling (Docusaurus, VitePress, etc.)
- Documentation structure
- Examples strategy
- Versioning documentation

### Integration Points
- **Upstream**: All components (for API docs)
- **Downstream**: Users, developers

### Success Criteria
- 100% of public APIs documented
- Getting started takes <10 minutes
- Examples are runnable and correct
- Documentation is searchable
- Documentation website is live
- Contribution guide is comprehensive

---

## CLI & Developer Experience Agent

**Role**: Build excellent CLI and developer experience

### Responsibilities
- Implement CLI interface
- Design configuration system
- Create interactive features
- Build progress indicators
- Implement error messages and logging
- Create CLI testing framework
- Optimize for developer productivity

### Deliverables

#### Phase 1 (Weeks 3-6)
- [ ] CLI foundation (`cli/`)
- [ ] Command structure
- [ ] Configuration loader
- [ ] Logging system

#### Phase 4 (Weeks 17-20)
- [ ] Interactive mode
- [ ] Configuration wizard
- [ ] Enhanced error messages
- [ ] Debug mode
- [ ] Shell completions

### Key Decisions
- CLI framework (Commander.js, yargs, etc.)
- Configuration format (JSON, YAML, TOML)
- Logging levels and output
- Interactive vs. non-interactive modes

### Integration Points
- **Upstream**: All core components
- **Downstream**: End users

### Success Criteria
- CLI is intuitive and self-documenting
- Error messages are actionable
- Configuration is simple yet powerful
- Interactive mode is helpful
- Shell completions work
- Performance is snappy (<500ms startup)

---

## Coordination Summary

### Dependency Flow
```
Schema Architect → Template Engine → Language Agents → Build Pipeline → Testing
                                                              ↓
                                                      Documentation
                                                              ↓
                                                        CLI Agent
```

### Critical Path
1. Schema Architect completes canonical schema (Week 6)
2. Template Engine completes core (Week 6)
3. TypeScript Agent completes first SDK (Week 10)
4. All Language Agents complete (Week 16)
5. Polish and production ready (Week 20)

### Communication Cadence
- **Daily**: Progress updates in `.swarm/standups/`
- **Weekly**: Integration review with SwarmLead
- **Phase transitions**: Comprehensive review and planning

### Success = Project Success
All agents working together, coordinated by SwarmLead, following architecture and roadmap, producing a production-ready multi-language SDK generator.
