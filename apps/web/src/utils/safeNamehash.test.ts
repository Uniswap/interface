import { createUtilities } from '@universe/chains'
import { safeNamehash } from '~/utils/safeNamehash'

const { namehash: ethersNamehash } = createUtilities({ getViemEnabled: () => false })
const { namehash: viemNamehash } = createUtilities({ getViemEnabled: () => true })

describe('safeNamehash', () => {
  const zeroWidthJoiner = '\u200D'

  // suppress console.debug
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('returns undefined on undefined input', () => {
    expect(safeNamehash(ethersNamehash, undefined)).toEqual(undefined)
    expect(safeNamehash(viemNamehash, undefined)).toEqual(undefined)
  })

  it('ethersNamehash returns undefined on invalid input', () => {
    expect(safeNamehash(ethersNamehash, zeroWidthJoiner)).toEqual(undefined)
  })

  it('viemNamehash returns undefined on invalid input', () => {
    // Specified by @adraffy/ens-normalize used in viem
    const result = '0xd6eddcccdcf5a029b8c6a5ba0d52acbffea6d1f9a1a16cc32591942d464084d7'
    expect(safeNamehash(viemNamehash, zeroWidthJoiner)).toEqual(result)
  })
})
