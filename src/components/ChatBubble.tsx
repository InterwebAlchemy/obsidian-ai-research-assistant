import React from 'react'

import MemoryManager from './MemoryManager'

import { useApp } from '../hooks/useApp'

import converstUnixTimestampToISODate from 'src/utils/getISODate'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'
import { OPEN_AI_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'

import type { OpenAICompletion } from '../services/openai/types'
import type { ConversationMessage, UserPrompt } from '../types'

export interface ChatBubbleProps {
  message: ConversationMessage
  containerRef?: React.RefObject<HTMLDivElement>
  hasMemory?: boolean
  useMemoryManager?: boolean
}

const ChatBubble = ({ message, useMemoryManager = false }: ChatBubbleProps): React.ReactElement => {
  const { plugin } = useApp()

  const { settings } = plugin

  const isUserMessage = message?.message.object === USER_MESSAGE_OBJECT_TYPE
  const isBotMessage = message?.message.object === OPEN_AI_COMPLETION_OBJECT_TYPE

  let messageContent = ''

  if (isUserMessage) {
    messageContent = (message.message as UserPrompt).prompt
  } else if (isBotMessage) {
    messageContent = (message.message as OpenAICompletion).choices[0].text
  } else {
    messageContent = JSON.stringify(message)
  }

  return (
    <div
      className={`ai-research-assistant__conversation__item ai-research-assistant__conversation__item${
        isUserMessage ? '--user' : '--bot'
      }`}
    >
      <div className="ai-research-assistant__conversation__item__container">
        {useMemoryManager && (isUserMessage || isBotMessage) ? (
          <div className="ai-research-assistant__conversation__item__action">
            <MemoryManager message={message} />
          </div>
        ) : (
          <></>
        )}
        <div className="ai-research-assistant__conversation__item__text">
          {messageContent.trim()}
        </div>
      </div>
      <div className="ai-research-assistant__conversation__item__footer">
        {isBotMessage || isUserMessage ? (
          <div className="ai-research-assistant__conversation__item__speaker">
            {isUserMessage ? settings.userPrefix : settings.botPrefix}
          </div>
        ) : (
          <></>
        )}
        <div className="ai-research-assistant__conversation__item__timestamp">
          {converstUnixTimestampToISODate(message.message.created)}
        </div>
      </div>
    </div>
  )
}

export default ChatBubble
