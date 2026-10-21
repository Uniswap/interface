import { FetchError } from '@universe/api'
import { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { getMappedMarginErrorMessage, getMarginQuoteErrorMessage } from '~/pages/Swap/Margin/marginQuoteError'

// Passthrough stub — asserts on the i18n key itself rather than translated copy (same approach as
// MarginPlanReviewModal.test.ts's mockT).
const mockT = ((key: string) => key) as TFunction

const fetchErrorWith = ({
  status,
  errorCode,
  detail,
}: {
  status: number
  errorCode?: string
  detail?: string
}): FetchError => new FetchError({ response: new Response(null, { status }), data: { errorCode, detail } })

describe('getMappedMarginErrorMessage', () => {
  it('maps each Appendix errorCode literal to its own i18n key', () => {
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_ADJUST_HEALTH_FLOOR', t: mockT })).toBe(
      'margin.error.adjust.healthFloor',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_INVALID_LEVERAGE', t: mockT })).toBe(
      'margin.error.adjust.invalidLeverage',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_WITHDRAW_OVER_MAX', t: mockT })).toBe(
      'margin.error.adjust.withdrawOverMax',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_MARKET_NOT_SUPPORTED', t: mockT })).toBe(
      'margin.error.adjust.marketNotSupported',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_ADJUST_NO_POSITION', t: mockT })).toBe(
      'margin.error.adjust.noPosition',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_ADJUST_NO_CHANGE', t: mockT })).toBe(
      'margin.error.adjust.noChange',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_INVALID_REQUEST', t: mockT })).toBe(
      'margin.error.adjust.invalidRequest',
    )
  })

  it('shares one key across both liquidity reasons (swap vs borrow read identically to the user)', () => {
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_SWAP_INSUFFICIENT_LIQUIDITY', t: mockT })).toBe(
      'margin.error.adjust.insufficientLiquidity',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_BORROW_INSUFFICIENT_LIQUIDITY', t: mockT })).toBe(
      'margin.error.adjust.insufficientLiquidity',
    )
  })

  it('shares one key across both full-exit reasons (both point at Close position)', () => {
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_WITHDRAW_FULL_EXIT', t: mockT })).toBe(
      'margin.error.adjust.fullExit',
    )
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_ADJUST_FULL_EXIT', t: mockT })).toBe(
      'margin.error.adjust.fullExit',
    )
  })

  it('returns undefined for an unmapped code, MARGIN_-prefixed or not', () => {
    expect(getMappedMarginErrorMessage({ errorCode: 'UnprocessableEntity', t: mockT })).toBeUndefined()
    expect(getMappedMarginErrorMessage({ errorCode: 'MARGIN_SOME_FUTURE_CODE', t: mockT })).toBeUndefined()
  })
})

describe('getMarginQuoteErrorMessage', () => {
  it('falls back to the generic copy for a non-FetchError (network/raw reject)', () => {
    expect(getMarginQuoteErrorMessage({ error: new TypeError('network down'), t: mockT })).toEqual({
      message: 'margin.error.quoteFailed',
    })
  })

  it('falls back to the generic copy for a 5xx, even carrying a recognized errorCode', () => {
    const error = fetchErrorWith({ status: 503, errorCode: 'MARGIN_ADJUST_HEALTH_FLOOR', detail: 'unused' })
    expect(getMarginQuoteErrorMessage({ error, t: mockT })).toEqual({ message: 'margin.error.quoteFailed' })
  })

  it('falls back to the generic copy when a 4xx carries no errorCode', () => {
    expect(getMarginQuoteErrorMessage({ error: fetchErrorWith({ status: 422 }), t: mockT })).toEqual({
      message: 'margin.error.quoteFailed',
    })
  })

  it('returns the mapped translation for a known errorCode, with no unrecognizedCode', () => {
    const error = fetchErrorWith({
      status: 422,
      errorCode: 'MARGIN_ADJUST_HEALTH_FLOOR',
      detail: 'Adjust would leave the position below the near-liquidation health floor',
    })
    expect(getMarginQuoteErrorMessage({ error, t: mockT })).toEqual({ message: 'margin.error.adjust.healthFloor' })
  })

  it('never lets MARGIN_INVALID_LEVERAGE fall through to its leverageX18-leaking detail', () => {
    const error = fetchErrorWith({
      status: 422,
      errorCode: 'MARGIN_INVALID_LEVERAGE',
      detail: 'leverageX18 must be greater than 1e18 and within the market maximum',
    })
    const result = getMarginQuoteErrorMessage({ error, t: mockT })
    expect(result.message).toBe('margin.error.adjust.invalidLeverage')
    expect(result.message).not.toContain('leverageX18')
  })

  it('degrades to detail + flags drift for a MARGIN_-prefixed code this map does not recognize', () => {
    const error = fetchErrorWith({ status: 422, errorCode: 'MARGIN_SOME_FUTURE_CODE', detail: 'server detail' })
    expect(getMarginQuoteErrorMessage({ error, t: mockT })).toEqual({
      message: 'server detail',
      unrecognizedCode: 'MARGIN_SOME_FUTURE_CODE',
    })
  })

  it('degrades to detail with NO drift flag for a coarse (non-MARGIN_) ErrorType — expected, not drift', () => {
    const error = fetchErrorWith({ status: 422, errorCode: 'UnprocessableEntity', detail: 'server detail' })
    expect(getMarginQuoteErrorMessage({ error, t: mockT })).toEqual({ message: 'server detail' })
  })

  it('falls back to generic when a coarse/unmapped code carries no detail', () => {
    const error = fetchErrorWith({ status: 400, errorCode: 'RequestValidationError' })
    expect(getMarginQuoteErrorMessage({ error, t: mockT })).toEqual({ message: 'margin.error.quoteFailed' })
  })

  // Coarse ErrorType with an echo-mismatch detail: the quote went stale between pricing and confirm.
  // Distinguishable only by detail — errorCode is the generic 'RequestValidationError'.
  // The backend raises MARGIN_BOUNDS_ECHO_MISMATCH_ERROR from plan CREATE, never from adjust_quote,
  // and the create path goes through getMappedMarginErrorMessage — so the branch has to live there or
  // the copy is unreachable and the user sees the raw backend detail.
  it('maps an echo mismatch from the shared mapper, which is what the create path calls', () => {
    expect(
      getMappedMarginErrorMessage({
        errorCode: 'RequestValidationError',
        // The REAL wire text. RequestValidationError emits `detail: this.message`, and the constant's
        // value is this sentence — its NAME never crosses the wire.
        detail: 'Margin plan echo does not match server-derived bounds',
        t: mockT,
      }),
    ).toBe('margin.error.adjust.priceMoved')
  })

  it('leaves other RequestValidationError details to the caller fallback', () => {
    expect(
      getMappedMarginErrorMessage({ errorCode: 'RequestValidationError', detail: 'something else', t: mockT }),
    ).toBeUndefined()
    expect(getMappedMarginErrorMessage({ errorCode: 'RequestValidationError', t: mockT })).toBeUndefined()
  })

  it('maps a plan-create echo mismatch to re-quote copy', () => {
    const error = new FetchError({
      response: { status: 400 } as Response,
      data: { errorCode: 'RequestValidationError', detail: 'Margin plan echo does not match server-derived bounds' },
    })
    expect(getMarginQuoteErrorMessage({ error, t: mockT }).message).toBe('margin.error.adjust.priceMoved')
  })

  it('still surfaces the backend detail for other coarse error types', () => {
    const error = new FetchError({
      response: { status: 422 } as Response,
      data: { errorCode: 'UnprocessableEntity', detail: 'MARGIN_MARK_UNAVAILABLE_ERROR' },
    })
    expect(getMarginQuoteErrorMessage({ error, t: mockT }).message).toBe('MARGIN_MARK_UNAVAILABLE_ERROR')
  })
})
