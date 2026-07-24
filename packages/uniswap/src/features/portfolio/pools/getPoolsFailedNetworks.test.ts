import type { AppTFunction } from 'ui/src/i18n/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  getPoolsUnavailableMessage,
  MAX_NAMED_FAILED_NETWORKS,
} from 'uniswap/src/features/portfolio/pools/getPoolsFailedNetworks'

const t = ((key: string, options?: Record<string, unknown>) => {
  if (key === 'portfolio.pools.unavailable.otherNetworks') {
    const count = options?.['count']
    return `${count} other ${count === 1 ? 'network' : 'networks'}`
  }
  if (key === 'portfolio.pools.unavailable.networks') {
    return `Pools on ${options?.['networks']} currently unavailable`
  }
  return key
}) as unknown as AppTFunction

describe('getPoolsUnavailableMessage', () => {
  it('returns an empty string when no chains failed', () => {
    expect(getPoolsUnavailableMessage({ chainIds: [], t })).toBe('')
  })

  it('names a single failed network', () => {
    const message = getPoolsUnavailableMessage({ chainIds: [UniverseChainId.Mainnet], t })
    expect(message).toBe(`Pools on ${getChainLabel(UniverseChainId.Mainnet)} currently unavailable`)
  })

  it('joins two networks with "and" and no comma', () => {
    const message = getPoolsUnavailableMessage({ chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base], t })
    const [a, b] = [getChainLabel(UniverseChainId.Mainnet), getChainLabel(UniverseChainId.Base)]
    expect(message).toBe(`Pools on ${a} and ${b} currently unavailable`)
  })

  it('joins three networks with a serial comma before "and"', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Optimism]
    const [a, b, c] = chainIds.map(getChainLabel)
    expect(getPoolsUnavailableMessage({ chainIds, t })).toBe(`Pools on ${a}, ${b}, and ${c} currently unavailable`)
  })

  it('summarizes a single overflow network in the singular past the cap', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Optimism, UniverseChainId.Polygon]
    const [a, b, c] = chainIds.slice(0, MAX_NAMED_FAILED_NETWORKS).map(getChainLabel)
    expect(getPoolsUnavailableMessage({ chainIds, t })).toBe(
      `Pools on ${a}, ${b}, ${c}, and 1 other network currently unavailable`,
    )
  })

  it('summarizes multiple overflow networks in the plural past the cap', () => {
    const chainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.Optimism,
      UniverseChainId.Polygon,
      UniverseChainId.ArbitrumOne,
    ]
    const [a, b, c] = chainIds.slice(0, MAX_NAMED_FAILED_NETWORKS).map(getChainLabel)
    const others = chainIds.length - MAX_NAMED_FAILED_NETWORKS
    expect(getPoolsUnavailableMessage({ chainIds, t })).toBe(
      `Pools on ${a}, ${b}, ${c}, and ${others} other networks currently unavailable`,
    )
  })
})
