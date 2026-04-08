// ─── Chat message (provider-agnostic) ────────────────────────────────────────

export interface ChatMessage {
  role: string
  content: string
}

// ─── Provider configuration ───────────────────────────────────────────────────

export interface ProviderConfig {
  id: string
  name: string
  baseUrl?: string
  apiKey?: string
  defaultModel?: string
}

// ─── Completion ───────────────────────────────────────────────────────────────

export interface CompletionConfig {
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface CompletionResult {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  metadata?: Record<string, unknown>
}

export interface StreamChunk {
  content: string
  done: boolean
  /** Reasoning / thinking tokens emitted before the main response. */
  reasoning?: string
}

// ─── Model ────────────────────────────────────────────────────────────────────

export interface Model {
  id: string
  name: string
  contextWindow?: number
}

// ─── Provider adapter interface ───────────────────────────────────────────────

export interface ProviderAdapter {
  readonly id: string
  readonly name: string

  /** Non-streaming completion. */
  complete: (
    messages: ChatMessage[],
    config: CompletionConfig
  ) => Promise<CompletionResult>

  /** Streaming completion — yields partial content and optional reasoning chunks. */
  stream: (
    messages: ChatMessage[],
    config: CompletionConfig,
    signal?: AbortSignal
  ) => AsyncIterable<StreamChunk>

  /** Fetch available models from the provider. */
  listModels: () => Promise<Model[]>

  /** Update mutable config (e.g. rotate API key without reinstantiating). */
  updateConfig?: (config: Partial<ProviderConfig>) => void
}
