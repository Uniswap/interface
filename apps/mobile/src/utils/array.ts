function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index
}

export function unique<T>(
  array: T[],
  isUnique: (value: T, index: number, self: T[]) => boolean = onlyUnique
): T[] {
  return array.filter(isUnique)
}

export function next<T>(array: T[], current: T): T | undefined {
  const i = array.findIndex((v) => v === current)
  if (i < 0) return undefined
  return array[(i + 1) % array.length]
}

// get items in `array` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
export function differenceWith<T>(
  array: T[],
  without: T[],
  comparator: (item1: T, item2: T) => boolean
): T[] {
  return array.filter((item: T) => {
    const inWithout = Boolean(without.find((otherItem: T) => comparator(item, otherItem)))
    return !inWithout
  })
}
