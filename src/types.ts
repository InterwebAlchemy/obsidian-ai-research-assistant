// TODO: update this union type with other valid adapters as they are added
export type ChatAdapter = 'openai'

export interface OpenAICompletionRequest {
  apiKey: string
  input: string
  temperature?: number
  context?: string
  model?: string
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
  // TODO: find out what other valid object values are
  object: 'text_completion'
  created: number
  model: string
  choices: OpenAICompletionChoice[]
  usage: OpenAICompletionUsage
}

export interface UserPrompt {
  id: string
  object: string
  prompt: string
  created: number
  context?: string
}

export type ConversationMessage = UserPrompt | OpenAICompletion
