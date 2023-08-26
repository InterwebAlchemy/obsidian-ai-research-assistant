import React, { useEffect, useState } from 'react'

import InputArea from './InputArea'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'
import {
  OPEN_AI_DEFAULT_TEMPERATURE,
  OPEN_AI_DEFAULT_MODEL_NAME
} from '../services/openai/constants'
import models from '../services/openai/models'
import type { OpenAIModel } from 'src/services/openai/types'

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
  const [model, setModel] = useState<OpenAIModel>(
    conversation?.model.model ?? OPEN_AI_DEFAULT_MODEL_NAME
  )
  const [temperature, setTemperature] = useState(
    `${OPEN_AI_DEFAULT_TEMPERATURE}`
  )

  const changeTemperature = (temperatureString: string): void => {
    setTemperature(temperatureString)
  }

  const changeMaxTokens = (maxTokensString: string): void => {
    setMaxTokens(Number(maxTokensString))
  }

  const changeModel = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const modelName = e.target.value

    setModel(modelName as OpenAIModel)
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
        `${conversation.settings.temperature ?? OPEN_AI_DEFAULT_TEMPERATURE}`
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
      Number(temperature) !== conversation?.settings.temperature
    ) {
      const temp = Number(temperature)

      // make sure temperature is valid value
      if (temp >= 0 && temp <= 1) {
        conversation.settings.temperature = temp
      } else {
        conversation.settings.temperature = OPEN_AI_DEFAULT_TEMPERATURE
      }
    }
  }, [temperature])

  useEffect(() => {
    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      model !== conversation?.model.model
    ) {
      conversation.updateModel(models[model])
    }
  }, [model])

  const renderModels = (
    selectedModel = OPEN_AI_DEFAULT_MODEL_NAME
  ): React.ReactElement[] => {
    return Object.entries(models).map(([key, modelDefinition]) => (
      <option key={key} value={modelDefinition.model}>
        {modelDefinition.name}
      </option>
    ))
  }

  const renderModelDropdown = (
    defaultModel = OPEN_AI_DEFAULT_MODEL_NAME
  ): React.ReactElement => {
    return (
      <select
        name="model"
        id="model"
        className="dropdown"
        onChange={changeModel}
        defaultValue={defaultModel}>
        {renderModels(defaultModel)}
      </select>
    )
  }

  return (
    <div className="ai-research-assistant__chat__conversation-settings__container">
      <div className="ai-research-assistant__chat__conversation-settings">
        <div className="ai-research-assistant__chat__conversation-settings__row">
          {renderModelDropdown(model)}
        </div>
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
    </div>
  )
}

export default ConversationSettings
