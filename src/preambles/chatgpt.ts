import formatDate from 'src/utils/formatDate'

const ChatGPTPreamble = (date = new Date()): string =>
  `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: 2021-09 Current date: ${formatDate(
    date
  )}`

export default ChatGPTPreamble
