import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  createNewEmbeddedWallet,
  signInWithPasskey as signInWithPasskeyAPI,
} from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
import { logPasskeyRejection } from '@universe/embedded-wallet/src/features/passkey/passkeyRejection'
import type { SignInWithPasskeyDeps } from '@universe/embedded-wallet/src/hooks/types'
import { useSignInWithPasskey } from '@universe/embedded-wallet/src/hooks/useSignInWithPasskey.web'
import React, { type PropsWithChildren } from 'react'
import { logger } from 'utilities/src/logger/logger'

vi.mock('@universe/embedded-wallet/src/features/passkey/embeddedWallet', () => ({
  createNewEmbeddedWallet: vi.fn(),
  signInWithPasskey: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/signing', () => ({
  signMessageWithPasskey: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/state/embeddedWalletStore', () => ({
  useEmbeddedWalletState: (): { walletId: null; setWalletId: () => void } => ({ walletId: null, setWalletId: vi.fn() }),
}))

vi.mock('uniswap/src/features/unitags/hooks/useClaimUnitag', () => ({
  useClaimUnitag: (): (() => void) => vi.fn(),
}))

function wrapper({ children }: PropsWithChildren): React.ReactElement {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function makeDeps(): SignInWithPasskeyDeps {
  return {
    completeLogin: vi.fn(),
    onRateLimited: vi.fn(),
    onUnsupportedPasskeyCreation: vi.fn(),
    getConnectorMeta: () => ({ name: 'Uniswap Embedded Wallet', amplitudeType: 'embedded' }),
    isIFramed: () => false,
  }
}

describe(useSignInWithPasskey, () => {
  beforeEach(() => {
    vi.spyOn(logger, 'debug').mockImplementation(() => undefined)
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('still shows the unsupported-browser modal and calls onError when wallet creation fails', async () => {
    const error = Object.assign(new Error('Authenticator error'), { code: 'ERROR_AUTHENTICATOR_GENERAL_ERROR' })
    vi.mocked(createNewEmbeddedWallet).mockRejectedValue(error)
    const deps = makeDeps()
    const onError = vi.fn()

    const { result } = renderHook(() => useSignInWithPasskey({ createNewWallet: true, onError, deps }), { wrapper })
    act(() => result.current.signInWithPasskey())

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    expect(deps.onUnsupportedPasskeyCreation).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('calls onError for a cancelled sign-in without logging it again at error', async () => {
    const cancel = Object.assign(new Error('The operation either timed out or was not allowed.'), {
      name: 'NotAllowedError',
    })
    // The prompt layer reports the cancel first, as passkeySession does.
    vi.mocked(signInWithPasskeyAPI).mockImplementation(async () => {
      logPasskeyRejection(cancel, { file: 'passkeySession.ts', function: 'authenticateWithPasskey' })
      throw cancel
    })
    const onError = vi.fn()

    const { result } = renderHook(() => useSignInWithPasskey({ onError, deps: makeDeps() }), { wrapper })
    act(() => result.current.signInWithPasskey())

    await waitFor(() => expect(onError).toHaveBeenCalledWith(cancel))
    expect(logger.debug).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
  })
})
