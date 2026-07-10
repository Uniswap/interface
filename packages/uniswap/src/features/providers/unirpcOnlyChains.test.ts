import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isPublicRpcOnlyChain, isUniRpcOnlyChain } from 'uniswap/src/features/providers/unirpcOnlyChains'

describe('isUniRpcOnlyChain', () => {
  it('is true for private/unlaunched UniRPC-only chains', () => {
    expect(isUniRpcOnlyChain(UniverseChainId.Arc)).toBe(true)
  })

  it('is false for public chains that follow the UniRPC feature flag', () => {
    expect(isUniRpcOnlyChain(UniverseChainId.Mainnet)).toBe(false)
    expect(isUniRpcOnlyChain(UniverseChainId.Base)).toBe(false)
    expect(isUniRpcOnlyChain(UniverseChainId.Unichain)).toBe(false)
  })

  it('is false for public-RPC-only chains (Robinhood uses its public RPC, not UniRPC)', () => {
    expect(isUniRpcOnlyChain(UniverseChainId.Robinhood)).toBe(false)
  })
})

describe('isPublicRpcOnlyChain', () => {
  it('is true for HookSwap chains with a public RPC and no UniRPC gateway auth', () => {
    expect(isPublicRpcOnlyChain(UniverseChainId.Robinhood)).toBe(true)
  })

  it('is false for UniRPC-only and standard flag-gated chains', () => {
    expect(isPublicRpcOnlyChain(UniverseChainId.Arc)).toBe(false)
    expect(isPublicRpcOnlyChain(UniverseChainId.Mainnet)).toBe(false)
    expect(isPublicRpcOnlyChain(UniverseChainId.Base)).toBe(false)
  })
})
