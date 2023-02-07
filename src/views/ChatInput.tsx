import React, { useEffect, useRef } from 'react'
import { setIcon } from 'obsidian'
import { useLoading, Oval } from '@agney/react-loading'

export interface ChatInputProps {
  input: string
  onChange: (input: string) => void
  saveChat: () => Promise<void>
  allowSave?: boolean
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({
  onChange,
  saveChat,
  input = '',
  busy = false,
  allowSave = false,
}: ChatInputProps): React.ReactElement => {
  const saveButton = useRef<HTMLElement>()
  const chatButton = useRef<HTMLElement>()

  const { containerProps, indicatorEl } = useLoading({
    loading: busy,
    indicator: <Oval width="20" />,
  })

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(e.target.value)
  }

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    saveChat()
      .then(() => {
        console.log('Saved conversation')
      })
      .catch((error) => {
        console.error(error)
      })
  }

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

  return (
    <React.Fragment>
      <textarea
        placeholder="Type your message here"
        onChange={handleChange}
        value={input}
        required
        readOnly={busy}
        disabled={busy}
      />
      {allowSave ? (
        <button
          className="gpt-helper__save-button clickable-icon"
          type="submit"
          onClick={handleSave}
          disabled={busy}
        >
          {/* @ts-expect-error */}
          <div className="gpt-helper__save-button__icon" ref={saveButton} />
          <div className="gpt-helper__submit-button__a11y-text">Save</div>
        </button>
      ) : (
        <></>
      )}
      <button
        className="gpt-helper__submit-button clickable-icon"
        type="submit"
        disabled={busy}
        {...containerProps}
      >
        {/* @ts-expect-error */}
        {!busy ? <div className="gpt-helper__submit-button__icon" ref={chatButton} /> : <></>}
        <div className="gpt-helper__submit-button__a11y-text">Send</div>
        {indicatorEl}
      </button>
    </React.Fragment>
  )
}

export default ChatInput
