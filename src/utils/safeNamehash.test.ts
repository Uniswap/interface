import { namehash } from '@ethersproject/hash'
import { safeNamehash } from 'utils/safeNamehash'

describe('safeNamehash', () => {
  const emoji = '🤔'
  const zeroWidthJoiner = '‍'

  it('namehash works', () => {
    expect(namehash(emoji)).toEqual('0x9c0c5bf9a185012d3b3b586a357a19ab95718d9eb5a2bf845924c40cc13f82b0')
  })

  // suppress console.debug for the next test
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  it('namehash does not work', () => {
    expect(() => namehash(zeroWidthJoiner)).toThrow()
  })

  it('safenamehash works', () => {
    expect(safeNamehash(zeroWidthJoiner)).toEqual(undefined)
  })
})
