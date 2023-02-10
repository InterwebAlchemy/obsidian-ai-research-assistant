// combine the conversation service and openai service into an integrated chat service
// make sure to udpate the conversation context when user sends a message

import Conversations, { type Conversation } from './conversation'
import { openAICompletion } from './openai'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'

import { OPEN_AI_DEFAULT_MODEL } from './openai/constants'

import type { ModelDefinition } from './openai/types'

export interface ChatInterface {
  apiKey: string
  model?: ModelDefinition
}

class Chat {
  model: ModelDefinition
  currentConversationId: string | null = null
  conversations: typeof Conversations

  constructor({ model = OPEN_AI_DEFAULT_MODEL }: ChatInterface) {
    this.currentConversationId = null
    this.model = model
    this.conversations = Conversations
  }

  currentConversation(): Conversation | null {
    if (this.currentConversationId === null) {
      return null
    }

    return this.conversations.getConversation(this.currentConversationId)
  }

  async send(message: string): Promise<void> {
    const conversation = this.currentConversation()

    if (typeof message !== 'undefined' && message !== '' && conversation !== null) {
      conversation.addMessage({
        prompt: message,
        object: USER_MESSAGE_OBJECT_TYPE,
      })

      switch (this.model.adapter) {
        case 'openai':
          try {
            const response = await openAICompletion(
              {
                input: message,
                context: conversation.context,
                model: this.model,
              },
              this.currentConversation()?.settings
            )

            conversation.addMessage(response)
          } catch (error) {
            console.error(error)
          }

          break
      }
    }
  }

  start({ prompt, title, settings }: Partial<Conversation>): void {
    const conversation = this.conversations.startConversation({ prompt, title, settings })

    this.currentConversationId = conversation.id
  }

  updateConversationTitle(title: string, id = this.currentConversationId): void {
    if (id !== null) {
      this.conversations.updateConversationTitle(id, title)
    } else if (this.currentConversationId !== null) {
      this.conversations.updateConversationTitle(this.currentConversationId, title)
    }
  }
}

export default Chat
