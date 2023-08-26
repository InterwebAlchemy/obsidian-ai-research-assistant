import type { ChatAdapter } from '../../../types'

import type { ModelDefinition } from '../types'

const GPT4Adapter: ChatAdapter = {
  name: 'openai',
  engine: 'chat',
  endpoint: '/v1/chat/completions'
}

const GPT4: ModelDefinition = {
  name: 'GPT-4',
  adapter: GPT4Adapter,
  model: 'gpt-4',
  maxTokens: 8000,
  tokenType: 'gpt4'
}

export default GPT4
