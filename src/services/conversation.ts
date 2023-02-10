import { v4 as uuidv4 } from 'uuid'

import formatInput from '../utils/formatInput'
import getUnixTimestamp from 'src/utils/getUnixTimestamp'
import CHATGPT from '../prompts/chatgpt'
import { PLUGIN_SETTINGS, DEFAULT_CONVERSATION_TITLE, USER_MESSAGE_OBJECT_TYPE } from '../constants'
import { OPEN_AI_DEFAULT_MODEL, OPEN_AI_COMPLETION_OBJECT_TYPE } from './openai/constants'
import type { OpenAICompletion } from './openai/types'
import type { UserPrompt, ConversationMessage, PluginSettings } from '../types'

export interface ConversationInterface {
  id: string
  title: string
  prompt: string
  timestamp: number
  messages: ConversationMessage[]
  adapter: string
  model?: string
  settings: PluginSettings
}

export class Conversation {
  id: ConversationInterface['id']
  prompt: ConversationInterface['prompt']
  title: ConversationInterface['title']
  timestamp: ConversationInterface['timestamp']
  messages: ConversationInterface['messages']
  context: string
  adapter: string
  model: string
  settings: PluginSettings

  constructor({
    title = DEFAULT_CONVERSATION_TITLE,
    prompt = CHATGPT(),
    timestamp = getUnixTimestamp(),
    id = uuidv4(),
    messages = [],
    model = OPEN_AI_DEFAULT_MODEL.model,
    adapter = OPEN_AI_DEFAULT_MODEL.adapter,
    settings = PLUGIN_SETTINGS,
  }: Partial<ConversationInterface>) {
    this.id = id
    this.prompt = prompt
    this.title = title
    this.timestamp = timestamp
    this.messages = messages
    this.context = prompt
    this.model = model
    this.adapter = adapter
    this.settings = settings
  }

  getContext(includePrompt: boolean = false): string {
    // TODO: summarize the prompt (or maybe the response from OpenAI) and add it to the context
    // instead of just appending the message
    const contextMessages = this.messages
      .filter((message) =>
        [USER_MESSAGE_OBJECT_TYPE, OPEN_AI_COMPLETION_OBJECT_TYPE].includes(message.object)
      )
      // borrowed from: https://stackoverflow.com/a/6473869/656011
      // TODO: make this configurable
      .slice(Math.max(this.messages.length - 12, 0))
      .map((message) => {
        switch (message.object) {
          case USER_MESSAGE_OBJECT_TYPE:
            return formatInput(`${this.settings.userPrefix} ${(message as UserPrompt).prompt}`)

          case OPEN_AI_COMPLETION_OBJECT_TYPE:
            return formatInput(
              `${this.settings.botPrefix} ${(message as OpenAICompletion).choices[0].text}`
            )

          default:
            return ''
        }
      })

    if (includePrompt) {
      contextMessages.unshift(formatInput(this.prompt))
    }

    return contextMessages.join('\n')
  }

  getFullMessageText(message: ConversationMessage): string {
    if (message.object === USER_MESSAGE_OBJECT_TYPE) {
      return formatInput(
        `${this.prompt}\n${this.getContext()}\n${this.settings.userPrefix} ${
          (message as UserPrompt).prompt
        }\n${this.settings.botPrefix}`
      )
    } else if (message.object === OPEN_AI_COMPLETION_OBJECT_TYPE) {
      return formatInput(
        `${this.settings.botPrefix} ${(message as OpenAICompletion).choices[0].text}`
      )
    } else {
      return JSON.stringify(message)
    }
  }

  addMessage(message: Partial<ConversationMessage>): void {
    if (typeof message?.id === 'undefined') {
      message.id = uuidv4()
    }

    if (typeof message?.created === 'undefined') {
      message.created = getUnixTimestamp()
    }

    if (message.object === USER_MESSAGE_OBJECT_TYPE) {
      const inputText = formatInput(`${(message as UserPrompt).prompt}`)
      const inputContext = formatInput(this.prompt + this.getContext())

      ;(message as UserPrompt).context = inputContext
      ;(message as UserPrompt).prompt = inputText

      this.context = this.getFullMessageText(message as ConversationMessage)
    } else if (message.object === OPEN_AI_COMPLETION_OBJECT_TYPE) {
      this.context = this.getFullMessageText(message as ConversationMessage)
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

  startConversation({ prompt, title, settings }: Partial<Conversation>): Conversation {
    const conversation = new Conversation({
      prompt,
      title,
      settings,
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
