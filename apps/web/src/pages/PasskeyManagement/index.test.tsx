import { handleRouteToPasskeyManagement } from 'pages/PasskeyManagement/index'

vi.mock('components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(),
}))

vi.mock('hooks/useAccount', () => ({
  useAccount: vi.fn(),
}))

vi.mock('hooks/useDisconnect', () => ({
  useDisconnect: vi.fn(),
}))

vi.mock('hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(),
}))

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}))

vi.mock('state/application/hooks', () => ({
  useCloseModal: vi.fn(),
}))

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}))

vi.mock('pages/Swap', () => ({
  __esModule: true,
  default: () => null,
}))

describe('handleRouteToPasskeyManagement', () => {
  const mockSignInWithPasskey = vi.fn()
  const mockNavigate = vi.fn()
  const mockCloseRecentlyConnectedModal = vi.fn()
  const mockDisconnect = vi.fn()
  const mockNavigateToPasskeyManagement = vi.fn()
  const mockDispatch = vi.fn()

  const accountDrawerHasBeenOpenedRef = { current: false }
  const passkeyConnectionAttemptedRef = { current: false }

  const mockAccountDrawer = {
    open: vi.fn(),
    isOpen: false,
    close: vi.fn(),
    toggle: vi.fn(),
  }

  const defaultDependencies = {
    account: {
      isConnecting: false,
      address: undefined,
    },
    embeddedWalletAddress: '0xEmbeddedWalletAddress',
    dispatch: mockDispatch,
    signInWithPasskey: mockSignInWithPasskey,
    accountDrawerHasBeenOpenedRef,
    passkeyConnectionAttemptedRef,
    navigate: mockNavigate,
    closeRecentlyConnectedModal: mockCloseRecentlyConnectedModal,
    accountDrawer: mockAccountDrawer,
    disconnect: mockDisconnect,
    navigateToPasskeyManagement: mockNavigateToPasskeyManagement,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    accountDrawerHasBeenOpenedRef.current = false
    passkeyConnectionAttemptedRef.current = false
  })

  it('does nothing if user is actively connecting', () => {
    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: true,
        address: undefined,
      },
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockSignInWithPasskey).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockCloseRecentlyConnectedModal).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockNavigateToPasskeyManagement).not.toHaveBeenCalled()
  })

  it('attempts passkey sign in if user is not connected and has not been prompted', () => {
    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: false,
        address: undefined,
      },
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockCloseRecentlyConnectedModal).toHaveBeenCalled()
    expect(mockAccountDrawer.open).toHaveBeenCalled()
    expect(mockSignInWithPasskey).toHaveBeenCalled()
    expect(passkeyConnectionAttemptedRef.current).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockNavigateToPasskeyManagement).not.toHaveBeenCalled()
  })

  it('navigates to swap if user has been prompted to sign in but address is not embedded wallet', () => {
    passkeyConnectionAttemptedRef.current = true

    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: false,
        address: '0xWalletAddress',
      },
      embeddedWalletAddress: '0xDifferentEmbeddedWalletAddress',
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockNavigate).toHaveBeenCalledWith('/swap')
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockNavigateToPasskeyManagement).not.toHaveBeenCalled()
  })

  it('disconnects wallet if address is not embedded wallet and user has not been prompted to sign in', () => {
    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: false,
        address: '0xWalletAddress',
      },
      embeddedWalletAddress: '0xDifferentEmbeddedWalletAddress',
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockDispatch).toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockNavigateToPasskeyManagement).not.toHaveBeenCalled()
  })

  it('navigates to passkey management if user is connected with embedded wallet and account drawer has not been opened', () => {
    const embeddedWalletAddress = '0xEmbeddedWalletAddress'

    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: false,
        address: embeddedWalletAddress,
      },
      embeddedWalletAddress,
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockNavigateToPasskeyManagement).toHaveBeenCalled()
    expect(mockSignInWithPasskey).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
  })

  it('does nothing if account drawer has been opened already', () => {
    const embeddedWalletAddress = '0xEmbeddedWalletAddress'
    accountDrawerHasBeenOpenedRef.current = true

    const dependencies = {
      ...defaultDependencies,
      account: {
        isConnecting: false,
        address: embeddedWalletAddress,
      },
      embeddedWalletAddress,
    }

    const handler = handleRouteToPasskeyManagement(dependencies)
    handler()

    expect(mockNavigateToPasskeyManagement).not.toHaveBeenCalled()
    expect(mockSignInWithPasskey).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
  })
})
