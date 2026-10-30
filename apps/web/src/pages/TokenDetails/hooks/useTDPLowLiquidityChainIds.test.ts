import { UniverseChainId } from '@universe/chains'
import { getLowLiquidityChainIds } from '~/pages/TokenDetails/hooks/useTDPLowLiquidityChainIds'

describe('getLowLiquidityChainIds', () => {
  it('returns chains under $1K TVL when another chain is over $10K', () => {
    const tvlByChain = new Map([
      [UniverseChainId.Base, 25_000_000],
      [UniverseChainId.Unichain, 12],
      [UniverseChainId.ArbitrumOne, 999],
      [UniverseChainId.Optimism, 1_000],
    ])

    expect(getLowLiquidityChainIds(tvlByChain)).toEqual([UniverseChainId.Unichain, UniverseChainId.ArbitrumOne])
  })

  it('returns nothing when no chain clears $10K', () => {
    const tvlByChain = new Map([
      [UniverseChainId.Base, 10_000],
      [UniverseChainId.Unichain, 12],
    ])

    expect(getLowLiquidityChainIds(tvlByChain)).toEqual([])
  })

  it('returns nothing when there is no TVL data', () => {
    expect(getLowLiquidityChainIds(new Map())).toEqual([])
  })
})
