import React, { useState } from 'react'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

import type { OpenAI } from 'openai'

import MemoryManager from './MemoryManager'

import { useApp } from '../hooks/useApp'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'
import {
  OPEN_AI_COMPLETION_OBJECT_TYPE,
  OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE
} from '../services/openai/constants'

import type { OpenAICompletion } from '../services/openai/types'
import type { Conversation } from '../services/conversation'
import type { ConversationMessage, UserPrompt } from '../types'

export interface ChatBubbleProps {
  message: ConversationMessage
  conversation?: Conversation
  /** Reasoning / thinking tokens for the streaming bubble. Stored messages
   *  carry reasoning on the message object itself. */
  reasoning?: string
  /** Default open state for the thinking block — set true once the user has
   *  opened any prior thinking block in this conversation. */
  thinkingDefaultOpen?: boolean
  /** Notifies the parent when the user opens a thinking block, so subsequent
   *  bubbles default to open. */
  onThinkingOpen?: () => void
  /** Notifies the parent when the user closes a thinking block, so subsequent
   *  bubbles in the same conversation stop auto-expanding. */
  onThinkingClose?: () => void
}

const ChatBubble = ({
  message,
  conversation,
  reasoning,
  thinkingDefaultOpen = false,
  onThinkingOpen,
  onThinkingClose
}: ChatBubbleProps): React.ReactElement => {
  const { plugin } = useApp()

  const { settings } = plugin

  const isUserMessage = message?.message.object === USER_MESSAGE_OBJECT_TYPE
  const isBotMessage =
    message?.message.object === OPEN_AI_COMPLETION_OBJECT_TYPE ||
    message?.message.object === OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE

  let messageContent = ''

  if (isUserMessage) {
    messageContent = (message.message as UserPrompt).prompt
  } else if (isBotMessage) {
    if (conversation?.model.adapter.engine === 'chat') {
      messageContent =
        (message.message as OpenAI.Chat.ChatCompletion).choices[0].message
          ?.content ?? ''
    } else {
      messageContent = (message.message as OpenAICompletion).choices[0].text
    }
  } else {
    messageContent = JSON.stringify(message)
  }

  // Reasoning may come from the prop (streaming) or from the stored message object
  const reasoningContent =
    reasoning ??
    (message.message as OpenAI.Chat.ChatCompletion & { reasoning?: string })
      .reasoning

  // The streaming bubble keeps the thinking block open by default. Stored
  // messages default to `thinkingDefaultOpen` (true once the user has opened
  // any prior thinking block). Once mounted, the user's toggle wins — we
  // never force-collapse.
  const isStreaming = message.id === 'currentMessageStream'
  const [thinkingOpen, setThinkingOpen] = useState<boolean>(
    isStreaming || thinkingDefaultOpen
  )

  const handleThinkingToggle = (
    event: React.SyntheticEvent<HTMLDetailsElement>
  ): void => {
    const nextOpen = event.currentTarget.open
    setThinkingOpen(nextOpen)
    if (nextOpen && onThinkingOpen != null) {
      onThinkingOpen()
    } else if (!nextOpen && onThinkingClose != null) {
      onThinkingClose()
    }
  }

  return (
    <div
      className={`ai-research-assistant__conversation__item ai-research-assistant__conversation__item${
        isUserMessage ? '--user' : '--bot'
      }`}>
      <div className="ai-research-assistant__conversation__item__container">
        {isUserMessage || isBotMessage ? (
          <div className="ai-research-assistant__conversation__item__action">
            <MemoryManager message={message} conversation={conversation} />
          </div>
        ) : (
          <></>
        )}
        <div className="ai-research-assistant__conversation__item__body">
          {isBotMessage &&
          reasoningContent != null &&
          reasoningContent !== '' ? (
            <details
              className="ai-research-assistant__conversation__item__thinking"
              open={thinkingOpen}
              onToggle={handleThinkingToggle}>
              <summary className="ai-research-assistant__conversation__item__thinking__summary">
                Thinking
              </summary>
              <div className="ai-research-assistant__conversation__item__thinking__content">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {reasoningContent.trim()}
                </ReactMarkdown>
              </div>
            </details>
          ) : (
            <></>
          )}
          <div className="ai-research-assistant__conversation__item__text">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {messageContent.trim()}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="ai-research-assistant__conversation__item__footer">
        {isBotMessage || isUserMessage ? (
          <div className="ai-research-assistant__conversation__item__speaker">
            {isUserMessage
              ? settings.userHandle
              : `${settings.botHandle} (${
                  (message.message as OpenAI.Chat.ChatCompletion).model
                })`}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

export default ChatBubble
