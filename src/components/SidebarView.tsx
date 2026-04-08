import React, { useState, useEffect } from 'react'

import ChatTitle from './ChatTitle'
import ChatWindow from './ChatWindow'
import ChatInput from './ChatInput'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'
import type { StreamChunk } from '../services/providers'

import { OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'

import getUnixTimestamp from 'src/utils/getUnixTimestamp'
import { v4 as uuidv4 } from 'uuid'

export interface ChatFormProps {
  onChatUpdate?: () => Promise<void>
}

const SidebarView = ({ onChatUpdate }: ChatFormProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat, logger } = plugin

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [preamble, setPreamble] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)

  const cancelPromptController = new AbortController()

  const [latestMessageContent, setLatestMessageContent] = useState<
    string | null
  >(null)
  const [latestReasoningContent, setLatestReasoningContent] = useState<
    string | null
  >(null)

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()

    setLoading(true)
    setPrompt('')

    chat
      ?.send(prompt, { signal: cancelPromptController.signal })
      .then(async (responseStream: AsyncIterable<StreamChunk> | undefined) => {
        if (typeof responseStream === 'undefined') return

        let accumulatedMessage = ''
        let accumulatedReasoning = ''

        try {
          for await (const chunk of responseStream) {
            if (chunk.reasoning !== undefined && chunk.reasoning !== '') {
              accumulatedReasoning += chunk.reasoning
              setLatestReasoningContent((prev) =>
                prev !== null
                  ? `${prev}${chunk.reasoning ?? ''}`
                  : chunk.reasoning ?? ''
              )
            }

            if (chunk.content !== '') {
              accumulatedMessage += chunk.content
              setLatestMessageContent((prev) =>
                prev !== null ? `${prev}${chunk.content}` : chunk.content
              )
            }

            if (chunk.done) {
              const stored: Record<string, unknown> = {
                id: uuidv4(),
                model: chat.model?.model ?? '',
                created: getUnixTimestamp(),
                object: OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE,
                choices: [
                  {
                    message: { role: 'assistant', content: accumulatedMessage },
                    finish_reason: 'stop',
                    index: 0
                  }
                ]
              }

              if (accumulatedReasoning !== '') {
                stored.reasoning = accumulatedReasoning
              }

              if (conversation !== null) {
                const newMessage = conversation.addMessage(stored)
                if (typeof newMessage !== 'undefined') {
                  setLatestMessageContent(null)
                  setLatestReasoningContent(null)
                }
              }
            }
          }
        } catch (error) {
          logger.error(error)
        }
      })
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

  const cancelPromptSubmit = (event: React.FormEvent): void => {
    logger.debug(`Cancelling streaming response...`)
    cancelPromptController.abort()
  }

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      conversation.preamble !== preamble
    ) {
      conversation.preamble = preamble
    }
  }, [preamble])

  useEffect(() => {
    if (typeof chat !== 'undefined' && chat?.currentConversation() !== null) {
      setPrompt('')
      setPreamble(conversation?.preamble ?? '')
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
    if (typeof conversation !== 'undefined' && conversation !== null) {
      setPreamble(conversation.preamble)
    }
  }, [conversation?.id])

  useEffect(() => {
    return () => {
      cancelPromptController.abort()
    }
  }, [])

  return (
    <div className="ai-research-assistant-content__container">
      <ChatTitle loading={loading} />
      {conversation !== null ? (
        <ChatWindow
          conversation={conversation}
          latestMessageContent={latestMessageContent}
          latestReasoningContent={latestReasoningContent}
        />
      ) : (
        <></>
      )}
      <ChatInput
        prompt={prompt}
        onPromptChange={setPrompt}
        onPromptSubmit={handleSubmit}
        cancelPromptSubmit={cancelPromptSubmit}
        preamble={preamble}
        onPreambleChange={setPreamble}
        conversation={conversation}
        busy={loading}
      />
    </div>
  )
}

export default SidebarView
