import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import OpenAI from 'openai'
import type { Stream } from 'openai/streaming'

import formatChat from './utils/formatChat'

import {
  OPEN_AI_BASE_URL,
  OPEN_AI_DEFAULT_MODEL,
  OPEN_AI_RESPONSE_TOKENS,
  OPEN_AI_DEFAULT_TEMPERATURE
} from './constants'

import {
  OPEN_AI_GPT_START_WORD,
  OPEN_AI_GPT3_STOP_WORD
} from './models/constants'

import { PLUGIN_SETTINGS } from '../../constants'

import type { OpenAICompletionRequest, OpenAICompletion } from './types'
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
  // @ts-expect-error
): Promise<Stream<OpenAICompletion | OpenAI.Chat.ChatCompletionChunk>> => {
  let { openAiApiKey: apiKey, userHandle, botHandle } = settings

  if (safeStorage.isEncryptionAvailable() === true) {
    apiKey = await safeStorage.decryptString(Buffer.from(apiKey))
  }

  if (model.adapter.engine === 'chat') {
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
  } else if (typeof model?.adapter?.endpoint !== 'undefined') {
    // TODO: remove this now that non-chat models are being deprecated
    const requestUrl = new URL(model?.adapter?.endpoint, OPEN_AI_BASE_URL)

    const requestHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    }

    const prompt = formatChat(input as Conversation)

    const stopWords: string[] = []

    if (typeof model.stopWord !== 'undefined' && model.stopWord !== '') {
      stopWords.push(model.stopWord)
    }

    if (typeof userHandle !== 'undefined' && userHandle !== '') {
      stopWords.push(userHandle)
    }

    if (typeof botHandle !== 'undefined' && botHandle !== '') {
      stopWords.push(botHandle)
    }

    const requestBody = {
      prompt: prompt
        .reduce((promptString, message) => {
          return (
            `${promptString}${OPEN_AI_GPT_START_WORD}[${message.role[0].toUpperCase()}${message.role.slice(
              1
            )}]\n` +
            `${message?.content as string}\n${OPEN_AI_GPT3_STOP_WORD}`.trim()
          )
        }, '')
        .trim(),
      model: model.model,
      stream: true,
      temperature,
      max_tokens: maxTokens,
      stop: stopWords,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty
    }

    const request: RequestUrlParam = {
      url: requestUrl.toString(),
      headers: requestHeaders,
      method: 'POST',
      body: JSON.stringify(requestBody),
      throw: false
    }

    try {
      // borrowed from: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
      const stream = await obsidianRequest(request)
        .then(async (response) => {
          // eslint-disable-next-line @typescript-eslint/return-await
          return await response?.json?.()
        })
        .then((response) => {
          const reader = response.body.getReader()
          return new ReadableStream({
            start(controller) {
              return pump()
              // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
              function pump() {
                // @ts-expect-error
                return reader.read().then(({ done, value }) => {
                  // When no more data needs to be consumed, close the stream
                  if (done === true) {
                    controller.close()
                    return
                  }
                  // Enqueue the next data chunk into our target stream
                  controller.enqueue(value)
                  return pump()
                })
              }
            }
          })
        })
        // Create a new response out of the stream
        .then((stream) => new Response(stream))

      // @ts-expect-error
      return stream
    } catch (error) {
      logger.error(error)

      throw error
    }
  }
}
