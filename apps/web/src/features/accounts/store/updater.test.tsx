import { useActiveAddresses, useActiveWallet, useConnectionStatus } from 'features/accounts/store/hooks'
import type { ExternalWallet } from 'features/accounts/store/types'
import { WebAccountsStoreUpdater } from 'features/accounts/store/updater'
import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import type { ConnectionStatusInfo } from 'uniswap/src/features/accounts/store/types/Connector'
import { ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'

// Mock the hooks
vi.mock('features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(),
  useActiveWallet: vi.fn(),
  useConnectionStatus: vi.fn(() => ({ isConnected: true, isConnecting: false, isDisconnected: false })),
}))
vi.mock('hooks/useAccount')
vi.mock('hooks/useEthersProvider', () => ({
  useEthersWeb3Provider: () => ({
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn().mockResolvedValue('v1'),
  }),
}))

let mockWagmiChainId = 1

vi.mock('wagmi', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useAccount: () => ({ chainId: mockWagmiChainId }),
  }
})

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/user', async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    setUserProperty: vi.fn(),
  }
})

const ACCOUNT1 = '0x0000000000000000000000000000000000000000' as `0x${string}`
const ACCOUNT2 = '0x0000000000000000000000000000000000000001' as `0x${string}`
const SVM_ACCOUNT1 = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

const createMockWallet = (options: { evmAddress?: string; svmAddress?: string; name?: string }): ExternalWallet => {
  const { evmAddress, svmAddress, name = 'MetaMask' } = options
  return {
    id: evmAddress || svmAddress || 'wallet-id',
    name,
    signingCapability: SigningCapability.Interactive,
    addresses: [
      {
        ...(evmAddress ? { [Platform.EVM]: evmAddress as `0x${string}` } : {}),
        ...(svmAddress ? { [Platform.SVM]: svmAddress } : {}),
      },
    ],
    connectorIds: {
      ...(evmAddress ? { [Platform.EVM]: 'test-connector-evm' } : {}),
      ...(svmAddress ? { [Platform.SVM]: 'test-connector-svm' } : {}),
    },
    analyticsWalletType: 'injected',
  }
}

const mockDisconnectedConnectionStatus: ConnectionStatusInfo = {
  status: ConnectorStatus.Disconnected,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
}

const mockConnectedConnectionStatus: ConnectionStatusInfo = {
  status: ConnectorStatus.Connected,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
}

describe('WebAccountsStoreUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWagmiChainId = 1
    // Default mocks
    mocked(useAccount).mockReturnValue({
      address: undefined,
      connector: undefined,
      chainId: undefined,
    } as any)
    mocked(useActiveAddresses).mockReturnValue({
      evmAddress: undefined,
      svmAddress: undefined,
    })
    mocked(useActiveWallet).mockReturnValue(undefined)
    mocked(useConnectionStatus).mockReturnValue(mockDisconnectedConnectionStatus)
  })

  describe('analytics', () => {
    it('sends event when a wallet connects', () => {
      // Arrange - start with no wallet
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(undefined)
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - connect wallet
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MetaMask' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT1, name: 'MetaMask' }))
      rerender(<WebAccountsStoreUpdater />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        InterfaceEventName.WalletConnected,
        expect.objectContaining({
          result: WalletConnectionResult.Succeeded,
          wallet_address: ACCOUNT1,
          wallet_type: 'injected',
          is_reconnect: false,
          connected_VM: 'EVM',
        }),
      )
      expect(setUserProperty).toHaveBeenCalled()
    })

    it('sends event when a wallet with both EVM and SVM connects', () => {
      // Arrange - start with no wallet
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(undefined)
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - connect wallet with both EVM and SVM
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MultiChain Wallet' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: SVM_ACCOUNT1,
      })
      mocked(useActiveWallet).mockReturnValue(
        createMockWallet({ evmAddress: ACCOUNT1, svmAddress: SVM_ACCOUNT1, name: 'MultiChain Wallet' }),
      )
      rerender(<WebAccountsStoreUpdater />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        InterfaceEventName.WalletConnected,
        expect.objectContaining({
          result: WalletConnectionResult.Succeeded,
          wallet_address: ACCOUNT1,
          wallet_address_svm: SVM_ACCOUNT1,
          wallet_type: 'injected',
          wallet_type_svm: 'injected',
          is_reconnect: false,
          connected_VM: 'EVM+SVM',
        }),
      )
      expect(setUserProperty).toHaveBeenCalled()
    })

    it('does not send event when wallet address has not changed', () => {
      // Arrange - wallet already connected
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MetaMask' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT1 }))
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - rerender without change
      rerender(<WebAccountsStoreUpdater />)

      // Assert - no new events
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    })

    it('sends event when switching between different wallets', () => {
      // Arrange - start with wallet 1
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test1', name: 'MetaMask' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT1, name: 'MetaMask' }))
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - switch to wallet 2
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT2,
        connector: { id: 'test2', name: 'Coinbase' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT2,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT2, name: 'Coinbase' }))
      rerender(<WebAccountsStoreUpdater />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        InterfaceEventName.WalletConnected,
        expect.objectContaining({
          result: WalletConnectionResult.Succeeded,
          wallet_address: ACCOUNT2,
          wallet_type: 'injected',
          is_reconnect: false,
        }),
      )
    })

    it('sends disconnect event by clearing user properties', () => {
      // Arrange - start with connected wallet
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MetaMask' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT1 }))
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - disconnect wallet
      mocked(useAccount).mockReturnValue({
        address: undefined,
        connector: undefined,
        chainId: undefined,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(undefined)
      rerender(<WebAccountsStoreUpdater />)

      // Assert - user properties should be cleared
      expect(setUserProperty).toHaveBeenCalledWith(expect.any(String), '')
    })

    it('sends chain changed event when user switches networks', () => {
      // Arrange - start with wallet on chain 1
      mockWagmiChainId = 1
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MetaMask' },
        chainId: 1,
      } as any)
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: ACCOUNT1,
        svmAddress: undefined,
      })
      mocked(useActiveWallet).mockReturnValue(createMockWallet({ evmAddress: ACCOUNT1 }))
      const { rerender } = render(<WebAccountsStoreUpdater />)

      vi.clearAllMocks()

      // Act - switch to chain 137
      mockWagmiChainId = 137
      mocked(useAccount).mockReturnValue({
        address: ACCOUNT1,
        connector: { id: 'test', name: 'MetaMask' },
        chainId: 137,
      } as any)
      rerender(<WebAccountsStoreUpdater />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        InterfaceEventName.ChainChanged,
        expect.objectContaining({
          result: WalletConnectionResult.Succeeded,
          wallet_address: ACCOUNT1,
          chain_id: 137,
          previousConnectedChainId: 1,
        }),
      )
    })
  })
})
