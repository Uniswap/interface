import { arraysAreEqual, bubbleToTop, differenceWith, next, unique } from 'utilities/src/primitives/array'

describe('unique', () => {
  it('should return unique elements from an array using the default uniqueness check', () => {
    const array = [1, 2, 2, 3, 4, 4, 5]
    const result = unique(array)
    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('should use the custom uniqueness function when provided', () => {
    const array = [1, 2, 3, 4, 5]
    const isUnique = (value: number): boolean => value > 3 // keep only numbers greater than 3
    const result = unique(array, isUnique)
    expect(result).toEqual([4, 5])
  })
})

it('returns undefined for empty arrays', () => {
  expect(next([], '123')).toBe(undefined)
})

it('returns the next element', () => {
  expect(next([1, 2, 3], 1)).toEqual(2)
})

it('handles wrapping around', () => {
  expect(next([1, 2, 3], 3)).toEqual(1)
})

it('returns undefined whenelement not found', () => {
  expect(next([1, 2, 3], 4)).toBe(undefined)
})

it('calculates difference correctly', () => {
  const result = differenceWith([1, 2], [2, 4], (a, b) => a === b)
  expect(result.length).toEqual(1)
  expect(result[0]).toBe(1)

  const emptyResult = differenceWith([1, 2], [1, 2], (a, b) => a === b)
  expect(emptyResult.length).toEqual(0)

  const sameResult = differenceWith([1, 2], [3, 4], (a, b) => a === b)
  expect(sameResult.length).toEqual(2)
  expect(sameResult[0]).toBe(1)
  expect(sameResult[1]).toBe(2)
})

describe('bubbleToTop', () => {
  test('should swap the first element with the one that matches the predicate', () => {
    const inputArray = [1, 2, 3, 4, 5]
    const predicate = (element: number): boolean => element === 3
    const result = bubbleToTop(inputArray, predicate)
    expect(result).toEqual([3, 1, 2, 4, 5])
  })

  test('should not swap any elements if the predicate is not met', () => {
    const inputArray = [1, 2, 3, 4, 5]
    const predicate = (element: number): boolean => element === 10
    const result = bubbleToTop(inputArray, predicate)
    expect(result).toEqual(inputArray) // The array should remain unchanged
  })
})

describe('arraysAreEqual', () => {
  it('should return false for mismatched length', () => {
    expect(arraysAreEqual([1, 1], [1, 1, 1])).toBe(false)
  })
  it('should return false for mismatched contents', () => {
    expect(arraysAreEqual([1, 1], [1, 2])).toBe(false)
  })
  it('should return true for equal arrays', () => {
    expect(arraysAreEqual([1, 1], [1, 1])).toBe(true)
  })
})
