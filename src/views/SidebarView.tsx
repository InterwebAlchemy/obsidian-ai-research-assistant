import React, { useState, useEffect } from 'react'

import ChatInput from '../components/ChatInput'
import TokenCounter from '../components/TokenCounter'

import useChatScroll from '../hooks/useChatScroll'

import { DEFAULT_CONVERSATION_TITLE, USER_MESSAGE_OBJECT_TYPE, PLUGIN_SETTINGS } from '../constants'

import { type GPTHelperSettings } from '../main'
import type Chat from '../services/chat'
import type { Conversation } from '../services/conversation'

import type { OpenAICompletion, UserPrompt } from '../types'

export interface SidebarViewProps {
  chat: Chat
  settings: GPTHelperSettings
  onChatUpdate: () => Promise<void>
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const SidebarView = ({
  chat,
  onChatUpdate,
  settings = PLUGIN_SETTINGS,
}: SidebarViewProps): React.ReactElement => {
  console.log(chat)

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Conversation['messages']>([])
  const [context, setContext] = useState<Conversation['context']>('')

  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(conversation?.messages?.length)

  const handleUserScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>): void => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

    // TODO: add a way to toggle auto scrolling when user scrolls up manually

    console.debug({ scrollTop, scrollHeight, clientHeight })
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    setLoading(true)

    const prompt = input.trim()

    setInput('')

    chat
      ?.send(prompt)
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        if (typeof onChatUpdate === 'function') {
          onChatUpdate().catch((error) => {
            console.error(error)
          })
        }

        setLoading(false)
      })
  }

  const renderMessage = (
    item: UserPrompt | OpenAICompletion,
    index: number
  ): React.ReactElement => {
    switch (item?.object) {
      case USER_MESSAGE_OBJECT_TYPE:
        return (
          <div
            key={item?.id ?? index}
            className="ai-research-assistant__conversation__item ai-research-assistant__conversation__item--user"
          >
            <div key={index} className="ai-research-assistant__conversation__item__text">
              {(item as UserPrompt).prompt.trim()}
            </div>
            <div className="ai-research-assistant__conversation__item__footer">
              <div className="ai-research-assistant__conversation__item__speaker">You</div>
              <div className="ai-research-assistant__conversation__item__timestamp">
                {new Date(item.created * 1000).toISOString()}
              </div>
            </div>
          </div>
        )

      case 'text_completion':
        return (
          <div
            key={item?.id ?? index}
            className="ai-research-assistant__conversation__item ai-research-assistant__conversation__item--bot"
          >
            <div key={index} className="ai-research-assistant__conversation__item__text">
              {(item as OpenAICompletion).choices[0].text.trim()}
            </div>
            <div className="ai-research-assistant__conversation__item__footer">
              <div className="ai-research-assistant__conversation__item__speaker">Bot</div>
              <div className="ai-research-assistant__conversation__item__timestamp">
                {new Date(item.created * 1000).toISOString()}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div
            key={index}
            className="ai-research-assistant__conversation__item ai-research-assistant__conversation__item--error"
          >
            {JSON.stringify(item)}
          </div>
        )
    }
  }

  const renderConversation = (): React.ReactElement[] =>
    messages.length > 0 ? messages.map(renderMessage) : [<></>]

  useEffect(() => {
    if (typeof chat !== 'undefined' && chat?.currentConversation() !== null) {
      setInput('')

      setConversationId(chat.currentConversationId)
    }
  }, [chat?.currentConversationId])

  useEffect(() => {
    if (
      typeof chat !== 'undefined' &&
      typeof chat?.conversations !== 'undefined' &&
      typeof conversationId !== 'undefined' &&
      conversationId !== null
    ) {
      setConversation(chat.currentConversation())
    }
  }, [chat?.conversations, conversationId])

  useEffect(() => {
    if (typeof conversation?.id !== 'undefined' && typeof conversation?.messages !== 'undefined') {
      setMessages(conversation.messages)
    }
  }, [conversation?.messages, conversation?.id])

  useEffect(() => {
    if (typeof conversation?.context !== 'undefined') {
      setContext(conversation.context)
    }
  }, [conversation?.context])

  return (
    <div className="ai-research-assistant-content__container">
      <div className="ai-research-assistant__conversation__header">
        <div className="ai-research-assistant__conversation__header__title">
          {conversation?.title ?? DEFAULT_CONVERSATION_TITLE}
        </div>
      </div>
      <div
        className="ai-research-assistant__conversation"
        // @ts-expect-error
        ref={scrollRef}
        onScroll={handleUserScroll}
      >
        {renderConversation()}
      </div>
      <form
        className="ai-research-assistant__chat-form"
        onSubmit={handleSubmit}
        autoCapitalize="off"
        noValidate
      >
        <TokenCounter input={input} options={{ debug: settings.debugMode, prefix: context }} />
        <ChatInput input={input} onChange={setInput} busy={loading} />
      </form>
    </div>
  )
}

export default SidebarView
