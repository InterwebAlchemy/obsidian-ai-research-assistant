import GPT35Turbo from './gpt-3.5-turbo'
import GPT35TurboInstruct from './gpt-3.5-turbo-instruct'
import GPT35Turbo16K from './gpt-3.5-turbo-16k'
import GPT4 from './gpt-4'
import GPT432K from './gpt-4-32k'

const models = {
  'gpt-4': GPT4,
  'gpt-3.5-turbo': GPT35Turbo,
  'gpt-3.5-turbo-instruct': GPT35TurboInstruct,
  'gpt-3.5-turbo-16k': GPT35Turbo16K,
  'gpt-4-32k': GPT432K
}

export default models
