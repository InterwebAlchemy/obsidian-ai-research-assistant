import React, { useState, useEffect } from 'react'

export interface ChatInputProps {
  input: string
  onChange: (input: string) => void
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({ onChange, input = '', busy = false }: ChatInputProps): React.ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(e.target.value)
  }

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
      <button className="gpt-helper__submit-button clickable-icon" type="submit" disabled={busy}>
        {busy && input ? '...' : 'Send'}
      </button>
    </React.Fragment>
  )
}

export default ChatInput
