import { v4 as uuidv4 } from 'uuid'

import type OpenAI from 'openai'

import models from './openai/models'

import formatInput from '../utils/formatInput'
import getUnixTimestamp from '../utils/getUnixTimestamp'
import formatChat from './openai/utils/formatChat'

import {
  PLUGIN_SETTINGS,
  DEFAULT_CONVERSATION_TITLE,
  SYSTEM_MESSAGE_OBJECT_TYPE,
  USER_MESSAGE_OBJECT_TYPE,
  DEFAULT_MAX_MEMORY_COUNT
} from '../constants'
import {
  OPEN_AI_DEFAULT_MODEL,
  OPEN_AI_COMPLETION_OBJECT_TYPE,
  OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE,
  OPEN_AI_DEFAULT_TEMPERATURE,
  OPEN_AI_RESPONSE_TOKENS
} from './openai/constants'
import type { ModelDefinition, OpenAICompletion } from './openai/types'
import type {
  UserPrompt,
  ConversationMessageType,
  ConversationMessage,
  PluginSettings,
  MemoryState
} from '../types'

export interface ConversationSettings extends PluginSettings {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface ConversationInterface {
  id: string
  title: string
  preamble: string
  timestamp: number
  messages: ConversationMessage[]
  model?: ModelDefinition
  settings: ConversationSettings
}

export class Conversation {
  id: ConversationInterface['id']
  preamble: ConversationInterface['preamble']
  title: ConversationInterface['title']
  timestamp: ConversationInterface['timestamp']
  messages: ConversationInterface['messages']
  model: ModelDefinition
  settings: ConversationSettings
  temperature: number

  constructor({
    title = DEFAULT_CONVERSATION_TITLE,
    preamble = '',
    timestamp = getUnixTimestamp(),
    id = uuidv4(),
    messages = [],
    settings = PLUGIN_SETTINGS,
    model
  }: Partial<ConversationInterface>) {
    const conversationSettings = {
      maxTokens: OPEN_AI_RESPONSE_TOKENS,
      temperature: OPEN_AI_DEFAULT_TEMPERATURE,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      ...settings
    }

    this.settings = conversationSettings

    this.id = id
    this.preamble = preamble
    this.title = title
    this.timestamp = timestamp
    this.messages = messages
    this.model =
      model ?? models[this.settings.defaultModel] ?? OPEN_AI_DEFAULT_MODEL
  }

  getNumberofMemoriesForState(state: MemoryState): number {
    return this.getMemories(state).length
  }

  getTotalNumberOfMemories(): number {
    return this.getMemories(['default', 'core', 'remembered']).length
  }

  getMemories(
    state: MemoryState | MemoryState[],
    messages?: ConversationMessage[]
  ): ConversationMessage[] {
    const comparison = (memoryState: MemoryState): boolean =>
      Array.isArray(state) ? state.includes(memoryState) : memoryState === state

    return (typeof messages !== 'undefined' ? messages : this.messages).filter(
      (message) => comparison(message.memoryState)
    )
  }

  getContext(includePreamble: boolean = false): string {
    // TODO: summarize the prompt (or maybe the response from OpenAI) and add it to the context
    // instead of just appending the message
    const contextMessages = []
    const coreMemories = []

    const maxMemories = this.settings.maxMemoryCount ?? DEFAULT_MAX_MEMORY_COUNT

    // get all memories that haven't been forgotten
    const memories = this.getMemories(['default', 'remembered', 'core'])

    // core memories take precedence
    // and we don't limit how many we include
    coreMemories.push(...this.getMemories('core', memories))

    // if we still need more memories, add remembered memories
    if (contextMessages.length < maxMemories) {
      // specific memories come next
      contextMessages.push(
        ...this.getMemories('remembered', memories)
          // grab the most recent memories that we can fit
          // borrowed from: https://stackoverflow.com/a/6473869/656011
          .slice(Math.max(contextMessages.length - maxMemories, 0))
      )
    }

    // if we still need more memories, add latest messages that weren't forgotten
    if (contextMessages.length < maxMemories) {
      // most recent mesages come last
      contextMessages.push(
        // make sure we're looking at the default memories
        ...this.getMemories('default', memories)
          // grab the most recent number of messages we can fit
          // borrowed from: https://stackoverflow.com/a/6473869/656011
          .slice(Math.max(contextMessages.length - maxMemories, 0))
      )
    }

    const formattedContextMessages = [...coreMemories, ...contextMessages]
      // because we've added memories of different types to the memory stack at different times
      // we want to sort it chronologically so the final order of the memories will make sense
      .sort((a, b) => a.message.created - b.message.created)

      // get formatted message text
      .map((message) => {
        if (message.message.object === USER_MESSAGE_OBJECT_TYPE) {
          return this.formatMessagePart(
            `${this.settings.userHandle}\n${
              (message.message as UserPrompt).prompt
            }`,
            true,
            true
          )
        } else if (
          message.message.object === OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE
        ) {
          return this.formatMessagePart(
            `${this.settings.botHandle}\n${
              ((message.message as OpenAI.Chat.ChatCompletion).choices[0]
                .message?.content as string) ?? ''
            }`,
            true,
            true
          )
        } else if (message.message.object === OPEN_AI_COMPLETION_OBJECT_TYPE) {
          return this.formatMessagePart(
            `${this.settings.botHandle}\n${
              (message.message as OpenAICompletion).choices[0].text
            }`,
            true,
            true
          )
        } else {
          return ''
        }
      })

    // if we want to include our preamble in the context, add it to the beginning of the array
    if (includePreamble && this.preamble !== '') {
      formattedContextMessages.unshift(this.preamble)
    }

    return formatInput(formattedContextMessages.join('\n'))
  }

  formatMessagePart(part: string = '', prefix = true, suffix = true): string {
    if (typeof part !== 'undefined' && part !== null && part !== '') {
      return `${
        prefix && typeof this?.model?.startWord !== 'undefined'
          ? this.model.startWord
          : ''
      }${part}${
        suffix && typeof this?.model?.stopWord !== 'undefined'
          ? this.model.stopWord
          : ''
      }`
    } else {
      return ''
    }
  }

  getFullMessageText(
    message: ConversationMessage | ConversationMessage['message']
  ): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    let currentMessage = message as ConversationMessageType

    if (typeof (message as ConversationMessage)?.message !== 'undefined') {
      currentMessage = (message as ConversationMessage).message
    }

    if (currentMessage.object === USER_MESSAGE_OBJECT_TYPE) {
      return `${this.formatMessagePart(this.preamble, true, true)}${formatInput(
        `${this.getContext()}${this.formatMessagePart(
          `${this.settings.userHandle}\n${
            (currentMessage as UserPrompt).prompt
          }`,
          true,
          true
        )}${this.formatMessagePart(
          `${this.settings.botHandle}\n`,
          true,
          false
        )}`
      )}`
    } else if (currentMessage.object === OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE) {
      return formatInput(
        `${this.settings.botHandle}\n${
          ((currentMessage as OpenAI.Chat.ChatCompletion).choices[0].message
            ?.content as string) ?? ''
        }`
      )
    } else if (currentMessage.object === OPEN_AI_COMPLETION_OBJECT_TYPE) {
      return formatInput(
        `${this.settings.botHandle}\n${
          (currentMessage as OpenAICompletion).choices[0].text
        }`
      )
    } else {
      return this.formatMessagePart(JSON.stringify(currentMessage))
    }
  }

  getMessages(): ConversationMessage[] {
    return this.messages
  }

  getConversationMessages(): ConversationMessage[] {
    // TODO: summarize the prompt (or maybe the response from OpenAI) and add it to the context
    // instead of just appending the message
    const contextMessages = []

    const maxMemories = this.settings.maxMemoryCount ?? DEFAULT_MAX_MEMORY_COUNT

    // get all memories that haven't been forgotten
    const memories = this.getMemories(['default', 'remembered', 'core'])

    // core memories take precedence
    // and we don't limit how many we include
    contextMessages.push(...this.getMemories('core', memories))

    // if we still need more memories, add remembered memories
    if (contextMessages.length < maxMemories) {
      // specific memories come next
      contextMessages.push(
        ...this.getMemories('remembered', memories)
          // grab the most recent memories that we can fit
          // borrowed from: https://stackoverflow.com/a/6473869/656011
          .slice(Math.max(contextMessages.length - maxMemories, 0))
      )
    }

    // if we still need more memories, add latest messages that weren't forgotten
    if (contextMessages.length < maxMemories) {
      // most recent mesages come last
      contextMessages.push(
        // make sure we're looking at the default memories
        ...this.getMemories('default', memories)
          // grab the most recent number of messages we can fit
          // borrowed from: https://stackoverflow.com/a/6473869/656011
          .slice(Math.max(contextMessages.length - maxMemories, 0))
      )
    }

    contextMessages.unshift({
      id: '0',
      memoryState: 'system' as MemoryState,
      message: {
        object: SYSTEM_MESSAGE_OBJECT_TYPE,
        created: this.timestamp,
        output: this.preamble
      }
    })

    return contextMessages
  }

  addMessage(message: Partial<ConversationMessageType>): ConversationMessage {
    const conversationMessage: ConversationMessage = {
      id:
        typeof (message as OpenAICompletion)?.id !== 'undefined'
          ? (message as OpenAICompletion).id
          : uuidv4(),
      memoryState: 'default' as MemoryState,
      message: message as ConversationMessage['message']
    }

    if (typeof conversationMessage?.message?.created === 'undefined') {
      conversationMessage.message.created = getUnixTimestamp()
    }

    if (conversationMessage.message.object === USER_MESSAGE_OBJECT_TYPE) {
      const inputText = formatInput(`${(message as UserPrompt).prompt}`)

      if (this.model.adapter.engine !== 'chat') {
        const inputContext = this.getContext(true)
        const fullText = this.getFullMessageText(conversationMessage.message)

        ;(message as UserPrompt).context = inputContext
        ;(message as UserPrompt).prompt = inputText
        ;(message as UserPrompt).fullText = fullText
      }
    } else if (
      conversationMessage.message.object !== OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE
    ) {
      conversationMessage.memoryState = 'forgotten' as MemoryState

      conversationMessage.message = {
        object: SYSTEM_MESSAGE_OBJECT_TYPE,
        created: getUnixTimestamp(),
        output: JSON.stringify(message)
      }
    }

    this.messages.push(conversationMessage)

    if (
      conversationMessage.message.object === USER_MESSAGE_OBJECT_TYPE &&
      this.model.adapter.engine === 'chat'
    ) {
      const lastMessage = this.messages.last()

      if (typeof lastMessage !== 'undefined') {
        // TODO: fix the type error after upgrading to latest openai SDK
        // @ts-expect-error
        ;(lastMessage.message as UserPrompt).messages = formatChat(this)
      }
    }

    return conversationMessage
  }

  updateTitle(title: string): void {
    this.title = title
  }

  updateModel(model: ModelDefinition): void {
    this.model = model
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

  startConversation({
    preamble,
    title,
    settings
  }: Partial<Conversation>): Conversation {
    const conversation = new Conversation({
      preamble,
      title,
      settings
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

  updateConversationModel(id: string, model: ModelDefinition): void {
    this.conversations[id].updateModel(model)
  }
}

const Conversations = new ConversationManager()

export default Conversations
