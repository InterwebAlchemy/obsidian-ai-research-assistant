import models from './models'

export const OPEN_AI_BASE_URL = 'https://api.openai.com'
export const OPEN_AI_API_KEY_URL =
  'https://platform.openai.com/account/api-keys'

export const OPEN_AI_DEFAULT_TEMPERATURE = 0.75

export const OPEN_AI_RESPONSE_TOKENS = 500
export const OPEN_AI_DEFAULT_MODEL_NAME = 'gpt-3.5-turbo'
export const OPEN_AI_DEFAULT_MODEL = models[OPEN_AI_DEFAULT_MODEL_NAME]

export const OPEN_AI_COMPLETION_OBJECT_TYPE = 'text_completion'
export const OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE = 'chat.completion'
