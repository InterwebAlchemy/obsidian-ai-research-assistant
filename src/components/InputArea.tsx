// create react functional component that wraps a textarea element and provides a throttled character count
import React, { useState, useEffect } from 'react'

import { useThrottledCallback, useDebounce } from 'use-debounce'

import { useApp } from 'src/hooks/useApp'
import tokenCounter, { type TokenCounterType } from '../utils/tokenCounter'
import { DEFAULT_TOKEN_TYPE } from '../constants'

export interface InputAreaProps {
  value?: string
  type?: 'text' | 'textarea'
  onChange?: (val: string) => void
  countType?: 'words' | 'characters' | 'tokens' | 'bytes'
  countPosition?: 'top' | 'bottom'
  countAlign?: 'left' | 'right'
  delay?: number
  maxCount?: number
  required?: boolean
}

const countInput = (
  input: string,
  countType: string,
  tokenType: TokenCounterType = DEFAULT_TOKEN_TYPE
): number => {
  switch (countType) {
    case 'tokens':
      return tokenCounter(input, { type: tokenType })
    case 'words':
      return input.split(' ').length
    case 'bytes':
      return new TextEncoder().encode(input).length
    case 'characters':
    default:
      return input.length
  }
}

const InputArea = ({
  value = '',
  type = 'textarea',
  countType = 'characters',
  countPosition = 'bottom',
  countAlign = 'left',
  delay = 300,
  required = false,
  maxCount,
  onChange,
}: InputAreaProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat } = plugin

  const [text, setText] = useState('')
  const [debouncedText] = useDebounce(text, delay)
  const [count, setCount] = useState(0)
  const [warning, setWarning] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>
  ): void => {
    setText(e.target.value)

    if (typeof onChange === 'function') {
      onChange(e.target.value)
    }
  }

  const updateCount = (input: string): void => {
    setCount(countInput(input, countType, chat.model.tokenType))
  }

  // throttle the character count update to every 100ms
  const throttledSetCount = useThrottledCallback(updateCount, delay)

  // update the character count when the text changes
  useEffect(() => {
    if (typeof countType !== 'undefined') {
      throttledSetCount(debouncedText)
    }
  }, [debouncedText, countType])

  useEffect(() => {
    if (typeof maxCount !== 'undefined') {
      if (count > maxCount) {
        setWarning(true)
      }
    }
  }, [count, maxCount])

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setText(value)
    }
  }, [value])

  const renderCount = (): React.ReactElement => {
    if (typeof countType === 'undefined') {
      return <></>
    }

    return (
      <div
        className="ai-research-assistant__input-area__toolbar"
        style={{
          flexDirection: countAlign === 'left' ? 'row' : 'row-reverse',
          textAlign: countAlign,
        }}
      >
        <div className="ai-research-assistant__input-area__toolbar__counter">
          {count} {count === 1 ? countType.slice(0, -1) : countType}
        </div>
        {warning ? (
          <div
            className="ai-research-assistant__input-area__counter__warning"
            style={{ display: warning ? 'block' : 'none' }}
          >
            TOO MANY TOKENS
          </div>
        ) : (
          <></>
        )}
      </div>
    )
  }

  return (
    <div className="ai-research-assistant__input-area">
      {countPosition === 'top' ? renderCount() : <></>}
      {type === 'textarea' ? (
        <textarea
          placeholder="Type your message here"
          onChange={handleChange}
          value={value}
          required={required}
        />
      ) : (
        <input
          placeholder="Type your message here"
          onChange={handleChange}
          value={value}
          required={required}
        />
      )}
      {countPosition === 'bottom' ? renderCount() : <></>}
    </div>
  )
}

export default InputArea
