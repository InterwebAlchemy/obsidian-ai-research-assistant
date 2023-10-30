import React, { useEffect, useState } from 'react'

import InputArea from './InputArea'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'
import { OPEN_AI_DEFAULT_TEMPERATURE } from '../services/openai/constants'
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
  const [temperature, setTemperature] = useState(
    `${OPEN_AI_DEFAULT_TEMPERATURE}`
  )

  const changeTemperature = (temperatureString: string): void => {
    setTemperature(temperatureString)
  }

  const changeModel = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const modelName = e.target.value

    if (typeof conversation !== 'undefined' && conversation !== null) {
      conversation.updateModel(models[modelName as OpenAIModel])
    }
  }

  useEffect(() => {
    if (typeof settings !== 'undefined') {
      setUserHandle(settings.userHandle)
      setBotHandle(settings.botHandle)
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

  const renderModels = (
    selectedModel = settings.defaultModel
  ): React.ReactElement[] => {
    return Object.entries(models).map(([key, modelDefinition]) => (
      <option key={key} value={modelDefinition.model}>
        {modelDefinition.name}
      </option>
    ))
  }

  const renderModelDropdown = (
    defaultModel = settings.defaultModel
  ): React.ReactElement => {
    console.log(defaultModel, settings.defaultModel)

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
          <div className="ai-research-assistant__input-area">
            <label
              className="ai-research-assistant__input-area__input__label"
              htmlFor="model">
              Model
            </label>
            {renderModelDropdown(
              conversation?.model.model ?? settings.defaultModel
            )}
          </div>
          <InputArea
            type="text"
            label="Temperature"
            value={`${temperature}`}
            onChange={changeTemperature}
          />
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
      </div>
    </div>
  )
}

export default ConversationSettings
