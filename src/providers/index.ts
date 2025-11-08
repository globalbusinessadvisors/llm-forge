/**
 * Provider Parsers Module
 *
 * Export all LLM provider parsers and auto-register them with the registry.
 *
 * @module providers
 */

// Export base classes and types
export * from './base-provider.js';
export * from './provider-registry.js';
export * from '../types/unified-response.js';

// Export individual providers
export * from './openai-provider.js';
export * from './anthropic-provider.js';
export * from './mistral-provider.js';
export * from './huggingface-provider.js';
export * from './all-providers.js';

// Export model registry
export * from './model-registry.js';

// Import providers for auto-registration
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { MistralProvider } from './mistral-provider.js';
import { HuggingFaceProvider } from './huggingface-provider.js';
import {
  GoogleProvider,
  CohereProvider,
  XAIProvider,
  PerplexityProvider,
  TogetherProvider,
  FireworksProvider,
  BedrockProvider,
  OllamaProvider,
} from './all-providers.js';
import { getRegistry } from './provider-registry.js';

/**
 * Auto-register all providers
 */
export function registerAllProviders(): void {
  const registry = getRegistry();

  // Register all providers
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());
  registry.register(new MistralProvider());
  registry.register(new GoogleProvider());
  registry.register(new CohereProvider());
  registry.register(new XAIProvider());
  registry.register(new PerplexityProvider());
  registry.register(new TogetherProvider());
  registry.register(new FireworksProvider());
  registry.register(new BedrockProvider());
  registry.register(new OllamaProvider());
  registry.register(new HuggingFaceProvider());
}

/**
 * Auto-register on module import
 */
registerAllProviders();
