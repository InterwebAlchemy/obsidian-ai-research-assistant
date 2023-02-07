// combine the conversation service and openai service into an integrated chat service
// make sure to udpate the conversation context when user sends a message

import Conversations, { type Conversation } from './conversation'
import { openAICompletion } from './openai'

import { OPEN_AI_MODEL, USER_MESSAGE_OBJECT_TYPE } from '../constants'

import type { ChatAdapter } from '../types'

export interface ChatInterface {
  apiKey: string
  adapter?: ChatAdapter
  model?: string
}

class Chat {
  apiKey: string
  adapter: ChatAdapter
  model: string
  currentConversationId: string | null = null

  constructor({ apiKey, model = OPEN_AI_MODEL }: ChatInterface) {
    this.apiKey = apiKey
    this.adapter = 'openai'
    this.currentConversationId = null
    this.model = model
  }

  currentConversation(): Conversation | null {
    if (this.currentConversationId === null) {
      return null
    }

    return Conversations.getConversation(this.currentConversationId)
  }

  async send(message: string): Promise<void> {
    const conversation = this.currentConversation()

    if (typeof message !== 'undefined' && message !== '' && conversation !== null) {
      conversation.addMessage({
        prompt: message,
        object: USER_MESSAGE_OBJECT_TYPE,
      })

      switch (this.adapter) {
        case 'openai':
          try {
            const response = await openAICompletion({
              apiKey: this.apiKey,
              input: message,
              context: conversation.context,
              model: this.model,
            })

            conversation.addMessage(response)
          } catch (error) {
            console.error(error)
          }

          break
      }
    }
  }

  start({ prompt, title }: Partial<Conversation>): void {
    const conversation = Conversations.startConversation({ prompt, title })

    this.currentConversationId = conversation.id
  }

  updateConversationTitle(title: string, id = this.currentConversationId): void {
    if (id !== null) {
      Conversations.updateConversationTitle(id, title)
    }
  }
}

export default Chat
