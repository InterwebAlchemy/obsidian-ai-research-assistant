const obfuscateApiKey = (apiKey = ''): string =>
  apiKey.length > 0 ? apiKey.replace(/^(.{3})(.*)(.{4})$/, '$1****$3') : ''

export default obfuscateApiKey
