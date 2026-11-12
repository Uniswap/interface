/**
 * Cookie rules for a same-origin BFF that relays entry-gateway sessions (Pools, Dev Portal):
 * forward only the gateway's own cookies upstream, and relay the gateway's Set-Cookie as sent.
 * platform-service decides what the session cookie looks like (host-only); a relay that
 * rewrote it would be a second place to change in lock-step with it.
 */

/** The only cookies the gateway reads off a request. */
const GATEWAY_COOKIE_NAMES = new Set(['x-session-id', 'x-device-id'])

/**
 * Narrows a browser Cookie header to the gateway's own cookies. The whole jar (analytics
 * and anything else on the app's origin) can trip the gateway's header limit with an
 * HTTP 431. `__Host-`/`__Secure-` prefixed names still match, since relays keep cookie
 * names as the gateway sent them. Returns `undefined` when nothing matches so callers can
 * omit the header.
 */
export function pickGatewayCookies(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) {
    return undefined
  }
  const kept = cookieHeader
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => {
      const equalIndex = pair.indexOf('=')
      if (equalIndex <= 0) {
        return false
      }
      const name = pair
        .slice(0, equalIndex)
        .trim()
        .replace(/^__(Host|Secure)-/, '')
        .toLowerCase()
      return GATEWAY_COOKIE_NAMES.has(name)
    })
  return kept.length > 0 ? kept.join('; ') : undefined
}

/** What the Domain report needs; a `@universe/logger` Logger satisfies it. */
export interface RelayedCookieLogger {
  warn(message: string, fields: { cookieName: string }): void
}

/**
 * Reports a gateway Set-Cookie that carries a Domain, before the relay sends it on as is.
 * Nothing upstream sets one today, so one arriving means platform-service's cookie policy
 * changed, and neither outcome announces itself: a Domain that can't match the app's host
 * gets the whole cookie rejected (RFC 6265 §5.3), and a parent domain gets it accepted on
 * hosts it wasn't meant for. The fix belongs in platform-service, not in the relay.
 */
export function reportRelayedCookieDomain(setCookie: string, logger?: RelayedCookieLogger): void {
  const [nameValue = '', ...attributes] = setCookie.split(';')
  if (!attributes.some((attribute) => attribute.trim().toLowerCase().startsWith('domain='))) {
    return
  }
  logger?.warn('gateway.cookie.domain_relayed', {
    cookieName: nameValue.slice(0, Math.max(nameValue.indexOf('='), 0)).trim(),
  })
}
