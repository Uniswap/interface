export function uniqBy<T>(arr: T[], key: keyof T) {
  const seen = new Set()

  return arr.filter((it) => {
    const val = it[key]
    if (seen.has(val)) {
      return false
    } else {
      seen.add(val)
      return true
    }
  })
}
