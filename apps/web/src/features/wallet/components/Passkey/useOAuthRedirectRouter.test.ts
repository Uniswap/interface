import { usePrivy } from '@privy-io/react-auth'
import { renderHook } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useOAuthRedirectRouter } from '~/features/wallet/components/Passkey/useOAuthRedirectRouter'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { MenuStateVariant, useSetMenu } from '~/state/accountDrawer/menuState'
import { setOpenModal } from '~/state/application/reducer'

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}))

// `useMaybePrivy` only calls the (mocked) `usePrivy` when Privy is configured, so mark it configured here.
vi.mock('~/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/config')>()),
  getPrivyConfig: () => ({ appId: 'test-privy-app-id', clientId: 'test-privy-client-id' }),
}))

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
}))

vi.mock('~/state/accountDrawer/hooks', () => ({
  useAccountDrawer: vi.fn(),
}))

vi.mock('~/state/accountDrawer/menuState', () => ({
  useSetMenu: vi.fn(),
  MenuStateVariant: { PASSKEYS: 'PASSKEYS' },
}))

vi.mock('~/state/application/reducer', () => ({
  setOpenModal: vi.fn((arg: unknown) => ({ type: 'SET_OPEN_MODAL', payload: arg })),
}))

const mockDispatch = vi.fn()
const mockOpen = vi.fn()
const mockSetMenu = vi.fn()

function setupMocks({ ready = true }: { ready?: boolean } = {}) {
  vi.mocked(usePrivy).mockReturnValue({ ready } as unknown as ReturnType<typeof usePrivy>)
  vi.mocked(useDispatch).mockReturnValue(mockDispatch)
  vi.mocked(useAccountDrawer).mockReturnValue({ open: mockOpen } as unknown as ReturnType<typeof useAccountDrawer>)
  vi.mocked(useSetMenu).mockReturnValue(mockSetMenu)
}

describe('useOAuthRedirectRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('does nothing when no pending provider in sessionStorage', () => {
    setupMocks()
    renderHook(() => useOAuthRedirectRouter())

    expect(mockOpen).not.toHaveBeenCalled()
    expect(mockSetMenu).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does nothing when Privy is not ready yet', () => {
    sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')
    setupMocks({ ready: false })
    renderHook(() => useOAuthRedirectRouter())

    expect(mockOpen).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('opens drawer, sets menu, and dispatches AddBackupLogin modal when add-backup key is set', () => {
    sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')
    setupMocks()
    renderHook(() => useOAuthRedirectRouter())

    expect(mockOpen).toHaveBeenCalled()
    expect(mockSetMenu).toHaveBeenCalledWith({ variant: MenuStateVariant.PASSKEYS })
    expect(mockDispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.AddBackupLogin }))
  })

  it('dispatches RecoverWallet modal without opening drawer when recover key is set', () => {
    sessionStorage.setItem('recoverWallet:oauthProvider', 'google')
    setupMocks()
    renderHook(() => useOAuthRedirectRouter())

    expect(mockOpen).not.toHaveBeenCalled()
    expect(mockSetMenu).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.RecoverWallet }))
  })

  it('prefers add-backup key when both keys are set', () => {
    sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')
    sessionStorage.setItem('recoverWallet:oauthProvider', 'apple')
    setupMocks()
    renderHook(() => useOAuthRedirectRouter())

    expect(mockDispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.AddBackupLogin }))
  })

  it('leaves privy_oauth_* URL params in place for the headless code exchange', () => {
    // Regression (INFRA-3555): the router used to strip these params in the same effect that opens
    // the modal — before the modal's useLoginWithOAuth could mount and run the code exchange that
    // reads them from window.location.search. The flow then died silently.
    window.history.replaceState(
      {},
      '',
      '/swap?privy_oauth_state=state123&privy_oauth_provider=google&privy_oauth_code=code123',
    )
    sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')
    setupMocks()
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    renderHook(() => useOAuthRedirectRouter())

    expect(mockDispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.AddBackupLogin }))
    expect(replaceStateSpy).not.toHaveBeenCalled()
    expect(window.location.search).toContain('privy_oauth_code=code123')

    replaceStateSpy.mockRestore()
    window.history.replaceState({}, '', '/')
  })

  it('fires when ready transitions from false to true', () => {
    sessionStorage.setItem('recoverWallet:oauthProvider', 'google')
    setupMocks({ ready: false })

    const { rerender } = renderHook(() => useOAuthRedirectRouter())

    expect(mockDispatch).not.toHaveBeenCalled()

    vi.mocked(usePrivy).mockReturnValue({ ready: true } as unknown as ReturnType<typeof usePrivy>)
    rerender()

    expect(mockDispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.RecoverWallet }))
  })
})
