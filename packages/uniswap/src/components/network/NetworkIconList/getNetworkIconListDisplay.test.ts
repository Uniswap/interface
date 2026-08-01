import { getNetworkIconListDisplay } from 'uniswap/src/components/network/NetworkIconList/getNetworkIconListDisplay'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe(getNetworkIconListDisplay, () => {
  it('returns empty visible and zero overflow when chainIds is empty', () => {
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getNetworkIconListDisplay([], enabled)).toEqual({ visibleChainIds: [], overflowCount: 0 })
  })

  it('returns only chain IDs that are in the enabled list', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Polygon]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      overflowCount: 0,
    })
  })

  it('filters out chains not in enabled list', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Optimism]
    const enabled = [UniverseChainId.Mainnet]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet],
      overflowCount: 0,
    })
  })

  it('deduplicates while preserving first occurrence order', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
    ]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      overflowCount: 0,
    })
  })

  it('preserves input order when deduping', () => {
    const chainIds = [UniverseChainId.Polygon, UniverseChainId.Mainnet, UniverseChainId.Polygon]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Polygon, UniverseChainId.Mainnet],
      overflowCount: 0,
    })
  })

  it('returns at most enabledChainIds.length visible items when under overflow threshold', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne]
    const enabled = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      overflowCount: 0,
    })
  })

  it('shows three icons and overflow count 1 when there are exactly four networks', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
    ]
    const enabled = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
    ]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne],
      overflowCount: 1,
    })
  })

  it('shows three icons and overflow count when more than three networks', () => {
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
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne],
      overflowCount: 2,
    })
  })

  it('shows overflow count 3 when six networks', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
      UniverseChainId.Base,
      UniverseChainId.Bnb,
    ]
    const enabled = [
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Optimism,
      UniverseChainId.Base,
      UniverseChainId.Bnb,
    ]
    expect(getNetworkIconListDisplay(chainIds, enabled)).toEqual({
      visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne],
      overflowCount: 3,
    })
  })
})
