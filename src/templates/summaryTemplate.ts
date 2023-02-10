import type { Conversation } from '../services/conversation'

import { USER_MESSAGE_OBJECT_TYPE } from '../constants'

import type { OpenAICompletion } from '../services/openai/types'

import type { UserPrompt } from '../types'
import converstUnixTimestampToISODate from 'src/utils/getISODate'

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
model: ${conversation.model}
adapter: ${conversation.adapter}
timestamp: ${conversation.timestamp}
datetime: ${converstUnixTimestampToISODate(conversation.timestamp)}
---

## Prompt

${typeof conversation?.model !== 'undefined' ? `**Model**: \`${conversation.model}\`` : ''}

The initial prompt used for this conversation was:

\`\`\`
${conversation.prompt}
\`\`\`

## Summary

A summary of the conversation as seen by the user is:

${conversation.messages
  .map((item) => {
    const speaker =
      item.object === USER_MESSAGE_OBJECT_TYPE
        ? conversation.settings.userPrefix
        : conversation.settings.botPrefix

    const message =
      item.object === USER_MESSAGE_OBJECT_TYPE
        ? (item as UserPrompt).prompt
        : (item as OpenAICompletion).choices[0].text

    return `> **${speaker}** ${message.replace(/\n/g, '\n> ')}\n`
  })
  .join('\n')}

## Raw Data

The raw data for this conversation is:

${conversation.messages
  .map(
    (item: Record<string, any>) =>
      `\`\`\`json\n${JSON.stringify(item, null, '\t').replace(/`/g, '\\`')}\n\`\`\``
  )
  .join('\n\n')}
`
