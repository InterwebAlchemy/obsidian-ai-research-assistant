import React, { useState, useEffect } from 'react'

import ChatTitle from './ChatTitle'
import ChatInput from './ChatInput'

import { useChatScroll } from '../hooks/useChatScroll'
import { useApp } from '../hooks/useApp'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'
import { OPEN_AI_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'

import type { Conversation } from '../services/conversation'
import type { OpenAICompletion } from '../services/openai/types'
import type { UserPrompt } from '../types'
import converstUnixTimestampToISODate from 'src/utils/getISODate'

export interface ChatFormProps {
  onChatUpdate?: () => Promise<void>
}

const SidebarView = ({ onChatUpdate }: ChatFormProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat, logger, settings } = plugin

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Conversation['messages']>([])

  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(messages?.length)

  const handleUserScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>): void => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget

    // TODO: add a way to toggle auto scrolling when user scrolls up manually

    logger.debug({ scrollTop, scrollHeight, clientHeight })
  }

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()

    setLoading(true)

    const prompt = input.trim()

    setInput('')

    chat
      ?.send(prompt)
      .catch((error) => {
        logger.error(error)
      })
      .finally(() => {
        if (typeof onChatUpdate === 'function') {
          onChatUpdate().catch((error) => {
            logger.error(error)
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
            <div className="ai-research-assistant__conversation__item__text">
              {(item as UserPrompt).prompt.trim()}
            </div>
            <div className="ai-research-assistant__conversation__item__footer">
              <div className="ai-research-assistant__conversation__item__speaker">
                {settings.userPrefix}
              </div>
              <div className="ai-research-assistant__conversation__item__timestamp">
                {converstUnixTimestampToISODate(item.created)}
              </div>
            </div>
          </div>
        )

      case OPEN_AI_COMPLETION_OBJECT_TYPE:
        return (
          <div
            key={item?.id ?? index}
            className="ai-research-assistant__conversation__item ai-research-assistant__conversation__item--bot"
          >
            <div key={index} className="ai-research-assistant__conversation__item__text">
              {(item as OpenAICompletion).choices[0].text.trim()}
            </div>
            <div className="ai-research-assistant__conversation__item__footer">
              <div className="ai-research-assistant__conversation__item__speaker">
                {settings.botPrefix}
              </div>
              <div className="ai-research-assistant__conversation__item__timestamp">
                {converstUnixTimestampToISODate(item.created)}
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
    messages.length > 0
      ? messages.map(renderMessage)
      : [<React.Fragment key="no-results"></React.Fragment>]

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

  return (
    <div className="ai-research-assistant-content__container">
      <ChatTitle loading={loading} />
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
