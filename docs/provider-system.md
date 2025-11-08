# Multi-Provider Parser System

## Overview

The LLM-Forge multi-provider parser system provides a unified interface for parsing responses from all major LLM APIs. It automatically detects the provider, normalizes responses to a canonical format, and provides type-safe access to response data.

## Supported Providers

- ✅ **OpenAI** - GPT-4, GPT-3.5, O1 models
- ✅ **Anthropic** - Claude 3 (Opus, Sonnet, Haiku)
- ✅ **Mistral** - Mistral-7B, Mixtral models
- ✅ **Google Gemini** - Gemini 1.5 Pro/Flash
- ✅ **Cohere** - Command R/R+ models
- ✅ **xAI** - Grok models
- ✅ **Perplexity** - Online models
- ✅ **Together.ai** - Open source models
- ✅ **Fireworks.ai** - Fast inference
- ✅ **AWS Bedrock** - Multi-model platform
- ✅ **Ollama** - Local models
- ✅ **Hugging Face** - Community models (Mistral, Falcon, Zephyr, Gemma, LLaMA, StarCoder)

## Architecture

### Core Components

1. **Unified Response Schema** (`src/types/unified-response.ts`)
   - Canonical format for all provider responses
   - Type-safe interfaces
   - Provider-agnostic data structures

2. **Base Provider Parser** (`src/providers/base-provider.ts`)
   - Abstract base class for all parsers
   - Common helper methods
   - Validation framework

3. **Provider Registry** (`src/providers/provider-registry.ts`)
   - Centralized parser management
   - Automatic provider detection
   - Dynamic parser selection

4. **Model Registry** (`src/providers/model-registry.ts`)
   - Centralized tracking of all LLM models
   - Model metadata, capabilities, and pricing
   - Search and lookup functionality
   - Version detection and tracking

5. **Provider Implementations**
   - Individual parsers for each provider
   - Provider-specific response handling
   - Metadata and capabilities

## Usage

### Basic Usage

```typescript
import { parseResponse, registerAllProviders } from '@llm-dev-ops/llm-forge/providers';

// Auto-register all providers
registerAllProviders();

// Parse any provider response with automatic detection
const response = await openaiClient.chat.completions.create({...});
const result = await parseResponse(response);

if (result.success) {
  console.log('Provider:', result.response.provider);
  console.log('Model:', result.response.model.id);
  console.log('Messages:', result.response.messages);
  console.log('Usage:', result.response.usage);
}
```

### Explicit Provider

```typescript
import { parseResponse, Provider } from '@llm-dev-ops/llm-forge/providers';

const result = await parseResponse(response, Provider.OpenAI);
```

### Provider Registry

```typescript
import { getRegistry, Provider } from '@llm-dev-ops/llm-forge/providers';

const registry = getRegistry();

// Get all registered providers
const providers = registry.getProviders();
console.log('Available providers:', providers);

// Get provider metadata
const metadata = registry.getMetadata(Provider.OpenAI);
console.log('OpenAI capabilities:', metadata.capabilities);

// Detect provider from response
const detection = registry.detectProvider(response);
console.log('Detected provider:', detection.provider);
```

### Model Registry

```typescript
import { getModelRegistry, getModel, searchModels } from '@llm-dev-ops/llm-forge/providers';

const modelRegistry = getModelRegistry();

// Get specific model details
const model = getModel('gpt-4-turbo-2024-04-09', 'openai');
console.log('Model:', model?.displayName);
console.log('Context window:', model?.contextWindow);
console.log('Pricing:', model?.pricing);

// Search for models
const claudeModels = searchModels({
  provider: 'anthropic',
  family: 'claude-3',
});
console.log('Claude 3 models:', claudeModels.map(m => m.displayName));

// Find models by capability
const visionModels = searchModels({
  capabilities: { vision: true }
});

// Find affordable models
const budgetModels = searchModels({
  maxCost: 5.0, // Max output cost per 1M tokens
  deprecated: false,
});

// Detect provider from model ID
const provider = modelRegistry.detectProviderFromModel('claude-3-opus-20240229');
console.log('Provider:', provider); // 'anthropic'
```

### Individual Provider

```typescript
import { OpenAIProvider } from '@llm-dev-ops/llm-forge/providers';

const parser = new OpenAIProvider();
const result = await parser.parse(openaiResponse);

if (result.success) {
  console.log('Parsed OpenAI response:', result.response);
}
```

## Unified Response Format

### UnifiedResponse

```typescript
interface UnifiedResponse {
  id: string;
  provider: Provider;
  model: ModelInfo;
  messages: UnifiedMessage[];
  stopReason: StopReason;
  usage: TokenUsage;
  metadata: Record<string, unknown>;
  error?: UnifiedError;
  raw?: unknown;
}
```

### UnifiedMessage

```typescript
interface UnifiedMessage {
  role: MessageRole; // system, user, assistant, tool
  content: Content[]; // text, image, tool_use, etc.
  name?: string;
  toolCallId?: string;
}
```

### Content Types

```typescript
type Content =
  | TextContent      // Plain text
  | ImageContent     // Image data
  | ToolUseContent   // Tool/function call
  | ToolResultContent // Tool result
  | FunctionCallContent; // Legacy function call
```

### Token Usage

```typescript
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  metadata?: {
    cacheCreationInputTokens?: number;    // Anthropic
    cacheReadInputTokens?: number;        // Anthropic
    reasoningTokens?: number;             // OpenAI O1
    audioTokens?: number;                 // OpenAI
  };
}
```

## Provider Detection

The system automatically detects providers using multiple strategies:

1. **Header-based Detection** - Checks HTTP headers for provider-specific values
2. **URL-based Detection** - Analyzes API endpoint URLs
3. **Response Format Detection** - Examines response structure
4. **Model Name Detection** - Identifies provider from model name

### Detection Example

```typescript
const detection = registry.detectProvider(
  response,
  { 'openai-version': '2023-11-01' },  // headers
  'https://api.openai.com/v1/chat/completions'  // url
);

console.log('Provider:', detection.provider);
console.log('Confidence:', detection.confidence);
console.log('Method:', detection.method); // 'header', 'url', 'response_format', 'model_name'
```

## Provider Capabilities

Each provider exposes its capabilities:

```typescript
interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  toolUse: boolean;
  vision: boolean;
  jsonMode: boolean;
  systemMessages: boolean;
  maxContextWindow: number;
  maxOutputTokens: number;
  modalities: ('text' | 'image' | 'audio' | 'video')[];
}
```

### Example

```typescript
const metadata = registry.getMetadata(Provider.OpenAI);

console.log('Streaming:', metadata.capabilities.streaming); // true
console.log('Function calling:', metadata.capabilities.functionCalling); // true
console.log('Max context:', metadata.capabilities.maxContextWindow); // 128000
```

## Error Handling

### Validation Errors

```typescript
const result = await parser.parse(invalidResponse);

if (!result.success) {
  console.error('Parse errors:', result.errors);
  console.warn('Parse warnings:', result.warnings);
}
```

### Provider Errors

```typescript
if (result.response?.error) {
  console.error('Provider error:', {
    code: result.response.error.code,
    message: result.response.error.message,
    type: result.response.error.type,
  });
}
```

## Streaming Support

```typescript
import { parseStreamChunk } from '@llm-dev-ops/llm-forge/providers';

for await (const chunk of stream) {
  const result = await parseStreamChunk(chunk, Provider.OpenAI);

  if (result.success) {
    for (const streamChunk of result.response.chunks) {
      if (streamChunk.delta?.text) {
        process.stdout.write(streamChunk.delta.text);
      }
    }
  }
}
```

## Advanced Features

### Custom Provider Registration

```typescript
import { BaseProviderParser } from '@llm-dev-ops/llm-forge/providers';

class CustomProvider extends BaseProviderParser {
  constructor() {
    super('custom' as Provider);
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'custom' as Provider,
      name: 'Custom Provider',
      // ... metadata
    };
  }

  protected async parseResponse(response: unknown): Promise<UnifiedResponse> {
    // Custom parsing logic
  }

  // Implement other abstract methods...
}

// Register custom provider
const registry = getRegistry();
registry.register(new CustomProvider());
```

### Provider-Specific Metadata

```typescript
const result = await parseResponse(response);

// Access provider-specific metadata
console.log('Request ID:', result.response.metadata.requestId);
console.log('Latency:', result.response.metadata.latency);

// OpenAI specific
console.log('System fingerprint:', result.response.metadata.systemFingerprint);

// Anthropic specific
console.log('Stop sequence:', result.response.metadata.stopSequence);
```

### Raw Response Access

```typescript
const result = await parseResponse(response);

// Access original provider response
const rawResponse = result.response.raw;
```

## Benefits

1. **Unified Interface** - Single API for all providers
2. **Type Safety** - Full TypeScript types
3. **Automatic Detection** - No manual provider specification needed
4. **Extensible** - Easy to add new providers
5. **Production Ready** - Enterprise-grade error handling
6. **Provider Agnostic** - Switch providers without code changes

## Examples

### Multi-Provider Application

```typescript
import { parseResponse, registerAllProviders, Provider } from '@llm-dev-ops/llm-forge/providers';

registerAllProviders();

async function chat(providerResponse: unknown) {
  const result = await parseResponse(providerResponse);

  if (!result.success) {
    throw new Error(`Parse failed: ${result.errors.join(', ')}`);
  }

  const { provider, model, messages, usage } = result.response;

  console.log(`Response from ${provider} (${model.id}):`);
  for (const message of messages) {
    for (const content of message.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }
  }

  console.log(`Tokens: ${usage.inputTokens} in, ${usage.outputTokens} out`);
}

// Works with any provider
await chat(openaiResponse);
await chat(anthropicResponse);
await chat(geminiResponse);
```

### Provider Comparison

```typescript
const providers = [Provider.OpenAI, Provider.Anthropic, Provider.Google];

for (const provider of providers) {
  const metadata = registry.getMetadata(provider);
  console.log(`${metadata.name}:`);
  console.log(`  Max context: ${metadata.capabilities.maxContextWindow}`);
  console.log(`  Function calling: ${metadata.capabilities.functionCalling}`);
  console.log(`  Vision: ${metadata.capabilities.vision}`);
}
```

## Implementation Status

**Status:** ✅ **PRODUCTION READY**

- ✅ 12 provider parsers implemented (including Hugging Face)
- ✅ Unified response schema
- ✅ Provider registry with auto-detection
- ✅ Model registry with 50+ models tracked
- ✅ Comprehensive test fixtures
- ✅ Full TypeScript types
- ✅ Error handling and validation
- ✅ Streaming support
- ✅ Enterprise-grade architecture
- ✅ 41/41 tests passing

## API Reference

### Main Exports

- `parseResponse(response, provider?, headers?, url?)` - Parse any provider response
- `parseStreamChunk(chunk, provider?, headers?)` - Parse streaming chunk
- `registerAllProviders()` - Register all built-in providers
- `getRegistry()` - Get global provider registry
- `Provider` - Provider enum
- `MessageRole` - Message role enum
- `StopReason` - Stop reason enum
- `ContentType` - Content type enum

### Provider Classes

- `OpenAIProvider`
- `AnthropicProvider`
- `MistralProvider`
- `GoogleProvider`
- `CohereProvider`
- `XAIProvider`
- `PerplexityProvider`
- `TogetherProvider`
- `FireworksProvider`
- `BedrockProvider`
- `OllamaProvider`
- `HuggingFaceProvider`

### Base Classes

- `BaseProviderParser` - Abstract base for custom providers
- `ProviderRegistry` - Provider management

## Future Enhancements

While production-ready, potential enhancements include:

1. **Additional Providers**
   - Replicate
   - HuggingFace Inference
   - AI21 Labs
   - Aleph Alpha

2. **Advanced Features**
   - Response caching
   - Rate limit tracking
   - Cost calculation
   - Provider health monitoring

3. **Developer Tools**
   - Response debugging
   - Schema validation
   - Provider testing utilities
   - Mock providers for testing

---

**Version:** 1.0.0
**Status:** Production Ready
**License:** Apache-2.0
