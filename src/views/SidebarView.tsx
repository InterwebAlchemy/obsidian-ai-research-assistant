import React, { useState, useEffect } from 'react'

import { openAI } from '../services/openai'

import ChatInput from './ChatInput'

export interface SidebarViewProps {
  apiKey: string
  debug?: boolean
  save: boolean | ((fileName: string, conversation: Array<Record<string, any>>) => Promise<void>)
}

// create a chat interface that sends user input to the openai api via the openai package
// and displays the response from openai
const SidebarView = ({
  apiKey,
  save = false,
  debug = false,
}: SidebarViewProps): React.ReactElement => {
  const [input, setInput] = useState('')
  const [submittedInput, setSubmittedInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<Array<Record<string, any>>>([])
  const [title, setTitle] = useState('New Chat')

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    setLoading(true)

    setSubmittedInput(input)
  }

  const handleSave = async (): Promise<void> => {
    try {
      if (typeof save === 'function') {
        await save(title, conversation)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const fetchResponse = async (): Promise<void> => {
      try {
        const response = await openAI({ apiKey, input: submittedInput })

        if (title === 'New Chat') {
          setTitle(`Chat ${new Date().toISOString().replace(/:/g, '_')}`)
        }

        setConversation((conversation) => [...conversation, response])
      } catch (error) {
        setConversation((conversation) => [...conversation, { error: error.message }])
      } finally {
        setLoading(false)

        setSubmittedInput('')
        setInput('')
      }
    }

    if (submittedInput) {
      setConversation((conversation) => [
        ...conversation,
        { input: submittedInput, timestamp: new Date(), user: true },
      ])

      fetchResponse().catch((error) => {
        console.error(error)

        setConversation((conversation) => [...conversation, { error: error.message }])
      })
    }
  }, [submittedInput])

  return (
    <div className="gpt-helper__container">
      <div className="gpt-helper__conversation">
        <div className="gpt-helper__conversation__header">
          <div className="gpt-helper__conversation__header__title">{title}</div>
        </div>
        {conversation.map((item, index) => {
          if (typeof item.error !== 'undefined') {
            return (
              <div
                key={index}
                className="gpt-helper__conversation__item gpt-helper__conversation__item--error"
              >
                {item.error}
              </div>
            )
          }
          if (typeof item.input !== 'undefined') {
            return (
              <div
                key={index}
                className="gpt-helper__conversation__item gpt-helper__conversation__item--user"
              >
                <div key={index} className="gpt-helper__conversation__item__text">
                  {item.input}
                </div>
                <div className="gpt-helper__conversation__item__footer">
                  <div className="gpt-helper__conversation__item__speaker">You</div>
                  <div className="gpt-helper__conversation__item__timestamp">
                    {item.timestamp.toISOString()}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div
              key={index}
              className="gpt-helper__conversation__item gpt-helper__conversation__item--helper"
            >
              <div key={index} className="gpt-helper__conversation__item__text">
                {item.choices[0].text}
              </div>
              <div className="gpt-helper__conversation__item__footer">
                <div className="gpt-helper__conversation__item__speaker">Bot</div>
                <div className="gpt-helper__conversation__item__timestamp">
                  {new Date(item.created * 1000).toISOString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <form
        className="gpt-helper__chat-form"
        onSubmit={handleSubmit}
        autoCapitalize="off"
        noValidate
      >
        <ChatInput
          input={input}
          onChange={setInput}
          busy={loading}
          saveChat={handleSave}
          allowSave={typeof save === 'function'}
        />
      </form>
    </div>
  )
}

export default SidebarView
