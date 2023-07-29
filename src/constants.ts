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
export const DEFAULT_TOKEN_TYPE = 'gpt3'
export const DEFAULT_MAX_MEMORY_COUNT = 10
export const DEFAULT_MAX_TOKENS = DEFAULT_MODEL.maxTokens
export const DEFAULT_TOKEN_BUFFER = Math.floor(DEFAULT_MAX_TOKENS / 4)
export const DEFAULT_AUTO_SAVE_INTERVAL = 60

export const PLUGIN_SETTINGS: PluginSettings = {
  debugMode: false,
  openAiApiKey: '',
  apiKeySaved: false,
  defaultTokenBuffer: DEFAULT_TOKEN_BUFFER,
  defaultMaxTokens: DEFAULT_MAX_TOKENS,
  defaultModel: OPEN_AI_DEFAULT_MODEL_NAME,
  defaultPreamble: ChatGPTPreamble(),
  autosaveConversationHistory: false,
  // autosave every 15 seconds by default
  autosaveInterval: 60,
  conversationHistoryDirectory: `${PLUGIN_NAME}/History`,
  userHandle: USER_HANDLE,
  botHandle: BOT_HANDLE,
  maxMemoryCount: DEFAULT_MAX_MEMORY_COUNT
}
