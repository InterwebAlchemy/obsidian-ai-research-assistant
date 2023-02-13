import React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { useLoading, Oval } from '@agney/react-loading'

import InputArea from './InputArea'
import IconButton from './IconButton'

// import 'react-tabs/style/react-tabs.css'

export interface ChatInputProps {
  prompt: string
  onPromptChange: React.Dispatch<React.SetStateAction<string>>
  onPromptSubmit: (event: React.FormEvent) => void
  preamble?: string
  onPreambleChange?: React.Dispatch<React.SetStateAction<string>>
  busy?: boolean
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const ChatInput = ({
  onPromptChange,
  onPreambleChange,
  onPromptSubmit,
  prompt = '',
  preamble = '',
  busy = false,
}: ChatInputProps): React.ReactElement => {
  const { containerProps, indicatorEl } = useLoading({
    loading: busy,
    indicator: <Oval width="20" />,
  })

  return (
    <form
      className="ai-research-assistant__chat-form"
      onSubmit={onPromptSubmit}
      autoCapitalize="off"
      noValidate
    >
      <Tabs
        className="ai-research-assistant__chat-form__tabs"
        defaultIndex={0}
        onSelect={(index) => {
          console.log(index)
        }}
      >
        <TabList>
          <Tab>Prompt</Tab>
          <Tab>Preamble</Tab>
        </TabList>

        <TabPanel>
          <InputArea
            value={prompt}
            onChange={onPromptChange}
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
        </TabPanel>
        <TabPanel>
          <InputArea
            value={preamble}
            onChange={onPreambleChange}
            countType="tokens"
            countPosition="top"
            countAlign="right"
          />
        </TabPanel>
      </Tabs>
    </form>
  )
}

export default ChatInput
