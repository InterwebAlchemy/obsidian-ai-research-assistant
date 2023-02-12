import React, { useState, useEffect } from 'react'

import ChatTitle from './ChatTitle'
import ChatWindow from './ChatWindow'
import ChatInput from './ChatInput'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'

export interface ChatFormProps {
  onChatUpdate?: () => Promise<void>
}

const SidebarView = ({ onChatUpdate }: ChatFormProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat, logger } = plugin

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Conversation['messages']>([])

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
      <ChatWindow messages={messages} hasMemory={conversation?.hasMemory} />
      <ChatInput input={input} onChange={setInput} onSubmit={handleSubmit} busy={loading} />
    </div>
  )
}

export default SidebarView
