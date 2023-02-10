import React, { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { useApp } from '../hooks/useApp'

import getUnixTimestamp from '../utils/getUnixTimestamp'
import tokenCounter from '../utils/tokenCounter'

import { USER_MESSAGE_OBJECT_TYPE } from 'src/constants'

export interface TokenCounterProps {
  input: string
}

// TODO: Fix this counter logic
const TokenCounter = ({ input = '' }: TokenCounterProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat, settings, logger } = plugin

  const conversation = chat?.currentConversation()

  const [totalCount, setTotalCount] = useState(0)
  const [count, setCount] = useState(0)
  const [contextCount, setContextCount] = useState(0)
  const [prefixCount, setPrefixCount] = useState(0)

  const [debouncedInput] = useDebounce(input, 300, { maxWait: 1000, leading: true })

  useEffect(() => {
    if (debouncedInput.length === 0) {
      setCount(0)
    } else {
      setCount(
        tokenCounter(`${debouncedInput}`, {
          type: chat.model.tokenType,
        })
      )
    }
  }, [debouncedInput])

  useEffect(() => {
    setTotalCount(
      tokenCounter(
        conversation?.getFullMessageText({
          id: 'null',
          created: getUnixTimestamp(),
          object: USER_MESSAGE_OBJECT_TYPE,
          prompt: '',
        }) ?? '',
        { type: chat.model.tokenType }
      ) ?? 0
    )

    if (typeof conversation?.getContext() !== 'undefined') {
      const context = conversation.getContext(conversation?.messages?.length === 0)

      logger.debug(context)

      const contextTokens = tokenCounter(context, {
        type: chat.model.tokenType,
        debug: settings.debugMode,
      })

      logger.debug(contextTokens)

      setContextCount(contextTokens)
    }
  }, [conversation?.id])

  useEffect(() => {
    setPrefixCount(tokenCounter(`${settings.userPrefix} ${settings.botPrefix}`))
  }, [settings.userPrefix, settings.botPrefix])

  useEffect(() => {
    if (typeof conversation !== 'undefined' && conversation !== null) {
      const ephemeralMessage = {
        id: 'NEW',
        created: getUnixTimestamp(),
        object: USER_MESSAGE_OBJECT_TYPE,
        prompt: debouncedInput,
      }

      const ephemeralMessageText = conversation.getFullMessageText(ephemeralMessage)

      const totalTokens = tokenCounter(ephemeralMessageText, {
        type: chat.model.tokenType,
      })

      setTotalCount(totalTokens)
    }
  }, [count, contextCount, prefixCount])

  return (
    <div className="ai-research-assistant__chat-form__counter">
      {count}
      {count > 0 && ((contextCount > 0 && count - contextCount > 0) || prefixCount > 0)
        ? ` [+${contextCount} (context) + ${prefixCount} (prefixes) = ${totalCount} (total)]`
        : ''}
      {`/ ${chat.model.maxTokens - totalCount}`}
    </div>
  )
}

export default TokenCounter
