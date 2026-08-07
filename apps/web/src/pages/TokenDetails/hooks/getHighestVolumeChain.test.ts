import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getHighestVolumeChain } from '~/pages/TokenDetails/hooks/getHighestVolumeChain'

const makeEntry = (chainId: UniverseChainId): MultichainTokenEntry => ({
  chainId,
  address: '0x1',
  isNative: false,
})

describe('getHighestVolumeChain', () => {
  it('returns the entry for the chain with the highest volume', () => {
    const entries = [makeEntry(UniverseChainId.Mainnet), makeEntry(UniverseChainId.Base)]
    const volumes = { [UniverseChainId.Mainnet]: 1_000_000, [UniverseChainId.Base]: 5_000_000 }

    expect(getHighestVolumeChain(volumes, entries)?.chainId).toBe(UniverseChainId.Base)
  })

  it('returns undefined when volumes are unavailable', () => {
    expect(getHighestVolumeChain(undefined, [makeEntry(UniverseChainId.Mainnet)])).toBeUndefined()
  })

  it('returns undefined when there are no entries', () => {
    expect(getHighestVolumeChain({ [UniverseChainId.Mainnet]: 1_000_000 }, [])).toBeUndefined()
  })

  it('returns undefined when all volumes are zero', () => {
    const entries = [makeEntry(UniverseChainId.Mainnet), makeEntry(UniverseChainId.Base)]

    expect(getHighestVolumeChain({ [UniverseChainId.Mainnet]: 0, [UniverseChainId.Base]: 0 }, entries)).toBeUndefined()
  })

  it('ignores chains without an entry', () => {
    const entries = [makeEntry(UniverseChainId.Mainnet)]
    const volumes = { [UniverseChainId.Mainnet]: 100, [UniverseChainId.Base]: 5_000_000 }

    expect(getHighestVolumeChain(volumes, entries)?.chainId).toBe(UniverseChainId.Mainnet)
  })
})
