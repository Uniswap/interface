import { pickGatewayCookies, reportRelayedCookieDomain } from '@universe/sessions/src/gateway-cookies/gatewayCookies'
import { describe, expect, it, vi } from 'vitest'

const DOMAIN = 'Domain=.backend-prod.api.uniswap.org'

describe('pickGatewayCookies', () => {
  it('keeps only the cookies the gateway reads, in their original order', () => {
    expect(
      pickGatewayCookies(
        'theme=dark; x-device-id=dev456; auth_session_data=signed.blob; x-session-id=abc123; _dd_s=rum',
      ),
    ).toBe('x-device-id=dev456; x-session-id=abc123')
  })

  it("accepts the gateway's prefixed cookie names", () => {
    expect(pickGatewayCookies('__Secure-x-session-id=abc; __Host-x-device-id=dev')).toBe(
      '__Secure-x-session-id=abc; __Host-x-device-id=dev',
    )
  })

  it('matches names exactly, dropping lookalikes and malformed pairs', () => {
    expect(
      pickGatewayCookies(
        'a-x-session-id=evil; x-session-id-evil=1; xx-device-id=2; x-session-id; x-session-idx; =bare; x-session-id=a=b',
      ),
    ).toBe('x-session-id=a=b')
  })

  it('returns undefined when nothing is worth forwarding', () => {
    expect(pickGatewayCookies(null)).toBeUndefined()
    expect(pickGatewayCookies(undefined)).toBeUndefined()
    expect(pickGatewayCookies('')).toBeUndefined()
    expect(pickGatewayCookies('theme=dark; AMP_x=y')).toBeUndefined()
    expect(pickGatewayCookies('malformed; ; =novalue')).toBeUndefined()
  })

  it('shrinks a jar large enough to trip the gateway header limit down to the session cookie', () => {
    const bloat = Array.from({ length: 40 }, (_, i) => `c${i}=${'v'.repeat(400)}`).join('; ')
    const header = `${bloat}; x-session-id=abc123`
    expect(header.length).toBeGreaterThan(16_000)
    expect(pickGatewayCookies(header)).toBe('x-session-id=abc123')
  })
})

describe('reportRelayedCookieDomain', () => {
  it.each([
    ['a Domain-scoped session cookie', `x-session-id=abc123; Max-Age=2592000; ${DOMAIN}; Path=/; HttpOnly; Secure`],
    ['a Domain-scoped expiry', `x-session-id=; Max-Age=0; ${DOMAIN}; Path=/`],
    ['a parent domain, any casing', 'x-session-id=abc; domain=.uniswap.org; Path=/; Secure'],
  ])('reports %s with the cookie name', (_label, setCookie) => {
    const warn = vi.fn()
    reportRelayedCookieDomain(setCookie, { warn })
    expect(warn).toHaveBeenCalledExactlyOnceWith('gateway.cookie.domain_relayed', { cookieName: 'x-session-id' })
  })

  it.each([
    ['a host-only cookie', 'x-session-id=abc123; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=None'],
    ['a host-only expiry', 'x-session-id=; Max-Age=0; Path=/; HttpOnly; Secure'],
    ['"Domain=" inside the value', 'x-session-id=abcDomain=tricky; Path=/'],
  ])('stays silent on %s', (_label, setCookie) => {
    const warn = vi.fn()
    reportRelayedCookieDomain(setCookie, { warn })
    expect(warn).not.toHaveBeenCalled()
  })

  it('does nothing without a logger', () => {
    expect(() => reportRelayedCookieDomain(`x-session-id=abc; ${DOMAIN}`)).not.toThrow()
  })
})
