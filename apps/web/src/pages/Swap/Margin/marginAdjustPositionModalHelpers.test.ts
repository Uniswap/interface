import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import { parseUnits } from '~/chains'
import {
  clampManageLeverage,
  computeDisplayedLeverage,
  computeFundingDisplay,
  computeGasDisplay,
  computeIsBeforeAfterDimmed,
  computeIsEditStale,
  computeShowInitialSkeleton,
  floorToSubmittable,
  formatMarginPrefill,
} from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

describe('formatMarginPrefill', () => {
  it('cuts an 18-decimal equity down to six significant digits', () => {
    expect(formatMarginPrefill({ raw: 16225510668000000n, decimals: 18 })).toBe('0.0162255')
  })

  // A float round-trip (Number(v.toPrecision(6)).toFixed(18)) yields '0.052999999999999999' here — a
  // longer, uglier string than the input, which is the exact defect this helper exists to remove.
  it('does not reintroduce a float tail', () => {
    expect(formatMarginPrefill({ raw: 53000000000000000n, decimals: 18 })).toBe('0.053')
  })

  it('never returns exponential notation for a tiny amount', () => {
    const out = formatMarginPrefill({ raw: 100n, decimals: 18 })
    expect(out).toBe('0.0000000000000001')
    expect(out).not.toMatch(/e/i)
  })

  it('trims trailing zeros rather than padding out to the token decimals', () => {
    expect(formatMarginPrefill({ raw: 20000000n, decimals: 6 })).toBe('20')
  })

  it('spends the six digits on the integer part when there is one', () => {
    expect(formatMarginPrefill({ raw: 1234567800000000000000n, decimals: 18 })).toBe('1234.56')
  })

  it('collapses a zero balance to a bare 0, not a field full of zeroes', () => {
    expect(formatMarginPrefill({ raw: 0n, decimals: 18 })).toBe('0')
  })

  it('round-trips through parseUnits without throwing', () => {
    const out = formatMarginPrefill({ raw: 16225510668000000n, decimals: 18 })
    expect(() => parseUnits(out, 18)).not.toThrow()
  })

  // Truncation, never rounding: the prefill must not claim more equity than the position holds, or a
  // max-fill would price above the real ceiling.
  it('only ever truncates', () => {
    const raw = 16225510668000000n
    expect(parseUnits(formatMarginPrefill({ raw, decimals: 18 }), 18) <= raw).toBe(true)
  })
})

describe('computeIsEditStale', () => {
  it('is stale while the debounce is still counting down', () => {
    expect(computeIsEditStale({ isDebouncing: true, isPlaceholderData: false })).toBe(true)
  })

  it('is stale while bridging a keepPreviousData placeholder quote', () => {
    expect(computeIsEditStale({ isDebouncing: false, isPlaceholderData: true })).toBe(true)
  })

  it('is settled once neither is true — the ~20s background refetch never sets either', () => {
    expect(computeIsEditStale({ isDebouncing: false, isPlaceholderData: false })).toBe(false)
  })
})

describe('computeIsBeforeAfterDimmed', () => {
  it('dims on an edit transition alone', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: true, hasQuoteError: false })).toBe(true)
  })

  it('dims on a quote error alone — the latched-quote-under-error case', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: false, hasQuoteError: true })).toBe(true)
  })

  it('does not dim once settled with no error', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: false, hasQuoteError: false })).toBe(false)
  })
})

describe('computeShowInitialSkeleton', () => {
  it('shows while the first quote is in flight and nothing has landed yet', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(true)
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: false,
        isDebouncing: true,
      }),
    ).toBe(true)
  })

  it('hides once a quote (or a latched last-good one) exists, even mid-refetch', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: true,
        hasLastGoodQuote: false,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(false)
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: true,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(false)
  })

  it('hides once neither loading nor debouncing, even with nothing landed (e.g. a disabled query)', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: false,
        isDebouncing: false,
      }),
    ).toBe(false)
  })
})

describe('computeDisplayedLeverage', () => {
  const BASE = { collateral: 1, debt: 0, mark: 1, deltaE: 0n, collateralDecimals: 18, direction: MarginDirection.LONG }

  // `locked` READS OUT the position's own leverage, so it is not capped: showing the cap for a position
  // that drifted above it misstates the position itself. The slider pins its own thumb at cap, so an
  // over-cap readout cannot overflow the track.
  //
  // The readout is NOT always what the request wires — above the venue's ceiling a non-withdraw adjust
  // deliberately sends no target at all (see useMarginAdjustController). The figure still states what
  // the position holds today, which is the question this readout answers.
  it('reports an over-cap position at its real leverage when locked', () => {
    expect(computeDisplayedLeverage({ ...BASE, mode: { kind: 'locked' }, currentLeverage: 6, venueCap: 4 })).toBe(6)
  })

  it('still floors a locked readout at the manage minimum', () => {
    expect(computeDisplayedLeverage({ ...BASE, mode: { kind: 'locked' }, currentLeverage: 1.001, venueCap: 4 })).toBe(
      1.01,
    )
  })

  // A dragged value IS a control value, so it stays bounded by the track.
  it('clamps an explicit value to the venue ceiling', () => {
    expect(
      computeDisplayedLeverage({ ...BASE, mode: { kind: 'explicit', value: 9 }, currentLeverage: 2, venueCap: 4 }),
    ).toBe(4)
  })

  // Absence of a ceiling is not a low ceiling. The readout is what states what Confirm submits, and
  // the request wires the explicit value unclamped — bounding the readout at the slider's floored
  // `cap` made the two disagree by the whole distance between 1.10x and what the user chose.
  it('leaves an explicit value alone when the market publishes no ceiling', () => {
    expect(
      computeDisplayedLeverage({
        ...BASE,
        mode: { kind: 'explicit', value: 5 },
        currentLeverage: 2,
        venueCap: undefined,
      }),
    ).toBe(5)
  })
})

// Two claims the readout must keep apart. `driftLeverageForEquityDelta` reports UNDEFINED for a mark it
// cannot price (nothing to state → fall back to what the position holds) and +INFINITY for a projection
// at or past liquidation (a real answer → pass it through, rendered as ∞). Collapsing them either
// renders "Infinity" as a literal string or, worse, reports an at-liquidation projection as unchanged.
describe('computeDisplayedLeverage on an unprojectable drift', () => {
  const UNPROJECTABLE = {
    mode: { kind: 'drift' } as const,
    currentLeverage: 2,
    collateral: 1,
    debt: 100,
    // An unpriceable mark: driftLeverageForEquityDelta reports undefined, not +Infinity.
    mark: 0,
    deltaE: 0n,
    collateralDecimals: 18,
    direction: MarginDirection.LONG,
  }

  it('falls back to the position leverage rather than rendering a non-finite value', () => {
    expect(computeDisplayedLeverage({ ...UNPROJECTABLE, venueCap: undefined })).toBe(2)
  })

  it('does the same where a published ceiling merely hid it behind a Math.min', () => {
    expect(computeDisplayedLeverage({ ...UNPROJECTABLE, venueCap: 4 })).toBe(2)
  })

  // A PROJECTION is not a chosen value. Drift sends no target, so the server bounds the withdraw by
  // maxWithdrawable — a health-floor limit above the venue cap — and the position genuinely lands where
  // this says. Clamping printed 5.00x for a withdraw landing past the ceiling, with Confirm armed.
  it('reports a finite projection past the venue ceiling, rather than substituting the ceiling', () => {
    // collateral 1 @ mark 2000 against debt 1750 → ltv 0.875 → balance sheet 8x.
    const overCap = { ...UNPROJECTABLE, mark: 2000, collateral: 1, debt: 1750, deltaE: 0n }
    expect(computeDisplayedLeverage({ ...overCap, venueCap: 5 })).toBeCloseTo(8, 6)
  })

  // Drift sends no target, so nothing the request carries can disagree with this figure — which is why
  // the position's own leverage is a safe fallback here and would NOT be one on the explicit arm.
  it('still floors the fallback at the manage minimum', () => {
    expect(computeDisplayedLeverage({ ...UNPROJECTABLE, currentLeverage: 1, venueCap: undefined })).toBe(
      MANAGE_MIN_LEVERAGE,
    )
  })

  // The claim the fallback must NOT swallow. An INSOLVENT projection is a real answer, not a failure to
  // compute: drag the margin down and the readout climbs 8x, 12x, 40x — substituting the current
  // leverage the moment it crosses liquidation would render the most dangerous state on the sheet as
  // "nothing is changing". It passes through instead; the slider pins and the track colour reads
  // at-risk.
  // collateralHeld refuses a SHORT it cannot measure, and that refusal now reaches here — an
  // unmeasurable balance sheet is the same "no projection" claim as an unpriceable mark, not a reason
  // to fabricate one.
  it('treats an unmeasurable collateral as no projection, not as a fabricated balance sheet', () => {
    expect(computeDisplayedLeverage({ ...UNPROJECTABLE, mark: 2000, collateral: undefined, venueCap: 4 })).toBe(2)
  })

  it.each([
    ['a projection at or past liquidation', { mark: 2000, collateral: 1, debt: 3000, deltaE: 0n }],
    ['a withdrawal past the whole position', { mark: 2000, collateral: 1, debt: 100, deltaE: -2n * 10n ** 18n }],
  ])('reports %s as Infinity rather than the current leverage', (_label, over) => {
    expect(computeDisplayedLeverage({ ...UNPROJECTABLE, ...over, venueCap: 4 })).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('clampManageLeverage', () => {
  it('holds a chosen value inside the venue ceiling', () => {
    expect(clampManageLeverage({ leverage: 9, venueCap: 4 })).toBe(4)
  })

  it('floors at the manage minimum, which sits above the backend’s exclusive 1.0 bound', () => {
    expect(clampManageLeverage({ leverage: 1, venueCap: 4 })).toBe(MANAGE_MIN_LEVERAGE)
  })

  // The reason the ceiling is the PUBLISHED one: `cap` floors to MIN_LEVERAGE where none is published,
  // so bounding there would snap every chosen value to 1.10x with no way back.
  it('imposes no ceiling when the market publishes none', () => {
    expect(clampManageLeverage({ leverage: 9, venueCap: undefined })).toBe(9)
  })
})

// The adjust modals' network-cost row. The open flow's twin reads these two fields through the same
// guarded decoders; this path had neither, and no test, so the gap survived the fix that landed there.
describe('computeGasDisplay', () => {
  const formatNumberOrString = ({ value, type }: { value: number; type: NumberType }): string =>
    `${type === NumberType.FiatGasPrice ? '$' : ''}${value.toFixed(2)}`

  it('reports the USD figure when the server priced it', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '2100000000000000', gasFeeUsd: `${7n * 10n ** 18n}` },
        formatNumberOrString,
      }),
    ).toBe('$7.00')
  })

  // '0' is the wire's "could not price", not a free transaction — and it is a truthy STRING, so a bare
  // `if (gasFeeUsd)` renders $0.00 and hides the real cost that is sitting in gasFeeWei.
  it('falls through to the ETH figure on the zero-USD sentinel rather than reporting $0.00', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '2100000000000000', gasFeeUsd: '0' },
        formatNumberOrString,
      }),
    ).toBe('0.00210 ETH')
  })

  // A bare BigInt() throws a SyntaxError on a non-integer, which would unwind the whole modal.
  it('reports nothing, rather than throwing, on wire values that are not integers', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '1.5', gasFeeUsd: '2.5' },
        formatNumberOrString,
      }),
    ).toBeUndefined()
  })

  it('reports nothing when the quote carries no gas estimate at all', () => {
    expect(computeGasDisplay({ gasEstimate: undefined, formatNumberOrString })).toBeUndefined()
  })
})

// The site that had the bug: a plain truthiness test on `equityInRaw`, which the truthy STRING '0'
// walks straight through, captioning the wire's absent sentinel as "≈ 0".
describe('computeFundingDisplay', () => {
  const BASE = {
    funding: { kind: 'deposit', paymentAmountRaw: '1000000000' } as const,
    paymentToken: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, decimals: 6, symbol: 'USDC' },
    collateralDecimals: 18,
    isPaymentTokenCollateral: false,
    isQuoteStale: false,
  }
  const call = (over: Record<string, unknown> = {}): ReturnType<typeof computeFundingDisplay> =>
    computeFundingDisplay({ ...BASE, ...over } as Parameters<typeof computeFundingDisplay>[0])

  it('states the landed collateral when the quote answers the current input', () => {
    expect(call({ equityInRaw: '980000000000000000' }).equityInHuman).toBe(0.98)
  })

  it.each(['0', '', undefined])('withholds the conversion figure for an unusable leg (%s)', (equityInRaw) => {
    expect(call({ equityInRaw }).equityInHuman).toBeUndefined()
  })

  it('withholds it while the quote is stale, and when the payment token IS the collateral', () => {
    expect(call({ equityInRaw: '980000000000000000', isQuoteStale: true }).equityInHuman).toBeUndefined()
    expect(call({ equityInRaw: '980000000000000000', isPaymentTokenCollateral: true }).equityInHuman).toBeUndefined()
  })
})

// Max must always produce a SUBMITTABLE amount: `maxMarginHuman` is a double, so writing its full
// binary expansion can land a few hundred wei ABOVE the true ceiling and leave Confirm disabled on
// `insufficientBalance` — roughly a coin flip on the ULP's sign.
describe('floorToSubmittable', () => {
  it('never returns more than it was given', () => {
    for (const value of [11, 0.1, 1 / 3, 2.675, 1e-9, 1234.56789]) {
      const written = floorToSubmittable({ value, decimals: 18 })
      expect(Number(written)).toBeLessThanOrEqual(value)
    }
  })

  // The concrete shape of the bug: toFixed(18) of a double writes a tail that can exceed the ceiling.
  it('drops the binary tail that toFixed would write', () => {
    const value = 0.1 + 0.2 // 0.30000000000000004
    expect(value.toFixed(18)).toMatch(/^0\.30000000000000/)
    expect(floorToSubmittable({ value, decimals: 18 })).toBe('0.300000000000')
  })

  // A 6-decimal collateral has no room to shed, so it keeps every decimal — but still TRUNCATED.
  it('writes full precision when the token has fewer decimals than the guard', () => {
    expect(floorToSubmittable({ value: 1.5, decimals: 6 })).toBe('1.500000')
  })

  // `toFixed(6)` rounds half-up to '1.500000' and overshoots. A cross-token max is a USD-ratio
  // ESTIMATE, so a value like this is entirely ordinary — and overshooting is the dead Max button.
  it('truncates rather than rounding on a token with few decimals', () => {
    expect(floorToSubmittable({ value: 1.4999999, decimals: 6 })).toBe('1.499999')
  })

  // The carry case: every earlier fixture is exact one digit past the cut, so a render width of
  // `cut + 1` rounded harmlessly and the contract looked satisfied. A run of 9s past the cut is what
  // pushes the rounding into the kept digits.
  it('does not let a rounding carry climb into the kept digits', () => {
    expect(floorToSubmittable({ value: 2.99999999, decimals: 6 })).toBe('2.999999')
    expect(floorToSubmittable({ value: 0.99999999, decimals: 6 })).toBe('0.999999')
  })

  it.each([6, 8, 18])('never exceeds the input at %i decimals', (decimals) => {
    for (const value of [1.4999999, 2.675, 1 / 3, 0.1 + 0.2, 1234.56789, 2.99999999, 0.99999999, 9.9999999999]) {
      expect(Number(floorToSubmittable({ value, decimals }))).toBeLessThanOrEqual(value)
    }
  })
})
