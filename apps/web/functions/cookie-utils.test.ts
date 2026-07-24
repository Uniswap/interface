import { rewriteProxiedCookie, rewriteProxiedCookies } from 'functions/cookie-utils'

describe('rewriteProxiedCookie', () => {
  describe('SameSite pass-through', () => {
    it('preserves SameSite=None (session cookies minted by platform-service, INC-344)', () => {
      const result = rewriteProxiedCookie('x-session-id=abc123; Path=/; Secure; HttpOnly; SameSite=None')
      expect(result).toBe('x-session-id=abc123; Path=/; Secure; HttpOnly; SameSite=None')
    })

    it('preserves SameSite=Lax', () => {
      const result = rewriteProxiedCookie('x-device-id=dev456; Path=/; Secure; HttpOnly; SameSite=Lax')
      expect(result).toBe('x-device-id=dev456; Path=/; Secure; HttpOnly; SameSite=Lax')
    })

    it('preserves SameSite=Strict on arbitrary cookies', () => {
      const result = rewriteProxiedCookie('other=value; Path=/; Secure; SameSite=Strict')
      expect(result).toBe('other=value; Path=/; Secure; SameSite=Strict')
    })

    it('does not add SameSite when the backend omits it', () => {
      const result = rewriteProxiedCookie('other=value; Path=/; Secure')
      expect(result).not.toContain('SameSite')
    })
  })

  describe('Domain and prefix stripping', () => {
    it('strips Domain and keeps SameSite untouched', () => {
      const result = rewriteProxiedCookie('x-session-id=abc123; Domain=.uniswap.org; Path=/; Secure; SameSite=None')
      expect(result).not.toContain('Domain')
      expect(result).toContain('SameSite=None')
    })

    it('strips __Secure- prefix without touching other attributes', () => {
      const result = rewriteProxiedCookie('__Secure-x-session-id=abc123; Path=/; Secure; SameSite=None')
      expect(result).toBe('x-session-id=abc123; Path=/; Secure; SameSite=None')
    })

    it('strips __Host- prefix and Domain', () => {
      const result = rewriteProxiedCookie('__Host-other=value; Domain=.uniswap.org; Path=/; Secure; SameSite=Strict')
      expect(result).toBe('other=value; Path=/; Secure; SameSite=Strict')
    })

    it('leaves a plain cookie without Domain or prefixes unchanged', () => {
      const result = rewriteProxiedCookie('other=value')
      expect(result).toBe('other=value')
    })
  })
})

describe('rewriteProxiedCookies', () => {
  it('returns the response unchanged when there are no Set-Cookie headers', () => {
    const response = new Response('body', { status: 200 })
    expect(rewriteProxiedCookies(response)).toBe(response)
  })

  it('rewrites multiple cookies, preserving each SameSite as sent', () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'x-session-id=abc; Domain=.uniswap.org; Path=/; Secure; HttpOnly; SameSite=None')
    headers.append('Set-Cookie', 'other=value; Path=/; Secure; SameSite=Strict')
    const response = new Response('body', { status: 200, headers })

    const rewritten = rewriteProxiedCookies(response)
    const cookies = rewritten.headers.getSetCookie()

    expect(cookies).toEqual([
      'x-session-id=abc; Path=/; Secure; HttpOnly; SameSite=None',
      'other=value; Path=/; Secure; SameSite=Strict',
    ])
  })
})
