import type { ChatAdapter } from 'src/types'

const OpenAIModelCompletionAdapter: ChatAdapter = {
  name: 'openai',
  engine: 'completion',
  endpoint: '/v1/completions'
}

export default OpenAIModelCompletionAdapter
