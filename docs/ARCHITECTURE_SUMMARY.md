# LLM-Forge: Architecture Summary & Visual Guide

**Version**: 1.0
**Date**: 2025-11-07
**Purpose**: Executive overview with visual architecture diagrams

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Interaction Diagram](#2-component-interaction-diagram)
3. [Data Flow Visualization](#3-data-flow-visualization)
4. [Technology Stack](#4-technology-stack)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Quick Start for Contributors](#6-quick-start-for-contributors)

---

## 1. System Overview

### 1.1 What is LLM-Forge?

LLM-Forge is a **polyglot SDK generator** that transforms LLM provider API specifications into production-ready client libraries for 7+ programming languages.

**Key Features:**
- **Multi-Provider Support**: OpenAI, Anthropic, Cohere, Google AI, Mistral
- **7+ Languages**: Python, TypeScript/JavaScript, Rust, Go, Java, C#, Ruby
- **Type-Safe**: Full type definitions and validation
- **Production-Ready**: Rate limiting, retry logic, streaming, error handling
- **Idiomatic**: Follows each language's best practices and conventions

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LLM-FORGE                                 │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Schema    │───▶│    Type     │───▶│    Code     │         │
│  │Normalization│    │   Mapper    │    │  Generator  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────┐        │
│  │            Build Pipeline Orchestrator              │        │
│  └─────────────────────────────────────────────────────┘        │
│         │                                      │                 │
│         ▼                                      ▼                 │
│  ┌──────────────┐                      ┌──────────────┐         │
│  │  Validation  │                      │  Publishing  │         │
│  │  & Testing   │                      │  (Registries)│         │
│  └──────────────┘                      └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Core Principles

1. **Schema-First**: Single source of truth from provider specifications
2. **Type-Safe**: Strong typing throughout the pipeline
3. **Modular**: Pluggable components for easy extension
4. **Quality-First**: Multiple validation gates ensure correctness
5. **Idiomatic**: Generated code feels native to each language

---

## 2. Component Interaction Diagram

### 2.1 Full System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INPUTS                               │
│                                                                   │
│  OpenAI      Anthropic     Cohere      Google AI     Mistral    │
│  OpenAPI     Custom        OpenAPI     OpenAPI       OpenAPI    │
│    │            │             │            │            │        │
│    └────────────┴─────────────┴────────────┴────────────┘        │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 1: INGESTION                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Provider Adapter Registry                     │  │
│  │                                                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   OpenAI    │  │  Anthropic  │  │   Cohere    │      │  │
│  │  │   Adapter   │  │   Adapter   │  │   Adapter   │ ...  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Schema Parser & Validator                     │  │
│  │  • OpenAPI 3.x Parser                                      │  │
│  │  • Custom Schema Parser                                    │  │
│  │  • JSON Schema Validator                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Schema Normalizer                             │  │
│  │  • Type Extraction                                         │  │
│  │  • Endpoint Mapping                                        │  │
│  │  • Feature Detection                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│              Unified Intermediate Representation (UIR)          │
│              ═══════════════════════════════════════            │
│              {                                                   │
│                types: TypeDefinition[],                         │
│                endpoints: EndpointDefinition[],                 │
│                authentication: AuthConfig,                      │
│                features: FeatureSet                             │
│              }                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                LAYER 2: TYPE MAPPING                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Language Type Mappers                         │  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Python  │  │   TS/JS  │  │   Rust   │  │    Go    │ │  │
│  │  │  Mapper  │  │  Mapper  │  │  Mapper  │  │  Mapper  │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       │             │             │             │        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │   Java   │  │    C#    │  │   Ruby   │   ...        │  │
│  │  │  Mapper  │  │  Mapper  │  │  Mapper  │              │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘              │  │
│  └───────┼─────────────┼─────────────┼─────────────────────┘  │
│          │             │             │                          │
│          └─────────────┴─────────────┘                          │
│                      │                                           │
│                      ▼                                           │
│        Language-Specific Intermediate Representations           │
│        ═══════════════════════════════════════════              │
│        Map<Language, LanguageIR>                                │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 3: CODE GENERATION                            │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Template Engine                               │  │
│  │  • Handlebars Compiler                                     │  │
│  │  • Template Registry                                       │  │
│  │  • Custom Helpers                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          Language-Specific Generators                      │  │
│  │                                                             │  │
│  │  ┌──────────────────┐      ┌──────────────────┐          │  │
│  │  │  Template-Based  │      │   AST-Based      │          │  │
│  │  │  Generator       │      │   Generator      │          │  │
│  │  └──────────────────┘      └──────────────────┘          │  │
│  │                                                             │  │
│  │  Generates:                                                 │  │
│  │  • Client Classes                                           │  │
│  │  • Type Definitions                                         │  │
│  │  • Resource Classes                                         │  │
│  │  • Error Classes                                            │  │
│  │  • Auth Handlers                                            │  │
│  │  • Utility Functions                                        │  │
│  │  • Tests                                                    │  │
│  │  • Documentation                                            │  │
│  │  • Examples                                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Code Formatters                               │  │
│  │  • black (Python)                                          │  │
│  │  • prettier (TypeScript/JavaScript)                        │  │
│  │  • rustfmt (Rust)                                          │  │
│  │  • gofmt (Go)                                              │  │
│  │  • spotless (Java)                                         │  │
│  │  • dotnet format (C#)                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│              Generated Source Code Files                        │
│              ═══════════════════════════                        │
│              Map<Language, GeneratedFile[]>                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            LAYER 4: BUILD & VALIDATION                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Build Pipeline Orchestrator                   │  │
│  │                                                             │  │
│  │  Parallel Execution:                                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │ Python  │  │  TS/JS  │  │  Rust   │  │   Go    │      │  │
│  │  │Pipeline │  │Pipeline │  │Pipeline │  │Pipeline │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  │                                                             │  │
│  │  Each Pipeline:                                             │  │
│  │  1. Validate (linting, type checking)                      │  │
│  │  2. Test (unit, integration)                               │  │
│  │  3. Build (compilation, bundling)                          │  │
│  │  4. Package (wheels, tarballs, etc.)                       │  │
│  │  5. Publish (registries)                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Quality Gates                                 │  │
│  │  ✓ Compilation Success                                     │  │
│  │  ✓ Type Checking (>0 errors)                               │  │
│  │  ✓ Unit Tests (>80% coverage)                              │  │
│  │  ✓ Integration Tests                                       │  │
│  │  ✓ Linting (0 violations)                                  │  │
│  │  ✓ Security Scanning (0 high/critical)                     │  │
│  │  ✓ License Compliance                                      │  │
│  │  ✓ Breaking Change Detection                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OUTPUT: PUBLISHED SDKS                         │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   PyPI   │  │   NPM    │  │crates.io │  │pkg.go.dev│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  NuGet   │  │  Maven   │  │RubyGems  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Plugin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN SYSTEM                                 │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Plugin Manager                                │  │
│  │                                                             │  │
│  │  • Plugin Discovery                                         │  │
│  │  • Plugin Loading                                           │  │
│  │  • Plugin Lifecycle Management                              │  │
│  │  • Dependency Resolution                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Plugin Types                                  │  │
│  │                                                             │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │  Provider Plugin │  │ Language Plugin  │              │  │
│  │  │                  │  │                  │              │  │
│  │  │  • Custom API    │  │  • Custom Lang   │              │  │
│  │  │  • Adapter Logic │  │  • Type Mapper   │              │  │
│  │  │  • Auth Handler  │  │  • Code Gen      │              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  │                                                             │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │Transformer Plugin│  │  Pipeline Plugin │              │  │
│  │  │                  │  │                  │              │  │
│  │  │  • Pre-process   │  │  • Custom Build  │              │  │
│  │  │  • Post-process  │  │  • Custom Test   │              │  │
│  │  │  • Custom Logic  │  │  • Custom Publish│              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Plugin Lifecycle:                                               │
│  Initialize → Load → Execute → Cleanup                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Visualization

### 3.1 Schema to SDK Flow

```
OpenAPI Spec
    │
    ├─ info: { version, title, ... }
    ├─ paths:
    │   ├─ /chat/completions:
    │   │   └─ post: { parameters, requestBody, responses }
    │   └─ /embeddings:
    │       └─ post: { parameters, requestBody, responses }
    └─ components:
        └─ schemas:
            ├─ ChatCompletionRequest
            ├─ ChatCompletionResponse
            └─ Embedding

    ↓ [Provider Adapter]

Unified IR
    │
    ├─ metadata: { provider: "openai", version: "1.0" }
    ├─ types:
    │   ├─ ChatCompletionRequest: {
    │   │    id: "type_1",
    │   │    properties: [ { name: "model", type: "string" }, ... ]
    │   │  }
    │   └─ ChatCompletionResponse: { ... }
    ├─ endpoints:
    │   ├─ createChatCompletion: {
    │   │    method: "POST",
    │   │    path: "/chat/completions",
    │   │    streaming: true
    │   │  }
    │   └─ createEmbedding: { ... }
    ├─ authentication: {
    │    schemes: [ { type: "apiKey", in: "header" } ]
    │  }
    └─ features: {
         streaming: true,
         rateLimit: { ... }
       }

    ↓ [Type Mapper]

Language IR (Python)
    │
    ├─ types:
    │   ├─ ChatCompletionRequest (Pydantic BaseModel):
    │   │    model: str = Field(...)
    │   │    messages: List[ChatMessage] = Field(...)
    │   │    temperature: Optional[float] = Field(default=1.0)
    │   └─ ChatCompletionResponse: { ... }
    ├─ endpoints:
    │   ├─ create_chat_completion:
    │   │    async def create_chat_completion(
    │   │      self,
    │   │      request: ChatCompletionRequest
    │   │    ) -> ChatCompletionResponse:
    │   │      ...
    │   └─ create_chat_completion_stream:
    │       async def create_chat_completion_stream(
    │         self,
    │         request: ChatCompletionRequest
    │       ) -> AsyncIterator[ChatCompletionChunk]:
    │         ...

    ↓ [Code Generator]

Generated Files (Python)
    │
    ├─ openai/
    │   ├─ __init__.py
    │   ├─ client.py                # Main client class
    │   ├─ types/
    │   │   ├─ chat.py              # ChatCompletionRequest, Response
    │   │   └─ embedding.py         # EmbeddingRequest, Response
    │   ├─ resources/
    │   │   ├─ chat.py              # Chat resource
    │   │   └─ embeddings.py        # Embeddings resource
    │   ├─ _base_client.py          # HTTP client
    │   ├─ _auth.py                 # Auth handlers
    │   ├─ _errors.py               # Error classes
    │   └─ _utils/
    │       ├─ retry.py             # Retry logic
    │       └─ rate_limit.py        # Rate limiting
    ├─ tests/
    │   ├─ test_client.py
    │   └─ test_chat.py
    └─ pyproject.toml               # Package metadata

    ↓ [Build Pipeline]

Package Artifact
    │
    ├─ openai-1.0.0.tar.gz          # Source distribution
    └─ openai-1.0.0-py3-none-any.whl # Wheel distribution

    ↓ [Publish]

PyPI Registry
    │
    └─ https://pypi.org/project/openai/1.0.0/
```

### 3.2 Request Execution Flow

```
User Code
    │
    └─ client.create_chat_completion(request)
        │
        ↓
Client Class
    │
    ├─ Validate request (Pydantic)
    │   ├─ Check required fields
    │   ├─ Validate types
    │   └─ Apply constraints
    │
    ├─ Apply authentication
    │   └─ Add API key to headers
    │
    ├─ Check rate limits
    │   ├─ Client-side rate limiter
    │   └─ Wait if needed
    │
    ├─ Build HTTP request
    │   ├─ Method: POST
    │   ├─ URL: https://api.openai.com/v1/chat/completions
    │   ├─ Headers: { "Authorization": "Bearer ...", ... }
    │   └─ Body: JSON.stringify(request)
    │
    └─ Execute with retry
        │
        ├─ Attempt 1
        │   ├─ Send HTTP request
        │   ├─ Receive response
        │   └─ [Success] ──────────────────┐
        │                                   │
        ├─ [Failure: 429 Rate Limit]       │
        │   ├─ Check if retryable           │
        │   ├─ Calculate backoff delay      │
        │   ├─ Wait (2 seconds)             │
        │   └─ Retry ──▶ Attempt 2          │
        │                                   │
        ├─ [Failure: 500 Server Error]     │
        │   ├─ Check if retryable           │
        │   ├─ Calculate backoff delay      │
        │   ├─ Wait (4 seconds)             │
        │   └─ Retry ──▶ Attempt 3          │
        │                                   │
        └─ [Success] ──────────────────────┤
                                            │
                                            ▼
Parse Response
    │
    ├─ Check status code
    │   ├─ 200-299: Success
    │   ├─ 400-499: Client error ──▶ Raise APIError
    │   └─ 500-599: Server error ──▶ Raise ServerError
    │
    ├─ Parse JSON body
    │
    ├─ Validate response (Pydantic)
    │   ├─ Check required fields
    │   └─ Validate types
    │
    └─ Return ChatCompletionResponse object
        │
        ▼
User Code
    │
    └─ response.choices[0].message.content
```

---

## 4. Technology Stack

### 4.1 Core Generator (Node.js/TypeScript)

```
┌─────────────────────────────────────────────────────────────────┐
│                     GENERATOR RUNTIME                            │
│                                                                   │
│  Language: TypeScript 5.x                                        │
│  Runtime: Node.js 18+                                            │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Core Dependencies                          │  │
│  │                                                             │  │
│  │  • @apidevtools/swagger-parser  ─  OpenAPI parsing        │  │
│  │  • graphql                       ─  GraphQL parsing        │  │
│  │  • handlebars                    ─  Template engine        │  │
│  │  • zod                           ─  Schema validation      │  │
│  │  • ajv                           ─  JSON schema validator  │  │
│  │  • commander                     ─  CLI framework          │  │
│  │  • prettier                      ─  Code formatting        │  │
│  │  • typescript                    ─  Type safety            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Build Tools                                │  │
│  │                                                             │  │
│  │  • tsup                          ─  Bundler                │  │
│  │  • vitest                        ─  Testing framework      │  │
│  │  • eslint                        ─  Linting                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Generated SDK Technologies

#### Python

```
┌─────────────────────────────────────────────────────────────────┐
│                       PYTHON SDK                                 │
│                                                                   │
│  Package Manager: Poetry / pip                                  │
│  Python Version: 3.8+                                            │
│                                                                   │
│  Core Dependencies:                                              │
│  • pydantic >= 2.0        ─  Data validation                    │
│  • httpx                  ─  Async HTTP client                  │
│  • typing-extensions      ─  Type hints                         │
│                                                                   │
│  Dev Dependencies:                                               │
│  • pytest                 ─  Testing                             │
│  • black                  ─  Formatting                          │
│  • mypy                   ─  Type checking                       │
│  • ruff                   ─  Linting                             │
│  • pytest-cov             ─  Coverage                            │
│                                                                   │
│  Documentation:                                                  │
│  • sphinx                 ─  Doc generation                      │
│  • sphinx-rtd-theme       ─  Theme                               │
└─────────────────────────────────────────────────────────────────┘
```

#### TypeScript/JavaScript

```
┌─────────────────────────────────────────────────────────────────┐
│                  TYPESCRIPT/JAVASCRIPT SDK                       │
│                                                                   │
│  Package Manager: npm / pnpm / yarn                              │
│  Node Version: 16+                                               │
│                                                                   │
│  Core Dependencies:                                              │
│  • zod                    ─  Runtime validation                 │
│  • node-fetch             ─  HTTP client (Node < 18)            │
│                                                                   │
│  Dev Dependencies:                                               │
│  • typescript             ─  Type system                         │
│  • jest / vitest          ─  Testing                             │
│  • prettier               ─  Formatting                          │
│  • eslint                 ─  Linting                             │
│  • tsup / rollup          ─  Bundler                             │
│                                                                   │
│  Documentation:                                                  │
│  • typedoc                ─  Doc generation                      │
│                                                                   │
│  Output Formats:                                                 │
│  • ESM (ES modules)                                              │
│  • CommonJS                                                      │
│  • Type declarations (.d.ts)                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Rust

```
┌─────────────────────────────────────────────────────────────────┐
│                        RUST SDK                                  │
│                                                                   │
│  Package Manager: Cargo                                          │
│  Edition: 2021                                                   │
│                                                                   │
│  Core Dependencies:                                              │
│  • serde                  ─  Serialization                       │
│  • serde_json             ─  JSON support                        │
│  • reqwest                ─  HTTP client                         │
│  • tokio                  ─  Async runtime                       │
│  • futures                ─  Async utilities                     │
│                                                                   │
│  Dev Dependencies:                                               │
│  • tokio-test             ─  Testing utilities                   │
│  • mockito                ─  HTTP mocking                        │
│                                                                   │
│  Build Tools:                                                    │
│  • rustfmt                ─  Formatting                          │
│  • clippy                 ─  Linting                             │
│  • cargo-tarpaulin        ─  Coverage                            │
│  • cargo-audit            ─  Security audit                      │
│                                                                   │
│  Documentation:                                                  │
│  • rustdoc                ─  Built-in doc generation             │
└─────────────────────────────────────────────────────────────────┘
```

#### Go

```
┌─────────────────────────────────────────────────────────────────┐
│                          GO SDK                                  │
│                                                                   │
│  Package Manager: Go modules                                     │
│  Go Version: 1.20+                                               │
│                                                                   │
│  Core Dependencies:                                              │
│  • net/http               ─  HTTP client (stdlib)                │
│  • encoding/json          ─  JSON support (stdlib)               │
│  • context                ─  Context propagation (stdlib)        │
│                                                                   │
│  Build Tools:                                                    │
│  • gofmt                  ─  Formatting                          │
│  • go vet                 ─  Static analysis                     │
│  • golangci-lint          ─  Linting                             │
│  • go test                ─  Testing (built-in)                  │
│                                                                   │
│  Documentation:                                                  │
│  • godoc                  ─  Built-in doc generation             │
│  • pkg.go.dev             ─  Hosted documentation                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 CI/CD Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                              │
│                                                                   │
│  Platform: GitHub Actions                                        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Workflow Stages                              │  │
│  │                                                             │  │
│  │  1. Code Generation                                         │  │
│  │     • Run generator                                         │  │
│  │     • Upload artifacts                                      │  │
│  │                                                             │  │
│  │  2. Parallel Language Builds (Matrix)                       │  │
│  │     • Python: pip, pytest                                   │  │
│  │     • TypeScript: npm, jest                                 │  │
│  │     • Rust: cargo, cargo test                               │  │
│  │     • Go: go build, go test                                 │  │
│  │     • Java: mvn verify                                      │  │
│  │     • C#: dotnet build, dotnet test                         │  │
│  │                                                             │  │
│  │  3. Quality Gates                                           │  │
│  │     • Linting                                               │  │
│  │     • Type checking                                         │  │
│  │     • Unit tests (80% coverage)                             │  │
│  │     • Integration tests                                     │  │
│  │     • Security scanning (Snyk, Dependabot)                  │  │
│  │                                                             │  │
│  │  4. Publishing (on release)                                 │  │
│  │     • PyPI (Python)                                         │  │
│  │     • NPM (TypeScript/JavaScript)                           │  │
│  │     • crates.io (Rust)                                      │  │
│  │     • pkg.go.dev (Go)                                       │  │
│  │     • Maven Central (Java)                                  │  │
│  │     • NuGet (C#)                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Secrets:                                                        │
│  • CARGO_TOKEN            ─  crates.io                          │
│  • NPM_TOKEN              ─  npmjs.com                          │
│  • PYPI_TOKEN             ─  PyPI                               │
│  • NUGET_TOKEN            ─  NuGet.org                          │
│  • GPG_PRIVATE_KEY        ─  Package signing                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Deployment Architecture

### 5.1 Development Workflow

```
Developer Machine
    │
    ├─ Clone repository
    ├─ Install dependencies (npm install)
    ├─ Run generator (npm run generate)
    │   └─ Generates SDKs locally
    ├─ Make changes
    │   ├─ Update schemas
    │   ├─ Modify templates
    │   └─ Add new providers/languages
    ├─ Test locally
    │   └─ npm run test:all
    └─ Commit & Push

    ↓

GitHub
    │
    ├─ Pull Request
    │   ├─ CI runs on PR
    │   │   ├─ Code generation
    │   │   ├─ Build all languages
    │   │   └─ Run all tests
    │   └─ Review & Approve
    │
    ├─ Merge to main
    │   └─ CI runs full pipeline
    │       ├─ Generate SDKs
    │       ├─ Build & test
    │       └─ No publish (main branch)
    │
    └─ Create Release Tag (v1.2.3)
        └─ CI runs release pipeline
            ├─ Generate SDKs
            ├─ Build all languages
            ├─ Run quality gates
            ├─ Publish to registries
            └─ Create GitHub release

    ↓

Package Registries
    │
    ├─ PyPI
    ├─ NPM
    ├─ crates.io
    ├─ pkg.go.dev
    ├─ NuGet
    └─ Maven Central

    ↓

End Users
    │
    └─ Install SDKs
        ├─ pip install openai-sdk
        ├─ npm install @openai/sdk
        ├─ cargo add openai-sdk
        └─ go get github.com/openai/openai-go
```

### 5.2 Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              GitHub                                       │  │
│  │                                                             │  │
│  │  • Source Code Repository                                   │  │
│  │  • Issue Tracking                                           │  │
│  │  • Pull Requests                                            │  │
│  │  • GitHub Actions (CI/CD)                                   │  │
│  │  • GitHub Releases                                          │  │
│  │  • GitHub Pages (Documentation)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Monitoring & Observability                   │  │
│  │                                                             │  │
│  │  • GitHub Actions Insights                                  │  │
│  │  • Package Registry Download Stats                          │  │
│  │  • Dependency Health (Dependabot)                           │  │
│  │  • Security Scanning (Snyk)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Documentation                                │  │
│  │                                                             │  │
│  │  • GitHub Pages (Main Site)                                 │  │
│  │  • Language-Specific Docs:                                  │  │
│  │    • docs.rs (Rust)                                         │  │
│  │    • TypeDoc site (TypeScript)                              │  │
│  │    • Sphinx site (Python)                                   │  │
│  │    • pkg.go.dev (Go)                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Quick Start for Contributors

### 6.1 Prerequisites

- **Node.js 18+** (for generator)
- **Language Runtimes** (optional, for testing):
  - Python 3.8+
  - Rust 1.70+
  - Go 1.20+
  - Java 11+
  - .NET 6+

### 6.2 Setup

```bash
# Clone repository
git clone https://github.com/your-org/llm-forge.git
cd llm-forge

# Install dependencies
npm install

# Build generator
npm run build
```

### 6.3 Generate SDKs

```bash
# Generate all SDKs
npm run generate

# Generate specific language
npm run generate:python
npm run generate:typescript
npm run generate:rust

# Generate from specific provider
npm run generate -- --provider openai
```

### 6.4 Test

```bash
# Test generator
npm test

# Test generated SDKs
npm run test:all

# Test specific language
npm run test:python
```

### 6.5 Project Structure

```
llm-forge/
├── src/                         # Generator source code
│   ├── adapters/                # Provider adapters
│   ├── mappers/                 # Type mappers
│   ├── generators/              # Code generators
│   └── pipeline/                # Build pipelines
├── templates/                   # Code templates
│   ├── python/
│   ├── typescript/
│   ├── rust/
│   └── ...
├── schemas/                     # Provider schemas
│   ├── openai.yaml
│   ├── anthropic.yaml
│   └── ...
├── generated/                   # Generated SDK output
│   ├── python/
│   ├── typescript/
│   └── ...
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── ...
└── tests/                       # Tests
    ├── unit/
    └── integration/
```

### 6.6 Adding a New Provider

1. **Create Schema**: Add provider schema to `schemas/`
2. **Create Adapter**: Implement `IProviderAdapter` in `src/adapters/`
3. **Register**: Add to provider registry
4. **Test**: Add tests in `tests/adapters/`
5. **Generate**: Run `npm run generate -- --provider your-provider`

### 6.7 Adding a New Language

1. **Create Type Mapper**: Implement `ITypeMapper` in `src/mappers/`
2. **Create Code Generator**: Implement `ICodeGenerator` in `src/generators/`
3. **Create Templates**: Add templates to `templates/your-language/`
4. **Create Build Pipeline**: Implement `IBuildPipeline` in `src/pipeline/`
5. **Register**: Add to language registry
6. **Test**: Add tests
7. **Generate**: Run `npm run generate:your-language`

---

## Summary

LLM-Forge provides a complete, production-ready solution for generating multi-language SDKs from LLM provider APIs. The architecture is:

- **Modular**: Easy to add providers and languages
- **Type-Safe**: Strong typing throughout
- **Tested**: Comprehensive test coverage
- **Validated**: Multiple quality gates
- **Extensible**: Plugin system for customization
- **Automated**: Full CI/CD pipeline

For detailed information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Core architecture
- [SYSTEM_ARCHITECTURE_DETAILED.md](./SYSTEM_ARCHITECTURE_DETAILED.md) - Detailed component specs
- [CROSS_CUTTING_CONCERNS.md](./CROSS_CUTTING_CONCERNS.md) - Cross-cutting patterns
- [devops-pipeline-architecture.md](./devops-pipeline-architecture.md) - DevOps pipeline

---

**Last Updated**: 2025-11-07
**Version**: 1.0
