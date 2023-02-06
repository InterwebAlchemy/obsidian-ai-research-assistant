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
  persona: string
}

const DEFAULT_SETTINGS: GPTHelperSettings = {
  debugMode: false,
  openApiKey: '',
  apiKeySaved: false,
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
}

class SampleView extends ItemView {
  settings: GPTHelperSettings

  constructor(leaf: WorkspaceLeaf, plugin: GPTHelper) {
    super(leaf)
    this.settings = plugin.settings
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
        <SidebarView apiKey={this.settings.openApiKey} debug={this.settings.debugMode} />
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
