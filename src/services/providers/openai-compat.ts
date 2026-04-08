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

/**
 * Adapter for any endpoint exposing the OpenAI /v1/chat/completions API:
 * OpenAI, OpenRouter, Mistral, LM Studio, Ollama, Together, Groq, vLLM, etc.
 */
export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly id: string
  readonly name: string
  private baseUrl: string
  private apiKey: string

  constructor(config: ProviderConfig) {
    this.id = config.id
    this.name = config.name
    this.baseUrl = (config.baseUrl ?? 'https://api.openai.com')
      .replace(/\/$/, '')
      .replace(/\/v1$/, '')
    this.apiKey = config.apiKey ?? ''
  }

  updateConfig(config: Partial<ProviderConfig>): void {
    if (config.baseUrl !== undefined)
      this.baseUrl = config.baseUrl.replace(/\/$/, '').replace(/\/v1$/, '')
    if (config.apiKey !== undefined) this.apiKey = config.apiKey
  }

  // ─── Completion ─────────────────────────────────────────────────────────────

  async complete(
    messages: ChatMessage[],
    config: CompletionConfig
  ): Promise<CompletionResult> {
    const body = this.buildRequestBody(messages, config, false)
    const response = await requestUrl({
      url: `${this.baseUrl}/v1/chat/completions`,
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    })

    const data = response.json
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? config.model,
      usage: data.usage
    }
  }

  // ─── Streaming ──────────────────────────────────────────────────────────────

  async *stream(
    messages: ChatMessage[],
    config: CompletionConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const body = this.buildRequestBody(messages, config, true)

    // Obsidian's requestUrl doesn't support streaming, so we use fetch directly
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error (${response.status}): ${error}`)
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
          if (trimmed === '' || !trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)
          if (payload === '[DONE]') {
            yield { content: '', done: true }
            return
          }
          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{
                delta?: {
                  content?: string
                  reasoning_content?: string
                  reasoning?: string
                }
              }>
            }
            const d = parsed.choices?.[0]?.delta ?? {}
            const content: string = d.content ?? ''
            const reasoning: string = d.reasoning_content ?? d.reasoning ?? ''
            if (content !== '' || reasoning !== '') {
              yield {
                content,
                reasoning: reasoning !== '' ? reasoning : undefined,
                done: false
              }
            }
          } catch {
            // Skip malformed SSE chunks
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
    try {
      const response = await requestUrl({
        url: `${this.baseUrl}/v1/models`,
        method: 'GET',
        headers: this.headers()
      })

      const data = response.json
      return (data.data ?? []).map((m: Record<string, unknown>) => ({
        id: String(m.id),
        name: String(m.id),
        contextWindow:
          typeof m.context_length === 'number' ? m.context_length : undefined
      }))
    } catch {
      return []
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey !== '') h.Authorization = `Bearer ${this.apiKey}`
    return h
  }

  private buildRequestBody(
    messages: ChatMessage[],
    config: CompletionConfig,
    stream: boolean
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream
    }
    if (config.temperature !== undefined) body.temperature = config.temperature
    if (config.maxTokens !== undefined) body.max_tokens = config.maxTokens
    if (config.topP !== undefined) body.top_p = config.topP
    if (config.frequencyPenalty !== undefined)
      body.frequency_penalty = config.frequencyPenalty
    if (config.presencePenalty !== undefined)
      body.presence_penalty = config.presencePenalty
    return body
  }
}
