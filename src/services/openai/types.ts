import type { ChatAdapter } from '../../types'

import type { TokenCounterType } from '../../utils/tokenCounter'

// TODO: add other models: 'code-cushman-001' | 'text-curie-001' | 'text-babbage-001' | 'text-ada-001'
export type OpenAIModel = 'text-davinci-003' | 'code-davinci-002'

// TODO: find out what other valid object values are
export type OpenAICompletionObject = 'text_completion'

export interface ModelDefinition {
  adapter: ChatAdapter
  model: OpenAIModel
  maxTokens: number
  tokenType: TokenCounterType
  stopWords: string[]
}

export interface OpenAICompletionRequest {
  input: string
  temperature?: number
  context?: string
  model?: ModelDefinition
  stream?: boolean
}

export interface OpenAICompletionChoiceFinishDetails {
  type: string
  stop: string
}

export interface OpenAICompletionChoice {
  text: string
  index: number
  logprobs: null | unknown
  finish_details: OpenAICompletionChoiceFinishDetails
}

export interface OpenAICompletionUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface OpenAICompletion {
  id: string
  object: OpenAICompletionObject
  created: number
  model: string
  choices: OpenAICompletionChoice[]
  usage: OpenAICompletionUsage
}
