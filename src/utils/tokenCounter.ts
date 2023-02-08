import GPT3Tokenizer from 'gpt3-tokenizer'

import formatInput from './formatInput'

export interface TokenCounterOptions {
  // TODO: figure out what may need to be done to support other adapters and models
  type?: 'gpt3' | 'codex'
  debug?: boolean
  prefix?: string
}

const tokenCounter = (text: string, options: TokenCounterOptions = {}): number => {
  const { type = 'gpt3', debug = false, prefix = '' } = options

  const tokenizer = new GPT3Tokenizer({ type })

  const tokens = tokenizer.encode(formatInput(`${prefix}\n${text}`))

  if (debug) {
    console.debug('TOKENS:', tokens)
  }

  return tokens.text.length
}

export default tokenCounter
