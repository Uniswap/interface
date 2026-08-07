import { isIFramed } from '~/utils/isIFramed'

const dispatchMock = vi.fn()
vi.mock('~/state/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}))

describe('useIsIframed', () => {
  it('should return true if there are ancestor origins', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: ['https://www.google.com'],
      },
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(true)
  })
  it('should return false if there are 0 ancestor origins', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: [],
      },
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(false)
  })
  it('should return false if self is equal to top', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: 'https://uniswap.org',
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(false)
  })
  it('should return true if self is not equal to top', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: 'https://eviluniswap.org',
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(true)
  })

  it('should return true otherwise an error is thrown due to weird overwriting of variables that should not be modified', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: undefined,
      writable: true,
    })
    const result = isIFramed(true)
    expect(result).toBe(true)
  })
})

describe('isIFramed frame-bust redirect target', () => {
  function setupFrame(selfLocation: Record<string, unknown>): { href: string } {
    const topLocation = { href: '' }
    // window.location drives the ancestorOrigins framed check; window.self.location is what
    // frameBustHref reads to compute the destination.
    Object.defineProperty(window, 'location', { value: selfLocation, writable: true })
    Object.defineProperty(window, 'self', { value: { location: selfLocation }, writable: true })
    Object.defineProperty(window, 'top', { value: { location: topLocation }, writable: true })
    return topLocation
  }

  it('busts an /embed document with no bustToPath out to the default /swap, preserving query and hash', () => {
    const topLocation = setupFrame({
      ancestorOrigins: ['https://dexscreener.com'],
      origin: 'https://app.uniswap.org',
      pathname: '/embed',
      search: '?chain=base',
      hash: '#foo',
      href: 'https://app.uniswap.org/embed?chain=base#foo',
    })
    // The only production caller with no bustToPath is the passkey sign-in flow (useSignInWithPasskey).
    expect(isIFramed(true)).toBe(true)
    expect(topLocation.href).toBe('https://app.uniswap.org/swap?chain=base#foo')
  })

  it('busts out to an explicit bustToPath (/send), preserving query and hash', () => {
    const topLocation = setupFrame({
      ancestorOrigins: ['https://dexscreener.com'],
      origin: 'https://app.uniswap.org',
      pathname: '/send',
      search: '?sendChain=base',
      hash: '',
      href: 'https://app.uniswap.org/send?sendChain=base',
    })
    expect(isIFramed(true, { bustToPath: '/send' })).toBe(true)
    expect(topLocation.href).toBe('https://app.uniswap.org/send?sendChain=base')
  })

  it('busts out to an explicit bustToPath even from a non-embed framed page (e.g. framed /swap)', () => {
    const topLocation = setupFrame({
      ancestorOrigins: ['https://dexscreener.com'],
      origin: 'https://app.uniswap.org',
      pathname: '/swap',
      search: '?chain=base',
      hash: '',
      href: 'https://app.uniswap.org/swap?chain=base',
    })
    expect(isIFramed(true, { bustToPath: '/send' })).toBe(true)
    expect(topLocation.href).toBe('https://app.uniswap.org/send?chain=base')
  })

  it('leaves a non-embed frame-bust with no bustToPath pointed at the page own href', () => {
    const topLocation = setupFrame({
      ancestorOrigins: ['https://evil.com'],
      origin: 'https://app.uniswap.org',
      pathname: '/swap',
      search: '?x=1',
      hash: '',
      href: 'https://app.uniswap.org/swap?x=1',
    })
    expect(isIFramed(true)).toBe(true)
    expect(topLocation.href).toBe('https://app.uniswap.org/swap?x=1')
  })

  // Frame-busting keys off the /embed pathname, not the `view` query param, so both embed
  // surfaces (default view=full and the opted-in view=swap) bust Send + the embedded wallet
  // out of the frame identically. The view param rides along in the preserved query string.
  describe.each([['full'], ['swap']])('embed surface view=%s', (view) => {
    it('busts out to the default /swap when no bustToPath is given', () => {
      const topLocation = setupFrame({
        ancestorOrigins: ['https://dexscreener.com'],
        origin: 'https://app.uniswap.org',
        pathname: '/embed',
        search: `?view=${view}`,
        hash: '',
        href: `https://app.uniswap.org/embed?view=${view}`,
      })
      expect(isIFramed(true)).toBe(true)
      expect(topLocation.href).toBe(`https://app.uniswap.org/swap?view=${view}`)
    })

    it('busts out to an explicit bustToPath (/send)', () => {
      const topLocation = setupFrame({
        ancestorOrigins: ['https://dexscreener.com'],
        origin: 'https://app.uniswap.org',
        pathname: '/embed',
        search: `?view=${view}`,
        hash: '',
        href: `https://app.uniswap.org/embed?view=${view}`,
      })
      expect(isIFramed(true, { bustToPath: '/send' })).toBe(true)
      expect(topLocation.href).toBe(`https://app.uniswap.org/send?view=${view}`)
    })
  })
})
