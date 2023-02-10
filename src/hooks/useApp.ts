import { useContext } from 'react'
import { AppContext, type AppContextInterface } from '../contexts/AppContext'

export const useApp = (): AppContextInterface => {
  return useContext(AppContext)
}
