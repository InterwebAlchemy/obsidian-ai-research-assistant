import React, { useEffect, useState } from 'react'

import InputArea from './InputArea'

import { useApp } from '../hooks/useApp'

import type { Conversation } from '../services/conversation'
import { OPEN_AI_DEFAULT_TEMPERATURE } from '../services/openai/constants'
import { KNOWN_MODELS } from '../constants'
import type { ModelDefinition } from '../services/openai/types'

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

  const activeProvider = settings.providers?.[settings.activeProviderId]
  const knownModels = KNOWN_MODELS[settings.activeProviderId] ?? []
  const allModelIds = [
    ...(activeProvider?.enabledModels ?? []),
    ...(activeProvider?.customModels ?? [])
  ]

  const getModelName = (id: string): string =>
    knownModels.find((m) => m.id === id)?.name ?? id

  const makeModelDef = (modelId: string): ModelDefinition => ({
    name: getModelName(modelId),
    model: modelId,
    tokenType: 'gpt4' as const,
    maxTokens: settings.maxTokens ?? 4096,
    adapter: { name: 'openai' as const, engine: 'chat' as const }
  })

  const changeTemperature = (temperatureString: string): void => {
    setTemperature(temperatureString)
  }

  const changeModel = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const modelId = e.target.value

    if (typeof conversation !== 'undefined' && conversation !== null) {
      conversation.updateModel(makeModelDef(modelId))
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

      if (temp >= 0 && temp <= 1) {
        conversation.settings.temperature = temp
      } else {
        conversation.settings.temperature = OPEN_AI_DEFAULT_TEMPERATURE
      }
    }
  }, [temperature])

  const defaultModelId =
    conversation?.model.model ??
    activeProvider?.defaultModel ??
    settings.defaultModel

  const renderModels = (): React.ReactElement[] =>
    allModelIds.map((id) => (
      <option key={id} value={id}>
        {getModelName(id)}
      </option>
    ))

  const renderModelDropdown = (): React.ReactElement => (
    <select
      name="model"
      id="model"
      className="dropdown"
      onChange={changeModel}
      defaultValue={defaultModelId}>
      {renderModels()}
    </select>
  )

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
            {renderModelDropdown()}
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
