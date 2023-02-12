import React from 'react'

import { useLoading, Oval } from '@agney/react-loading'

import InputArea from './InputArea'
import IconButton from './IconButton'

export interface ChatInputProps {
  input: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  onSubmit: (event: React.FormEvent) => void
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({
  onChange,
  onSubmit,
  input = '',
  busy = false,
}: ChatInputProps): React.ReactElement => {
  const { containerProps, indicatorEl } = useLoading({
    loading: busy,
    indicator: <Oval width="20" />,
  })

  return (
    <form
      className="ai-research-assistant__chat-form"
      onSubmit={onSubmit}
      autoCapitalize="off"
      noValidate
    >
      <InputArea
        value={input}
        onChange={onChange}
        countType="tokens"
        countPosition="top"
        countAlign="right"
      />
      <IconButton
        iconName="send"
        a11yText="Send"
        buttonStyle="primary"
        type="submit"
        className="ai-research-assistant__chat__input__send"
        disabled={busy}
        {...containerProps}
      >
        {indicatorEl}
      </IconButton>
    </form>
  )
}

export default ChatInput
