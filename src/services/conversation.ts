import { v4 as uuidv4 } from 'uuid'

import CHATGPT from '../prompts/chatgpt'
import { DEFAULT_CONVERSATION_TITLE, OPEN_AI_MODEL, USER_MESSAGE_OBJECT_TYPE } from '../constants'

import type { UserPrompt, ConversationMessage, OpenAICompletion } from '../types'

export interface ConversationInterface {
  id: string
  title: string
  prompt: string
  timestamp: number
  messages: ConversationMessage[]
  adapter: string
  model?: string
}

export class Conversation {
  id: ConversationInterface['id']
  prompt: ConversationInterface['prompt']
  title: ConversationInterface['title']
  timestamp: ConversationInterface['timestamp']
  messages: ConversationInterface['messages']
  context: string
  adapter: string
  model?: string

  constructor({
    title = DEFAULT_CONVERSATION_TITLE,
    prompt = CHATGPT(),
    timestamp = Math.round(+new Date() / 1000),
    id = uuidv4(),
    messages = [],
    model = OPEN_AI_MODEL,
    adapter = 'openai',
  }: Partial<ConversationInterface>) {
    this.id = id
    this.prompt = prompt
    this.title = title
    this.timestamp = timestamp
    this.messages = messages
    this.context = prompt
    this.model = model
    this.adapter = adapter
  }

  addMessage(message: Partial<ConversationMessage>): void {
    if (typeof message?.id === 'undefined') {
      message.id = uuidv4()
    }

    if (typeof message?.created === 'undefined') {
      message.created = Math.round(+new Date() / 1000)
    }

    if (message.object === USER_MESSAGE_OBJECT_TYPE) {
      if (typeof (message as UserPrompt)?.context === 'undefined') {
        ;(message as UserPrompt).context = this.context.trim()
      }

      // TODO: summarize the prompt (or maybe the response from OpenAI) and add it to the context
      // instead of just appending the message
      this.context = `${this.context}\n${(message as UserPrompt).prompt.trim()}`.replace(
        /\n\n/g,
        '\n'
      )
    } else if (message.object === 'text_completion') {
      this.context = `${this.context.trim()}\n${(
        message as OpenAICompletion
      ).choices[0].text.trim()}`.replace(/\n\n/g, '\n')
    }

    this.messages.push(message as ConversationMessage)
  }

  updateTitle(title: string): void {
    this.title = title
  }

  updateContext(context: string): void {
    this.context = context
  }
}

export interface ConversationManagerInterface {
  conversations: Record<string, Conversation>
}

export class ConversationManager {
  conversations: ConversationManagerInterface['conversations']
  currentConversationId: string | null = null

  constructor() {
    this.conversations = {}
  }

  startConversation({ prompt, title }: Partial<Conversation>): Conversation {
    const conversation = new Conversation({
      prompt,
      title,
    })

    this.conversations[conversation.id] = conversation

    this.currentConversationId = conversation.id

    return conversation
  }

  currentConversation(): Conversation | null {
    if (this.currentConversationId === null) {
      return null
    }

    return this.conversations[this.currentConversationId]
  }

  getConversation(id: string): Conversation | null {
    if (typeof this.conversations[id] !== 'undefined') {
      return this.conversations[id]
    }

    return null
  }

  updateConversationTitle(id: string, title: string): void {
    this.conversations[id].updateTitle(title)
  }

  addMessage(id: string, message: ConversationMessage): void {
    this.conversations[id].addMessage(message)
  }
}

const Conversations = new ConversationManager()

export default Conversations
