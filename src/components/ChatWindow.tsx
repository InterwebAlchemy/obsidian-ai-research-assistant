import React, { useEffect, useState } from 'react'
import { useLoading, BallTriangle } from '@agney/react-loading'

import ChatBubble from './ChatBubble'

import { useApp } from '../hooks/useApp'
import { useChatScroll } from '../hooks/useChatScroll'

import type { Conversation } from '../services/conversation'

export interface ChatWindowProps {
  conversation: Conversation
  hasMemory?: boolean
  useMemoryManager?: boolean
}

const ChatWindow = ({
  conversation,
  hasMemory = false,
  useMemoryManager = false
}: ChatWindowProps): React.ReactElement => {
  const { plugin } = useApp()

  const [autoSaving, setAutoSaving] = useState(false)

  const { containerProps, indicatorEl } = useLoading({
    loading: autoSaving,
    indicator: <BallTriangle width="30" />
  })

  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(conversation.messages?.length)

  const renderConversation = (): React.ReactElement[] =>
    conversation.messages.length > 0
      ? conversation.messages.map((message, index) => (
          <ChatBubble
            key={message.id ?? `message-${index}`}
            message={message}
            conversation={conversation}
            hasMemory={hasMemory}
            useMemoryManager={useMemoryManager}
          />
        ))
      : [<React.Fragment key="no-results"></React.Fragment>]

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
    </div>
  )
}

export default ChatWindow
