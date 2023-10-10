import type OpenAI from 'openai'

import convertUnixTimestampToISODate from '../utils/getISODate'
import tokenCounter from '../utils/tokenCounter'
import formatInput from '../utils/formatInput'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'

import type { OpenAICompletion } from '../services/openai/types'
import type { Conversation } from '../services/conversation'
import type { ConversationMessage, UserPrompt } from '../types'

export interface SummaryTemplate {
  title: string
  conversation: Array<Record<string, any>>
  prompt: string
  timestamp: Date
}

export const summaryTemplate = (conversation: Conversation): string =>
  `
---
conversationId: ${conversation.id}
model: ${conversation.model.model}
timestamp: ${conversation.timestamp}
datetime: ${convertUnixTimestampToISODate(conversation.timestamp)}
adapter: ${conversation.model.adapter.name}
${
  typeof conversation.model.adapter?.engine !== 'undefined'
    ? `engine: ${conversation.model.adapter?.engine}`
    : ''
}
${
  typeof conversation.model.adapter?.endpoint !== 'undefined'
    ? `endpoint: ${conversation.model.adapter?.endpoint}`
    : ''
}
---

${
  typeof conversation?.model !== 'undefined'
    ? `**Model**: \`${conversation.model.model}\``
    : ''
}

${
  typeof conversation?.preamble !== 'undefined' &&
  conversation.preamble !== '' &&
  conversation.preamble !== null
    ? `## Preamble

The initial preamble used for this conversation was:

\`\`\`
${conversation.preamble}
\`\`\``
    : ''
}

## Summary

A summary of the conversation as seen by the user is:

${conversation.messages
  .map((item) => {
    const speaker =
      item.message.object === USER_MESSAGE_OBJECT_TYPE
        ? conversation.settings.userHandle
        : conversation.settings.botHandle

    const message =
      item.message.object === USER_MESSAGE_OBJECT_TYPE
        ? (item.message as UserPrompt).prompt
        : item.message.object === USER_MESSAGE_OBJECT_TYPE
        ? (item.message as OpenAICompletion).choices[0].text
        : (item.message as OpenAI.Chat.ChatCompletion).choices[0].message
            ?.content ?? ''

    return `> **${speaker}** ${formatInput(message).replace(/\n/g, '\n> ')}\n${
      item.memoryState !== 'default'
        ? `    _(${item.memoryState[0].toUpperCase()}${item.memoryState.slice(
            1
          )} Memory)_`
        : ''
    }`
  })
  .join('\n')}

## Raw Data

The raw data for this conversation is:

${conversation.messages
  .map((item: ConversationMessage) => {
    if (item.message.object === USER_MESSAGE_OBJECT_TYPE) {
      if (conversation.model.adapter.engine === 'chat') {
        return item
      } else {
        const fullText = (item.message as UserPrompt).fullText

        let totalTokens = null

        if (typeof fullText !== 'undefined') {
          totalTokens = tokenCounter(fullText)
        }

        return {
          ...item,
          message: {
            ...item.message,
            tokens: tokenCounter((item.message as UserPrompt).prompt),
            totalTokens
          }
        }
      }
    }

    return item
  })
  .map(
    (item: ConversationMessage) =>
      `\`\`\`json\n${JSON.stringify(item, null, '\t').replace(
        /`/g,
        '\\`'
      )}\n\`\`\``
  )
  .join('\n\n')}
`
