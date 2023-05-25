import { type App, Plugin, type PluginManifest, TFile, Notice } from 'obsidian'

import ChatView from './views/ChatView'
import SettingsTab from './views/SettingsTab'

import Chat from './services/chat'
import OpenAIModels from './services/openai/models'
import Logger from './services/logger'

import { summaryTemplate } from './templates/summaryTemplate'

import { PLUGIN_NAME, PLUGIN_SETTINGS, PLUGIN_PREFIX } from './constants'

import type { Conversation } from './services/conversation'

import type { PluginSettings } from './types'

import unpatchSafeStorage from './utils/patchedSafeStorage'

export default class ObsidianAIResearchAssistant extends Plugin {
  settings: PluginSettings
  chat: Chat
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
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: PLUGIN_PREFIX,
        active: true
      })
    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(PLUGIN_PREFIX)[0]
    )
  }

  async initializeChatService(): Promise<void> {
    if (
      typeof this.settings.openApiKey !== 'undefined' &&
      this.settings.openApiKey !== '' &&
      this.settings.openApiKey !== null
    ) {
      const model = OpenAIModels[this.settings.defaultModel]

      if (typeof model !== 'undefined') {
        this.chat = new Chat({
          apiKey: this.settings.openApiKey,
          model,
          logger: this.logger
        })
      }
    }
  }

  async initializeChatInterface(): Promise<void> {
    this.addRibbonIcon(
      'message-square',
      PLUGIN_NAME,
      async (): Promise<void> => {
        if (
          typeof this.settings.openApiKey !== 'undefined' &&
          this.settings.openApiKey !== '' &&
          this.settings.openApiKey !== null
        ) {
          await this.activateView()
        } else {
          // eslint-disable-next-line no-new
          new Notice(
            `Please configure your OpenAI API key in the ${PLUGIN_NAME} settings.`
          )
        }
      }
    )

    this.registerView(PLUGIN_PREFIX, (leaf) => new ChatView(leaf, this))
  }

  initializeLogger(): void {
    this.logger = new Logger({ settings: this.settings })

    this.logger.debug('Logger initialized...')
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

  onunload(): void {
    this.app.workspace.detachLeavesOfType(PLUGIN_PREFIX)
    unpatchSafeStorage()
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, PLUGIN_SETTINGS, await this.loadData())
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }

  async checkForExistingFile(title: string): Promise<boolean> {
    const filePath = this.settings.conversationHistoryDirectory

    const file = `${filePath}/${title.replace(/[\\:/]/g, '_')}.md`

    const existingFile = this.app.vault.getAbstractFileByPath(file)

    if (existingFile !== null) {
      return true
    }

    return false
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    let canSave = true

    const filePath = this.settings.conversationHistoryDirectory

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
      const file = `${filePath}/${conversation.title.replace(
        /[\\:/]/g,
        '_'
      )}.md`

      const existingFile = this.app.vault.getAbstractFileByPath(file)

      const fileContent = summaryTemplate(conversation)

      if (existingFile !== null) {
        await this.app.vault.modify(existingFile as TFile, fileContent)
      } else {
        await this.app.vault.create(file, fileContent)
      }
    }
  }
}
