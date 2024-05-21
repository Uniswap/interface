/**
 * Determines if a tick list is sorted
 * @param list The tick list
 * @param comparator The comparator
 * @returns true if sorted
 */
export function isSorted<T>(list: Array<T>, comparator: (a: T, b: T) => number): boolean {
  for (let i = 0; i < list.length - 1; i++) {
    if (comparator(list[i]!, list[i + 1]!) > 0) {
      return false
    }
  }
  return true
}
