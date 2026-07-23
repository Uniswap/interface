import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getUniquePositionId, parsePositionId } from 'uniswap/src/features/visibility/utils'

describe(parsePositionId, () => {
  it('recovers poolId, tokenId, and chainId from a well-formed V3/V4 positionId', () => {
    expect(parsePositionId(`0xPool-42-${UniverseChainId.Mainnet}`)).toEqual({
      poolId: '0xPool',
      tokenId: '42',
      chainId: UniverseChainId.Mainnet,
    })
  })

  it('maps the "undefined" tokenId segment (V2 encoding) back to actual undefined', () => {
    expect(parsePositionId(`0xV2Pair-undefined-${UniverseChainId.Optimism}`)).toEqual({
      poolId: '0xV2Pair',
      tokenId: undefined,
      chainId: UniverseChainId.Optimism,
    })
  })

  it('round-trips through getUniquePositionId for V3/V4 (tokenId present)', () => {
    const id = getUniquePositionId({ poolId: '0xabc', tokenId: '7', chainId: UniverseChainId.ArbitrumOne })
    expect(parsePositionId(id)).toEqual({ poolId: '0xabc', tokenId: '7', chainId: UniverseChainId.ArbitrumOne })
  })

  it('round-trips through getUniquePositionId for V2 (tokenId undefined)', () => {
    const id = getUniquePositionId({ poolId: '0xabc', tokenId: undefined, chainId: UniverseChainId.Base })
    expect(parsePositionId(id)).toEqual({ poolId: '0xabc', tokenId: undefined, chainId: UniverseChainId.Base })
  })

  it('returns null for malformed input', () => {
    expect(parsePositionId('')).toBeNull()
    expect(parsePositionId('only-two')).toBeNull()
    expect(parsePositionId('---')).toBeNull()
    expect(parsePositionId('0xPool-42-not-a-number')).toBeNull()
  })
})
