import { OPEN_AI_GPT2_STOP_WORD, OPEN_AI_GPT_START_WORD } from './constants'

import type { ModelDefinition } from '../types'

const CodeDavinci002: ModelDefinition = {
  adapter: 'openai',
  model: 'code-davinci-002',
  maxTokens: 8000,
  tokenType: 'gpt3',
  startWord: OPEN_AI_GPT_START_WORD,
  stopWord: OPEN_AI_GPT2_STOP_WORD,
}

export default CodeDavinci002
