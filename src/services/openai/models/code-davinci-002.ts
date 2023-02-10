import type { ModelDefinition } from '../types'

const CodeDavinci002: ModelDefinition = {
  adapter: 'openai',
  model: 'code-davinci-002',
  maxTokens: 8000,
  tokenType: 'gpt3',
  stopWords: ['<[im_stop]>'],
}

export default CodeDavinci002
