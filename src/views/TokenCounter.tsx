import React, { useEffect, useState } from 'react'

import { useDebounce } from 'use-debounce'

import tokenCounter, { type TokenCounterOptions } from '../utils/tokenCounter'

import { OPEN_AI_MAX_TOKENS } from '../constants'

export interface TokenCounterProps {
  input: string
  options?: TokenCounterOptions
}

const TokenCounter = ({ input = '', options = {} }: TokenCounterProps): React.ReactElement => {
  const [count, setCount] = useState(0)
  const [prefixCount, setPrefixCount] = useState(0)

  const [debouncedInput] = useDebounce(input, 200, { maxWait: 500 })
  const [debouncedPrefix] = useDebounce(options?.prefix, 200, { maxWait: 500 })

  useEffect(() => {
    if (debouncedInput.length === 0) {
      setCount(0)
    } else {
      setCount(tokenCounter(debouncedInput, options))
    }
  }, [debouncedInput])

  useEffect(() => {
    if (typeof debouncedPrefix !== 'undefined') {
      const prefixOptions = { ...options, prefix: undefined }
      setPrefixCount(tokenCounter(debouncedPrefix, prefixOptions))
    }
  }, [debouncedPrefix?.length])

  return (
    <div className="ai-research-assistant__chat-form__counter">
      {prefixCount > 0 && count - prefixCount > 0
        ? `${count} (input: ${count - prefixCount} + context: ${prefixCount}) `
        : count}
      {`/ ${OPEN_AI_MAX_TOKENS}`}
    </div>
  )
}

export default TokenCounter
