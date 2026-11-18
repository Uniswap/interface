import { renderHook } from '@testing-library/react'
import {
  useMaybeAuthorizationSignature,
  useMaybeLoginWithEmail,
  useMaybeLoginWithOAuth,
  useMaybePrivy,
} from '~/features/wallet/hooks/useMaybePrivy'
import { OAUTH_EVENT_FANOUT } from '~/features/wallet/privy/privyRuntimeStore'
import { publishTestPrivyRuntime, resetPrivyRuntime } from '~/test-utils/privyRuntime'

describe('useMaybePrivy hooks', () => {
  afterEach(() => {
    resetPrivyRuntime()
  })

  describe('before the Privy runtime publishes', () => {
    it('useMaybePrivy returns logged-out defaults', async () => {
      const { result } = renderHook(() => useMaybePrivy())

      expect(result.current.ready).toBe(false)
      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
      await expect(result.current.getAccessToken()).resolves.toBeNull()
      await expect(result.current.logout()).resolves.toBeUndefined()
    })

    it('useMaybeLoginWithOAuth and useMaybeLoginWithEmail are no-ops', async () => {
      const oauth = renderHook(() => useMaybeLoginWithOAuth()).result.current
      const email = renderHook(() => useMaybeLoginWithEmail()).result.current

      expect(oauth.loading).toBe(false)
      await expect(oauth.initOAuth({ provider: 'google' })).resolves.toBeUndefined()
      await expect(email.sendCode({ email: 'a@b.com' })).resolves.toBeUndefined()
      await expect(email.loginWithCode({ code: '123456' })).resolves.toBeUndefined()
    })

    it('useMaybeAuthorizationSignature rejects rather than fabricating a signature', async () => {
      const { result } = renderHook(() => useMaybeAuthorizationSignature())

      await expect(result.current.generateAuthorizationSignature({} as never)).rejects.toThrow('Privy is not available')
    })
  })

  it('serves what the runtime publishes and re-renders on later publishes', () => {
    const { result } = renderHook(() => useMaybePrivy())
    expect(result.current.ready).toBe(false)

    publishTestPrivyRuntime({ privy: { ready: true, authenticated: true } })

    expect(result.current.ready).toBe(true)
    expect(result.current.authenticated).toBe(true)
  })

  it('forwards OAuth events to the latest callbacks of every mounted consumer until unmount', () => {
    const first = vi.fn()
    const replaced = vi.fn()
    const other = vi.fn()
    const { rerender, unmount } = renderHook(({ onError }) => useMaybeLoginWithOAuth({ onError }), {
      initialProps: { onError: first },
    })
    renderHook(() => useMaybeLoginWithOAuth({ onError: other }))

    rerender({ onError: replaced })
    OAUTH_EVENT_FANOUT.onError?.('denied' as never)

    expect(first).not.toHaveBeenCalled()
    expect(replaced).toHaveBeenCalledWith('denied')
    expect(other).toHaveBeenCalledWith('denied')

    unmount()
    OAUTH_EVENT_FANOUT.onError?.('again' as never)
    expect(replaced).toHaveBeenCalledTimes(1)
    expect(other).toHaveBeenCalledTimes(2)
  })
})
