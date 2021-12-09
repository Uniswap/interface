import { namehash } from '@ethersproject/hash'

import { safeNamehash } from './safeNamehash'

describe('#safeNamehash', () => {
  const emoji = '🤔'

  it('#namehash fails', () => {
    expect(() => namehash(emoji)).toThrow('STRINGPREP_CONTAINS_UNASSIGNED')
  })

  // suppress console.debug for the next test
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  it('works', () => {
    expect(safeNamehash(emoji)).toEqual(undefined)
  })
})
