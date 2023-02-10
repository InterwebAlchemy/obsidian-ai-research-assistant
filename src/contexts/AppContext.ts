import * as React from 'react'
import type { App } from 'obsidian'

import type ObsidianAIResearchAssistant from 'src/main'

export interface AppContextInterface {
  app: App
  plugin: ObsidianAIResearchAssistant
}

export const AppContext = React.createContext<AppContextInterface>(undefined as any)
