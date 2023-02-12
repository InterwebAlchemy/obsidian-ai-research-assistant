import React, { useEffect, useState, useCallback } from 'react'

import IconButton, { type IconButtonProps } from './IconButton'

import { useApp } from '../hooks/useApp'

import converstUnixTimestampToISODate from 'src/utils/getISODate'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'
import { OPEN_AI_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'

import type { OpenAICompletion } from '../services/openai/types'
import type { ConversationMessage, MemoryState, UserPrompt } from '../types'

export interface ChatBubbleProps {
  message: ConversationMessage
  hasMemory?: boolean
}

const ChatBubble = ({ message, hasMemory = false }: ChatBubbleProps): React.ReactElement => {
  const { plugin } = useApp()

  const { settings, logger } = plugin

  const [memoryState, setMemoryState] = useState<MemoryState>('default')
  const [isEditingMemory, setIsEditingMemory] = useState(false)

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

  const getMemoryIcon = useCallback(
    (state: MemoryState): string => {
      switch (state) {
        case 'core':
          return 'package-check'
        case 'forgotten':
          return 'package-x'
        case 'remembered':
          return 'package-plus'
        case 'default':
        default:
          return 'package-search'
      }
    },
    [memoryState]
  )

  const getMemoryIconColor = useCallback(
    (state: MemoryState): IconButtonProps['buttonStyle'] => {
      switch (state) {
        case 'core':
          return 'primary'
        case 'forgotten':
          return 'danger'
        case 'remembered':
          return 'success'
        case 'default':
        default:
          return 'secondary'
      }
    },
    [memoryState]
  )

  const manageMemory = (): void => {
    if (hasMemory) {
      logger.debug('manageMemory', message)

      setIsEditingMemory(true)
    }
  }

  const updateMemoryStatus = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newMemoryState = event.target.value as MemoryState

    logger.debug('updateMemoryStatus', message, newMemoryState)

    if (newMemoryState !== memoryState) {
      setMemoryState(newMemoryState)
    }

    setIsEditingMemory(false)
  }

  useEffect(() => {
    if (
      typeof message?.memoryState !== 'undefined' &&
      message.memoryState !== null &&
      message.memoryState !== memoryState
    ) {
      setMemoryState(message.memoryState)
    }
  }, [message.memoryState])

  useEffect(() => {
    if (message.memoryState !== memoryState) {
      message.memoryState = memoryState
    }
  }, [memoryState])

  return (
    <div
      className={`ai-research-assistant__conversation__item ai-research-assistant__conversation__item${
        isUserMessage ? '--user' : '--bot'
      }`}
    >
      <div className="ai-research-assistant__conversation__item__container">
        {hasMemory && (isUserMessage || isBotMessage) ? (
          <div className="ai-research-assistant__conversation__item__action">
            {isEditingMemory ? (
              <select onChange={updateMemoryStatus}>
                <option value="default">Default</option>
                <option value="core">Core Memory</option>
                <option value="remembered">Remembered</option>
                <option value="forgotten">Forgotten</option>
              </select>
            ) : (
              <IconButton
                iconName={getMemoryIcon(memoryState)}
                a11yText="Manage Memory"
                onClick={manageMemory}
                buttonVariant="iconOnly"
                buttonStyle={getMemoryIconColor(memoryState)}
              />
            )}
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
