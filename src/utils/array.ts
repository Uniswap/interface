function onlyUnique<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export function unique(array: any[], isUnique: typeof onlyUnique = onlyUnique) {
  return array.filter(isUnique)
}

export function next<T>(array: T[], current: T) {
  const i = array.findIndex((v) => v === current)
  if (i < 0) return undefined
  return array[(i + 1) % array.length]
}
