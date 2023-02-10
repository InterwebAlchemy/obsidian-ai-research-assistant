import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import tokenCounter from '../../utils/tokenCounter'
import formatInput from '../../utils/formatInput'

import { OPEN_AI_DEFAULT_MODEL, OPEN_AI_RESPONSE_TOKENS, OPEN_AI_BASE_URL } from './constants'
import { PLUGIN_SETTINGS } from '../../constants'

import CHATGPT from '../../prompts/chatgpt'

import type { OpenAICompletionRequest, OpenAICompletion } from './types'

import type { PluginSettings } from '../../types'

export const openAICompletion = async (
  {
    input,
    temperature = 0.7,
    context = CHATGPT(),
    model = OPEN_AI_DEFAULT_MODEL,
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

  const prompt = formatInput(`${context}\n${userPrefix} ${input}${botPrefix}`)

  const tokens = tokenCounter(prompt)

  const maxTokens = Math.min(
    Math.min(OPEN_AI_RESPONSE_TOKENS + tokens, OPEN_AI_RESPONSE_TOKENS),
    model.maxTokens
  )

  const stopWords = ['<|im_stop|>']

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
    // make these configurable
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
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
