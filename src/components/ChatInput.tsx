import React, { useEffect, useRef } from 'react'
import { setIcon } from 'obsidian'
import { useLoading, Oval } from '@agney/react-loading'

export interface ChatInputProps {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({ onChange, input = '', busy = false }: ChatInputProps): React.ReactElement => {
  const saveButton = useRef<HTMLElement>()
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

  useEffect(() => {
    if (typeof saveButton.current !== 'undefined') {
      const button = saveButton.current

      if (button instanceof HTMLElement) {
        setIcon(button, 'save')
      }
    }
  }, [saveButton])

  // TODO: fix the error that eats first character in textarea
  return (
    <React.Fragment>
      <textarea
        placeholder="Type your message here"
        onChange={onChange}
        value={input}
        required
        readOnly={busy}
        disabled={busy}
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
