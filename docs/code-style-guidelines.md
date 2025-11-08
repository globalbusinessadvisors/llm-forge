# Code Style Guidelines for Generated SDKs

This document defines the code style, naming conventions, and formatting rules for generated code across all supported languages.

## General Principles

1. **Consistency**: Code style should be consistent within a language
2. **Readability**: Prioritize code clarity over cleverness
3. **Tooling Integration**: Follow language ecosystem standards (formatters, linters)
4. **Documentation**: Every public API should be documented
5. **Error Messages**: Clear, actionable error messages
6. **Examples**: Include usage examples in documentation

---

## Rust

### Naming Conventions

```rust
// Modules: snake_case
mod user_api;
mod http_client;

// Types: PascalCase
struct User { }
enum Event { }
trait Serializable { }

// Functions/methods: snake_case
fn get_user() { }
fn create_user_request() { }

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_TIMEOUT: u64 = 30;
const MAX_RETRIES: usize = 3;

// Lifetimes: short, lowercase
fn parse<'a>(input: &'a str) -> &'a str { }

// Type parameters: Single uppercase or PascalCase
struct Container<T> { }
struct Result<T, E> { }
```

### Code Style

```rust
// Use rustfmt defaults
// - 100 character line limit
// - 4 space indentation
// - Trailing commas in multi-line

// Import organization
use std::collections::HashMap;  // std library
use std::io;

use serde::{Deserialize, Serialize};  // External crates
use tokio::time::Duration;

use crate::client::Client;  // Internal modules
use crate::types::User;

// Struct formatting
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

// Builder methods (consume self)
impl UserBuilder {
    pub fn name(mut self, name: String) -> Self {
        self.name = Some(name);
        self
    }

    pub fn build(self) -> Result<User, Error> {
        // Implementation
    }
}

// Error handling
pub type Result<T> = std::result::Result<T, Error>;

// Prefer ? operator over match/unwrap
pub async fn get_user(&self, id: &str) -> Result<User> {
    let response = self.request("GET", &format!("/users/{}", id)).await?;
    let user = response.json::<User>().await?;
    Ok(user)
}

// Documentation comments
/// Get a user by ID
///
/// # Arguments
///
/// * `id` - The user's unique identifier
///
/// # Returns
///
/// Returns the user if found
///
/// # Errors
///
/// * `Error::NotFound` - If user doesn't exist
/// * `Error::Network` - If request fails
///
/// # Example
///
/// ```rust
/// let user = client.get_user("123").await?;
/// ```
pub async fn get_user(&self, id: &str) -> Result<User> {
    // Implementation
}
```

### Formatting

Use `rustfmt` with default settings:

```toml
# rustfmt.toml
max_width = 100
tab_spaces = 4
edition = "2021"
```

### Linting

Use `clippy` with standard warnings:

```toml
# Cargo.toml
[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
enum_glob_use = "deny"
pedantic = "warn"
```

---

## TypeScript

### Naming Conventions

```typescript
// Files: kebab-case
// user-client.ts
// api-error.ts

// Interfaces/Types: PascalCase
interface User { }
type ApiResponse<T> = { }
enum EventType { }

// Functions/variables: camelCase
function getUser() { }
const apiClient = new Client();

// Constants: SCREAMING_SNAKE_CASE or camelCase for objects
const DEFAULT_TIMEOUT = 30000;
const config = {
  timeout: 30000,
  retries: 3,
};

// Private fields: prefix with #
class Client {
  #apiKey: string;
  #baseUrl: string;
}

// Generic type parameters: Single uppercase or PascalCase
interface Container<T> { }
type Result<T, E> = { }
```

### Code Style

```typescript
// Use prettier defaults
// - 2 space indentation
// - Single quotes
// - Trailing commas
// - 80-100 character line limit

// Import organization
import { User, UserCreate } from './types';  // Relative imports
import { Client } from './client';

import { format } from 'date-fns';  // External packages

// Interface formatting
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
}

// Type union formatting
export type Event =
  | { type: 'user.created'; userId: string }
  | { type: 'user.deleted'; userId: string };

// Function declarations
export async function getUser(id: string): Promise<User> {
  // Implementation
}

// Arrow functions for short callbacks
const userNames = users.map((user) => user.name);

// Error handling
try {
  const user = await client.getUser(id);
  return user;
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API error: ${error.message}`);
  }
  throw error;
}

// Documentation (TSDoc)
/**
 * Get a user by ID
 *
 * @param id - The user's unique identifier
 * @returns A promise that resolves to the user
 * @throws {ApiError} When the API returns an error
 *
 * @example
 * ```typescript
 * const user = await client.getUser('user_123');
 * console.log(user.name);
 * ```
 */
export async function getUser(id: string): Promise<User> {
  // Implementation
}

// Object literals: trailing commas
const config = {
  baseUrl: 'https://api.example.com',
  apiKey: 'sk-...',
  timeout: 30000,
};

// Array formatting
const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];
```

### Formatting

Use `prettier` with these settings:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

### Linting

Use `eslint` with TypeScript rules:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

---

## Python

### Naming Conventions

```python
# Modules: snake_case
# user_client.py
# api_error.py

# Classes: PascalCase
class User:
    pass

class ApiError(Exception):
    pass

# Functions/variables: snake_case
def get_user():
    pass

user_id = "123"

# Constants: SCREAMING_SNAKE_CASE
DEFAULT_TIMEOUT = 30.0
MAX_RETRIES = 3

# Private/internal: prefix with underscore
class Client:
    def __init__(self):
        self._api_key = None
        self._base_url = None

    def _make_request(self):
        pass  # Internal method

# Type variables: PascalCase with _co/_contra suffix for variance
from typing import TypeVar

T = TypeVar('T')
T_co = TypeVar('T_co', covariant=True)
```

### Code Style

```python
# Follow PEP 8
# - 4 space indentation
# - 79-100 character line limit for code
# - 72 character limit for docstrings

# Import organization
import os  # Standard library
import sys
from datetime import datetime
from typing import Optional, List

import aiohttp  # Third-party packages
from pydantic import BaseModel

from .client import Client  # Local imports
from .types import User

# Class formatting
class User:
    """User model"""

    def __init__(
        self,
        id: str,
        name: str,
        email: str,
        bio: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.email = email
        self.bio = bio

# Dataclasses (preferred for data structures)
from dataclasses import dataclass

@dataclass
class User:
    """User model"""
    id: str
    name: str
    email: str
    bio: Optional[str] = None

# Function formatting
async def get_user(
    user_id: str,
    *,  # Force keyword arguments after this
    timeout: float = 30.0
) -> User:
    """Get a user by ID.

    Args:
        user_id: The user's unique identifier
        timeout: Request timeout in seconds

    Returns:
        The user object

    Raises:
        ApiError: If the API returns an error
        NetworkError: If the request fails

    Example:
        >>> user = await client.get_user("user_123")
        >>> print(user.name)
    """
    # Implementation
    pass

# List/dict comprehensions
user_names = [user.name for user in users]
user_map = {user.id: user for user in users}

# Error handling
try:
    user = await client.get_user(user_id)
except ApiError as e:
    logger.error(f"API error: {e.message}")
    raise
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise

# Context managers
async with Client("https://api.example.com") as client:
    user = await client.get_user("123")

# Type hints
from typing import Optional, List, Dict, Any

def process_users(
    users: List[User],
    metadata: Optional[Dict[str, Any]] = None
) -> List[str]:
    """Process a list of users"""
    # Implementation
    pass
```

### Formatting

Use `black` with these settings:

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py38', 'py39', 'py310', 'py311']
```

### Linting

Use `ruff` or `flake8` with type checking:

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
]

[tool.mypy]
python_version = "3.8"
strict = true
warn_return_any = true
warn_unused_configs = true
```

---

## JavaScript

### Naming Conventions

Similar to TypeScript, but without types:

```javascript
// Files: kebab-case
// user-client.js
// api-error.js

// Classes: PascalCase
class User { }
class ApiError extends Error { }

// Functions/variables: camelCase
function getUser() { }
const apiClient = new Client();

// Constants: SCREAMING_SNAKE_CASE or camelCase
const DEFAULT_TIMEOUT = 30000;

// Private fields: prefix with #
class Client {
  #apiKey;
  #baseUrl;
}
```

### Code Style

```javascript
// Use prettier defaults (same as TypeScript)
// JSDoc for documentation

/**
 * Get a user by ID
 *
 * @param {string} id - The user's unique identifier
 * @returns {Promise<Object>} The user object
 * @throws {ApiError} When the API returns an error
 *
 * @example
 * const user = await client.getUser('user_123');
 * console.log(user.name);
 */
async function getUser(id) {
  // Implementation
}

// Modern ES6+ features
const users = await client.listUsers();
const userNames = users.map(user => user.name);

// Destructuring
const { id, name, email } = user;

// Spread operator
const updatedUser = { ...user, name: 'New Name' };

// Optional chaining
const bio = user?.bio ?? 'No bio';

// Error handling
try {
  const user = await client.getUser(id);
  return user;
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API error: ${error.message}`);
  }
  throw error;
}
```

### Formatting

Use `prettier` (same config as TypeScript).

### Linting

Use `eslint`:

```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "es2021": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

---

## C#

### Naming Conventions

```csharp
// Files: PascalCase matching type name
// User.cs
// ApiClient.cs

// Namespaces: PascalCase with dots
namespace MyApi.Client.Types

// Classes/Interfaces/Structs: PascalCase
public class User { }
public interface ISerializer { }
public struct Point { }

// Methods/Properties: PascalCase
public string GetUser() { }
public string Name { get; set; }

// Local variables/parameters: camelCase
string userId = "123";
public void ProcessUser(string userId) { }

// Private fields: _camelCase
private string _apiKey;
private HttpClient _httpClient;

// Constants: PascalCase
public const int DefaultTimeout = 30;
private const string ApiVersion = "v1";

// Generic type parameters: T prefix
public class Container<T> { }
public interface IRepository<TEntity, TKey> { }
```

### Code Style

```csharp
// Follow Microsoft C# Coding Conventions
// - 4 space indentation
// - Allman brace style (braces on new line)

// Using directives organization
using System;  // System namespaces first
using System.Collections.Generic;
using System.Threading.Tasks;

using Newtonsoft.Json;  // External packages

using MyApi.Client.Types;  // Local namespaces

// Namespace and class formatting
namespace MyApi.Client
{
    /// <summary>
    /// HTTP client for the User API
    /// </summary>
    public class Client : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        /// <summary>
        /// Initializes a new instance of the Client class
        /// </summary>
        /// <param name="baseUrl">The base URL for the API</param>
        public Client(string baseUrl)
        {
            _baseUrl = baseUrl;
            _httpClient = new HttpClient();
        }

        /// <summary>
        /// Get a user by ID
        /// </summary>
        /// <param name="id">The user's unique identifier</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The user object</returns>
        /// <exception cref="ApiException">Thrown when the API returns an error</exception>
        public async Task<User> GetUserAsync(
            string id,
            CancellationToken cancellationToken = default)
        {
            var url = $"{_baseUrl}/users/{id}";
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsAsync<User>(cancellationToken);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}

// Property formatting
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }

    // Expression-bodied property
    public string FullName => $"{FirstName} {LastName}";
}

// Null checking
if (user is null)
{
    throw new ArgumentNullException(nameof(user));
}

// Pattern matching
if (result is User user)
{
    Console.WriteLine(user.Name);
}

// String interpolation
var message = $"User {user.Id} has name {user.Name}";

// LINQ
var activeUsers = users
    .Where(u => u.IsActive)
    .OrderBy(u => u.Name)
    .ToList();
```

### Formatting

Use `.editorconfig`:

```ini
[*.cs]
indent_style = space
indent_size = 4
end_of_line = crlf

# Brace style
csharp_new_line_before_open_brace = all
csharp_new_line_before_else = true
csharp_new_line_before_catch = true
csharp_new_line_before_finally = true

# Naming conventions
dotnet_naming_rule.private_fields_with_underscore.severity = warning
dotnet_naming_rule.private_fields_with_underscore.symbols = private_fields
dotnet_naming_rule.private_fields_with_underscore.style = underscore_style

dotnet_naming_symbols.private_fields.applicable_kinds = field
dotnet_naming_symbols.private_fields.applicable_accessibilities = private

dotnet_naming_style.underscore_style.capitalization = camel_case
dotnet_naming_style.underscore_style.required_prefix = _
```

### Documentation

Use XML documentation comments:

```csharp
/// <summary>
/// Get a user by ID
/// </summary>
/// <param name="id">The user's unique identifier</param>
/// <returns>A task representing the user</returns>
/// <exception cref="ApiException">Thrown when the API returns an error</exception>
/// <example>
/// <code>
/// var user = await client.GetUserAsync("user_123");
/// Console.WriteLine(user.Name);
/// </code>
/// </example>
public async Task<User> GetUserAsync(string id)
{
    // Implementation
}
```

---

## Go

### Naming Conventions

```go
// Files: snake_case
// user_client.go
// api_error.go

// Packages: lowercase, single word
package userclient

// Exported types/functions: PascalCase
type User struct { }
func GetUser() { }

// Unexported types/functions: camelCase
type internalConfig struct { }
func makeRequest() { }

// Constants: PascalCase or camelCase (exported vs unexported)
const DefaultTimeout = 30
const maxRetries = 3

// Interfaces: -er suffix for single method
type Reader interface {
    Read(p []byte) (n int, err error)
}

type UserGetter interface {
    GetUser(id string) (*User, error)
}

// Acronyms: Keep as all caps or all lowercase
type HTTPClient struct { }  // Exported
type httpConfig struct { }  // Unexported
var urlPath string
var APIKey string
```

### Code Style

```go
// Follow Go standard formatting
// - Tabs for indentation
// - gofmt formatting

// Import organization
import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/external/package"

    "github.com/myorg/myapi/types"
)

// Struct formatting
type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// Constructor pattern
func NewClient(baseURL string, options ...ClientOption) *Client {
    client := &Client{
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        baseURL: baseURL,
    }

    for _, opt := range options {
        opt(client)
    }

    return client
}

// Functional options
type ClientOption func(*Client)

func WithAPIKey(key string) ClientOption {
    return func(c *Client) {
        c.apiKey = key
    }
}

// Error handling
func (c *Client) GetUser(ctx context.Context, id string) (*User, error) {
    url := fmt.Sprintf("%s/users/%s", c.baseURL, id)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("execute request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    "request failed",
        }
    }

    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return &user, nil
}

// Early returns
func processUser(user *User) error {
    if user == nil {
        return errors.New("user is nil")
    }

    if user.ID == "" {
        return errors.New("user ID is empty")
    }

    // Process user
    return nil
}

// Table-driven tests
func TestGetUser(t *testing.T) {
    tests := []struct {
        name    string
        userID  string
        want    *User
        wantErr bool
    }{
        {
            name:   "valid user",
            userID: "123",
            want:   &User{ID: "123", Name: "John"},
        },
        {
            name:    "invalid user",
            userID:  "invalid",
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := client.GetUser(context.Background(), tt.userID)
            if (err != nil) != tt.wantErr {
                t.Errorf("GetUser() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("GetUser() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

### Formatting

Use `gofmt` (automatic with Go tools):

```bash
gofmt -w .
```

Or use `goimports` for import management:

```bash
goimports -w .
```

### Linting

Use `golangci-lint`:

```yaml
# .golangci.yml
linters:
  enable:
    - gofmt
    - goimports
    - govet
    - errcheck
    - staticcheck
    - unused
    - gosimple
    - structcheck
    - varcheck
    - ineffassign
    - deadcode

linters-settings:
  errcheck:
    check-blank: true
```

### Documentation

Use GoDoc comments:

```go
// GetUser retrieves a user by ID.
//
// The context can be used to cancel the request or set a deadline.
//
// Returns the user if found, or an error if the request fails.
//
// Example:
//
//  user, err := client.GetUser(ctx, "user_123")
//  if err != nil {
//      return err
//  }
//  fmt.Println(user.Name)
func (c *Client) GetUser(ctx context.Context, id string) (*User, error) {
    // Implementation
}
```

---

## Java

### Naming Conventions

```java
// Files: PascalCase matching public class
// User.java
// ApiClient.java

// Packages: lowercase with dots
package com.example.api.client;

// Classes/Interfaces/Enums: PascalCase
public class User { }
public interface Serializable { }
public enum EventType { }

// Methods/variables: camelCase
public String getUser() { }
String userId = "123";

// Constants: SCREAMING_SNAKE_CASE
public static final int DEFAULT_TIMEOUT = 30;
private static final String API_VERSION = "v1";

// Generic type parameters: Single uppercase
public class Container<T> { }
public interface Repository<T, ID> { }
```

### Code Style

```java
// Follow Google Java Style Guide
// - 2 space indentation
// - K&R brace style (opening brace on same line)

// Import organization
import java.util.List;  // java.* packages
import java.util.Map;

import javax.annotation.Nullable;  // javax.* packages

import com.fasterxml.jackson.databind.ObjectMapper;  // External packages

import com.example.api.client.types.User;  // Local packages

// Class formatting
package com.example.api.client;

/**
 * HTTP client for the User API
 *
 * <p>This class provides methods to interact with the User API.
 *
 * @author Generated by LLM-Forge
 * @version 1.0.0
 */
public class Client {
  private final HttpClient httpClient;
  private final String baseUrl;
  private final String apiKey;

  /**
   * Creates a new API client
   *
   * @param baseUrl the base URL for the API
   * @param apiKey the API key for authentication
   */
  public Client(String baseUrl, String apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();
  }

  /**
   * Get a user by ID
   *
   * @param id the user's unique identifier
   * @return a CompletableFuture that completes with the user
   * @throws ApiException if the API returns an error
   */
  public CompletableFuture<User> getUserAsync(String id) {
    String url = String.format("%s/users/%s", baseUrl, id);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Authorization", "Bearer " + apiKey)
        .GET()
        .build();

    return httpClient
        .sendAsync(request, HttpResponse.BodyHandlers.ofString())
        .thenApply(this::parseUserResponse);
  }

  private User parseUserResponse(HttpResponse<String> response) {
    if (response.statusCode() != 200) {
      throw new ApiException(
          response.statusCode(),
          "Request failed"
      );
    }

    try {
      return objectMapper.readValue(response.body(), User.class);
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse response", e);
    }
  }
}

// Builder pattern
public class Client {
  private final String baseUrl;
  private final String apiKey;

  private Client(Builder builder) {
    this.baseUrl = builder.baseUrl;
    this.apiKey = builder.apiKey;
  }

  public static class Builder {
    private final String baseUrl;
    private String apiKey;

    public Builder(String baseUrl) {
      this.baseUrl = baseUrl;
    }

    public Builder apiKey(String apiKey) {
      this.apiKey = apiKey;
      return this;
    }

    public Client build() {
      return new Client(this);
    }
  }
}

// Method chaining
Client client = new Client.Builder("https://api.example.com")
    .apiKey("sk-...")
    .build();

// Try-with-resources
try (var client = new Client("https://api.example.com", "sk-...")) {
  User user = client.getUser("user_123");
  System.out.println(user.getName());
}
```

### Formatting

Use `google-java-format`:

```xml
<!-- Maven plugin -->
<plugin>
  <groupId>com.coveo</groupId>
  <artifactId>fmt-maven-plugin</artifactId>
  <version>2.13</version>
  <executions>
    <execution>
      <goals>
        <goal>format</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### Linting

Use `Checkstyle`:

```xml
<!-- checkstyle.xml -->
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
  <module name="TreeWalker">
    <module name="JavadocMethod"/>
    <module name="JavadocType"/>
    <module name="ConstantName"/>
    <module name="LocalFinalVariableName"/>
    <module name="LocalVariableName"/>
    <module name="MemberName"/>
    <module name="MethodName"/>
    <module name="PackageName"/>
    <module name="ParameterName"/>
    <module name="TypeName"/>
  </module>
</module>
```

### Documentation

Use JavaDoc:

```java
/**
 * Get a user by ID.
 *
 * <p>This method retrieves a user from the API asynchronously.
 *
 * @param id the user's unique identifier
 * @return a CompletableFuture that will complete with the user
 * @throws ApiException if the API returns an error
 * @throws IllegalArgumentException if id is null or empty
 *
 * @example
 * <pre>{@code
 * client.getUserAsync("user_123")
 *     .thenAccept(user -> System.out.println(user.getName()))
 *     .join();
 * }</pre>
 */
public CompletableFuture<User> getUserAsync(String id) {
  // Implementation
}
```

---

## Summary

### Code Style Enforcement

For all languages, generated code should:

1. **Pass language-standard formatters** without modification
2. **Pass language-standard linters** with minimal warnings
3. **Include comprehensive documentation** for all public APIs
4. **Follow ecosystem conventions** for package structure
5. **Include usage examples** in documentation

### Testing Guidelines

Generated code should include:

```
- Unit tests for validation logic
- Integration test examples
- Mock/stub examples for testing client code
- Error handling test cases
```

### Version Control

Include appropriate ignore files:

```
.gitignore for each language
.editorconfig for consistent formatting across editors
```

These guidelines ensure that generated code is immediately usable, maintainable, and feels like hand-written idiomatic code in each language.
