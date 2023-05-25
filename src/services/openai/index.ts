import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import {
  Configuration,
  OpenAIApi,
  type CreateChatCompletionResponse
} from 'openai'

import formatChat from './utils/formatChat'

import formatInput from '../../utils/formatInput'

import {
  OPEN_AI_DEFAULT_MODEL,
  OPEN_AI_RESPONSE_TOKENS,
  OPEN_AI_BASE_URL,
  OPEN_AI_DEFAULT_TEMPERATURE
} from './constants'

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
    presencePenalty = 0,
    stream = false
  }: OpenAICompletionRequest,
  settings: PluginSettings = PLUGIN_SETTINGS,
  logger: Logger
): Promise<OpenAICompletion | CreateChatCompletionResponse> => {
  const { userHandle, botHandle, debugMode, openApiKey } = settings

  let apiKey = openApiKey

  if (safeStorage.isEncryptionAvailable() === true) {
    console.log(apiKey)
    console.log(Buffer.from(apiKey))
    apiKey = safeStorage.decryptString(
      Buffer.from(apiKey),
      'OpenAI API Key',
      'Obsidian AI Research Assistant'
    )
    console.log(apiKey)
  }

  // using the openai JavaScript library since the release of the new ChatGPT model
  if (model.adapter?.engine === 'chat') {
    try {
      const config = new Configuration({
        apiKey
      })

      const openai = new OpenAIApi(config)

      const messages = formatChat(input as Conversation)

      console.log(messages)

      logger.log('messages', messages)

      const completion = await openai.createChatCompletion({
        model: model.model,
        messages
      })

      console.log(completion)

      return completion.data
    } catch (error) {
      if (typeof error?.response !== 'undefined') {
        console.log(error.response.status)
        console.log(error.response.data)
      } else {
        console.log(error.message)
      }

      throw error
    }
  } else {
    const requestUrl = new URL('/v1/completions', OPEN_AI_BASE_URL)

    const requestHeaders = {
      Authorization: `Bearer ${openApiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }

    const prompt = formatInput(input as string)

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
      prompt,
      model: model.model,
      stream,
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

    if (debugMode) {
      console.debug('REQUEST:', request)
    }

    try {
      const response = await obsidianRequest(request)

      if (debugMode) {
        console.debug('RESPONSE:', response)
      }

      if (response.status < 400) {
        return response.json
      } else {
        console.error(response)

        throw new Error(response.text)
      }
    } catch (error) {
      console.error(error)

      throw error
    }
  }
}
