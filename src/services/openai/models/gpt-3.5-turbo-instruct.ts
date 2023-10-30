import OpenAIModelCompletionAdapter from '../adapters/completion'

import type { ModelDefinition } from '../types'

const GPT35TurboInstruct: ModelDefinition = {
  name: 'GPT-3.5 Turbo Instruct',
  adapter: OpenAIModelCompletionAdapter,
  model: 'gpt-3.5-turbo-instruct',
  maxTokens: 8192,
  tokenType: 'gpt4'
}

export default GPT35TurboInstruct
