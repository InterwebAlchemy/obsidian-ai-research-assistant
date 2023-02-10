import GPT3Tokenizer from 'gpt3-tokenizer'

import { DEFAULT_TOKEN_TYPE } from '../constants'

export type TokenCounterType = 'gpt3' | 'codex'

export interface TokenCounterOptions {
  // TODO: figure out what may need to be done to support other adapters and models
  type?: TokenCounterType
  debug?: boolean
  prefix?: string
}

const tokenCounter = (text: string, options: TokenCounterOptions = {}): number => {
  const { type = DEFAULT_TOKEN_TYPE, debug = false } = options

  const tokenizer = new GPT3Tokenizer({ type })

  const tokens = tokenizer.encode(text)

  if (debug) {
    console.debug('TOKENS:', tokens)
  }

  return tokens.text.length
}

export default tokenCounter
