import type { ModelDefinition } from '../types'

const TextDavinci003: ModelDefinition = {
  adapter: 'openai',
  model: 'text-davinci-003',
  maxTokens: 4000,
  tokenType: 'gpt3',
  stopWords: ['<[im_stop]>'],
}

export default TextDavinci003
