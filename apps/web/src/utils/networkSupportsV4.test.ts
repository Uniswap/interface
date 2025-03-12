import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

describe('isV4UnsupportedChain', () => {
  it('returns true for Zksync', () => {
    expect(isV4UnsupportedChain(UniverseChainId.Zksync)).toBe(true)
  })

  it('returns true for Celo', () => {
    expect(isV4UnsupportedChain(UniverseChainId.Celo)).toBe(true)
  })

  it.each([
    UniverseChainId.Mainnet,
    UniverseChainId.Avalanche,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Base,
    UniverseChainId.Blast,
    UniverseChainId.Bnb,
    UniverseChainId.Optimism,
    UniverseChainId.Polygon,
    UniverseChainId.Soneium,
    UniverseChainId.Unichain,
    UniverseChainId.Zora,
  ])('returns false for other chains', (chainId) => {
    expect(isV4UnsupportedChain(chainId)).toBe(false)
  })
})
