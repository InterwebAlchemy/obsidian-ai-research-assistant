import { DateTime } from 'luxon'

import convertUnixTimestampToISODate from './getISODate'

const relativeDate = (date: string | number): string => {
  const dateTime = DateTime.fromISO(convertUnixTimestampToISODate(Number(date)))

  return dateTime.toRelative() ?? 'some time ago'
}

export default relativeDate
