import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { describe, expect, it } from 'vitest'
import {
  marginAdjustSwapSide,
  marginPriceImpactBps,
  marginPriceImpactSeverity,
} from '~/pages/Swap/Margin/marginPriceImpact'

const WAD = 10n ** 18n
const x18 = (whole: number): string => (BigInt(whole) * WAD).toString()
// MarginQuoteBL runs both prices through toDisplayPriceX18, which reciprocates for a SHORT.
const reciprocated = (raw: string): string => ((WAD * WAD) / BigInt(raw)).toString()

// Eight combinations: {LONG, SHORT} x {BUY_COLLATERAL, SELL_COLLATERAL} x {adverse, favourable}.
// The SHORT rows are the LONG rows with both prices reciprocated, and must report the SAME bps —
// that is the property that makes the row mean one thing across the product.
describe('marginPriceImpactBps', () => {
  // measured: 20 ETH out of the thin WETH-keyed pool at 2465 against a 1912 mark
  const BUY_ADVERSE = { exec: x18(2465), mark: x18(1912), bps: 2892 }
  // measured: repaying on the thin pool fills at 1727 against a 1912 mark
  const SELL_ADVERSE = { exec: x18(1727), mark: x18(1912), bps: 967 }

  describe('BUY_COLLATERAL (open, lever-up) — paying above the mark is adverse', () => {
    it('reports the overpay on a LONG', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: BUY_ADVERSE.exec,
          markPriceX18: BUY_ADVERSE.mark,
          swapSide: 'BUY_COLLATERAL',
          direction: 'LONG',
        }),
      ).toBe(BUY_ADVERSE.bps)
    })

    it('reports the same bps on a SHORT, whose prices arrive reciprocated', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: reciprocated(BUY_ADVERSE.exec),
          markPriceX18: reciprocated(BUY_ADVERSE.mark),
          swapSide: 'BUY_COLLATERAL',
          direction: 'SHORT',
        }),
      ).toBe(BUY_ADVERSE.bps)
    })

    it('clamps a favourable LONG fill to zero rather than reporting a negative', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: x18(1900),
          markPriceX18: x18(1912),
          swapSide: 'BUY_COLLATERAL',
          direction: 'LONG',
        }),
      ).toBe(0)
    })

    it('clamps a favourable SHORT fill to zero', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: reciprocated(x18(1900)),
          markPriceX18: reciprocated(x18(1912)),
          swapSide: 'BUY_COLLATERAL',
          direction: 'SHORT',
        }),
      ).toBe(0)
    })
  })

  describe('SELL_COLLATERAL (delever, close) — receiving below the mark is adverse', () => {
    it('reports the shortfall on a LONG', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: SELL_ADVERSE.exec,
          markPriceX18: SELL_ADVERSE.mark,
          swapSide: 'SELL_COLLATERAL',
          direction: 'LONG',
        }),
      ).toBe(SELL_ADVERSE.bps)
    })

    it('reports the same bps on a SHORT, whose prices arrive reciprocated', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: reciprocated(SELL_ADVERSE.exec),
          markPriceX18: reciprocated(SELL_ADVERSE.mark),
          swapSide: 'SELL_COLLATERAL',
          direction: 'SHORT',
        }),
      ).toBe(SELL_ADVERSE.bps)
    })

    it('clamps a favourable LONG fill to zero', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: x18(1930),
          markPriceX18: x18(1912),
          swapSide: 'SELL_COLLATERAL',
          direction: 'LONG',
        }),
      ).toBe(0)
    })

    it('clamps a favourable SHORT fill to zero', () => {
      expect(
        marginPriceImpactBps({
          execPriceX18: reciprocated(x18(1930)),
          markPriceX18: reciprocated(x18(1912)),
          swapSide: 'SELL_COLLATERAL',
          direction: 'SHORT',
        }),
      ).toBe(0)
    })
  })

  // A plain deposit or withdraw with no leverage retarget has no swap leg, so the adjust quote
  // carries no execPriceX18; an unreadable oracle yields a zero mark. Both must hide the row.
  describe('absent inputs hide the row rather than rendering NaN', () => {
    it.each([
      ['no exec price', undefined, x18(1912)],
      ['no mark', x18(2465), undefined],
      ['a zero mark', x18(2465), '0'],
      ['a zero exec', '0', x18(1912)],
    ])('returns undefined when there is %s', (_label, execPriceX18, markPriceX18) => {
      expect(
        marginPriceImpactBps({ execPriceX18, markPriceX18, swapSide: 'BUY_COLLATERAL', direction: 'LONG' }),
      ).toBeUndefined()
    })
  })
})

describe('marginAdjustSwapSide', () => {
  it('reads a decrease bound as selling collateral', () => {
    expect(marginAdjustSwapSide({ decrease: { debtToRepay: '1', maxCollateralIn: '2' } })).toBe('SELL_COLLATERAL')
  })

  it('reads an increase bound as buying collateral', () => {
    expect(marginAdjustSwapSide({ increase: { collateralToBuy: '1', maxDebtIn: '2' } })).toBe('BUY_COLLATERAL')
  })

  it.each([
    ['no bounds at all', undefined],
    ['equity-only bounds — a plain deposit', { equity: { equityDelta: '1' } }],
  ])(
    'defaults to BUY_COLLATERAL with %s, which is inert because such a quote carries no effectivePrice',
    (_label, bounds) => {
      expect(marginAdjustSwapSide(bounds)).toBe('BUY_COLLATERAL')
    },
  )
})

// This gate decides whether the row renders at all, so pin its boundaries. Strict > matches the swap
// surface (getPriceImpactWarning), so exactly-at-threshold does not warn.
describe('marginPriceImpactSeverity', () => {
  it.each([
    [0, undefined],
    [499, undefined],
    [500, undefined],
    [501, WarningSeverity.Medium],
    [999, WarningSeverity.Medium],
    [1000, WarningSeverity.Medium],
    [1001, WarningSeverity.High],
  ])('maps %i bps to %s', (bps, expected) => {
    expect(marginPriceImpactSeverity(bps)).toBe(expected)
  })

  it('is undefined when there is no figure', () => {
    expect(marginPriceImpactSeverity(undefined)).toBeUndefined()
  })
})
