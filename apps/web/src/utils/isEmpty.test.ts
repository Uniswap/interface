import { isEmptyObject } from './isEmpty'

describe('isEmptyObject', () => {
  it.each([
    [{}, true],
    [{ a: 1 }, false],
  ])('should return true for empty objects', (obj, expectedResult) => {
    expect(isEmptyObject(obj)).toBe(expectedResult)
  })
})
