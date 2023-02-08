import React, { useState, useEffect } from 'react'

import ChatInput from './ChatInput'

import useChatScroll from '../hooks/useChatScroll'

import { DEFAULT_CONVERSATION_TITLE, USER_MESSAGE_OBJECT_TYPE, PLUGIN_SETTINGS } from '../constants'

import { type GPTHelperSettings } from '../main'
import type Chat from '../services/chat'
import type { Conversation } from '../services/conversation'

import type { OpenAICompletion, UserPrompt } from '../types'

export interface SidebarViewProps {
  chat: Chat
  settings: GPTHelperSettings
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const SidebarView = ({
  chat,
  settings = PLUGIN_SETTINGS,
}: SidebarViewProps): React.ReactElement => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Conversation['messages']>([])

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

  const renderConversation = (): React.ReactElement[] => messages.map(renderMessage)

  useEffect(() => {
    if (typeof chat !== 'undefined' && chat?.currentConversation() !== null) {
      setConversation(chat.currentConversation())
    }
  }, [chat?.currentConversation() !== null])

  useEffect(() => {
    if (typeof conversation?.messages?.length !== 'undefined') {
      setMessages(conversation.messages)
    }
  }, [conversation?.messages?.length])

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
        <ChatInput input={input} onChange={setInput} busy={loading} />
      </form>
    </div>
  )
}

export default SidebarView
