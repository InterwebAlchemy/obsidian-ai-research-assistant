import { type App, ItemView, Plugin, PluginSettingTab, Setting, type WorkspaceLeaf } from 'obsidian'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

import { AppContext } from './context'
import SidebarView from './views/SidebarView'

interface GPTHelperSettings {
  debugMode: boolean
  openApiKey: string
  apiKeySaved: boolean
  keepConversationHistory: boolean
  conversationHistoryDirectory: string
  persona: string
}

const DEFAULT_SETTINGS: GPTHelperSettings = {
  debugMode: false,
  openApiKey: '',
  apiKeySaved: false,
  keepConversationHistory: false,
  conversationHistoryDirectory: 'GPT History',
  persona: 'Wintermute',
}

const VIEW_TYPE_EXAMPLE = 'example-view'

export default class GPTHelper extends Plugin {
  settings: GPTHelperSettings

  async activateView(): Promise<void> {
    const existingView = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)

    if (existingView.length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_EXAMPLE,
        active: true,
      })
    }

    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0])
  }

  async initializeChatInterface(): Promise<void> {
    if (this.settings.openApiKey) {
      this.addRibbonIcon('dice', 'GPT Helper', async (): Promise<void> => {
        await this.activateView()
      })

      this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new SampleView(leaf, this))

      // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
      const statusBarItemEl = this.addStatusBarItem()

      statusBarItemEl.setText(this.settings.persona)
    }
  }

  async onload(): Promise<void> {
    await this.loadSettings()

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this))

    await this.initializeChatInterface()
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE)
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }

  formatConversationHistory(title: string, conversation: Array<Record<string, any>>): string {
    const simpleView = this.formatConversationOutput(conversation)

    const rawView = this.formatRawConversation(conversation)

    return `
    # ${title}

    ## Conversation

    ${simpleView}
    
    ## Raw Conversation

    ${rawView}
    `
  }

  formatConversationOutput(conversation: Array<Record<string, any>>): string {
    return conversation
      .map(
        (item) =>
          `> **${item?.user === true ? 'User' : 'Bot'}**: ${
            item?.user === true ? (item.input as string) : (item.choices[0].text as string)
          }\n`
      )
      .join('\n')
  }

  formatRawConversation(conversation: Array<Record<string, any>>): string {
    return conversation
      .map((item: Record<string, any>) => `\`\`\`json\n${JSON.stringify(item, null, '\t')}\n\`\`\``)
      .join('\n')
  }

  async saveConversation(
    fileName: string,
    conversation: Array<Record<string, any>>
  ): Promise<void> {
    if (this.settings.keepConversationHistory) {
      const filePath = this.settings.conversationHistoryDirectory

      const existingDirectory = this.app.vault.getAbstractFileByPath(filePath)

      if (existingDirectory === null) {
        await this.app.vault.createFolder(filePath)
      }

      let file = `${filePath}/${fileName}.md`

      console.log(file)

      const existingFile = this.app.vault.getAbstractFileByPath(file)

      const fileContent = this.formatConversationHistory(fileName, conversation)

      if (existingFile !== null) {
        file = `${filePath}/${fileName}-${new Date().toISOString()}.md`
      }

      await this.app.vault.create(file, fileContent)
    }
  }
}

class SampleView extends ItemView {
  settings: GPTHelperSettings
  saveConversation: (fileName: string, conversation: Array<Record<string, any>>) => Promise<void>

  constructor(leaf: WorkspaceLeaf, plugin: GPTHelper) {
    super(leaf)
    this.settings = plugin.settings
    this.saveConversation = plugin.saveConversation.bind(plugin)
  }

  getViewType(): string {
    return VIEW_TYPE_EXAMPLE
  }

  getDisplayText(): string {
    return this.settings.persona
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1])

    root.render(
      <AppContext.Provider value={this.app}>
        <SidebarView
          apiKey={this.settings.openApiKey}
          debug={this.settings.debugMode}
          save={this.settings.keepConversationHistory ? this.saveConversation : false}
        />
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

    containerEl.createEl('h2', { text: 'GPT Helper Settings.' })

    const settingsDescContainer = containerEl.createEl('div')

    settingsDescContainer.createEl('p', {
      text: "GPT Helper is a plugin that uses OpenAI's GPT-3 API to generate text.",
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
        `Don't automatically connect to the API. Provide a breakdown of tokens and tokens used.`
      )
      .addToggle((toggle) => {
        toggle.onChange(async (value) => {
          this.plugin.settings.debugMode = value

          toggle.setValue(this.plugin.settings.debugMode)
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
      .setName('Save Conversations')
      .setDesc(
        `Allows you to save conversations to your vault via a Save button in the Conversaton UI.`
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.keepConversationHistory)

        toggle.onChange(async (value) => {
          this.plugin.settings.keepConversationHistory = value
          await this.plugin.saveSettings()
        })
      })

    if (this.plugin.settings.keepConversationHistory) {
      new Setting(containerEl)
        .setName('Conversation Directory')
        .setDesc('Where to save conversations.')
        .addText((text) =>
          text
            .setValue(this.plugin.settings.conversationHistoryDirectory)
            .onChange(async (value) => {
              this.plugin.settings.conversationHistoryDirectory = value
              await this.plugin.saveSettings()
            })
        )
    }

    new Setting(containerEl)
      .setName('Persona')
      .setDesc('The persona to use')
      .addText((text) =>
        text
          .setPlaceholder('Choose a Persona')
          .setValue(this.plugin.settings.persona)
          .onChange(async (value) => {
            console.log('Persona: ' + value)
            this.plugin.settings.persona = value
            await this.plugin.saveSettings()
          })
      )
      .setDisabled(true)
  }
}
