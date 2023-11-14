/**
 * Divides an array into slices of a given size
 * @param items
 * @param size
 * @returns
 */
export function arrayToSlices<T>(items: Array<T>, size: number): T[][] {
  if (items.length % size !== 0) throw new Error('Input array length must be a multiple of desired output size')
  return Array.from({ length: Math.floor(items.length / size) }, (_v, i) => items.slice(i * size, i * size + size))
}
