import React, { useEffect, useRef } from 'react'
import { setIcon } from 'obsidian'
import { useLoading, Oval } from '@agney/react-loading'

import InputArea from './InputArea'

export interface ChatInputProps {
  input: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({ onChange, input = '', busy = false }: ChatInputProps): React.ReactElement => {
  const chatButton = useRef<HTMLElement>()

  const { containerProps, indicatorEl } = useLoading({
    loading: busy,
    indicator: <Oval width="20" />,
  })

  useEffect(() => {
    if (typeof chatButton.current !== 'undefined') {
      const button = chatButton.current

      if (button instanceof HTMLElement) {
        setIcon(button, 'send')
      }
    }
  }, [chatButton])

  return (
    <React.Fragment>
      <InputArea
        value={input}
        onChange={onChange}
        countType="tokens"
        countPosition="top"
        countAlign="right"
      />
      <button
        className="ai-research-assistant__submit-button clickable-icon"
        type="submit"
        disabled={busy}
        {...containerProps}
      >
        {/* @ts-expect-error */}
        <div className="ai-research-assistant__submit-button__icon" ref={chatButton} />
        <div className="ai-research-assistant__submit-button__a11y-text">Send</div>
        {indicatorEl}
      </button>
    </React.Fragment>
  )
}

export default ChatInput
