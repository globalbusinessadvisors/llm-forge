# LLM-Forge: Cross-Cutting Concerns & Design Patterns

**Version**: 1.0
**Date**: 2025-11-07
**Related**: SYSTEM_ARCHITECTURE_DETAILED.md

This document addresses the horizontal concerns that span across all components of LLM-Forge, focusing on the specific design challenges mentioned in the requirements.

---

## Table of Contents

1. [Async/Await Patterns Across Languages](#1-asyncawait-patterns-across-languages)
2. [Authentication Management](#2-authentication-management)
3. [Rate Limiting Implementation](#3-rate-limiting-implementation)
4. [Retry Logic](#4-retry-logic)
5. [Streaming Responses](#5-streaming-responses)
6. [Error Handling](#6-error-handling)
7. [Idiomatic Code Generation](#7-idiomatic-code-generation)

---

## 1. Async/Await Patterns Across Languages

### 1.1 Challenge

Different languages have vastly different concurrency models:
- **Python**: async/await with asyncio
- **TypeScript/JavaScript**: Promises and async/await
- **Rust**: Futures with tokio/async-std
- **Go**: Goroutines and channels
- **Java**: CompletableFuture and virtual threads (Project Loom)
- **C#**: Task-based async/await
- **Ruby**: Threads and Fibers

### 1.2 Solution: Abstraction Layer

```typescript
/**
 * Async Pattern Abstraction
 */
interface AsyncPattern {
  kind: 'promise' | 'future' | 'goroutine' | 'async_await' | 'callback';
  supportsStreaming: boolean;
  supportsParallel: boolean;
  supportsCancellation: boolean;
}

const LANGUAGE_ASYNC_PATTERNS: Record<string, AsyncPattern> = {
  python: {
    kind: 'async_await',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  },
  typescript: {
    kind: 'promise',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  },
  rust: {
    kind: 'future',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  },
  go: {
    kind: 'goroutine',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  },
  java: {
    kind: 'future',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  },
  csharp: {
    kind: 'async_await',
    supportsStreaming: true,
    supportsParallel: true,
    supportsCancellation: true
  }
};
```

### 1.3 Language-Specific Implementations

#### 1.3.1 Python (asyncio)

```python
# Generated Python SDK - Async Pattern
import asyncio
import aiohttp
from typing import AsyncIterator, Optional

class OpenAIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def create_completion(
        self,
        request: CompletionRequest
    ) -> CompletionResponse:
        """Create a completion (async)."""
        async with self.session.post(
            f"{self.base_url}/completions",
            headers=self._get_headers(),
            json=request.dict()
        ) as response:
            response.raise_for_status()
            data = await response.json()
            return CompletionResponse(**data)

    async def create_completion_stream(
        self,
        request: CompletionRequest
    ) -> AsyncIterator[CompletionChunk]:
        """Create a streaming completion (async generator)."""
        async with self.session.post(
            f"{self.base_url}/completions",
            headers=self._get_headers(),
            json={**request.dict(), "stream": True}
        ) as response:
            response.raise_for_status()
            async for line in response.content:
                if line.startswith(b"data: "):
                    data = json.loads(line[6:])
                    yield CompletionChunk(**data)

# Usage
async def main():
    async with OpenAIClient(api_key="...") as client:
        # Non-streaming
        response = await client.create_completion(request)

        # Streaming
        async for chunk in client.create_completion_stream(request):
            print(chunk.text, end="")

asyncio.run(main())
```

#### 1.3.2 TypeScript (Promises + Async/Await)

```typescript
// Generated TypeScript SDK - Async Pattern
import fetch from 'node-fetch';

export class OpenAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Create a completion (Promise-based)
   */
  async createCompletion(
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseUrl}/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new OpenAIError(response);
    }

    const data = await response.json();
    return CompletionResponse.parse(data);
  }

  /**
   * Create a streaming completion (AsyncIterator)
   */
  async *createCompletionStream(
    request: CompletionRequest
  ): AsyncIterableIterator<CompletionChunk> {
    const response = await fetch(`${this.baseUrl}/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new OpenAIError(response);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield CompletionChunk.parse(data);
        }
      }
    }
  }
}

// Usage
async function main() {
  const client = new OpenAIClient('...');

  // Non-streaming
  const response = await client.createCompletion(request);

  // Streaming
  for await (const chunk of client.createCompletionStream(request)) {
    process.stdout.write(chunk.text);
  }
}
```

#### 1.3.3 Rust (Tokio + Futures)

```rust
// Generated Rust SDK - Async Pattern
use tokio::io::{AsyncBufReadExt, BufReader};
use futures::stream::{Stream, StreamExt};
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct OpenAIClient {
    api_key: String,
    client: Client,
    base_url: String,
}

impl OpenAIClient {
    pub fn new(api_key: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            client: Client::new(),
            base_url: "https://api.openai.com/v1".to_string(),
        }
    }

    /// Create a completion (async Future)
    pub async fn create_completion(
        &self,
        request: &CompletionRequest,
    ) -> Result<CompletionResponse, Error> {
        let response = self
            .client
            .post(&format!("{}/completions", self.base_url))
            .headers(self.get_headers())
            .json(request)
            .send()
            .await?;

        let data = response.json::<CompletionResponse>().await?;
        Ok(data)
    }

    /// Create a streaming completion (Stream)
    pub async fn create_completion_stream(
        &self,
        request: &CompletionRequest,
    ) -> Result<impl Stream<Item = Result<CompletionChunk, Error>>, Error> {
        let mut req = request.clone();
        req.stream = Some(true);

        let response = self
            .client
            .post(&format!("{}/completions", self.base_url))
            .headers(self.get_headers())
            .json(&req)
            .send()
            .await?;

        let stream = response.bytes_stream();

        Ok(stream
            .map(|result| {
                result
                    .map_err(Error::from)
                    .and_then(|bytes| {
                        let line = String::from_utf8_lossy(&bytes);
                        if line.starts_with("data: ") {
                            serde_json::from_str(&line[6..])
                                .map_err(Error::from)
                        } else {
                            Err(Error::InvalidChunk)
                        }
                    })
            }))
    }
}

// Usage
#[tokio::main]
async fn main() -> Result<(), Error> {
    let client = OpenAIClient::new("...");

    // Non-streaming
    let response = client.create_completion(&request).await?;

    // Streaming
    let mut stream = client.create_completion_stream(&request).await?;
    while let Some(chunk) = stream.next().await {
        print!("{}", chunk?.text);
    }

    Ok(())
}
```

#### 1.3.4 Go (Goroutines + Channels)

```go
// Generated Go SDK - Async Pattern
package openai

import (
    "bufio"
    "context"
    "encoding/json"
    "net/http"
)

type Client struct {
    apiKey  string
    baseURL string
    client  *http.Client
}

func NewClient(apiKey string) *Client {
    return &Client{
        apiKey:  apiKey,
        baseURL: "https://api.openai.com/v1",
        client:  &http.Client{},
    }
}

// CreateCompletion creates a completion (blocking)
func (c *Client) CreateCompletion(
    ctx context.Context,
    req *CompletionRequest,
) (*CompletionResponse, error) {
    resp, err := c.doRequest(ctx, "POST", "/completions", req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result CompletionResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}

// CreateCompletionStream creates a streaming completion (channel-based)
func (c *Client) CreateCompletionStream(
    ctx context.Context,
    req *CompletionRequest,
) (<-chan CompletionChunk, <-chan error) {
    chunkCh := make(chan CompletionChunk)
    errCh := make(chan error, 1)

    go func() {
        defer close(chunkCh)
        defer close(errCh)

        req.Stream = true
        resp, err := c.doRequest(ctx, "POST", "/completions", req)
        if err != nil {
            errCh <- err
            return
        }
        defer resp.Body.Close()

        scanner := bufio.NewScanner(resp.Body)
        for scanner.Scan() {
            line := scanner.Text()
            if len(line) > 6 && line[:6] == "data: " {
                var chunk CompletionChunk
                if err := json.Unmarshal([]byte(line[6:]), &chunk); err != nil {
                    errCh <- err
                    return
                }

                select {
                case chunkCh <- chunk:
                case <-ctx.Done():
                    errCh <- ctx.Err()
                    return
                }
            }
        }

        if err := scanner.Err(); err != nil {
            errCh <- err
        }
    }()

    return chunkCh, errCh
}

// Usage
func main() {
    ctx := context.Background()
    client := NewClient("...")

    // Non-streaming
    response, err := client.CreateCompletion(ctx, request)
    if err != nil {
        log.Fatal(err)
    }

    // Streaming
    chunkCh, errCh := client.CreateCompletionStream(ctx, request)
    for {
        select {
        case chunk, ok := <-chunkCh:
            if !ok {
                return
            }
            fmt.Print(chunk.Text)
        case err := <-errCh:
            if err != nil {
                log.Fatal(err)
            }
            return
        }
    }
}
```

### 1.4 Code Generation Strategy

```typescript
/**
 * Async Pattern Generator
 */
class AsyncPatternGenerator {
  generate(
    endpoint: EndpointDefinition,
    language: string
  ): { syncVersion?: string; asyncVersion?: string } {
    const pattern = LANGUAGE_ASYNC_PATTERNS[language];

    if (endpoint.streaming) {
      return this.generateStreamingMethod(endpoint, language, pattern);
    } else {
      return this.generateRegularMethod(endpoint, language, pattern);
    }
  }

  private generateStreamingMethod(
    endpoint: EndpointDefinition,
    language: string,
    pattern: AsyncPattern
  ): { syncVersion?: string; asyncVersion?: string } {
    switch (language) {
      case 'python':
        return {
          asyncVersion: this.generatePythonAsyncGenerator(endpoint)
        };

      case 'typescript':
        return {
          asyncVersion: this.generateTypeScriptAsyncIterator(endpoint)
        };

      case 'rust':
        return {
          asyncVersion: this.generateRustStream(endpoint)
        };

      case 'go':
        return {
          syncVersion: this.generateGoChannelStream(endpoint)
        };

      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private generateRegularMethod(
    endpoint: EndpointDefinition,
    language: string,
    pattern: AsyncPattern
  ): { syncVersion?: string; asyncVersion?: string } {
    // Generate both sync and async versions where appropriate
    switch (language) {
      case 'python':
        return {
          syncVersion: this.generatePythonSync(endpoint),
          asyncVersion: this.generatePythonAsync(endpoint)
        };

      case 'typescript':
        return {
          asyncVersion: this.generateTypeScriptAsync(endpoint)
        };

      case 'rust':
        return {
          asyncVersion: this.generateRustAsync(endpoint)
        };

      case 'go':
        return {
          syncVersion: this.generateGoSync(endpoint)
        };

      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}
```

---

## 2. Authentication Management

### 2.1 Authentication Schemes

```typescript
/**
 * Authentication Configuration
 */
interface AuthConfig {
  schemes: AuthScheme[];
  default: string;
  required: boolean;
}

type AuthScheme =
  | ApiKeyAuth
  | BearerAuth
  | OAuth2Auth
  | BasicAuth
  | CustomAuth;

interface ApiKeyAuth {
  type: 'apiKey';
  name: string;
  in: 'header' | 'query' | 'cookie';
  description?: string;
}

interface BearerAuth {
  type: 'bearer';
  scheme: 'bearer';
  bearerFormat?: 'JWT' | string;
  description?: string;
}

interface OAuth2Auth {
  type: 'oauth2';
  flows: {
    authorizationCode?: OAuth2Flow;
    clientCredentials?: OAuth2Flow;
    password?: OAuth2Flow;
    implicit?: OAuth2Flow;
  };
}

interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

interface BasicAuth {
  type: 'http';
  scheme: 'basic';
}

interface CustomAuth {
  type: 'custom';
  handler: string;
  description: string;
}
```

### 2.2 Authentication Provider Interface

```typescript
/**
 * Authentication Provider
 */
interface IAuthProvider {
  authenticate(request: HttpRequest): Promise<HttpRequest>;
  refresh?(): Promise<void>;
  isExpired?(): boolean;
}

/**
 * API Key Authentication
 */
class ApiKeyAuthProvider implements IAuthProvider {
  constructor(
    private apiKey: string,
    private config: ApiKeyAuth
  ) {}

  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    switch (this.config.in) {
      case 'header':
        request.headers[this.config.name] = this.apiKey;
        break;

      case 'query':
        request.params[this.config.name] = this.apiKey;
        break;

      case 'cookie':
        request.cookies[this.config.name] = this.apiKey;
        break;
    }

    return request;
  }
}

/**
 * Bearer Token Authentication
 */
class BearerAuthProvider implements IAuthProvider {
  constructor(private token: string) {}

  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    request.headers['Authorization'] = `Bearer ${this.token}`;
    return request;
  }
}

/**
 * OAuth2 Authentication
 */
class OAuth2AuthProvider implements IAuthProvider {
  private accessToken?: string;
  private refreshToken?: string;
  private expiresAt?: number;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private config: OAuth2Auth
  ) {}

  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    // Check if token is expired
    if (this.isExpired()) {
      await this.refresh();
    }

    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    request.headers['Authorization'] = `Bearer ${this.accessToken}`;
    return request;
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) {
      // Perform initial authentication
      await this.authenticate();
      return;
    }

    // Use refresh token to get new access token
    const flow = this.config.flows.authorizationCode;
    if (!flow?.tokenUrl) {
      throw new Error('No token URL configured');
    }

    const response = await fetch(flow.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt - 60000; // Refresh 1 min before expiry
  }

  private async authenticate(): Promise<void> {
    // Implement OAuth2 flow based on configured flow type
    const flow = this.config.flows.clientCredentials;
    if (!flow?.tokenUrl) {
      throw new Error('Client credentials flow not configured');
    }

    const response = await fetch(flow.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: Object.keys(flow.scopes).join(' ')
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }
}
```

### 2.3 Language-Specific Auth Examples

#### Python

```python
# Generated Python SDK - Authentication
from abc import ABC, abstractmethod
from typing import Optional
import httpx

class AuthProvider(ABC):
    @abstractmethod
    async def authenticate(self, request: httpx.Request) -> httpx.Request:
        """Add authentication to request."""
        pass

class ApiKeyAuth(AuthProvider):
    def __init__(self, api_key: str, header_name: str = "Authorization"):
        self.api_key = api_key
        self.header_name = header_name

    async def authenticate(self, request: httpx.Request) -> httpx.Request:
        request.headers[self.header_name] = self.api_key
        return request

class BearerAuth(AuthProvider):
    def __init__(self, token: str):
        self.token = token

    async def authenticate(self, request: httpx.Request) -> httpx.Request:
        request.headers["Authorization"] = f"Bearer {self.token}"
        return request

class OAuth2Auth(AuthProvider):
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        token_url: str
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = token_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.expires_at: Optional[float] = None

    async def authenticate(self, request: httpx.Request) -> httpx.Request:
        if self.is_expired():
            await self.refresh()

        if not self.access_token:
            raise ValueError("Not authenticated")

        request.headers["Authorization"] = f"Bearer {self.access_token}"
        return request

    def is_expired(self) -> bool:
        if not self.expires_at:
            return True
        import time
        return time.time() >= self.expires_at - 60

    async def refresh(self) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            response.raise_for_status()
            data = response.json()

            import time
            self.access_token = data["access_token"]
            self.expires_at = time.time() + data["expires_in"]

# Usage in client
class OpenAIClient:
    def __init__(self, auth: AuthProvider):
        self.auth = auth
        self.client = httpx.AsyncClient()

    async def _request(self, method: str, path: str, **kwargs):
        request = self.client.build_request(
            method,
            f"{self.base_url}{path}",
            **kwargs
        )

        # Apply authentication
        request = await self.auth.authenticate(request)

        return await self.client.send(request)
```

#### TypeScript

```typescript
// Generated TypeScript SDK - Authentication
interface AuthProvider {
  authenticate(request: Request): Promise<Request>;
  refresh?(): Promise<void>;
  isExpired?(): boolean;
}

export class ApiKeyAuth implements AuthProvider {
  constructor(
    private apiKey: string,
    private headerName: string = 'Authorization'
  ) {}

  async authenticate(request: Request): Promise<Request> {
    request.headers.set(this.headerName, this.apiKey);
    return request;
  }
}

export class BearerAuth implements AuthProvider {
  constructor(private token: string) {}

  async authenticate(request: Request): Promise<Request> {
    request.headers.set('Authorization', `Bearer ${this.token}`);
    return request;
  }
}

export class OAuth2Auth implements AuthProvider {
  private accessToken?: string;
  private refreshToken?: string;
  private expiresAt?: number;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private tokenUrl: string
  ) {}

  async authenticate(request: Request): Promise<Request> {
    if (this.isExpired()) {
      await this.refresh();
    }

    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    request.headers.set('Authorization', `Bearer ${this.accessToken}`);
    return request;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt - 60000;
  }

  async refresh(): Promise<void> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }
}

// Usage in client
export class OpenAIClient {
  constructor(private auth: AuthProvider) {}

  private async request(method: string, path: string, init?: RequestInit) {
    let request = new Request(`${this.baseUrl}${path}`, {
      method,
      ...init
    });

    // Apply authentication
    request = await this.auth.authenticate(request);

    return await fetch(request);
  }
}
```

---

## 3. Rate Limiting Implementation

### 3.1 Rate Limiting Strategies

```typescript
/**
 * Rate Limiter Interface
 */
interface IRateLimiter {
  acquire(): Promise<void>;
  release(): void;
  getStats(): RateLimitStats;
}

interface RateLimitStats {
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Token Bucket Rate Limiter
 */
class TokenBucketRateLimiter implements IRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private limit: number,
    private window: number  // seconds
  ) {
    this.tokens = limit;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait until tokens are available
    const waitTime = this.calculateWaitTime();
    await this.sleep(waitTime);
    return this.acquire();
  }

  release(): void {
    // Token bucket doesn't need explicit release
  }

  getStats(): RateLimitStats {
    this.refill();

    return {
      remaining: Math.floor(this.tokens),
      limit: this.limit,
      resetAt: this.lastRefill + this.window * 1000
    };
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = (timePassed / this.window) * this.limit;

    this.tokens = Math.min(this.limit, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private calculateWaitTime(): number {
    const tokenDeficit = 1 - this.tokens;
    return (tokenDeficit / this.limit) * this.window * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Sliding Window Rate Limiter
 */
class SlidingWindowRateLimiter implements IRateLimiter {
  private requests: number[] = [];

  constructor(
    private limit: number,
    private window: number  // seconds
  ) {}

  async acquire(): Promise<void> {
    this.cleanOldRequests();

    if (this.requests.length < this.limit) {
      this.requests.push(Date.now());
      return;
    }

    // Wait until oldest request expires
    const oldestRequest = this.requests[0];
    const waitTime = oldestRequest + this.window * 1000 - Date.now();

    if (waitTime > 0) {
      await this.sleep(waitTime);
    }

    return this.acquire();
  }

  release(): void {
    // Sliding window doesn't need explicit release
  }

  getStats(): RateLimitStats {
    this.cleanOldRequests();

    return {
      remaining: this.limit - this.requests.length,
      limit: this.limit,
      resetAt: this.requests.length > 0
        ? this.requests[0] + this.window * 1000
        : Date.now()
    };
  }

  private cleanOldRequests(): void {
    const now = Date.now();
    const cutoff = now - this.window * 1000;

    this.requests = this.requests.filter(time => time > cutoff);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Respect Server Rate Limit Headers
 */
class ServerRateLimitHandler {
  private remaining?: number;
  private limit?: number;
  private resetAt?: number;

  updateFromHeaders(headers: Headers): void {
    // Extract rate limit info from response headers
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');

    if (remaining) this.remaining = parseInt(remaining);
    if (limit) this.limit = parseInt(limit);
    if (reset) this.resetAt = parseInt(reset) * 1000; // Convert to ms

    // Alternative header names
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      this.resetAt = Date.now() + parseInt(retryAfter) * 1000;
    }
  }

  shouldWait(): boolean {
    if (this.remaining === undefined) return false;
    return this.remaining === 0;
  }

  async waitIfNeeded(): Promise<void> {
    if (!this.shouldWait() || !this.resetAt) return;

    const waitTime = this.resetAt - Date.now();
    if (waitTime > 0) {
      await this.sleep(waitTime);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3.2 Integration with HTTP Client

```typescript
/**
 * HTTP Client with Rate Limiting
 */
class RateLimitedHttpClient {
  private clientRateLimiter: IRateLimiter;
  private serverRateLimiter: ServerRateLimitHandler;

  constructor(
    private baseUrl: string,
    rateLimit: { limit: number; window: number }
  ) {
    this.clientRateLimiter = new TokenBucketRateLimiter(
      rateLimit.limit,
      rateLimit.window
    );
    this.serverRateLimiter = new ServerRateLimitHandler();
  }

  async request(
    method: string,
    path: string,
    init?: RequestInit
  ): Promise<Response> {
    // Client-side rate limiting
    await this.clientRateLimiter.acquire();

    // Server-side rate limiting
    await this.serverRateLimiter.waitIfNeeded();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      ...init
    });

    // Update rate limit info from response
    this.serverRateLimiter.updateFromHeaders(response.headers);

    return response;
  }

  getRateLimitStats(): RateLimitStats {
    return this.clientRateLimiter.getStats();
  }
}
```

---

## 4. Retry Logic

### 4.1 Retry Strategy

```typescript
/**
 * Retry Configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;       // ms
  maxDelay: number;           // ms
  backoff: 'exponential' | 'linear' | 'constant';
  jitter: boolean;
  retryableStatuses: number[];
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 60000,
  backoff: 'exponential',
  jitter: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
};

/**
 * Retry Handler
 */
class RetryHandler {
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          throw error;
        }

        // Last attempt, throw error
        if (attempt === this.config.maxAttempts - 1) {
          throw error;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);

        // Notify callback
        if (onRetry) {
          onRetry(attempt + 1, error as Error);
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any): boolean {
    // Check if HTTP status is retryable
    if (error.status && this.config.retryableStatuses.includes(error.status)) {
      return true;
    }

    // Check if error code is retryable
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Network errors are retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoff) {
      case 'exponential':
        delay = this.config.initialDelay * Math.pow(2, attempt);
        break;

      case 'linear':
        delay = this.config.initialDelay * (attempt + 1);
        break;

      case 'constant':
        delay = this.config.initialDelay;
        break;
    }

    // Apply max delay cap
    delay = Math.min(delay, this.config.maxDelay);

    // Apply jitter
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4.2 Integration Example

```typescript
/**
 * HTTP Client with Retry
 */
class HttpClientWithRetry {
  private retryHandler: RetryHandler;

  constructor(
    private baseUrl: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.retryHandler = new RetryHandler({
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig
    });
  }

  async request(
    method: string,
    path: string,
    init?: RequestInit
  ): Promise<Response> {
    return this.retryHandler.executeWithRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          ...init
        });

        if (!response.ok) {
          const error = new HttpError(response);
          error.status = response.status;
          throw error;
        }

        return response;
      },
      (attempt, error) => {
        console.warn(
          `Request failed (attempt ${attempt}/${this.retryHandler.config.maxAttempts}):`,
          error.message
        );
      }
    );
  }
}

class HttpError extends Error {
  status?: number;

  constructor(response: Response) {
    super(`HTTP ${response.status}: ${response.statusText}`);
    this.status = response.status;
  }
}
```

---

## 5. Streaming Responses

### 5.1 Server-Sent Events (SSE) Pattern

```typescript
/**
 * SSE Stream Handler
 */
class SSEStreamHandler {
  async *parseSSEStream(
    response: Response
  ): AsyncIterableIterator<any> {
    const reader = response.body!.getReader();
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
            const dataStr = line.slice(6);

            // Check for stream end
            if (dataStr === '[DONE]') {
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              yield data;
            } catch (e) {
              console.warn('Failed to parse SSE data:', dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
```

### 5.2 Language-Specific Streaming

#### Python

```python
# Python Streaming
from typing import AsyncIterator
import httpx

async def stream_completion(
    client: httpx.AsyncClient,
    url: str,
    data: dict
) -> AsyncIterator[dict]:
    """Stream completion chunks."""
    async with client.stream('POST', url, json=data) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if line.startswith('data: '):
                data_str = line[6:]
                if data_str == '[DONE]':
                    break
                yield json.loads(data_str)
```

#### Rust

```rust
// Rust Streaming
use futures::stream::{Stream, StreamExt};
use reqwest::Response;

pub struct SSEStream {
    response: Response,
}

impl SSEStream {
    pub fn new(response: Response) -> Self {
        Self { response }
    }

    pub async fn into_stream(self) -> impl Stream<Item = Result<serde_json::Value, Error>> {
        let stream = self.response.bytes_stream();

        stream
            .map(|result| {
                result
                    .map_err(Error::from)
                    .and_then(|bytes| {
                        let line = String::from_utf8_lossy(&bytes);
                        if line.starts_with("data: ") {
                            let data_str = &line[6..];
                            if data_str == "[DONE]" {
                                return Err(Error::StreamEnd);
                            }
                            serde_json::from_str(data_str)
                                .map_err(Error::from)
                        } else {
                            Err(Error::InvalidChunk)
                        }
                    })
            })
            .take_while(|result| {
                std::future::ready(!matches!(result, Err(Error::StreamEnd)))
            })
    }
}
```

---

## 6. Error Handling

### 6.1 Error Hierarchy

```typescript
/**
 * Base Error Class
 */
class APIError extends Error {
  statusCode?: number;
  requestId?: string;
  retryable: boolean = false;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

/**
 * Specific Error Types
 */
class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class RateLimitError extends APIError {
  retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryable = true;
    this.retryAfter = retryAfter;
  }
}

class ValidationError extends APIError {
  errors: ValidationIssue[];

  constructor(message: string, errors: ValidationIssue[]) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

interface ValidationIssue {
  field: string;
  message: string;
  code: string;
}

class ServerError extends APIError {
  constructor(message: string = 'Internal server error', statusCode: number = 500) {
    super(message, statusCode);
    this.name = 'ServerError';
    this.retryable = statusCode >= 500;
  }
}

class NetworkError extends APIError {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
    this.retryable = true;
  }
}
```

### 6.2 Error Mapping

```typescript
/**
 * Map HTTP Response to Error
 */
function mapResponseToError(response: Response): APIError {
  switch (response.status) {
    case 401:
      return new AuthenticationError();

    case 429:
      const retryAfter = response.headers.get('retry-after');
      return new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter) : undefined
      );

    case 422:
      // Parse validation errors from response
      return new ValidationError('Validation failed', []);

    case 400:
      return new APIError('Bad request', 400);

    case 404:
      return new APIError('Not found', 404);

    default:
      if (response.status >= 500) {
        return new ServerError('Server error', response.status);
      }
      return new APIError(`HTTP ${response.status}`, response.status);
  }
}
```

---

## 7. Idiomatic Code Generation

### 7.1 Language Idioms

```typescript
/**
 * Language Idiom Rules
 */
interface LanguageIdioms {
  naming: NamingConvention;
  patterns: CodePattern[];
  bestPractices: BestPractice[];
}

interface CodePattern {
  name: string;
  when: (context: any) => boolean;
  apply: (code: string) => string;
}

interface BestPractice {
  rule: string;
  enforce: (code: string) => ValidationResult;
}

/**
 * Python Idioms
 */
const PYTHON_IDIOMS: LanguageIdioms = {
  naming: {
    type: 'PascalCase',
    property: 'snake_case',
    method: 'snake_case',
    constant: 'SCREAMING_SNAKE_CASE',
    enum: 'PascalCase',
    package: 'snake_case'
  },
  patterns: [
    {
      name: 'context_manager',
      when: (ctx) => ctx.hasResourceCleanup,
      apply: (code) => `
        def __enter__(self):
            return self

        def __aexit__(self, exc_type, exc_val, exc_tb):
            await self.close()
      `
    },
    {
      name: 'property_decorator',
      when: (ctx) => ctx.isGetter,
      apply: (code) => '@property\n' + code
    }
  ],
  bestPractices: [
    {
      rule: 'Use type hints',
      enforce: (code) => ({
        valid: code.includes(':') && code.includes('->'),
        errors: [],
        warnings: []
      })
    },
    {
      rule: 'Follow PEP 8',
      enforce: (code) => ({ valid: true, errors: [], warnings: [] })
    }
  ]
};

/**
 * TypeScript Idioms
 */
const TYPESCRIPT_IDIOMS: LanguageIdioms = {
  naming: {
    type: 'PascalCase',
    property: 'camelCase',
    method: 'camelCase',
    constant: 'SCREAMING_SNAKE_CASE',
    enum: 'PascalCase',
    package: 'kebab-case'
  },
  patterns: [
    {
      name: 'readonly_properties',
      when: (ctx) => ctx.isImmutable,
      apply: (code) => 'readonly ' + code
    },
    {
      name: 'async_await',
      when: (ctx) => ctx.isAsync,
      apply: (code) => 'async ' + code
    }
  ],
  bestPractices: [
    {
      rule: 'Use strict null checks',
      enforce: (code) => ({ valid: true, errors: [], warnings: [] })
    },
    {
      rule: 'Prefer interfaces over type aliases',
      enforce: (code) => ({ valid: true, errors: [], warnings: [] })
    }
  ]
};

/**
 * Rust Idioms
 */
const RUST_IDIOMS: LanguageIdioms = {
  naming: {
    type: 'PascalCase',
    property: 'snake_case',
    method: 'snake_case',
    constant: 'SCREAMING_SNAKE_CASE',
    enum: 'PascalCase',
    package: 'snake_case'
  },
  patterns: [
    {
      name: 'builder_pattern',
      when: (ctx) => ctx.hasOptionalFields,
      apply: (code) => `
        impl ${ctx.typeName} {
            pub fn builder() -> ${ctx.typeName}Builder {
                ${ctx.typeName}Builder::default()
            }
        }
      `
    },
    {
      name: 'result_return',
      when: (ctx) => ctx.canFail,
      apply: (code) => code.replace(/-> (.+)/, '-> Result<$1, Error>')
    }
  ],
  bestPractices: [
    {
      rule: 'Use Result for errors',
      enforce: (code) => ({ valid: true, errors: [], warnings: [] })
    },
    {
      rule: 'Implement traits appropriately',
      enforce: (code) => ({ valid: true, errors: [], warnings: [] })
    }
  ]
};
```

### 7.2 Idiom Application

```typescript
/**
 * Apply Language Idioms to Generated Code
 */
class IdiomEnforcer {
  constructor(private language: string) {}

  apply(code: string, context: any): string {
    const idioms = this.getIdioms(this.language);

    // Apply naming conventions
    code = this.applyNamingConventions(code, idioms.naming);

    // Apply patterns
    for (const pattern of idioms.patterns) {
      if (pattern.when(context)) {
        code = pattern.apply(code);
      }
    }

    // Validate best practices
    for (const practice of idioms.bestPractices) {
      const result = practice.enforce(code);
      if (!result.valid) {
        console.warn(`Best practice violation: ${practice.rule}`);
      }
    }

    return code;
  }

  private getIdioms(language: string): LanguageIdioms {
    const idiomsMap: Record<string, LanguageIdioms> = {
      python: PYTHON_IDIOMS,
      typescript: TYPESCRIPT_IDIOMS,
      rust: RUST_IDIOMS
    };

    return idiomsMap[language] || PYTHON_IDIOMS;
  }

  private applyNamingConventions(code: string, naming: NamingConvention): string {
    // Apply naming conventions to code
    // This is simplified; real implementation would use AST manipulation
    return code;
  }
}
```

---

This comprehensive architecture document addresses all the cross-cutting concerns you specified. The design ensures:

1. **Async/Await**: Proper patterns for each language's concurrency model
2. **Authentication**: Flexible auth system supporting multiple schemes
3. **Rate Limiting**: Client and server-side rate limiting with multiple strategies
4. **Retry Logic**: Configurable retry with exponential backoff and jitter
5. **Streaming**: SSE and streaming support for all languages
6. **Error Handling**: Comprehensive error hierarchy with proper categorization
7. **Idiomatic Code**: Language-specific idioms and best practices enforced

Would you like me to create additional documents for:
- Build Pipeline Orchestrator implementation details?
- Plugin architecture and extensibility patterns?
- Deployment and operations guides?
- Complete example templates for each language?