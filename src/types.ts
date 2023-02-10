import type { OpenAIModel, OpenAICompletion } from './services/openai/types'

// TODO: update this union type with other valid adapters as they are added
export type ChatAdapter = 'openai'

export interface PluginSettings {
  debugMode: boolean

  openApiKey: string
  apiKeySaved: boolean

  defaultModel: OpenAIModel

  userPrefix: string
  botPrefix: string

  autosaveConversationHistory: boolean
  conversationHistoryDirectory: string
}

export interface UserPrompt {
  id: string
  object: string
  prompt: string
  created: number
  context?: string
}

export type ConversationMessage = UserPrompt | OpenAICompletion
