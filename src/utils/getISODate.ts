const convertUnixTimestampToISODate = (timestamp: number): string =>
  new Date(timestamp * 1000).toISOString()

export default convertUnixTimestampToISODate
