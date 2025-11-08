/**
 * Provider Registry
 *
 * Central registry for all LLM provider parsers.
 * Handles provider detection, parser selection, and response normalization.
 *
 * @module providers/provider-registry
 */

import type { BaseProviderParser, ParseResult, StreamParseResult } from './base-provider.js';
import type { Provider, ProviderMetadata } from '../types/unified-response.js';

/**
 * Provider detection result
 */
export interface DetectionResult {
  /** Whether provider was detected */
  detected: boolean;

  /** Detected provider */
  provider?: Provider;

  /** Confidence score (0-1) */
  confidence: number;

  /** Detection method used */
  method: 'header' | 'response_format' | 'model_name' | 'url' | 'manual';
}

/**
 * Registry options
 */
export interface RegistryOptions {
  /** Whether to auto-register providers */
  autoRegister?: boolean;

  /** Default provider (if detection fails) */
  defaultProvider?: Provider;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Provider Registry
 *
 * Manages provider parsers and handles automatic provider detection.
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private parsers: Map<Provider, BaseProviderParser> = new Map();
  private options: Required<RegistryOptions>;

  private constructor(options: RegistryOptions = {}) {
    this.options = {
      autoRegister: true,
      defaultProvider: 'openai' as Provider,
      debug: false,
      ...options,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: RegistryOptions): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry(options);
    }
    return ProviderRegistry.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static reset(): void {
    ProviderRegistry.instance = null as any;
  }

  /**
   * Register a provider parser
   *
   * @param parser - Provider parser instance
   */
  register(parser: BaseProviderParser): void {
    const provider = parser.getProvider();
    this.parsers.set(provider, parser);

    if (this.options.debug) {
      console.log(`[ProviderRegistry] Registered provider: ${provider}`);
    }
  }

  /**
   * Unregister a provider parser
   *
   * @param provider - Provider to unregister
   */
  unregister(provider: Provider): boolean {
    return this.parsers.delete(provider);
  }

  /**
   * Get a specific parser
   *
   * @param provider - Provider identifier
   * @returns Parser instance or undefined
   */
  getParser(provider: Provider): BaseProviderParser | undefined {
    return this.parsers.get(provider);
  }

  /**
   * Check if provider is registered
   *
   * @param provider - Provider identifier
   * @returns True if registered
   */
  isRegistered(provider: Provider): boolean {
    return this.parsers.has(provider);
  }

  /**
   * Get all registered providers
   *
   * @returns Array of provider identifiers
   */
  getProviders(): Provider[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Get provider metadata
   *
   * @param provider - Provider identifier
   * @returns Provider metadata or undefined
   */
  getMetadata(provider: Provider): ProviderMetadata | undefined {
    const parser = this.parsers.get(provider);
    return parser?.getMetadata();
  }

  /**
   * Get all provider metadata
   *
   * @returns Map of provider metadata
   */
  getAllMetadata(): Map<Provider, ProviderMetadata> {
    const metadata = new Map<Provider, ProviderMetadata>();
    for (const [provider, parser] of this.parsers) {
      metadata.set(provider, parser.getMetadata());
    }
    return metadata;
  }

  /**
   * Detect provider from response
   *
   * @param response - Raw response to analyze
   * @param headers - Optional HTTP headers
   * @param url - Optional request URL
   * @returns Detection result
   */
  detectProvider(response: unknown, headers?: Record<string, string>, url?: string): DetectionResult {
    // Try header-based detection first
    if (headers) {
      const headerDetection = this.detectFromHeaders(headers);
      if (headerDetection.detected) {
        return headerDetection;
      }
    }

    // Try URL-based detection
    if (url) {
      const urlDetection = this.detectFromUrl(url);
      if (urlDetection.detected) {
        return urlDetection;
      }
    }

    // Try response format detection
    const formatDetection = this.detectFromResponse(response);
    if (formatDetection.detected) {
      return formatDetection;
    }

    // No detection succeeded
    return {
      detected: false,
      confidence: 0,
      method: 'manual',
    };
  }

  /**
   * Parse response with automatic provider detection
   *
   * @param response - Raw response
   * @param provider - Optional explicit provider
   * @param headers - Optional HTTP headers for detection
   * @param url - Optional URL for detection
   * @returns Parse result
   */
  async parse(
    response: unknown,
    provider?: Provider,
    headers?: Record<string, string>,
    url?: string
  ): Promise<ParseResult> {
    // Use explicit provider if provided
    let selectedProvider = provider;

    // Otherwise, detect provider
    if (!selectedProvider) {
      const detection = this.detectProvider(response, headers, url);
      if (detection.detected) {
        selectedProvider = detection.provider!;
      } else {
        selectedProvider = this.options.defaultProvider;
        if (this.options.debug) {
          console.warn('[ProviderRegistry] Could not detect provider, using default:', selectedProvider);
        }
      }
    }

    // Get parser for provider
    const parser = this.parsers.get(selectedProvider);
    if (!parser) {
      return {
        success: false,
        errors: [`Provider not registered: ${selectedProvider}`],
        warnings: [],
      };
    }

    // Parse response
    return parser.parse(response);
  }

  /**
   * Parse streaming chunk with automatic provider detection
   *
   * @param chunk - Raw chunk
   * @param provider - Optional explicit provider
   * @param headers - Optional HTTP headers for detection
   * @returns Stream parse result
   */
  async parseStream(
    chunk: unknown,
    provider?: Provider,
    headers?: Record<string, string>
  ): Promise<StreamParseResult> {
    // Use explicit provider if provided
    let selectedProvider = provider;

    // Otherwise, detect provider
    if (!selectedProvider) {
      const detection = this.detectProvider(chunk, headers);
      if (detection.detected) {
        selectedProvider = detection.provider!;
      } else {
        selectedProvider = this.options.defaultProvider;
      }
    }

    // Get parser for provider
    const parser = this.parsers.get(selectedProvider);
    if (!parser) {
      return {
        success: false,
        errors: [`Provider not registered: ${selectedProvider}`],
        warnings: [],
      };
    }

    // Parse chunk
    return parser.parseStream(chunk);
  }

  /**
   * Detect provider from HTTP headers
   */
  private detectFromHeaders(headers: Record<string, string>): DetectionResult {
    const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

    // OpenAI
    if (lowerHeaders['openai-version'] || lowerHeaders['openai-organization']) {
      return {
        detected: true,
        provider: 'openai' as Provider,
        confidence: 0.95,
        method: 'header',
      };
    }

    // Anthropic
    if (lowerHeaders['anthropic-version']) {
      return {
        detected: true,
        provider: 'anthropic' as Provider,
        confidence: 0.95,
        method: 'header',
      };
    }

    // Cohere
    if (lowerHeaders['cohere-version']) {
      return {
        detected: true,
        provider: 'cohere' as Provider,
        confidence: 0.95,
        method: 'header',
      };
    }

    return { detected: false, confidence: 0, method: 'header' };
  }

  /**
   * Detect provider from URL
   */
  private detectFromUrl(url: string): DetectionResult {
    const lower = url.toLowerCase();

    if (lower.includes('api.openai.com')) {
      return { detected: true, provider: 'openai' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.anthropic.com')) {
      return { detected: true, provider: 'anthropic' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.mistral.ai')) {
      return { detected: true, provider: 'mistral' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('generativelanguage.googleapis.com')) {
      return { detected: true, provider: 'google' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.cohere.ai')) {
      return { detected: true, provider: 'cohere' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.x.ai')) {
      return { detected: true, provider: 'xai' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.perplexity.ai')) {
      return { detected: true, provider: 'perplexity' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.together.xyz')) {
      return { detected: true, provider: 'together' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('api.fireworks.ai')) {
      return { detected: true, provider: 'fireworks' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('bedrock') && lower.includes('amazonaws.com')) {
      return { detected: true, provider: 'bedrock' as Provider, confidence: 0.9, method: 'url' };
    }
    if (lower.includes('localhost') && lower.includes('11434')) {
      // Ollama default port
      return { detected: true, provider: 'ollama' as Provider, confidence: 0.85, method: 'url' };
    }

    return { detected: false, confidence: 0, method: 'url' };
  }

  /**
   * Detect provider from response structure
   */
  private detectFromResponse(response: unknown): DetectionResult {
    if (!response || typeof response !== 'object') {
      return { detected: false, confidence: 0, method: 'response_format' };
    }

    const obj = response as Record<string, unknown>;

    // OpenAI format
    if (obj.choices && Array.isArray(obj.choices) && obj.object === 'chat.completion') {
      return { detected: true, provider: 'openai' as Provider, confidence: 0.85, method: 'response_format' };
    }

    // Anthropic format
    if (obj.type === 'message' && obj.role && obj.content && Array.isArray(obj.content)) {
      return { detected: true, provider: 'anthropic' as Provider, confidence: 0.85, method: 'response_format' };
    }

    // Cohere format
    if (obj.text && obj.generation_id && obj.meta) {
      return { detected: true, provider: 'cohere' as Provider, confidence: 0.8, method: 'response_format' };
    }

    // Google Gemini format
    if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates[0]?.content?.parts) {
      return { detected: true, provider: 'google' as Provider, confidence: 0.8, method: 'response_format' };
    }

    // Ollama format
    if (obj.model && obj.message && !obj.choices && !obj.type) {
      return { detected: true, provider: 'ollama' as Provider, confidence: 0.75, method: 'response_format' };
    }

    // Try model name detection
    if (obj.model && typeof obj.model === 'string') {
      const modelDetection = this.detectFromModelName(obj.model);
      if (modelDetection.detected) {
        return modelDetection;
      }
    }

    return { detected: false, confidence: 0, method: 'response_format' };
  }

  /**
   * Detect provider from model name
   */
  private detectFromModelName(modelName: string): DetectionResult {
    const lower = modelName.toLowerCase();

    if (lower.startsWith('gpt-') || lower.startsWith('o1-') || lower.startsWith('text-davinci')) {
      return { detected: true, provider: 'openai' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('claude-')) {
      return { detected: true, provider: 'anthropic' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('mistral-') || lower.startsWith('mixtral-')) {
      return { detected: true, provider: 'mistral' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('gemini-')) {
      return { detected: true, provider: 'google' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('command-') || lower.startsWith('embed-')) {
      return { detected: true, provider: 'cohere' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('grok-')) {
      return { detected: true, provider: 'xai' as Provider, confidence: 0.9, method: 'model_name' };
    }
    if (lower.startsWith('llama-') || lower.startsWith('meta-')) {
      return { detected: true, provider: 'meta' as Provider, confidence: 0.85, method: 'model_name' };
    }
    if (lower.includes('mixtral') || lower.includes('hermes') || lower.includes('nous')) {
      return { detected: true, provider: 'together' as Provider, confidence: 0.7, method: 'model_name' };
    }

    return { detected: false, confidence: 0, method: 'model_name' };
  }
}

/**
 * Get global provider registry instance
 */
export function getRegistry(options?: RegistryOptions): ProviderRegistry {
  return ProviderRegistry.getInstance(options);
}

/**
 * Register a provider parser
 */
export function registerProvider(parser: BaseProviderParser): void {
  const registry = getRegistry();
  registry.register(parser);
}

/**
 * Parse response with automatic provider detection
 */
export async function parseResponse(
  response: unknown,
  provider?: Provider,
  headers?: Record<string, string>,
  url?: string
): Promise<ParseResult> {
  const registry = getRegistry();
  return registry.parse(response, provider, headers, url);
}
