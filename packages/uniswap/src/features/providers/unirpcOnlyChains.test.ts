import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniRpcOnlyChain } from 'uniswap/src/features/providers/unirpcOnlyChains'

describe('isUniRpcOnlyChain', () => {
  it('is true for private/unlaunched UniRPC-only chains', () => {
    expect(isUniRpcOnlyChain(UniverseChainId.Arc)).toBe(true)
    expect(isUniRpcOnlyChain(UniverseChainId.Robinhood)).toBe(true)
  })

  it('is false for public chains that follow the UniRPC feature flag', () => {
    expect(isUniRpcOnlyChain(UniverseChainId.Mainnet)).toBe(false)
    expect(isUniRpcOnlyChain(UniverseChainId.Base)).toBe(false)
    expect(isUniRpcOnlyChain(UniverseChainId.Unichain)).toBe(false)
  })
})
