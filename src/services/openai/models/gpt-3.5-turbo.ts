import OpenAIModelChatAdapter from '../adapters/chat'

import type { ModelDefinition } from '../types'

const GPT35Turbo: ModelDefinition = {
  name: 'GPT-3.5 Turbo',
  adapter: OpenAIModelChatAdapter,
  model: 'gpt-3.5-turbo',
  maxTokens: 4097,
  tokenType: 'gpt4'
}

export default GPT35Turbo
