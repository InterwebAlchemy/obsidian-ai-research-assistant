import { PLUGIN_NAME } from '../constants'

import type { PluginSettings } from '../types'

export interface LoggerInterface {
  settings: PluginSettings
}

class Logger {
  settings: PluginSettings

  constructor({ settings }: LoggerInterface) {
    this.settings = settings
  }

  logBypassSettings(...data: any[]): void {
    console.log(`${PLUGIN_NAME}:`, ...data)
  }

  log(...data: any[]): void {
    if (this.settings.debugMode) {
      console.log(`${PLUGIN_NAME}:`, ...data)
    }
  }

  debug(...data: any[]): void {
    if (this.settings.debugMode) {
      console.debug(`${PLUGIN_NAME}:`, ...data)
    }
  }

  error(...data: any[]): void {
    console.error(`${PLUGIN_NAME}:`, ...data)

    if (this.settings.debugMode) {
      throw new Error(`${PLUGIN_NAME}: ${JSON.stringify(data)}`)
    }
  }

  info(...data: any[]): void {
    if (this.settings.debugMode) {
      console.info(`${PLUGIN_NAME}:`, ...data)
    }
  }

  warn(...data: any[]): void {
    if (this.settings.debugMode) {
      console.warn(`${PLUGIN_NAME}:`, ...data)
    }
  }
}

export default Logger
