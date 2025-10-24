import { WalletContextState } from '@solana/wallet-adapter-react'
import { renderHook } from '@testing-library/react'
import { useSolanaConnectionService } from 'features/wallet/connection/connectors/solana'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}))

vi.mock('utilities/src/time/timing', () => ({
  sleep: vi.fn().mockResolvedValue(true),
}))

// Import mocked modules to get references to their functions
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { ExternalConnector, ExternalWallet } from 'features/accounts/store/types'
import { GetConnectorFn } from 'features/wallet/connection/services/createConnectionService'
import { mocked } from 'test-utils/mocked'
import { AccessPattern, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { sleep } from 'utilities/src/time/timing'

const mockSleep = vi.mocked(sleep)
const mockUseWallet = vi.mocked(useWallet)

const mockPhantomWallet: ExternalWallet = {
  id: 'Phantom',
  name: 'Phantom',
  icon: 'phantom-icon.svg',
  signingCapability: SigningCapability.Interactive,
  addresses: [],
  connectorIds: {
    [Platform.SVM]: 'SolanaAdapter_Phantom',
  },
  analyticsWalletType: 'Browser Extension',
}

const createMockGetConnector = (connectors: Record<string, ExternalConnector<Platform.SVM>>): GetConnectorFn => {
  return ((connectorId: string) => {
    return connectors[connectorId]
  }) as GetConnectorFn
}

const mockPhantomConnector: ExternalConnector<Platform.SVM> = {
  id: 'SolanaAdapter_Phantom',
  externalLibraryId: 'Phantom' as WalletName,
  access: AccessPattern.Injected,
  status: ConnectorStatus.Disconnected,
  platform: Platform.SVM,
}

const mockSolflareConnector: ExternalConnector<Platform.SVM> = {
  id: 'SolanaAdapter_Solflare',
  externalLibraryId: 'Solflare' as WalletName,
  access: AccessPattern.Injected,
  status: ConnectorStatus.Disconnected,
  platform: Platform.SVM,
}

const mockGetConnectorWithPhantom = createMockGetConnector({
  SolanaAdapter_Phantom: mockPhantomConnector,
})

const mockGetConnectorWithSolflare = createMockGetConnector({ SolanaAdapter_Solflare: mockSolflareConnector })

// Helper to create a mock adapter with event listeners
interface MockAdapterOptions {
  name: string
  icon: string
  connect?: ReturnType<typeof vi.fn>
  addListener?: ReturnType<typeof vi.fn>
  removeListener?: ReturnType<typeof vi.fn>
}

const createMockAdapter = (options: MockAdapterOptions) => ({
  name: options.name,
  icon: options.icon,
  connect: options.connect || vi.fn().mockResolvedValue(undefined),
  addListener: options.addListener || vi.fn(),
  removeListener: options.removeListener || vi.fn(),
})

// Mock wallet context setup
const createMockWalletContext = (
  wallets: Array<{ name: string; icon: string; connect?: ReturnType<typeof vi.fn>; readyState: WalletReadyState }> = [],
): WalletContextState => {
  const mockSelect = vi.fn()

  return {
    wallets: wallets.map((wallet) => ({
      adapter: createMockAdapter({
        name: wallet.name,
        icon: wallet.icon,
        connect: wallet.connect,
      }),
      readyState: wallet.readyState,
    })),
    select: mockSelect,
  } as unknown as WalletContextState
}

describe('Solana connectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSleep.mockResolvedValue(true)

    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.Solana) {
        return true
      }
      return false
    })
  })

  describe('useConnectSolanaWallet', () => {
    it('should return a service to connect solana wallet', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const mockGetConnector = createMockGetConnector({
        Phantom: {
          id: 'Phantom',
          externalLibraryId: 'Phantom' as WalletName,
          access: AccessPattern.Injected,
          status: ConnectorStatus.Disconnected,
          platform: Platform.SVM,
        },
      })

      // Act
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnector))

      // Assert
      expect(typeof result.current.connect).toBe('function')
    })

    it('should connect to solana wallet successfully', async () => {
      // Arrange
      const mockConnect = vi.fn()
      const mockAddListener = vi.fn()
      const mockRemoveListener = vi.fn()

      // Simulate immediate connection success
      mockAddListener.mockImplementation((event: string, handler: () => void) => {
        if (event === 'connect') {
          setTimeout(handler, 0) // Fire connect event
        }
      })

      const mockAdapter = createMockAdapter({
        name: 'Phantom',
        icon: 'phantom-icon.svg',
        connect: mockConnect,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      })

      const mockContext = createMockWalletContext([])
      mockContext.wallets = [
        {
          adapter: mockAdapter,
          readyState: WalletReadyState.Installed,
        },
      ] as any

      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithPhantom))

      // Act
      await result.current.connect({ wallet: mockPhantomWallet })

      // Assert
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
      expect(mockConnect).toHaveBeenCalled()
      expect(mockAddListener).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockAddListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockRemoveListener).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockRemoveListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should gracefully handle error when wallet adapter is not found', async () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Create a wallet with a connector that doesn't match any adapter
      const wallet: ExternalWallet = {
        id: 'unknown',
        name: 'Unknown Wallet',
        signingCapability: SigningCapability.Interactive,
        addresses: [],
        connectorIds: {
          [Platform.SVM]: 'SolanaAdapter_Unknown', // This won't match 'Phantom'
        },
        analyticsWalletType: 'Browser Extension',
      }

      // Mock the connector to have the wrong library ID
      const mockGetConnectorWithUnknown = createMockGetConnector({
        SolanaAdapter_Unknown: {
          id: 'SolanaAdapter_Unknown',
          externalLibraryId: 'UnknownWallet' as WalletName, // This won't match any adapter
          access: AccessPattern.Injected,
          status: ConnectorStatus.Disconnected,
          platform: Platform.SVM,
        },
      })

      const { result: result2 } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithUnknown))

      // Act & Assert - Should throw error because adapter not found
      await expect(result2.current.connect({ wallet })).rejects.toThrow(
        'Solana Wallet Adapter not found for wallet UnknownWallet',
      )
      expect(mockContext.select).not.toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      // Arrange
      const mockConnect = vi.fn()
      const mockAddListener = vi.fn()
      const mockRemoveListener = vi.fn()

      // Simulate error event firing
      mockAddListener.mockImplementation((event: string, handler: (error: Error) => void) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Connection failed')), 0)
        }
      })

      const mockAdapter = createMockAdapter({
        name: 'Phantom',
        icon: 'phantom-icon.svg',
        connect: mockConnect,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      })

      const mockContext = createMockWalletContext([])
      mockContext.wallets = [
        {
          adapter: mockAdapter,
          readyState: WalletReadyState.Installed,
        },
      ] as any

      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithPhantom))

      // Act & Assert
      await expect(result.current.connect({ wallet: mockPhantomWallet })).rejects.toThrow('Connection failed')
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
    })

    it('should work with different wallet names', async () => {
      // Arrange
      const mockConnect = vi.fn()
      const mockAddListener = vi.fn()
      const mockRemoveListener = vi.fn()

      // Simulate immediate connection success
      mockAddListener.mockImplementation((event: string, handler: () => void) => {
        if (event === 'connect') {
          setTimeout(handler, 0)
        }
      })

      const mockSolflareAdapter = createMockAdapter({
        name: 'Solflare',
        icon: 'solflare-icon.svg',
        connect: mockConnect,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      })

      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])

      // Add Solflare wallet
      mockContext.wallets.push({
        adapter: mockSolflareAdapter,
        readyState: WalletReadyState.Installed,
      } as any)

      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithSolflare))

      const wallet: ExternalWallet = {
        id: 'Solflare',
        name: 'Solflare',
        icon: 'solflare-icon.svg',
        signingCapability: SigningCapability.Interactive,
        addresses: [],
        connectorIds: {
          [Platform.SVM]: 'SolanaAdapter_Solflare',
        },
        analyticsWalletType: 'Browser Extension',
      }

      // Act
      await result.current.connect({ wallet })

      // Assert
      expect(mockContext.select).toHaveBeenCalledWith('Solflare')
      expect(mockSleep).toHaveBeenCalledWith(10)
      expect(mockConnect).toHaveBeenCalled()
    })
  })
})
