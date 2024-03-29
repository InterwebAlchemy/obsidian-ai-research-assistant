import OpenAIModelChatAdapter from '../adapters/chat'

import type { ModelDefinition } from '../types'

const GPT4: ModelDefinition = {
  name: 'GPT-4',
  adapter: OpenAIModelChatAdapter,
  model: 'gpt-4',
  maxTokens: 8192,
  tokenType: 'gpt4'
}

export default GPT4
