import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { deriveMarginReceiptFigures } from '~/pages/Swap/Margin/marginReceiptFigures'

const MARKET = getDefaultMarginMarket() // WETH/USDC long: collateral WETH (18), debt USDC (6)
const X18 = (n: number): string => `${BigInt(Math.round(n * 1e6)) * 10n ** 12n}`

function quote(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'open',
    chainId: 1,
    swapper: '0x0000000000000000000000000000000000000001',
    direction: MarginDirection.LONG,
    exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: 18 },
    counterToken: { address: MARKET.debt.address, chainId: 1, decimals: 6 },
    // The open display the backend sends: the oracle mark rides on the same snapshot as the
    // liquidation price and health factor.
    display: {
      size: `${2n * 10n ** 18n}`,
      leverage: '2',
      effectivePrice: X18(3000),
      liquidationPrice: X18(1800),
      healthFactor: X18(1.5),
      borrowRate: X18(0.0365),
      oraclePrice: X18(2985),
    },
    legs: [
      {
        venue: 'MORPHO',
        collateralToken: MARKET.collateral.address,
        debtToken: MARKET.debt.address,
        equityShare: X18(1),
        bounds: { increase: { collateralToBuy: `${1n * 10n ** 18n}` } },
      },
    ],
    deadlineSuggestion: '0',
    gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000', gasFeeUsd: X18(4.5) },
    ...overrides,
  } as MarginQuoteResponse
}

describe('deriveMarginReceiptFigures', () => {
  it('derives every figure from a full quote, its own oracle mark included', () => {
    const figures = deriveMarginReceiptFigures({ quote: quote(), market: MARKET, direction: MarginDirection.LONG })
    expect(figures.entryPrice).toBe(3000)
    expect(figures.oraclePrice).toBe(2985)
    // $3,000 fill against the $2,985 mark: 15 / 2985 = 50.25 bps, floored.
    expect(figures.priceImpactBps).toBe(50)
    expect(figures.entryImpactPct).toBe(-0.5)
    expect(figures.liquidationPrice).toBe(1800)
    // (1800 − 2985) / 2985.
    expect(figures.liqDistancePct).toBeCloseTo(-39.7, 1)
    expect(figures.healthFactor).toBe(1.5)
    expect(figures.collateralBought).toBe(1)
    expect(figures.gasUsd).toBe(4.5)
    // 2 ETH at 2x on a $3,000 fill is a $3,000 USDC loan; 3.65% APY on it is $0.30/day.
    expect(figures.borrowing).toBeCloseTo(3000)
    expect(figures.borrowPerDayUsd).toBeCloseTo(0.3)
    // A long recovers the entry-vs-mark spread upward.
    expect(figures.breakEvenPrice).toBeGreaterThan(3000)
  })

  // Without a mark there is nothing to measure impact, distance or break-even against — each hides on
  // its own rather than borrowing the fill as a stand-in.
  it('drops only the mark-relative figures when the quote carries no usable mark', () => {
    const base = quote()
    const figures = deriveMarginReceiptFigures({
      quote: quote({ display: { ...base.display, oraclePrice: '0' } }),
      market: MARKET,
      direction: MarginDirection.LONG,
    })
    expect(figures.entryPrice).toBe(3000)
    expect(figures.liquidationPrice).toBe(1800)
    expect(figures.oraclePrice).toBeUndefined()
    expect(figures.priceImpactBps).toBeUndefined()
    expect(figures.liqDistancePct).toBeUndefined()
    expect(figures.entryImpactPct).toBeUndefined()
    expect(figures.breakEvenPrice).toBeUndefined()
  })

  // A favourable fill is clamped to 0 bps upstream; a zero impact is not worth a suffix.
  it('shows no impact suffix for a non-adverse fill', () => {
    const base = quote()
    const figures = deriveMarginReceiptFigures({
      quote: quote({ display: { ...base.display, oraclePrice: X18(3000) } }),
      market: MARKET,
      direction: MarginDirection.LONG,
    })
    expect(figures.priceImpactBps).toBe(0)
    expect(figures.entryImpactPct).toBeUndefined()
  })

  // A leg with no increase group (and the '0' sentinels) must hide figures, not throw mid-render.
  it('tolerates a leg with no increase bounds and zero sentinels', () => {
    const bare = quote({
      display: { effectivePrice: '0', liquidationPrice: '0' },
      legs: [{ venue: 'MORPHO', bounds: {} }] as unknown as MarginQuoteResponse['legs'],
      gasEstimate: { gasLimit: '0', gasFeeWei: '0', gasFeeUsd: '0' },
    })
    const figures = deriveMarginReceiptFigures({
      quote: bare,
      market: MARKET,
      direction: MarginDirection.LONG,
    })
    expect(figures.entryPrice).toBeUndefined()
    expect(figures.liquidationPrice).toBeUndefined()
    expect(figures.collateralBought).toBeUndefined()
    expect(figures.gasUsd).toBeUndefined()
    expect(figures.gasEth).toBeUndefined()
  })

  it('tolerates a quote with no legs', () => {
    const figures = deriveMarginReceiptFigures({
      quote: quote({ legs: [] }),
      market: MARKET,
      direction: MarginDirection.LONG,
    })
    expect(figures.collateralBought).toBeUndefined()
  })

  // An open can't land at health 0, so '0' is the wire's absent sentinel: read as a value it would color
  // the liquidation suffix critical.
  it('treats a zero health factor as absent', () => {
    const base = quote()
    const figures = deriveMarginReceiptFigures({
      quote: quote({ display: { ...base.display, healthFactor: '0' } }),
      market: MARKET,
      direction: MarginDirection.LONG,
    })
    expect(figures.healthFactor).toBeUndefined()
  })
})
