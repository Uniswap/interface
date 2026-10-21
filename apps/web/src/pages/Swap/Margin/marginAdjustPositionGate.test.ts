import { describe, expect, it } from 'vitest'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import {
  ADJUST_MIN_LEVERAGE_DELTA,
  deriveAdjustFunding,
  deriveEquityDeltaRaw,
  getAdjustConfirmDisabled,
  getAdjustTargetLeverageX18,
  hasAdjustChange,
  hasInsufficientAddBalance,
  isWithdrawOverMax,
  visibleMatchesSubmitted,
  type AdjustLeverageMode,
} from '~/pages/Swap/Margin/marginAdjustPositionGate'

describe('getAdjustTargetLeverageX18', () => {
  it('sends no target in drift mode', () => {
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'drift' }, currentLeverage: 2.3456 })).toBeUndefined()
  })

  // Floors rather than rounds: `locked` holds leverage constant, so the 2-decimal step must never
  // wire MORE leverage than the position actually holds.
  it('pins the target at current leverage, floored to 2 decimals, when locked', () => {
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'locked' }, currentLeverage: 2.3456 })).toBe(
      (234n * 10n ** 16n).toString(), // 2.34 * 1e18
    )
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'locked' }, currentLeverage: 2.999 })).toBe(
      (299n * 10n ** 16n).toString(), // 2.99 * 1e18 — never rounds up to 3.00
    )
  })

  it('sends the dragged value (2 decimals) when explicit', () => {
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'explicit', value: 3.001 }, currentLeverage: 2 })).toBe(
      (300n * 10n ** 16n).toString(),
    ) // 3.00 * 1e18
  })

  // Defence in depth: no caller can reach these today (the numeric input rejects non-finite input,
  // the slider clamps to a cap that is always finite, and `locked` is pre-empted upstream whenever
  // the position reports no leverage). Pinned because the alternative is parseUnits throwing out of
  // render on a malformed decimal — refusing the target is the safe half of that trade.
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'refuses a non-finite target rather than wiring a malformed decimal (%p)',
    (value) => {
      expect(getAdjustTargetLeverageX18({ mode: { kind: 'explicit', value }, currentLeverage: 2 })).toBeUndefined()
      expect(getAdjustTargetLeverageX18({ mode: { kind: 'locked' }, currentLeverage: value })).toBeUndefined()
    },
  )
})

describe('deriveEquityDeltaRaw', () => {
  const collateralDecimals = 18

  it('is exactly 0n while untouched, regardless of what the pre-fill shows', () => {
    expect(
      deriveEquityDeltaRaw({
        marginInput: '1.23456789',
        marginInputDirty: false,
        currentEquityRaw: 999_999_999_999n,
        collateralDecimals,
      }),
    ).toBe(0n)
  })

  it('absorbs the display-rounding phantom delta once dirty (re-typing the same rounded pre-fill)', () => {
    // currentEquity carries 7 wei of sub-display precision; the pre-fill would display as "1".
    const currentEquityRaw = 1_000_000_000_000_000_007n
    expect(
      deriveEquityDeltaRaw({ marginInput: '1', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(0n)
  })

  it('absorbs a truncation-scale residue (dust deadband)', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n // 1.0
    // Δ = 1.00001 − 1.0 = 1e13, under 0.5bp of 1e18 (5e13) — the scale the 6-significant-digit
    // prefill can leave behind.
    expect(
      deriveEquityDeltaRaw({ marginInput: '1.00001', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(0n)
  })

  // The band absorbs re-typing the prefill, not real money: on a large position a wider band would
  // swallow a meaningful edit and disable Confirm with nothing on screen to explain it.
  it('keeps a 1bp edit — well above truncation scale', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n // 1.0
    expect(
      deriveEquityDeltaRaw({ marginInput: '1.0001', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(100_000_000_000_000n)
  })

  it('derives a positive (deposit-direction) delta for a real increase past the deadband', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n // 1.0
    expect(
      deriveEquityDeltaRaw({ marginInput: '1.5', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(500_000_000_000_000_000n)
  })

  it('derives a negative (withdraw-direction) delta for a real decrease past the deadband', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n // 1.0
    expect(
      deriveEquityDeltaRaw({ marginInput: '0.5', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(-500_000_000_000_000_000n)
  })

  it('treats "0" as a valid target (a full withdraw-to-zero), not as unparseable', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n // 1.0
    expect(
      deriveEquityDeltaRaw({ marginInput: '0', marginInputDirty: true, currentEquityRaw, collateralDecimals }),
    ).toBe(-1_000_000_000_000_000_000n)
  })

  it('reads unparseable input (blank, non-numeric, or negative) as untouched (0n)', () => {
    const currentEquityRaw = 1_000_000_000_000_000_000n
    for (const marginInput of ['', '   ', 'abc', '-5']) {
      expect(deriveEquityDeltaRaw({ marginInput, marginInputDirty: true, currentEquityRaw, collateralDecimals })).toBe(
        0n,
      )
    }
  })
})

describe('deriveAdjustFunding', () => {
  const BASE = {
    paymentTokenDecimals: 18,
    collateralDecimals: 18,
    isPaymentTokenCollateral: true,
  }

  it('is none at Δ=0, regardless of any other param', () => {
    expect(deriveAdjustFunding({ ...BASE, deltaCollateralRaw: 0n })).toEqual({ kind: 'none' })
  })

  it('is withdraw(−Δ) in collateral units at Δ<0', () => {
    expect(deriveAdjustFunding({ ...BASE, deltaCollateralRaw: -500_000_000_000_000_000n })).toEqual({
      kind: 'withdraw',
      withdrawAmountRaw: '500000000000000000',
    })
  })

  it('is an EXACT deposit of Δ when paying with the collateral token, independent of decimals/prices', () => {
    const deltaCollateralRaw = 1_500_000_000_000_000_000n // 1.5 WETH
    expect(
      deriveAdjustFunding({
        ...BASE,
        deltaCollateralRaw,
        // Deliberately mismatched/missing — must have zero effect on this branch.
        paymentTokenDecimals: 6,
        collateralUsdPrice: undefined,
        paymentTokenUsdPrice: undefined,
      }),
    ).toEqual({ kind: 'deposit', paymentAmountRaw: deltaCollateralRaw.toString() })
  })

  it('scales Δ by the USD price ratio when paying cross-token at matching decimals', () => {
    // Δ = 1 WETH, collateral $2000, pay-token $1 (same 18 decimals) → 2000 pay-tokens.
    expect(
      deriveAdjustFunding({
        ...BASE,
        deltaCollateralRaw: 1_000_000_000_000_000_000n,
        isPaymentTokenCollateral: false,
        paymentTokenDecimals: 18,
        collateralUsdPrice: 2000,
        paymentTokenUsdPrice: 1,
      }),
    ).toEqual({ kind: 'deposit', paymentAmountRaw: (2000n * 10n ** 18n).toString() })
  })

  it('rescales decimals when the pay token has FEWER decimals than collateral (18 → 6, e.g. WETH collateral, USDC pay)', () => {
    // Δ = 1 WETH, collateral $2000, pay-token (USDC-shaped, 6 decimals) $1 → 2000 USDC raw.
    expect(
      deriveAdjustFunding({
        ...BASE,
        deltaCollateralRaw: 1_000_000_000_000_000_000n,
        isPaymentTokenCollateral: false,
        paymentTokenDecimals: 6,
        collateralUsdPrice: 2000,
        paymentTokenUsdPrice: 1,
      }),
    ).toEqual({ kind: 'deposit', paymentAmountRaw: (2000n * 10n ** 6n).toString() })
  })

  it('rescales decimals when the pay token has MORE decimals than collateral (6 → 18, e.g. USDC collateral, WETH pay)', () => {
    // Δ = 1000 USDC (6-dec collateral), collateral $1, pay-token (WETH-shaped, 18 decimals) $2000 →
    // 1000·(1/2000) = 0.5 WETH raw.
    expect(
      deriveAdjustFunding({
        deltaCollateralRaw: 1000n * 10n ** 6n,
        collateralDecimals: 6,
        isPaymentTokenCollateral: false,
        paymentTokenDecimals: 18,
        collateralUsdPrice: 1,
        paymentTokenUsdPrice: 2000,
      }),
    ).toEqual({ kind: 'deposit', paymentAmountRaw: (5n * 10n ** 17n).toString() })
  })

  it('disables (empty paymentAmountRaw) when either USD price is missing', () => {
    const params = {
      ...BASE,
      deltaCollateralRaw: 1_000_000_000_000_000_000n,
      isPaymentTokenCollateral: false,
      paymentTokenDecimals: 6,
    }
    expect(deriveAdjustFunding({ ...params, collateralUsdPrice: undefined, paymentTokenUsdPrice: 1 })).toEqual({
      kind: 'deposit',
      paymentAmountRaw: '',
    })
    expect(deriveAdjustFunding({ ...params, collateralUsdPrice: 2000, paymentTokenUsdPrice: undefined })).toEqual({
      kind: 'deposit',
      paymentAmountRaw: '',
    })
  })

  it('disables (empty paymentAmountRaw) when either USD price is non-positive (a broken feed)', () => {
    const params = {
      ...BASE,
      deltaCollateralRaw: 1_000_000_000_000_000_000n,
      isPaymentTokenCollateral: false,
      paymentTokenDecimals: 6,
    }
    expect(deriveAdjustFunding({ ...params, collateralUsdPrice: 0, paymentTokenUsdPrice: 1 })).toEqual({
      kind: 'deposit',
      paymentAmountRaw: '',
    })
    expect(deriveAdjustFunding({ ...params, collateralUsdPrice: 2000, paymentTokenUsdPrice: -1 })).toEqual({
      kind: 'deposit',
      paymentAmountRaw: '',
    })
  })
})

describe('hasAdjustChange', () => {
  const DRIFT: AdjustLeverageMode = { kind: 'drift' }
  const LOCKED: AdjustLeverageMode = { kind: 'locked' }

  it('is true whenever funding is not none, regardless of leverage mode', () => {
    expect(
      hasAdjustChange({ funding: { kind: 'deposit', paymentAmountRaw: '1' }, mode: DRIFT, currentLeverage: 2 }),
    ).toBe(true)
    expect(
      hasAdjustChange({ funding: { kind: 'withdraw', withdrawAmountRaw: '1' }, mode: LOCKED, currentLeverage: 2 }),
    ).toBe(true)
  })

  it('is false for no funding in drift or locked mode (neither ever moves leverage on its own)', () => {
    expect(hasAdjustChange({ funding: { kind: 'none' }, mode: DRIFT, currentLeverage: 2 })).toBe(false)
    expect(hasAdjustChange({ funding: { kind: 'none' }, mode: LOCKED, currentLeverage: 2 })).toBe(false)
  })

  it('is false for no funding with an explicit target inside the min-delta deadband', () => {
    expect(
      hasAdjustChange({ funding: { kind: 'none' }, mode: { kind: 'explicit', value: 2.04 }, currentLeverage: 2 }),
    ).toBe(false)
  })

  it('is true for no funding with an explicit target clearing the deadband, either direction', () => {
    expect(
      hasAdjustChange({ funding: { kind: 'none' }, mode: { kind: 'explicit', value: 2.3 }, currentLeverage: 2 }),
    ).toBe(true)
    expect(
      hasAdjustChange({ funding: { kind: 'none' }, mode: { kind: 'explicit', value: 1.7 }, currentLeverage: 2 }),
    ).toBe(true)
  })

  // The drift + funding shape Add margin and Withdraw margin produce: no target ever, so the funding
  // side is the ONLY thing that can make the CTA live. A regression that let drift contribute a
  // target would arm Confirm on a modal the user has not touched.
  it.each([
    ['a deposit', { kind: 'deposit', paymentAmountRaw: '500000000000000000' } as const, true],
    [
      'an empty-amount deposit (cross-token, price unavailable)',
      { kind: 'deposit', paymentAmountRaw: '' } as const,
      true,
    ],
    ['a withdraw', { kind: 'withdraw', withdrawAmountRaw: '1' } as const, true],
    ['no funding', { kind: 'none' } as const, false],
  ])('drift mode: %s decides on its own (Add margin / Withdraw margin)', (_name, funding, expected) => {
    expect(hasAdjustChange({ funding, mode: DRIFT, currentLeverage: 2 })).toBe(expected)
    // A debt-free position reads currentLeverage 1; drift must still ignore it entirely.
    expect(hasAdjustChange({ funding, mode: DRIFT, currentLeverage: 1 })).toBe(expected)
  })

  // Change leverage opens in drift with no funding, so its first render must be a no-change.
  it('drift mode with no funding is a no-change at every leverage (Change leverage on open)', () => {
    for (const currentLeverage of [1, 1.1, 2, 5, 20]) {
      expect(hasAdjustChange({ funding: { kind: 'none' }, mode: DRIFT, currentLeverage })).toBe(false)
    }
  })

  it('sits right on either side of the ADJUST_MIN_LEVERAGE_DELTA boundary', () => {
    expect(
      hasAdjustChange({
        funding: { kind: 'none' },
        mode: { kind: 'explicit', value: 2 + ADJUST_MIN_LEVERAGE_DELTA + 0.001 },
        currentLeverage: 2,
      }),
    ).toBe(true)
    expect(
      hasAdjustChange({
        funding: { kind: 'none' },
        mode: { kind: 'explicit', value: 2 + ADJUST_MIN_LEVERAGE_DELTA - 0.001 },
        currentLeverage: 2,
      }),
    ).toBe(false)
  })
})

describe('getAdjustConfirmDisabled', () => {
  const READY = {
    canManage: true,
    hasAccount: true,
    hasChange: true,
    funding: { kind: 'withdraw', withdrawAmountRaw: '1' } as AdjustFunding,
    hasQuote: true,
    hasQuoteError: false,
    isQuoteLoading: false,
    isPlaceholderData: false,
    isDebouncing: false,
    insufficientBalance: false,
    overMax: false,
    visibleMatchesSubmitted: true,
    isPlanInFlight: false,
  }

  // A deposit whose payment amount never resolved is unpriceable: the request builder refuses to build
  // it, and the gate now says so locally rather than inheriting the invariant from three files away.
  it('disables confirm for a deposit with no resolved payment amount', () => {
    expect(getAdjustConfirmDisabled({ ...READY, funding: { kind: 'deposit', paymentAmountRaw: '' } })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, funding: { kind: 'deposit', paymentAmountRaw: '100' } })).toBe(false)
  })

  // isFetching is deliberately NOT a parameter: a background refetch of an unchanged key must not
  // gate the CTA. That behaviour is exercised end-to-end in useMarginAdjustController.test.tsx —
  // there is nothing to assert here beyond the absence of the input.
  it('enables confirm when every gate is satisfied', () => {
    expect(getAdjustConfirmDisabled(READY)).toBe(false)
  })

  it('disables confirm without a change, an account, or a manageable position', () => {
    expect(getAdjustConfirmDisabled({ ...READY, hasChange: false })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, hasAccount: false })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, canManage: false })).toBe(true)
  })

  it('disables confirm while the quote is missing, loading, bridging a placeholder, or debouncing', () => {
    expect(getAdjustConfirmDisabled({ ...READY, hasQuote: false })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, isQuoteLoading: true })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, isPlaceholderData: true })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, isDebouncing: true })).toBe(true)
  })

  // React Query keeps `data` on error, so a failing same-key poll leaves quote+echo in hand and every
  // other gate satisfied. Without this the CTA stays live under the red error text.
  it('disables confirm while a quote error is showing, even with an echoed quote in hand', () => {
    expect(getAdjustConfirmDisabled({ ...READY, hasQuoteError: true })).toBe(true)
  })

  it('disables confirm on insufficient balance or an over-max withdraw', () => {
    expect(getAdjustConfirmDisabled({ ...READY, insufficientBalance: true })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, overMax: true })).toBe(true)
  })

  it('disables confirm when the visible input has moved past what was priced, or a plan is in flight', () => {
    expect(getAdjustConfirmDisabled({ ...READY, visibleMatchesSubmitted: false })).toBe(true)
    expect(getAdjustConfirmDisabled({ ...READY, isPlanInFlight: true })).toBe(true)
  })
})

describe('isWithdrawOverMax', () => {
  it('is false while the amount or the server max is absent (stays permissive)', () => {
    expect(isWithdrawOverMax({ withdrawAmountRaw: undefined, maxWithdrawableRaw: '100' })).toBe(false)
    expect(isWithdrawOverMax({ withdrawAmountRaw: '100', maxWithdrawableRaw: undefined })).toBe(false)
  })

  it('is true only when the amount exceeds the server max', () => {
    expect(isWithdrawOverMax({ withdrawAmountRaw: '101', maxWithdrawableRaw: '100' })).toBe(true)
    expect(isWithdrawOverMax({ withdrawAmountRaw: '100', maxWithdrawableRaw: '100' })).toBe(false)
    expect(isWithdrawOverMax({ withdrawAmountRaw: '99', maxWithdrawableRaw: '100' })).toBe(false)
  })
})

describe('hasInsufficientAddBalance', () => {
  it('is sufficient when the amount is at or under the spendable balance', () => {
    expect(hasInsufficientAddBalance({ rawAmount: '500', spendableBalanceRaw: '1000', portfolioLoaded: true })).toBe(
      false,
    )
    expect(hasInsufficientAddBalance({ rawAmount: '1000', spendableBalanceRaw: '1000', portfolioLoaded: true })).toBe(
      false,
    )
  })

  it('is insufficient when the amount exceeds the spendable balance', () => {
    expect(hasInsufficientAddBalance({ rawAmount: '1001', spendableBalanceRaw: '1000', portfolioLoaded: true })).toBe(
      true,
    )
  })

  it('is insufficient when the token is not held once the portfolio has loaded', () => {
    expect(hasInsufficientAddBalance({ rawAmount: '1', spendableBalanceRaw: undefined, portfolioLoaded: true })).toBe(
      true,
    )
  })

  it('stays permissive before the portfolio has loaded', () => {
    expect(hasInsufficientAddBalance({ rawAmount: '1', spendableBalanceRaw: undefined, portfolioLoaded: false })).toBe(
      false,
    )
  })

  it('never flags an empty amount', () => {
    expect(
      hasInsufficientAddBalance({ rawAmount: undefined, spendableBalanceRaw: undefined, portfolioLoaded: true }),
    ).toBe(false)
  })
})

describe('visibleMatchesSubmitted', () => {
  it('matches when the debounced submitted raw equals the visible raw', () => {
    expect(visibleMatchesSubmitted({ visibleRaw: '1000', submittedRaw: '1000' })).toBe(true)
  })

  it('does not match when the visible input has moved past the debounced value', () => {
    expect(visibleMatchesSubmitted({ visibleRaw: '2000', submittedRaw: '1000' })).toBe(false)
  })

  it('does not match when either side is undefined (unparseable/empty)', () => {
    expect(visibleMatchesSubmitted({ visibleRaw: undefined, submittedRaw: '1000' })).toBe(false)
    expect(visibleMatchesSubmitted({ visibleRaw: '1000', submittedRaw: undefined })).toBe(false)
  })
})
