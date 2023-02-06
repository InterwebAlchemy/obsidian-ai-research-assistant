// borrowed from: https://stackoverflow.com/a/66778066/656011
const formatDate = (date = new Date()): string => {
  let offset = new Date(date).getTimezoneOffset()

  offset =
    offset < 0
      ? offset * -1 // east from Greenwich Mean Time
      : offset // west from Greenwich Mean Time

  return new Date(new Date(date).getTime() + offset * 60 * 1000).toISOString().split('T')[0]
}

export default formatDate
