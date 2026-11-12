import { describe, expect, it } from 'vitest'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import {
  ADJUST_MIN_LEVERAGE_DELTA,
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
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'drift' } })).toBeUndefined()
  })

  // Floors rather than rounds, so the 2-decimal step never wires more leverage than was chosen.
  it('sends the dragged value, floored to 2 decimals, when explicit', () => {
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'explicit', value: 3.001 } })).toBe(
      (300n * 10n ** 16n).toString(), // 3.00 * 1e18
    )
    expect(getAdjustTargetLeverageX18({ mode: { kind: 'explicit', value: 2.999 } })).toBe(
      (299n * 10n ** 16n).toString(), // 2.99 * 1e18 — never rounds up to 3.00
    )
  })

  // Defence in depth: no caller can reach these today (the numeric input rejects non-finite input,
  // and the slider clamps to a cap that is always finite). Pinned because the alternative is parseUnits throwing out of
  // render on a malformed decimal — refusing the target is the safe half of that trade.
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'refuses a non-finite target rather than wiring a malformed decimal (%o)',
    (value) => {
      expect(getAdjustTargetLeverageX18({ mode: { kind: 'explicit', value } })).toBeUndefined()
    },
  )
})

describe('hasAdjustChange', () => {
  const DRIFT: AdjustLeverageMode = { kind: 'drift' }

  it('is true whenever funding is not none, regardless of leverage mode', () => {
    expect(
      hasAdjustChange({ funding: { kind: 'deposit', paymentAmountRaw: '1' }, mode: DRIFT, currentLeverage: 2 }),
    ).toBe(true)
    expect(
      hasAdjustChange({ funding: { kind: 'withdraw', withdrawAmountRaw: '1' }, mode: DRIFT, currentLeverage: 2 }),
    ).toBe(true)
  })

  it('is false for no funding in drift mode (it never moves leverage on its own)', () => {
    expect(hasAdjustChange({ funding: { kind: 'none' }, mode: DRIFT, currentLeverage: 2 })).toBe(false)
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

  // A deposit with an empty payment amount is unpriceable: the request builder refuses to build it,
  // and the gate says so locally rather than inheriting the invariant from three files away.
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
