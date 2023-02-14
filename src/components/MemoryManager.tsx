import React, { useEffect, useState, useCallback } from 'react'

import IconButton, { type IconButtonProps } from './IconButton'

import { OPEN_AI_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'

import type { ConversationMessage, MemoryState } from '../types'
import type { Conversation } from '../services/conversation'

export interface MemoryManagerProps {
  message: ConversationMessage
  conversation?: Conversation
}

const MemoryManager = ({
  message,
  conversation
}: MemoryManagerProps): React.ReactElement => {
  const isBotMessage =
    message?.message.object === OPEN_AI_COMPLETION_OBJECT_TYPE

  const [memoryState, setMemoryState] = useState<MemoryState>('default')
  const [isEditingMemory, setIsEditingMemory] = useState(false)

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
    setIsEditingMemory((editing) => !editing)
  }

  const makeDefaultMemory = (): void => {
    setMemoryState('default')

    manageMemory()
  }

  const makeCoreMemory = (): void => {
    setMemoryState('core')

    manageMemory()
  }

  const makeForgottenMemory = (): void => {
    setMemoryState('forgotten')

    manageMemory()
  }

  const makeRememberedMemory = (): void => {
    setMemoryState('remembered')

    manageMemory()
  }

  useEffect(() => {
    if (
      typeof message?.memoryState !== 'undefined' &&
      message.memoryState !== null &&
      message.memoryState !== memoryState
    ) {
      setMemoryState(message.memoryState)
    }
  }, [])

  useEffect(() => {
    if (message.memoryState !== memoryState) {
      message.memoryState = memoryState
    }
  }, [memoryState])

  return (
    <div
      className={`ai-research-assistant__conversation__item__memory ai-research-assistant__conversation__item__memory--${
        isBotMessage ? 'bot' : 'user'
      }`}>
      {isEditingMemory ? (
        <div className="ai-research-assistant__conversation__item__memory__manager">
          <IconButton
            iconName={getMemoryIcon('default')}
            a11yText="Remove memory alterations"
            onClick={makeDefaultMemory}
            buttonVariant="iconOnly"
            buttonStyle={getMemoryIconColor('default')}>
            Default
            {typeof conversation !== 'undefined'
              ? ` (${conversation?.getNumberofMemoriesForState('default')})`
              : ''}
          </IconButton>
          <IconButton
            iconName={getMemoryIcon('core')}
            a11yText="Make Core Memory"
            onClick={makeCoreMemory}
            buttonVariant="iconOnly"
            buttonStyle={getMemoryIconColor('core')}>
            Core
            {typeof conversation !== 'undefined'
              ? ` (${conversation?.getNumberofMemoriesForState('core')})`
              : ''}
          </IconButton>
          <IconButton
            iconName={getMemoryIcon('remembered')}
            a11yText="Remember this message"
            onClick={makeRememberedMemory}
            buttonVariant="iconOnly"
            buttonStyle={getMemoryIconColor('remembered')}>
            Remember
            {typeof conversation !== 'undefined'
              ? ` (${conversation?.getNumberofMemoriesForState('remembered')})`
              : ''}
          </IconButton>
          <IconButton
            iconName={getMemoryIcon('forgotten')}
            a11yText="Forget this message"
            onClick={makeForgottenMemory}
            buttonVariant="iconOnly"
            buttonStyle={getMemoryIconColor('forgotten')}>
            Forget
            {typeof conversation !== 'undefined'
              ? ` (${conversation?.getNumberofMemoriesForState('forgotten')})`
              : ''}
          </IconButton>
        </div>
      ) : (
        <IconButton
          iconName={getMemoryIcon(memoryState)}
          a11yText="Manage Memory"
          buttonVariant="iconOnly"
          buttonStyle={getMemoryIconColor(memoryState)}
          onClick={manageMemory}
        />
      )}
    </div>
  )
}

export default MemoryManager
