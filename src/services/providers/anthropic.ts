import { requestUrl } from 'obsidian'
import type {
  ProviderAdapter,
  ProviderConfig,
  CompletionConfig,
  CompletionResult,
  StreamChunk,
  ChatMessage,
  Model
} from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com'
const ANTHROPIC_VERSION = '2023-06-01'

/**
 * Adapter for the Anthropic Messages API.
 *
 * Anthropic uses a different request format from OpenAI:
 * - System prompt is a top-level `system` field, not a message
 * - Streaming uses SSE with `content_block_delta` events
 * - Extended thinking is always enabled; temperature is forced to 1
 * - No /v1/models endpoint (model list is static)
 */
export class AnthropicAdapter implements ProviderAdapter {
  readonly id: string
  readonly name: string
  private apiKey: string

  constructor(config: ProviderConfig) {
    this.id = config.id
    this.name = config.name
    this.apiKey = config.apiKey ?? ''
  }

  updateConfig(config: Partial<ProviderConfig>): void {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey
  }

  // ─── Completion ─────────────────────────────────────────────────────────────

  async complete(
    messages: ChatMessage[],
    config: CompletionConfig
  ): Promise<CompletionResult> {
    const body = this.buildRequestBody(messages, config, false)
    const response = await requestUrl({
      url: `${ANTHROPIC_API_URL}/v1/messages`,
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    })

    const data = response.json as {
      content?: Array<{ text?: string }>
      model?: string
      usage?: { input_tokens: number; output_tokens: number }
    }
    const content = data.content?.map((b) => b.text ?? '').join('') ?? ''

    return {
      content,
      model: data.model ?? config.model,
      usage:
        data.usage != null
          ? {
              prompt_tokens: data.usage.input_tokens,
              completion_tokens: data.usage.output_tokens,
              total_tokens: data.usage.input_tokens + data.usage.output_tokens
            }
          : undefined
    }
  }

  // ─── Streaming ──────────────────────────────────────────────────────────────

  async *stream(
    messages: ChatMessage[],
    config: CompletionConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const body = this.buildRequestBody(messages, config, true)

    const response = await fetch(`${ANTHROPIC_API_URL}/v1/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error (${response.status}): ${error}`)
    }

    if (response.body == null) throw new Error('No response body')
    const reader = response.body.getReader()

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)

          try {
            const event = JSON.parse(payload) as {
              type?: string
              delta?: { type?: string; thinking?: string; text?: string }
            }
            if (event.type === 'content_block_delta') {
              const deltaType = event.delta?.type
              if (deltaType === 'thinking_delta') {
                const thinking = event.delta?.thinking ?? ''
                if (thinking !== '')
                  yield { content: '', reasoning: thinking, done: false }
              } else {
                const text = event.delta?.text ?? ''
                if (text !== '') yield { content: text, done: false }
              }
            } else if (event.type === 'message_stop') {
              yield { content: '', done: true }
              return
            }
          } catch {
            // Skip malformed SSE events
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: '', done: true }
  }

  // ─── Model listing ──────────────────────────────────────────────────────────

  async listModels(): Promise<Model[]> {
    return [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextWindow: 200000 },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        contextWindow: 200000
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        contextWindow: 200000
      }
    ]
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    }
  }

  private buildRequestBody(
    messages: ChatMessage[],
    config: CompletionConfig,
    stream: boolean
  ): Record<string, unknown> {
    const systemParts: string[] = []
    const conversationMessages: Array<{ role: string; content: string }> = []

    for (const m of messages) {
      if (m.role === 'system') {
        systemParts.push(m.content)
      } else {
        conversationMessages.push({ role: m.role, content: m.content })
      }
    }

    const maxTokens = config.maxTokens ?? 16000
    // budget_tokens must be less than max_tokens
    const budgetTokens = Math.min(10000, Math.floor(maxTokens * 0.8))

    const body: Record<string, unknown> = {
      model: config.model,
      messages: conversationMessages,
      max_tokens: maxTokens,
      stream,
      thinking: { type: 'enabled', budget_tokens: budgetTokens },
      // temperature must be 1 when extended thinking is enabled
      temperature: 1
    }

    if (systemParts.length > 0) body.system = systemParts.join('\n\n')
    if (config.topP !== undefined) body.top_p = config.topP
    return body
  }
}
