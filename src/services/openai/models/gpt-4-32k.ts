import OpenAIModelChatAdapter from '../adapters/chat'

import type { ModelDefinition } from '../types'

const GPT432K: ModelDefinition = {
  name: 'GPT-4 32K',
  adapter: OpenAIModelChatAdapter,
  model: 'gpt-4-32k',
  maxTokens: 32768,
  tokenType: 'gpt4'
}

export default GPT432K
