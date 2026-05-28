import { handleRouteToPasskeyManagement } from 'pages/PasskeyManagement/index'

jest.mock('components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: jest.fn(),
}))

jest.mock('hooks/useAccount', () => ({
  useAccount: jest.fn(),
}))

jest.mock('hooks/useDisconnect', () => ({
  useDisconnect: jest.fn(),
}))

jest.mock('hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('state/application/hooks', () => ({
  useCloseModal: jest.fn(),
}))

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('pages/Swap', () => ({
  __esModule: true,
  default: () => null,
}))

describe('handleRouteToPasskeyManagement', () => {
  const mockSignInWithPasskey = jest.fn()
  const mockNavigate = jest.fn()
  const mockCloseRecentlyConnectedModal = jest.fn()
  const mockDisconnect = jest.fn()
  const mockNavigateToPasskeyManagement = jest.fn()
  const mockDispatch = jest.fn()

  const accountDrawerHasBeenOpenedRef = { current: false }
  const passkeyConnectionAttemptedRef = { current: false }

  const mockAccountDrawer = {
    open: jest.fn(),
    isOpen: false,
    close: jest.fn(),
    toggle: jest.fn(),
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
    jest.clearAllMocks()
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
