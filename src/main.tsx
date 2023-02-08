import {
  type App,
  ButtonComponent,
  ItemView,
  Plugin,
  type PluginManifest,
  PluginSettingTab,
  Setting,
  TFile,
  type WorkspaceLeaf,
  Notice,
} from 'obsidian'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

import { AppContext } from './context'
import SidebarView from './views/SidebarView'
import Chat from './services/chat'

import { summaryTemplate } from './templates/summaryTemplate'
import CHATGPT from './prompts/chatgpt'
import {
  DEFAULT_CONVERSATION_TITLE,
  PLUGIN_NAME,
  PLUGIN_SETTINGS,
  PLUGIN_PREFIX,
} from './constants'

import type { Conversation } from './services/conversation'

export interface GPTHelperSettings {
  debugMode: boolean
  openApiKey: string
  apiKeySaved: boolean
  autosaveConversationHistory: boolean
  conversationHistoryDirectory: string
}

export default class GPTHelper extends Plugin {
  settings: GPTHelperSettings
  chat: Chat | null
  autoSaving: boolean

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)

    this.chat = null
    this.autoSaving = false
  }

  async activateView(): Promise<void> {
    const existingView = this.app.workspace.getLeavesOfType(PLUGIN_PREFIX)

    if (existingView.length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: PLUGIN_PREFIX,
        active: true,
      })

      if (this.chat !== null) {
        this.chat?.start({ prompt: CHATGPT(), title: DEFAULT_CONVERSATION_TITLE })
      }
    }

    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(PLUGIN_PREFIX)[0])
  }

  async initializeChatInterface(): Promise<void> {
    if (
      typeof this.settings.openApiKey !== 'undefined' &&
      this.settings.openApiKey !== '' &&
      this.settings.openApiKey !== null
    ) {
      if (this.chat === null) {
        this.chat = new Chat({ apiKey: this.settings.openApiKey })
      }

      this.addRibbonIcon('message-square', PLUGIN_NAME, async (): Promise<void> => {
        await this.activateView()
      })

      this.registerView(PLUGIN_PREFIX, (leaf) => new SampleView(leaf, this))
    }
  }

  async onload(): Promise<void> {
    await this.loadSettings()

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this))

    await this.initializeChatInterface()
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(PLUGIN_PREFIX)
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, PLUGIN_SETTINGS, await this.loadData())
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
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
      const file = `${filePath}/${conversation.title.replace(/[\\:/]/g, '_')}.md`

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

class SampleView extends ItemView {
  plugin: GPTHelper
  settings: GPTHelperSettings
  chat: Chat
  saveConversation: (conversation: Conversation) => Promise<void>
  saveButton: ButtonComponent | null
  autosaveInterval: number | null
  lastSavedMessageId: string | null

  constructor(leaf: WorkspaceLeaf, plugin: GPTHelper) {
    super(leaf)

    this.plugin = plugin
    this.settings = plugin.settings
    this.saveConversation = plugin.saveConversation.bind(plugin)
    this.chat = plugin.chat as Chat
    this.saveButton = null
    this.autosaveInterval = null
    this.lastSavedMessageId = null
  }

  getViewType(): string {
    return PLUGIN_PREFIX
  }

  getDisplayText(): string {
    return PLUGIN_NAME
  }

  autosaveConversation(): void {
    console.debug('Checking Autosave requirements...')

    const conversation = this.chat?.currentConversation()

    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      conversation.messages.length > 0
    ) {
      const finalMessaggeId = conversation?.messages?.last()?.id

      if (finalMessaggeId !== this.lastSavedMessageId) {
        // eslint-disable-next-line no-new
        new Notice('Autosaving conversation...', 1000)

        console.debug('Autosaving conversation...')
        console.debug(conversation)

        this.plugin.autoSaving = true
        this.saveButton?.setIcon('loader-2')
        this.saveButton?.setDisabled(true)

        this.saveConversation(conversation)
          .then(() => {
            const lastMessageId = conversation?.messages?.last()?.id

            if (typeof lastMessageId !== 'undefined') {
              this.lastSavedMessageId = lastMessageId
            }

            console.debug('Conversation saved.')
          })
          .catch((error) => {
            if (this.settings.debugMode) {
              // eslint-disable-next-line no-new
              new Notice(`Error saving conversation: ${error.message as string}`)
            }

            console.error(error)
          })
          .finally(() => {
            this.plugin.autoSaving = false
            this.saveButton?.setIcon('save')
          })
      } else {
        console.debug('No changes since last save...')
      }
    }
  }

  async onOpen(): Promise<void> {
    const { containerEl } = this

    // autosave
    if (this.settings.autosaveConversationHistory) {
      console.debug('Autosaving conversation every 5 seconds...')
      this.autosaveInterval = this.registerInterval(
        window.setInterval(() => {
          this.autosaveConversation()
        }, 10000)
      )
    }

    containerEl.empty()

    const container = containerEl.createDiv(`${PLUGIN_PREFIX}-container`)

    const toolbar = container.createDiv(`${PLUGIN_PREFIX}-toolbar`)

    this.saveButton = new ButtonComponent(toolbar)
    this.saveButton.setButtonText('Save')
    this.saveButton.setTooltip('Save Conversation')
    this.saveButton.setIcon('save')

    const debugButton = new ButtonComponent(toolbar)
    debugButton.setButtonText('Debug')
    debugButton.setTooltip('Debug Conversation')
    debugButton.setIcon('code')

    this.saveButton.onClick(async (): Promise<void> => {
      if (this?.chat?.currentConversation() !== null) {
        await this.saveConversation(this.chat.currentConversation() as Conversation)
      }
    })

    debugButton.onClick(async (): Promise<void> => {
      if (this?.chat?.currentConversation() !== null) {
        console.log(this.chat.currentConversation())
      }
    })

    const rootElement = container.createDiv(`${PLUGIN_PREFIX}-content`)

    const root = createRoot(rootElement)

    root.render(
      <AppContext.Provider value={this.app}>
        <SidebarView chat={this.chat} settings={this.settings} />
      </AppContext.Provider>
    )
  }

  async onClose(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1])
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: GPTHelper

  constructor(app: App, plugin: GPTHelper) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h2', { text: `${PLUGIN_NAME} Settings` })

    const settingsDescContainer = containerEl.createEl('div')

    settingsDescContainer.createEl('p', {
      text: `${PLUGIN_NAME} is a plugin that facilitates Researchers studying how ChatGPT and other conversational AIs respond to various prompts.`,
    })

    const helpText = settingsDescContainer.createEl('p', {
      text: 'You can get your API Key here: ',
    })

    helpText.createEl('a', {
      text: 'https://platform.openai.com/account/api-keys',
      href: 'https://platform.openai.com/account/api-keys',
    })

    new Setting(containerEl)
      .setName('DEBUG MODE')
      .setDesc(
        `(coming soon) Display extra debugging info like, a breakdown of tokens and tokens used.`
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.debugMode)
        toggle.onChange(async (value) => {
          this.plugin.settings.debugMode = value
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc(
        'Your API Key will only be shown when you update it. Once you navigate away from this screen it will be stored, but not dispayed.'
      )
      .addText((text) =>
        text
          .setPlaceholder(`${this.plugin.settings.apiKeySaved ? 'Update' : 'Set'} your API key`)
          .onChange(async (value) => {
            this.plugin.settings.openApiKey = value
            this.plugin.settings.apiKeySaved = true
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Autosave Conversations')
      .setDesc(
        `Automatically save conversations to your Vault. You will need to close any open the Chat windows for this change to take effect.`
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autosaveConversationHistory)

        toggle.onChange(async (value) => {
          this.plugin.settings.autosaveConversationHistory = value

          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('Conversation Directory')
      .setDesc('Where to save conversations.')
      .addText((text) =>
        text.setValue(this.plugin.settings.conversationHistoryDirectory).onChange(async (value) => {
          this.plugin.settings.conversationHistoryDirectory = value
          await this.plugin.saveSettings()
        })
      )
  }
}
