import { requestUrl as obsidianRequest, type RequestUrlParam } from 'obsidian'

import GPT3Tokenizer from 'gpt3-tokenizer'

import { OPEN_AI_MODEL, OPEN_AI_MAX_TOKENS } from '../constants'

import CHATGPT from '../prompts/chatgpt'

const BASE_URL = 'https://api.openai.com'

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' }) // or 'codex'

export interface OpenAIRequest {
  apiKey: string
  input: string
  persona?: string
  initialize?: boolean
}

export const openAI = async ({ apiKey, input }: OpenAIRequest): Promise<Record<string, any>> => {
  const requestUrl = new URL('/v1/completions', BASE_URL)

  const requestHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const persona = CHATGPT()

  // add previous conversational context summary to input

  const prompt = `${persona.trim()}\n${input}}`.trim()

  // const prompt = `${input}}`.trim()

  const tokens = tokenizer.encode(prompt)

  const requestBody = {
    prompt,
    model: OPEN_AI_MODEL,
    max_tokens: Math.min(OPEN_AI_MAX_TOKENS - tokens.text.length, 300),
    temperature: 0.7,
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

  console.log('REQUEST:', request)

  try {
    const response = await obsidianRequest(request)

    console.log('RESPONSE:', response)

    if (response.status < 400) {
      return response.json
    } else {
      console.error(response)

      return {
        error: 'Error contacting OpenAI API...',
      }
    }
  } catch (error) {
    console.error(error)

    return {
      error: 'Error contacting OpenAI API...',
    }
  }
}
