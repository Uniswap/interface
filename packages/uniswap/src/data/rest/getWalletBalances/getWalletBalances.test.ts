import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type {
  BalanceComponent,
  GetWalletBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import {
  doesGetWalletBalancesQueryMatchAddress,
  getUnavailableCategories,
  isEmptyWalletBalance,
  type PortfolioBalanceBreakdown,
  PortfolioBalancePart,
  selectorForPart,
  selectPortfolioBalanceBreakdown,
  selectPortfolioEarn,
  selectPortfolioPools,
  selectPortfolioTokens,
  selectPortfolioTotal,
  sumAvailableBalanceSlices,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const TEST_EVM_ADDRESS_1 = '0x1234567890123456789012345678901234567890'
const TEST_EVM_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const TEST_SVM_ADDRESS_1 = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TEST_SVM_ADDRESS_2 = 'So11111111111111111111111111111111111111112'

function makeComponent(
  values: Partial<{ valueUsd: number; absoluteChange1d: number; percentChange1d: number }>,
): BalanceComponent {
  return values as unknown as BalanceComponent
}

function makeResponse(balance: Partial<WalletBalance> | undefined): GetWalletBalancesResponse {
  return { balance } as unknown as GetWalletBalancesResponse
}

const totalComponent = makeComponent({ valueUsd: 1000, absoluteChange1d: 25, percentChange1d: 2.5 })
const tokensComponent = makeComponent({ valueUsd: 600, absoluteChange1d: 15, percentChange1d: 2.6 })
const poolsComponent = makeComponent({ valueUsd: 400, absoluteChange1d: 10, percentChange1d: 2.4 })
const earnComponent = makeComponent({ valueUsd: 250, absoluteChange1d: 5, percentChange1d: 2.1 })

const fullResponse = makeResponse({
  total: totalComponent,
  tokens: tokensComponent,
  pools: poolsComponent,
  failedChainIds: [],
  earn: earnComponent,
})

describe('selectPortfolioTotal', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioTotal(undefined)).toBeUndefined()
  })

  it('returns undefined when balance is missing', () => {
    expect(selectPortfolioTotal(makeResponse(undefined))).toBeUndefined()
  })

  it('maps total component fields to PortfolioTotalValue', () => {
    expect(selectPortfolioTotal(fullResponse)).toEqual({
      balanceUSD: 1000,
      percentChange: 2.5,
      absoluteChangeUSD: 25,
    })
  })

  it('returns all-undefined values when total component is missing', () => {
    const response = makeResponse({ tokens: tokensComponent, pools: poolsComponent })
    expect(selectPortfolioTotal(response)).toEqual({
      balanceUSD: undefined,
      percentChange: undefined,
      absoluteChangeUSD: undefined,
    })
  })
})

describe('selectPortfolioTokens', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioTokens(undefined)).toBeUndefined()
  })

  it('maps tokens component fields to PortfolioTotalValue', () => {
    expect(selectPortfolioTokens(fullResponse)).toEqual({
      balanceUSD: 600,
      percentChange: 2.6,
      absoluteChangeUSD: 15,
    })
  })

  it('returns all-undefined values when tokens component is missing', () => {
    const response = makeResponse({ total: totalComponent, pools: poolsComponent })
    expect(selectPortfolioTokens(response)).toEqual({
      balanceUSD: undefined,
      percentChange: undefined,
      absoluteChangeUSD: undefined,
    })
  })
})

describe('selectPortfolioPools', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioPools(undefined)).toBeUndefined()
  })

  it('maps pools component fields to PortfolioTotalValue', () => {
    expect(selectPortfolioPools(fullResponse)).toEqual({
      balanceUSD: 400,
      percentChange: 2.4,
      absoluteChangeUSD: 10,
    })
  })

  it('returns all-undefined values when pools component is missing', () => {
    const response = makeResponse({ total: totalComponent, tokens: tokensComponent })
    expect(selectPortfolioPools(response)).toEqual({
      balanceUSD: undefined,
      percentChange: undefined,
      absoluteChangeUSD: undefined,
    })
  })
})

describe('selectPortfolioEarn', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioEarn(undefined)).toBeUndefined()
  })

  it('maps earn component fields to PortfolioTotalValue', () => {
    expect(selectPortfolioEarn(fullResponse)).toEqual({
      balanceUSD: 250,
      percentChange: 2.1,
      absoluteChangeUSD: 5,
    })
  })

  it('returns all-undefined values when earn component is missing', () => {
    const response = makeResponse({ total: totalComponent, tokens: tokensComponent })
    expect(selectPortfolioEarn(response)).toEqual({
      balanceUSD: undefined,
      percentChange: undefined,
      absoluteChangeUSD: undefined,
    })
  })
})

describe('selectPortfolioBalanceBreakdown', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioBalanceBreakdown(undefined)).toBeUndefined()
  })

  it('returns undefined when balance is missing', () => {
    expect(selectPortfolioBalanceBreakdown(makeResponse(undefined))).toBeUndefined()
  })

  it('materializes all parts in a single pass', () => {
    expect(selectPortfolioBalanceBreakdown(fullResponse)).toEqual({
      total: { balanceUSD: 1000, percentChange: 2.5, absoluteChangeUSD: 25 },
      tokens: { balanceUSD: 600, percentChange: 2.6, absoluteChangeUSD: 15 },
      pools: { balanceUSD: 400, percentChange: 2.4, absoluteChangeUSD: 10 },
      failedChainIds: [],
      earn: { balanceUSD: 250, percentChange: 2.1, absoluteChangeUSD: 5 },
    })
  })

  it('surfaces failed chain IDs from the response', () => {
    const response = makeResponse({ ...fullResponse.balance, failedChainIds: [196, 42161] })
    expect(selectPortfolioBalanceBreakdown(response)?.failedChainIds).toEqual([196, 42161])
  })
})

describe('getUnavailableCategories', () => {
  const slice = (balanceUSD: number | undefined): PortfolioTotalValue => ({
    balanceUSD,
    percentChange: undefined,
    absoluteChangeUSD: undefined,
  })
  const breakdown = (poolsBalanceUSD: number | undefined): PortfolioBalanceBreakdown => ({
    total: slice(poolsBalanceUSD === undefined ? undefined : 1000),
    tokens: slice(600),
    pools: slice(poolsBalanceUSD),
    failedChainIds: [],
    earn: slice(0),
  })

  it('returns [] when the breakdown is undefined', () => {
    expect(
      getUnavailableCategories({ breakdown: undefined, requestedCategories: [WalletBalanceCategory.POOLS] }),
    ).toEqual([])
  })

  it('returns [] when a requested category slice has a value', () => {
    expect(
      getUnavailableCategories({ breakdown: breakdown(400), requestedCategories: [WalletBalanceCategory.POOLS] }),
    ).toEqual([])
  })

  it('reports a requested category whose slice the backend omitted', () => {
    expect(
      getUnavailableCategories({ breakdown: breakdown(undefined), requestedCategories: [WalletBalanceCategory.POOLS] }),
    ).toEqual([WalletBalanceCategory.POOLS])
  })

  it('ignores categories that were not requested even when their slice is missing', () => {
    expect(getUnavailableCategories({ breakdown: breakdown(undefined), requestedCategories: [] })).toEqual([])
  })

  it('treats a 0 balance as available, not missing', () => {
    expect(
      getUnavailableCategories({ breakdown: breakdown(0), requestedCategories: [WalletBalanceCategory.POOLS] }),
    ).toEqual([])
  })

  it('reports a pools outage on a token-empty wallet (an omitted total is not an empty wallet)', () => {
    // Token balance is 0 and the pools leg failed, so the backend omits both pools and the
    // aggregate total. This must surface as unavailable, not be hidden as an empty wallet.
    const outageBreakdown: PortfolioBalanceBreakdown = {
      total: slice(undefined),
      tokens: slice(0),
      pools: slice(undefined),
      failedChainIds: [],
      earn: slice(0),
    }
    expect(
      getUnavailableCategories({ breakdown: outageBreakdown, requestedCategories: [WalletBalanceCategory.POOLS] }),
    ).toEqual([WalletBalanceCategory.POOLS])
  })
})

describe(sumAvailableBalanceSlices, () => {
  const slice = (balanceUSD: number | undefined, absoluteChangeUSD?: number): PortfolioTotalValue => ({
    balanceUSD,
    percentChange: undefined,
    absoluteChangeUSD,
  })
  const breakdown = (parts: {
    tokens: PortfolioTotalValue
    pools: PortfolioTotalValue
    earn: PortfolioTotalValue
  }): PortfolioBalanceBreakdown => ({ total: slice(undefined), failedChainIds: [], ...parts })

  it('sums only the slices that resolved, skipping an unavailable category', () => {
    // Earn is unavailable but pools is available: the total must still include pools.
    const result = sumAvailableBalanceSlices(
      breakdown({ tokens: slice(600), pools: slice(400), earn: slice(undefined) }),
    )
    expect(result.balanceUSD).toBe(1000)
  })

  it('returns undefined balance when no slice resolved', () => {
    expect(
      sumAvailableBalanceSlices(
        breakdown({ tokens: slice(undefined), pools: slice(undefined), earn: slice(undefined) }),
      ),
    ).toEqual({
      balanceUSD: undefined,
      percentChange: undefined,
      absoluteChangeUSD: undefined,
    })
  })

  it('sums absolute change and derives percent when every included slice reports it', () => {
    // tokens: 600 (+60), pools: 400 (+40) → 1000 now, +100 change, from a 900 start → 11.11%.
    const result = sumAvailableBalanceSlices(
      breakdown({ tokens: slice(600, 60), pools: slice(400, 40), earn: slice(undefined) }),
    )
    expect(result.balanceUSD).toBe(1000)
    expect(result.absoluteChangeUSD).toBe(100)
    expect(result.percentChange).toBeCloseTo(11.111, 2)
  })

  it('leaves change undefined when an included slice omits its absolute change', () => {
    const result = sumAvailableBalanceSlices(
      breakdown({ tokens: slice(600, 60), pools: slice(400, undefined), earn: slice(undefined) }),
    )
    expect(result.balanceUSD).toBe(1000)
    expect(result.absoluteChangeUSD).toBeUndefined()
    expect(result.percentChange).toBeUndefined()
  })

  it('treats a 0 balance slice as available', () => {
    const result = sumAvailableBalanceSlices(breakdown({ tokens: slice(600), pools: slice(0), earn: slice(undefined) }))
    expect(result.balanceUSD).toBe(600)
  })
})

describe('isEmptyWalletBalance', () => {
  const slice = (balanceUSD: number | undefined): PortfolioTotalValue => ({
    balanceUSD,
    percentChange: undefined,
    absoluteChangeUSD: undefined,
  })
  const withTotal = (total: number | undefined): PortfolioBalanceBreakdown => ({
    total: slice(total),
    tokens: slice(0),
    pools: slice(0),
    failedChainIds: [],
    earn: slice(0),
  })

  it('returns false when the breakdown is undefined', () => {
    expect(isEmptyWalletBalance(undefined)).toBe(false)
  })

  it('returns true when the total is a defined zero', () => {
    expect(isEmptyWalletBalance(withTotal(0))).toBe(true)
  })

  it('returns false when the total is omitted (a failed leg, not an empty wallet)', () => {
    expect(isEmptyWalletBalance(withTotal(undefined))).toBe(false)
  })

  it('returns false when the total holds a balance', () => {
    expect(isEmptyWalletBalance(withTotal(400))).toBe(false)
  })
})

describe('selectorForPart', () => {
  it('returns selectPortfolioTotal for part=Total', () => {
    expect(selectorForPart(PortfolioBalancePart.Total)).toBe(selectPortfolioTotal)
  })

  it('returns selectPortfolioTokens for part=Tokens', () => {
    expect(selectorForPart(PortfolioBalancePart.Tokens)).toBe(selectPortfolioTokens)
  })

  it('returns selectPortfolioEarn for part=Earn', () => {
    expect(selectorForPart(PortfolioBalancePart.Earn)).toBe(selectPortfolioEarn)
  })

  it('returns selectPortfolioPools for part=Pools', () => {
    expect(selectorForPart(PortfolioBalancePart.Pools)).toBe(selectPortfolioPools)
  })
})

describe(doesGetWalletBalancesQueryMatchAddress, () => {
  describe('invalid query keys', () => {
    it('returns false for empty query key', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })

    it('returns false for query key with wrong cache key', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetPortfolio, { evmAddress: TEST_EVM_ADDRESS_1 }],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })

    it('returns false when address key is undefined', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, undefined],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })

    it('returns false when address key is null', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, null],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })

    it('returns false when address key has no matching platform address', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, {}],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })
  })

  describe('EVM address matching', () => {
    it('returns true when EVM address matches exactly', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { evmAddress: TEST_EVM_ADDRESS_1 }, {}],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(true)
    })

    it('returns true when EVM address matches with different casing', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { evmAddress: TEST_EVM_ADDRESS_1.toLowerCase() }, {}],
          address: TEST_EVM_ADDRESS_1.toUpperCase(),
          platform: Platform.EVM,
        }),
      ).toBe(true)
    })

    it('returns false when EVM address does not match', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { evmAddress: TEST_EVM_ADDRESS_1 }, {}],
          address: TEST_EVM_ADDRESS_2,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })

    it('returns false when platform is EVM but query only has SVM', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { svmAddress: TEST_SVM_ADDRESS_1 }, {}],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })
  })

  describe('SVM address matching', () => {
    it('returns true when SVM address matches exactly', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { svmAddress: TEST_SVM_ADDRESS_1 }, {}],
          address: TEST_SVM_ADDRESS_1,
          platform: Platform.SVM,
        }),
      ).toBe(true)
    })

    it('returns false when SVM address does not match', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [ReactQueryCacheKey.GetWalletBalances, { svmAddress: TEST_SVM_ADDRESS_1 }, {}],
          address: TEST_SVM_ADDRESS_2,
          platform: Platform.SVM,
        }),
      ).toBe(false)
    })
  })

  describe('multi-platform queries', () => {
    it('returns true when EVM address matches in multi-platform query', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [
            ReactQueryCacheKey.GetWalletBalances,
            { evmAddress: TEST_EVM_ADDRESS_1, svmAddress: TEST_SVM_ADDRESS_1 },
            {},
          ],
          address: TEST_EVM_ADDRESS_1,
          platform: Platform.EVM,
        }),
      ).toBe(true)
    })

    it('returns true when SVM address matches in multi-platform query', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [
            ReactQueryCacheKey.GetWalletBalances,
            { evmAddress: TEST_EVM_ADDRESS_1, svmAddress: TEST_SVM_ADDRESS_1 },
            {},
          ],
          address: TEST_SVM_ADDRESS_1,
          platform: Platform.SVM,
        }),
      ).toBe(true)
    })

    it('returns false when neither address matches in multi-platform query', () => {
      expect(
        doesGetWalletBalancesQueryMatchAddress({
          queryKey: [
            ReactQueryCacheKey.GetWalletBalances,
            { evmAddress: TEST_EVM_ADDRESS_1, svmAddress: TEST_SVM_ADDRESS_1 },
            {},
          ],
          address: TEST_EVM_ADDRESS_2,
          platform: Platform.EVM,
        }),
      ).toBe(false)
    })
  })
})
