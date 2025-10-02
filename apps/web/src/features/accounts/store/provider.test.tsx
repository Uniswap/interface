import { WalletReadyState as SolanaWalletReadyState } from '@solana/wallet-adapter-base'
import { useAccountsStoreContext } from 'features/accounts/store/provider'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

// Mock wagmi hooks
const mockUseWagmiAccount = vitest.fn()
const mockUseWagmiConnectors = vitest.fn()
const mockUseWagmiChainId = vitest.fn()
const mockUsePendingConnectorId = vitest.fn()

// Mock Solana wallet adapter
const mockUseSolanaWallet = vitest.fn()

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useAccount: () => mockUseWagmiAccount(),
  useConnectors: () => mockUseWagmiConnectors(),
  useChainId: () => mockUseWagmiChainId(),
}))

vi.mock('uniswap/src/features/gating/hooks', async () => {
  const actual = await vi.importActual('uniswap/src/features/gating/hooks')
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

vi.mock('features/wallet/connection/connectors/state', () => ({
  usePendingConnectorId: () => mockUsePendingConnectorId(),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockUseSolanaWallet(),
  WalletProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('Web Accounts Store Provider', () => {
  const createMockWagmiConnector = (overrides = {}) => ({
    id: 'metamask',
    name: 'MetaMask',
    icon: 'metamask-icon',
    type: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
    ...overrides,
  })

  const createMockWagmiAccount = (overrides = {}) => ({
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    status: 'connected' as const,
    connector: createMockWagmiConnector(),
    ...overrides,
  })

  const createMockSolanaWallet = (overrides = {}) => ({
    adapter: {
      name: 'Phantom',
      icon: 'phantom-icon',
      connected: true,
      connecting: false,
      publicKey: {
        toBase58: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
    },
    readyState: SolanaWalletReadyState.Installed,
    ...overrides,
  })

  const createMockSolanaWalletContext = (overrides = {}) => ({
    wallet: createMockSolanaWallet(),
    wallets: [createMockSolanaWallet()],
    ...overrides,
  })

  const renderWithProvider = () => {
    return renderHook(() => useAccountsStoreContext())
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseWagmiAccount.mockReturnValue(createMockWagmiAccount())
    mockUseWagmiConnectors.mockReturnValue([createMockWagmiConnector()])
    mockUseWagmiChainId.mockReturnValue(1)
    mockUsePendingConnectorId.mockReturnValue(null)
    mockUseSolanaWallet.mockReturnValue(createMockSolanaWalletContext())

    // Enable Solana feature flag by default
    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.Solana) {
        return true
      }
      return false
    })
  })

  describe('Given a connected MetaMask wallet on EVM', () => {
    it('When the provider builds the accounts state, Then it should create the correct EVM connector and wallet', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        status: 'connected',
      })
      const wagmiConnector = createMockWagmiConnector({
        id: 'metamask',
        name: 'MetaMask',
        type: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)
      mockUseWagmiConnectors.mockReturnValue([wagmiConnector])

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.activeConnectors.evm).toBeDefined()
      expect(state.activeConnectors.evm?.platform).toBe(Platform.EVM)
      expect(state.activeConnectors.evm?.status).toBe(ConnectorStatus.Connected)
      expect(state.activeConnectors.evm?.access).toBe('Injected')
      expect(state.activeConnectors.evm?.externalLibraryId).toBe('metamask')

      expect(state.wallets).toHaveProperty('metamask')
      expect(state.wallets.metamask.name).toBe('MetaMask')
      expect(state.wallets.metamask.signingCapability).toBe(SigningCapability.Interactive)
      expect(state.wallets.metamask.addresses[0].evm).toBe('0x1234567890123456789012345678901234567890')

      expect(state.accounts).toHaveProperty('0x1234567890123456789012345678901234567890')
      expect(state.accounts['0x1234567890123456789012345678901234567890'].platform).toBe(Platform.EVM)
      expect(state.accounts['0x1234567890123456789012345678901234567890'].walletId).toBe('metamask')
    })
  })

  describe('Given a connected Phantom wallet on SVM', () => {
    it('When the provider builds the accounts state, Then it should create the correct SVM connector and wallet', () => {
      // Given
      const solanaWallet = createMockSolanaWallet({
        adapter: {
          name: 'Phantom',
          icon: 'phantom-icon',
          connected: true,
          connecting: false,
          publicKey: {
            toBase58: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          },
        },
        readyState: SolanaWalletReadyState.Installed,
      })

      mockUseSolanaWallet.mockReturnValue({
        wallet: solanaWallet,
        wallets: [solanaWallet],
      })

      // Ensure Solana feature flag is enabled for this test (already set in beforeEach)

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.activeConnectors.svm).toBeDefined()
      expect(state.activeConnectors.svm?.platform).toBe(Platform.SVM)
      expect(state.activeConnectors.svm?.status).toBe(ConnectorStatus.Connected)
      expect(state.activeConnectors.svm?.access).toBe('Injected')
      expect(state.activeConnectors.svm?.externalLibraryId).toBe('Phantom')

      expect(state.wallets).toHaveProperty('Phantom')
      expect(state.wallets.Phantom.name).toBe('Phantom')
      expect(state.wallets.Phantom.signingCapability).toBe(SigningCapability.Interactive)
      expect(state.wallets.Phantom.addresses[0].svm).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')

      expect(state.accounts).toHaveProperty('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      expect(state.accounts['9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'].platform).toBe(Platform.SVM)
      expect(state.accounts['9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'].walletId).toBe('Phantom')
    })
  })

  describe('Given a cross-platform wallet (MetaMask on both EVM and SVM)', () => {
    it('When the provider builds the accounts state, Then it should deduplicate the wallet and create connectors for both platforms', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        status: 'connected',
      })
      const wagmiConnector = createMockWagmiConnector({
        id: 'metamask',
        name: 'MetaMask',
        type: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
      })

      const solanaWallet = createMockSolanaWallet({
        adapter: {
          name: 'MetaMask',
          icon: 'metamask-icon',
          connected: true,
          connecting: false,
          publicKey: {
            toBase58: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          },
        },
        readyState: SolanaWalletReadyState.Installed,
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)
      mockUseWagmiConnectors.mockReturnValue([wagmiConnector])
      mockUseSolanaWallet.mockReturnValue({
        wallet: solanaWallet,
        wallets: [solanaWallet],
      })

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.activeConnectors.evm).toBeDefined()
      expect(state.activeConnectors.svm).toBeDefined()
      expect(state.activeConnectors.evm?.platform).toBe(Platform.EVM)
      expect(state.activeConnectors.svm?.platform).toBe(Platform.SVM)

      // Should have only one wallet (deduplicated)
      const walletIds = Object.keys(state.wallets)
      expect(walletIds).toHaveLength(2) // Uniswap wallet connect connector is added manually to store, so its always defined, hence length is 2
      expect(walletIds[0]).toBe('metamask') // EVM library ID takes precedence

      const wallet = state.wallets.metamask
      expect(wallet.addresses[0].evm).toBe('0x1234567890123456789012345678901234567890')
      expect(wallet.addresses[0].svm).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      expect(wallet.connectorIds.evm).toBe('WagmiConnector_metamask')
      expect(wallet.connectorIds.svm).toBe('SolanaWalletAdapter_MetaMask')

      // Should have accounts for both platforms
      expect(state.accounts).toHaveProperty('0x1234567890123456789012345678901234567890')
      expect(state.accounts).toHaveProperty('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    })
  })

  describe('Given a connecting wallet', () => {
    it('When the provider builds the accounts state, Then it should set the connector status to Connecting', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        status: 'connecting',
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.activeConnectors.evm?.status).toBe(ConnectorStatus.Connecting)
    })
  })

  describe('Given a disconnected wallet', () => {
    it('When the provider builds the accounts state, Then it should not include the connector in activeConnectors', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: undefined,
        chainId: 1,
        status: 'disconnected',
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.activeConnectors.evm).toBeUndefined()
      expect(state.connectors).toHaveProperty('WagmiConnector_metamask')
      expect(state.connectors.WagmiConnector_metamask.status).toBe(ConnectorStatus.Disconnected)
    })
  })

  describe('Given a wallet with unsupported chain', () => {
    it('When the provider builds the accounts state, Then it should create a session with unsupported chain info', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 999, // Unsupported chain
        status: 'connected',
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)

      // Mock console.error to prevent test failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      const session = state.activeConnectors.evm?.session
      expect(session).toBeDefined()
      expect(session?.chainScope.type).toBe(ChainScopeType.SingleChain)
      expect(session?.chainScope.currentChain.supportedByApp).toBe(false)
      expect((session?.chainScope.currentChain as any).unsupportedChain).toBe(999)

      // Clean up
      consoleSpy.mockRestore()
    })
  })

  describe('Given a pending connector', () => {
    it('When the provider builds the accounts state, Then it should treat the pending connector as active', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: undefined,
        chainId: 1,
        status: 'disconnected',
      })
      const wagmiConnector = createMockWagmiConnector({
        id: 'metamask',
        name: 'MetaMask',
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)
      mockUseWagmiConnectors.mockReturnValue([wagmiConnector])
      mockUsePendingConnectorId.mockReturnValue('metamask')

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      // Pending connectors are not included in activeConnectors when disconnected
      expect(state.activeConnectors.evm).toBeUndefined()
      expect(state.connectors).toHaveProperty('WagmiConnector_metamask')
      expect(state.connectors.WagmiConnector_metamask.status).toBe(ConnectorStatus.Disconnected)
    })
  })

  describe('Given multiple EVM connectors', () => {
    it('When the provider builds the accounts state, Then it should create connectors for all wallets', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        status: 'connected',
      })
      const metamaskConnector = createMockWagmiConnector({
        id: 'metamask',
        name: 'MetaMask',
        type: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
      })
      const coinbaseConnector = createMockWagmiConnector({
        id: 'coinbase',
        name: 'Coinbase Wallet',
        type: 'coinbaseWallet',
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)
      mockUseWagmiConnectors.mockReturnValue([metamaskConnector, coinbaseConnector])

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.connectors).toHaveProperty('WagmiConnector_metamask')
      expect(state.connectors).toHaveProperty('WagmiConnector_coinbase')
      expect(state.wallets).toHaveProperty('metamask')
      expect(state.wallets).toHaveProperty('coinbase')
    })
  })

  describe('Given multiple Solana wallets', () => {
    it('When the provider builds the accounts state, Then it should create connectors for all wallets', () => {
      // Given
      const phantomWallet = createMockSolanaWallet({
        adapter: {
          name: 'Phantom',
          icon: 'phantom-icon',
          connected: false,
          connecting: false,
          publicKey: null,
        },
        readyState: SolanaWalletReadyState.Installed,
      })
      const solflareWallet = createMockSolanaWallet({
        adapter: {
          name: 'Solflare',
          icon: 'solflare-icon',
          connected: true,
          connecting: false,
          publicKey: {
            toBase58: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          },
        },
        readyState: SolanaWalletReadyState.Installed,
      })

      mockUseSolanaWallet.mockReturnValue({
        wallet: solflareWallet,
        wallets: [phantomWallet, solflareWallet],
      })

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.connectors).toHaveProperty('SolanaWalletAdapter_Phantom')
      expect(state.connectors).toHaveProperty('SolanaWalletAdapter_Solflare')
      expect(state.wallets).toHaveProperty('Phantom')
      expect(state.wallets).toHaveProperty('Solflare')
      expect(state.activeConnectors.svm?.externalLibraryId).toBe('Solflare')
    })
  })

  describe('Given a wallet with SDK access pattern', () => {
    it('When the provider builds the accounts state, Then it should set the access pattern to SDK', () => {
      // Given
      const wagmiConnector = createMockWagmiConnector({
        id: 'walletconnect',
        name: 'WalletConnect',
        type: 'walletConnect', // Not injected
      })

      mockUseWagmiConnectors.mockReturnValue([wagmiConnector])

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.connectors.WagmiConnector_walletconnect.access).toBe('SDK')
    })
  })

  describe('Given a Solana wallet that is not installed', () => {
    it('When the provider builds the accounts state, Then it should set the access pattern to SDK', () => {
      // Given
      const solanaWallet = createMockSolanaWallet({
        adapter: {
          name: 'Phantom',
          icon: 'phantom-icon',
          connected: false,
          connecting: false,
          publicKey: null,
        },
        readyState: SolanaWalletReadyState.NotDetected,
      })

      mockUseSolanaWallet.mockReturnValue({
        wallet: null,
        wallets: [solanaWallet],
      })

      // When
      const { result } = renderWithProvider()
      const state = result.current.getState()

      // Then
      expect(state.connectors.SolanaWalletAdapter_Phantom.access).toBe('SDK')
    })
  })

  describe('Given a connected wallet without account info', () => {
    it('When the provider builds the accounts state, Then it should throw an error', () => {
      // Given
      const wagmiAccount = createMockWagmiAccount({
        address: undefined,
        chainId: 1,
        status: 'connected', // Connected but no address
      })

      mockUseWagmiAccount.mockReturnValue(wagmiAccount)

      // Mock console.error to prevent test failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // When & Then
      expect(() => {
        const { result } = renderWithProvider()
        // Access the state to trigger the error
        result.current.getState()
      }).toThrow('Connected status with no account info provided is not supported.')

      // Clean up
      consoleSpy.mockRestore()
    })
  })

  describe('Given the provider context', () => {
    it('When accessing the accounts store, Then it should provide all getter functions', () => {
      // Given
      const { result } = renderWithProvider()

      // When
      const store = result.current

      // Then
      expect(store.getState().getActiveAddress).toBeDefined()
      expect(store.getState().getActiveAddresses).toBeDefined()
      expect(store.getState().getActiveAccount).toBeDefined()
      expect(store.getState().getActiveWallet).toBeDefined()
      expect(store.getState().getConnectionStatus).toBeDefined()
      expect(store.getState().getActiveConnector).toBeDefined()
    })

    it('When calling getter functions, Then they should work correctly', () => {
      // Given
      const { result } = renderWithProvider()

      // When
      const evmAddress = result.current.getState().getActiveAddress(Platform.EVM)
      const svmAddress = result.current.getState().getActiveAddress(Platform.SVM)
      const connectionStatus = result.current.getState().getConnectionStatus(Platform.EVM)

      // Then
      expect(evmAddress).toBe('0x1234567890123456789012345678901234567890')
      expect(svmAddress).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      expect(connectionStatus).toMatchObject({
        status: ConnectorStatus.Connected,
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      })
    })
  })
})
