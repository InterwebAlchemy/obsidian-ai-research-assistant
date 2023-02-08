import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import GPT3Tokenizer from 'gpt3-tokenizer'

import { OPEN_AI_MAX_TOKENS, OPEN_AI_MODEL, OPEN_AI_RESPONSE_TOKENS } from '../constants'

import CHATGPT from '../prompts/chatgpt'

import type { OpenAICompletionRequest, OpenAICompletion } from '../types'

const BASE_URL = 'https://api.openai.com'

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' }) // or 'codex'

export const openAICompletion = async ({
  apiKey,
  input,
  temperature = 0.7,
  context = CHATGPT(),
  model = OPEN_AI_MODEL,
  stream = false,
}: OpenAICompletionRequest): Promise<OpenAICompletion> => {
  const requestUrl = new URL('/v1/completions', BASE_URL)

  const requestHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const prompt = `${context.trim()}\n${input.trim()}}`

  const tokens = tokenizer.encode(prompt)

  const maxTokens = Math.min(
    Math.min(OPEN_AI_RESPONSE_TOKENS + tokens.text.length, OPEN_AI_RESPONSE_TOKENS),
    OPEN_AI_MAX_TOKENS
  )

  const requestBody = {
    prompt,
    model,
    stream,
    temperature,
    max_tokens: maxTokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['<|im_end|>'],
  }

  const request: RequestUrlParam = {
    url: requestUrl.toString(),
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(requestBody),
    throw: false,
  }

  // DEBUG: remove in production
  console.debug('REQUEST:', request)

  try {
    const response = await obsidianRequest(request)

    // DEBUG: remove in production
    console.debug('RESPONSE:', response)

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
