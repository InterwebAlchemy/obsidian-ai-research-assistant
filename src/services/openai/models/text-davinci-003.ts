import { OPEN_AI_GPT3_STOP_WORD, OPEN_AI_GPT_START_WORD } from './constants'

import type { ModelDefinition } from '../types'

const TextDavinci003: ModelDefinition = {
  adapter: 'openai',
  model: 'text-davinci-003',
  maxTokens: 4000,
  tokenType: 'gpt3',
  startWord: OPEN_AI_GPT_START_WORD,
  stopWord: OPEN_AI_GPT3_STOP_WORD,
}

export default TextDavinci003
