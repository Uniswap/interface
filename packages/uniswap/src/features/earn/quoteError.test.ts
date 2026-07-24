import { FetchError, TradingApi } from '@universe/api'
import { isEarnNoRoutesQuoteError } from 'uniswap/src/features/earn/quoteError'

function createFetchError(data?: unknown): FetchError {
  return new FetchError({
    response: new Response(null, { status: 404 }),
    data,
  })
}

describe(isEarnNoRoutesQuoteError, () => {
  it.each([
    { errorCode: 'NO_ROUTE' },
    { detail: 'No quotes available' },
    { errorCode: TradingApi.Err404.errorCode.RESOURCE_NOT_FOUND },
    { errorCode: TradingApi.Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR },
  ])('returns true for known no-route quote errors: %o', (data) => {
    expect(isEarnNoRoutesQuoteError(createFetchError(data))).toBe(true)
  })

  it.each([
    { errorCode: 'Unauthorized', detail: 'Session not authorized' },
    { errorCode: TradingApi.Err404.errorCode.INSUFFICIENT_BALANCE },
    { detail: 'Internal Server Error' },
    undefined,
    new Error('Network request failed'),
  ])('returns false for non-route quote errors: %o', (errorOrData) => {
    const error = errorOrData instanceof Error ? errorOrData : createFetchError(errorOrData)

    expect(isEarnNoRoutesQuoteError(error)).toBe(false)
  })
})
