import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React, { type PropsWithChildren } from 'react'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { attemptPinDecryption } from 'uniswap/src/features/passkey/recoveryExecute'
import type { RecoveryPrivyAuth } from 'uniswap/src/features/passkey/recoveryPrivyAuth'
import { RecoveryStep, useRecoveryFlow } from 'uniswap/src/features/passkey/useRecoveryFlow'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchGetRecoveryConfig: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/passkey/recoveryExecute', () => ({
  attemptPinDecryption: vi.fn(),
}))

// hashAuthMethodId is deterministic and doesn't need mocking.

function buildPrivy(overrides: Partial<RecoveryPrivyAuth> = {}): RecoveryPrivyAuth {
  return {
    ready: true,
    getAccessToken: vi.fn().mockResolvedValue('access-token'),
    sendEmailCode: vi.fn().mockResolvedValue(undefined),
    loginWithEmailCode: vi.fn().mockResolvedValue(undefined),
    initOAuth: vi.fn().mockResolvedValue(undefined),
    generateAuthorizationSignature: vi.fn(),
    fetchEncryptedBlob: vi.fn().mockResolvedValue('blob-fixture'),
    oauthReturn: { pending: false, provider: null, providerEmail: undefined },
    clearOAuthReturn: vi.fn(),
    ...overrides,
  } as RecoveryPrivyAuth
}

function wrapper(): ({ children }: PropsWithChildren) => React.ReactElement {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useRecoveryFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts on Login when no OAuth is pending', () => {
    const { result } = renderHook(
      () =>
        useRecoveryFlow({
          privy: buildPrivy(),
          privyAppId: 'app-id',
          onPinDecryptSuccess: vi.fn(),
          setOauthError: vi.fn(),
        }),
      { wrapper: wrapper() },
    )
    expect(result.current.step).toBe(RecoveryStep.Login)
  })

  it('starts on OAuthLoading when OAuth return is pending', () => {
    const privy = buildPrivy({
      oauthReturn: { pending: true, provider: null, providerEmail: undefined },
    })
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper() },
    )
    expect(result.current.step).toBe(RecoveryStep.OAuthLoading)
  })

  it('selectEmailLogin transitions to EmailEntry', () => {
    const { result } = renderHook(
      () =>
        useRecoveryFlow({
          privy: buildPrivy(),
          privyAppId: 'app-id',
          onPinDecryptSuccess: vi.fn(),
          setOauthError: vi.fn(),
        }),
      { wrapper: wrapper() },
    )
    act(() => result.current.selectEmailLogin())
    expect(result.current.step).toBe(RecoveryStep.EmailEntry)
  })

  it('sendCode success moves to EmailCode', async () => {
    const privy = buildPrivy()
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper() },
    )
    act(() => result.current.selectEmailLogin())
    act(() => result.current.setEmail('user@example.com'))

    act(() => {
      result.current.sendCodeMutation.mutate()
    })
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EmailCode))
    expect(privy.sendEmailCode).toHaveBeenCalledWith('user@example.com')
  })

  it('submitCode success moves to EnterPin and stores encryptedKeyId', async () => {
    const privy = buildPrivy()
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper() },
    )
    act(() => result.current.selectEmailLogin())
    act(() => result.current.setEmail('user@example.com'))

    act(() => {
      result.current.submitCodeMutation.mutate('123456')
    })
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EnterPin))
    expect(result.current.recoveryWalletAddress).toBe('0xabc')
    expect(EmbeddedWalletApiClient.fetchGetRecoveryConfig).toHaveBeenCalledWith(
      expect.objectContaining({ authMethodId: expect.any(String) }),
      'access-token',
    )
  })

  it('successful PIN decrypt fires onPinDecryptSuccess and moves to Recovering', async () => {
    const privy = buildPrivy()
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)
    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: true,
      authPrivateKey: new Uint8Array(32),
    } as never)

    const onPinDecryptSuccess = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess, setOauthError: vi.fn() }),
      {
        wrapper: wrapper(),
      },
    )
    act(() => result.current.selectEmailLogin())
    act(() => result.current.setEmail('user@example.com'))
    act(() => {
      result.current.submitCodeMutation.mutate('123456')
    })
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EnterPin))

    // Complete all 4 PIN digits
    for (let i = 0; i < 4; i++) {
      act(() => result.current.passcodeInput.handleChange(i, String(i + 1)))
    }

    await waitFor(() => expect(onPinDecryptSuccess).toHaveBeenCalled())
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.Recovering))
  })

  it('wrong PIN sets pinError and does not call onPinDecryptSuccess', async () => {
    const privy = buildPrivy()
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)
    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: false,
      error: 'wrong_pin',
      errorMessage: 'Nope',
    } as never)

    const onPinDecryptSuccess = vi.fn()
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess, setOauthError: vi.fn() }),
      {
        wrapper: wrapper(),
      },
    )
    act(() => result.current.selectEmailLogin())
    act(() => result.current.setEmail('user@example.com'))
    act(() => {
      result.current.submitCodeMutation.mutate('123456')
    })
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EnterPin))

    for (let i = 0; i < 4; i++) {
      act(() => result.current.passcodeInput.handleChange(i, '0'))
    }

    // Wrong-PIN always shows the i18n string, ignoring the server's `errorMessage`,
    // so the user sees consistent product copy instead of generic SDK wording.
    await waitFor(() => expect(result.current.pinError).toBe('account.passkey.recovery.wrongPin'))
    expect(onPinDecryptSuccess).not.toHaveBeenCalled()
    expect(result.current.step).toBe(RecoveryStep.EnterPin)
  })

  it('handleBack steps EmailCode → EmailEntry', async () => {
    const privy = buildPrivy()
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper() },
    )
    act(() => result.current.selectEmailLogin())
    act(() => result.current.setEmail('user@example.com'))
    act(() => result.current.sendCodeMutation.mutate())
    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EmailCode))

    act(() => result.current.handleBack())
    expect(result.current.step).toBe(RecoveryStep.EmailEntry)
  })

  it('initOAuth is a no-op when Privy is not ready', async () => {
    const privy = buildPrivy({ ready: false })
    const { result } = renderHook(
      () => useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper() },
    )
    await act(async () => {
      await result.current.initOAuth('google')
    })
    expect(privy.initOAuth).not.toHaveBeenCalled()
  })

  it('mobile flow: initOAuth + matching oauthReturn advances from Login to EnterPin', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)

    // Mobile reports `pending: false`, so step starts and stays at Login. The effect
    // must advance once Privy reports the linked provider, gated on local `oauthProvider`.
    const { result, rerender } = renderHook(
      ({ privy }: { privy: RecoveryPrivyAuth }) =>
        useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper(), initialProps: { privy: buildPrivy() } },
    )
    expect(result.current.step).toBe(RecoveryStep.Login)

    await act(async () => {
      await result.current.initOAuth('google')
    })
    expect(result.current.step).toBe(RecoveryStep.Login)
    expect(result.current.oauthProvider).toBe('google')

    rerender({
      privy: buildPrivy({
        oauthReturn: { pending: false, provider: 'google', providerEmail: 'user@example.com' },
      }),
    })

    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.EnterPin))
    expect(result.current.recoveryWalletAddress).toBe('0xabc')
    expect(EmbeddedWalletApiClient.fetchGetRecoveryConfig).toHaveBeenCalledWith(
      expect.objectContaining({ authMethodId: expect.any(String) }),
      'access-token',
    )
  })

  it('OAuth path with no recovery config advances to NoWalletFound', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({} as never)

    const { result, rerender } = renderHook(
      ({ privy }: { privy: RecoveryPrivyAuth }) =>
        useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError: vi.fn() }),
      { wrapper: wrapper(), initialProps: { privy: buildPrivy() } },
    )

    await act(async () => {
      await result.current.initOAuth('google')
    })
    rerender({
      privy: buildPrivy({
        oauthReturn: { pending: false, provider: 'google', providerEmail: 'user@example.com' },
      }),
    })

    await waitFor(() => expect(result.current.step).toBe(RecoveryStep.NoWalletFound))
  })

  it('OAuth path: surfaces fetchEncryptedBlob failure via setOauthError and stays out of EnterPin', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)

    const setOauthError = vi.fn()
    const { result, rerender } = renderHook(
      ({ privy }: { privy: RecoveryPrivyAuth }) =>
        useRecoveryFlow({ privy, privyAppId: 'app-id', onPinDecryptSuccess: vi.fn(), setOauthError }),
      { wrapper: wrapper(), initialProps: { privy: buildPrivy() } },
    )

    await act(async () => {
      await result.current.initOAuth('google')
    })

    rerender({
      privy: buildPrivy({
        oauthReturn: { pending: false, provider: 'google', providerEmail: 'user@example.com' },
        fetchEncryptedBlob: vi.fn().mockRejectedValueOnce(new Error('rate limited')),
      }),
    })

    await waitFor(() => expect(setOauthError).toHaveBeenCalledWith('rate limited'))
    expect(result.current.step).not.toBe(RecoveryStep.EnterPin)
  })

  it('does not auto-advance from Login when Privy reports a linked account the user did not just initiate', async () => {
    const fetchGetRecoveryConfig = vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
      encryptedKeyId: 'key-id-1',
      walletAddress: '0xabc',
    } as never)

    // Stale Privy session (linked account from a prior flow). Without a fresh
    // `initOAuth` to set local `oauthProvider`, the effect must NOT advance.
    const { result } = renderHook(
      () =>
        useRecoveryFlow({
          privy: buildPrivy({
            oauthReturn: { pending: false, provider: 'google', providerEmail: 'stale@example.com' },
          }),
          privyAppId: 'app-id',
          onPinDecryptSuccess: vi.fn(),
          setOauthError: vi.fn(),
        }),
      { wrapper: wrapper() },
    )

    // Flush microtasks so any erroneous effect would have fired.
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.step).toBe(RecoveryStep.Login)
    expect(fetchGetRecoveryConfig).not.toHaveBeenCalled()
  })
})
