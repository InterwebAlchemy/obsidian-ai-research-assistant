import type { ChatAdapter } from 'src/types'

const OpenAIModelChatAdapter: ChatAdapter = {
  name: 'openai',
  engine: 'chat',
  endpoint: '/v1/chat/completions'
}

export default OpenAIModelChatAdapter
