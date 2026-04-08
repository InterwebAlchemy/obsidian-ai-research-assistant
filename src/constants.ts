import type { PluginSettings } from './types'

import ChatGPTPreamble from './preambles/chatgpt'
import models from './services/openai/models'
import { OPEN_AI_DEFAULT_MODEL_NAME } from './services/openai/constants'

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

export const BUILTIN_PROVIDER_IDS = [
  'openrouter',
  'openai',
  'anthropic',
  'mistral',
  'local'
] as const

// ─── Known model catalog (bundled, not persisted) ────────────────────────────

export interface KnownModel {
  id: string
  name: string
  contextWindow?: number
}

export const KNOWN_MODELS: Record<string, KnownModel[]> = {
  openrouter: [
    { id: 'openrouter/auto', name: 'Auto (best available)' },
    {
      id: 'anthropic/claude-opus-4-6',
      name: 'Claude Opus 4.6',
      contextWindow: 200000
    },
    {
      id: 'anthropic/claude-sonnet-4-6',
      name: 'Claude Sonnet 4.6',
      contextWindow: 200000
    },
    {
      id: 'anthropic/claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      contextWindow: 200000
    },
    { id: 'openai/gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
    { id: 'openai/o3', name: 'o3', contextWindow: 200000 },
    {
      id: 'mistralai/mistral-large-2411',
      name: 'Mistral Large',
      contextWindow: 128000
    },
    {
      id: 'google/gemini-2.0-flash-001',
      name: 'Gemini 2.0 Flash',
      contextWindow: 1048576
    }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000 },
    { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192 },
    { id: 'gpt-4-32k', name: 'GPT-4 32K', contextWindow: 32768 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385 },
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5 Turbo 16K',
      contextWindow: 16385
    },
    {
      id: 'gpt-3.5-turbo-instruct',
      name: 'GPT-3.5 Turbo Instruct',
      contextWindow: 4096
    },
    { id: 'o3-mini', name: 'o3 Mini', contextWindow: 200000 },
    { id: 'o1', name: 'o1', contextWindow: 200000 },
    { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000 }
  ],
  anthropic: [
    {
      id: 'claude-opus-4-6',
      name: 'Claude Opus 4.6',
      contextWindow: 200000
    },
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
  ],
  mistral: [
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      contextWindow: 131072
    },
    {
      id: 'mistral-small-latest',
      name: 'Mistral Small',
      contextWindow: 131072
    },
    { id: 'codestral-latest', name: 'Codestral', contextWindow: 256000 }
  ],
  local: []
}

export const PLUGIN_SETTINGS: PluginSettings = {
  debugMode: false,
  activeProviderId: 'openai',
  providers: {
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openrouter/auto',
      enabledModels: KNOWN_MODELS.openrouter.map((m) => m.id),
      customModels: []
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com',
      defaultModel: 'gpt-4o',
      enabledModels: KNOWN_MODELS.openai.map((m) => m.id),
      customModels: []
    },
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      defaultModel: 'claude-sonnet-4-6',
      enabledModels: KNOWN_MODELS.anthropic.map((m) => m.id),
      customModels: []
    },
    mistral: {
      id: 'mistral',
      name: 'Mistral',
      baseUrl: 'https://api.mistral.ai',
      defaultModel: 'mistral-large-latest',
      enabledModels: KNOWN_MODELS.mistral.map((m) => m.id),
      customModels: []
    },
    local: {
      id: 'local',
      name: 'Local (LM Studio / Ollama / etc.)',
      baseUrl: 'http://localhost:1234',
      defaultModel: '',
      enabledModels: [],
      customModels: []
    }
  },
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
