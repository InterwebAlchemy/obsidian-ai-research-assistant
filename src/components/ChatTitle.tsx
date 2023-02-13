import React, { useEffect, useState } from 'react'
import { Notice } from 'obsidian'

import IconButton from './IconButton'

import { useApp } from '../hooks/useApp'

import { DEFAULT_CONVERSATION_TITLE } from '../constants'

export interface ChatTitleProps {
  loading?: boolean
}

const ChatTitle = ({ loading = false }: ChatTitleProps): React.ReactElement => {
  const { plugin } = useApp()

  const { chat, logger, settings } = plugin

  const [title, setTitle] = useState(DEFAULT_CONVERSATION_TITLE)
  const [updatedTitle, setUpdatedTitle] = useState('')

  const [editing, setEditing] = useState(false)

  const onEdit = (event: React.FormEvent): void => {
    event.preventDefault()

    setUpdatedTitle(title)

    plugin.pauseAutosaving = true

    setEditing(true)
  }

  const onSave = (event: React.FormEvent): void => {
    event.preventDefault()

    if (typeof updatedTitle === 'string' && updatedTitle !== '') {
      plugin
        .checkForExistingFile(updatedTitle)
        .then((isTitleAlreadyUsed) => {
          if (!isTitleAlreadyUsed) {
            setTitle(updatedTitle)

            chat?.currentConversation()?.updateTitle(updatedTitle)

            setEditing(false)
            plugin.pauseAutosaving = false
          } else {
            // eslint-disable-next-line no-new
            new Notice(`${updatedTitle} already exists in ${settings.conversationHistoryDirectory}`)
          }
        })
        .catch((error) => {
          logger.error(error)
        })
    }
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setUpdatedTitle(event.currentTarget.value)
  }

  useEffect(() => {
    if (typeof title === 'string' && title !== '') {
      chat?.currentConversation()?.updateTitle(title)
    }
  }, [title])

  return (
    <form
      className="ai-research-assistant__conversation__header"
      onSubmit={editing ? onSave : onEdit}
    >
      {!editing ? (
        <div className="ai-research-assistant__conversation__header__title">{title}</div>
      ) : (
        <input type="text" defaultValue={title} onChange={onChange} />
      )}
      <div className="ai-research-assistant__conversation__header__edit">
        <IconButton
          iconName={editing ? 'save' : 'pencil'}
          a11yText={`${editing ? 'Save' : 'Edit'} Conversation Title`}
          buttonVariant="iconOnly"
          buttonStyle="primary"
          type={'submit'}
        />
      </div>
    </form>
  )
}

export default ChatTitle
