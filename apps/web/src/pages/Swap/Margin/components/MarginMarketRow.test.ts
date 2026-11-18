import { describe, expect, it } from 'vitest'
import type { MarginPair } from '~/constants/margin'
import { bestMarginPair } from '~/pages/Swap/Margin/components/MarginMarketRow'

const pair = (venue: string, figures: Partial<MarginPair>): MarginPair => ({ venue, ...figures }) as MarginPair
// Raw liquidity past 2^53 still ranks by magnitude.
const PAIRS = [
  pair('AAVE_V3', { borrowRateBps: 449, maxLeverage: 5, availableBorrowLiquidity: '90000000000000000000' }),
  pair('MORPHO', { borrowRateBps: 310, maxLeverage: 8.2, availableBorrowLiquidity: '1000000' }),
  pair('COMPOUND_V3', {}),
]

describe(bestMarginPair, () => {
  it.each([
    { chip: 'lowestRate', expected: 'MORPHO' },
    { chip: 'highestLeverage', expected: 'MORPHO' },
    { chip: 'highestLiquidity', expected: 'AAVE_V3' },
    { chip: 'auto', expected: undefined },
  ] as const)('$chip picks $expected', ({ chip, expected }) => {
    expect(bestMarginPair(PAIRS, chip)?.venue).toBe(expected)
  })

  it('passes over a venue with nothing left to borrow', () => {
    const empty = pair('COMPOUND_V3', { borrowRateBps: 0, availableBorrowLiquidity: '0' })
    expect(bestMarginPair([...PAIRS, empty], 'lowestRate')?.venue).toBe('MORPHO')
  })

  it('picks nothing when no venue carries the figure', () => {
    expect(bestMarginPair([PAIRS[2]!], 'lowestRate')).toBeUndefined()
  })
})
