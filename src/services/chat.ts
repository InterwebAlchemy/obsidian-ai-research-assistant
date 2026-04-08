import Conversations, { type Conversation } from './conversation'
import type { ProviderAdapter, StreamChunk, ChatMessage } from './providers'

import {
  USER_MESSAGE_OBJECT_TYPE,
  SYSTEM_MESSAGE_OBJECT_TYPE
} from '../constants'
import {
  OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE,
  OPEN_AI_DEFAULT_MODEL
} from './openai/constants'

import type { ModelDefinition } from './openai/types'
import type { UserPrompt, SystemMessage } from '../types'
import type Logger from './logger'

import type { OpenAI } from 'openai'

export interface ChatInterface {
  adapter: ProviderAdapter
  model?: ModelDefinition
  logger: Logger
}

// ─── Message formatting ───────────────────────────────────────────────────────

/**
 * Convert the plugin's Conversation format into the provider-agnostic
 * ChatMessage[] format used by all adapter implementations.
 */
function formatMessages(conversation: Conversation): ChatMessage[] {
  const messages = conversation.getConversationMessages()

  return messages.map((msg) => {
    switch (msg.message.object) {
      case USER_MESSAGE_OBJECT_TYPE:
        return { role: 'user', content: (msg.message as UserPrompt).prompt }

      case OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE:
        return {
          role: 'assistant',
          content:
            ((msg.message as OpenAI.Chat.ChatCompletion).choices?.[0]?.message
              ?.content as string) ?? ''
        }

      case SYSTEM_MESSAGE_OBJECT_TYPE:
      default:
        return {
          role: 'system',
          content: (msg.message as SystemMessage).output ?? ''
        }
    }
  })
}

// ─── Chat service ─────────────────────────────────────────────────────────────

class Chat {
  adapter: ProviderAdapter
  model: ModelDefinition
  currentConversationId: string | null = null
  conversations: typeof Conversations
  logger: Logger

  constructor({
    adapter,
    model = OPEN_AI_DEFAULT_MODEL,
    logger
  }: ChatInterface) {
    this.adapter = adapter
    this.currentConversationId = null
    this.model = model
    this.conversations = Conversations
    this.logger = logger
  }

  currentConversation(): Conversation | null {
    if (this.currentConversationId === null) {
      return null
    }
    return this.conversations.getConversation(this.currentConversationId)
  }

  async send(
    prompt: string,
    { signal }: Partial<{ signal?: AbortSignal }>
  ): Promise<AsyncIterable<StreamChunk> | undefined> {
    const conversation = this.currentConversation()

    if (prompt === '' || conversation === null) return undefined

    conversation.addMessage({
      prompt,
      object: USER_MESSAGE_OBJECT_TYPE,
      model: this.model
    })

    const messages = formatMessages(conversation)
    const { settings } = conversation

    return this.adapter.stream(
      messages,
      {
        model: conversation.model?.model ?? this.model.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: (settings as { topP?: number }).topP,
        frequencyPenalty: (settings as { frequencyPenalty?: number })
          .frequencyPenalty,
        presencePenalty: (settings as { presencePenalty?: number })
          .presencePenalty
      },
      signal
    )
  }

  start({ preamble, title, settings }: Partial<Conversation>): void {
    const conversation = this.conversations.startConversation({
      preamble,
      title,
      settings,
      model: this.model
    })
    this.currentConversationId = conversation.id
  }

  updateConversationTitle(
    title: string,
    id = this.currentConversationId
  ): void {
    if (id !== null) {
      this.conversations.updateConversationTitle(id, title)
    } else if (this.currentConversationId !== null) {
      this.conversations.updateConversationTitle(
        this.currentConversationId,
        title
      )
    }
  }

  updateModel(model: ModelDefinition): void {
    this.model = model
    if (this.currentConversationId !== null) {
      this.conversations.updateConversationModel(
        this.currentConversationId,
        model
      )
    }
  }

  updateAdapter(adapter: ProviderAdapter): void {
    this.adapter = adapter
  }
}

export default Chat
