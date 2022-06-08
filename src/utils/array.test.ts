import { next } from 'src/utils/array'

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
