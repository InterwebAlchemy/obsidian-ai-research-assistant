import type { PluginSettings } from './types'

import AssistantPreamble from './preambles/assistant'
import { OPEN_AI_DEFAULT_MODEL_NAME } from './services/openai/constants'

export const PLUGIN_NAME = 'AI Research Assistant'
export const PLUGIN_PREFIX = 'ai-research-assistant'
export const DEFAULT_CONVERSATION_TITLE = 'New Conversation'
export const USER_MESSAGE_OBJECT_TYPE = `${PLUGIN_PREFIX.replace(/-/g, '_')}_user_message`
export const USER_PREFIX = 'You:'
export const BOT_PREFIX = 'AI:'
export const DEFAULT_TOKEN_TYPE = 'gpt3'
export const DEFAULT_MAX_MEMORY_COUNT = 10

export const PLUGIN_SETTINGS: PluginSettings = {
  debugMode: false,
  openApiKey: '',
  apiKeySaved: false,
  defaultModel: OPEN_AI_DEFAULT_MODEL_NAME,
  defaultPreamble: AssistantPreamble(),
  autosaveConversationHistory: false,
  conversationHistoryDirectory: `${PLUGIN_NAME}/History`,
  userPrefix: USER_PREFIX,
  botPrefix: BOT_PREFIX,
  enableMemory: false,
  maxMemoryCount: DEFAULT_MAX_MEMORY_COUNT,
  enableMemoryManager: false,
}
