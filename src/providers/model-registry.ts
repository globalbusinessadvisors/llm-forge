/**
 * Model Registry
 *
 * Centralized registry for all LLM models across providers.
 * Tracks model metadata, capabilities, pricing, and version information.
 *
 * @module providers/model-registry
 */

import type { Provider, ModelInfo, ProviderCapabilities } from '../types/unified-response.js';

/**
 * Detailed model information
 */
export interface ModelDetails extends ModelInfo {
  /** Model display name */
  displayName: string;
  /** Model description */
  description?: string;
  /** Release date */
  releaseDate?: string;
  /** Deprecation date (if deprecated) */
  deprecationDate?: string;
  /** Whether model is deprecated */
  deprecated?: boolean;
  /** Replacement model (if deprecated) */
  replacementModel?: string;
  /** Model family/series */
  family?: string;
  /** Model variant (e.g., 'instruct', 'chat', 'base') */
  variant?: string;
  /** Pricing information */
  pricing?: {
    /** Input token cost (per 1M tokens) */
    inputCostPer1M?: number;
    /** Output token cost (per 1M tokens) */
    outputCostPer1M?: number;
    /** Cached input cost (per 1M tokens) - Anthropic */
    cachedInputCostPer1M?: number;
    /** Currency */
    currency?: string;
  };
  /** Model-specific capabilities */
  modelCapabilities?: Partial<ProviderCapabilities>;
}

/**
 * Model Registry
 *
 * Centralized registry for tracking all available models.
 */
export class ModelRegistry {
  private static instance: ModelRegistry;
  private models: Map<string, ModelDetails> = new Map();
  private modelsByProvider: Map<Provider, Set<string>> = new Map();
  private modelAliases: Map<string, string> = new Map();

  private constructor() {
    this.initializeDefaultModels();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static reset(): void {
    ModelRegistry.instance = null as any;
  }

  /**
   * Register a model
   */
  registerModel(model: ModelDetails): void {
    const key = this.getModelKey(model.provider, model.id);
    this.models.set(key, model);

    // Track by provider
    if (!this.modelsByProvider.has(model.provider)) {
      this.modelsByProvider.set(model.provider, new Set());
    }
    this.modelsByProvider.get(model.provider)!.add(model.id);
  }

  /**
   * Register a model alias
   */
  registerAlias(alias: string, modelId: string, provider: Provider): void {
    const key = this.getModelKey(provider, modelId);
    this.modelAliases.set(alias.toLowerCase(), key);
  }

  /**
   * Get model details
   */
  getModel(modelId: string, provider?: Provider): ModelDetails | undefined {
    // Try direct lookup
    if (provider) {
      const key = this.getModelKey(provider, modelId);
      return this.models.get(key);
    }

    // Try alias lookup
    const aliasKey = this.modelAliases.get(modelId.toLowerCase());
    if (aliasKey) {
      return this.models.get(aliasKey);
    }

    // Try searching all providers
    for (const [key, model] of this.models) {
      if (model.id === modelId || model.id.toLowerCase() === modelId.toLowerCase()) {
        return model;
      }
    }

    return undefined;
  }

  /**
   * Get all models for a provider
   */
  getProviderModels(provider: Provider): ModelDetails[] {
    const modelIds = this.modelsByProvider.get(provider);
    if (!modelIds) return [];

    return Array.from(modelIds)
      .map((id) => this.getModel(id, provider))
      .filter((m): m is ModelDetails => m !== undefined);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelDetails[] {
    return Array.from(this.models.values());
  }

  /**
   * Check if model exists
   */
  hasModel(modelId: string, provider?: Provider): boolean {
    return this.getModel(modelId, provider) !== undefined;
  }

  /**
   * Detect provider from model ID
   */
  detectProviderFromModel(modelId: string): Provider | undefined {
    const model = this.getModel(modelId);
    return model?.provider;
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(modelId: string, provider?: Provider): Partial<ProviderCapabilities> | undefined {
    const model = this.getModel(modelId, provider);
    return model?.modelCapabilities;
  }

  /**
   * Search models by criteria
   */
  searchModels(criteria: {
    provider?: Provider;
    family?: string;
    variant?: string;
    capabilities?: Partial<ProviderCapabilities>;
    minContextWindow?: number;
    maxCost?: number;
    deprecated?: boolean;
  }): ModelDetails[] {
    let results = this.getAllModels();

    if (criteria.provider) {
      results = results.filter((m) => m.provider === criteria.provider);
    }

    if (criteria.family) {
      results = results.filter((m) => m.family === criteria.family);
    }

    if (criteria.variant) {
      results = results.filter((m) => m.variant === criteria.variant);
    }

    if (criteria.deprecated !== undefined) {
      results = results.filter((m) => m.deprecated === criteria.deprecated);
    }

    if (criteria.minContextWindow) {
      results = results.filter((m) => (m.contextWindow || 0) >= criteria.minContextWindow!);
    }

    if (criteria.maxCost && criteria.maxCost > 0) {
      results = results.filter((m) => {
        const cost = m.pricing?.outputCostPer1M || Infinity;
        return cost <= criteria.maxCost!;
      });
    }

    return results;
  }

  /**
   * Get model key
   */
  private getModelKey(provider: Provider, modelId: string): string {
    return `${provider}:${modelId}`;
  }

  /**
   * Initialize default models from all providers
   */
  private initializeDefaultModels(): void {
    // OpenAI models
    this.registerOpenAIModels();

    // Anthropic models
    this.registerAnthropicModels();

    // Google models
    this.registerGoogleModels();

    // Mistral models
    this.registerMistralModels();

    // Meta/LLaMA models
    this.registerMetaModels();

    // Cohere models
    this.registerCohereModels();

    // xAI models
    this.registerXAIModels();

    // Hugging Face models
    this.registerHuggingFaceModels();

    // Other providers
    this.registerOtherProviderModels();
  }

  /**
   * Register OpenAI models
   */
  private registerOpenAIModels(): void {
    const provider = 'openai' as Provider;

    // GPT-4 Turbo
    this.registerModel({
      id: 'gpt-4-turbo-2024-04-09',
      provider,
      displayName: 'GPT-4 Turbo',
      description: 'Latest GPT-4 Turbo with vision',
      version: '2024-04-09',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'vision', 'function_calling', 'json_mode'],
      family: 'gpt-4',
      variant: 'turbo',
      releaseDate: '2024-04-09',
      pricing: {
        inputCostPer1M: 10.0,
        outputCostPer1M: 30.0,
        currency: 'USD',
      },
    });

    // GPT-4
    this.registerModel({
      id: 'gpt-4',
      provider,
      displayName: 'GPT-4',
      description: 'Standard GPT-4 model',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'gpt-4',
      variant: 'standard',
      pricing: {
        inputCostPer1M: 30.0,
        outputCostPer1M: 60.0,
        currency: 'USD',
      },
    });

    // GPT-3.5 Turbo
    this.registerModel({
      id: 'gpt-3.5-turbo',
      provider,
      displayName: 'GPT-3.5 Turbo',
      description: 'Fast and efficient model',
      contextWindow: 16385,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'gpt-3.5',
      variant: 'turbo',
      pricing: {
        inputCostPer1M: 0.5,
        outputCostPer1M: 1.5,
        currency: 'USD',
      },
    });

    // O1 Preview (reasoning)
    this.registerModel({
      id: 'o1-preview',
      provider,
      displayName: 'O1 Preview',
      description: 'Advanced reasoning model',
      contextWindow: 128000,
      maxOutputTokens: 32768,
      capabilities: ['text', 'reasoning'],
      family: 'o1',
      variant: 'preview',
      pricing: {
        inputCostPer1M: 15.0,
        outputCostPer1M: 60.0,
        currency: 'USD',
      },
    });

    // O1 Mini
    this.registerModel({
      id: 'o1-mini',
      provider,
      displayName: 'O1 Mini',
      description: 'Faster reasoning model',
      contextWindow: 128000,
      maxOutputTokens: 65536,
      capabilities: ['text', 'reasoning'],
      family: 'o1',
      variant: 'mini',
      pricing: {
        inputCostPer1M: 3.0,
        outputCostPer1M: 12.0,
        currency: 'USD',
      },
    });
  }

  /**
   * Register Anthropic models
   */
  private registerAnthropicModels(): void {
    const provider = 'anthropic' as Provider;

    // Claude 3 Opus
    this.registerModel({
      id: 'claude-3-opus-20240229',
      provider,
      displayName: 'Claude 3 Opus',
      description: 'Most capable model for complex tasks',
      version: '20240229',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'vision', 'tool_use'],
      family: 'claude-3',
      variant: 'opus',
      releaseDate: '2024-02-29',
      pricing: {
        inputCostPer1M: 15.0,
        outputCostPer1M: 75.0,
        currency: 'USD',
      },
    });

    // Claude 3 Sonnet
    this.registerModel({
      id: 'claude-3-sonnet-20240229',
      provider,
      displayName: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed',
      version: '20240229',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'vision', 'tool_use'],
      family: 'claude-3',
      variant: 'sonnet',
      releaseDate: '2024-02-29',
      pricing: {
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        currency: 'USD',
      },
    });

    // Claude 3.5 Sonnet (latest as of knowledge cutoff)
    this.registerModel({
      id: 'claude-3-5-sonnet-20240620',
      provider,
      displayName: 'Claude 3.5 Sonnet',
      description: 'Latest Sonnet with improved capabilities',
      version: '20240620',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      capabilities: ['text', 'vision', 'tool_use'],
      family: 'claude-3',
      variant: 'sonnet-3.5',
      releaseDate: '2024-06-20',
      pricing: {
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        currency: 'USD',
      },
    });

    // Claude 3 Haiku
    this.registerModel({
      id: 'claude-3-haiku-20240307',
      provider,
      displayName: 'Claude 3 Haiku',
      description: 'Fastest model for lightweight tasks',
      version: '20240307',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'vision'],
      family: 'claude-3',
      variant: 'haiku',
      releaseDate: '2024-03-07',
      pricing: {
        inputCostPer1M: 0.25,
        outputCostPer1M: 1.25,
        currency: 'USD',
      },
    });
  }

  /**
   * Register Google models
   */
  private registerGoogleModels(): void {
    const provider = 'google' as Provider;

    // Gemini 1.5 Pro
    this.registerModel({
      id: 'gemini-1.5-pro',
      provider,
      displayName: 'Gemini 1.5 Pro',
      description: 'Advanced model with 1M context window',
      version: '1.5',
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      capabilities: ['text', 'vision', 'audio', 'video', 'function_calling'],
      family: 'gemini',
      variant: 'pro-1.5',
      pricing: {
        inputCostPer1M: 7.0,
        outputCostPer1M: 21.0,
        currency: 'USD',
      },
    });

    // Gemini 1.5 Flash
    this.registerModel({
      id: 'gemini-1.5-flash',
      provider,
      displayName: 'Gemini 1.5 Flash',
      description: 'Fast model with 1M context',
      version: '1.5',
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      capabilities: ['text', 'vision', 'audio', 'video', 'function_calling'],
      family: 'gemini',
      variant: 'flash-1.5',
      pricing: {
        inputCostPer1M: 0.35,
        outputCostPer1M: 1.05,
        currency: 'USD',
      },
    });

    // Gemini 1.0 Pro
    this.registerModel({
      id: 'gemini-1.0-pro',
      provider,
      displayName: 'Gemini 1.0 Pro',
      description: 'Previous generation model',
      version: '1.0',
      contextWindow: 32768,
      maxOutputTokens: 2048,
      capabilities: ['text', 'function_calling'],
      family: 'gemini',
      variant: 'pro-1.0',
      pricing: {
        inputCostPer1M: 0.5,
        outputCostPer1M: 1.5,
        currency: 'USD',
      },
    });
  }

  /**
   * Register Mistral models
   */
  private registerMistralModels(): void {
    const provider = 'mistral' as Provider;

    // Mistral Large
    this.registerModel({
      id: 'mistral-large-latest',
      provider,
      displayName: 'Mistral Large',
      description: 'Flagship model for complex tasks',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'mistral',
      variant: 'large',
      pricing: {
        inputCostPer1M: 8.0,
        outputCostPer1M: 24.0,
        currency: 'USD',
      },
    });

    // Mistral Medium
    this.registerModel({
      id: 'mistral-medium-latest',
      provider,
      displayName: 'Mistral Medium',
      description: 'Balanced model',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'mistral',
      variant: 'medium',
      pricing: {
        inputCostPer1M: 2.7,
        outputCostPer1M: 8.1,
        currency: 'USD',
      },
    });

    // Mistral Small
    this.registerModel({
      id: 'mistral-small-latest',
      provider,
      displayName: 'Mistral Small',
      description: 'Efficient model',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'mistral',
      variant: 'small',
      pricing: {
        inputCostPer1M: 1.0,
        outputCostPer1M: 3.0,
        currency: 'USD',
      },
    });

    // Mixtral 8x7B
    this.registerModel({
      id: 'open-mixtral-8x7b',
      provider,
      displayName: 'Mixtral 8x7B',
      description: 'Open weights mixture of experts',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'mixtral',
      variant: '8x7b',
      pricing: {
        inputCostPer1M: 0.7,
        outputCostPer1M: 0.7,
        currency: 'USD',
      },
    });

    // Mixtral 8x22B
    this.registerModel({
      id: 'open-mixtral-8x22b',
      provider,
      displayName: 'Mixtral 8x22B',
      description: 'Larger mixture of experts',
      contextWindow: 65536,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'mixtral',
      variant: '8x22b',
      pricing: {
        inputCostPer1M: 2.0,
        outputCostPer1M: 6.0,
        currency: 'USD',
      },
    });
  }

  /**
   * Register Meta/LLaMA models
   */
  private registerMetaModels(): void {
    const provider = 'meta' as Provider;

    // LLaMA 3 70B
    this.registerModel({
      id: 'llama-3-70b-instruct',
      provider,
      displayName: 'LLaMA 3 70B Instruct',
      description: 'Large instruction-tuned model',
      version: '3',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'llama-3',
      variant: '70b-instruct',
    });

    // LLaMA 3 8B
    this.registerModel({
      id: 'llama-3-8b-instruct',
      provider,
      displayName: 'LLaMA 3 8B Instruct',
      description: 'Efficient instruction-tuned model',
      version: '3',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'llama-3',
      variant: '8b-instruct',
    });
  }

  /**
   * Register Cohere models
   */
  private registerCohereModels(): void {
    const provider = 'cohere' as Provider;

    // Command R Plus
    this.registerModel({
      id: 'command-r-plus',
      provider,
      displayName: 'Command R+',
      description: 'Most capable model',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'tool_use'],
      family: 'command',
      variant: 'r-plus',
      pricing: {
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        currency: 'USD',
      },
    });

    // Command R
    this.registerModel({
      id: 'command-r',
      provider,
      displayName: 'Command R',
      description: 'Balanced model',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'tool_use'],
      family: 'command',
      variant: 'r',
      pricing: {
        inputCostPer1M: 0.5,
        outputCostPer1M: 1.5,
        currency: 'USD',
      },
    });
  }

  /**
   * Register xAI models
   */
  private registerXAIModels(): void {
    const provider = 'xai' as Provider;

    // Grok Beta
    this.registerModel({
      id: 'grok-beta',
      provider,
      displayName: 'Grok Beta',
      description: 'xAI flagship model',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      capabilities: ['text', 'function_calling'],
      family: 'grok',
      variant: 'beta',
    });
  }

  /**
   * Register Hugging Face models
   */
  private registerHuggingFaceModels(): void {
    const provider = 'huggingface' as Provider;

    // Mistral 7B Instruct
    this.registerModel({
      id: 'mistralai/Mistral-7B-Instruct-v0.2',
      provider,
      displayName: 'Mistral 7B Instruct',
      description: 'Mistral 7B instruction-tuned model',
      contextWindow: 32768,
      maxOutputTokens: 8192,
      capabilities: ['text'],
      family: 'mistral',
      variant: '7b-instruct',
    });

    // Falcon 180B
    this.registerModel({
      id: 'tiiuae/falcon-180B',
      provider,
      displayName: 'Falcon 180B',
      description: 'Large open-source model from TII',
      contextWindow: 2048,
      maxOutputTokens: 2048,
      capabilities: ['text'],
      family: 'falcon',
      variant: '180b',
    });

    // Zephyr 7B Beta
    this.registerModel({
      id: 'HuggingFaceH4/zephyr-7b-beta',
      provider,
      displayName: 'Zephyr 7B Beta',
      description: 'Fine-tuned Mistral variant for helpfulness',
      contextWindow: 32768,
      maxOutputTokens: 8192,
      capabilities: ['text'],
      family: 'zephyr',
      variant: '7b-beta',
    });

    // Gemma 2 9B IT
    this.registerModel({
      id: 'google/gemma-2-9b-it',
      provider,
      displayName: 'Gemma 2 9B IT',
      description: 'Google Gemma 2 instruction-tuned',
      contextWindow: 8192,
      maxOutputTokens: 8192,
      capabilities: ['text'],
      family: 'gemma',
      variant: '2-9b-it',
    });

    // LLaMA 3 70B Instruct
    this.registerModel({
      id: 'meta-llama/Meta-Llama-3-70B-Instruct',
      provider,
      displayName: 'LLaMA 3 70B Instruct',
      description: 'Meta LLaMA 3 70B instruction-tuned',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'llama-3',
      variant: '70b-instruct',
    });

    // StarCoder2 15B
    this.registerModel({
      id: 'bigcode/starcoder2-15b',
      provider,
      displayName: 'StarCoder2 15B',
      description: 'Code generation model',
      contextWindow: 16384,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'starcoder',
      variant: '15b',
    });
  }

  /**
   * Register other provider models
   */
  private registerOtherProviderModels(): void {
    // Perplexity
    this.registerModel({
      id: 'pplx-70b-online',
      provider: 'perplexity' as Provider,
      displayName: 'Perplexity 70B Online',
      description: 'Online search-augmented model',
      contextWindow: 127072,
      maxOutputTokens: 4096,
      capabilities: ['text', 'search'],
      family: 'pplx',
      variant: '70b-online',
    });

    // Together.ai
    this.registerModel({
      id: 'meta-llama/Llama-3-70b-chat-hf',
      provider: 'together' as Provider,
      displayName: 'LLaMA 3 70B Chat',
      description: 'LLaMA 3 70B via Together.ai',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'llama-3',
      variant: '70b-chat',
    });

    this.registerModel({
      id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      provider: 'together' as Provider,
      displayName: 'Mixtral 8x7B Instruct',
      description: 'Mixtral 8x7B via Together.ai',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'mixtral',
      variant: '8x7b-instruct',
    });

    // Fireworks.ai
    this.registerModel({
      id: 'accounts/fireworks/models/llama-v2-70b-chat',
      provider: 'fireworks' as Provider,
      displayName: 'LLaMA 2 70B Chat',
      description: 'LLaMA 2 70B via Fireworks.ai',
      contextWindow: 4096,
      maxOutputTokens: 2048,
      capabilities: ['text'],
      family: 'llama-2',
      variant: '70b-chat',
    });

    // AWS Bedrock - Claude
    this.registerModel({
      id: 'anthropic.claude-3-opus-20240229-v1:0',
      provider: 'bedrock' as Provider,
      displayName: 'Claude 3 Opus (Bedrock)',
      description: 'Claude 3 Opus via AWS Bedrock',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      capabilities: ['text', 'vision', 'tool_use'],
      family: 'claude-3',
      variant: 'opus',
    });

    this.registerModel({
      id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      provider: 'bedrock' as Provider,
      displayName: 'Claude 3.5 Sonnet (Bedrock)',
      description: 'Claude 3.5 Sonnet via AWS Bedrock',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      capabilities: ['text', 'vision', 'tool_use'],
      family: 'claude-3',
      variant: 'sonnet-3.5',
    });

    // Ollama
    this.registerModel({
      id: 'llama2',
      provider: 'ollama' as Provider,
      displayName: 'LLaMA 2 (Ollama)',
      description: 'Local LLaMA 2 model',
      contextWindow: 4096,
      maxOutputTokens: 2048,
      capabilities: ['text'],
      family: 'llama-2',
      variant: 'base',
    });

    this.registerModel({
      id: 'llama3',
      provider: 'ollama' as Provider,
      displayName: 'LLaMA 3 (Ollama)',
      description: 'Local LLaMA 3 model',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'llama-3',
      variant: 'base',
    });

    this.registerModel({
      id: 'gemma2',
      provider: 'ollama' as Provider,
      displayName: 'Gemma 2 (Ollama)',
      description: 'Google Gemma 2 local model',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'gemma',
      variant: '2',
    });

    this.registerModel({
      id: 'mistral',
      provider: 'ollama' as Provider,
      displayName: 'Mistral 7B (Ollama)',
      description: 'Mistral 7B local model',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      capabilities: ['text'],
      family: 'mistral',
      variant: '7b',
    });
  }
}

/**
 * Get global model registry instance
 */
export function getModelRegistry(): ModelRegistry {
  return ModelRegistry.getInstance();
}

/**
 * Register a model
 */
export function registerModel(model: ModelDetails): void {
  const registry = getModelRegistry();
  registry.registerModel(model);
}

/**
 * Get model details
 */
export function getModel(modelId: string, provider?: Provider): ModelDetails | undefined {
  const registry = getModelRegistry();
  return registry.getModel(modelId, provider);
}

/**
 * Search for models
 */
export function searchModels(criteria: Parameters<ModelRegistry['searchModels']>[0]): ModelDetails[] {
  const registry = getModelRegistry();
  return registry.searchModels(criteria);
}
