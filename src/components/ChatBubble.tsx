import React from 'react'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

import type { OpenAI } from 'openai'

import MemoryManager from './MemoryManager'

import { useApp } from '../hooks/useApp'

import relativeDate from 'src/utils/relativeDate'

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
}

const ChatBubble = ({
  message,
  conversation
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
        <div className="ai-research-assistant__conversation__item__text">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {messageContent.trim()}
          </ReactMarkdown>
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
        <div className="ai-research-assistant__conversation__item__timestamp">
          {relativeDate(message.message.created)}
        </div>
      </div>
    </div>
  )
}

export default ChatBubble
