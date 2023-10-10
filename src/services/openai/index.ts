import OpenAI from 'openai'
import type { Stream } from 'openai/streaming'

import formatChat from './utils/formatChat'

import {
  OPEN_AI_DEFAULT_MODEL,
  OPEN_AI_RESPONSE_TOKENS,
  OPEN_AI_DEFAULT_TEMPERATURE
} from './constants'

import { PLUGIN_SETTINGS } from '../../constants'

import type { OpenAICompletionRequest } from './types'
import type { Conversation } from '../conversation'
import type { PluginSettings } from '../../types'
import type Logger from '../logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Electron = require('electron')

const {
  remote: { safeStorage }
} = Electron

export const openAICompletion = async (
  {
    input,
    model = OPEN_AI_DEFAULT_MODEL,
    temperature = OPEN_AI_DEFAULT_TEMPERATURE,
    maxTokens = OPEN_AI_RESPONSE_TOKENS,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0
  }: OpenAICompletionRequest,
  { signal }: { signal?: AbortSignal },
  settings: PluginSettings = PLUGIN_SETTINGS,
  logger: Logger
): Promise<Stream<OpenAI.Chat.ChatCompletionChunk>> => {
  let { openAiApiKey: apiKey } = settings

  if (safeStorage.isEncryptionAvailable() === true) {
    apiKey = await safeStorage.decryptString(Buffer.from(apiKey))
  }

  try {
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })

    const messages = formatChat(input as Conversation)

    const stream = await openai.chat.completions.create(
      {
        model: model.model,
        messages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty
      },
      {
        signal
      }
    )

    return stream
  } catch (error) {
    if (typeof error?.response !== 'undefined') {
      logger.error(error.response.status, error.response.data)
    } else {
      logger.error(error.message)
    }

    throw error
  }
}
