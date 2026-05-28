import { usePrivy } from '@privy-io/react-auth'
import { act, renderHook } from '@testing-library/react'
import { useOAuthResult } from '~/components/Passkey/useOAuthResult'

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}))

vi.mock('~/components/Passkey/OAuthRedirectContext', () => ({
  useAssertOAuthRedirectRouter: vi.fn(),
}))

const TEST_KEY = 'test:oauthProvider'

describe('useOAuthResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns idle state when no sessionStorage key is set', () => {
    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current).toEqual({
      provider: null,
      providerEmail: undefined,
      pending: false,
    })
  })

  it('returns pending: true when key is set but Privy not yet authenticated', () => {
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: false,
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current.pending).toBe(true)
    expect(result.current.provider).toBeNull()
  })

  it('returns provider and email when key is set and Privy authenticated (Google)', () => {
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { google: { email: 'user@gmail.com' } },
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current).toEqual({
      provider: 'google',
      providerEmail: 'user@gmail.com',
      pending: false,
    })
  })

  it('returns provider and email when key is set and Privy authenticated (Apple)', () => {
    sessionStorage.setItem(TEST_KEY, 'apple')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { apple: { email: 'user@icloud.com' } },
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current).toEqual({
      provider: 'apple',
      providerEmail: 'user@icloud.com',
      pending: false,
    })
  })

  it('stays pending when ready but not yet authenticated (Privy code exchange in flight)', () => {
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current.pending).toBe(true)
    expect(result.current.provider).toBeNull()
    expect(sessionStorage.getItem(TEST_KEY)).toBe('google')
  })

  it('stays pending when authenticated but linked account has not synced yet', () => {
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { google: undefined },
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current.pending).toBe(true)
    expect(result.current.provider).toBeNull()
    expect(sessionStorage.getItem(TEST_KEY)).toBe('google')
  })

  it('clears sessionStorage after detection', () => {
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { google: { email: 'user@gmail.com' } },
    } as unknown as ReturnType<typeof usePrivy>)

    renderHook(() => useOAuthResult(TEST_KEY))

    expect(sessionStorage.getItem(TEST_KEY)).toBeNull()
  })

  it('treats the flow as abandoned after the 10s timeout if success never arrives', () => {
    vi.useFakeTimers()
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current.pending).toBe(true)
    expect(sessionStorage.getItem(TEST_KEY)).toBe('google')

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current).toEqual({ provider: null, providerEmail: undefined, pending: false })
    expect(sessionStorage.getItem(TEST_KEY)).toBeNull()
  })

  it('does not clobber a successful detection when the abandonment timer fires later', () => {
    vi.useFakeTimers()
    sessionStorage.setItem(TEST_KEY, 'google')

    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { google: { email: 'user@gmail.com' } },
    } as unknown as ReturnType<typeof usePrivy>)

    const { result } = renderHook(() => useOAuthResult(TEST_KEY))

    expect(result.current).toEqual({
      provider: 'google',
      providerEmail: 'user@gmail.com',
      pending: false,
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current).toEqual({
      provider: 'google',
      providerEmail: 'user@gmail.com',
      pending: false,
    })
  })
})
