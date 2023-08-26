// combine the conversation service and openai service into an integrated chat service
// make sure to udpate the conversation context when user sends a message

import Conversations, { type Conversation } from './conversation'
import { openAICompletion } from './openai'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'

import { OPEN_AI_DEFAULT_MODEL } from './openai/constants'

import type { ModelDefinition } from './openai/types'

import type Logger from './logger'

export interface ChatInterface {
  apiKey: string
  model?: ModelDefinition
  logger: Logger
}

class Chat {
  model: ModelDefinition
  currentConversationId: string | null = null
  conversations: typeof Conversations
  logger: Logger

  constructor({ model = OPEN_AI_DEFAULT_MODEL, logger }: ChatInterface) {
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

  async send(prompt: string): Promise<void> {
    const conversation = this.currentConversation()

    if (
      typeof prompt !== 'undefined' &&
      prompt !== '' &&
      conversation !== null
    ) {
      const message = conversation.addMessage({
        prompt,
        object: USER_MESSAGE_OBJECT_TYPE,
        model: this.model
      })

      switch (this.model.adapter.name) {
        case 'openai':
          try {
            const response = await openAICompletion(
              {
                input:
                  this.model.adapter.engine === 'chat'
                    ? conversation
                    : conversation.getFullMessageText(message),
                model: conversation.model ?? this.model,
                temperature: conversation.settings.temperature,
                maxTokens: conversation.settings.maxTokens,
                topP: conversation.settings.topP,
                presencePenalty: conversation.settings.presencePenalty,
                frequencyPenalty: conversation.settings.frequencyPenalty
              },
              this.currentConversation()?.settings,
              this.logger
            )

            conversation.addMessage(response)
          } catch (error) {
            conversation.addMessage(error.message)

            console.error(error)
          }

          break
      }
    }
  }

  start({ preamble, title, settings }: Partial<Conversation>): void {
    const conversation = this.conversations.startConversation({
      preamble,
      title,
      settings
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
  }
}

export default Chat
