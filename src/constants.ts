import type { PluginSettings, ProviderSettings } from './types'

import ChatGPTPreamble from './preambles/chatgpt'
import models from './services/openai/models'
import { OPEN_AI_DEFAULT_MODEL_NAME } from './services/openai/constants'
import {
  getKnownModels,
  getProviderDefaults,
  type KnownModel
} from './services/modelRegistry'

export const PLUGIN_NAME = 'AI Research Assistant'
export const PLUGIN_PREFIX = 'ai-research-assistant'

export const DEFAULT_MODEL = models[OPEN_AI_DEFAULT_MODEL_NAME]

export const DEFAULT_CONVERSATION_TITLE = 'New Chat'

export const SYSTEM_MESSAGE_OBJECT_TYPE = 'system_message'

export const USER_MESSAGE_OBJECT_TYPE = `${PLUGIN_PREFIX.replace(
  /-/g,
  '_'
)}_user_message`
export const USER_HANDLE = 'You:'
export const BOT_HANDLE = 'ChatGPT:'
export const DEFAULT_TOKEN_TYPE = 'gpt4'
export const DEFAULT_MAX_MEMORY_COUNT = 10
export const DEFAULT_MAX_TOKENS = DEFAULT_MODEL.maxTokens
export const DEFAULT_TOKEN_BUFFER = Math.floor(DEFAULT_MAX_TOKENS / 4)
export const DEFAULT_AUTO_SAVE_INTERVAL = 60

// ─── Built-in provider IDs (cannot be removed by the user) ──────────────────
//
// Curated subset of MMC providers that the UI surfaces by default. Includes
// all non-OpenAI-compatible providers (anthropic protocol — anthropic, minimax)
// plus a handful of common OpenAI-compatible direct providers and OpenRouter.
// Other MMC providers (Groq, DeepSeek, Google, etc.) can be added by the user
// via the "Add custom provider" form — they all use the OpenAI-compatible API.

export const BUILTIN_PROVIDER_IDS = [
  'openrouter',
  'openai',
  'anthropic',
  'minimax',
  'mistral',
  'local'
] as const

// ─── Known model catalog (bundled from MMC, not persisted) ──────────────────

export type { KnownModel }

const buildKnownModels = (): Record<string, KnownModel[]> => {
  const result: Record<string, KnownModel[]> = {}
  for (const id of BUILTIN_PROVIDER_IDS) {
    result[id] = getKnownModels(id)
  }
  return result
}

export const KNOWN_MODELS: Record<string, KnownModel[]> = buildKnownModels()

// ─── Default provider settings, seeded from MMC ─────────────────────────────

interface ProviderSeed {
  /** Local-only fallback name when MMC has no provider entry (e.g. `local`). */
  fallbackName: string
  fallbackBaseUrl?: string
  /** Preferred default model id (in MMC model_id form). Falls back to first enabled. */
  preferredDefault?: string
}

const PROVIDER_SEEDS: Record<string, ProviderSeed> = {
  openrouter: { fallbackName: 'OpenRouter' },
  openai: { fallbackName: 'OpenAI', preferredDefault: 'gpt-4o' },
  anthropic: {
    fallbackName: 'Anthropic',
    preferredDefault: 'claude-sonnet-4-6'
  },
  minimax: { fallbackName: 'MiniMax' },
  mistral: {
    fallbackName: 'Mistral',
    preferredDefault: 'mistral-large-latest'
  },
  local: {
    fallbackName: 'Local (LM Studio / Ollama / etc.)',
    fallbackBaseUrl: 'http://localhost:1234'
  }
}

const buildProviderSettings = (
  id: string,
  seed: ProviderSeed,
  enabled: KnownModel[]
): ProviderSettings => {
  const mmc = getProviderDefaults(id)
  const enabledIds = enabled.map((m) => m.id)
  const preferred =
    seed.preferredDefault !== undefined &&
    enabledIds.includes(seed.preferredDefault)
      ? seed.preferredDefault
      : enabledIds[0] ?? ''
  return {
    id,
    name: mmc?.name ?? seed.fallbackName,
    baseUrl: mmc?.baseUrl ?? seed.fallbackBaseUrl,
    defaultModel: preferred,
    enabledModels: enabledIds,
    customModels: []
  }
}

const buildDefaultProviders = (): Record<string, ProviderSettings> => {
  const out: Record<string, ProviderSettings> = {}
  for (const id of BUILTIN_PROVIDER_IDS) {
    out[id] = buildProviderSettings(
      id,
      PROVIDER_SEEDS[id],
      KNOWN_MODELS[id] ?? []
    )
  }
  return out
}

export const PLUGIN_SETTINGS: PluginSettings = {
  debugMode: false,
  activeProviderId: 'openai',
  providers: buildDefaultProviders(),
  defaultModel: OPEN_AI_DEFAULT_MODEL_NAME,
  defaultTokenBuffer: DEFAULT_TOKEN_BUFFER,
  defaultMaxTokens: DEFAULT_MAX_TOKENS,
  defaultPreamble: ChatGPTPreamble(),
  temperature: 0.75,
  maxTokens: 500,
  autosaveConversationHistory: false,
  autosaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,
  conversationHistoryDirectory: `${PLUGIN_NAME}/History`,
  userHandle: USER_HANDLE,
  botHandle: BOT_HANDLE,
  expandThinkingByDefault: false,
  maxMemoryCount: DEFAULT_MAX_MEMORY_COUNT
}
