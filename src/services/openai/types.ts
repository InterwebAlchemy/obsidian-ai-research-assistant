import type { Conversation } from '../conversation'

import type { ChatAdapter } from '../../types'

import type { TokenCounterType } from '../../utils/tokenCounter'

// TODO: add other models
export type OpenAIModel =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-3.5-turbo-instruct'
  | 'gpt-4'
  | 'gpt-4-32k'

// TODO: find out what other valid object values are
// tODO: It think this was deprecated with the older completion models
export type OpenAICompletionObject = 'text_completion'

export interface ModelDefinition {
  name: string
  adapter: ChatAdapter
  model: OpenAIModel
  maxTokens: number
  tokenType: TokenCounterType
  startWord?: string
  stopWord?: string
}

export interface OpenAICompletionRequest {
  input: string | Conversation
  temperature?: number
  model?: ModelDefinition
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
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
