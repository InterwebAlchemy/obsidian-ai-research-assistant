import React, { useEffect, useState } from 'react'

import InputArea from './InputArea'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'
import { OPEN_AI_DEFAULT_TEMPERATURE } from '../services/openai/constants'

export interface ConversationSettingsProps {
  conversation: Conversation | null
}

const ConversationSettings = ({
  conversation
}: ConversationSettingsProps): React.ReactElement => {
  const { plugin } = useApp()

  const { settings } = plugin

  const [userHandle, setUserHandle] = useState('')
  const [botHandle, setBotHandle] = useState('')
  const [maxTokens, setMaxTokens] = useState(0)
  const [temperature, setTemperature] = useState(0)

  const changeTemperature = (temperatureString: string): void => {
    setTemperature(Number(temperatureString))
  }

  const changeMaxTokens = (maxTokensString: string): void => {
    setMaxTokens(Number(maxTokensString))
  }

  useEffect(() => {
    if (typeof settings !== 'undefined') {
      setUserHandle(settings.userHandle)
      setBotHandle(settings.botHandle)
      setMaxTokens(settings.defaultMaxTokens ?? 0)
    }
  }, [settings])

  useEffect(() => {
    if (typeof conversation !== 'undefined' && conversation !== null) {
      setTemperature(
        conversation.settings.temperature ?? OPEN_AI_DEFAULT_TEMPERATURE
      )
    }
  }, [conversation])

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      userHandle !== conversation?.settings.userHandle
    ) {
      conversation.settings.userHandle = userHandle
    }
  }, [userHandle])

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      botHandle !== conversation?.settings.botHandle
    ) {
      conversation.settings.botHandle = botHandle
    }
  }, [botHandle])

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      maxTokens !== conversation?.settings.defaultMaxTokens
    ) {
      conversation.settings.defaultMaxTokens = maxTokens
    }
  }, [maxTokens])

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      temperature !== conversation?.settings.temperature
    ) {
      conversation.settings.temperature = temperature
    }
  }, [temperature])

  return (
    <div className="ai-research-assistant__chat__conversation-settings">
      <div className="ai-research-assistant__chat__conversation-settings__row">
        <InputArea
          type="text"
          label="User Handle"
          value={userHandle}
          onChange={setUserHandle}
        />
        <InputArea
          type="text"
          label="Bot Handle"
          value={botHandle}
          onChange={setBotHandle}
        />
      </div>
      <div className="ai-research-assistant__chat__conversation-settings__row">
        <InputArea
          type="text"
          label="Maximum Tokens"
          value={`${maxTokens}`}
          onChange={changeMaxTokens}
        />
        <InputArea
          type="text"
          label="Temperature"
          value={`${temperature}`}
          onChange={changeTemperature}
        />
      </div>
    </div>
  )
}

export default ConversationSettings
