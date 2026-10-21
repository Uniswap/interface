import { GetWalletTokensProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDC_SOLANA } from 'uniswap/src/constants/tokens'
import { DEFAULT_NATIVE_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
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

  it('joins natives returned under the chain backend address (POL 0x…1010, CELO 0x471e…)', () => {
    const data = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 0.2,
            unrealizedReturnUsd: -0.2,
            unrealizedReturnPercent: -10,
            token: { address: '0x0000000000000000000000000000000000001010', chainId: UniverseChainId.Polygon },
          },
          chainBreakdown: [
            {
              tokenAddress: '0x0000000000000000000000000000000000001010',
              chainId: UniverseChainId.Polygon,
              averageCostUsd: 0.2,
              unrealizedReturnUsd: -0.2,
              unrealizedReturnPercent: -10,
            },
          ],
        },
        {
          aggregated: {
            averageCostUsd: 0.3,
            unrealizedReturnUsd: 0.1,
            unrealizedReturnPercent: 33,
            token: { address: '0x471EcE3750Da237f93B8E339c536989b8978a438', chainId: UniverseChainId.Celo },
          },
          chainBreakdown: [
            {
              tokenAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
              chainId: UniverseChainId.Celo,
              averageCostUsd: 0.3,
              unrealizedReturnUsd: 0.1,
              unrealizedReturnPercent: 33,
            },
          ],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)

    const polLeg = createChainBalanceForPnlTest(
      { currency: nativeOnChain(UniverseChainId.Polygon), currencyId: 'POL' } as CurrencyInfo,
      { chainId: UniverseChainId.Polygon },
    )
    const celoLeg = createChainBalanceForPnlTest(
      { currency: nativeOnChain(UniverseChainId.Celo), currencyId: 'CELO' } as CurrencyInfo,
      { chainId: UniverseChainId.Celo },
    )

    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(polLeg))).toEqual({
      avgCost: 0.2,
      unrealizedPnl: -0.2,
      unrealizedPnlPercent: -10,
    })
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(celoLeg))).toEqual({
      avgCost: 0.3,
      unrealizedPnl: 0.1,
      unrealizedPnlPercent: 33,
    })
    expect(resolveAggregatedPnlForChainTokens([polLeg], aggregatedJoinByLegKey)).toEqual({
      avgCost: 0.2,
      unrealizedPnl: -0.2,
      unrealizedPnlPercent: -10,
    })
  })

  it('joins the native SOL row to the system-program address and keeps SPL mints case-sensitive', () => {
    const data = {
      tokenProfitLosses: [
        {
          token: { address: DEFAULT_NATIVE_ADDRESS_SOLANA, chainId: UniverseChainId.Solana },
          averageCostUsd: 150,
          unrealizedReturnUsd: 25,
          unrealizedReturnPercent: 16,
        },
        {
          token: { address: USDC_SOLANA.address, chainId: UniverseChainId.Solana },
          averageCostUsd: 1,
          unrealizedReturnUsd: 0,
          unrealizedReturnPercent: 0,
        },
      ],
      multichainTokenProfitLoss: [],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup } = buildPnlLookupsFromProfitLoss(data)

    const solLeg = createChainBalanceForPnlTest(
      { currency: nativeOnChain(UniverseChainId.Solana), currencyId: 'SOL' } as CurrencyInfo,
      { chainId: UniverseChainId.Solana, address: DEFAULT_NATIVE_ADDRESS_SOLANA },
    )
    const usdcLeg = createChainBalanceForPnlTest(
      { currency: USDC_SOLANA, currencyId: `${UniverseChainId.Solana}-${USDC_SOLANA.address}` } as CurrencyInfo,
      { chainId: UniverseChainId.Solana, address: USDC_SOLANA.address },
    )

    expect(pnlLookupKeyFromPortfolioChainBalance(solLeg)).toBe(
      `${DEFAULT_NATIVE_ADDRESS_SOLANA}-${UniverseChainId.Solana}`,
    )
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(solLeg))).toEqual({
      avgCost: 150,
      unrealizedPnl: 25,
      unrealizedPnlPercent: 16,
    })
    expect(pnlLookupKeyFromPortfolioChainBalance(usdcLeg)).toBe(`${USDC_SOLANA.address}-${UniverseChainId.Solana}`)
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(usdcLeg))).toEqual({
      avgCost: 1,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
    })
  })

  it('does not join a Solana native row to the EVM zero address', () => {
    const data = {
      tokenProfitLosses: [
        {
          token: { address: '0x0000000000000000000000000000000000000000', chainId: UniverseChainId.Solana },
          averageCostUsd: 1,
          unrealizedReturnUsd: 1,
          unrealizedReturnPercent: 1,
        },
      ],
      multichainTokenProfitLoss: [],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup } = buildPnlLookupsFromProfitLoss(data)
    const solLeg = createChainBalanceForPnlTest(
      { currency: nativeOnChain(UniverseChainId.Solana), currencyId: 'SOL' } as CurrencyInfo,
      { chainId: UniverseChainId.Solana, address: DEFAULT_NATIVE_ADDRESS_SOLANA },
    )
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(solLeg))).toBeUndefined()
  })

  it('does not collapse Arc USDC ERC-20 into the native key (distinct 6-decimal token)', () => {
    const arcUsdcAddress = '0x3600000000000000000000000000000000000000'
    const data = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 1,
            unrealizedReturnUsd: 5,
            unrealizedReturnPercent: 2,
            token: { address: arcUsdcAddress, chainId: UniverseChainId.Arc },
          },
          chainBreakdown: [
            {
              tokenAddress: arcUsdcAddress,
              chainId: UniverseChainId.Arc,
              averageCostUsd: 1,
              unrealizedReturnUsd: 5,
              unrealizedReturnPercent: 2,
            },
          ],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    const { perChainPnlLookup, aggregatedJoinByLegKey } = buildPnlLookupsFromProfitLoss(data)

    const nativeLeg = createChainBalanceForPnlTest(
      { currency: nativeOnChain(UniverseChainId.Arc), currencyId: 'ARC-NATIVE' } as CurrencyInfo,
      { chainId: UniverseChainId.Arc },
    )

    // The 18-decimal native row must not claim the ERC-20's PnL entry.
    expect(perChainPnlLookup.get(pnlLookupKeyFromPortfolioChainBalance(nativeLeg))).toBeUndefined()
    expect(resolveAggregatedPnlForChainTokens([nativeLeg], aggregatedJoinByLegKey)).toBeUndefined()
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
