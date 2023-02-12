import React from 'react'

import ChatBubble from './ChatBubble'

import { useChatScroll } from '../hooks/useChatScroll'

import type { Conversation } from '../services/conversation'

export interface ChatWindowProps {
  messages: Conversation['messages']
  hasMemory?: boolean
  useMemoryManager?: boolean
}

const ChatWindow = ({
  messages,
  hasMemory = false,
  useMemoryManager = false,
}: ChatWindowProps): React.ReactElement => {
  // TODO: include toggleScrolling state change
  const [scrollRef] = useChatScroll(messages?.length)

  const renderConversation = (): React.ReactElement[] =>
    messages.length > 0
      ? messages.map((message, index) => (
          <ChatBubble
            key={message.id ?? `message-${index}`}
            message={message}
            hasMemory={hasMemory}
            useMemoryManager={useMemoryManager}
          />
        ))
      : [<React.Fragment key="no-results"></React.Fragment>]

  return (
    <div
      className="ai-research-assistant__conversation"
      // @ts-expect-error
      ref={scrollRef}
    >
      {renderConversation()}
    </div>
  )
}

export default ChatWindow
