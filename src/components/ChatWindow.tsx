import React from 'react'

import ChatBubble from './ChatBubble'

import { useChatScroll } from '../hooks/useChatScroll'
// import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'

export interface ChatWindowProps {
  messages: Conversation['messages']
  hasMemory?: boolean
}

const ChatWindow = ({ messages, hasMemory = false }: ChatWindowProps): React.ReactElement => {
  // const { plugin } = useApp()

  // const { logger } = plugin

  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(messages?.length)

  const handleUserScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>): void => {
    // const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    // TODO: add a way to toggle auto scrolling when user scrolls up manually
    // logger.debug({ scrollTop, scrollHeight, clientHeight })
  }

  const renderConversation = (): React.ReactElement[] =>
    messages.length > 0
      ? messages.map((message, index) => (
          <ChatBubble
            key={message.id ?? `message-${index}`}
            message={message}
            hasMemory={hasMemory}
          />
        ))
      : [<React.Fragment key="no-results"></React.Fragment>]

  return (
    <div
      className="ai-research-assistant__conversation"
      // @ts-expect-error
      ref={scrollRef}
      onScroll={handleUserScroll}
    >
      {renderConversation()}
    </div>
  )
}

export default ChatWindow
