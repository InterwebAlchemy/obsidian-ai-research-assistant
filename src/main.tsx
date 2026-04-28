import {
  type App,
  Plugin,
  type PluginManifest,
  TFile,
  Notice,
  normalizePath
} from 'obsidian'

import ChatView from './views/ChatView'
import SettingsTab from './views/SettingsTab'

import Chat from './services/chat'
import OpenAIModels from './services/openai/models'
import Logger from './services/logger'
import { createAdapter } from './services/providers'

import { summaryTemplate } from './templates/summaryTemplate'

import { PLUGIN_NAME, PLUGIN_SETTINGS, PLUGIN_PREFIX } from './constants'
import { OPEN_AI_DEFAULT_MODEL_NAME } from './services/openai/constants'

import type { Conversation } from './services/conversation'

import type { PluginSettings } from './types'

export default class ObsidianAIResearchAssistant extends Plugin {
  settings: PluginSettings
  chat: Chat | undefined
  autoSaving: boolean
  logger: Logger
  pauseAutosaving: boolean

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)

    this.autoSaving = false
    this.pauseAutosaving = false
  }

  async activateView(): Promise<void> {
    const existingView = this.app.workspace.getLeavesOfType(PLUGIN_PREFIX)

    if (existingView.length === 0) {
      await this.app.workspace.getRightLeaf(false)?.setViewState({
        type: PLUGIN_PREFIX,
        active: true
      })
    }

    const leaf = this.app.workspace.getLeavesOfType(PLUGIN_PREFIX)[0]

    if (leaf !== undefined) {
      await this.app.workspace.revealLeaf(leaf)
    }
  }

  async initializeChatService(): Promise<void> {
    const { activeProviderId, providers } = this.settings
    const apiKey = this.getProviderApiKey(activeProviderId) ?? ''
    const adapter = createAdapter(this.settings, apiKey)

    // Resolve a ModelDefinition for the active provider so the Conversation
    // class can use it for context formatting and display.
    const providerCfg = providers[activeProviderId]
    const modelName =
      providerCfg?.defaultModel ??
      this.settings.defaultModel ??
      OPEN_AI_DEFAULT_MODEL_NAME
    // Only use the OpenAI model catalog when the active provider is OpenAI.
    // For every other provider, build a synthetic ModelDefinition that names
    // the actual provider — otherwise saved conversation frontmatter ends up
    // claiming `adapter: openai` regardless of which provider answered.
    const model =
      activeProviderId === 'openai' && OpenAIModels[modelName] !== undefined
        ? OpenAIModels[modelName]
        : {
            name: modelName,
            model: modelName,
            tokenType: 'gpt4' as const,
            maxTokens: this.settings.maxTokens ?? 4096,
            adapter: {
              name: activeProviderId,
              engine: 'chat' as const
            }
          }

    if (this.chat !== undefined) {
      // Update in place — preserves currentConversationId and conversation history
      this.chat.updateAdapter(adapter)
      this.chat.updateModel(model)
    } else {
      this.chat = new Chat({ adapter, model, logger: this.logger })
    }
  }

  async refreshChatView(): Promise<void> {
    await this.initializeChatService()
  }

  async reinitializeProvider(_id: string): Promise<void> {
    await this.initializeChatService()
  }

  async initializeChatInterface(): Promise<void> {
    this.addRibbonIcon(
      'message-square',
      PLUGIN_NAME,
      async (): Promise<void> => {
        await this.activateView()
      }
    )

    this.registerView(PLUGIN_PREFIX, (leaf) => new ChatView(leaf, this))
  }

  initializeLogger(): void {
    this.logger = new Logger({ settings: this.settings })

    this.logger.debug(`${PLUGIN_NAME} Logger initialized...`)
  }

  async onload(): Promise<void> {
    console.log(`Loading ${PLUGIN_NAME} plugin...`)

    await this.loadSettings()

    this.initializeLogger()

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingsTab(this.app, this))

    await this.initializeChatService()

    await this.initializeChatInterface()
  }

  async loadSettings(): Promise<void> {
    const loaded: Record<string, unknown> = (await this.loadData()) ?? {}

    // 1.4+ keys were encrypted via Electron's `remote.safeStorage`, which is
    // gone from modern Electron — we can't decrypt that blob from a renderer.
    // Carry the value over verbatim: plaintext (pre-1.4) keys work; encrypted
    // blobs will fail auth and the user re-enters in settings.
    let migratedOpenAiKey: string | undefined
    if (typeof loaded.openAiApiKey === 'string' && loaded.openAiApiKey !== '') {
      const secretId = 'openai-api-key'
      this.app.secretStorage.setSecret(secretId, loaded.openAiApiKey)
      migratedOpenAiKey = secretId
      delete loaded.openAiApiKey
      delete loaded.apiKeySaved
      // eslint-disable-next-line no-new
      new Notice(
        `${PLUGIN_NAME}: moved your OpenAI key into Obsidian's secret storage. If chat fails to authenticate, re-enter the key in Settings.`,
        10000
      )
    }

    this.settings = Object.assign({}, PLUGIN_SETTINGS, loaded)

    // ─── Deep-merge provider configs ──────────────────────────────────────
    // Ensures new fields (enabledModels, customModels, etc.) are present even
    // when loading an older saved config that predates multi-provider support.
    for (const [id, defaults] of Object.entries(PLUGIN_SETTINGS.providers)) {
      const existing = this.settings.providers[id] as
        | PluginSettings['providers'][string]
        | undefined
      if (existing !== undefined) {
        this.settings.providers[id] = Object.assign({}, defaults, existing)
      } else {
        this.settings.providers[id] = { ...defaults }
      }
    }

    // ─── Sync transitional defaultModel ───────────────────────────────────
    const activeCfg = this.settings.providers[
      this.settings.activeProviderId
    ] as PluginSettings['providers'][string] | undefined
    if (
      activeCfg?.defaultModel !== undefined &&
      activeCfg.defaultModel !== ''
    ) {
      this.settings.defaultModel = activeCfg.defaultModel
    }

    if (migratedOpenAiKey !== undefined) {
      const openAiCfg = this.settings.providers.openai as
        | PluginSettings['providers'][string]
        | undefined
      if (openAiCfg !== undefined) {
        openAiCfg.apiKeySecret = migratedOpenAiKey
        await this.saveData(this.settings)
      }
    }
  }

  async saveSettings(): Promise<void> {
    // Keep transitional defaultModel in sync before persisting
    const activeCfg = this.settings.providers[
      this.settings.activeProviderId
    ] as PluginSettings['providers'][string] | undefined
    if (
      activeCfg?.defaultModel !== undefined &&
      activeCfg.defaultModel !== ''
    ) {
      this.settings.defaultModel = activeCfg.defaultModel
    }
    await this.saveData(this.settings)
  }

  // ─── SecretStorage ────────────────────────────────────────────────────────
  // The settings UI writes API keys via Obsidian's `SecretComponent`, which
  // owns the storage round-trip. We only ever read.

  getProviderApiKey(providerId: string): string | undefined {
    const cfg = this.settings.providers[providerId] as
      | PluginSettings['providers'][string]
      | undefined
    const secretId = cfg?.apiKeySecret
    if (secretId === undefined || secretId === '') return undefined
    try {
      return this.app.secretStorage.getSecret(secretId) ?? undefined
    } catch {
      return undefined
    }
  }

  async checkForExistingFile(title: string): Promise<boolean> {
    const filePath = this.settings.conversationHistoryDirectory

    const file = normalizePath(
      `${filePath}/${title.replace(/[\\:/]/g, '_')}.md`
    )

    const existingFile = this.app.vault.getAbstractFileByPath(file)

    return existingFile instanceof TFile
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    let canSave = true

    // NOTE: we normalize the path when we save the settings, so we may not need to normalize it here as well
    const filePath = normalizePath(this.settings.conversationHistoryDirectory)

    const existingDirectory = this.app.vault.getAbstractFileByPath(filePath)

    if (existingDirectory === null) {
      await this.app.vault.createFolder(filePath)
    } else if (existingDirectory instanceof TFile) {
      canSave = false

      // eslint-disable-next-line no-new
      new Notice(
        'ERROR: Cannot save Conversation. Configured conversation history directory is a file, not a directory.'
      )
    }

    if (canSave) {
      const file = normalizePath(
        `${filePath}/${conversation.title.replace(/[\\:/]/g, '_')}.md`
      )

      const existingFile = this.app.vault.getAbstractFileByPath(file)

      const fileContent = summaryTemplate(conversation)

      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, fileContent)
      } else {
        await this.app.vault.create(file, fileContent)
      }
    }
  }
}
