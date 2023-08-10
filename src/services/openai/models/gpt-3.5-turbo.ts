import type { ChatAdapter } from '../../../types'

import type { ModelDefinition } from '../types'

const GPT35TurboAdapter: ChatAdapter = {
  name: 'openai',
  engine: 'chat',
  endpoint: '/v1/chat/completions'
}

const GPT35Turbo: ModelDefinition = {
  adapter: GPT35TurboAdapter,
  model: 'gpt-3.5-turbo',
  maxTokens: 4000,
  tokenType: 'gpt4'
}

export default GPT35Turbo
