# Multi-Language Code Generation Strategy

## Overview

LLM-Forge generates type-safe, idiomatic client libraries for multiple programming languages from OpenAPI/JSON Schema specifications. This document defines the design patterns, conventions, and implementation strategies for each supported language.

## Core Design Principles

1. **Type Safety First**: Leverage each language's type system to catch errors at compile time
2. **Idiomatic Code**: Follow language-specific conventions and best practices
3. **Async by Default**: Modern async patterns are the primary interface
4. **Error Transparency**: Make errors explicit and easy to handle
5. **Zero-Runtime Dependencies** (where possible): Minimize external dependencies
6. **Documentation Rich**: Generate comprehensive inline documentation

---

## 1. Rust

### Type System Mapping

#### Primitive Types
```rust
// OpenAPI -> Rust
string          -> String
integer         -> i64 (default), i32, u32, etc. (format-specific)
number          -> f64 (default), f32 (format: float)
boolean         -> bool
null            -> Option<T> or ()
array           -> Vec<T>
object          -> Custom struct or HashMap<String, Value>
```

#### Optional vs Required Fields
```rust
// Required field
pub struct User {
    pub id: String,
    pub name: String,
}

// Optional field
pub struct User {
    pub id: String,
    pub name: String,
    pub email: Option<String>,  // optional
}
```

#### Generics and Enums
```rust
// API response wrapper with generics
pub struct ApiResponse<T> {
    pub data: T,
    pub status: u16,
}

// Enum for union types (oneOf, anyOf)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StringOrNumber {
    String(String),
    Number(f64),
}

// Tagged union for discriminated types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Event {
    #[serde(rename = "user.created")]
    UserCreated { user_id: String, timestamp: i64 },
    #[serde(rename = "user.deleted")]
    UserDeleted { user_id: String },
}
```

### Async Patterns

```rust
use tokio;
use reqwest;

// Async client with tokio runtime
pub struct Client {
    http_client: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
}

impl Client {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            http_client: reqwest::Client::new(),
            base_url: base_url.into(),
            api_key: None,
        }
    }

    pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
        self.api_key = Some(api_key.into());
        self
    }

    // Async method returning Result
    pub async fn get_user(&self, id: &str) -> Result<User, Error> {
        let url = format!("{}/users/{}", self.base_url, id);

        let mut request = self.http_client.get(&url);
        if let Some(key) = &self.api_key {
            request = request.header("Authorization", format!("Bearer {}", key));
        }

        let response = request.send().await?;
        let user = response.json::<User>().await?;
        Ok(user)
    }

    // Streaming responses
    pub async fn stream_events(&self) -> Result<impl Stream<Item = Result<Event, Error>>, Error> {
        // Implementation using tokio streams
        todo!()
    }
}
```

### Error Handling

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("API returned error {status}: {message}")]
    ApiError {
        status: u16,
        message: String,
    },

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Invalid request: {0}")]
    ValidationError(String),

    #[error("Timeout after {0:?}")]
    Timeout(std::time::Duration),
}

// Usage
pub type Result<T> = std::result::Result<T, Error>;
```

### Package Structure

```
my-api-client/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Public API exports
│   ├── client.rs           # HTTP client implementation
│   ├── error.rs            # Error types
│   ├── types/              # Generated types
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── post.rs
│   │   └── ...
│   ├── endpoints/          # API endpoint methods
│   │   ├── mod.rs
│   │   ├── users.rs
│   │   ├── posts.rs
│   │   └── ...
│   └── utils/              # Internal utilities
│       ├── mod.rs
│       └── serde.rs        # Custom serialization
└── examples/
    └── basic_usage.rs
```

### Idioms and Conventions

```rust
// Builder pattern for complex construction
pub struct ClientBuilder {
    base_url: String,
    api_key: Option<String>,
    timeout: Duration,
    retry_config: RetryConfig,
}

impl ClientBuilder {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
            api_key: None,
            timeout: Duration::from_secs(30),
            retry_config: RetryConfig::default(),
        }
    }

    pub fn api_key(mut self, key: impl Into<String>) -> Self {
        self.api_key = Some(key.into());
        self
    }

    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn build(self) -> Result<Client> {
        // Validate and construct
        Ok(Client { /* ... */ })
    }
}

// Usage
let client = ClientBuilder::new("https://api.example.com")
    .api_key("sk-...")
    .timeout(Duration::from_secs(60))
    .build()?;
```

#### Documentation
```rust
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
/// * `Error::ApiError` - If the API returns an error
/// * `Error::HttpError` - If the HTTP request fails
///
/// # Example
///
/// ```rust
/// let user = client.get_user("user_123").await?;
/// println!("User: {}", user.name);
/// ```
pub async fn get_user(&self, id: &str) -> Result<User> {
    // Implementation
}
```

---

## 2. TypeScript

### Type System Mapping

#### Primitive Types
```typescript
// OpenAPI -> TypeScript
string          -> string
integer         -> number
number          -> number
boolean         -> boolean
null            -> null
array           -> T[]
object          -> interface or type
```

#### Optional vs Required Fields
```typescript
// Required fields
interface User {
  id: string;
  name: string;
  email: string;
}

// Optional fields
interface User {
  id: string;
  name: string;
  email?: string;  // optional
  metadata?: Record<string, unknown>;
}

// Readonly fields
interface User {
  readonly id: string;
  name: string;
}
```

#### Generics and Union Types
```typescript
// Generic response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// Union types for oneOf/anyOf
type StringOrNumber = string | number;

// Discriminated unions
type Event =
  | { type: 'user.created'; userId: string; timestamp: number }
  | { type: 'user.deleted'; userId: string };

// Helper to narrow types
function isUserCreated(event: Event): event is Extract<Event, { type: 'user.created' }> {
  return event.type === 'user.created';
}

// Utility types
type RequiredKeys<T> = {
  [K in keyof T]-?: T[K]
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

### Async Patterns

```typescript
// Modern async/await with fetch
export class Client {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number = 30000;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    if (config.timeout) {
      this.timeout = config.timeout;
    }
  }

  // Async method returning Promise
  async getUser(id: string): Promise<User> {
    const response = await this.request<User>('GET', `/users/${id}`);
    return response;
  }

  // Async method with abort signal
  async getUsers(
    options?: { signal?: AbortSignal }
  ): Promise<User[]> {
    return this.request<User[]>('GET', '/users', {
      signal: options?.signal
    });
  }

  // Internal request method
  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          ...options?.headers,
        },
        signal: options?.signal || controller.signal,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Streaming with async iterators
  async *streamEvents(signal?: AbortSignal): AsyncIterableIterator<Event> {
    const response = await fetch(`${this.baseUrl}/events`, {
      headers: this.getHeaders(),
      signal,
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            yield JSON.parse(line.slice(6));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
```

### Error Handling

```typescript
// Custom error hierarchy
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public response?: unknown
  ) {
    super(`API Error ${status}: ${message}`);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(`Validation error on ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Type-safe error handling with discriminated unions
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function getUserSafe(id: string): Promise<Result<User>> {
  try {
    const user = await client.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Usage
const result = await getUserSafe('123');
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

### Package Structure

```
my-api-client/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            # Public API exports
│   ├── client.ts           # HTTP client
│   ├── errors.ts           # Error types
│   ├── types/              # Generated types
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── common.ts
│   ├── endpoints/          # Grouped endpoints
│   │   ├── index.ts
│   │   ├── users.ts
│   │   └── posts.ts
│   └── utils/              # Utilities
│       ├── index.ts
│       └── validation.ts
├── dist/                   # Compiled output
│   ├── index.js
│   ├── index.d.ts
│   └── ...
└── examples/
    └── basic-usage.ts
```

### Idioms and Conventions

```typescript
// Naming conventions: camelCase for variables/functions, PascalCase for types
interface UserCreateRequest {
  name: string;
  email: string;
}

function createUser(request: UserCreateRequest): Promise<User> {
  // Implementation
}

// Options object pattern
interface GetUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

async function getUsers(options: GetUsersOptions = {}): Promise<User[]> {
  const { limit = 10, offset = 0, sortBy = 'created_at', order = 'desc' } = options;
  // Implementation
}

// Fluent builder pattern
class RequestBuilder<T> {
  private params: Record<string, unknown> = {};
  private headers: Record<string, string> = {};

  constructor(private client: Client, private path: string) {}

  param(key: string, value: unknown): this {
    this.params[key] = value;
    return this;
  }

  header(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  async execute(): Promise<T> {
    return this.client.request<T>(this.path, {
      params: this.params,
      headers: this.headers,
    });
  }
}

// Usage
const users = await client
  .get<User[]>('/users')
  .param('limit', 10)
  .param('offset', 0)
  .header('X-Custom', 'value')
  .execute();
```

#### Documentation (TSDoc)
```typescript
/**
 * Get a user by ID
 *
 * @param id - The user's unique identifier
 * @returns A promise that resolves to the user
 * @throws {ApiError} When the API returns an error
 * @throws {NetworkError} When the network request fails
 *
 * @example
 * ```typescript
 * const user = await client.getUser('user_123');
 * console.log(user.name);
 * ```
 */
async getUser(id: string): Promise<User> {
  // Implementation
}
```

---

## 3. Python

### Type System Mapping

#### Primitive Types
```python
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# OpenAPI -> Python
# string          -> str
# integer         -> int
# number          -> float
# boolean         -> bool
# null            -> None
# array           -> List[T]
# object          -> Dict[str, Any] or dataclass
```

#### Optional vs Required Fields
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: str
    name: str
    email: Optional[str] = None  # Optional field with default
    metadata: Dict[str, Any] = None  # Will use field(default_factory=dict)

# Better with field factories
from dataclasses import dataclass, field

@dataclass
class User:
    id: str
    name: str
    email: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
```

#### Generics and Union Types
```python
from typing import TypeVar, Generic, Union, Literal
from dataclasses import dataclass

# Generic types
T = TypeVar('T')

@dataclass
class ApiResponse(Generic[T]):
    data: T
    status: int
    headers: Dict[str, str]

# Union types
StringOrNumber = Union[str, float]

# Discriminated unions with Literal
from typing import Literal, Union

@dataclass
class UserCreatedEvent:
    type: Literal['user.created']
    user_id: str
    timestamp: int

@dataclass
class UserDeletedEvent:
    type: Literal['user.deleted']
    user_id: str

Event = Union[UserCreatedEvent, UserDeletedEvent]

# Type narrowing
def handle_event(event: Event) -> None:
    if event.type == 'user.created':
        # TypeScript-style narrowing works with mypy
        print(f"User created: {event.user_id} at {event.timestamp}")
    else:
        print(f"User deleted: {event.user_id}")
```

### Async Patterns

```python
import asyncio
import aiohttp
from typing import Optional, AsyncIterator
from contextlib import asynccontextmanager

class Client:
    """Async HTTP client for the API"""

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry"""
        self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self._session:
            await self._session.close()

    async def get_user(self, user_id: str) -> User:
        """Get a user by ID"""
        url = f"{self.base_url}/users/{user_id}"
        async with self._get_session().get(url, headers=self._headers()) as response:
            response.raise_for_status()
            data = await response.json()
            return User(**data)

    async def list_users(
        self,
        limit: int = 10,
        offset: int = 0
    ) -> List[User]:
        """List users with pagination"""
        url = f"{self.base_url}/users"
        params = {'limit': limit, 'offset': offset}

        async with self._get_session().get(
            url,
            params=params,
            headers=self._headers()
        ) as response:
            response.raise_for_status()
            data = await response.json()
            return [User(**item) for item in data]

    async def stream_events(self) -> AsyncIterator[Event]:
        """Stream events from the API"""
        url = f"{self.base_url}/events"

        async with self._get_session().get(
            url,
            headers=self._headers()
        ) as response:
            response.raise_for_status()

            async for line in response.content:
                if line.startswith(b'data: '):
                    data = json.loads(line[6:])
                    yield self._parse_event(data)

    def _get_session(self) -> aiohttp.ClientSession:
        """Get or create session"""
        if self._session is None:
            self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self._session

    def _headers(self) -> Dict[str, str]:
        """Build request headers"""
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        return headers

# Sync wrapper (optional)
class SyncClient:
    """Synchronous wrapper around async client"""

    def __init__(self, *args, **kwargs):
        self._client = Client(*args, **kwargs)
        self._loop = None

    def __enter__(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.run_until_complete(self._client.__aenter__())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._loop:
            self._loop.run_until_complete(self._client.__aexit__(exc_type, exc_val, exc_tb))
            self._loop.close()

    def get_user(self, user_id: str) -> User:
        """Sync version of get_user"""
        return self._loop.run_until_complete(self._client.get_user(user_id))

# Usage
async def main():
    async with Client("https://api.example.com", api_key="sk-...") as client:
        user = await client.get_user("user_123")
        print(user.name)

        async for event in client.stream_events():
            print(f"Event: {event}")

# Sync usage
with SyncClient("https://api.example.com", api_key="sk-...") as client:
    user = client.get_user("user_123")
    print(user.name)
```

### Error Handling

```python
from typing import Optional

class ApiError(Exception):
    """Base exception for API errors"""

    def __init__(self, message: str, status: Optional[int] = None):
        self.message = message
        self.status = status
        super().__init__(self.message)

class ValidationError(ApiError):
    """Raised when request validation fails"""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(f"Validation error on {field}: {message}")

class AuthenticationError(ApiError):
    """Raised when authentication fails"""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status=401)

class RateLimitError(ApiError):
    """Raised when rate limit is exceeded"""

    def __init__(self, retry_after: Optional[int] = None):
        self.retry_after = retry_after
        message = f"Rate limit exceeded"
        if retry_after:
            message += f", retry after {retry_after} seconds"
        super().__init__(message, status=429)

class NetworkError(ApiError):
    """Raised when network request fails"""

    def __init__(self, message: str, cause: Optional[Exception] = None):
        self.cause = cause
        super().__init__(message)

# Result type pattern (optional)
from typing import TypeVar, Generic, Union
from dataclasses import dataclass

T = TypeVar('T')
E = TypeVar('E', bound=Exception)

@dataclass
class Ok(Generic[T]):
    value: T

@dataclass
class Err(Generic[E]):
    error: E

Result = Union[Ok[T], Err[E]]

def get_user_safe(user_id: str) -> Result[User, ApiError]:
    try:
        user = client.get_user(user_id)
        return Ok(user)
    except ApiError as e:
        return Err(e)

# Usage
result = get_user_safe("123")
if isinstance(result, Ok):
    print(result.value.name)
else:
    print(result.error.message)
```

### Package Structure

```
my-api-client/
├── pyproject.toml
├── setup.py
├── README.md
├── src/
│   └── my_api_client/
│       ├── __init__.py         # Public API exports
│       ├── client.py           # HTTP client (async)
│       ├── sync_client.py      # Sync wrapper
│       ├── errors.py           # Exception types
│       ├── types/              # Generated types
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── post.py
│       │   └── common.py
│       ├── endpoints/          # Endpoint groups
│       │   ├── __init__.py
│       │   ├── users.py
│       │   └── posts.py
│       └── utils/              # Internal utilities
│           ├── __init__.py
│           └── serialization.py
├── tests/
│   ├── __init__.py
│   ├── test_client.py
│   └── test_types.py
└── examples/
    ├── async_example.py
    └── sync_example.py
```

### Idioms and Conventions

```python
# Naming: snake_case for functions/variables, PascalCase for classes
from dataclasses import dataclass
from typing import Optional

@dataclass
class UserCreateRequest:
    name: str
    email: str
    age: Optional[int] = None

def create_user(request: UserCreateRequest) -> User:
    """Create a new user"""
    # Implementation
    pass

# Keyword arguments pattern
def list_users(
    *,  # Force keyword arguments
    limit: int = 10,
    offset: int = 0,
    sort_by: str = 'created_at',
    order: str = 'desc'
) -> List[User]:
    """List users with optional filters"""
    # Implementation
    pass

# Usage
users = list_users(limit=20, sort_by='name')

# Builder pattern (less common in Python, but useful for complex objects)
class ClientBuilder:
    def __init__(self, base_url: str):
        self._base_url = base_url
        self._api_key: Optional[str] = None
        self._timeout: float = 30.0

    def with_api_key(self, api_key: str) -> 'ClientBuilder':
        self._api_key = api_key
        return self

    def with_timeout(self, timeout: float) -> 'ClientBuilder':
        self._timeout = timeout
        return self

    def build(self) -> Client:
        return Client(
            base_url=self._base_url,
            api_key=self._api_key,
            timeout=self._timeout
        )

# Usage
client = (ClientBuilder("https://api.example.com")
    .with_api_key("sk-...")
    .with_timeout(60.0)
    .build())

# Property decorators for computed values
@dataclass
class User:
    first_name: str
    last_name: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
```

#### Documentation (Google/NumPy style)
```python
async def get_user(self, user_id: str) -> User:
    """Get a user by ID.

    Args:
        user_id: The user's unique identifier

    Returns:
        The user object

    Raises:
        ApiError: If the API returns an error
        NetworkError: If the network request fails
        ValidationError: If the user_id is invalid

    Example:
        >>> async with Client("https://api.example.com") as client:
        ...     user = await client.get_user("user_123")
        ...     print(user.name)
    """
    # Implementation
```

---

## 4. JavaScript

### Type System Mapping

JavaScript uses JSDoc for type annotations when not using TypeScript.

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} [email] - Optional field
 */

/**
 * @typedef {string | number} StringOrNumber
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {T} data
 * @property {number} status
 */
```

### Async Patterns

```javascript
// ESM Module
class Client {
  /**
   * @param {Object} config
   * @param {string} config.baseUrl
   * @param {string} [config.apiKey]
   * @param {number} [config.timeout=30000]
   */
  constructor({ baseUrl, apiKey, timeout = 30000 }) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>}
   */
  async getUser(id) {
    const response = await this.#request('GET', `/users/${id}`);
    return response;
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {Object} [options]
   * @returns {Promise<any>}
   * @private
   */
  async #request(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          ...options.headers,
        },
        signal: options.signal || controller.signal,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Stream events from the API
   * @param {AbortSignal} [signal]
   * @returns {AsyncIterableIterator<Event>}
   */
  async *streamEvents(signal) {
    const response = await fetch(`${this.baseUrl}/events`, {
      headers: this.#getHeaders(),
      signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            yield JSON.parse(line.slice(6));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * @private
   * @returns {Object}
   */
  #getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}

export { Client };
```

### Error Handling

```javascript
class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {any} [response]
   */
  constructor(status, message, response) {
    super(`API Error ${status}: ${message}`);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

class ValidationError extends Error {
  /**
   * @param {string} field
   * @param {string} message
   */
  constructor(field, message) {
    super(`Validation error on ${field}: ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export { ApiError, ValidationError };
```

### Package Structure

Same as TypeScript, but without type declaration files:

```
my-api-client/
├── package.json
├── src/
│   ├── index.js            # Public API exports
│   ├── client.js           # HTTP client
│   ├── errors.js           # Error types
│   ├── types/              # Model classes
│   │   └── ...
│   └── endpoints/          # Endpoint groups
│       └── ...
└── examples/
    └── basic-usage.js
```

### Idioms and Conventions

Similar to TypeScript, but with JSDoc comments for type safety.

---

## 5. C#

### Type System Mapping

#### Primitive Types
```csharp
// OpenAPI -> C#
string          -> string
integer         -> int, long (format-specific)
number          -> double, float (format-specific)
boolean         -> bool
null            -> Nullable<T> or T?
array           -> List<T> or T[]
object          -> class or Dictionary<string, object>
```

#### Optional vs Required Fields
```csharp
// Required fields
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

// Optional fields (C# 8.0+)
#nullable enable
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string? Email { get; set; }  // Nullable reference type
    public Dictionary<string, object>? Metadata { get; set; }
}
#nullable restore

// Or with nullable value types
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public int? Age { get; set; }  // Nullable int
}
```

#### Generics and Discriminated Unions
```csharp
// Generic response wrapper
public class ApiResponse<T>
{
    public T Data { get; set; }
    public int Status { get; set; }
    public Dictionary<string, string> Headers { get; set; }
}

// Abstract base for discriminated unions
public abstract class Event
{
    public abstract string Type { get; }
}

public class UserCreatedEvent : Event
{
    public override string Type => "user.created";
    public string UserId { get; set; }
    public long Timestamp { get; set; }
}

public class UserDeletedEvent : Event
{
    public override string Type => "user.deleted";
    public string UserId { get; set; }
}

// Or using records (C# 9.0+)
public abstract record Event
{
    public abstract string Type { get; }
}

public record UserCreatedEvent : Event
{
    public override string Type => "user.created";
    public required string UserId { get; init; }
    public required long Timestamp { get; init; }
}

public record UserDeletedEvent : Event
{
    public override string Type => "user.deleted";
    public required string UserId { get; init; }
}
```

### Async Patterns

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

public class Client : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string? _apiKey;

    public Client(string baseUrl, string? apiKey = null)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        _apiKey = apiKey;
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    // Async method returning Task<T>
    public async Task<User> GetUserAsync(string id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{id}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddAuthHeader(request);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<User>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Response was null");
    }

    // Method with options
    public async Task<List<User>> ListUsersAsync(
        int limit = 10,
        int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users?limit={limit}&offset={offset}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddAuthHeader(request);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<User>>(cancellationToken: cancellationToken)
            ?? new List<User>();
    }

    // Async streaming with IAsyncEnumerable (C# 8.0+)
    public async IAsyncEnumerable<Event> StreamEventsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/events";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddAuthHeader(request);

        using var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (line?.StartsWith("data: ") == true)
            {
                var json = line.Substring(6);
                var @event = JsonSerializer.Deserialize<Event>(json);
                if (@event != null)
                {
                    yield return @event;
                }
            }
        }
    }

    private void AddAuthHeader(HttpRequestMessage request)
    {
        if (_apiKey != null)
        {
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");
        }
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}
```

### Error Handling

```csharp
using System;

public class ApiException : Exception
{
    public int StatusCode { get; }
    public string? ResponseBody { get; }

    public ApiException(int statusCode, string message, string? responseBody = null)
        : base($"API Error {statusCode}: {message}")
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }
}

public class ValidationException : Exception
{
    public string Field { get; }

    public ValidationException(string field, string message)
        : base($"Validation error on {field}: {message}")
    {
        Field = field;
    }
}

public class AuthenticationException : ApiException
{
    public AuthenticationException(string message = "Authentication failed")
        : base(401, message)
    {
    }
}

// Result type pattern
public class Result<T, TError> where TError : Exception
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public TError? Error { get; }

    private Result(bool isSuccess, T? value, TError? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T, TError> Success(T value) =>
        new Result<T, TError>(true, value, null);

    public static Result<T, TError> Failure(TError error) =>
        new Result<T, TError>(false, default, error);

    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<TError, TResult> onFailure)
    {
        return IsSuccess ? onSuccess(Value!) : onFailure(Error!);
    }
}

// Usage
public async Task<Result<User, ApiException>> GetUserSafeAsync(string id)
{
    try
    {
        var user = await GetUserAsync(id);
        return Result<User, ApiException>.Success(user);
    }
    catch (ApiException ex)
    {
        return Result<User, ApiException>.Failure(ex);
    }
}

var result = await client.GetUserSafeAsync("123");
result.Match(
    user => Console.WriteLine(user.Name),
    error => Console.WriteLine(error.Message)
);
```

### Package Structure

```
MyApiClient/
├── MyApiClient.csproj
├── Client.cs               # HTTP client
├── Errors.cs               # Exception types
├── Types/                  # Generated types
│   ├── User.cs
│   ├── Post.cs
│   └── Common.cs
├── Endpoints/              # Endpoint groups
│   ├── UsersClient.cs
│   └── PostsClient.cs
└── Utils/                  # Internal utilities
    └── JsonHelpers.cs
```

### Idioms and Conventions

```csharp
// Naming: PascalCase for everything public
public class UserCreateRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
}

public async Task<User> CreateUserAsync(UserCreateRequest request)
{
    // Implementation
}

// Builder pattern with fluent interface
public class ClientBuilder
{
    private string _baseUrl;
    private string? _apiKey;
    private TimeSpan _timeout = TimeSpan.FromSeconds(30);

    public ClientBuilder(string baseUrl)
    {
        _baseUrl = baseUrl;
    }

    public ClientBuilder WithApiKey(string apiKey)
    {
        _apiKey = apiKey;
        return this;
    }

    public ClientBuilder WithTimeout(TimeSpan timeout)
    {
        _timeout = timeout;
        return this;
    }

    public Client Build()
    {
        return new Client(_baseUrl, _apiKey, _timeout);
    }
}

// Usage
var client = new ClientBuilder("https://api.example.com")
    .WithApiKey("sk-...")
    .WithTimeout(TimeSpan.FromSeconds(60))
    .Build();

// Extension methods
public static class ClientExtensions
{
    public static async Task<User> GetOrCreateUserAsync(
        this Client client,
        string id,
        UserCreateRequest createRequest)
    {
        try
        {
            return await client.GetUserAsync(id);
        }
        catch (ApiException ex) when (ex.StatusCode == 404)
        {
            return await client.CreateUserAsync(createRequest);
        }
    }
}
```

#### Documentation (XML comments)
```csharp
/// <summary>
/// Get a user by ID
/// </summary>
/// <param name="id">The user's unique identifier</param>
/// <param name="cancellationToken">Cancellation token</param>
/// <returns>The user object</returns>
/// <exception cref="ApiException">Thrown when the API returns an error</exception>
/// <exception cref="HttpRequestException">Thrown when the network request fails</exception>
/// <example>
/// <code>
/// var user = await client.GetUserAsync("user_123");
/// Console.WriteLine(user.Name);
/// </code>
/// </example>
public async Task<User> GetUserAsync(
    string id,
    CancellationToken cancellationToken = default)
{
    // Implementation
}
```

---

## 6. Go

### Type System Mapping

#### Primitive Types
```go
// OpenAPI -> Go
string          -> string
integer         -> int, int64 (format-specific)
number          -> float64, float32 (format-specific)
boolean         -> bool
null            -> pointer type *T
array           -> []T
object          -> struct or map[string]interface{}
```

#### Optional vs Required Fields
```go
// Required fields
type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// Optional fields (use pointers)
type User struct {
    ID       string                 `json:"id"`
    Name     string                 `json:"name"`
    Email    *string                `json:"email,omitempty"`
    Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// Helper for creating pointer values
func String(s string) *string {
    return &s
}

// Usage
user := User{
    ID:    "123",
    Name:  "John",
    Email: String("john@example.com"),
}
```

#### Interfaces and Type Assertions
```go
// Interface for union types
type Event interface {
    EventType() string
}

type UserCreatedEvent struct {
    Type      string `json:"type"`
    UserID    string `json:"user_id"`
    Timestamp int64  `json:"timestamp"`
}

func (e UserCreatedEvent) EventType() string {
    return e.Type
}

type UserDeletedEvent struct {
    Type   string `json:"type"`
    UserID string `json:"user_id"`
}

func (e UserDeletedEvent) EventType() string {
    return e.Type
}

// Type assertion
func handleEvent(event Event) {
    switch e := event.(type) {
    case UserCreatedEvent:
        fmt.Printf("User created: %s at %d\n", e.UserID, e.Timestamp)
    case UserDeletedEvent:
        fmt.Printf("User deleted: %s\n", e.UserID)
    }
}
```

### Async Patterns

```go
package apiclient

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

// Client is the HTTP client for the API
type Client struct {
    httpClient *http.Client
    baseURL    string
    apiKey     string
}

// NewClient creates a new API client
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

// ClientOption is a functional option for configuring the client
type ClientOption func(*Client)

// WithAPIKey sets the API key
func WithAPIKey(apiKey string) ClientOption {
    return func(c *Client) {
        c.apiKey = apiKey
    }
}

// WithTimeout sets the HTTP timeout
func WithTimeout(timeout time.Duration) ClientOption {
    return func(c *Client) {
        c.httpClient.Timeout = timeout
    }
}

// GetUser retrieves a user by ID
func (c *Client) GetUser(ctx context.Context, id string) (*User, error) {
    url := fmt.Sprintf("%s/users/%s", c.baseURL, id)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    c.addHeaders(req)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("execute request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    string(body),
        }
    }

    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return &user, nil
}

// ListUsers retrieves a list of users
func (c *Client) ListUsers(
    ctx context.Context,
    limit, offset int,
) ([]User, error) {
    url := fmt.Sprintf("%s/users?limit=%d&offset=%d", c.baseURL, limit, offset)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    c.addHeaders(req)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("execute request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    string(body),
        }
    }

    var users []User
    if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return users, nil
}

// StreamEvents streams events from the API using channels
func (c *Client) StreamEvents(ctx context.Context) (<-chan Event, <-chan error) {
    eventChan := make(chan Event)
    errChan := make(chan error, 1)

    go func() {
        defer close(eventChan)
        defer close(errChan)

        url := fmt.Sprintf("%s/events", c.baseURL)
        req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
        if err != nil {
            errChan <- fmt.Errorf("create request: %w", err)
            return
        }

        c.addHeaders(req)

        resp, err := c.httpClient.Do(req)
        if err != nil {
            errChan <- fmt.Errorf("execute request: %w", err)
            return
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            body, _ := io.ReadAll(resp.Body)
            errChan <- &APIError{
                StatusCode: resp.StatusCode,
                Message:    string(body),
            }
            return
        }

        decoder := json.NewDecoder(resp.Body)
        for {
            var event map[string]interface{}
            if err := decoder.Decode(&event); err != nil {
                if err == io.EOF {
                    return
                }
                errChan <- fmt.Errorf("decode event: %w", err)
                return
            }

            // Parse event type and send to channel
            select {
            case eventChan <- parseEvent(event):
            case <-ctx.Done():
                return
            }
        }
    }()

    return eventChan, errChan
}

func (c *Client) addHeaders(req *http.Request) {
    req.Header.Set("Content-Type", "application/json")
    if c.apiKey != "" {
        req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
    }
}

// Usage with goroutines
func main() {
    ctx := context.Background()
    client := NewClient(
        "https://api.example.com",
        WithAPIKey("sk-..."),
        WithTimeout(60*time.Second),
    )

    // Single request
    user, err := client.GetUser(ctx, "user_123")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(user.Name)

    // Streaming with goroutines
    events, errs := client.StreamEvents(ctx)

    for {
        select {
        case event, ok := <-events:
            if !ok {
                return
            }
            fmt.Printf("Event: %+v\n", event)
        case err, ok := <-errs:
            if ok {
                log.Printf("Error: %v", err)
            }
        case <-ctx.Done():
            return
        }
    }
}
```

### Error Handling

```go
package apiclient

import "fmt"

// APIError represents an error returned by the API
type APIError struct {
    StatusCode int
    Message    string
}

func (e *APIError) Error() string {
    return fmt.Sprintf("API error %d: %s", e.StatusCode, e.Message)
}

// ValidationError represents a validation error
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

// NetworkError represents a network error
type NetworkError struct {
    Message string
    Cause   error
}

func (e *NetworkError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Cause)
    }
    return e.Message
}

func (e *NetworkError) Unwrap() error {
    return e.Cause
}

// Error checking patterns
import "errors"

// Check for specific error type
var apiErr *APIError
if errors.As(err, &apiErr) {
    if apiErr.StatusCode == 404 {
        // Handle not found
    }
}

// Check if error wraps another error
if errors.Is(err, context.DeadlineExceeded) {
    // Handle timeout
}
```

### Package Structure

```
myapiclient/
├── go.mod
├── go.sum
├── client.go               # Main client
├── errors.go               # Error types
├── options.go              # Functional options
├── types/                  # Generated types
│   ├── user.go
│   ├── post.go
│   └── common.go
├── endpoints/              # Endpoint groups (optional)
│   ├── users.go
│   └── posts.go
└── examples/
    └── main.go
```

### Idioms and Conventions

```go
// Naming: PascalCase for exported, camelCase for unexported
type UserCreateRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func (c *Client) CreateUser(ctx context.Context, req UserCreateRequest) (*User, error) {
    // Implementation
}

// Functional options pattern
type ClientOption func(*Client)

func WithAPIKey(key string) ClientOption {
    return func(c *Client) {
        c.apiKey = key
    }
}

func WithTimeout(timeout time.Duration) ClientOption {
    return func(c *Client) {
        c.httpClient.Timeout = timeout
    }
}

client := NewClient(
    "https://api.example.com",
    WithAPIKey("sk-..."),
    WithTimeout(60*time.Second),
)

// Context for cancellation
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

user, err := client.GetUser(ctx, "user_123")
if err != nil {
    return err
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
            userID: "user_123",
            want:   &User{ID: "user_123", Name: "John"},
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

#### Documentation (GoDoc)
```go
// GetUser retrieves a user by ID.
//
// The context can be used to cancel the request or set a deadline.
//
// Returns the user if found, or an error if the request fails.
//
// Example:
//
//	user, err := client.GetUser(ctx, "user_123")
//	if err != nil {
//	    return err
//	}
//	fmt.Println(user.Name)
func (c *Client) GetUser(ctx context.Context, id string) (*User, error) {
    // Implementation
}
```

---

## 7. Java

### Type System Mapping

#### Primitive Types
```java
// OpenAPI -> Java
string          -> String
integer         -> Integer, Long (format-specific)
number          -> Double, Float (format-specific)
boolean         -> Boolean
null            -> Optional<T>
array           -> List<T>
object          -> Class or Map<String, Object>
```

#### Optional vs Required Fields
```java
// Required fields
public class User {
    private String id;
    private String name;
    private String email;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

// Optional fields
import java.util.Optional;

public class User {
    private String id;
    private String name;
    private Optional<String> email;
    private Optional<Map<String, Object>> metadata;

    public Optional<String> getEmail() {
        return email;
    }

    public void setEmail(Optional<String> email) {
        this.email = email;
    }
}

// Or use @Nullable annotation
import javax.annotation.Nullable;

public class User {
    private String id;
    private String name;
    @Nullable
    private String email;
}

// Modern Java with Records (Java 14+)
public record User(
    String id,
    String name,
    @Nullable String email
) {}
```

#### Generics and Sealed Classes
```java
// Generic response wrapper
public class ApiResponse<T> {
    private T data;
    private int status;
    private Map<String, String> headers;

    public T getData() { return data; }
    public int getStatus() { return status; }
    public Map<String, String> getHeaders() { return headers; }
}

// Sealed classes for discriminated unions (Java 17+)
public sealed interface Event permits UserCreatedEvent, UserDeletedEvent {
    String getType();
}

public final class UserCreatedEvent implements Event {
    private final String userId;
    private final long timestamp;

    public UserCreatedEvent(String userId, long timestamp) {
        this.userId = userId;
        this.timestamp = timestamp;
    }

    @Override
    public String getType() {
        return "user.created";
    }

    public String getUserId() { return userId; }
    public long getTimestamp() { return timestamp; }
}

public final class UserDeletedEvent implements Event {
    private final String userId;

    public UserDeletedEvent(String userId) {
        this.userId = userId;
    }

    @Override
    public String getType() {
        return "user.deleted";
    }

    public String getUserId() { return userId; }
}

// Pattern matching (Java 17+)
public void handleEvent(Event event) {
    switch (event) {
        case UserCreatedEvent e ->
            System.out.printf("User created: %s at %d%n", e.getUserId(), e.getTimestamp());
        case UserDeletedEvent e ->
            System.out.printf("User deleted: %s%n", e.getUserId());
    }
}
```

### Async Patterns

```java
package com.example.apiclient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;
import com.fasterxml.jackson.databind.ObjectMapper;

public class Client {
    private final HttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public Client(String baseUrl, String apiKey) {
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    // Async method returning CompletableFuture
    public CompletableFuture<User> getUserAsync(String id) {
        String url = String.format("%s/users/%s", baseUrl, id);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .GET()
            .build();

        return httpClient
            .sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(response -> {
                if (response.statusCode() != 200) {
                    throw new ApiException(
                        response.statusCode(),
                        response.body()
                    );
                }
                return response;
            })
            .thenApply(response -> {
                try {
                    return objectMapper.readValue(response.body(), User.class);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to parse response", e);
                }
            });
    }

    // Synchronous wrapper
    public User getUser(String id) {
        return getUserAsync(id).join();
    }

    // Reactive streams (Java 9+)
    public Flow.Publisher<Event> streamEvents() {
        return subscriber -> {
            String url = String.format("%s/events", baseUrl);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .GET()
                .build();

            httpClient.sendAsync(
                request,
                HttpResponse.BodyHandlers.ofLines()
            ).thenAccept(response -> {
                response.body().forEach(line -> {
                    if (line.startsWith("data: ")) {
                        try {
                            Event event = objectMapper.readValue(
                                line.substring(6),
                                Event.class
                            );
                            subscriber.onNext(event);
                        } catch (Exception e) {
                            subscriber.onError(e);
                        }
                    }
                });
                subscriber.onComplete();
            });
        };
    }

    // Builder pattern
    public static class Builder {
        private String baseUrl;
        private String apiKey;
        private Duration timeout = Duration.ofSeconds(30);

        public Builder(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }

        public Client build() {
            return new Client(baseUrl, apiKey, timeout);
        }
    }
}

// Usage
CompletableFuture<User> userFuture = client.getUserAsync("user_123");

// Chain operations
userFuture
    .thenApply(user -> user.getName())
    .thenAccept(name -> System.out.println("User: " + name))
    .exceptionally(ex -> {
        System.err.println("Error: " + ex.getMessage());
        return null;
    });

// Or wait for result
User user = userFuture.join();
```

### Error Handling

```java
package com.example.apiclient;

public class ApiException extends RuntimeException {
    private final int statusCode;
    private final String responseBody;

    public ApiException(int statusCode, String message) {
        this(statusCode, message, null);
    }

    public ApiException(int statusCode, String message, String responseBody) {
        super(String.format("API Error %d: %s", statusCode, message));
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}

public class ValidationException extends RuntimeException {
    private final String field;

    public ValidationException(String field, String message) {
        super(String.format("Validation error on %s: %s", field, message));
        this.field = field;
    }

    public String getField() {
        return field;
    }
}

// Result type pattern (modern approach)
public sealed interface Result<T, E extends Exception>
    permits Result.Success, Result.Failure {

    record Success<T, E extends Exception>(T value) implements Result<T, E> {}
    record Failure<T, E extends Exception>(E error) implements Result<T, E> {}

    default boolean isSuccess() {
        return this instanceof Success;
    }

    default T getValue() {
        if (this instanceof Success<T, E> success) {
            return success.value();
        }
        throw new IllegalStateException("Result is not a success");
    }

    default E getError() {
        if (this instanceof Failure<T, E> failure) {
            return failure.error();
        }
        throw new IllegalStateException("Result is not a failure");
    }
}

// Usage
public Result<User, ApiException> getUserSafe(String id) {
    try {
        User user = getUser(id);
        return new Result.Success<>(user);
    } catch (ApiException e) {
        return new Result.Failure<>(e);
    }
}

Result<User, ApiException> result = client.getUserSafe("123");
if (result.isSuccess()) {
    System.out.println(result.getValue().getName());
} else {
    System.err.println(result.getError().getMessage());
}
```

### Package Structure

```
my-api-client/
├── pom.xml (Maven) or build.gradle (Gradle)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── apiclient/
│   │   │               ├── Client.java
│   │   │               ├── ApiException.java
│   │   │               ├── types/
│   │   │               │   ├── User.java
│   │   │               │   ├── Post.java
│   │   │               │   └── Common.java
│   │   │               ├── endpoints/
│   │   │               │   ├── UsersClient.java
│   │   │               │   └── PostsClient.java
│   │   │               └── utils/
│   │   │                   └── JsonHelpers.java
│   │   └── resources/
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── apiclient/
│                       └── ClientTest.java
└── README.md
```

### Idioms and Conventions

```java
// Naming: PascalCase for classes, camelCase for methods/variables
public class UserCreateRequest {
    private String name;
    private String email;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

public CompletableFuture<User> createUser(UserCreateRequest request) {
    // Implementation
}

// Builder pattern (very common in Java)
public class Client {
    private final String baseUrl;
    private final String apiKey;
    private final Duration timeout;

    private Client(Builder builder) {
        this.baseUrl = builder.baseUrl;
        this.apiKey = builder.apiKey;
        this.timeout = builder.timeout;
    }

    public static class Builder {
        private final String baseUrl;
        private String apiKey;
        private Duration timeout = Duration.ofSeconds(30);

        public Builder(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }

        public Client build() {
            return new Client(this);
        }
    }
}

// Usage
Client client = new Client.Builder("https://api.example.com")
    .apiKey("sk-...")
    .timeout(Duration.ofSeconds(60))
    .build();

// Try-with-resources for auto-closing
try (var client = new Client("https://api.example.com", "sk-...")) {
    User user = client.getUser("user_123");
    System.out.println(user.getName());
}
```

#### Documentation (JavaDoc)
```java
/**
 * Get a user by ID.
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

## Summary of Key Design Decisions

### Type Safety
- **Rust**: Leverages ownership and Result types for maximum safety
- **TypeScript**: Uses structural typing and discriminated unions
- **Python**: Type hints with runtime validation options
- **JavaScript**: JSDoc for optional type safety
- **C#**: Nullable reference types and strong generics
- **Go**: Interfaces and struct tags for JSON marshaling
- **Java**: Sealed classes and records for modern type safety

### Async Patterns
- **Rust**: async/await with tokio, Stream trait
- **TypeScript/JavaScript**: Promises, async/await, AsyncIterator
- **Python**: asyncio with async/await, sync wrappers
- **C#**: Task-based with async/await, IAsyncEnumerable
- **Go**: Goroutines and channels, context for cancellation
- **Java**: CompletableFuture, reactive streams

### Error Handling
- **Rust**: Result<T, E> (explicit, no exceptions)
- **TypeScript**: Exceptions + optional Result types
- **Python**: Exceptions (Pythonic)
- **JavaScript**: Exceptions
- **C#**: Exceptions + optional Result types
- **Go**: Multiple return values (value, error)
- **Java**: Checked exceptions + modern Result types

### Builder Patterns
- **Rust**: Consuming builders (move semantics)
- **TypeScript**: Fluent interfaces
- **Python**: Keyword arguments (more idiomatic than builders)
- **JavaScript**: Options objects
- **C#**: Fluent builders
- **Go**: Functional options pattern
- **Java**: Classic builder pattern

This strategy ensures that generated code feels native to each language while maintaining consistency in the overall API design.
