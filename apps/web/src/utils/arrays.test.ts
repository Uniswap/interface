import { arrayToSlices } from 'utils/arrays'

describe('#arrayToSlices', () => {
  it('returns properly sized slices', () => {
    expect(arrayToSlices([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ])
    expect(() => arrayToSlices([1, 2, 3, 4, 5, 6], 4)).toThrow()
  })
})
