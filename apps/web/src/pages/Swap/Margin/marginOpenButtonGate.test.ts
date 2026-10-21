import { FetchError } from '@universe/api'
import { describe, expect, it } from 'vitest'
import {
  getMarginLeverageCap,
  isMarginOpenLoading,
  isUnroutablePaymentTokenError,
  shouldClampLeverageToCap,
} from '~/pages/Swap/Margin/marginOpenButtonGate'

function fetchErrorWith(data: unknown): FetchError {
  return new FetchError({ response: new Response(null, { status: 422 }), data })
}

describe('isMarginOpenLoading', () => {
  it('is not loading when every flag is clear', () => {
    expect(
      isMarginOpenLoading({ isQuoteLoading: false, isDebouncing: false, isFetching: false, isPlaceholderData: false }),
    ).toBe(false)
  })

  // NEW-FE-2: RQ-v5's isLoading (isQuoteLoading here) is false during a placeholder-bridged refetch —
  // isFetching/isPlaceholderData must independently gate the CTA, or a slider-then-click races a
  // guaranteed MARGIN_BOUNDS_ECHO_MISMATCH 400 against the stale echo.
  it('is loading during a placeholder-bridged refetch even though isQuoteLoading is false', () => {
    expect(
      isMarginOpenLoading({ isQuoteLoading: false, isDebouncing: false, isFetching: true, isPlaceholderData: true }),
    ).toBe(true)
  })

  it('is loading on isQuoteLoading or isDebouncing alone', () => {
    expect(
      isMarginOpenLoading({ isQuoteLoading: true, isDebouncing: false, isFetching: false, isPlaceholderData: false }),
    ).toBe(true)
    expect(
      isMarginOpenLoading({ isQuoteLoading: false, isDebouncing: true, isFetching: false, isPlaceholderData: false }),
    ).toBe(true)
  })
})

describe('getMarginLeverageCap', () => {
  it('maxes over the allowed venues, so the ceiling venue sets the slider', () => {
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: 3 }, { maxLeverage: 5 }, { maxLeverage: 4 }] })).toBe(5)
  })

  // Excluding the ceiling venue clamps down immediately — that is the whole opt-out affordance.
  it('drops to the next venue once the ceiling one is excluded', () => {
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: 3 }, { maxLeverage: 4 }] })).toBe(4)
  })

  it('is undefined for an empty allowlist — an excluded-everything pair has no ceiling', () => {
    expect(getMarginLeverageCap({ markets: [] })).toBeUndefined()
  })

  // A market built off-registry (a position whose venue the wire no longer lists) carries no
  // server-authored cap, and none may be derived from its lltv.
  it('is undefined when no market carries a server-authored cap', () => {
    expect(getMarginLeverageCap({ markets: [{}, { maxLeverage: undefined }] })).toBeUndefined()
  })

  it('ignores non-finite caps rather than propagating them to the slider', () => {
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: Number.NaN }, { maxLeverage: 3 }] })).toBe(3)
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: Number.POSITIVE_INFINITY }] })).toBeUndefined()
  })

  it('is undefined when the highest cap is below the minimum — a paused venue is not an honest ceiling', () => {
    // Flooring a sub-minimum cap would offer leverage above the venue's stated max.
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: 0.5 }] })).toBeUndefined()
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: 0 }, { maxLeverage: 1 }] })).toBeUndefined()
    // A serviceable venue still wins even when a paused one sits alongside it.
    expect(getMarginLeverageCap({ markets: [{ maxLeverage: 0 }, { maxLeverage: 3 }] })).toBe(3)
  })
})

describe('isUnroutablePaymentTokenError', () => {
  it('is true for the errorCode the BE emits once T1.6 lands', () => {
    expect(isUnroutablePaymentTokenError(fetchErrorWith({ errorCode: 'UNROUTABLE_PAYMENT_TOKEN' }))).toBe(true)
  })

  // Transitional fallback until the BE emits errorCode — remove once T1.6 lands everywhere.
  it('is true for the detail-substring fallback', () => {
    expect(isUnroutablePaymentTokenError(fetchErrorWith({ detail: 'Insufficient swap liquidity for this pair' }))).toBe(
      true,
    )
  })

  it('is false for an unrelated errorCode/detail', () => {
    expect(isUnroutablePaymentTokenError(fetchErrorWith({ errorCode: 'MARGIN_BOUNDS_ECHO_MISMATCH' }))).toBe(false)
    expect(isUnroutablePaymentTokenError(fetchErrorWith({ detail: 'Something else went wrong' }))).toBe(false)
  })

  it('is false for a non-FetchError and for undefined', () => {
    expect(isUnroutablePaymentTokenError(new Error('boom'))).toBe(false)
    expect(isUnroutablePaymentTokenError(undefined)).toBe(false)
  })
})

describe('shouldClampLeverageToCap', () => {
  it('clamps when leverage exceeds a real cap', () => {
    expect(shouldClampLeverageToCap({ maxLeverage: 3, leverage: 5, cap: 3 })).toBe(true)
  })

  it('does not clamp within the cap', () => {
    expect(shouldClampLeverageToCap({ maxLeverage: 5, leverage: 3, cap: 5 })).toBe(false)
  })

  // An all-venues-excluded pair has no honest ceiling — maxLeverage is undefined and the cap floors to
  // MIN_LEVERAGE. Clamping there would silently reset the user's leverage with no way back.
  it('never clamps when there is no honest ceiling (maxLeverage undefined)', () => {
    expect(shouldClampLeverageToCap({ maxLeverage: undefined, leverage: 5, cap: 1.1 })).toBe(false)
  })
})
