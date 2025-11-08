# Provider API Comparison Matrix

**Version:** 1.0
**Date:** November 7, 2025

---

## Overview

This document provides a detailed comparison matrix of LLM provider APIs to inform SDK design decisions.

---

## Authentication Comparison

| Provider | Method | Header/Param | Format | Notes |
|----------|--------|--------------|--------|-------|
| OpenAI | Bearer Token | `Authorization` header | `Bearer sk-xxxxx` | Standard OAuth-style |
| Anthropic | Custom Header | `x-api-key` header | `sk-ant-xxxxx` | Provider-specific |
| Google Gemini | API Key | Query param or header | `?key=xxxxx` or `x-goog-api-key` | Dual option |
| Cohere | Bearer Token | `Authorization` header | `Bearer xxxxx` | Standard OAuth-style |
| Azure OpenAI | Multiple | `api-key` header or Azure AD | Various | Enterprise options |
| Mistral | Bearer Token | `Authorization` header | `Bearer xxxxx` | Standard OAuth-style |

**SDK Implications:**
- Need flexible authentication strategy pattern
- Support environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.
- Azure requires special handling for managed identity

---

## Request Format Comparison

### Chat Completion Structure

#### OpenAI / Azure OpenAI
```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "stream": false
}
```

#### Anthropic
```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "system": "You are helpful",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "stream": false
}
```

**Key Difference:** System prompt is separate parameter, not in messages array

#### Google Gemini
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello"}]
    }
  ],
  "generationConfig": {
    "temperature": 0.7
  },
  "safetySettings": [...]
}
```

**Key Differences:**
- Different structure (`contents` vs `messages`)
- Different role names (`model` vs `assistant`)
- Configuration in separate objects
- Required safety settings

#### Cohere
```json
{
  "model": "command",
  "message": "Hello",
  "chat_history": [],
  "temperature": 0.7,
  "stream": false
}
```

**Key Difference:** Message history separate from current message

#### Mistral
```json
{
  "model": "mistral-large-latest",
  "messages": [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "stream": false
}
```

**Note:** Very similar to OpenAI format

---

## Response Format Comparison

### Standard Response

#### OpenAI / Azure OpenAI
```json
{
  "id": "chatcmpl-xxxxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 9,
    "total_tokens": 19
  }
}
```

#### Anthropic
```json
{
  "id": "msg_xxxxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help?"
    }
  ],
  "model": "claude-sonnet-4-5",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 9
  }
}
```

**Key Differences:**
- Content is array of content blocks
- Different token field names
- Different stop reason names

#### Google Gemini
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{"text": "Hello! How can I help?"}],
        "role": "model"
      },
      "finishReason": "STOP",
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 9,
    "totalTokenCount": 19
  }
}
```

**Key Differences:**
- Multiple candidates possible
- Safety ratings included
- Different structure entirely
- Role is "model" not "assistant"

---

## Streaming Format Comparison

### Server-Sent Events (SSE)

#### OpenAI / Azure OpenAI
```
data: {"id":"chatcmpl-xxxxx","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxxxx","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxxxx","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

**Format:** JSON chunks with `delta` objects, ends with `[DONE]`

#### Anthropic
```
event: message_start
data: {"type":"message_start","message":{"id":"msg_xxxxx","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-5"}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":9}}

event: message_stop
data: {"type":"message_stop"}
```

**Format:** Named events with typed data, more granular control

#### Google Gemini
```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":9}}

data: {"candidates":[{"content":{"parts":[{"text":" there"}],"role":"model"}}]}
```

**Format:** JSON chunks similar to OpenAI but with Gemini structure

---

## Error Format Comparison

### Error Responses

#### OpenAI / Azure OpenAI
```json
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

**Status Codes:** 400, 401, 403, 429, 500, 503

#### Anthropic
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key"
  }
}
```

**Status Codes:** 400, 401, 403, 429, 500, 529

#### Google Gemini
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid",
    "status": "UNAUTHENTICATED"
  }
}
```

**Status Codes:** Standard HTTP codes

#### Azure OpenAI (Azure-specific)
```json
{
  "error": {
    "code": "InvalidApiKey",
    "message": "Invalid API key provided",
    "innererror": {
      "code": "InvalidCredentials"
    }
  }
}
```

**Note:** Nested error codes for Azure services

---

## Rate Limiting Comparison

| Provider | Headers | Limits |
|----------|---------|--------|
| OpenAI | `x-ratelimit-limit-requests`<br>`x-ratelimit-remaining-requests`<br>`x-ratelimit-reset-requests`<br>`x-ratelimit-limit-tokens`<br>`x-ratelimit-remaining-tokens` | RPM, TPM by tier |
| Anthropic | `anthropic-ratelimit-requests-limit`<br>`anthropic-ratelimit-requests-remaining`<br>`anthropic-ratelimit-tokens-limit`<br>`anthropic-ratelimit-tokens-remaining`<br>`retry-after` | RPM, TPM by tier |
| Google Gemini | `x-ratelimit-limit`<br>`x-ratelimit-remaining`<br>`x-ratelimit-reset` | QPM, QPD by model |
| Cohere | `x-ratelimit-limit`<br>`x-ratelimit-remaining` | Requests per minute |
| Azure OpenAI | `x-ratelimit-remaining-requests`<br>`x-ratelimit-remaining-tokens`<br>`retry-after-ms` | Configurable per deployment |
| Mistral | Standard rate limit headers | RPM by tier |

**SDK Implications:**
- Parse provider-specific headers
- Normalize to common interface
- Implement `429` retry with backoff
- Optional: automatic throttling

---

## Context Window Comparison

| Provider | Model | Context Window | Max Output |
|----------|-------|----------------|------------|
| OpenAI | GPT-4o | 128K tokens | 4K tokens |
| OpenAI | GPT-4o mini | 128K tokens | 16K tokens |
| OpenAI | o1 | 200K tokens | 100K tokens |
| Anthropic | Claude Sonnet 4.5 | 200K tokens | 8K tokens |
| Anthropic | Claude Opus 4.1 | 200K tokens | 8K tokens |
| Google | Gemini 2.5 Pro | 2M tokens | Variable |
| Google | Gemini 2.5 Flash | 1M tokens | Variable |
| Cohere | Command R+ | 128K tokens | 4K tokens |
| Mistral | Mistral Large | 128K tokens | 4K tokens |
| Azure OpenAI | (same as OpenAI models) | Varies by model | Varies |

**SDK Implications:**
- Validate token counts before requests
- Provide token counting utilities
- Warn on approaching limits

---

## Feature Support Matrix

| Feature | OpenAI | Anthropic | Gemini | Cohere | Azure OpenAI | Mistral |
|---------|--------|-----------|--------|--------|--------------|---------|
| **Chat Completion** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Function Calling** | ✅ (tools) | ✅ (tools) | ✅ | ✅ | ✅ | ✅ |
| **Vision (Image)** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Audio Input** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Video Input** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Embeddings** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Fine-tuning** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Batch API** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Assistants API** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Prompt Caching** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **JSON Schema** | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Computer Use** | ❌ | ✅ (beta) | ❌ | ❌ | ❌ | ❌ |
| **Agent Framework** | ✅ | ✅ (skills) | ❌ | ❌ | ✅ | ✅ |
| **Safety Filtering** | ✅ | ✅ | ✅ | ✅ | ✅ (enhanced) | ✅ |
| **Grounding/RAG** | ❌ | ✅ (citations) | ✅ (Search) | ✅ (rerank) | ❌ | ❌ |

**Legend:**
- ✅ Supported
- ❌ Not supported
- (beta) Beta feature

---

## Versioning Strategies

| Provider | Strategy | Format | Example |
|----------|----------|--------|---------|
| OpenAI | URL path | `/v1/...` | `/v1/chat/completions` |
| Anthropic | Header-based | `anthropic-version` | `2025-01-24` |
| Google Gemini | Model-based | Model name | `gemini-2.5-pro` |
| Cohere | URL path | `/v1/...` | `/v1/chat` |
| Azure OpenAI | Query param | `api-version` | `?api-version=2024-10-21` |
| Mistral | URL path | `/v1/...` | `/v1/chat/completions` |

**SDK Implications:**
- Configurable API version per provider
- Default to latest stable
- Deprecation warnings for old versions
- Migration helpers

---

## Pricing Model Comparison

| Provider | Pricing Unit | Input Cost | Output Cost | Notes |
|----------|--------------|------------|-------------|-------|
| OpenAI | Per 1M tokens | Varies by model | Varies by model | Output usually 3x input |
| Anthropic | Per 1M tokens | Varies by model | Varies by model | Prompt caching discounts |
| Google Gemini | Per 1M tokens | Varies by model | Varies by model | Free tier available |
| Cohere | Per 1M tokens | Varies by model | Varies by model | Rerank priced separately |
| Azure OpenAI | Per 1K tokens | Same as OpenAI | Same as OpenAI | Regional variations |
| Mistral | Per 1M tokens | Varies by model | Varies by model | Competitive pricing |

**SDK Implications:**
- Optional cost tracking utilities
- Token usage reporting
- Estimated cost calculation

---

## Multimodal Support Details

### Image Input Support

| Provider | Format | Max Size | URL Support | Base64 Support |
|----------|--------|----------|-------------|----------------|
| OpenAI (GPT-4o) | JPEG, PNG, GIF, WebP | 20MB | ✅ | ✅ |
| Anthropic (Claude) | JPEG, PNG, GIF, WebP | 5MB per image | ❌ | ✅ |
| Google Gemini | JPEG, PNG, WebP | 20MB | ✅ | ✅ |
| Cohere | N/A | N/A | ❌ | ❌ |
| Azure OpenAI | (same as OpenAI) | 20MB | ✅ | ✅ |
| Mistral | JPEG, PNG, WebP | 5MB | ✅ | ✅ |

### Audio Input Support

| Provider | Format | Max Duration | Streaming |
|----------|--------|--------------|-----------|
| OpenAI | MP3, WAV, M4A, WebM | 25MB file | ✅ (realtime) |
| Anthropic | N/A | N/A | ❌ |
| Google Gemini | WAV, MP3, FLAC | 20MB | ✅ (Live API) |
| Cohere | N/A | N/A | ❌ |
| Azure OpenAI | (same as OpenAI) | 25MB file | ✅ |
| Mistral | N/A | N/A | ❌ |

---

## Tool/Function Calling Comparison

### Definition Format

#### OpenAI
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get weather for location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {"type": "string"}
      },
      "required": ["location"]
    }
  }
}
```

#### Anthropic
```json
{
  "name": "get_weather",
  "description": "Get weather for location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {"type": "string"}
    },
    "required": ["location"]
  }
}
```

**Key Difference:** `input_schema` vs `parameters`, no wrapper `type: function`

#### Google Gemini
```json
{
  "functionDeclarations": [
    {
      "name": "get_weather",
      "description": "Get weather for location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string"}
        },
        "required": ["location"]
      }
    }
  ]
}
```

**Key Difference:** Wrapped in `functionDeclarations` array

---

## SDK Design Recommendations

Based on the above comparisons, the SDK should:

### 1. Abstraction Layer
- Common interface for all providers
- Provider-specific implementations
- Automatic format conversion

### 2. Configuration
```typescript
// Unified configuration
{
  provider: 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'azure-openai' | 'mistral',
  apiKey: string,
  baseUrl?: string,
  version?: string,
  options?: ProviderSpecificOptions
}
```

### 3. Request Normalization
```typescript
// Normalized request format
interface ChatRequest {
  model: string;
  messages: Message[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
  // Provider-specific options
  providerOptions?: Record<string, any>;
}
```

### 4. Response Normalization
```typescript
// Normalized response format
interface ChatResponse {
  id: string;
  model: string;
  message: Message;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  // Original provider response
  raw: any;
}
```

### 5. Error Normalization
```typescript
// Normalized error format
class LLMError extends Error {
  statusCode: number;
  errorType: 'auth' | 'rate_limit' | 'invalid_request' | 'server' | 'network';
  retryable: boolean;
  provider: string;
  raw: any;
}
```

### 6. Streaming Normalization
```typescript
// Normalized streaming interface
interface StreamChunk {
  id: string;
  model: string;
  delta: {
    role?: string;
    content?: string;
    toolCalls?: ToolCall[];
  };
  finishReason?: string;
  usage?: TokenUsage;
  raw: any;
}
```

---

## Implementation Priority

### Phase 1: Core Providers (P0)
1. OpenAI
2. Anthropic
3. Google Gemini
4. Azure OpenAI

### Phase 2: Additional Providers (P1)
5. Cohere
6. Mistral

### Phase 3: Future Providers (P2)
- Amazon Bedrock
- Hugging Face Inference API
- Together AI
- Perplexity AI
- Others as needed

---

## Testing Strategy

### Provider Compatibility Tests
- Run same test suite against all providers
- Verify normalization works correctly
- Test error handling per provider
- Validate streaming per provider

### Mock Servers
- Create provider-specific mock servers
- Use for unit tests
- Faster, cheaper than real API calls
- Deterministic responses

### Integration Tests
- Test against real APIs (limited)
- Verify actual behavior
- Catch API changes early
- Use in CI/CD sparingly (cost)

---

## Conclusion

The provider landscape is diverse but has common patterns:

**Similarities:**
- Chat completion paradigm
- Streaming with SSE
- Tool/function calling
- JSON request/response
- Token-based pricing

**Differences:**
- Authentication methods
- Request/response structure
- Error formats
- Versioning strategies
- Feature availability

**SDK Strategy:**
- Build abstraction layer for common patterns
- Provide provider-specific optimizations
- Normalize where possible, expose raw where needed
- Prioritize developer experience
- Maintain flexibility for new providers
