import { FetchError } from '@universe/api'
import {
  FORBIDDEN_QUOTE_POLL_INTERVAL_MS,
  getQuoteRefetchInterval,
  shouldRetryQuote,
} from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeQuery'

function fetchError(status: number): FetchError {
  return new FetchError({ response: new Response(null, { status }) })
}

describe('shouldRetryQuote', () => {
  it('retries once on a non-403 error', () => {
    expect(shouldRetryQuote(0, fetchError(500))).toBe(true)
    expect(shouldRetryQuote(1, fetchError(500))).toBe(false)
  })

  it('never retries a 403', () => {
    expect(shouldRetryQuote(0, fetchError(403))).toBe(false)
  })
})

describe('getQuoteRefetchInterval', () => {
  it('uses the chain interval when there is no error', () => {
    expect(getQuoteRefetchInterval({ baseInterval: 3000, error: null })).toBe(3000)
    expect(getQuoteRefetchInterval({ baseInterval: () => 1234, error: null })).toBe(1234)
  })

  it('keeps the chain interval on a non-403 error', () => {
    expect(getQuoteRefetchInterval({ baseInterval: 3000, error: fetchError(500) })).toBe(3000)
  })

  it('backs off to the forbidden interval on a 403', () => {
    expect(getQuoteRefetchInterval({ baseInterval: 3000, error: fetchError(403) })).toBe(
      FORBIDDEN_QUOTE_POLL_INTERVAL_MS,
    )
    expect(getQuoteRefetchInterval({ baseInterval: () => 1234, error: fetchError(403) })).toBe(
      FORBIDDEN_QUOTE_POLL_INTERVAL_MS,
    )
  })
})
