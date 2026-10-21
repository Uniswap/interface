import { isIOS } from '@universe/environment'
import { logger } from 'utilities/src/logger/logger'

type FetchImpl = typeof globalThis.fetch

// Only first-party API hosts are eligible for an override, so an alternative
// transport can never serve third-party or arbitrary URLs.
const FIRST_PARTY_HOST = 'uniswap.org'
const FIRST_PARTY_HOST_SUFFIX = `.${FIRST_PARTY_HOST}`

let firstPartyFetchOverride: FetchImpl | undefined

/**
 * Installs an alternative fetch implementation for FIRST-PARTY API traffic only
 * (requests to *.uniswap.org issued through createFetchClient).
 * The override is one-way for the session and never touches globalThis.fetch,
 * so third-party requests and any code using the global keep the platform
 * network stack.
 *
 * Cookie note: an override implementation has its own cookie jar, so it must
 * only be installed on platforms whose first-party auth is cookie-free. On
 * mobile — the only platform that installs one — session identity travels as
 * the `x-session-id` request header with `session_id` returned in the response
 * BODY, never via Set-Cookie (see sessions session-repository/types.ts and
 * createSessionInitializationService.ts; createFetchClient attaches the header
 * per attempt), and API auth is the X-API-KEY header. The `credentials:
 * 'include'` options on some clients exist for the web cookie flow only —
 * web never installs an override.
 *
 * No-ops (with a logged warning) on every platform except iOS.
 */
export function setFirstPartyFetchOverride(fetchImpl: FetchImpl): void {
  // Transport-trust parity: only URLSession-backed platforms may install an
  // override — Android's Cronet ignores network_security_config (trust
  // anchors, pin-sets) and web's auth rides cookies the override would lose,
  // so the invariant is enforced here, not only at call sites.
  if (!isIOS) {
    logger.warn(
      'fetchImplProvider.ts',
      'setFirstPartyFetchOverride',
      'first-party fetch override rejected: only iOS may install one',
    )
    return
  }
  firstPartyFetchOverride = fetchImpl
}

function isFirstPartyUrl(input: RequestInfo | URL): boolean {
  try {
    const url = input instanceof URL ? input : new URL(typeof input === 'string' ? input : input.url)
    return (
      url.protocol === 'https:' && (url.hostname === FIRST_PARTY_HOST || url.hostname.endsWith(FIRST_PARTY_HOST_SUFFIX))
    )
  } catch {
    return false
  }
}

export function resolveFirstPartyFetch(input: RequestInfo | URL): FetchImpl {
  if (firstPartyFetchOverride !== undefined && isFirstPartyUrl(input)) {
    return firstPartyFetchOverride
  }
  return fetch
}
