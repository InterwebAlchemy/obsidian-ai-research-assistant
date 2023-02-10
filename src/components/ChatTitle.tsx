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

  const onClickEdit = (): void => {
    setUpdatedTitle(title)

    setEditing(true)
  }

  const onClickSave = (): void => {
    console.log(updatedTitle)
    if (typeof updatedTitle === 'string' && updatedTitle !== '') {
      plugin
        .checkForExistingFile(updatedTitle)
        .then((isTitleAlreadyUsed) => {
          if (!isTitleAlreadyUsed) {
            setTitle(updatedTitle)

            chat?.currentConversation()?.updateTitle(updatedTitle)

            setEditing(false)
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
    <div className="ai-research-assistant__conversation__header">
      {!editing ? (
        <div className="ai-research-assistant__conversation__header__title">{title}</div>
      ) : (
        <input type="text" defaultValue={title} onChange={onChange} />
      )}
      <div className="ai-research-assistant__conversation__header__edit">
        <IconButton
          iconName={editing ? 'save' : 'pencil'}
          a11yText={`${editing ? 'Save' : 'Edit'} Conversation Title`}
          onClick={editing ? onClickSave : onClickEdit}
          buttonVariant="iconOnly"
          buttonStyle="primary"
        />
      </div>
    </div>
  )
}

export default ChatTitle
