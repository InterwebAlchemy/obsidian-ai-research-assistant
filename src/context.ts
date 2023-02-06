import * as React from 'react'
import type { App } from 'obsidian'

export const AppContext = React.createContext<App>(undefined as any)
