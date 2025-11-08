# LLM-Forge Documentation

Welcome to the LLM-Forge documentation. This directory contains comprehensive design specifications for the multi-language SDK generator.

## Documentation Overview

### 1. [Language Strategy](./language-strategy.md)

Comprehensive design patterns for all supported languages:

- **Type System Mapping**: How OpenAPI/JSON Schema types map to language-specific types
- **Async Patterns**: Language-specific async/await, promises, and concurrency patterns
- **Error Handling**: Exception vs Result types, error hierarchies
- **Package Structure**: Recommended directory layouts and module organization
- **Idioms and Conventions**: Builder patterns, naming conventions, documentation styles

**Supported Languages**:
- Rust
- TypeScript
- Python
- JavaScript
- C#
- Go
- Java

### 2. [Template Examples](./template-examples.md)

Concrete code examples showing what generated SDKs look like:

- **Reference OpenAPI Spec**: A sample User API specification
- **Generated Code Examples**: Complete, production-ready code for each language
- **Type Definitions**: How types are generated from schemas
- **Client Implementation**: HTTP client with authentication, error handling
- **Method Generation**: Endpoint methods with validation and documentation
- **Code Generation Patterns**: Common patterns across all languages

### 3. [Code Style Guidelines](./code-style-guidelines.md)

Language-specific code style and formatting rules:

- **Naming Conventions**: PascalCase, camelCase, snake_case rules per language
- **Code Formatting**: Indentation, line length, brace styles
- **Import Organization**: How imports/uses/requires are organized
- **Documentation Standards**: Doc comments format (JSDoc, GoDoc, rustdoc, etc.)
- **Formatter Configuration**: Settings for rustfmt, prettier, black, gofmt, etc.
- **Linter Configuration**: ESLint, clippy, ruff, golangci-lint settings

### 4. [Architecture Overview](./architecture-overview.md)

System architecture and implementation details:

- **System Architecture**: High-level component diagram
- **Core Components**: Parser, Analyzer, IR Generator, Language Generators
- **Data Flow**: From OpenAPI spec to generated code
- **IR Structure**: Intermediate representation format
- **Type Mapping Strategy**: Cross-language type mapping tables
- **Error Handling Strategy**: Error type hierarchies
- **Configuration**: Generator configuration format
- **Plugin Architecture**: Extensibility through plugins
- **Testing Strategy**: How to test generated code
- **Performance Considerations**: Optimization strategies

## Quick Reference

### Type Mapping Summary

| OpenAPI Type | Rust | TypeScript | Python | Go | Java | C# |
|--------------|------|------------|--------|----|----- |----|
| string | String | string | str | string | String | string |
| integer | i64 | number | int | int64 | Long | long |
| number | f64 | number | float | float64 | Double | double |
| boolean | bool | boolean | bool | bool | Boolean | bool |
| array | Vec\<T\> | T[] | List[T] | []T | List\<T\> | List\<T\> |
| object | struct | interface | @dataclass | struct | class | class |

### Async Pattern Summary

- **Rust**: `async/await` with tokio runtime
- **TypeScript/JavaScript**: `Promise` and `async/await`
- **Python**: `asyncio` with `async/await` + optional sync wrappers
- **C#**: `Task`-based async with `async/await`
- **Go**: Goroutines with channels and `context.Context`
- **Java**: `CompletableFuture` or reactive streams

### Error Handling Summary

- **Rust**: `Result<T, E>` (no exceptions)
- **TypeScript**: Exceptions + optional Result types
- **Python**: Exceptions (Pythonic way)
- **JavaScript**: Exceptions
- **C#**: Exceptions + optional Result types
- **Go**: Multiple return values `(value, error)`
- **Java**: Checked exceptions + modern sealed Result types

## Usage Examples

### Basic Client Usage

**Rust**:
```rust
let client = Client::new("https://api.example.com")
    .with_api_key("sk-...");

let user = client.get_user("user_123").await?;
println!("User: {}", user.name);
```

**TypeScript**:
```typescript
const client = new Client({
  baseUrl: 'https://api.example.com',
  apiKey: 'sk-...',
});

const user = await client.getUser('user_123');
console.log(`User: ${user.name}`);
```

**Python**:
```python
async with Client("https://api.example.com", api_key="sk-...") as client:
    user = await client.get_user("user_123")
    print(f"User: {user.name}")
```

**Go**:
```go
client := NewClient(
    "https://api.example.com",
    WithAPIKey("sk-..."),
)

user, err := client.GetUser(ctx, "user_123")
if err != nil {
    return err
}
fmt.Println("User:", user.Name)
```

## Design Principles

1. **Type Safety First**: Leverage each language's type system to catch errors at compile time
2. **Idiomatic Code**: Follow language-specific conventions and best practices
3. **Async by Default**: Modern async patterns are the primary interface
4. **Error Transparency**: Make errors explicit and easy to handle
5. **Zero-Runtime Dependencies** (where possible): Minimize external dependencies
6. **Documentation Rich**: Generate comprehensive inline documentation

## File Organization

```
docs/
├── README.md                    # This file
├── language-strategy.md         # Multi-language design patterns
├── template-examples.md         # Example generated code
├── code-style-guidelines.md     # Code formatting and style rules
└── architecture-overview.md     # System architecture and design
```

## Contributing

When adding support for new languages:

1. Add language-specific section to `language-strategy.md`
2. Add example generated code to `template-examples.md`
3. Add code style rules to `code-style-guidelines.md`
4. Update type mapping tables in `architecture-overview.md`

## Next Steps

### For Implementation

1. **Phase 1**: Implement OpenAPI parser and IR generator
2. **Phase 2**: Implement Rust and TypeScript generators (reference implementations)
3. **Phase 3**: Implement remaining language generators
4. **Phase 4**: Add testing framework and CI/CD integration
5. **Phase 5**: Add plugin architecture and customization options

### For Users

1. Review language-specific patterns for your target language
2. Check generated code examples to understand output
3. Customize code style guidelines for your organization
4. Configure generator options in `llm-forge.yaml`

## Support Matrix

| Language | Status | Async Support | Validation | Tests | Examples |
|----------|--------|---------------|------------|-------|----------|
| Rust | Planned | ✅ | ✅ | ✅ | ✅ |
| TypeScript | Planned | ✅ | ✅ | ✅ | ✅ |
| Python | Planned | ✅ | ✅ | ✅ | ✅ |
| JavaScript | Planned | ✅ | ✅ | ✅ | ✅ |
| Go | Planned | ✅ | ✅ | ✅ | ✅ |
| Java | Planned | ✅ | ✅ | ✅ | ✅ |
| C# | Planned | ✅ | ✅ | ✅ | ✅ |

## Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [JSON Schema](https://json-schema.org/)
- Language Documentation:
  - [Rust Book](https://doc.rust-lang.org/book/)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  - [Python Docs](https://docs.python.org/3/)
  - [Go Documentation](https://go.dev/doc/)
  - [Java Documentation](https://docs.oracle.com/en/java/)
  - [C# Documentation](https://docs.microsoft.com/en-us/dotnet/csharp/)

## License

See [LICENSE](../LICENSE) file in the repository root.
