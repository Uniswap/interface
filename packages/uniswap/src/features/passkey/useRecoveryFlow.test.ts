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

    await waitFor(() => expect(result.current.pinError).toBe('Nope'))
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
})
