import { namehash } from '@ethersproject/hash'

import { safeNamehash } from './safeNamehash'

describe.only('#safeNamehash', () => {
  it('#namehash fails', () => {
    expect(() => namehash('🤔')).toThrow('STRINGPREP_CONTAINS_UNASSIGNED')
  })

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  it('works', () => {
    expect(safeNamehash('🤔')).toEqual(undefined)
  })
})
