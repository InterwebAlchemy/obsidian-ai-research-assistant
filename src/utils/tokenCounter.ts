import { encode } from 'gpt-tokenizer'

import { encode as oldEncoder } from 'gpt-tokenizer/esm/model/text-davinci-003'

import { DEFAULT_TOKEN_TYPE } from '../constants'

export type TokenCounterType = 'gpt3' | 'gpt4'

export interface TokenCounterOptions {
  type?: TokenCounterType
}

const tokenCounter = (
  text: string,
  options: TokenCounterOptions = {}
): number => {
  const { type = DEFAULT_TOKEN_TYPE } = options

  const tokens = type === 'gpt3' ? oldEncoder(text) : encode(text)

  return tokens.length
}

export default tokenCounter
