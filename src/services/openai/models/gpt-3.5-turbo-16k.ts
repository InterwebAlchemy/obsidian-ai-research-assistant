import OpenAIModelChatAdapter from '../adapters/chat'

import type { ModelDefinition } from '../types'

const GPT35Turbo16K: ModelDefinition = {
  name: 'GPT-3.5 Turbo 16K',
  adapter: OpenAIModelChatAdapter,
  model: 'gpt-3.5-turbo-16k',
  maxTokens: 16385,
  tokenType: 'gpt4'
}

export default GPT35Turbo16K
