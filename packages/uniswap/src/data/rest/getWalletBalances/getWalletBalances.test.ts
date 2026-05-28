import type {
  BalanceComponent,
  GetWalletBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import {
  doesGetWalletBalancesQueryMatchAddress,
  PortfolioBalancePart,
  selectorForPart,
  selectPortfolioBalanceBreakdown,
  selectPortfolioPools,
  selectPortfolioTokens,
  selectPortfolioTotal,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
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

const fullResponse = makeResponse({
  total: totalComponent,
  tokens: tokensComponent,
  pools: poolsComponent,
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

describe('selectPortfolioBalanceBreakdown', () => {
  it('returns undefined when response is undefined', () => {
    expect(selectPortfolioBalanceBreakdown(undefined)).toBeUndefined()
  })

  it('returns undefined when balance is missing', () => {
    expect(selectPortfolioBalanceBreakdown(makeResponse(undefined))).toBeUndefined()
  })

  it('materializes all three parts in a single pass', () => {
    expect(selectPortfolioBalanceBreakdown(fullResponse)).toEqual({
      total: { balanceUSD: 1000, percentChange: 2.5, absoluteChangeUSD: 25 },
      tokens: { balanceUSD: 600, percentChange: 2.6, absoluteChangeUSD: 15 },
      pools: { balanceUSD: 400, percentChange: 2.4, absoluteChangeUSD: 10 },
    })
  })
})

describe('selectorForPart', () => {
  it('returns selectPortfolioTotal for part=Total', () => {
    expect(selectorForPart(PortfolioBalancePart.Total)).toBe(selectPortfolioTotal)
  })

  it('returns selectPortfolioTokens for part=Tokens', () => {
    expect(selectorForPart(PortfolioBalancePart.Tokens)).toBe(selectPortfolioTokens)
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
