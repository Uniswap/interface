import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import type { MarginMarket, MarginTokenInfo } from '~/constants/margin'
import {
  marginPositionMark,
  marginRawUsdToNumber,
  marginUsdBasis,
  marginUsdBreakEvenPrice,
  marginUsdDecimals,
  marginUsdPnlAtPrice,
  marginUsdPnlNow,
  type MarginUsdBasis,
} from '~/pages/Swap/Margin/marginUsdPnl'

const WETH: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }
type UsdMarket = Pick<MarginMarket, 'collateral' | 'debt'>
const LONG_MARKET: UsdMarket = { collateral: WETH, debt: USDC }
// MarginMarket's SHORT convention is the reversed pair: stable collateral, volatile debt.
const SHORT_MARKET: UsdMarket = { collateral: USDC, debt: WETH }

// Full-precision (not sig-fig-truncated) so a fractional fixture like 25/3 WETH round-trips through
// rawToNumber cleanly — the break-even golden below needs 6 decimal places of headroom.
const raw = (amount: number, decimals: number): string => BigInt(Math.round(amount * 10 ** decimals)).toString()
const X18 = (n: number): string => raw(n, 18)

// A scenario is described in the same venue-term vocabulary the old wire used (collateral/debt/mark);
// the builder below is what turns it into the new wire's exposure/counter/equity shape, so every test
// keeps describing "how much collateral, how much debt, at what mark" rather than pre-computed equity.
interface PositionScenario {
  direction: MarginDirection
  collateral: number
  debt: number
  mark: number
  costBasisUsd?: number
  netContributedUsd?: number
  realizedPnlUsd?: number
  isTradable?: boolean
}

// A 5x WETH LONG opened with 1 WETH of margin at $2,000: 5 WETH held against 8,000 USDC of debt, so
// the basis is exactly $2,000. Every golden below is hand-derived from these five numbers.
function makeLong(overrides: Partial<PositionScenario> = {}): MarginActivePosition {
  return buildActivePosition({
    direction: MarginDirection.LONG,
    collateral: 5,
    debt: 8000,
    mark: 2000,
    costBasisUsd: 2000,
    ...overrides,
  })
}

// The mirror: 4,000 USDC of collateral against 1 WETH of debt, $2,000 of basis.
function makeShort(overrides: Partial<PositionScenario> = {}): MarginActivePosition {
  return buildActivePosition({
    direction: MarginDirection.SHORT,
    collateral: 4000,
    debt: 1,
    mark: 2000,
    costBasisUsd: 2000,
    ...overrides,
  })
}

// Both fixtures keep WETH as the volatile (exposure) leg and USDC as the stable (counter) leg — only
// which VENUE role (collateral/debt) each plays flips with direction. LONG: exposure (`size`) IS the
// collateral leg, `legs[0].debt` IS the debt leg — both direct. SHORT: exposure IS the debt leg, and
// `equity` is derived here from collateral/debt/mark exactly the way the server computes it, so
// marginUsdBasis's own equity-based reconstruction (see marginUsdPnl.ts) round-trips losslessly.
function buildActivePosition(scenario: PositionScenario): MarginActivePosition {
  const { direction, collateral, debt, mark } = scenario
  const isShort = direction === MarginDirection.SHORT
  const equity = isShort ? collateral - debt * mark : collateral * mark - debt
  return {
    status: 'ACTIVE',
    positionId: 'pos-1',
    direction,
    exposureToken: { address: WETH.address, chainId: 1, decimals: WETH.decimals },
    counterToken: { address: USDC.address, chainId: 1, decimals: USDC.decimals },
    size: raw(isShort ? debt : collateral, WETH.decimals),
    entryPrice: '0',
    openedAt: '0',
    legs: [{ venue: 'MORPHO', subId: '1', account: '0x01', debt: raw(debt, isShort ? WETH.decimals : USDC.decimals) }],
    isTradable: scenario.isTradable ?? true,
    equity: raw(equity, USDC.decimals),
    oraclePrice: X18(mark),
    liquidationPrice: '0',
    buffer: '0',
    healthFactor: '0',
    maxWithdrawable: '0',
    ...(scenario.costBasisUsd !== undefined && { costBasisUsd: raw(scenario.costBasisUsd, USDC.decimals) }),
    ...(scenario.netContributedUsd !== undefined && {
      netContributedUsd: raw(scenario.netContributedUsd, USDC.decimals),
    }),
    ...(scenario.realizedPnlUsd !== undefined && { realizedPnlUsd: raw(scenario.realizedPnlUsd, USDC.decimals) }),
  }
}

// Every fixture below is meant to be valuable; a silent undefined would make the goldens vacuous.
function basisOf({ position, market }: { position: MarginActivePosition; market: UsdMarket }): MarginUsdBasis {
  const basis = marginUsdBasis({ position, market })
  if (!basis) {
    throw new Error('fixture carries no usable basis')
  }
  return basis
}

describe('marginUsdDecimals', () => {
  it('takes the debt leg for a LONG and the collateral leg for a SHORT', () => {
    expect(marginUsdDecimals({ market: LONG_MARKET, direction: MarginDirection.LONG })).toBe(6)
    expect(marginUsdDecimals({ market: SHORT_MARKET, direction: MarginDirection.SHORT })).toBe(6)
    // The stable leg is chosen by direction, not by which leg happens to be USDC.
    expect(marginUsdDecimals({ market: SHORT_MARKET, direction: MarginDirection.LONG })).toBe(18)
  })
})

describe('marginRawUsdToNumber', () => {
  it('shifts by the stable leg decimals', () => {
    expect(
      marginRawUsdToNumber({ raw: raw(1234.56, 6), market: LONG_MARKET, direction: MarginDirection.LONG }),
    ).toBeCloseTo(1234.56, 6)
  })

  it('carries a negative realized figure through unchanged', () => {
    expect(
      marginRawUsdToNumber({ raw: '-1500000000', market: LONG_MARKET, direction: MarginDirection.LONG }),
    ).toBeCloseTo(-1500, 6)
  })
})

describe('marginUsdBasis', () => {
  // `rawToNumber` returns 0 for '' and NaN for garbage, and both used to reach the balance sheet: an
  // empty `size` collapses a LONG's collateral to nothing and prints a confident −100% on a healthy
  // position. A real 0 must still value, which is why these read through the BALANCE reader.
  it.each(['', 'not-a-number', '1.5'])('reports nothing for an unusable size (%s)', (size) => {
    expect(marginUsdBasis({ position: { ...makeLong(), size }, market: LONG_MARKET })).toBeUndefined()
  })

  it.each(['', 'not-a-number'])('reports nothing for an unusable equity (%s)', (equity) => {
    expect(marginUsdBasis({ position: { ...makeShort(), equity }, market: SHORT_MARKET })).toBeUndefined()
  })

  // The LONG debt leg was the last balance still on a bare decode: `Number('')` is 0, so a blank leg
  // valued a levered LONG as debt-FREE — equity omitting the borrowed leg, break-even collapsing to
  // costBasis/collateral. The strict read on its own only closed the MISSING-leg case.
  it.each(['', 'not-a-number'])('reports nothing for an unusable LONG debt leg (%s)', (debt) => {
    const position = { ...makeLong(), legs: [{ ...makeLong().legs[0], debt }] } as MarginActivePosition
    expect(marginUsdBasis({ position, market: LONG_MARKET })).toBeUndefined()
  })

  it('still values a LONG whose debt leg is a settled zero', () => {
    const position = { ...makeLong(), legs: [{ ...makeLong().legs[0], debt: '0' }] } as MarginActivePosition
    expect(marginUsdBasis({ position, market: LONG_MARKET })).toBeDefined()
  })

  // The mark is load-bearing on the SHORT branch only (`equity + debt x mark`), and '0' is a DESIGNED
  // sentinel there — the backend's reciprocation returns 0 unchanged for an absent price. Passing it
  // through collapses the balance sheet to equity alone: a healthy short reads as a total loss in the
  // chart tooltip, which prices off the basis with no mark gate of its own.
  it('reports nothing for a SHORT at the zero-price sentinel', () => {
    expect(marginUsdBasis({ position: makeShort({ mark: 0 }), market: SHORT_MARKET })).toBeUndefined()
  })

  // A LONG's collateral IS its exposure, so no mark enters the balance sheet and the row still values.
  it('still values a LONG at the zero-price sentinel', () => {
    expect(marginUsdBasis({ position: makeLong({ mark: 0 }), market: LONG_MARKET })).toBeDefined()
  })

  it('still values a position whose size or equity is legitimately zero or negative', () => {
    expect(marginUsdBasis({ position: makeLong({ collateral: 0 }), market: LONG_MARKET })).toBeDefined()
    expect(marginUsdBasis({ position: makeShort({ debt: 0 }), market: SHORT_MARKET })).toBeDefined()
  })

  // A leg-less row reads debt '0' through the DISPLAY accessor. Valuing a LONG off that reports a
  // debt-free balance sheet for a levered position: equity becomes collateral × price with the borrowed
  // leg omitted, and break-even collapses to costBasis / collateral. Suppressing sends the row through
  // marginPnlSuppression, which says why, instead of a confident overstatement.
  it('reports nothing for a LONG whose debt leg is missing, rather than treating it as debt-free', () => {
    expect(marginUsdBasis({ position: { ...makeLong(), legs: [] }, market: LONG_MARKET })).toBeUndefined()
  })

  // A SHORT takes its debt from `size`, never the leg, so it must NOT be suppressed by the same gate.
  it('still values a SHORT with no leg, whose debt comes from size', () => {
    expect(marginUsdBasis({ position: { ...makeShort(), legs: [] }, market: SHORT_MARKET })).toBeDefined()
  })

  it('normalizes both legs and the USD figures', () => {
    const basis = marginUsdBasis({
      position: makeLong({ netContributedUsd: 2000, realizedPnlUsd: -150 }),
      market: LONG_MARKET,
    })
    expect(basis).toEqual({
      direction: MarginDirection.LONG,
      collateral: 5,
      debt: 8000,
      costBasisUsd: 2000,
      netContributedUsd: 2000,
      realizedPnlUsd: -150,
    })
  })

  it('omits the optional USD figures the wire did not send', () => {
    const basis = marginUsdBasis({ position: makeLong(), market: LONG_MARKET })
    expect(basis).not.toHaveProperty('netContributedUsd')
    expect(basis).not.toHaveProperty('realizedPnlUsd')
  })

  it('reports nothing at all when the server could not value the equity log', () => {
    expect(
      marginUsdBasis({ position: { ...makeLong(), costBasisUsd: undefined }, market: LONG_MARKET }),
    ).toBeUndefined()
  })

  it('reports nothing for a zero or negative basis rather than dividing by it', () => {
    expect(marginUsdBasis({ position: makeLong({ costBasisUsd: 0 }), market: LONG_MARKET })).toBeUndefined()
    expect(marginUsdBasis({ position: makeLong({ costBasisUsd: -1 }), market: LONG_MARKET })).toBeUndefined()
  })

  it('suppresses an untradable pair, whose direction — and so every USD figure — is a guess', () => {
    expect(marginUsdBasis({ position: makeLong({ isTradable: false }), market: LONG_MARKET })).toBeUndefined()
    expect(marginUsdBasis({ position: makeLong({ isTradable: true }), market: LONG_MARKET })).toBeDefined()
  })
})

describe('marginPositionMark', () => {
  it('reads the position row', () => {
    expect(marginPositionMark({ position: { oraclePrice: X18(2000) } })).toBeCloseTo(2000, 6)
  })

  it('is undefined at a non-positive mark, never 0', () => {
    expect(marginPositionMark({ position: { oraclePrice: '0' } })).toBeUndefined()
    expect(marginPositionMark({ position: { oraclePrice: '-1' } })).toBeUndefined()
  })
})

describe('marginUsdPnlAtPrice — LONG', () => {
  const basis = basisOf({ position: makeLong(), market: LONG_MARKET })

  it('is flat at the price the basis went in at', () => {
    // equity = 5·2000 − 8000 = 2000, which is the basis.
    const pnl = marginUsdPnlAtPrice({ basis, price: 2000 })
    expect(pnl?.equityUsd).toBeCloseTo(2000, 6)
    expect(pnl?.pnlUsd).toBeCloseTo(0, 6)
    expect(pnl?.pnlPct).toBeCloseTo(0, 6)
    expect(pnl?.floored).toBe(false)
  })

  it('levers a price move 5x onto the margin', () => {
    // equity = 5·2200 − 8000 = 3000 → +$1,000 on $2,000 of margin.
    const pnl = marginUsdPnlAtPrice({ basis, price: 2200 })
    expect(pnl?.pnlUsd).toBeCloseTo(1000, 6)
    expect(pnl?.pnlPct).toBeCloseTo(50, 6)
  })

  it('floors the percent at −100% past the price equity hits zero, keeping the raw value', () => {
    // equity = 5·1550 − 8000 = −250 → −$2,250 against a $2,000 basis = −112.5%.
    const pnl = marginUsdPnlAtPrice({ basis, price: 1550 })
    expect(pnl?.equityUsd).toBeCloseTo(-250, 6)
    expect(pnl?.pnlUsd).toBeCloseTo(-2250, 6)
    expect(pnl?.pnlPctRaw).toBeCloseTo(-112.5, 6)
    expect(pnl?.pnlPct).toBe(-100)
    expect(pnl?.floored).toBe(true)
  })

  it('leaves a total-but-not-worse loss unfloored', () => {
    // Equity reaches exactly 0 at debt/collateral = $1,600, which is lltv × the liquidation price.
    const pnl = marginUsdPnlAtPrice({ basis, price: 1600 })
    expect(pnl?.equityUsd).toBeCloseTo(0, 6)
    expect(pnl?.pnlPct).toBeCloseTo(-100, 6)
    expect(pnl?.floored).toBe(false)
  })

  it('reports nothing at a non-positive price instead of a fabricated total loss', () => {
    expect(marginUsdPnlAtPrice({ basis, price: 0 })).toBeUndefined()
    expect(marginUsdPnlAtPrice({ basis, price: -1 })).toBeUndefined()
  })
})

describe('marginUsdPnlAtPrice — SHORT', () => {
  const basis = basisOf({ position: makeShort(), market: SHORT_MARKET })

  it('is flat at the price the basis went in at', () => {
    // equity = 4000 − 1·2000 = 2000.
    expect(marginUsdPnlAtPrice({ basis, price: 2000 })?.pnlUsd).toBeCloseTo(0, 6)
  })

  it('profits on a fall and loses on a rise', () => {
    expect(marginUsdPnlAtPrice({ basis, price: 1800 })?.pnlUsd).toBeCloseTo(200, 6)
    expect(marginUsdPnlAtPrice({ basis, price: 1800 })?.pnlPct).toBeCloseTo(10, 6)
    expect(marginUsdPnlAtPrice({ basis, price: 2200 })?.pnlUsd).toBeCloseTo(-200, 6)
    expect(marginUsdPnlAtPrice({ basis, price: 2200 })?.pnlPct).toBeCloseTo(-10, 6)
  })

  it('floors the percent once the borrowed leg outgrows the collateral', () => {
    // equity = 4000 − 1·6500 = −2500 → −$4,500 against $2,000 = −225%.
    const pnl = marginUsdPnlAtPrice({ basis, price: 6500 })
    expect(pnl?.pnlPctRaw).toBeCloseTo(-225, 6)
    expect(pnl?.pnlPct).toBe(-100)
  })
})

describe('marginUsdPnlNow', () => {
  it('evaluates at the position row own mark', () => {
    expect(marginUsdPnlNow({ position: makeLong({ mark: 2200 }), market: LONG_MARKET })?.pnlUsd).toBeCloseTo(1000, 6)
  })

  it('is undefined when either the basis or the mark is unusable', () => {
    expect(marginUsdPnlNow({ position: makeLong({ mark: 0 }), market: LONG_MARKET })).toBeUndefined()
    expect(
      marginUsdPnlNow({ position: { ...makeLong(), costBasisUsd: undefined }, market: LONG_MARKET }),
    ).toBeUndefined()
  })
})

describe('marginUsdBreakEvenPrice', () => {
  it('LONG: the price that buys the basis back, not the borrowed leg fill price', () => {
    const basis = basisOf({ position: makeLong(), market: LONG_MARKET })
    expect(marginUsdBreakEvenPrice({ basis })).toBeCloseTo(2000, 6)
  })

  it('LONG: moves up with accrued interest, and by less than the token-count form', () => {
    // 5% accrued on the 8,000 debt. Token-count break-even would be debt/(C−E) = 8400/4 = $2,100.
    const basis = basisOf({ position: makeLong({ debt: 8400 }), market: LONG_MARKET })
    expect(marginUsdBreakEvenPrice({ basis })).toBeCloseTo(2080, 6)
  })

  it('LONG: a pure leverage retarget leaves it at the real break-even', () => {
    // Opened 1 WETH @ $2,000 3x (basis $2,000), retargeted to 5x at $3,000: 8.3333 WETH / $20,000 debt.
    // The token-count form reports $2,727.27 here; the true break-even is $2,640.
    const basis = basisOf({ position: makeLong({ collateral: 8.333333333333334, debt: 20000 }), market: LONG_MARKET })
    expect(marginUsdBreakEvenPrice({ basis })).toBeCloseTo(2640, 6)
  })

  it('SHORT: mirrors onto the collateral surplus', () => {
    const basis = basisOf({ position: makeShort(), market: SHORT_MARKET })
    expect(marginUsdBreakEvenPrice({ basis })).toBeCloseTo(2000, 6)
  })

  it('is undefined when the leg it divides by is empty', () => {
    const noCollateral = basisOf({ position: makeLong({ collateral: 0 }), market: LONG_MARKET })
    expect(marginUsdBreakEvenPrice({ basis: noCollateral })).toBeUndefined()
    const noDebt = basisOf({ position: makeShort({ debt: 0 }), market: SHORT_MARKET })
    expect(marginUsdBreakEvenPrice({ basis: noDebt })).toBeUndefined()
  })

  it('is undefined rather than negative for a short already worth less than its basis', () => {
    const basis = basisOf({ position: makeShort({ collateral: 1500 }), market: SHORT_MARKET })
    expect(marginUsdBreakEvenPrice({ basis })).toBeUndefined()
  })
})
