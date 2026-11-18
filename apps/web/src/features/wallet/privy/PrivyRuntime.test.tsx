import { useAuthorizationSignature, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { render } from '@testing-library/react'
import PrivyRuntime from '~/features/wallet/privy/PrivyRuntime'
import { getPrivyRuntimeSnapshot, OAUTH_EVENT_FANOUT } from '~/features/wallet/privy/privyRuntimeStore'
import { resetPrivyRuntime } from '~/test-utils/privyRuntime'

vi.mock('@privy-io/react-auth', () => ({
  PrivyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePrivy: vi.fn(),
  useLoginWithOAuth: vi.fn(),
  useLoginWithEmail: vi.fn(),
  useAuthorizationSignature: vi.fn(),
}))

vi.mock('~/config', () => ({
  getPrivyConfig: () => ({ appId: 'app-id', clientId: 'client-id' }),
}))

describe('PrivyRuntime', () => {
  afterEach(() => {
    resetPrivyRuntime()
  })

  it('publishes the hosted Privy hook results and hands Privy the OAuth fan-out', () => {
    const initOAuth = vi.fn()
    const sendCode = vi.fn()
    const generateAuthorizationSignature = vi.fn()
    vi.mocked(usePrivy).mockReturnValue({
      ready: true,
      authenticated: true,
      user: null,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    } as unknown as ReturnType<typeof usePrivy>)
    vi.mocked(useLoginWithOAuth).mockReturnValue({ initOAuth, loading: true } as unknown as ReturnType<
      typeof useLoginWithOAuth
    >)
    vi.mocked(useLoginWithEmail).mockReturnValue({ sendCode, loginWithCode: vi.fn() } as unknown as ReturnType<
      typeof useLoginWithEmail
    >)
    vi.mocked(useAuthorizationSignature).mockReturnValue({ generateAuthorizationSignature } as unknown as ReturnType<
      typeof useAuthorizationSignature
    >)

    render(<PrivyRuntime />)

    const snapshot = getPrivyRuntimeSnapshot()
    expect(snapshot.privy.ready).toBe(true)
    expect(snapshot.loginWithOAuth).toEqual({ initOAuth, loading: true })
    expect(snapshot.loginWithEmail.sendCode).toBe(sendCode)
    expect(snapshot.authorizationSignature.generateAuthorizationSignature).toBe(generateAuthorizationSignature)
    expect(useLoginWithOAuth).toHaveBeenCalledWith(OAUTH_EVENT_FANOUT)
  })
})
