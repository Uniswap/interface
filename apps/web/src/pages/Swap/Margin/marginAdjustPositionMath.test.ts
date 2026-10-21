import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import {
  currentEquityRawFromPosition,
  driftLeverageForEquityDelta,
  positionLeverage,
} from '~/pages/Swap/Margin/marginAdjustPositionMath'

// LONG: collateral 3 WETH, debt 6000 USDC, mark 3000. LTV = 6000/(3·3000) = 0.667, so the balance
// sheet — and a long's exposure — is 1/(1−0.667) = 3.
const LONG_BASE = { collateral: 3, debt: 6000, mark: 3000, direction: 'LONG' as const }

// SHORT: collateral 2000 USDC (stable leg), debt 0.5 WETH (volatile leg), mark 2000 (pre-inverted).
// LTV = (0.5·2000)/2000 = 0.5, a balance-sheet 2x — which carries exactly 1x of exposure.
const SHORT_BASE = { collateral: 2000, debt: 0.5, mark: 2000, direction: 'SHORT' as const }

describe('driftLeverageForEquityDelta', () => {
  it('matches the current leverage at deltaCollateral 0 (LONG)', () => {
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, deltaCollateral: 0 })).toBeCloseTo(3, 6)
  })

  it('lowers leverage when equity increases (LONG deposit)', () => {
    // ltv' = 6000/(4·3000) = 0.5 → leverage 2 — cross-checked against previewAfterAddCollateral's
    // ltvAfter assertion for the identical scenario.
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, deltaCollateral: 1 })).toBeCloseTo(2, 6)
  })

  it('returns Infinity once ltv clears 1 (LONG over-withdraw)', () => {
    // ltv' = 6000/(2·3000) = 1.0 → not < 1 → Infinity.
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, deltaCollateral: -1 })).toBe(Number.POSITIVE_INFINITY)
  })

  // The slider reports EXPOSURE: the balance sheet here is 2x, and a short borrowing exactly its own
  // margin carries 1x. Reporting the balance sheet would tell the trader they are twice as levered as
  // they are.
  it('reports a short one turn below its balance sheet at deltaCollateral 0', () => {
    expect(driftLeverageForEquityDelta({ ...SHORT_BASE, deltaCollateral: 0 })).toBeCloseTo(1, 6)
  })

  it('lowers a short leverage when equity increases (SHORT deposit)', () => {
    // ltv' = (0.5·2000)/2500 = 0.4 → balance sheet 1/(1−0.4) ≈ 1.667, exposure ≈ 0.667.
    expect(driftLeverageForEquityDelta({ ...SHORT_BASE, deltaCollateral: 500 })).toBeCloseTo(1 / (1 - 0.4) - 1, 6)
  })

  it('reads a debt-free position as carrying nothing borrowed', () => {
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, debt: 0, deltaCollateral: 5 })).toBe(1)
    expect(driftLeverageForEquityDelta({ ...SHORT_BASE, debt: 0, deltaCollateral: 5 })).toBe(0)
  })

  // Withdrawing past the WHOLE position flips the LTV's sign, which slips under the `>= 1` test and
  // would report a LOW leverage for the most extreme case there is. Still +Infinity: that is a real
  // answer, not a failure to compute.
  it('returns Infinity when the withdrawal exceeds the whole position', () => {
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, deltaCollateral: -10 })).toBe(Number.POSITIVE_INFINITY)
  })

  // The distinction the return type now carries. An unpriceable mark is UNKNOWABLE, not insolvent, and
  // sharing +Infinity with the two insolvent arms let a consumer either read "about to be liquidated"
  // off a missing oracle, or paper over a genuinely insolvent projection with a reassuring fallback.
  // NaN fails BOTH `<= 0` and `>= 1`, so a `mark <= 0` guard let it through to 1/(1-NaN) = NaN, which
  // the consumer reads as non-finite and renders as ∞ — an unknowable mark claiming liquidation.
  it('reports a NaN mark as no projection, not as a liquidation claim', () => {
    const drift = driftLeverageForEquityDelta({ ...LONG_BASE, mark: Number.NaN, deltaCollateral: 0 })
    expect(drift).toBeUndefined()
  })

  it.each([0, -1])('reports an unpriceable mark (%s) as no projection at all, not as Infinity', (mark) => {
    expect(driftLeverageForEquityDelta({ ...LONG_BASE, mark, deltaCollateral: 0 })).toBeUndefined()
    expect(driftLeverageForEquityDelta({ ...SHORT_BASE, mark, deltaCollateral: 0 })).toBeUndefined()
  })
})

describe('positionLeverage', () => {
  // `Number('')` and `Number(null)` are both 0 AND finite, so a finiteness-only guard lets a blank wire
  // value masquerade as a genuinely debt-free position — which marginHealthFromLeverage then paints
  // healthy green. A real '0' still reads as 0; only the blanks become undefined.
  it.each(['', '   ', null, undefined])('reports nothing for a blank leverage (%p)', (leverage) => {
    expect(positionLeverage({ leverage } as unknown as MarginActivePosition)).toBeUndefined()
  })
  it('reads the wire field, already in exposure terms', () => {
    expect(positionLeverage({ leverage: '3' })).toBeCloseTo(3, 6)
  })

  it('is 0 for a short carrying nothing borrowed, not 1', () => {
    expect(positionLeverage({ leverage: '0' })).toBe(0)
  })

  it('is undefined when the server reports no finite leverage', () => {
    expect(positionLeverage({ leverage: undefined })).toBeUndefined()
  })
})

// The server now computes live equity itself (collateral marked-to-oracle minus debt), so this is a
// straight passthrough — the collateral/debt/mark reconstruction this used to do is gone entirely.
describe('currentEquityRawFromPosition', () => {
  it('reads the wire equity field as a bigint', () => {
    expect(currentEquityRawFromPosition({ equity: (5n * 10n ** 17n).toString() })).toBe(5n * 10n ** 17n)
  })

  it('preserves the sign for an underwater position', () => {
    expect(currentEquityRawFromPosition({ equity: (-5n * 10n ** 17n).toString() })).toBe(-5n * 10n ** 17n)
  })
})

// The Adjust modal reads this in its render body, so an unguarded BigInt throw takes the whole sheet to
// the error boundary rather than blanking one figure. The modal already has an unknowable-equity path.
describe('currentEquityRawFromPosition on an unparseable wire value', () => {
  it.each(['', '1.5', '1e18', 'not-a-number'])('reports %p as unknowable rather than throwing', (equity) => {
    expect(() => currentEquityRawFromPosition({ equity })).not.toThrow()
    expect(currentEquityRawFromPosition({ equity })).toBeUndefined()
  })
})
