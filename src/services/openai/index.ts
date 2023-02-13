import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import formatInput from '../../utils/formatInput'

import {
  OPEN_AI_DEFAULT_MODEL,
  OPEN_AI_RESPONSE_TOKENS,
  OPEN_AI_BASE_URL,
  OPEN_AI_DEFAULT_TEMPERATURE,
} from './constants'
import { PLUGIN_SETTINGS } from '../../constants'

import type { OpenAICompletionRequest, OpenAICompletion } from './types'

import type { PluginSettings } from '../../types'

export const openAICompletion = async (
  {
    input,
    model = OPEN_AI_DEFAULT_MODEL,
    temperature = OPEN_AI_DEFAULT_TEMPERATURE,
    maxTokens = OPEN_AI_RESPONSE_TOKENS,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0,
    stream = false,
  }: OpenAICompletionRequest,
  settings: PluginSettings = PLUGIN_SETTINGS
): Promise<OpenAICompletion> => {
  const requestUrl = new URL('/v1/completions', OPEN_AI_BASE_URL)

  const { userPrefix, botPrefix, debugMode, openApiKey } = settings

  const requestHeaders = {
    Authorization: `Bearer ${openApiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const prompt = formatInput(input)

  const stopWords: string[] = []

  if (typeof model.stopWord !== 'undefined' && model.stopWord !== '') {
    stopWords.push(model.stopWord)
  }

  if (typeof userPrefix !== 'undefined' && userPrefix !== '') {
    stopWords.push(userPrefix)
  }

  if (typeof botPrefix !== 'undefined' && botPrefix !== '') {
    stopWords.push(botPrefix)
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
    presence_penalty: presencePenalty,
  }

  const request: RequestUrlParam = {
    url: requestUrl.toString(),
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(requestBody),
    throw: false,
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
