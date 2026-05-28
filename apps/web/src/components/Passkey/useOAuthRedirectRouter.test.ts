import { usePrivy } from '@privy-io/react-auth'
import { renderHook } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useOAuthRedirectRouter } from '~/components/Passkey/useOAuthRedirectRouter'
import { setOpenModal } from '~/state/application/reducer'

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}))

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/menuState', () => ({
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
