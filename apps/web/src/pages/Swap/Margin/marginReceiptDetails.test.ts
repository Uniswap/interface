import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { deriveMarginReceiptDetails } from '~/pages/Swap/Margin/marginReceiptDetails'

type Input = Parameters<typeof deriveMarginReceiptDetails>[0]

// A 2x ETH/USDC long: 1 ETH deposit at a $3,000 mark buys 1 more with 3,000 USDC of debt.
const input = (overrides: Partial<Input> = {}): Input => ({
  figures: {
    oraclePrice: 3000,
    entryPrice: 3030,
    size: 2,
    borrowing: 3000,
    collateralBought: 1,
    liquidationPrice: 1800,
  },
  isFillSettled: true,
  poolFeeBps: 30,
  direction: MarginDirection.LONG,
  equity: 1,
  isPaymentCollateral: true,
  slippageBps: 50,
  leverage: 2,
  venue: 'AAVE_V3',
  borrowRatePct: 4,
  ...overrides,
})

describe(deriveMarginReceiptDetails, () => {
  it.each([
    { direction: MarginDirection.LONG, leverage: 2, expected: 2 },
    { direction: MarginDirection.SHORT, leverage: 2, expected: 4 },
    { direction: MarginDirection.LONG, leverage: 0, expected: undefined },
  ])('leveraged rate: $direction at $leverage x → $expected', ({ direction, leverage, expected }) => {
    expect(deriveMarginReceiptDetails(input({ direction, leverage })).leveragedRatePct).toBe(expected)
  })

  it.each([
    { venue: 'AAVE_V3', style: 'partial' },
    { venue: 'MORPHO', style: 'full' },
    { venue: 'NEW_VENUE', style: undefined },
  ])('liquidation style for $venue → $style', ({ venue, style }) => {
    expect(deriveMarginReceiptDetails(input({ venue: venue as MarginVenue })).liquidation.style).toBe(style)
  })

  it('splits a long entry into impact net of fee, a blend with the deposit, and a worst case', () => {
    const { entry } = deriveMarginReceiptDetails(input())
    // 1% above the mark, of which 0.30% is the fee.
    expect(entry.impactPct).toBe(-0.7)
    expect(entry.feePct).toBe(0.3)
    expect(entry.blend).toEqual({ paid: 1, bought: 1, blended: 3015 })
    // Fill × 1.005 = 3,045.15, blended with the deposit at the mark.
    expect(entry.worstCase).toBe(3022.575)
  })

  it('withholds the fill and what it bought until the quote settles', () => {
    const { entry } = deriveMarginReceiptDetails(input({ isFillSettled: false }))
    expect(entry).toMatchObject({ fill: undefined, impactPct: undefined, worstCase: undefined })
    expect(entry.blend).toEqual({ paid: 1, bought: undefined, blended: undefined })
  })

  it.each([
    // 2 ETH × $1,800 − 3,000 USDC.
    { name: 'long', overrides: {}, equityUsd: 600, keptUsd: 600, keptCollateral: 600 / 1800 },
    {
      name: 'long underwater',
      overrides: { figures: { ...input().figures, borrowing: 4000 } },
      equityUsd: -400,
      keptUsd: 0,
      keptCollateral: 0,
    },
    // 3,000 USDC deposit + 6,000 sold = 9,000 collateral, less 2 ETH × $4,200.
    {
      name: 'short',
      overrides: {
        direction: MarginDirection.SHORT,
        equity: 3000,
        figures: { oraclePrice: 3000, entryPrice: 3000, size: 2, collateralBought: 6000, liquidationPrice: 4200 },
      },
      equityUsd: 600,
      keptUsd: 600,
      keptCollateral: 600,
    },
  ])('liquidation leaves a $name what the venue sells down to', ({ overrides, equityUsd, keptUsd, keptCollateral }) => {
    const { liquidation } = deriveMarginReceiptDetails(input(overrides))
    expect(liquidation).toMatchObject({ equityUsd, keptUsd, keptCollateral })
  })

  it("withholds an unsettled short's liquidation figures: its deposit is newer than the quote's size", () => {
    const { liquidation } = deriveMarginReceiptDetails(
      input({
        isFillSettled: false,
        direction: MarginDirection.SHORT,
        equity: 6000,
        figures: { oraclePrice: 3000, entryPrice: 3000, size: 2, collateralBought: 6000, liquidationPrice: 4200 },
      }),
    )
    expect(liquidation).toEqual({ style: 'partial', price: 4200 })
  })
})
