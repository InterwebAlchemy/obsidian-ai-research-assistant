import type OpenAI from 'openai'

import type {
  ModelDefinition,
  OpenAIModel,
  OpenAICompletion
} from './services/openai/types'

// TODO: update this union type with other valid adapters as they are added
export type ChatAdapterName = 'openai'

export type ChatAdapterEngine = 'chat' | 'code' | 'prompt'

export type MemoryState =
  | 'default'
  | 'core'
  | 'remembered'
  | 'forgotten'
  | 'system'

export interface ChatAdapter {
  name: ChatAdapterName
  engine?: ChatAdapterEngine
  endpoint?: string
}

export interface PluginSettings {
  debugMode: boolean

  openAiApiKey: string
  apiKeySaved: boolean

  defaultModel: OpenAIModel
  defaultPreamble?: string
  defaultMaxTokens?: number
  defaultTokenBuffer?: number

  userHandle: string
  botHandle: string

  autosaveConversationHistory: boolean
  autosaveInterval: number
  conversationHistoryDirectory: string

  maxMemoryCount?: number
}

export interface UserPrompt {
  object: string
  prompt: string
  created: number
  context?: string
  fullText?: string
  model?: ModelDefinition
  messages?: Array<Partial<OpenAI.Chat.ChatCompletion>>
}

export interface SystemMessage {
  object: string
  output: string
  created: number
}

export type ConversationMessageType =
  | UserPrompt
  | OpenAICompletion
  | SystemMessage
  | OpenAI.Chat.ChatCompletion
export interface ConversationMessage {
  id: string
  memoryState: MemoryState
  message: ConversationMessageType
}
