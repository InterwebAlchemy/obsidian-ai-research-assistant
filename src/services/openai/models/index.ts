import TextDavinci003 from './text-davinci-003'
import GPT35Turbo from './gpt-3.5-turbo'

const models = {
  'gpt-3.5-turbo': GPT35Turbo,
  // TODO: enable the code davinci model and connect it with the openai code adapter
  // 'code-davinci-002': CodeDavinci002,
  'text-davinci-003': TextDavinci003
}

export default models
