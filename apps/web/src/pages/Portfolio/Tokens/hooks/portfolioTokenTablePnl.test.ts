import { GetWalletTokensProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo, PortfolioChainBalance } from 'uniswap/src/features/dataApi/types'
import { createPortfolioChainBalance } from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it } from 'vitest'
import {
  buildPnlLookupsFromProfitLoss,
  pnlLookupKeyFromPortfolioChainBalance,
  resolveAggregatedPnlForChainTokens,
} from './portfolioTokenTablePnl'
import { TEST_TOKEN_1, TEST_TOKEN_1_INFO } from '~/test-utils/constants'

function createChainBalanceForPnlTest(
  currencyInfo: CurrencyInfo,
  overrides: Partial<PortfolioChainBalance> = {},
): PortfolioChainBalance {
  const c = currencyInfo.currency
  const address = c instanceof Token ? c.address : '0x0000000000000000000000000000000000000001'
  return createPortfolioChainBalance({
    chainId: c.chainId,
    address,
    decimals: c.decimals,
    quantity: 100,
    valueUsd: 1000,
    isHidden: false,
    currencyInfo,
    ...overrides,
  })
}

describe('buildPnlLookupsFromProfitLoss', () => {
  it('returns empty lookups when response is undefined', () => {
    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(undefined)
    expect(perChainPnlLookup.size).toBe(0)
    expect(aggregatedJoinByLegKey.size).toBe(0)
  })

  it('indexes legacy tokenProfitLosses into perChainPnlLookup only', () => {
    const data = {
      tokenProfitLosses: [
        {
          token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          averageCostUsd: 3,
          unrealizedReturnUsd: 4,
          unrealizedReturnPercent: 0.1,
        },
      ],
      multichainTokenProfitLoss: [],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)

    expect(aggregatedJoinByLegKey.size).toBe(0)
    expect(perChainPnlLookup.size).toBe(1)
    const leg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.Mainnet })
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(leg))).toEqual({
      avgCost: 3,
      unrealizedPnl: 4,
      unrealizedPnlPercent: 0.1,
    })
  })

  it('maps multichain chainBreakdown into perChainPnlLookup and duplicates aggregated snapshot on each leg key', () => {
    const data = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 7.43,
            unrealizedReturnUsd: -100,
            unrealizedReturnPercent: -5,
            token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          },
          chainBreakdown: [
            {
              tokenAddress: TEST_TOKEN_1.address,
              chainId: UniverseChainId.Mainnet,
              averageCostUsd: 10,
              unrealizedReturnUsd: -50,
              unrealizedReturnPercent: -2,
            },
            {
              tokenAddress: TEST_TOKEN_1.address,
              chainId: UniverseChainId.ArbitrumOne,
              averageCostUsd: 20,
              unrealizedReturnUsd: -50,
              unrealizedReturnPercent: -3,
            },
          ],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)

    const mainLeg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.Mainnet })
    const arbLeg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.ArbitrumOne })

    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(mainLeg))).toEqual({
      avgCost: 10,
      unrealizedPnl: -50,
      unrealizedPnlPercent: -2,
    })
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(arbLeg))).toEqual({
      avgCost: 20,
      unrealizedPnl: -50,
      unrealizedPnlPercent: -3,
    })

    const aggMain = aggregatedJoinByLegKey.get(pnlLookupKeyFromPortfolioChainBalance(mainLeg))
    const aggArb = aggregatedJoinByLegKey.get(pnlLookupKeyFromPortfolioChainBalance(arbLeg))
    expect(aggMain).toEqual({
      avgCost: 7.43,
      unrealizedPnl: -100,
      unrealizedPnlPercent: -5,
    })
    expect(aggArb).toBe(aggMain)
  })

  it('registers aggregated join from aggregated.token when chainBreakdown is empty', () => {
    const data = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 5,
            unrealizedReturnUsd: 99,
            unrealizedReturnPercent: 0.25,
            token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          },
          chainBreakdown: [],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)

    expect(perChainPnlLookup.size).toBe(0)
    expect(aggregatedJoinByLegKey.size).toBe(1)
    const leg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.Mainnet })
    expect(aggregatedJoinByLegKey.get(pnlLookupKeyFromPortfolioChainBalance(leg))).toEqual({
      avgCost: 5,
      unrealizedPnl: 99,
      unrealizedPnlPercent: 0.25,
    })
  })
})

describe('resolveAggregatedPnlForChainTokens', () => {
  it('returns undefined when no leg matches the join index', () => {
    const { aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(undefined)
    const leg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO)
    expect(resolveAggregatedPnlForChainTokens([leg], aggregatedJoinByLegKey)).toBeUndefined()
  })

  it('returns the aggregated snapshot for the first matching leg', () => {
    const data = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 1,
            unrealizedReturnUsd: 2,
            unrealizedReturnPercent: 0.5,
            token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          },
          chainBreakdown: [
            {
              tokenAddress: TEST_TOKEN_1.address,
              chainId: UniverseChainId.Mainnet,
              averageCostUsd: 9,
              unrealizedReturnUsd: 9,
              unrealizedReturnPercent: 9,
            },
          ],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    const { aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)
    const mainLeg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.Mainnet })
    const arbLeg = createChainBalanceForPnlTest(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.ArbitrumOne })

    expect(resolveAggregatedPnlForChainTokens([arbLeg, mainLeg], aggregatedJoinByLegKey)).toEqual({
      avgCost: 1,
      unrealizedPnl: 2,
      unrealizedPnlPercent: 0.5,
    })
  })
})
