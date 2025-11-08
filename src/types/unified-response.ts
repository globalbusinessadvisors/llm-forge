/**
 * Unified Response Types
 *
 * Canonical schema for LLM API responses across all providers.
 * Normalizes responses from OpenAI, Anthropic, Mistral, Google, Cohere, etc.
 *
 * @module types/unified-response
 */

/**
 * Provider identifiers
 */
export enum Provider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Mistral = 'mistral',
  Meta = 'meta',
  Ollama = 'ollama',
  Google = 'google',
  Cohere = 'cohere',
  XAI = 'xai',
  Perplexity = 'perplexity',
  Together = 'together',
  Fireworks = 'fireworks',
  Bedrock = 'bedrock',
  HuggingFace = 'huggingface',
  Replicate = 'replicate',
}

/**
 * Message role types
 */
export enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
  Tool = 'tool',
  Function = 'function',
}

/**
 * Content block types
 */
export enum ContentType {
  Text = 'text',
  Image = 'image',
  ToolUse = 'tool_use',
  ToolResult = 'tool_result',
  FunctionCall = 'function_call',
}

/**
 * Stop reason types
 *
 * Represents why an LLM stopped generating tokens.
 * Normalized across all providers for consistency.
 */
export enum StopReason {
  /** Normal completion - model decided to end generation */
  EndTurn = 'end_turn',

  /** Output token limit reached */
  MaxTokens = 'max_tokens',

  /** Context window/input length limit exceeded */
  ContextLength = 'context_length',

  /** Custom stop sequence encountered */
  StopSequence = 'stop_sequence',

  /** Tool/function call required */
  ToolUse = 'tool_use',

  /** Content filtered by safety/moderation system */
  ContentFilter = 'content_filter',

  /** Recitation/plagiarism filter (Google Gemini) */
  Recitation = 'recitation',

  /** Generation error occurred */
  Error = 'error',

  /** Generation canceled by user or system */
  Canceled = 'canceled',

  /** Unknown or not provided */
  Unknown = 'unknown',

  /**
   * @deprecated Use MaxTokens instead
   * Kept for backward compatibility
   */
  Length = 'length',

  /**
   * @deprecated Use ToolUse instead
   * Kept for backward compatibility
   */
  FunctionCall = 'function_call',
}

/**
 * Text content block
 */
export interface TextContent {
  type: ContentType.Text;
  text: string;
}

/**
 * Image content block
 */
export interface ImageContent {
  type: ContentType.Image;
  source: {
    type: 'url' | 'base64';
    url?: string;
    data?: string;
    mediaType?: string;
  };
}

/**
 * Tool use content block
 */
export interface ToolUseContent {
  type: ContentType.ToolUse;
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block
 */
export interface ToolResultContent {
  type: ContentType.ToolResult;
  toolUseId: string;
  content: string;
  isError?: boolean;
}

/**
 * Function call content block (OpenAI)
 */
export interface FunctionCallContent {
  type: ContentType.FunctionCall;
  name: string;
  arguments: string;
}

/**
 * Union of all content types
 */
export type Content = TextContent | ImageContent | ToolUseContent | ToolResultContent | FunctionCallContent;

/**
 * Message in unified format
 */
export interface UnifiedMessage {
  role: MessageRole;
  content: Content[];
  name?: string;
  toolCallId?: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Input/prompt tokens */
  inputTokens: number;
  /** Output/completion tokens */
  outputTokens: number;
  /** Total tokens (input + output) */
  totalTokens: number;
  /** Additional usage metadata */
  metadata?: {
    /** Cached tokens (Anthropic) */
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    /** Reasoning tokens (OpenAI) */
    reasoningTokens?: number;
    /** Audio tokens (OpenAI) */
    audioTokens?: number;
  };
}

/**
 * Model information
 */
export interface ModelInfo {
  /** Model ID/name */
  id: string;
  /** Provider */
  provider: Provider;
  /** Model version */
  version?: string;
  /** Context window size */
  contextWindow?: number;
  /** Max output tokens */
  maxOutputTokens?: number;
  /** Capabilities */
  capabilities?: string[];
}

/**
 * Error information
 */
export interface UnifiedError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error type */
  type: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Streaming chunk data
 */
export interface StreamChunk {
  /** Chunk type */
  type: 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_start' | 'message_delta' | 'message_stop';
  /** Delta content */
  delta?: {
    type?: ContentType;
    text?: string;
    stopReason?: StopReason;
  };
  /** Content block index */
  index?: number;
  /** Content block */
  contentBlock?: Content;
}

/**
 * Stop reason metadata
 *
 * Provides additional context about why generation stopped,
 * including the original provider-specific value.
 */
export interface StopReasonMetadata {
  /** Original provider-specific finish_reason/stop_reason value */
  originalValue: string | null;

  /** Whether the original value was recognized and mapped */
  wasRecognized: boolean;

  /**
   * Confidence level of the mapping
   * - high: Exact match or provider-specific mapping
   * - medium: Keyword-based fuzzy match
   * - low: Unknown value, defaulted to Unknown
   */
  mappingConfidence: 'high' | 'medium' | 'low';

  /** Provider-specific stop details */
  details?: {
    /** Stop sequence that triggered completion (if applicable) */
    stopSequence?: string;

    /** Recitation offset for plagiarism detection (Google) */
    recitationOffset?: number;

    /** Safety ratings that triggered content filter (Google) */
    safetyRatings?: unknown;

    /** Error message if stop was due to error */
    errorMessage?: string;

    /** Model-specific completion metadata */
    [key: string]: unknown;
  };
}

/**
 * Unified response from any LLM provider
 */
export interface UnifiedResponse {
  /** Unique response ID */
  id: string;

  /** Provider that generated the response */
  provider: Provider;

  /** Model used */
  model: ModelInfo;

  /** Response messages */
  messages: UnifiedMessage[];

  /** Stop reason */
  stopReason: StopReason;

  /** Stop reason metadata (optional, provides additional context) */
  stopReasonMetadata?: StopReasonMetadata;

  /** Token usage */
  usage: TokenUsage;

  /** Response metadata */
  metadata: {
    /** Original response timestamp */
    timestamp: string;
    /** Request ID from provider */
    requestId?: string;
    /** Latency in milliseconds */
    latency?: number;
    /** Additional provider-specific metadata */
    [key: string]: unknown;
  };

  /** Error (if any) */
  error?: UnifiedError;

  /** Raw response from provider (optional) */
  raw?: unknown;
}

/**
 * Streaming response
 */
export interface UnifiedStreamResponse {
  /** Stream ID */
  id: string;

  /** Provider */
  provider: Provider;

  /** Model */
  model: ModelInfo;

  /** Stream chunks */
  chunks: StreamChunk[];

  /** Final message (when stream completes) */
  message?: UnifiedMessage;

  /** Stop reason (when stream completes) */
  stopReason?: StopReason;

  /** Stop reason metadata (when stream completes) */
  stopReasonMetadata?: StopReasonMetadata;

  /** Usage (when stream completes) */
  usage?: TokenUsage;

  /** Metadata */
  metadata: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };

  /** Error (if any) */
  error?: UnifiedError;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider identifier */
  provider: Provider;

  /** API key */
  apiKey: string;

  /** Base URL (optional, for custom endpoints) */
  baseUrl?: string;

  /** Organization ID (OpenAI) */
  organizationId?: string;

  /** Project ID (Google) */
  projectId?: string;

  /** Region (AWS Bedrock) */
  region?: string;

  /** Additional configuration */
  config?: Record<string, unknown>;
}

/**
 * Request options
 */
export interface RequestOptions {
  /** Model to use */
  model: string;

  /** Messages to send */
  messages: UnifiedMessage[];

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature (0-2) */
  temperature?: number;

  /** Top P sampling */
  topP?: number;

  /** Top K sampling */
  topK?: number;

  /** Stop sequences */
  stopSequences?: string[];

  /** Enable streaming */
  stream?: boolean;

  /** Tools available */
  tools?: Tool[];

  /** System prompt */
  systemPrompt?: string;

  /** Additional options */
  [key: string]: unknown;
}

/**
 * Tool definition
 */
export interface Tool {
  /** Tool type */
  type: 'function';

  /** Function definition */
  function: {
    /** Function name */
    name: string;
    /** Function description */
    description: string;
    /** Parameters schema (JSON Schema) */
    parameters: Record<string, unknown>;
  };
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /** Supports streaming */
  streaming: boolean;

  /** Supports function calling */
  functionCalling: boolean;

  /** Supports tool use */
  toolUse: boolean;

  /** Supports vision */
  vision: boolean;

  /** Supports JSON mode */
  jsonMode: boolean;

  /** Supports system messages */
  systemMessages: boolean;

  /** Maximum context window */
  maxContextWindow: number;

  /** Maximum output tokens */
  maxOutputTokens: number;

  /** Supported modalities */
  modalities: ('text' | 'image' | 'audio' | 'video')[];
}

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  /** Provider identifier */
  id: Provider;

  /** Provider name */
  name: string;

  /** Provider description */
  description: string;

  /** API version */
  apiVersion: string;

  /** Base URL */
  baseUrl: string;

  /** Capabilities */
  capabilities: ProviderCapabilities;

  /** Available models */
  models: ModelInfo[];

  /** Authentication type */
  authenticationType: 'api_key' | 'oauth' | 'service_account';

  /** Documentation URL */
  docsUrl: string;
}
