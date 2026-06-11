import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isRemotePriceServiceSupportedChain } from 'uniswap/src/features/prices/isRemotePriceServiceSupportedChain'
import { describe, expect, it } from 'vitest'

describe('isRemotePriceServiceSupportedChain', () => {
  it('supports previously map-disabled EVM chains', () => {
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.Celo)).toBe(true)
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.Linea)).toBe(true)
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.Tempo)).toBe(true)
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.WorldChain)).toBe(true)
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.XLayer)).toBe(true)
  })

  it('does not support Solana', () => {
    expect(isRemotePriceServiceSupportedChain(UniverseChainId.Solana)).toBe(false)
  })

  it('does not support unknown chain IDs', () => {
    expect(isRemotePriceServiceSupportedChain(999_999_999)).toBe(false)
  })
})
