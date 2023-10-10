import type OpenAI from 'openai'
import { OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE } from '../constants'
import {
  SYSTEM_MESSAGE_OBJECT_TYPE,
  USER_MESSAGE_OBJECT_TYPE
} from '../../../constants'

import type { Conversation } from '../../conversation'
import type { UserPrompt, SystemMessage } from '../../../types'

const formatChat = (
  conversation: Conversation
): OpenAI.Chat.ChatCompletionMessage[] => {
  const messages = conversation.getConversationMessages()

  return messages.map((message) => {
    switch (message.message.object) {
      case USER_MESSAGE_OBJECT_TYPE:
        return {
          role: 'user',
          content: (message.message as UserPrompt).prompt
        }

      case OPEN_AI_CHAT_COMPLETION_OBJECT_TYPE:
        return (
          (message.message as OpenAI.Chat.ChatCompletion)?.choices?.[0]
            ?.message ?? {
            role: 'assistant',
            content: ''
          }
        )

      case SYSTEM_MESSAGE_OBJECT_TYPE:
      default:
        return {
          role: 'system',
          content: (message.message as SystemMessage).output
        }
    }
  })
}

export default formatChat
