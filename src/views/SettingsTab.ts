import { type App, PluginSettingTab, Setting, normalizePath } from 'obsidian'

import {
  BOT_HANDLE,
  BUILTIN_PROVIDER_IDS,
  KNOWN_MODELS,
  PLUGIN_NAME,
  USER_HANDLE
} from '../constants'

import type { ProviderSettings } from '../types'
import type ObsidianAIResearchAssistant from '../main'

export default class SettingsTab extends PluginSettingTab {
  plugin: ObsidianAIResearchAssistant

  constructor(app: App, plugin: ObsidianAIResearchAssistant) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    // ─── Active Provider ──────────────────────────────────────────────────

    containerEl.createEl('h2', { text: 'Providers' })

    const allProviderIds = Object.keys(this.plugin.settings.providers)
    const customIds = allProviderIds.filter(
      (id) => !(BUILTIN_PROVIDER_IDS as readonly string[]).includes(id)
    )

    new Setting(containerEl)
      .setName('Active provider / model')
      .setDesc(
        'Sets the default selection in the chat. You can also switch inline from the chat input.'
      )
      .addDropdown((dd) => {
        for (const id of allProviderIds) {
          const cfg = this.plugin.settings.providers[id]
          if (cfg.enabledModels.length === 0) continue
          const sorted = [...cfg.enabledModels].sort((a, b) => {
            const nameA = KNOWN_MODELS[id]?.find((m) => m.id === a)?.name ?? a
            const nameB = KNOWN_MODELS[id]?.find((m) => m.id === b)?.name ?? b
            return nameA.localeCompare(nameB)
          })
          for (const modelId of sorted) {
            const knownName = KNOWN_MODELS[id]?.find(
              (m) => m.id === modelId
            )?.name
            dd.addOption(
              `${id}::${modelId}`,
              `${cfg.name} — ${knownName ?? modelId}`
            )
          }
        }
        const activeCfg =
          this.plugin.settings.providers[this.plugin.settings.activeProviderId]
        dd.setValue(
          `${this.plugin.settings.activeProviderId}::${
            activeCfg?.defaultModel ?? ''
          }`
        )
        dd.onChange(async (value) => {
          const [providerId, modelId] = value.split('::')
          this.plugin.settings.activeProviderId = providerId
          const cfg = this.plugin.settings.providers[providerId] as
            | ProviderSettings
            | undefined
          if (cfg !== undefined) cfg.defaultModel = modelId
          await this.plugin.saveSettings()
          await this.plugin.reinitializeProvider(providerId)
        })
      })

    // ─── Built-in providers ───────────────────────────────────────────────

    containerEl.createEl('h3', { text: 'Built-in providers' })

    for (const id of BUILTIN_PROVIDER_IDS) {
      const cfg = this.plugin.settings.providers[id] as
        | ProviderSettings
        | undefined
      if (cfg == null) continue
      this.renderProviderSection(containerEl, id, false)
    }

    // ─── Custom OpenAI-compatible providers ───────────────────────────────

    const customSection = containerEl.createEl('details', {
      cls: 'ai-research-assistant-section-details'
    })
    const customSummary = customSection.createEl('summary', {
      cls: 'ai-research-assistant-section-summary'
    })
    customSummary.createSpan({
      cls: 'ai-research-assistant-section-summary-name',
      text: 'Custom providers'
    })
    if (customIds.length > 0) {
      customSummary.createSpan({
        cls: 'ai-research-assistant-section-count',
        text: String(customIds.length)
      })
    }
    const customInner = customSection.createDiv({
      cls: 'ai-research-assistant-section-inner'
    })
    customInner.createEl('p', {
      text: 'Add any OpenAI-compatible endpoint — LM Studio, Ollama, vLLM, custom deployments, etc.',
      cls: 'setting-item-description'
    })

    this.renderAddProviderForm(customInner)

    for (const id of customIds) {
      this.renderProviderSection(customInner, id, true)
    }

    // ─── Chat defaults ────────────────────────────────────────────────────

    containerEl.createEl('h2', { text: 'Chat defaults' })
    containerEl.createEl('p', {
      text: 'These apply when no per-conversation override is set.',
      cls: 'setting-item-description'
    })

    new Setting(containerEl)
      .setName('Default system prompt')
      .setDesc('Sent as the system message at the start of every conversation.')
      .setClass(
        `${PLUGIN_NAME.toLowerCase().replace(/\s+/g, '-')}__settings__preamble`
      )
      .addTextArea((t) =>
        t
          .setPlaceholder('You are a helpful assistant…')
          .setValue(this.plugin.settings.defaultPreamble ?? '')
          .onChange(async (value) => {
            this.plugin.settings.defaultPreamble = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('Controls randomness. Higher values produce more varied output.')
      .addSlider((slider) =>
        slider
          .setLimits(0, 2, 0.05)
          .setValue(this.plugin.settings.temperature)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.temperature = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Max response tokens')
      .setDesc('Maximum tokens to generate per response.')
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.maxTokens))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10)
            if (!isNaN(parsed) && parsed > 0) {
              this.plugin.settings.maxTokens = parsed
              await this.plugin.saveSettings()
            }
          })
      )

    // ─── Memory ───────────────────────────────────────────────────────────

    containerEl.createEl('h2', { text: 'Memory' })

    new Setting(containerEl)
      .setName('Maximum memory count')
      .setDesc(
        'The number of messages stored in conversation memory. Set to 0 for no limit. Core memories are always included.'
      )
      .addSlider((slider) =>
        slider
          .setDynamicTooltip()
          .setLimits(0, 20, 1)
          .setValue(this.plugin.settings.maxMemoryCount ?? 10)
          .onChange(async (value) => {
            this.plugin.settings.maxMemoryCount = value
            await this.plugin.saveSettings()
          })
      )

    // ─── Display ──────────────────────────────────────────────────────────

    containerEl.createEl('h2', { text: 'Display' })

    new Setting(containerEl)
      .setName('User handle')
      .setDesc('Label shown before user messages in the chat window.')
      .addText((text) =>
        text
          .setPlaceholder(USER_HANDLE)
          .setValue(this.plugin.settings.userHandle)
          .onChange(async (value) => {
            this.plugin.settings.userHandle = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Bot handle')
      .setDesc('Label shown before assistant messages in the chat window.')
      .addText((text) =>
        text
          .setPlaceholder(BOT_HANDLE)
          .setValue(this.plugin.settings.botHandle)
          .onChange(async (value) => {
            this.plugin.settings.botHandle = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Expand thinking tokens by default')
      .setDesc(
        'When enabled, reasoning / thinking blocks start expanded in every new conversation. You can still collapse individual blocks.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.expandThinkingByDefault)
          .onChange(async (value) => {
            this.plugin.settings.expandThinkingByDefault = value
            await this.plugin.saveSettings()
          })
      )

    // ─── Conversations ────────────────────────────────────────────────────

    containerEl.createEl('h2', { text: 'Conversations' })

    new Setting(containerEl)
      .setName('Conversation directory')
      .setDesc('Where to save conversations in your vault.')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.conversationHistoryDirectory)
          .onChange(async (value) => {
            this.plugin.settings.conversationHistoryDirectory =
              normalizePath(value)
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Autosave conversations')
      .setDesc(
        'Automatically save conversations to your vault after they have been given a title.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autosaveConversationHistory)
          .onChange(async (value) => {
            this.plugin.settings.autosaveConversationHistory = value
            await this.plugin.saveSettings()
            this.display()
          })
      )

    if (this.plugin.settings.autosaveConversationHistory) {
      new Setting(containerEl)
        .setName('Autosave interval (seconds)')
        .setDesc(
          'How many seconds between automatic saves. Restart the chat view for changes to take effect.'
        )
        .addText((text) => {
          text.setValue(`${this.plugin.settings.autosaveInterval}`)
          text.onChange(async (value) => {
            const n = Number(value)
            this.plugin.settings.autosaveInterval = !isNaN(n) ? n : 60
            await this.plugin.saveSettings()
          })
        })
    }
  }

  // ─── Per-provider accordion section ───────────────────────────────────────

  private renderProviderSection(
    containerEl: HTMLElement,
    id: string,
    canRemove: boolean
  ): void {
    const cfg = this.plugin.settings.providers[id]
    const isActive = id === this.plugin.settings.activeProviderId

    const details = containerEl.createEl('details', {
      cls: 'ai-research-assistant-provider-details'
    })
    const summary = details.createEl('summary', {
      cls: 'ai-research-assistant-provider-summary'
    })
    summary.createSpan({
      cls: 'ai-research-assistant-provider-summary-name',
      text: cfg.name
    })
    if (isActive) {
      summary.createSpan({
        cls: 'ai-research-assistant-provider-active-badge',
        text: 'active'
      })
    }

    const inner = details.createDiv({
      cls: 'ai-research-assistant-provider-inner'
    })

    if (canRemove) {
      new Setting(inner).setName('Remove provider').addButton((btn) =>
        btn
          .setButtonText('Remove')
          .setClass('mod-warning')
          .onClick(async () => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.plugin.settings.providers[id]
            if (this.plugin.settings.activeProviderId === id) {
              this.plugin.settings.activeProviderId = 'openai'
            }
            await this.plugin.saveSettings()
            await this.plugin.refreshChatView()
            this.display()
          })
      )
    }

    if (id === 'openrouter') {
      inner.createEl('p', {
        text: 'Routes requests to 200+ models via a single API key. Get yours at openrouter.ai/keys.',
        cls: 'setting-item-description'
      })
    } else if (id !== 'anthropic') {
      new Setting(inner)
        .setName('Base URL')
        .setDesc('OpenAI-compatible API base URL.')
        .addText((text) =>
          text
            .setPlaceholder('http://localhost:1234')
            .setValue(cfg.baseUrl ?? '')
            .onChange(async (value) => {
              cfg.baseUrl = value
              await this.plugin.reinitializeProvider(id)
              await this.plugin.saveSettings()
            })
        )
    }

    new Setting(inner)
      .setName('API key')
      .setDesc('Stored per-device and not synced.')
      .addText((text) => {
        text.inputEl.type = 'password'
        text.inputEl.autocomplete = 'off'
        void this.plugin.getSecret(`${id}-api-key`).then((key) => {
          if (key !== undefined && key !== '') text.setValue('••••••••')
        })
        text.onChange(async (value) => {
          if (value !== '' && value !== '••••••••') {
            await this.plugin.setSecret(`${id}-api-key`, value)
          }
        })
        return text
      })

    this.renderModelSection(inner, id)
  }

  // ─── Add custom provider form ──────────────────────────────────────────────

  private renderAddProviderForm(containerEl: HTMLElement): void {
    let newName = ''
    let newUrl = ''

    new Setting(containerEl)
      .setName('Add custom provider')
      .setDesc(
        'Name it after the service (e.g. LM Studio). The name becomes its ID slug.'
      )
      .addText((t) =>
        t.setPlaceholder('Name').onChange((v) => {
          newName = v.trim()
        })
      )
      .addText((t) =>
        t
          .setPlaceholder('Base URL (e.g. http://localhost:1234)')
          .onChange((v) => {
            newUrl = v.trim()
          })
      )
      .addButton((btn) =>
        btn.setButtonText('Add').onClick(async () => {
          if (newName === '') return
          const id = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          if (
            (this.plugin.settings.providers[id] as
              | ProviderSettings
              | undefined) !== undefined
          )
            return
          const newProvider: ProviderSettings = {
            id,
            name: newName,
            baseUrl: newUrl !== '' ? newUrl : 'http://localhost:1234',
            defaultModel: '',
            enabledModels: [],
            customModels: []
          }
          this.plugin.settings.providers[id] = newProvider
          await this.plugin.reinitializeProvider(id)
          await this.plugin.saveSettings()
          await this.plugin.refreshChatView()
          this.display()
        })
      )
  }

  // ─── Model management section ──────────────────────────────────────────────

  private renderModelSection(containerEl: HTMLElement, id: string): void {
    const cfg = this.plugin.settings.providers[id]
    const knownModels = KNOWN_MODELS[id] ?? []

    const getModelName = (mid: string): string =>
      knownModels.find((m) => m.id === mid)?.name ?? mid

    containerEl.createEl('h4', { text: 'Models' })

    const sortedKnown = [...knownModels].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    for (const model of sortedKnown) {
      const desc =
        model.contextWindow != null
          ? `${model.id} · ${Math.round(model.contextWindow / 1000)}K ctx`
          : model.id

      new Setting(containerEl)
        .setName(model.name)
        .setDesc(desc)
        .addToggle((t) =>
          t
            .setValue(cfg.enabledModels.includes(model.id))
            .onChange(async (on) => {
              if (on) {
                if (!cfg.enabledModels.includes(model.id))
                  cfg.enabledModels.push(model.id)
              } else {
                cfg.enabledModels = cfg.enabledModels.filter(
                  (m) => m !== model.id
                )
                if (cfg.defaultModel === model.id) {
                  cfg.defaultModel = cfg.enabledModels[0] ?? ''
                }
              }
              await this.plugin.saveSettings()
              await this.plugin.refreshChatView()
              this.display()
            })
        )
    }

    const sortedCustom = [...cfg.customModels].sort((a, b) =>
      a.localeCompare(b)
    )

    for (const customId of sortedCustom) {
      new Setting(containerEl)
        .setName(customId)
        .setDesc('Custom model')
        .addExtraButton((btn) =>
          btn
            .setIcon('trash')
            .setTooltip('Remove')
            .onClick(async () => {
              cfg.customModels = cfg.customModels.filter((m) => m !== customId)
              cfg.enabledModels = cfg.enabledModels.filter(
                (m) => m !== customId
              )
              if (cfg.defaultModel === customId) {
                cfg.defaultModel = cfg.enabledModels[0] ?? ''
              }
              await this.plugin.saveSettings()
              await this.plugin.refreshChatView()
              this.display()
            })
        )
    }

    let newModelId = ''
    new Setting(containerEl)
      .setName('Add custom model')
      .setDesc('Enter any model ID supported by this endpoint.')
      .addText((t) =>
        t.setPlaceholder('model-id or org/model-id').onChange((v) => {
          newModelId = v.trim()
        })
      )
      .addButton((btn) =>
        btn.setButtonText('Add').onClick(async () => {
          if (newModelId === '' || cfg.customModels.includes(newModelId)) return
          cfg.customModels.push(newModelId)
          cfg.enabledModels.push(newModelId)
          if (cfg.defaultModel === '') cfg.defaultModel = newModelId
          newModelId = ''
          await this.plugin.saveSettings()
          await this.plugin.refreshChatView()
          this.display()
        })
      )

    const sortedEnabled = [...cfg.enabledModels].sort((a, b) =>
      getModelName(a).localeCompare(getModelName(b))
    )

    if (sortedEnabled.length > 0) {
      new Setting(containerEl)
        .setName('Default model')
        .setDesc('Pre-selected when switching to this provider in the chat.')
        .addDropdown((dd) => {
          for (const mid of sortedEnabled) dd.addOption(mid, getModelName(mid))
          dd.setValue(
            cfg.defaultModel !== '' ? cfg.defaultModel : sortedEnabled[0]
          )
          dd.onChange(async (value) => {
            cfg.defaultModel = value
            await this.plugin.saveSettings()
            await this.plugin.refreshChatView()
          })
        })
    } else {
      new Setting(containerEl)
        .setName('Default model')
        .setDesc(
          'No models enabled. Toggle models above or add a custom model ID.'
        )
        .addText((t) =>
          t
            .setPlaceholder('model-id')
            .setValue(cfg.defaultModel)
            .onChange(async (value) => {
              cfg.defaultModel = value
              await this.plugin.saveSettings()
            })
        )
    }
  }
}
