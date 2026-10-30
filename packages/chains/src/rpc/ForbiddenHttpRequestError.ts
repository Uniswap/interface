import { HttpRequestError } from 'viem'

const HTTP_FORBIDDEN = 403

/**
 * An HTTP 403 that viem must not retry. viem's `shouldRetry` retries any `HttpRequestError` with
 * status 403, and UniRPC stacks several retrying transports, so one geo-blocked call fans out into
 * a dozen-plus gateway requests on every poll. A 403 from the gateway (geo/WAF block) fails the
 * same way on every attempt.
 *
 * Stays an `HttpRequestError` with `status: 403` so the session gate still runs its single
 * recover-and-retry for a missing session, and RPC observability still reads the status. The
 * numeric `code` is what opts out: viem's `shouldRetry` returns false for any error carrying a
 * numeric code it doesn't list as retryable.
 */
export class ForbiddenHttpRequestError extends HttpRequestError {
  readonly code = HTTP_FORBIDDEN

  constructor({ headers, url }: { headers: Headers; url: string }) {
    super({ details: 'Forbidden', headers, status: HTTP_FORBIDDEN, url })
    this.name = 'ForbiddenHttpRequestError'
  }
}

/**
 * Builds a viem `onFetchResponse` hook that turns a 403 into a {@link ForbiddenHttpRequestError}.
 * viem rethrows an `HttpRequestError` from the hook as-is, before its own status handling runs.
 */
export function createThrowOnForbiddenResponse(url: string): (response: Response) => void {
  return (response) => {
    if (response.status === HTTP_FORBIDDEN) {
      throw new ForbiddenHttpRequestError({ headers: response.headers, url })
    }
  }
}
