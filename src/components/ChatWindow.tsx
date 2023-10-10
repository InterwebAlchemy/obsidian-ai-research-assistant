import React, { useEffect, useState } from 'react'
import { useLoading, BallTriangle } from '@agney/react-loading'

import ChatBubble from './ChatBubble'

import { useApp } from '../hooks/useApp'
import { useChatScroll } from '../hooks/useChatScroll'

import type { Conversation } from '../services/conversation'
import getUnixTimestamp from 'src/utils/getUnixTimestamp'

import { OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE } from '../services/openai/constants'
export interface ChatWindowProps {
  conversation: Conversation
  latestMessageContent: string | null
}

const ChatWindow = ({
  conversation,
  latestMessageContent
}: ChatWindowProps): React.ReactElement => {
  const { plugin } = useApp()

  const [autoSaving, setAutoSaving] = useState(false)

  const { containerProps, indicatorEl } = useLoading({
    loading: autoSaving,
    indicator: <BallTriangle width="30" />
  })

  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(conversation.messages?.length)

  const renderConversation = (): React.ReactElement[] => {
    return conversation.messages.length > 0
      ? conversation.messages.map((message, index) => {
          return (
            <ChatBubble
              key={`message-${message.id}` ?? `message-${index}`}
              message={message}
              conversation={conversation}
            />
          )
        })
      : [<React.Fragment key="no-results"></React.Fragment>]
  }

  useEffect(() => {
    setAutoSaving(plugin.autoSaving)
  }, [plugin.autoSaving])

  return (
    <div
      className="ai-research-assistant__conversation"
      // @ts-expect-error
      ref={scrollRef}
      {...containerProps}>
      <div className="ai-research-assistant__conversation__extra">
        <div className="ai-research-assistant__conversation__autosaving-indicator">
          {indicatorEl}
        </div>
      </div>
      {renderConversation()}
      {latestMessageContent !== null && (
        <ChatBubble
          message={{
            id: 'currentMessageStream',
            memoryState: 'default',
            message: {
              id: 'currentMessageStream',
              model: conversation.model.name,
              created: getUnixTimestamp(),
              object: OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE,
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: latestMessageContent
                  },
                  finish_reason: 'stop',
                  index: 0
                }
              ]
            }
          }}
          conversation={conversation}
        />
      )}
    </div>
  )
}

export default ChatWindow
