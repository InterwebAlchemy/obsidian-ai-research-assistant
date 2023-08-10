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

import { summaryTemplate } from './templates/summaryTemplate'

import { PLUGIN_NAME, PLUGIN_SETTINGS, PLUGIN_PREFIX } from './constants'

import type { Conversation } from './services/conversation'

import type { PluginSettings } from './types'

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
      typeof this.settings.openAiApiKey !== 'undefined' &&
      this.settings.openAiApiKey !== '' &&
      this.settings.openAiApiKey !== null
    ) {
      const model = OpenAIModels[this.settings.defaultModel]

      if (typeof model !== 'undefined') {
        this.chat = new Chat({
          apiKey: this.settings.openAiApiKey,
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
          typeof this.settings.openAiApiKey !== 'undefined' &&
          this.settings.openAiApiKey !== '' &&
          this.settings.openAiApiKey !== null
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
    this.settings = Object.assign({}, PLUGIN_SETTINGS, await this.loadData())
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
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
