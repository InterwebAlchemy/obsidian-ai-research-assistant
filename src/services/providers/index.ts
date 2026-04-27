import { AnthropicAdapter } from './anthropic'
import { OpenAICompatibleAdapter } from './openai-compat'
import type { ProviderAdapter } from './types'
import type { PluginSettings } from '../../types'
import { getApiType } from '../modelRegistry'

/**
 * Instantiate the correct ProviderAdapter for the active provider.
 *
 * API key is passed in separately because it lives in SecretStorage
 * (loaded async by the caller) rather than in settings.
 *
 * Routing is by MMC api_type — anthropic-protocol providers (Anthropic itself
 * and MiniMax's `/anthropic` endpoint) use AnthropicAdapter; everything else
 * uses the OpenAI-compatible adapter. Custom user-added providers default to
 * OpenAI-compatible.
 */
export function createAdapter(
  settings: PluginSettings,
  apiKey: string
): ProviderAdapter {
  const { activeProviderId, providers } = settings
  const config = providers[activeProviderId]

  if (getApiType(activeProviderId) === 'anthropic') {
    return new AnthropicAdapter({
      id: config.id,
      name: config.name,
      baseUrl: config.baseUrl,
      apiKey
    })
  }

  return new OpenAICompatibleAdapter({
    id: config.id,
    name: config.name,
    baseUrl: config.baseUrl,
    apiKey
  })
}

export type { ProviderAdapter } from './types'
export type { StreamChunk, ChatMessage, CompletionConfig } from './types'
