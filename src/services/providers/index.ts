import { AnthropicAdapter } from './anthropic'
import { OpenAICompatibleAdapter } from './openai-compat'
import type { ProviderAdapter } from './types'
import type { PluginSettings } from '../../types'

/**
 * Instantiate the correct ProviderAdapter for the active provider.
 *
 * API key is passed in separately because it lives in SecretStorage
 * (loaded async by the caller) rather than in settings.
 */
export function createAdapter(
  settings: PluginSettings,
  apiKey: string
): ProviderAdapter {
  const { activeProviderId, providers } = settings
  const config = providers[activeProviderId]

  if (activeProviderId === 'anthropic') {
    return new AnthropicAdapter({
      id: config.id,
      name: config.name,
      apiKey
    })
  }

  // openai, openrouter, mistral, local, and any custom provider — all use the
  // OpenAI-compatible /v1/chat/completions API
  return new OpenAICompatibleAdapter({
    id: config.id,
    name: config.name,
    baseUrl: config.baseUrl,
    apiKey
  })
}

export type { ProviderAdapter } from './types'
export type { StreamChunk, ChatMessage, CompletionConfig } from './types'
