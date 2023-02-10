import { ButtonComponent, ItemView, type WorkspaceLeaf, Notice } from 'obsidian'

import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'

import { AppContext } from '../contexts/AppContext'
import SidebarView from '../components/SidebarView'

import type Chat from '../services/chat'
import type { Conversation } from '../services/conversation'

import CHATGPT from '../prompts/chatgpt'

import { DEFAULT_CONVERSATION_TITLE, PLUGIN_NAME, PLUGIN_PREFIX } from '../constants'

import type ObsidianAIResearchAssistant from '../main'
import type { PluginSettings } from '../types'

export default class ChatView extends ItemView {
  plugin: ObsidianAIResearchAssistant
  settings: PluginSettings
  chat: Chat
  saveConversation: (conversation: Conversation) => Promise<void>
  saveButton: ButtonComponent | null
  debugButton: ButtonComponent | null
  newConversationButton: ButtonComponent | null
  autosaveInterval: number | null
  lastSavedMessageId: string | null
  root: Root | null

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianAIResearchAssistant) {
    super(leaf)

    this.plugin = plugin
    this.settings = plugin.settings
    this.saveConversation = plugin.saveConversation.bind(plugin)
    this.chat = plugin.chat
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
    this.plugin.logger.debug('Checking Autosave requirements...')

    const conversation = this.chat?.currentConversation()

    if (
      typeof conversation !== 'undefined' &&
      conversation !== null &&
      conversation.messages.length > 1 &&
      conversation.title !== DEFAULT_CONVERSATION_TITLE
    ) {
      const finalMessaggeId = conversation?.messages?.last()?.id

      if (finalMessaggeId !== this.lastSavedMessageId) {
        // eslint-disable-next-line no-new
        new Notice('Autosaving conversation...', 1000)

        this.plugin.logger.debug(`Autosaving conversation ${conversation.id}...`)

        this.plugin.autoSaving = true
        this.saveButton?.setIcon('loader-2')
        this.saveButton?.setDisabled(true)

        this.saveConversation(conversation)
          .then(() => {
            const lastMessageId = conversation?.messages?.last()?.id

            if (typeof lastMessageId !== 'undefined') {
              this.lastSavedMessageId = lastMessageId
            }

            this.plugin.logger.debug('Conversation saved.')
          })
          .catch((error) => {
            if (this.settings.debugMode) {
              // eslint-disable-next-line no-new
              new Notice(`Error saving conversation: ${error.message as string}`)
            }

            this.plugin.logger.error(error)
          })
          .finally(() => {
            this.plugin.autoSaving = false
            this.saveButton?.setIcon('save')
          })
      } else {
        this.plugin.logger.debug('No changes since last save...')
      }
    }
  }

  async onChatUpdate(): Promise<void> {
    const currentConversation = this.chat?.currentConversation()

    if (
      typeof currentConversation?.messages !== 'undefined' &&
      currentConversation.messages.length > 0 &&
      this.chat.currentConversation() !== null
    ) {
      if (this.saveButton?.disabled === true) {
        this.saveButton?.setDisabled(false)
      }

      if (this.debugButton?.disabled === true) {
        this.debugButton?.setDisabled(false)
      }

      if (this.newConversationButton?.disabled === true) {
        this.newConversationButton?.setDisabled(false)
      }
    }
  }

  async renderView(): Promise<void> {
    const onChatUpdate = this.onChatUpdate.bind(this)

    this?.root?.render(
      <AppContext.Provider value={{ app: this.app, plugin: this.plugin }}>
        <SidebarView onChatUpdate={onChatUpdate} />
      </AppContext.Provider>
    )
  }

  async onOpen(): Promise<void> {
    const { containerEl } = this

    // autosave
    if (this.settings.autosaveConversationHistory) {
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

    this.newConversationButton = new ButtonComponent(toolbar)
    this.newConversationButton.setButtonText('New')
    this.newConversationButton.setTooltip('New Conversation')
    this.newConversationButton.setIcon('list-plus')

    this.debugButton = new ButtonComponent(toolbar)
    this.debugButton.setButtonText('Debug')
    this.debugButton.setTooltip('Log Conversation to this.plugin.logger')
    this.debugButton.setIcon('curly-braces')

    if (
      typeof this.chat === 'undefined' ||
      this.chat?.currentConversation()?.messages.length === 0 ||
      this.chat?.currentConversation() === null
    ) {
      this.saveButton.setDisabled(true)
      this.debugButton.setDisabled(true)
      this.newConversationButton.setDisabled(true)
    }

    this.saveButton.onClick(async (): Promise<void> => {
      if (this?.chat?.currentConversation() !== null) {
        await this.saveConversation(this.chat.currentConversation() as Conversation)
      }
    })

    this.debugButton.onClick(async (): Promise<void> => {
      if (this?.chat?.currentConversation() !== null) {
        this.plugin.logger.logBypassSettings(this.chat.currentConversation())
      }
    })

    this.newConversationButton.onClick(async (): Promise<void> => {
      if (this?.chat?.currentConversation() !== null) {
        this.chat?.start({
          prompt: CHATGPT(),
          title: DEFAULT_CONVERSATION_TITLE,
          settings: this.settings,
        })

        this.saveButton?.setDisabled(true)
        this.newConversationButton?.setDisabled(true)
        this.debugButton?.setDisabled(true)

        await this.renderView()
      }
    })

    const rootElement = container.createDiv(`${PLUGIN_PREFIX}-content`)

    this.root = createRoot(rootElement)

    await this.renderView()
  }

  async onClose(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1])
  }
}
