# Language-Specific Template Examples

This document provides concrete examples of generated code for each supported language, demonstrating how a simple OpenAPI specification translates into idiomatic code.

## Reference OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      operationId: getUser
      summary: Get a user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /users:
    get:
      operationId: listUsers
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      operationId: createUser
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
        - created_at
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
        bio:
          type: string
          nullable: true
        age:
          type: integer
          nullable: true
        created_at:
          type: string
          format: date-time
        metadata:
          type: object
          additionalProperties: true

    UserCreate:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
        bio:
          type: string
        age:
          type: integer
          minimum: 0
          maximum: 150

    Error:
      type: object
      required:
        - message
        - code
      properties:
        message:
          type: string
        code:
          type: string
        details:
          type: object
          additionalProperties: true
```

---

## 1. Rust Generated Code

### types/user.rs
```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// User model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier for the user
    pub id: String,

    /// User's full name
    pub name: String,

    /// User's email address
    pub email: String,

    /// User's biography
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,

    /// User's age
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,

    /// Timestamp when the user was created
    pub created_at: DateTime<Utc>,

    /// Additional metadata
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Request body for creating a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCreate {
    /// User's full name (1-100 characters)
    pub name: String,

    /// User's email address
    pub email: String,

    /// User's biography
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,

    /// User's age (0-150)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i32>,
}

impl UserCreate {
    /// Create a new UserCreate request
    pub fn new(name: impl Into<String>, email: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            email: email.into(),
            bio: None,
            age: None,
        }
    }

    /// Set the bio
    pub fn bio(mut self, bio: impl Into<String>) -> Self {
        self.bio = Some(bio.into());
        self
    }

    /// Set the age
    pub fn age(mut self, age: i32) -> Self {
        self.age = Some(age);
        self
    }

    /// Validate the request
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.name.is_empty() || self.name.len() > 100 {
            return Err(ValidationError::new("name", "must be 1-100 characters"));
        }

        if let Some(age) = self.age {
            if age < 0 || age > 150 {
                return Err(ValidationError::new("age", "must be 0-150"));
            }
        }

        Ok(())
    }
}

/// API error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Error {
    /// Error message
    pub message: String,

    /// Error code
    pub code: String,

    /// Additional error details
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub details: HashMap<String, serde_json::Value>,
}
```

### client.rs
```rust
use reqwest;
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::types::*;

/// HTTP client for the User API
pub struct Client {
    http_client: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
}

impl Client {
    /// Create a new client
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            http_client: reqwest::Client::new(),
            base_url: base_url.into(),
            api_key: None,
        }
    }

    /// Set the API key for authentication
    pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
        self.api_key = Some(api_key.into());
        self
    }

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
    /// * `Error::ApiError` - If the API returns an error (e.g., 404 not found)
    /// * `Error::HttpError` - If the HTTP request fails
    ///
    /// # Example
    ///
    /// ```rust
    /// let user = client.get_user("user_123").await?;
    /// println!("User: {}", user.name);
    /// ```
    pub async fn get_user(&self, id: &str) -> Result<User> {
        let url = format!("{}/users/{}", self.base_url, id);

        let mut request = self.http_client.get(&url);
        if let Some(key) = &self.api_key {
            request = request.header("Authorization", format!("Bearer {}", key));
        }

        let response = request.send().await?;

        if response.status().is_success() {
            let user = response.json::<User>().await?;
            Ok(user)
        } else {
            let error = response.json::<ApiError>().await?;
            Err(Error::ApiError {
                status: error.code.parse().unwrap_or(500),
                message: error.message,
            })
        }
    }

    /// List users with pagination
    ///
    /// # Arguments
    ///
    /// * `limit` - Maximum number of users to return (default: 10)
    /// * `offset` - Number of users to skip (default: 0)
    ///
    /// # Returns
    ///
    /// Returns a list of users
    ///
    /// # Example
    ///
    /// ```rust
    /// let users = client.list_users(Some(20), Some(0)).await?;
    /// for user in users {
    ///     println!("{}: {}", user.id, user.name);
    /// }
    /// ```
    pub async fn list_users(
        &self,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Result<Vec<User>> {
        let limit = limit.unwrap_or(10);
        let offset = offset.unwrap_or(0);

        let url = format!(
            "{}/users?limit={}&offset={}",
            self.base_url, limit, offset
        );

        let mut request = self.http_client.get(&url);
        if let Some(key) = &self.api_key {
            request = request.header("Authorization", format!("Bearer {}", key));
        }

        let response = request.send().await?;

        if response.status().is_success() {
            let users = response.json::<Vec<User>>().await?;
            Ok(users)
        } else {
            let error = response.json::<ApiError>().await?;
            Err(Error::ApiError {
                status: error.code.parse().unwrap_or(500),
                message: error.message,
            })
        }
    }

    /// Create a new user
    ///
    /// # Arguments
    ///
    /// * `request` - The user creation request
    ///
    /// # Returns
    ///
    /// Returns the created user
    ///
    /// # Errors
    ///
    /// * `Error::ValidationError` - If the request is invalid
    /// * `Error::ApiError` - If the API returns an error
    ///
    /// # Example
    ///
    /// ```rust
    /// let request = UserCreate::new("John Doe", "john@example.com")
    ///     .bio("Software developer")
    ///     .age(30);
    ///
    /// let user = client.create_user(request).await?;
    /// println!("Created user: {}", user.id);
    /// ```
    pub async fn create_user(&self, request: UserCreate) -> Result<User> {
        request.validate()?;

        let url = format!("{}/users", self.base_url);

        let mut http_request = self.http_client.post(&url).json(&request);
        if let Some(key) = &self.api_key {
            http_request = http_request.header("Authorization", format!("Bearer {}", key));
        }

        let response = http_request.send().await?;

        if response.status().is_success() {
            let user = response.json::<User>().await?;
            Ok(user)
        } else {
            let error = response.json::<ApiError>().await?;
            Err(Error::ApiError {
                status: error.code.parse().unwrap_or(500),
                message: error.message,
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_user_create_validation() {
        let request = UserCreate::new("John", "john@example.com");
        assert!(request.validate().is_ok());

        let invalid = UserCreate::new("", "john@example.com");
        assert!(invalid.validate().is_err());
    }
}
```

### lib.rs
```rust
//! User API Client
//!
//! This crate provides a type-safe, async Rust client for the User API.
//!
//! # Example
//!
//! ```rust
//! use user_api::{Client, UserCreate};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = Client::new("https://api.example.com")
//!         .with_api_key("sk-...");
//!
//!     // Get a user
//!     let user = client.get_user("user_123").await?;
//!     println!("User: {}", user.name);
//!
//!     // Create a user
//!     let request = UserCreate::new("Jane Doe", "jane@example.com")
//!         .age(25);
//!     let new_user = client.create_user(request).await?;
//!     println!("Created: {}", new_user.id);
//!
//!     Ok(())
//! }
//! ```

mod client;
mod error;
pub mod types;

pub use client::Client;
pub use error::{Error, Result};
pub use types::*;
```

---

## 2. TypeScript Generated Code

### types/user.ts
```typescript
/**
 * User model
 */
export interface User {
  /** Unique identifier for the user */
  id: string;

  /** User's full name */
  name: string;

  /** User's email address */
  email: string;

  /** User's biography */
  bio?: string | null;

  /** User's age */
  age?: number | null;

  /** Timestamp when the user was created */
  createdAt: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Request body for creating a user
 */
export interface UserCreate {
  /** User's full name (1-100 characters) */
  name: string;

  /** User's email address */
  email: string;

  /** User's biography */
  bio?: string;

  /** User's age (0-150) */
  age?: number;
}

/**
 * API error response
 */
export interface ApiError {
  /** Error message */
  message: string;

  /** Error code */
  code: string;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Validate a UserCreate request
 *
 * @param request - The request to validate
 * @throws {ValidationError} If the request is invalid
 */
export function validateUserCreate(request: UserCreate): void {
  if (request.name.length < 1 || request.name.length > 100) {
    throw new ValidationError('name', 'must be 1-100 characters');
  }

  if (request.age !== undefined && (request.age < 0 || request.age > 150)) {
    throw new ValidationError('age', 'must be 0-150');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    throw new ValidationError('email', 'must be a valid email address');
  }
}
```

### errors.ts
```typescript
/**
 * Base error class for API errors
 */
export class ApiException extends Error {
  constructor(
    public status: number,
    public message: string,
    public response?: ApiError
  ) {
    super(`API Error ${status}: ${message}`);
    this.name = 'ApiException';
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(`Validation error on ${field}: ${message}`);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
```

### client.ts
```typescript
import { User, UserCreate, ApiError, validateUserCreate } from './types';
import { ApiException, NetworkError } from './errors';

/**
 * Configuration options for the client
 */
export interface ClientConfig {
  /** Base URL for the API */
  baseUrl: string;

  /** API key for authentication */
  apiKey?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Options for list operations
 */
export interface ListUsersOptions {
  /** Maximum number of users to return */
  limit?: number;

  /** Number of users to skip */
  offset?: number;

  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * HTTP client for the User API
 */
export class Client {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly fetchFn: typeof fetch;

  /**
   * Create a new API client
   *
   * @param config - Client configuration
   */
  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
    this.fetchFn = config.fetch ?? fetch;
  }

  /**
   * Get a user by ID
   *
   * @param id - The user's unique identifier
   * @param options - Request options
   * @returns The user object
   * @throws {ApiException} When the API returns an error
   * @throws {NetworkError} When the network request fails
   *
   * @example
   * ```typescript
   * const user = await client.getUser('user_123');
   * console.log(user.name);
   * ```
   */
  async getUser(id: string, options?: { signal?: AbortSignal }): Promise<User> {
    const url = `${this.baseUrl}/users/${encodeURIComponent(id)}`;
    return this.request<User>('GET', url, { signal: options?.signal });
  }

  /**
   * List users with pagination
   *
   * @param options - List options
   * @returns Array of users
   * @throws {ApiException} When the API returns an error
   *
   * @example
   * ```typescript
   * const users = await client.listUsers({ limit: 20, offset: 0 });
   * for (const user of users) {
   *   console.log(user.name);
   * }
   * ```
   */
  async listUsers(options: ListUsersOptions = {}): Promise<User[]> {
    const { limit = 10, offset = 0, signal } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const url = `${this.baseUrl}/users?${params}`;
    return this.request<User[]>('GET', url, { signal });
  }

  /**
   * Create a new user
   *
   * @param request - User creation request
   * @param options - Request options
   * @returns The created user
   * @throws {ValidationError} When the request is invalid
   * @throws {ApiException} When the API returns an error
   *
   * @example
   * ```typescript
   * const user = await client.createUser({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   age: 30,
   * });
   * console.log('Created:', user.id);
   * ```
   */
  async createUser(
    request: UserCreate,
    options?: { signal?: AbortSignal }
  ): Promise<User> {
    validateUserCreate(request);

    const url = `${this.baseUrl}/users`;
    return this.request<User>('POST', url, {
      body: JSON.stringify(request),
      signal: options?.signal,
    });
  }

  /**
   * Internal request method
   */
  private async request<T>(
    method: string,
    url: string,
    options?: {
      body?: string;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: options?.body,
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
          code: response.status.toString(),
        }));

        throw new ApiException(response.status, error.message, error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new NetworkError('Network request failed', error);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

### index.ts
```typescript
/**
 * User API Client
 *
 * Type-safe TypeScript client for the User API.
 *
 * @example
 * ```typescript
 * import { Client } from 'user-api-client';
 *
 * const client = new Client({
 *   baseUrl: 'https://api.example.com',
 *   apiKey: 'sk-...',
 * });
 *
 * const user = await client.getUser('user_123');
 * console.log(user.name);
 * ```
 *
 * @packageDocumentation
 */

export { Client } from './client';
export type { ClientConfig, ListUsersOptions } from './client';
export type { User, UserCreate, ApiError } from './types';
export { ApiException, ValidationError, NetworkError } from './errors';
```

---

## 3. Python Generated Code

### types/user.py
```python
"""User API types"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class User:
    """User model"""

    id: str
    """Unique identifier for the user"""

    name: str
    """User's full name"""

    email: str
    """User's email address"""

    created_at: datetime
    """Timestamp when the user was created"""

    bio: Optional[str] = None
    """User's biography"""

    age: Optional[int] = None
    """User's age"""

    metadata: Dict[str, Any] = field(default_factory=dict)
    """Additional metadata"""


@dataclass
class UserCreate:
    """Request body for creating a user"""

    name: str
    """User's full name (1-100 characters)"""

    email: str
    """User's email address"""

    bio: Optional[str] = None
    """User's biography"""

    age: Optional[int] = None
    """User's age (0-150)"""

    def validate(self) -> None:
        """Validate the request

        Raises:
            ValidationError: If the request is invalid
        """
        from ..errors import ValidationError

        if not self.name or len(self.name) > 100:
            raise ValidationError("name", "must be 1-100 characters")

        if self.age is not None and (self.age < 0 or self.age > 150):
            raise ValidationError("age", "must be 0-150")

        # Email validation
        import re
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, self.email):
            raise ValidationError("email", "must be a valid email address")


@dataclass
class ApiError:
    """API error response"""

    message: str
    """Error message"""

    code: str
    """Error code"""

    details: Dict[str, Any] = field(default_factory=dict)
    """Additional error details"""
```

### errors.py
```python
"""Error types for the User API client"""

from typing import Optional


class ApiException(Exception):
    """Base exception for API errors"""

    def __init__(
        self,
        message: str,
        status: Optional[int] = None,
        response: Optional[dict] = None
    ):
        self.message = message
        self.status = status
        self.response = response
        super().__init__(self.message)


class ValidationError(ApiException):
    """Raised when request validation fails"""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(f"Validation error on {field}: {message}")


class NetworkError(ApiException):
    """Raised when network request fails"""

    def __init__(self, message: str, cause: Optional[Exception] = None):
        self.cause = cause
        super().__init__(message)
```

### client.py
```python
"""Async HTTP client for the User API"""

import asyncio
import aiohttp
from typing import List, Optional, Dict, Any
from datetime import datetime

from .types import User, UserCreate, ApiError
from .errors import ApiException, NetworkError


class Client:
    """Async HTTP client for the User API

    Example:
        >>> async with Client("https://api.example.com", api_key="sk-...") as client:
        ...     user = await client.get_user("user_123")
        ...     print(user.name)
    """

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0
    ):
        """Initialize the client

        Args:
            base_url: Base URL for the API
            api_key: API key for authentication
            timeout: Request timeout in seconds
        """
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
        """Get a user by ID

        Args:
            user_id: The user's unique identifier

        Returns:
            The user object

        Raises:
            ApiException: If the API returns an error
            NetworkError: If the network request fails

        Example:
            >>> user = await client.get_user("user_123")
            >>> print(user.name)
        """
        url = f"{self.base_url}/users/{user_id}"
        data = await self._request("GET", url)

        return User(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            bio=data.get("bio"),
            age=data.get("age"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            metadata=data.get("metadata", {}),
        )

    async def list_users(
        self,
        limit: int = 10,
        offset: int = 0
    ) -> List[User]:
        """List users with pagination

        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip

        Returns:
            List of users

        Example:
            >>> users = await client.list_users(limit=20, offset=0)
            >>> for user in users:
            ...     print(user.name)
        """
        url = f"{self.base_url}/users"
        params = {"limit": limit, "offset": offset}

        data = await self._request("GET", url, params=params)

        return [
            User(
                id=item["id"],
                name=item["name"],
                email=item["email"],
                bio=item.get("bio"),
                age=item.get("age"),
                created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")),
                metadata=item.get("metadata", {}),
            )
            for item in data
        ]

    async def create_user(self, request: UserCreate) -> User:
        """Create a new user

        Args:
            request: User creation request

        Returns:
            The created user

        Raises:
            ValidationError: If the request is invalid
            ApiException: If the API returns an error

        Example:
            >>> request = UserCreate(
            ...     name="John Doe",
            ...     email="john@example.com",
            ...     age=30
            ... )
            >>> user = await client.create_user(request)
            >>> print(f"Created: {user.id}")
        """
        request.validate()

        url = f"{self.base_url}/users"
        body = {
            "name": request.name,
            "email": request.email,
        }

        if request.bio is not None:
            body["bio"] = request.bio
        if request.age is not None:
            body["age"] = request.age

        data = await self._request("POST", url, json=body)

        return User(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            bio=data.get("bio"),
            age=data.get("age"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            metadata=data.get("metadata", {}),
        )

    async def _request(
        self,
        method: str,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None
    ) -> Any:
        """Internal request method"""
        if self._session is None:
            self._session = aiohttp.ClientSession(timeout=self.timeout)

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            async with self._session.request(
                method,
                url,
                params=params,
                json=json,
                headers=headers
            ) as response:
                if response.status >= 400:
                    error_data = await response.json()
                    raise ApiException(
                        message=error_data.get("message", "Unknown error"),
                        status=response.status,
                        response=error_data
                    )

                return await response.json()

        except aiohttp.ClientError as e:
            raise NetworkError(f"Network request failed: {e}", cause=e)
```

### __init__.py
```python
"""User API Client

Type-safe, async Python client for the User API.

Example:
    >>> from user_api_client import Client, UserCreate
    >>>
    >>> async def main():
    ...     async with Client("https://api.example.com", api_key="sk-...") as client:
    ...         user = await client.get_user("user_123")
    ...         print(user.name)
    >>>
    >>> import asyncio
    >>> asyncio.run(main())
"""

from .client import Client
from .types import User, UserCreate, ApiError
from .errors import ApiException, ValidationError, NetworkError

__all__ = [
    "Client",
    "User",
    "UserCreate",
    "ApiError",
    "ApiException",
    "ValidationError",
    "NetworkError",
]

__version__ = "1.0.0"
```

---

## 4. Go Generated Code

### types/user.go
```go
package types

import (
    "encoding/json"
    "fmt"
    "time"
)

// User represents a user in the system
type User struct {
    // ID is the unique identifier for the user
    ID string `json:"id"`

    // Name is the user's full name
    Name string `json:"name"`

    // Email is the user's email address
    Email string `json:"email"`

    // Bio is the user's biography
    Bio *string `json:"bio,omitempty"`

    // Age is the user's age
    Age *int `json:"age,omitempty"`

    // CreatedAt is the timestamp when the user was created
    CreatedAt time.Time `json:"created_at"`

    // Metadata contains additional user metadata
    Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// UserCreate represents a request to create a new user
type UserCreate struct {
    // Name is the user's full name (1-100 characters)
    Name string `json:"name"`

    // Email is the user's email address
    Email string `json:"email"`

    // Bio is the user's biography
    Bio *string `json:"bio,omitempty"`

    // Age is the user's age (0-150)
    Age *int `json:"age,omitempty"`
}

// Validate validates the UserCreate request
func (u *UserCreate) Validate() error {
    if len(u.Name) < 1 || len(u.Name) > 100 {
        return &ValidationError{
            Field:   "name",
            Message: "must be 1-100 characters",
        }
    }

    if u.Age != nil && (*u.Age < 0 || *u.Age > 150) {
        return &ValidationError{
            Field:   "age",
            Message: "must be 0-150",
        }
    }

    // Email validation (simple check)
    if len(u.Email) == 0 || !emailRegex.MatchString(u.Email) {
        return &ValidationError{
            Field:   "email",
            Message: "must be a valid email address",
        }
    }

    return nil
}

// APIError represents an error response from the API
type APIError struct {
    // Message is the error message
    Message string `json:"message"`

    // Code is the error code
    Code string `json:"code"`

    // Details contains additional error details
    Details map[string]interface{} `json:"details,omitempty"`
}

// Helper functions for creating pointer values
func String(s string) *string {
    return &s
}

func Int(i int) *int {
    return &i
}

// ValidationError represents a validation error
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
```

### client.go
```go
package userclient

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "time"

    "github.com/example/user-api-client/types"
)

// Client is the HTTP client for the User API
type Client struct {
    httpClient *http.Client
    baseURL    string
    apiKey     string
}

// ClientOption is a functional option for configuring the client
type ClientOption func(*Client)

// WithAPIKey sets the API key for authentication
func WithAPIKey(apiKey string) ClientOption {
    return func(c *Client) {
        c.apiKey = apiKey
    }
}

// WithTimeout sets the HTTP client timeout
func WithTimeout(timeout time.Duration) ClientOption {
    return func(c *Client) {
        c.httpClient.Timeout = timeout
    }
}

// WithHTTPClient sets a custom HTTP client
func WithHTTPClient(httpClient *http.Client) ClientOption {
    return func(c *Client) {
        c.httpClient = httpClient
    }
}

// NewClient creates a new User API client
//
// Example:
//
//  client := NewClient(
//      "https://api.example.com",
//      WithAPIKey("sk-..."),
//      WithTimeout(60*time.Second),
//  )
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

// GetUser retrieves a user by ID
//
// Example:
//
//  user, err := client.GetUser(ctx, "user_123")
//  if err != nil {
//      return err
//  }
//  fmt.Println(user.Name)
func (c *Client) GetUser(ctx context.Context, id string) (*types.User, error) {
    url := fmt.Sprintf("%s/users/%s", c.baseURL, id)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    c.setHeaders(req)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, &NetworkError{
            Message: "network request failed",
            Cause:   err,
        }
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        var apiErr types.APIError
        if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
            body, _ := io.ReadAll(resp.Body)
            return nil, &APIError{
                StatusCode: resp.StatusCode,
                Message:    string(body),
            }
        }

        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    apiErr.Message,
        }
    }

    var user types.User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return &user, nil
}

// ListUsers retrieves a list of users with pagination
//
// Example:
//
//  users, err := client.ListUsers(ctx, 20, 0)
//  if err != nil {
//      return err
//  }
//  for _, user := range users {
//      fmt.Println(user.Name)
//  }
func (c *Client) ListUsers(
    ctx context.Context,
    limit, offset int,
) ([]types.User, error) {
    params := url.Values{}
    params.Set("limit", fmt.Sprintf("%d", limit))
    params.Set("offset", fmt.Sprintf("%d", offset))

    url := fmt.Sprintf("%s/users?%s", c.baseURL, params.Encode())

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    c.setHeaders(req)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, &NetworkError{
            Message: "network request failed",
            Cause:   err,
        }
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        var apiErr types.APIError
        if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
            body, _ := io.ReadAll(resp.Body)
            return nil, &APIError{
                StatusCode: resp.StatusCode,
                Message:    string(body),
            }
        }

        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    apiErr.Message,
        }
    }

    var users []types.User
    if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return users, nil
}

// CreateUser creates a new user
//
// Example:
//
//  request := &types.UserCreate{
//      Name:  "John Doe",
//      Email: "john@example.com",
//      Age:   types.Int(30),
//  }
//
//  user, err := client.CreateUser(ctx, request)
//  if err != nil {
//      return err
//  }
//  fmt.Printf("Created: %s\n", user.ID)
func (c *Client) CreateUser(
    ctx context.Context,
    request *types.UserCreate,
) (*types.User, error) {
    if err := request.Validate(); err != nil {
        return nil, err
    }

    body, err := json.Marshal(request)
    if err != nil {
        return nil, fmt.Errorf("marshal request: %w", err)
    }

    url := fmt.Sprintf("%s/users", c.baseURL)

    req, err := http.NewRequestWithContext(
        ctx,
        http.MethodPost,
        url,
        bytes.NewReader(body),
    )
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    c.setHeaders(req)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, &NetworkError{
            Message: "network request failed",
            Cause:   err,
        }
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        var apiErr types.APIError
        if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
            body, _ := io.ReadAll(resp.Body)
            return nil, &APIError{
                StatusCode: resp.StatusCode,
                Message:    string(body),
            }
        }

        return nil, &APIError{
            StatusCode: resp.StatusCode,
            Message:    apiErr.Message,
        }
    }

    var user types.User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    return &user, nil
}

func (c *Client) setHeaders(req *http.Request) {
    req.Header.Set("Content-Type", "application/json")
    if c.apiKey != "" {
        req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
    }
}

// APIError represents an error returned by the API
type APIError struct {
    StatusCode int
    Message    string
}

func (e *APIError) Error() string {
    return fmt.Sprintf("API error %d: %s", e.StatusCode, e.Message)
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
```

---

## Code Generation Patterns Summary

### Common Patterns Across All Languages

1. **Type Generation**:
   - Required fields are non-nullable
   - Optional fields use language-appropriate nullable types
   - Validation logic is generated for constraints
   - Documentation is extracted from OpenAPI descriptions

2. **Client Structure**:
   - Constructor/builder pattern for configuration
   - Authentication handled via headers
   - Timeout support
   - Proper error handling for HTTP errors

3. **Method Generation**:
   - One method per OpenAPI operation
   - Path parameters as required arguments
   - Query parameters as optional arguments or options objects
   - Request bodies as strongly-typed parameters
   - Return types match response schemas

4. **Error Handling**:
   - Network errors separate from API errors
   - Validation errors for client-side validation
   - Proper status code handling

5. **Documentation**:
   - Operations documented with examples
   - Parameters documented with descriptions
   - Error conditions documented

This approach ensures that generated code is:
- **Type-safe**: Leveraging each language's type system
- **Idiomatic**: Following language-specific conventions
- **Documented**: Including comprehensive inline documentation
- **Testable**: Structured for easy testing
- **Production-ready**: With proper error handling and validation
