import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import type { MarginTokenInfo } from '~/constants/margin'
import {
  accruedUsd,
  collateralHeld,
  collateralUsdValue,
  conversionCaptionEquity,
  exposureUsdValue,
  formatLeverage,
  formatLeverageX,
  formatLiqDistanceSuffix,
  formatSignedFiat,
  getMarginDirectionStyle,
  getMarginHealthStatus,
  getMarginLiquidationBadge,
  leverageX18ToNumber,
  liqDistanceSignedPct,
  marginHealthFromLeverage,
  marginLeverageTrackColor,
  marginPriceUnitSymbol,
  marginVenueLabel,
  projectedDebtAmount,
  quoteLiqDistanceSignedPct,
  resolveMarginHealthDisplay,
  usablePriceX18,
  usableWireAmount,
  usableWireBalance,
} from '~/pages/Swap/Margin/marginFormat'

const WETH_T: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC_T: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }

describe('marginVenueLabel', () => {
  it.each([
    ['MORPHO', 'Morpho'],
    ['AAVE_V3', 'Aave v3'],
    ['AAVE_V4', 'Aave v4'],
    ['COMPOUND_V3', 'Compound v3'],
  ])('labels the curated venue %s', (venue, expected) => {
    expect(marginVenueLabel(venue)).toBe(expected)
  })

  // Forward-compat: the backend can route to a venue this build predates. The interpolated string
  // ("Open position on {{venue}}") must never render with an empty venue.
  it('prettifies an unknown wire venue instead of returning undefined', () => {
    expect(marginVenueLabel('SOME_NEW_VENUE')).toBe('Some New Venue')
  })

  it('lowercases a version segment in an unknown venue, matching the curated brand style', () => {
    expect(marginVenueLabel('SPARK_V2')).toBe('Spark v2')
  })

  it('handles a single-segment unknown venue', () => {
    expect(marginVenueLabel('EULER')).toBe('Euler')
  })
})

// The unit symbol follows the volatile leg (base), unwrapped for display — SHORT markets have
// collateral as the stable leg, so the unit tracks debt instead.
describe('marginPriceUnitSymbol', () => {
  it('uses the collateral symbol for LONG (collateral is the volatile leg), unwrapped', () => {
    expect(marginPriceUnitSymbol({ direction: 'LONG', collateral: WETH_T, debt: USDC_T })).toBe('ETH')
  })

  it('uses the debt symbol for SHORT (debt is the volatile leg), unwrapped', () => {
    expect(marginPriceUnitSymbol({ direction: 'SHORT', collateral: USDC_T, debt: WETH_T })).toBe('ETH')
  })

  it('defaults a missing direction to LONG (pre-shorts data)', () => {
    expect(marginPriceUnitSymbol({ direction: undefined, collateral: WETH_T, debt: USDC_T })).toBe('ETH')
  })
})

describe('getMarginLiquidationBadge', () => {
  it('flags a liquidated CLOSED position as fully liquidated', () => {
    expect(getMarginLiquidationBadge({ liquidated: true, status: 'closed' })).toBe('full')
  })

  it('flags a liquidated OPEN position as partially liquidated (residual collateral remains)', () => {
    expect(getMarginLiquidationBadge({ liquidated: true, status: 'open' })).toBe('partial')
  })

  it('shows no badge when not liquidated (false or undefined)', () => {
    expect(getMarginLiquidationBadge({ liquidated: false, status: 'closed' })).toBeUndefined()
    expect(getMarginLiquidationBadge({ liquidated: false, status: 'open' })).toBeUndefined()
    expect(getMarginLiquidationBadge({ liquidated: undefined, status: 'closed' })).toBeUndefined()
    expect(getMarginLiquidationBadge({ liquidated: undefined, status: 'open' })).toBeUndefined()
  })

  it('flags a user-closed epoch that saw a partial liquidation as partial', () => {
    expect(getMarginLiquidationBadge({ liquidated: false, partiallyLiquidated: true, status: 'closed' })).toBe(
      'partial',
    )
  })

  it('keeps a terminal liquidation as full even when partiallyLiquidated is also set', () => {
    expect(getMarginLiquidationBadge({ liquidated: true, partiallyLiquidated: true, status: 'closed' })).toBe('full')
  })

  it('shows no badge when neither flag is set', () => {
    expect(
      getMarginLiquidationBadge({ liquidated: false, partiallyLiquidated: false, status: 'closed' }),
    ).toBeUndefined()
    expect(getMarginLiquidationBadge({ liquidated: undefined, status: 'closed' })).toBeUndefined()
  })
})

describe('getMarginDirectionStyle', () => {
  it('maps SHORT to the critical color', () => {
    const style = getMarginDirectionStyle('SHORT')
    expect(style.color).toBe('$statusCritical')
  })

  it('maps LONG and undefined (pre-shorts data) to the success color', () => {
    for (const direction of ['LONG', undefined] as const) {
      const style = getMarginDirectionStyle(direction)
      expect(style.color).toBe('$statusSuccess')
    }
  })
})

describe('getMarginHealthStatus', () => {
  it('is healthy at and above 1.25', () => {
    expect(getMarginHealthStatus(1.25).key).toBe('healthy')
    expect(getMarginHealthStatus(2).key).toBe('healthy')
  })
  it('is caution in [1.1, 1.25)', () => {
    expect(getMarginHealthStatus(1.24).key).toBe('caution')
    expect(getMarginHealthStatus(1.1).key).toBe('caution')
  })
  it('is atRisk below 1.1', () => {
    expect(getMarginHealthStatus(1.09).key).toBe('atRisk')
    expect(getMarginHealthStatus(1).key).toBe('atRisk')
  })
  it('treats debt-free (Infinity) as healthy', () => {
    expect(getMarginHealthStatus(Number.POSITIVE_INFINITY).key).toBe('healthy')
  })
  it('fails safe to atRisk for a NaN health factor', () => {
    expect(getMarginHealthStatus(NaN).key).toBe('atRisk')
  })
})

describe('resolveMarginHealthDisplay', () => {
  it('returns a single tier when there is no after (drawer)', () => {
    expect(resolveMarginHealthDisplay({ before: 1.85 })).toEqual({
      mode: 'single',
      tier: { key: 'healthy', color: '$statusSuccess' },
    })
  })
  it('collapses to a single tier when the tier is unchanged', () => {
    expect(resolveMarginHealthDisplay({ before: 1.3, after: 1.26 })).toEqual({
      mode: 'single',
      tier: { key: 'healthy', color: '$statusSuccess' },
    })
  })
  it('is a transition across tiers', () => {
    expect(resolveMarginHealthDisplay({ before: 1.85, after: 1.15 })).toEqual({
      mode: 'transition',
      before: { key: 'healthy', color: '$statusSuccess' },
      after: { key: 'caution', color: '$statusWarning' },
    })
  })
  it('is a transition when a debt-free position takes on debt (Infinity → finite)', () => {
    expect(resolveMarginHealthDisplay({ before: Number.POSITIVE_INFINITY, after: 1.15 })).toEqual({
      mode: 'transition',
      before: { key: 'healthy', color: '$statusSuccess' },
      after: { key: 'caution', color: '$statusWarning' },
    })
  })
  it('treats a debt-free after (Infinity) as healthy', () => {
    expect(resolveMarginHealthDisplay({ before: 1.15, after: Number.POSITIVE_INFINITY })).toEqual({
      mode: 'transition',
      before: { key: 'caution', color: '$statusWarning' },
      after: { key: 'healthy', color: '$statusSuccess' },
    })
  })
  it('treats a debt-free single value (Infinity) as healthy', () => {
    expect(resolveMarginHealthDisplay({ before: Number.POSITIVE_INFINITY })).toEqual({
      mode: 'single',
      tier: { key: 'healthy', color: '$statusSuccess' },
    })
  })
})

describe('formatLeverage', () => {
  it('formats to one decimal, trimming a trailing .0', () => {
    expect(formatLeverage(2.5)).toBe('2.5x')
    expect(formatLeverage(3)).toBe('3x')
    expect(formatLeverage(2)).toBe('2x')
    expect(formatLeverage(2.55)).toBe('2.6x')
  })

  // Reachable now that display sites report Infinity for an at/past-LLTV position.
  it('renders ∞ rather than "Infinityx"', () => {
    expect(formatLeverage(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})

describe('formatLeverageX', () => {
  it('formats to two decimals with a trailing x', () => {
    expect(formatLeverageX(3.2787)).toBe('3.28x')
    expect(formatLeverageX(2)).toBe('2.00x')
  })

  it('renders ∞ for a non-finite leverage', () => {
    expect(formatLeverageX(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})

describe('marginHealthFromLeverage', () => {
  const lltvWad = '860000000000000000'

  // Neither direction may report health it cannot compute. What the NaN exit still CHANGES is the SHORT:
  // without it a NaN leverage reaches the balance-sheet math and reads at-risk rather than unknown. The
  // LONG reaches undefined either way now that each debt-free arm is pinned to its own input — so this
  // case is pinning the contract, not the guard, on that half.
  it.each(['LONG', 'SHORT'] as const)('reports no health for a NaN leverage (%s)', (direction) => {
    expect(marginHealthFromLeverage({ leverage: Number.NaN, lltvWad, direction })).toBeUndefined()
  })

  // The opposite claim, and the reason the guard above is NaN-only: +Infinity is a position AT OR PAST
  // liquidation (driftLeverageForEquityDelta returns it for ltvAfter >= 1, leverageX18ToNumber for
  // equity <= 0). Swallowing it as "unknown" paints the neutral track at the exact moment it must read
  // at-risk — the math below yields NaN, which the tier scale reports as the worst tier.
  it.each(['LONG', 'SHORT'] as const)('reports at-risk, not unknown, at or past liquidation (%s)', (direction) => {
    const health = marginHealthFromLeverage({ leverage: Number.POSITIVE_INFINITY, lltvWad, direction })
    if (health === undefined) {
      throw new Error('expected a health figure at liquidation, not "unknown"')
    }
    expect(getMarginHealthStatus(health).key).toBe('atRisk')
  })

  // HF = LLTV·L/(L−1). 3.28x and 3.50x both land in Caution, which is why a before→after Health row
  // across that move collapses to a single label.
  it.each([
    [2, 1.72],
    [3.28, 1.2372],
    [3.5, 1.204],
    [4, 1.1467],
    [5, 1.075],
  ])('LONG at %sx exposure implies a health factor of ~%s', (leverage, expected) => {
    expect(marginHealthFromLeverage({ leverage, lltvWad, direction: 'LONG' })).toBeCloseTo(expected, 3)
  })

  // A short's balance sheet is one turn higher, so at the SAME requested number it is safer: exposure
  // 2x carries LTV 2/3, not 1/2. Reading a short off the long branch paints it a whole tier greener.
  it.each([
    [1, 1.72],
    [2, 1.29],
    [2.28, 1.2372],
    [3, 1.1467],
    [4, 1.075],
  ])('SHORT at %sx exposure implies a health factor of ~%s', (leverage, expected) => {
    expect(marginHealthFromLeverage({ leverage, lltvWad, direction: 'SHORT' })).toBeCloseTo(expected, 3)
  })

  it('treats a long at 1x as debt-free rather than dividing by zero', () => {
    expect(marginHealthFromLeverage({ leverage: 1, lltvWad, direction: 'LONG' })).toBe(Number.POSITIVE_INFINITY)
  })

  it('treats a short with no exposure as debt-free', () => {
    expect(marginHealthFromLeverage({ leverage: 0, lltvWad, direction: 'SHORT' })).toBe(Number.POSITIVE_INFINITY)
  })

  it('reports no constraint for a venue that publishes no LLTV', () => {
    expect(marginHealthFromLeverage({ leverage: 4, lltvWad: '0', direction: 'LONG' })).toBeUndefined()
  })
})

describe('marginLeverageTrackColor', () => {
  const lltvWad = '860000000000000000'

  it('tracks the same tiers the health row reports', () => {
    expect(marginLeverageTrackColor({ leverage: 2, lltvWad, direction: 'LONG' })).toBe('$statusSuccess')
    expect(marginLeverageTrackColor({ leverage: 3.28, lltvWad, direction: 'LONG' })).toBe('$statusWarning')
    expect(marginLeverageTrackColor({ leverage: 3.5, lltvWad, direction: 'LONG' })).toBe('$statusWarning')
    expect(marginLeverageTrackColor({ leverage: 5, lltvWad, direction: 'LONG' })).toBe('$statusCritical')
  })

  // The bands sit one turn lower for a short. Painting it off the long branch would call 3x green
  // where it is amber, and 4.56x amber where it is red.
  it('shifts the bands down a turn for a short', () => {
    expect(marginLeverageTrackColor({ leverage: 2, lltvWad, direction: 'SHORT' })).toBe('$statusSuccess')
    expect(marginLeverageTrackColor({ leverage: 3, lltvWad, direction: 'SHORT' })).toBe('$statusWarning')
    expect(marginLeverageTrackColor({ leverage: 4, lltvWad, direction: 'SHORT' })).toBe('$statusCritical')
  })

  it('stays green with no exposure', () => {
    expect(marginLeverageTrackColor({ leverage: 1, lltvWad, direction: 'LONG' })).toBe('$statusSuccess')
    expect(marginLeverageTrackColor({ leverage: 0, lltvWad, direction: 'SHORT' })).toBe('$statusSuccess')
  })

  it('goes neutral, not green, for a venue that publishes no LLTV', () => {
    expect(marginLeverageTrackColor({ leverage: 4, lltvWad: '0', direction: 'LONG' })).toBe('$neutral3')
    expect(marginLeverageTrackColor({ leverage: 10, lltvWad: '0', direction: 'SHORT' })).toBe('$neutral3')
  })
})

// The two prices alone decide the sign: a long's liq sits below the mark, a short's above. The wire's
describe('liqDistanceSignedPct', () => {
  it('reads negative for a long: the price must fall', () => {
    expect(liqDistanceSignedPct({ liqPrice: 1860.47, mark: 2400 })).toBeCloseTo(-22.48, 2)
  })

  it('reads positive for a short: the price must rise', () => {
    // 3x short, lltv 0.86: ltv0 = 2/3 → liq = mark / (ltv0/lltv) = 3870 from a 3000 mark.
    expect(liqDistanceSignedPct({ liqPrice: 3870, mark: 3000 })).toBeCloseTo(29, 8)
  })

  it('disagrees with the wire bps figure for a short by 6.5 points', () => {
    const geometric = liqDistanceSignedPct({ liqPrice: 3870, mark: 3000 })
    const wireBps = (1 - 0.6667 / 0.86) * 100
    expect(Math.abs((geometric ?? 0) - wireBps)).toBeCloseTo(6.52, 1)
  })

  it('returns undefined rather than 0 for an unusable price', () => {
    expect(liqDistanceSignedPct({ liqPrice: 1500, mark: 0 })).toBeUndefined()
    expect(liqDistanceSignedPct({ liqPrice: 0, mark: 2000 })).toBeUndefined()
  })

  it('is 0 only when liq and mark genuinely coincide', () => {
    expect(liqDistanceSignedPct({ liqPrice: 2000, mark: 2000 })).toBe(0)
  })
})

describe('formatLiqDistanceSuffix', () => {
  it('uses U+2212 for a negative and keeps an explicit plus', () => {
    expect(formatLiqDistanceSuffix(-22.48)).toBe('(−22.5%)')
    expect(formatLiqDistanceSuffix(29)).toBe('(+29.0%)')
  })
})

// The debt leg is stable for a long and volatile for a short, so only a short needs the mark.
describe('accruedUsd', () => {
  it('passes a long through — its debt is already the USD leg', () => {
    expect(accruedUsd({ accrued: 12.5, direction: 'LONG', mark: 2000 })).toBe(12.5)
  })

  it('values a short at the mark — its debt is the volatile leg', () => {
    expect(accruedUsd({ accrued: 0.01, direction: 'SHORT', mark: 2000 })).toBeCloseTo(20)
  })

  it('treats an unknown direction as a long, matching the display fallback', () => {
    expect(accruedUsd({ accrued: 12.5, direction: undefined, mark: 2000 })).toBe(12.5)
  })
})

describe('formatSignedFiat', () => {
  const fmt = (n: number): string =>
    Math.abs(n) > 0 && Math.abs(n) < 1e-8 ? '<$0.00000001' : `$${Math.abs(n).toFixed(2)}`
  it('prefixes + for non-negative', () => {
    expect(formatSignedFiat({ value: 5, format: fmt })).toBe('+$5.00')
    expect(formatSignedFiat({ value: 0, format: fmt })).toBe('+$0.00')
  })
  it('prefixes - for a normal negative', () => {
    expect(formatSignedFiat({ value: -5, format: fmt })).toBe('-$5.00')
  })
  it('turns a dropped-sign underflow bucket into >-$… for a tiny negative', () => {
    expect(formatSignedFiat({ value: -3e-9, format: fmt })).toBe('>-$0.00000001')
  })
})

describe('leverageX18ToNumber', () => {
  const MAX_UINT256 = ((1n << 256n) - 1n).toString()

  it('reads an ordinary leverage straight through', () => {
    expect(leverageX18ToNumber('3278688524590163934')).toBeCloseTo(3.2787, 4)
  })

  // The quote reports MAX_UINT256 when equity is at or below zero. It scales to ~1.16e59, which is
  // finite, so formatLeverageX would print sixty digits instead of the infinity glyph.
  it('treats the underwater sentinel as no finite leverage', () => {
    expect(leverageX18ToNumber(MAX_UINT256)).toBe(Number.POSITIVE_INFINITY)
    expect(formatLeverageX(leverageX18ToNumber(MAX_UINT256))).toBe('∞')
  })
})

// The reshaped quote carries no debt figure at all — expectedDebt is gone with no wire replacement —
// but the projection determines one, and every Borrowing surface reads it back through here.
describe('projectedDebtAmount', () => {
  const WETH_META = { address: WETH_T.address, chainId: 1, decimals: 18 }
  const USDC_META = { address: USDC_T.address, chainId: 1, decimals: 6 }

  function quoteFixture({
    direction,
    display,
  }: {
    direction: MarginDirection
    display: MarginQuoteResponse['display']
  }): MarginQuoteResponse {
    return {
      requestId: 'r1',
      action: 'open',
      chainId: 1,
      swapper: '0x00000000000000000000000000000000000000A1',
      direction,
      // Trader terms: a SHORT's exposure IS its debt leg, so both directions expose WETH here.
      exposureToken: WETH_META,
      counterToken: USDC_META,
      display,
      legs: [],
      deadlineSuggestion: '1753290000',
    }
  }

  // The docstring promises "never a fabricated zero". `mark ?? …` keeps a literal 0 (0 is not nullish)
  // and '0' is the wire's absent sentinel for effectivePrice — either way `exposure * 0 * …` reports a
  // leveraged LONG as borrowing nothing, on a figure the user reads before opening.
  it('reports nothing rather than zero debt when the price is unusable', () => {
    const quote = quoteFixture({ direction: 'LONG', display: { size: '3000000000000000000', leverage: '3' } })
    expect(projectedDebtAmount({ quote, mark: 0 })).toBeUndefined()

    const zeroFill = quoteFixture({
      direction: 'LONG',
      display: { size: '3000000000000000000', leverage: '3', effectivePrice: '0' },
    })
    expect(projectedDebtAmount({ quote: zeroFill })).toBeUndefined()
  })

  // 3 WETH at $2,000 on 3x: equity funds one turn, the borrow funds the other two.
  it('borrows the slice of a LONG notional its equity does not fund', () => {
    const quote = quoteFixture({ direction: 'LONG', display: { size: '3000000000000000000', leverage: '3' } })
    expect(projectedDebtAmount({ quote, mark: 2000 })).toBeCloseTo(4000, 6)
  })

  // A short's exposure IS its debt leg, so the projected size already IS the projected debt — no mark
  // and no leverage needed.
  it('reads a SHORT debt straight off the projected size', () => {
    const quote = quoteFixture({ direction: 'SHORT', display: { size: '3000000000000000000' } })
    expect(projectedDebtAmount({ quote })).toBe(3)
  })

  // Only `open` reports an effectivePrice; a manage quote's caller passes the position's oracle instead.
  it('falls back to the quote effective price where the caller holds no mark', () => {
    const quote = quoteFixture({
      direction: 'LONG',
      display: { size: '1000000000000000000', leverage: '2', effectivePrice: '2000000000000000000000' },
    })
    expect(projectedDebtAmount({ quote })).toBeCloseTo(1000, 6)
  })

  it('reports nothing where an input the branch needs is absent', () => {
    expect(projectedDebtAmount({ quote: quoteFixture({ direction: 'LONG', display: {} }), mark: 2000 })).toBeUndefined()
    // No leverage, and no mark to fall back on.
    expect(
      projectedDebtAmount({ quote: quoteFixture({ direction: 'LONG', display: { size: '1000000000000000000' } }) }),
    ).toBeUndefined()
  })

  // 1x is unlevered: nothing is borrowed, and the formula must not report a negative debt below it.
  it('floors an unlevered LONG at zero', () => {
    const quote = quoteFixture({ direction: 'LONG', display: { size: '1000000000000000000', leverage: '1' } })
    expect(projectedDebtAmount({ quote, mark: 2000 })).toBe(0)
  })
})

describe('exposureUsdValue', () => {
  // The exposure is always the volatile leg, so its USD value carries the mark for BOTH directions —
  // a short's 1.5 ETH size at $3,000 is $4,500, not the $1.50 collateralUsdValue's short branch gives.
  it('marks the exposure to USD in either direction', () => {
    expect(exposureUsdValue({ exposureAmount: 1.5, mark: 3000 })).toBe(4500)
    expect(exposureUsdValue({ exposureAmount: 2, mark: 2000 })).toBe(4000)
  })
})

describe('collateralHeld', () => {
  // A long holds its collateral AS its exposure — equity/debt are ignored on this branch.
  it('is the exposure for a long', () => {
    expect(collateralHeld({ direction: 'LONG', exposure: 2, equity: 999, debt: 999, mark: 2000 })).toBe(2)
  })

  // A short's collateral is the counter leg it deposited: equity + debt marked back to collateral.
  // 1000 USDC equity + 1 WETH debt × $2000 = 3000 USDC — never `size` (the 1e18 WETH debt leg).
  it('reconstructs a short from equity plus the debt marked to collateral', () => {
    expect(collateralHeld({ direction: 'SHORT', exposure: 999, equity: 1000, debt: 1, mark: 2000 })).toBe(3000)
  })

  // An undefined direction (open form before a market resolves) takes the collateral/long branch.
  it('treats an undefined direction as the exposure branch', () => {
    expect(collateralHeld({ direction: undefined, exposure: 2, equity: 999, debt: 999, mark: 2000 })).toBe(2)
  })
})

// Both readers exist because `'0'` is a truthy STRING on this wire, and because BigInt throws on any
// non-integer — a bare decode would take a whole block down mid-render where a hidden row was intended.
// A health readout that fails GREEN is the dangerous direction. 0x is debt-free only for a SHORT; a
// LONG's debt-free floor is 1x, so a LONG stamped with the wire's '0' absent sentinel is an unknown,
// not an unlevered position — and unknown must read neutral, exactly as a NaN leverage does.
describe('marginHealthFromLeverage — non-positive leverage', () => {
  const LLTV = `${86n * 10n ** 16n}` // 0.86

  it('reports a debt-free SHORT as unbounded health', () => {
    expect(marginHealthFromLeverage({ leverage: 0, lltvWad: LLTV, direction: 'SHORT' })).toBe(Number.POSITIVE_INFINITY)
  })

  it('reports a LONG with a non-positive leverage as UNKNOWN, never as unbounded health', () => {
    for (const leverage of [0, -1]) {
      expect(marginHealthFromLeverage({ leverage, lltvWad: LLTV, direction: 'LONG' })).toBeUndefined()
    }
  })

  it("still reports a LONG's real debt-free floor of 1x as unbounded health", () => {
    expect(marginHealthFromLeverage({ leverage: 1, lltvWad: LLTV, direction: 'LONG' })).toBe(Number.POSITIVE_INFINITY)
  })
})

// The only direction-branched mark-convention helper without a direct assertion: a flipped branch would
// land silently on every downstack consumer. LONG collateral IS the volatile leg (worth amount × mark);
// a SHORT's is the stable leg, worth its face amount.
describe('collateralUsdValue', () => {
  it('values a LONG at the mark and a SHORT at face', () => {
    expect(collateralUsdValue({ collateralAmount: 2, mark: 2000, direction: 'LONG' })).toBe(4000)
    expect(collateralUsdValue({ collateralAmount: 2000, mark: 2000, direction: 'SHORT' })).toBe(2000)
  })
})

describe('usablePriceX18', () => {
  it('passes a positive figure through unchanged', () => {
    expect(usablePriceX18(`${2000n * 10n ** 18n}`)).toBe(`${2000n * 10n ** 18n}`)
  })

  it('rejects the zero sentinel, the empty string and anything BigInt cannot parse', () => {
    for (const value of ['0', '', '-1', '1.5', '1e18', 'nope', undefined]) {
      expect(usablePriceX18(value)).toBeUndefined()
    }
  })
})

describe('usableWireAmount', () => {
  it('scales a raw integer by its decimals', () => {
    expect(usableWireAmount({ raw: `${2n * 10n ** 18n}`, decimals: 18 })).toBe(2)
    expect(usableWireAmount({ raw: '53000000000000000', decimals: 18 })).toBe(0.053)
  })

  it('rejects non-positive and unparseable amounts rather than throwing mid-render', () => {
    for (const raw of ['0', '', '-1', '1.5', '1e18', 'nope']) {
      expect(usableWireAmount({ raw, decimals: 18 })).toBeUndefined()
    }
  })
})

// The sibling of usableWireAmount, and the difference is load-bearing: a balance is SIGNED and may be
// zero. Reading one through the amount reader suppresses a valid position — a debt-free short, a fully
// reduced long, or an underwater row whose equity is genuinely negative.
describe('usableWireBalance', () => {
  it('admits a real zero and a real negative, which the amount reader refuses', () => {
    expect(usableWireBalance({ raw: '0', decimals: 18 })).toBe(0)
    expect(usableWireBalance({ raw: '-1000000', decimals: 6 })).toBe(-1)
    expect(usableWireAmount({ raw: '0', decimals: 18 })).toBeUndefined()
  })

  it('refuses the same unparseable inputs the amount reader does', () => {
    for (const raw of ['', '1.5', '1e18', 'nope']) {
      expect(usableWireBalance({ raw, decimals: 18 })).toBeUndefined()
    }
  })
})

// Three consumers wrote this rule separately and each got a different subset right, which is why it
// now has one home: the open form withheld nothing, Add tested `!== undefined` (admitting the truthy
// '0'), Adjust tested plain truthiness (same), and only one of the three consulted staleness.
describe('conversionCaptionEquity', () => {
  const BASE = { equityInRaw: '980000000000000000', decimals: 18, isPaymentTokenCollateral: false, isQuoteStale: false }

  it('states the quoted collateral when the quote answers the current input', () => {
    expect(conversionCaptionEquity(BASE)).toBe(0.98)
  })

  it('withholds the line when the payment token IS the collateral', () => {
    expect(conversionCaptionEquity({ ...BASE, isPaymentTokenCollateral: true })).toBeUndefined()
  })

  // The caption's other half is the LIVE input, so a settled quote answering an earlier one makes the
  // sentence assert a conversion that was never quoted.
  it('withholds the line while the quote is stale', () => {
    expect(conversionCaptionEquity({ ...BASE, isQuoteStale: true })).toBeUndefined()
  })

  it.each([undefined, '0', '', 'not-a-number'])('withholds the line for an unusable figure (%s)', (equityInRaw) => {
    expect(conversionCaptionEquity({ ...BASE, equityInRaw })).toBeUndefined()
  })
})

// The refusal moved INTO collateralHeld so it stops being an invariant that lives in whichever file
// writes the `?? 0`. Only the SHORT branch reads the mark; the LONG branch answers with its exposure.
describe('collateralHeld without a usable mark', () => {
  const BASE = { exposure: 2, equity: 1000, debt: 1 }

  it('refuses a SHORT, whose collateral is equity + debt x mark', () => {
    expect(collateralHeld({ ...BASE, direction: 'SHORT', mark: undefined })).toBeUndefined()
  })

  it('still answers a LONG, whose collateral IS its exposure', () => {
    expect(collateralHeld({ ...BASE, direction: 'LONG', mark: undefined })).toBe(2)
    expect(collateralHeld({ ...BASE, direction: undefined, mark: undefined })).toBe(2)
  })

  it('solves a SHORT normally once the mark is known', () => {
    expect(collateralHeld({ ...BASE, direction: 'SHORT', mark: 2000 })).toBe(3000)
  })
})

// The fail-green shape survived in the complements of the two cases already covered: the `<= 0` arm
// also swallowed a SHORT at a NEGATIVE leverage, and the LONG arm's `> 1` else-branch swallowed a LONG
// in (0, 1) — both returning +Infinity, which paints the health track green. Neither is a real position
// state, which is exactly what the '0' sentinel was.
describe('marginHealthFromLeverage on inputs that are not position states', () => {
  const LLTV = (86n * 10n ** 16n).toString() // 0.86

  it('reports a SHORT at a NEGATIVE leverage as unknown, not debt-free', () => {
    expect(marginHealthFromLeverage({ leverage: -2, lltvWad: LLTV, direction: 'SHORT' })).toBeUndefined()
  })

  it('reports a LONG between 0 and 1 as unknown, not debt-free', () => {
    expect(marginHealthFromLeverage({ leverage: 0.5, lltvWad: LLTV, direction: 'LONG' })).toBeUndefined()
  })

  // The two arms that ARE real debt-free states must keep reporting so.
  it('still reports the genuine debt-free states', () => {
    expect(marginHealthFromLeverage({ leverage: 0, lltvWad: LLTV, direction: 'SHORT' })).toBe(Number.POSITIVE_INFINITY)
    expect(marginHealthFromLeverage({ leverage: 1, lltvWad: LLTV, direction: 'LONG' })).toBe(Number.POSITIVE_INFINITY)
  })
})

// Both legs decode through usablePriceX18 now — a bare truthiness test admits the '0' sentinel and lets
// a non-integer wire value throw a SyntaxError out of BigInt mid-render.
describe('quoteLiqDistanceSignedPct on unusable wire prices', () => {
  it.each(['0', '', '1.5', '1e18'])('withholds the distance for an unusable liq price (%p)', (liquidationPriceX18) => {
    expect(() =>
      quoteLiqDistanceSignedPct({ liquidationPriceX18, markPriceX18: (2000n * 10n ** 18n).toString() }),
    ).not.toThrow()
    expect(
      quoteLiqDistanceSignedPct({ liquidationPriceX18, markPriceX18: (2000n * 10n ** 18n).toString() }),
    ).toBeUndefined()
  })

  it.each(['0', '1.5'])('withholds the distance for an unusable mark (%p)', (markPriceX18) => {
    expect(
      quoteLiqDistanceSignedPct({ liquidationPriceX18: (1600n * 10n ** 18n).toString(), markPriceX18 }),
    ).toBeUndefined()
  })

  it('still reports a real distance', () => {
    expect(
      quoteLiqDistanceSignedPct({
        liquidationPriceX18: (1600n * 10n ** 18n).toString(),
        markPriceX18: (2000n * 10n ** 18n).toString(),
      }),
    ).toBeCloseTo(-20, 6)
  })
})

// The one wire string in this file that was decoded without a guard, and it sits on the slider's render
// path via marginLeverageTrackColor — an unguarded BigInt throw there takes the control down.
describe('marginHealthFromLeverage on an unusable LLTV', () => {
  it.each(['0.86', '8.6e17', '', 'not-a-number', '0'])('reports no health for lltvWad %p', (lltvWad) => {
    expect(() => marginHealthFromLeverage({ leverage: 3, lltvWad, direction: 'LONG' })).not.toThrow()
    expect(marginHealthFromLeverage({ leverage: 3, lltvWad, direction: 'LONG' })).toBeUndefined()
  })
})

// The last X18 reader in this file that called BigInt bare, and it runs inside its callers' renders.
describe('leverageX18ToNumber on an unparseable wire value', () => {
  it.each(['2.5e18', '1.5', 'not-a-number', ''])('reports %p as unknown rather than throwing', (x18) => {
    expect(() => leverageX18ToNumber(x18)).not.toThrow()
    expect(Number.isNaN(leverageX18ToNumber(x18))).toBe(true)
  })

  it('still reads a real value and the saturating sentinel', () => {
    expect(leverageX18ToNumber((3n * 10n ** 18n).toString())).toBeCloseTo(3, 8)
    expect(leverageX18ToNumber(((1n << 256n) - 1n).toString())).toBe(Number.POSITIVE_INFINITY)
  })
})

// A NaN leverage on a SHORT reaches the balance-sheet math and reads AT-RISK without the NaN exit —
// which is the effect that guard still has, now that each debt-free arm is pinned to its own input.
describe('marginHealthFromLeverage on a NaN leverage', () => {
  const LLTV = (86n * 10n ** 16n).toString()

  it.each(['SHORT', 'LONG'] as const)('reports unknown health rather than a tier (%s)', (direction) => {
    expect(marginHealthFromLeverage({ leverage: Number.NaN, lltvWad: LLTV, direction })).toBeUndefined()
  })
})
