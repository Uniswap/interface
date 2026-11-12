import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { marginMarketKey, type MarginMarket, type MarginTokenInfo } from '~/constants/margin'
import { canMarginMarketFundBorrow, pickMarginOpenMarket } from '~/pages/Swap/Margin/marginOpenMarket'

const WETH: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }

function marketFixture({
  venue,
  maxLeverage,
  marketId,
}: {
  venue: MarginVenue
  maxLeverage?: number
  marketId?: string
}): MarginMarket {
  return {
    key: marginMarketKey({ collateralToken: WETH.address, debtToken: USDC.address, venue }),
    asset: 'ETH',
    name: 'Ethereum',
    displaySymbol: 'ETH',
    collateral: WETH,
    debt: USDC,
    venue,
    direction: MarginDirection.LONG,
    lltvWad: '860000000000000000',
    maxLeverage,
    marketId,
    shouldUseNativeEquity: true,
  }
}

const AAVE_V3 = marketFixture({ venue: 'AAVE_V3', maxLeverage: 5, marketId: '0xaave' })
const MORPHO = marketFixture({ venue: 'MORPHO', maxLeverage: 3, marketId: '0xmorpho' })

const ANY_FUNDS = (): boolean => true

function ratesBps(byVenue: Partial<Record<MarginVenue, number>>): (market: MarginMarket) => number | undefined {
  return (market) => byVenue[market.venue]
}

describe('pickMarginOpenMarket', () => {
  it('picks the cheapest market that can carry the leverage', () => {
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 2,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
      }),
    ).toBe(MORPHO)
  })

  it('skips a cheaper market whose ceiling is under the leverage', () => {
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 4,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
      }),
    ).toBe(AAVE_V3)
  })

  it('ranks an unread rate last and keeps registry order on a tie', () => {
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 2,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({ MORPHO: 300 }),
      }),
    ).toBe(MORPHO)
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 2,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({}),
      }),
    ).toBe(AAVE_V3)
  })

  it('falls back to the market that goes furthest when none can carry the leverage', () => {
    expect(
      pickMarginOpenMarket({
        markets: [MORPHO, AAVE_V3],
        leverage: 8,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
      }),
    ).toBe(AAVE_V3)
  })

  it('never picks a market without a marketId', () => {
    const unlisted = marketFixture({ venue: 'MORPHO', maxLeverage: 3 })
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, unlisted],
        leverage: 2,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
      }),
    ).toBe(AAVE_V3)
    expect(
      pickMarginOpenMarket({
        markets: [unlisted],
        leverage: 2,
        canFundBorrow: ANY_FUNDS,
        getBorrowRateBps: ratesBps({}),
      }),
    ).toBeUndefined()
  })

  it('skips a cheaper market that cannot fund the borrow', () => {
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 2,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
        canFundBorrow: (market) => market.venue !== 'MORPHO',
      }),
    ).toBe(AAVE_V3)
  })

  it('keeps the cheapest carrying market when none can fund the borrow', () => {
    expect(
      pickMarginOpenMarket({
        markets: [AAVE_V3, MORPHO],
        leverage: 2,
        getBorrowRateBps: ratesBps({ AAVE_V3: 500, MORPHO: 300 }),
        canFundBorrow: () => false,
      }),
    ).toBe(MORPHO)
  })

  it('picks nothing from no markets', () => {
    expect(
      pickMarginOpenMarket({ markets: [], leverage: 2, canFundBorrow: ANY_FUNDS, getBorrowRateBps: ratesBps({}) }),
    ).toBeUndefined()
  })
})

describe('canMarginMarketFundBorrow', () => {
  it('funds a borrow of equity × (leverage − 1) up to the available liquidity', () => {
    expect(canMarginMarketFundBorrow({ availableBorrowUsd: 3000, equityUsd: 1000, leverage: 4 })).toBe(true)
    expect(canMarginMarketFundBorrow({ availableBorrowUsd: 2999, equityUsd: 1000, leverage: 4 })).toBe(false)
  })

  it('keeps a market whose liquidity or equity is unread', () => {
    expect(canMarginMarketFundBorrow({ availableBorrowUsd: undefined, equityUsd: 1000, leverage: 4 })).toBe(true)
    expect(canMarginMarketFundBorrow({ availableBorrowUsd: 0, equityUsd: undefined, leverage: 4 })).toBe(true)
  })
})
