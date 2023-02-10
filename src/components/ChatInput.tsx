import React from 'react'

import { useLoading, Oval } from '@agney/react-loading'

import InputArea from './InputArea'
import IconButton from './IconButton'

export interface ChatInputProps {
  input: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({ onChange, input = '', busy = false }: ChatInputProps): React.ReactElement => {
  const { containerProps, indicatorEl } = useLoading({
    loading: busy,
    indicator: <Oval width="20" />,
  })

  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}

export default ChatInput
