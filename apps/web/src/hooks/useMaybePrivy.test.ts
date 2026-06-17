import { useAuthorizationSignature, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { renderHook } from '@testing-library/react'
import { getPrivyConfig } from '~/config'
import {
  useMaybeAuthorizationSignature,
  useMaybeLoginWithEmail,
  useMaybeLoginWithOAuth,
  useMaybePrivy,
} from '~/hooks/useMaybePrivy'

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
  useLoginWithOAuth: vi.fn(),
  useLoginWithEmail: vi.fn(),
  useAuthorizationSignature: vi.fn(),
}))

vi.mock('~/config', () => ({
  getPrivyConfig: vi.fn(),
}))

const setConfigured = (configured: boolean): void => {
  vi.mocked(getPrivyConfig).mockReturnValue(
    configured ? { appId: 'app-id', clientId: 'client-id' } : { appId: '', clientId: '' },
  )
}

describe('useMaybePrivy hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when Privy is not configured', () => {
    beforeEach(() => {
      setConfigured(false)
    })

    it('useMaybePrivy returns safe defaults without calling usePrivy', async () => {
      const { result } = renderHook(() => useMaybePrivy())

      expect(usePrivy).not.toHaveBeenCalled()
      expect(result.current.ready).toBe(false)
      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
      await expect(result.current.getAccessToken()).resolves.toBeNull()
      await expect(result.current.logout()).resolves.toBeUndefined()
    })

    it('useMaybeLoginWithOAuth returns safe defaults without calling useLoginWithOAuth', async () => {
      const { result } = renderHook(() => useMaybeLoginWithOAuth())

      expect(useLoginWithOAuth).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
      await expect(result.current.initOAuth({ provider: 'google' })).resolves.toBeUndefined()
    })

    it('useMaybeLoginWithEmail returns safe defaults without calling useLoginWithEmail', async () => {
      const { result } = renderHook(() => useMaybeLoginWithEmail())

      expect(useLoginWithEmail).not.toHaveBeenCalled()
      await expect(result.current.sendCode({ email: 'a@b.com' })).resolves.toBeUndefined()
      await expect(result.current.loginWithCode({ code: '123456' })).resolves.toBeUndefined()
    })

    it('useMaybeAuthorizationSignature rejects rather than fabricating a signature', async () => {
      const { result } = renderHook(() => useMaybeAuthorizationSignature())

      expect(useAuthorizationSignature).not.toHaveBeenCalled()
      await expect(result.current.generateAuthorizationSignature({} as never)).rejects.toThrow(
        'Privy is not configured',
      )
    })
  })

  describe('when Privy is configured', () => {
    beforeEach(() => {
      setConfigured(true)
    })

    it('useMaybePrivy returns the real usePrivy result', () => {
      const value = { ready: true } as unknown as ReturnType<typeof usePrivy>
      vi.mocked(usePrivy).mockReturnValue(value)

      const { result } = renderHook(() => useMaybePrivy())

      expect(usePrivy).toHaveBeenCalled()
      expect(result.current).toBe(value)
    })

    it('useMaybeLoginWithOAuth forwards callbacks to the real hook', () => {
      const value = { initOAuth: vi.fn(), loading: true } as unknown as ReturnType<typeof useLoginWithOAuth>
      vi.mocked(useLoginWithOAuth).mockReturnValue(value)
      const callbacks = { onError: vi.fn() }

      const { result } = renderHook(() => useMaybeLoginWithOAuth(callbacks))

      expect(useLoginWithOAuth).toHaveBeenCalledWith(callbacks)
      expect(result.current).toBe(value)
    })

    it('useMaybeLoginWithEmail returns the real hook result', () => {
      const value = { sendCode: vi.fn(), loginWithCode: vi.fn() } as unknown as ReturnType<typeof useLoginWithEmail>
      vi.mocked(useLoginWithEmail).mockReturnValue(value)

      const { result } = renderHook(() => useMaybeLoginWithEmail())

      expect(useLoginWithEmail).toHaveBeenCalled()
      expect(result.current).toBe(value)
    })

    it('useMaybeAuthorizationSignature returns the real hook result', () => {
      const value = {
        generateAuthorizationSignature: vi.fn(),
      } as unknown as ReturnType<typeof useAuthorizationSignature>
      vi.mocked(useAuthorizationSignature).mockReturnValue(value)

      const { result } = renderHook(() => useMaybeAuthorizationSignature())

      expect(useAuthorizationSignature).toHaveBeenCalled()
      expect(result.current).toBe(value)
    })
  })
})
