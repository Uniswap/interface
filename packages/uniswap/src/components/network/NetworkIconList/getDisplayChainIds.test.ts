import { getDisplayChainIds } from 'uniswap/src/components/network/NetworkIconList/getDisplayChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe(getDisplayChainIds, () => {
  it('returns empty array when chainIds is empty', () => {
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getDisplayChainIds([], enabled)).toEqual([])
  })

  it('returns only chain IDs that are in the enabled list', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Polygon]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getDisplayChainIds(chainIds, enabled)).toEqual([UniverseChainId.Mainnet, UniverseChainId.Polygon])
  })

  it('filters out chains not in enabled list', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Optimism]
    const enabled = [UniverseChainId.Mainnet]
    expect(getDisplayChainIds(chainIds, enabled)).toEqual([UniverseChainId.Mainnet])
  })

  it('deduplicates while preserving first occurrence order', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
    ]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getDisplayChainIds(chainIds, enabled)).toEqual([UniverseChainId.Mainnet, UniverseChainId.Polygon])
  })

  it('preserves input order when deduping', () => {
    const chainIds = [UniverseChainId.Polygon, UniverseChainId.Mainnet, UniverseChainId.Polygon]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getDisplayChainIds(chainIds, enabled)).toEqual([UniverseChainId.Polygon, UniverseChainId.Mainnet])
  })

  it('returns at most enabledChainIds.length items', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    const result = getDisplayChainIds(chainIds, enabled)
    expect(result).toHaveLength(2)
    expect(result).toEqual([UniverseChainId.Mainnet, UniverseChainId.Polygon])
  })

  it('never returns more than 3 icons even when more chains are enabled and provided', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
      UniverseChainId.Base,
    ]
    const enabled = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
      UniverseChainId.Base,
    ]
    const result = getDisplayChainIds(chainIds, enabled)
    expect(result).toHaveLength(3)
    expect(result).toEqual([UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne])
  })
})
