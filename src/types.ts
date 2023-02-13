import type { ModelDefinition, OpenAIModel, OpenAICompletion } from './services/openai/types'

// TODO: update this union type with other valid adapters as they are added
export type ChatAdapter = 'openai'

export type MemoryState = 'default' | 'core' | 'remembered' | 'forgotten'

export interface PluginSettings {
  debugMode: boolean

  openApiKey: string
  apiKeySaved: boolean

  defaultModel: OpenAIModel
  defaultPreamble?: string
  defaultMaxTokens?: number
  defaultTokenBuffer?: number

  userPrefix: string
  botPrefix: string

  autosaveConversationHistory: boolean
  autosaveInterval: number
  conversationHistoryDirectory: string

  enableMemory: boolean
  maxMemoryCount?: number
  enableMemoryManager: boolean
}

export interface UserPrompt {
  object: string
  prompt: string
  created: number
  context?: string
  fullText?: string
  model?: ModelDefinition
}

export interface SystemMessage {
  object: string
  output: string
  created: number
}

export type ConversationMessageType = UserPrompt | OpenAICompletion | SystemMessage

export interface ConversationMessage {
  id: string
  memoryState: MemoryState
  message: ConversationMessageType
}
