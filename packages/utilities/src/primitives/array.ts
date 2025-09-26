// eslint-disable-next-line max-params
function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index
}

export function unique<T>(array: T[], isUnique: (value: T, index: number, self: T[]) => boolean = onlyUnique): T[] {
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
// eslint-disable-next-line max-params
export function differenceWith<T>(array: T[], without: T[], comparator: (item1: T, item2: T) => boolean): T[] {
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

/**
 * Utility type to represent a non-empty array (an array with at least one element; destructuring the first element yields a value typed as NonNullable).
 * Use `getNonEmptyArrayOrThrow` to construct a NonEmptyArray from a primitive array.
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Checks if an array is non-empty.
 * @param array - The array to check.
 * @returns True if the array is non-empty, false otherwise, as a type guard.
 */
export function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
  return array.length !== 0
}

/**
 * Returns a non-empty array or throws an error if the array is empty.
 * @param array - The array to check.
 * @returns A non-empty array.
 * @throws An error if the array is empty.
 */
export function getNonEmptyArrayOrThrow<T>(array: T[]): NonEmptyArray<T> {
  if (!isNonEmptyArray(array)) {
    throw new Error('Array is empty')
  }
  return array
}

/**
 * Pipe a value through a series of functions.
 * @param value - The value to pipe through the functions.
 * @param fns - The functions to pipe the value through.
 * @returns The value after all functions have been applied.
 */
export function pipe<T>(value: T, fns: Array<(arg: T) => T>): T {
  return fns.reduce((acc, fn) => fn(acc), value)
}
