import React, { useState, useEffect } from 'react'
import type { OpenAI } from 'openai'
import type { Stream } from 'openai/streaming'

import ChatTitle from './ChatTitle'
import ChatWindow from './ChatWindow'
import ChatInput from './ChatInput'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'

import {
  OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE,
  OPEN_AI_COMPLETION_OBJECT_TYPE
} from '../services/openai/constants'

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

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()

    setLoading(true)

    setPrompt('')

    chat
      ?.send(prompt, {
        signal: cancelPromptController.signal
      })
      .then(async (responseStream: Stream<OpenAI.Chat.ChatCompletionChunk>) => {
        let accumulatedMessage = ''

        try {
          for await (const chunk of responseStream) {
            const { created, id, model, choices } = chunk

            const delta = choices?.[0]?.delta

            const content = delta?.content

            // Update the UI with the new content
            if (typeof content !== 'undefined') {
              accumulatedMessage += `${content as string}`

              setLatestMessageContent(
                (oldContent) =>
                  `${
                    oldContent !== null
                      ? `${oldContent}${content as string}`
                      : (content as string)
                  }`
              )
            }

            if (choices?.[0]?.finish_reason === 'stop') {
              const message = {
                id,
                model,
                created,
                object:
                  conversation?.model?.adapter?.engine === 'chat'
                    ? OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE
                    : OPEN_AI_COMPLETION_OBJECT_TYPE,
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: accumulatedMessage
                    }
                  }
                ]
              }

              if (conversation !== null) {
                const newMessage = conversation.addMessage(message)

                if (typeof newMessage !== 'undefined') {
                  setLatestMessageContent((oldContent) => null)
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
    logger.debug(
      `Cancelling streaming response from ${
        conversation?.model?.adapter?.name as string
      }...`
    )

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
