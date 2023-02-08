// Models:
// 'text-davinci-003'
// 'text-chat-davinci-002-20221122' // dead 2023-02-07
// 'text-davinci-002-render' // what ChatGPT uses when rendering text
import type { GPTHelperSettings } from './main'

export const PLUGIN_NAME = 'AI Research Assistant'
export const PLUGIN_PREFIX = 'ai-research-assistant'
export const DEFAULT_CONVERSATION_TITLE = 'New Conversation'
export const USER_MESSAGE_OBJECT_TYPE = `${PLUGIN_PREFIX.replace(/-/g, '_')}_user_message`

export const PLUGIN_SETTINGS: GPTHelperSettings = {
  debugMode: false,
  openApiKey: '',
  apiKeySaved: false,
  autosaveConversationHistory: false,
  conversationHistoryDirectory: `${PLUGIN_NAME}/History`,
}

export const OPEN_AI_BASE_URL = 'https://api.openai.com'
export const OPEN_AI_MODEL = 'text-davinci-003'
export const OPEN_AI_RESPONSE_TOKENS = 500
export const OPEN_AI_MAX_TOKENS = 4097
