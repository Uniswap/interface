import { WalletContextState } from '@solana/wallet-adapter-react'
import { renderHook } from '@testing-library/react'
import { useSolanaConnectionService, useSVMWalletConnectors } from 'features/wallet/connection/connectors/solana'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}))

vi.mock('utilities/src/time/timing', () => ({
  sleep: vi.fn().mockResolvedValue(true),
}))

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
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

// Mock wallet context setup
const createMockWalletContext = (
  wallets: Array<{ name: string; icon: string; connect?: any; readyState: WalletReadyState }> = [],
): WalletContextState => {
  const mockSelect = vi.fn()
  const mockConnect = vi.fn()

  return {
    wallets: wallets.map((wallet) => ({
      adapter: {
        name: wallet.name,
        icon: wallet.icon,
        connect: wallet.connect || mockConnect,
      },
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

  describe('useSVMWalletConnectors', () => {
    it('should return empty array if Solana feature flag is false', () => {
      mocked(useFeatureFlag).mockImplementation((_) => false)

      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSVMWalletConnectors())

      expect(result.current).toEqual([])
    })

    it('should return solana wallet connectors from context', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useSVMWalletConnectors())

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0]).toEqual({
        name: 'Phantom',
        icon: 'phantom-icon.svg',
        solana: { walletName: 'Phantom' },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should handle multiple wallets', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
        { name: 'Solflare', icon: 'solflare-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useSVMWalletConnectors())

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current[0]).toEqual({
        name: 'Phantom',
        icon: 'phantom-icon.svg',
        solana: { walletName: 'Phantom' },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
      expect(result.current[1]).toEqual({
        name: 'Solflare',
        icon: 'solflare-icon.svg',
        solana: { walletName: 'Solflare' },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should handle empty wallets array', () => {
      // Arrange
      const mockContext = createMockWalletContext([])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useSVMWalletConnectors())

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should handle wallets without icons', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: undefined as any, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useSVMWalletConnectors())

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0]).toEqual({
        name: 'Phantom',
        icon: undefined,
        solana: { walletName: 'Phantom' },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should memoize result based on wallet context', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result, rerender } = renderHook(() => useSVMWalletConnectors())

      // Assert
      const firstResult = result.current
      rerender()
      expect(result.current).toBe(firstResult) // Should be memoized
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
      const mockConnect = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithPhantom))

      // Act
      await result.current.connect({ wallet: mockPhantomWallet })

      // Assert
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
      expect(mockConnect).toHaveBeenCalled()
    })

    it('should gracefully handle error when wallet adapter is not found', async () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithPhantom))
      const wallet: ExternalWallet = {
        id: 'unknown',
        name: 'Unknown Wallet',
        signingCapability: SigningCapability.Interactive,
        addresses: [],
        connectorIds: {
          [Platform.SVM]: 'SolanaAdapter_Phantom',
        },
        analyticsWalletType: 'Browser Extension',
      }
      // Act & Assert
      await expect(result.current.connect({ wallet })).resolves.toMatchObject({ connected: true })
      expect(mockContext.select).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      // Arrange
      const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'))
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useSolanaConnectionService(mockGetConnectorWithPhantom))

      // Act & Assert
      await expect(result.current.connect({ wallet: mockPhantomWallet })).rejects.toThrow('Connection failed')
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
    })

    it('should work with different wallet names', async () => {
      // Arrange
      const mockConnect = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
        { name: 'Solflare', icon: 'solflare-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
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
