// Models:
// 'text-davinci-003'
// 'text-chat-davinci-002-20221122' // dead 2023-02-07
// 'text-davinci-002-render' // what ChatGPT uses when rendering text

import models from './models'

export const OPEN_AI_BASE_URL = 'https://api.openai.com'

export const OPEN_AI_API_KEY_URL = 'https://platform.openai.com/account/api-keys'

export const OPEN_AI_RESPONSE_TOKENS = 500

export const OPEN_AI_DEFAULT_MODEL_NAME = 'text-davinci-003'

export const OPEN_AI_DEFAULT_MODEL = models[OPEN_AI_DEFAULT_MODEL_NAME]

export const OPEN_AI_COMPLETION_OBJECT_TYPE = 'text_completion'
