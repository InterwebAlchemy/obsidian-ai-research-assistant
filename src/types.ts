import type OpenAI from 'openai'

import type {
  ModelDefinition,
  OpenAIModel,
  OpenAICompletion
} from './services/openai/types'

// TODO: update this union type with other valid adapters as they are added
export type ChatAdapterName = 'openai'

export type ChatAdapterEngine = 'chat' | 'code' | 'prompt' | 'completion'

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

export interface ProviderSettings {
  id: string
  name: string
  baseUrl?: string
  defaultModel: string
  /** Model IDs currently shown in the model picker (subset of known + custom). */
  enabledModels: string[]
  /** User-added model IDs beyond the bundled catalog. */
  customModels: string[]
}

export interface PluginSettings {
  debugMode: boolean

  // Provider config
  activeProviderId: string
  providers: Record<string, ProviderSettings>

  // Transitional: kept for ConversationSettings compat (derived from active provider on load)
  defaultModel?: OpenAIModel

  defaultPreamble?: string
  defaultMaxTokens?: number
  defaultTokenBuffer?: number
  temperature: number
  maxTokens: number

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
