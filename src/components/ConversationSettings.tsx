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

  const [activeProviderId, setActiveProviderId] = useState(
    settings.activeProviderId
  )

  const providerIds = Object.keys(settings.providers ?? {})
  const activeProvider = settings.providers?.[activeProviderId]
  const knownModels = KNOWN_MODELS[activeProviderId] ?? []
  const allModelIds = [
    ...(activeProvider?.enabledModels ?? []),
    ...(activeProvider?.customModels ?? [])
  ]

  const getProviderName = (id: string): string =>
    settings.providers?.[id]?.name ?? id

  const getModelName = (id: string): string =>
    knownModels.find((m) => m.id === id)?.name ?? id

  const makeModelDef = (modelId: string): ModelDefinition => ({
    name: getModelName(modelId),
    model: modelId,
    tokenType: 'gpt4' as const,
    maxTokens: settings.maxTokens ?? 4096,
    adapter: { name: activeProviderId, engine: 'chat' as const }
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

  const changeProvider = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextProviderId = e.target.value
    const nextProvider = settings.providers?.[nextProviderId]
    if (nextProvider === undefined) return

    setActiveProviderId(nextProviderId)
    plugin.settings.activeProviderId = nextProviderId

    // Pick a sensible model for the new provider — prefer its defaultModel,
    // otherwise the first enabled model.
    const nextModelId =
      nextProvider.defaultModel !== ''
        ? nextProvider.defaultModel
        : nextProvider.enabledModels[0] ?? nextProvider.customModels[0] ?? ''
    if (nextModelId !== '') {
      plugin.settings.defaultModel = nextModelId
    }

    void plugin.saveSettings().then(async () => {
      await plugin.refreshChatView()
      // refreshChatView rebuilds chat.model, which propagates to the active
      // conversation via Chat.updateModel — no extra wiring needed here.
    })
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
      key={`model-${activeProviderId}`}
      name="model"
      id="model"
      className="dropdown"
      onChange={changeModel}
      defaultValue={defaultModelId}>
      {renderModels()}
    </select>
  )

  const renderProviderDropdown = (): React.ReactElement => (
    <select
      name="provider"
      id="provider"
      className="dropdown"
      onChange={changeProvider}
      value={activeProviderId}>
      {providerIds.map((id) => (
        <option key={id} value={id}>
          {getProviderName(id)}
        </option>
      ))}
    </select>
  )

  return (
    <div className="ai-research-assistant__chat__conversation-settings__container">
      <div className="ai-research-assistant__chat__conversation-settings">
        <div className="ai-research-assistant__chat__conversation-settings__row">
          <div className="ai-research-assistant__input-area">
            <label
              className="ai-research-assistant__input-area__input__label"
              htmlFor="provider">
              Provider
            </label>
            {renderProviderDropdown()}
          </div>
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
