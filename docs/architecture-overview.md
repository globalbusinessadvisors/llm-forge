# LLM-Forge Architecture Overview

## System Architecture

LLM-Forge is designed as a multi-language SDK generator that produces idiomatic, type-safe client libraries from OpenAPI/JSON Schema specifications.

```
┌─────────────────────────────────────────────────────────────────┐
│                         LLM-Forge Core                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   OpenAPI    │───▶│   Schema     │───▶│  IR (AST)    │     │
│  │   Parser     │    │   Analyzer   │    │  Generator   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Language-Agnostic IR (Intermediate Repr.)     │   │
│  │  - Types & Schemas                                      │   │
│  │  - Operations & Endpoints                               │   │
│  │  - Authentication & Security                            │   │
│  │  - Validation Rules                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                  │              │
│                    ┌────────────────────────────┴─────────┐    │
│                    ▼                                      ▼     │
│  ┌──────────────────────────┐          ┌──────────────────────┐│
│  │  Language Generators     │          │  Template Engine     ││
│  │  - Rust Generator        │◀────────▶│  - Handlebars/Tera   ││
│  │  - TypeScript Generator  │          │  - Custom Filters    ││
│  │  - Python Generator      │          │  - Partials          ││
│  │  - Go Generator          │          └──────────────────────┘│
│  │  - Java Generator        │                                  │
│  │  - C# Generator          │                                  │
│  │  - JavaScript Generator  │                                  │
│  └──────────────────────────┘                                  │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Code Generation Pipeline                   │   │
│  │  1. Generate Types/Models                               │   │
│  │  2. Generate HTTP Client                                │   │
│  │  3. Generate Endpoint Methods                           │   │
│  │  4. Generate Validation Logic                           │   │
│  │  5. Generate Documentation                              │   │
│  │  6. Generate Tests (optional)                           │   │
│  │  7. Generate Package Metadata                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Post-Processing & Formatting                  │   │
│  │  - Run language formatters (rustfmt, prettier, etc.)    │   │
│  │  - Run linters                                          │   │
│  │  - Validate generated code                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌───────────────────────────────────────────┐
      │        Generated SDK Packages             │
      │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
      │  │  Rust   │  │  TypeS  │  │ Python  │   │
      │  │  Crate  │  │  NPM    │  │  PyPI   │   │
      │  └─────────┘  └─────────┘  └─────────┘   │
      │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
      │  │   Go    │  │  Java   │  │   C#    │   │
      │  │  Module │  │  Maven  │  │  NuGet  │   │
      │  └─────────┘  └─────────┘  └─────────┘   │
      └───────────────────────────────────────────┘
```

## Core Components

### 1. OpenAPI Parser

**Purpose**: Parse and validate OpenAPI 3.0/3.1 specifications

**Responsibilities**:
- Parse YAML/JSON OpenAPI specs
- Resolve `$ref` references
- Validate spec compliance
- Extract metadata (servers, security, tags)

**Technologies**:
- Rust: `openapiv3` crate or custom parser
- Schema validation against OpenAPI schema

### 2. Schema Analyzer

**Purpose**: Analyze and enrich the parsed OpenAPI specification

**Responsibilities**:
- Analyze type relationships and dependencies
- Detect circular references
- Infer missing information (e.g., response types)
- Build dependency graph for code generation order
- Identify discriminated unions (oneOf with discriminator)
- Extract validation constraints (min/max, pattern, etc.)

**Output**: Enhanced schema with metadata for code generation

### 3. IR (Intermediate Representation) Generator

**Purpose**: Transform OpenAPI into a language-agnostic intermediate representation

**IR Structure**:

```rust
// Example IR structure in Rust

pub struct SDK {
    pub info: SDKInfo,
    pub types: Vec<TypeDefinition>,
    pub endpoints: Vec<Endpoint>,
    pub security: Vec<SecurityScheme>,
}

pub struct SDKInfo {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub base_url: Option<String>,
}

pub struct TypeDefinition {
    pub name: String,
    pub kind: TypeKind,
    pub description: Option<String>,
    pub deprecated: bool,
}

pub enum TypeKind {
    Primitive(PrimitiveType),
    Object(ObjectType),
    Array(ArrayType),
    Union(UnionType),
    Enum(EnumType),
}

pub struct ObjectType {
    pub properties: Vec<Property>,
    pub required: Vec<String>,
    pub additional_properties: Option<Box<TypeKind>>,
}

pub struct Property {
    pub name: String,
    pub type_ref: TypeReference,
    pub required: bool,
    pub nullable: bool,
    pub description: Option<String>,
    pub validation: Option<ValidationRules>,
}

pub struct ValidationRules {
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
    pub pattern: Option<String>,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub min_items: Option<usize>,
    pub max_items: Option<usize>,
}

pub struct Endpoint {
    pub operation_id: String,
    pub method: HttpMethod,
    pub path: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<Parameter>,
    pub request_body: Option<RequestBody>,
    pub responses: Vec<Response>,
    pub security: Vec<SecurityRequirement>,
    pub tags: Vec<String>,
}

pub struct Parameter {
    pub name: String,
    pub location: ParameterLocation,
    pub type_ref: TypeReference,
    pub required: bool,
    pub description: Option<String>,
}

pub enum ParameterLocation {
    Path,
    Query,
    Header,
    Cookie,
}

pub struct RequestBody {
    pub content_type: String,
    pub type_ref: TypeReference,
    pub required: bool,
}

pub struct Response {
    pub status_code: u16,
    pub content_type: Option<String>,
    pub type_ref: Option<TypeReference>,
    pub description: String,
}

pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}

pub struct SecurityScheme {
    pub name: String,
    pub scheme_type: SecuritySchemeType,
}

pub enum SecuritySchemeType {
    ApiKey { location: String, name: String },
    Http { scheme: String },
    OAuth2 { flows: OAuth2Flows },
    OpenIdConnect { url: String },
}
```

### 4. Language Generators

**Purpose**: Transform IR into language-specific code

Each language generator implements a common interface:

```rust
pub trait LanguageGenerator {
    /// Generate complete SDK from IR
    fn generate(&self, sdk: &SDK, config: &GeneratorConfig) -> Result<GeneratedCode>;

    /// Generate type definitions
    fn generate_types(&self, types: &[TypeDefinition]) -> Result<String>;

    /// Generate HTTP client
    fn generate_client(&self, endpoints: &[Endpoint]) -> Result<String>;

    /// Generate endpoint methods
    fn generate_endpoints(&self, endpoints: &[Endpoint]) -> Result<String>;

    /// Generate validation logic
    fn generate_validation(&self, types: &[TypeDefinition]) -> Result<String>;

    /// Generate tests
    fn generate_tests(&self, endpoints: &[Endpoint]) -> Result<String>;

    /// Get language-specific configuration
    fn language_config(&self) -> LanguageConfig;
}

pub struct GeneratorConfig {
    pub output_dir: PathBuf,
    pub package_name: String,
    pub package_version: String,
    pub async_style: AsyncStyle,
    pub error_style: ErrorStyle,
    pub include_tests: bool,
    pub include_examples: bool,
}

pub struct GeneratedCode {
    pub files: Vec<GeneratedFile>,
    pub package_metadata: PackageMetadata,
}

pub struct GeneratedFile {
    pub path: PathBuf,
    pub content: String,
    pub language: Language,
}
```

### 5. Template Engine

**Purpose**: Render code using templates with language-specific helpers

**Template Structure**:

```
templates/
├── rust/
│   ├── lib.rs.hbs
│   ├── types/
│   │   ├── struct.rs.hbs
│   │   ├── enum.rs.hbs
│   │   └── mod.rs.hbs
│   ├── client.rs.hbs
│   ├── error.rs.hbs
│   ├── Cargo.toml.hbs
│   └── README.md.hbs
├── typescript/
│   ├── index.ts.hbs
│   ├── types/
│   │   ├── interface.ts.hbs
│   │   ├── type.ts.hbs
│   │   └── index.ts.hbs
│   ├── client.ts.hbs
│   ├── errors.ts.hbs
│   ├── package.json.hbs
│   └── README.md.hbs
├── python/
│   ├── __init__.py.hbs
│   ├── types/
│   │   ├── dataclass.py.hbs
│   │   ├── __init__.py.hbs
│   │   └── validators.py.hbs
│   ├── client.py.hbs
│   ├── errors.py.hbs
│   ├── pyproject.toml.hbs
│   └── README.md.hbs
└── ... (other languages)
```

**Template Helpers**:

```rust
// Language-specific helpers for templates

pub trait TemplateHelpers {
    /// Convert name to language-specific case
    fn to_language_case(&self, name: &str, case_type: CaseType) -> String;

    /// Convert OpenAPI type to language type
    fn map_type(&self, type_ref: &TypeReference) -> String;

    /// Generate imports/requires/uses
    fn generate_imports(&self, types: &[TypeReference]) -> String;

    /// Generate documentation comment
    fn generate_doc_comment(&self, description: &str, params: &[Parameter]) -> String;

    /// Generate validation code
    fn generate_validation(&self, rules: &ValidationRules) -> String;

    /// Check if type is nullable in the language
    fn is_nullable(&self, type_ref: &TypeReference) -> bool;
}

pub enum CaseType {
    Snake,      // snake_case
    Camel,      // camelCase
    Pascal,     // PascalCase
    Kebab,      // kebab-case
    Screaming,  // SCREAMING_SNAKE_CASE
}
```

## Data Flow

### 1. Input Phase

```
OpenAPI Spec (YAML/JSON)
    ↓
Parse & Validate
    ↓
Resolve $refs
    ↓
Validated OpenAPI Object
```

### 2. Analysis Phase

```
Validated OpenAPI
    ↓
Extract Types
    ↓
Build Dependency Graph
    ↓
Analyze Relationships
    ↓
Infer Missing Info
    ↓
Enhanced Schema
```

### 3. IR Generation Phase

```
Enhanced Schema
    ↓
Transform to IR
    ↓
Language-Agnostic IR
    ↓
Optimize & Validate IR
```

### 4. Code Generation Phase

```
IR + Generator Config
    ↓
Select Language Generator
    ↓
Apply Templates
    ↓
Generate Code
    ↓
Format Code
    ↓
Validate Generated Code
    ↓
Generated SDK Files
```

### 5. Output Phase

```
Generated Files
    ↓
Write to Filesystem
    ↓
Run Post-Processing
    ↓
Generate Package Metadata
    ↓
Create Distribution Package
```

## Type System Mapping Strategy

### Mapping Table

| OpenAPI Type | Rust | TypeScript | Python | Go | Java | C# |
|--------------|------|------------|--------|----|----- |----|
| string | String | string | str | string | String | string |
| integer | i64 | number | int | int64 | Long | long |
| number | f64 | number | float | float64 | Double | double |
| boolean | bool | boolean | bool | bool | Boolean | bool |
| array | Vec\<T\> | T[] | List[T] | []T | List\<T\> | List\<T\> |
| object | struct | interface | @dataclass | struct | class | class |
| null | Option\<T\> | null | None | *T | null | null |
| oneOf/anyOf | enum | union | Union | interface | sealed | abstract |

### Nullability Handling

**Rust**:
```rust
// Required
pub struct User {
    pub email: String,
}

// Optional
pub struct User {
    pub email: Option<String>,
}
```

**TypeScript**:
```typescript
// Required
interface User {
  email: string;
}

// Optional
interface User {
  email?: string;
}

// Nullable
interface User {
  email: string | null;
}
```

**Python**:
```python
# Required
@dataclass
class User:
    email: str

# Optional
@dataclass
class User:
    email: Optional[str] = None
```

**Go**:
```go
// Required
type User struct {
    Email string `json:"email"`
}

// Optional (pointer)
type User struct {
    Email *string `json:"email,omitempty"`
}
```

## Async/Concurrency Strategy

### Per-Language Patterns

**Rust** (tokio-based):
```rust
pub async fn get_user(&self, id: &str) -> Result<User> {
    let response = self.http_client.get(url).send().await?;
    let user = response.json::<User>().await?;
    Ok(user)
}
```

**TypeScript** (Promise-based):
```typescript
async getUser(id: string): Promise<User> {
    const response = await fetch(url);
    const user = await response.json();
    return user;
}
```

**Python** (asyncio):
```python
async def get_user(self, user_id: str) -> User:
    async with self.session.get(url) as response:
        data = await response.json()
        return User(**data)
```

**Go** (goroutines + context):
```go
func (c *Client) GetUser(ctx context.Context, id string) (*User, error) {
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := c.httpClient.Do(req)
    // ...
    return &user, nil
}
```

## Error Handling Strategy

### Error Type Hierarchy

```
APIError (base)
├── NetworkError (connection, timeout)
├── ValidationError (client-side validation)
├── AuthenticationError (401, 403)
├── NotFoundError (404)
├── RateLimitError (429)
└── ServerError (500+)
```

### Language-Specific Implementation

**Rust** (Result type):
```rust
pub enum Error {
    Network(String),
    Api { status: u16, message: String },
    Validation(String),
}

pub type Result<T> = std::result::Result<T, Error>;
```

**TypeScript** (Exception classes):
```typescript
class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}
```

**Go** (error interface):
```go
type APIError struct {
    StatusCode int
    Message    string
}

func (e *APIError) Error() string {
    return fmt.Sprintf("API error %d: %s", e.StatusCode, e.Message)
}
```

## Configuration & Customization

### Generator Configuration

```yaml
# llm-forge.yaml
version: 1.0
input: openapi.yaml

languages:
  - rust:
      async_runtime: tokio
      features:
        - validation
        - builder_pattern
      dependencies:
        reqwest: "0.11"
        serde: "1.0"

  - typescript:
      target: es2020
      module: esnext
      features:
        - validation
        - abort_signal
      dev_dependencies:
        "@types/node": "^20.0.0"

  - python:
      target_version: "3.8"
      async_style: asyncio
      features:
        - validation
        - sync_wrapper
      dependencies:
        aiohttp: "^3.9.0"

output:
  base_dir: ./generated
  package_name: my-api-client
  version: 1.0.0

features:
  generate_tests: true
  generate_examples: true
  generate_docs: true
  validation: client-side
```

## Plugin Architecture

Future extensibility through plugins:

```rust
pub trait Plugin {
    fn name(&self) -> &str;
    fn transform_ir(&self, ir: &mut SDK) -> Result<()>;
    fn post_generate(&self, code: &mut GeneratedCode) -> Result<()>;
}

// Example: Add retry logic plugin
pub struct RetryPlugin {
    max_retries: usize,
}

impl Plugin for RetryPlugin {
    fn transform_ir(&self, ir: &mut SDK) -> Result<()> {
        // Add retry metadata to endpoints
        Ok(())
    }

    fn post_generate(&self, code: &mut GeneratedCode) -> Result<()> {
        // Inject retry logic into generated code
        Ok(())
    }
}
```

## Testing Strategy

### Generated Code Testing

1. **Unit Tests**: Test individual components
   - Type serialization/deserialization
   - Validation logic
   - Error handling

2. **Integration Tests**: Test against mock API
   - HTTP requests
   - Authentication
   - Error responses

3. **Snapshot Tests**: Compare generated code
   - Ensure consistent output
   - Detect unintended changes

### Test Generation

```rust
pub fn generate_tests(endpoint: &Endpoint) -> String {
    // Generate test for successful request
    let success_test = generate_success_test(endpoint);

    // Generate test for error handling
    let error_test = generate_error_test(endpoint);

    // Generate test for validation
    let validation_test = generate_validation_test(endpoint);

    format!("{}\n\n{}\n\n{}", success_test, error_test, validation_test)
}
```

## Performance Considerations

1. **Parallel Generation**: Generate files for different languages in parallel
2. **Incremental Generation**: Only regenerate changed files
3. **Caching**: Cache parsed OpenAPI specs and IR
4. **Lazy Evaluation**: Generate code on-demand for large specs

## Security Considerations

1. **API Key Handling**: Never log or expose API keys
2. **Validation**: Client-side validation to prevent bad requests
3. **HTTPS Only**: Enforce HTTPS for API calls (configurable)
4. **Dependency Management**: Pin dependencies, security scanning

## Future Enhancements

1. **GraphQL Support**: Generate clients from GraphQL schemas
2. **gRPC Support**: Generate clients from Protocol Buffer definitions
3. **Streaming Support**: Better support for SSE/WebSocket
4. **Custom Templates**: Allow users to provide custom templates
5. **Plugin Marketplace**: Community-contributed plugins
6. **Interactive CLI**: Wizard-style configuration
7. **CI/CD Integration**: GitHub Actions, GitLab CI plugins
8. **Version Management**: Handle API versioning strategies

---

This architecture provides a solid foundation for generating high-quality, idiomatic SDKs across multiple programming languages while maintaining flexibility for future enhancements.
