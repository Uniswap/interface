import { ErrorEvent, EventHint } from '@sentry/types'

export function beforeSend(event: ErrorEvent, hint: EventHint) {
  const error = hint.originalException
  if (!error || typeof error !== 'object') return event

  // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
  // It's ok for it to fail; it should be considered a Sentry.Breadcrumb and not an ErrorEvent.
  const ethersError = error as { requestBody?: string | null }
  const requestBody = ethersError.requestBody
  if (typeof requestBody === 'string' && JSON.parse(requestBody).method === 'eth_blockNumber') {
    return null
  }

  return event
}
