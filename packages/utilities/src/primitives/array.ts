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
  if (i < 0) {
    return undefined
  }
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

export function arraysAreEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

export function bubbleToTop<T>(arr: T[], predicate: (element: T) => boolean): T[] {
  if (!arr.length) {
    return arr
  }

  const result = [...arr]

  const index = result.findIndex(predicate)
  if (index > 0) {
    const element = result[index]
    if (element) {
      result.splice(index, 1)
      result.unshift(element)
    }
  }
  return result
}
