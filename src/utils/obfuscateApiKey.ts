const obfuscateApiKey = (apiKey: string): string => apiKey.replace(/^(.{3})(.*)(.{4})$/, '$1****$3')

export default obfuscateApiKey
