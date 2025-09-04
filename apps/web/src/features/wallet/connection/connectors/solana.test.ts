import { WalletContextState } from '@solana/wallet-adapter-react'
import { renderHook } from '@testing-library/react'
import { useConnectSolanaWallet, useSVMWalletConnectors } from 'features/wallet/connection/connectors/solana'
import type { SolanaWalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
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
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { mocked } from 'test-utils/mocked'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { sleep } from 'utilities/src/time/timing'

const mockSleep = vi.mocked(sleep)
const mockUseWallet = vi.mocked(useWallet)

// Helper function to create properly typed Solana wallet connectors
const createSolanaWalletConnector = ({
  name,
  icon,
  isInjected,
}: {
  name: string
  icon: string
  isInjected: boolean
}): SolanaWalletConnectorMeta => ({
  name,
  icon,
  isInjected,
  analyticsWalletType: isInjected ? 'Browser Extension' : name,
  solana: { walletName: name as any },
})

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
    it('should return a function to connect solana wallet', () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)

      // Act
      const { result } = renderHook(() => useConnectSolanaWallet())

      // Assert
      expect(typeof result.current).toBe('function')
    })

    it('should connect to solana wallet successfully', async () => {
      // Arrange
      const mockConnect = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({ name: 'Phantom', icon: 'phantom-icon.svg', isInjected: true })

      // Act
      await result.current(connector)

      // Assert
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
      expect(mockConnect).toHaveBeenCalled()
    })

    it('should throw error when wallet adapter is not found', async () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({
        name: 'Unknown Wallet',
        icon: 'unknown-icon.svg',
        isInjected: true,
      })

      // Act & Assert
      await expect(result.current(connector)).rejects.toThrow(
        'Solana Wallet Adapter not found for wallet Unknown Wallet',
      )
      expect(mockContext.select).not.toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      // Arrange
      const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'))
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({ name: 'Phantom', icon: 'phantom-icon.svg', isInjected: true })

      // Act & Assert
      await expect(result.current(connector)).rejects.toThrow('Connection failed')
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
      expect(mockSleep).toHaveBeenCalledWith(10)
    })

    it('should handle select errors', async () => {
      // Arrange
      const mockSelect = vi.fn().mockImplementation(() => {
        throw new Error('Selection failed')
      })
      const mockContext = {
        wallets: [
          {
            adapter: { name: 'Phantom', icon: 'phantom-icon.svg', connect: vi.fn() },
            readyState: WalletReadyState.NotDetected,
          },
        ],
        select: mockSelect,
      } as unknown as WalletContextState
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({ name: 'Phantom', icon: 'phantom-icon.svg', isInjected: false })

      // Act & Assert
      await expect(result.current(connector)).rejects.toThrow('Selection failed')
    })

    it('should handle sleep errors', async () => {
      // Arrange
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      mockSleep.mockRejectedValue(new Error('Sleep failed'))
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({ name: 'Phantom', icon: 'phantom-icon.svg', isInjected: true })

      // Act & Assert
      await expect(result.current(connector)).rejects.toThrow('Sleep failed')
      expect(mockContext.select).toHaveBeenCalledWith('Phantom')
    })

    it('should work with different wallet names', async () => {
      // Arrange
      const mockConnect = vi.fn().mockResolvedValue(undefined)
      const mockContext = createMockWalletContext([
        { name: 'Phantom', icon: 'phantom-icon.svg', readyState: WalletReadyState.Installed },
        { name: 'Solflare', icon: 'solflare-icon.svg', connect: mockConnect, readyState: WalletReadyState.Installed },
      ])
      mockUseWallet.mockReturnValue(mockContext)
      const { result } = renderHook(() => useConnectSolanaWallet())
      const connector = createSolanaWalletConnector({ name: 'Solflare', icon: 'solflare-icon.svg', isInjected: true })

      // Act
      await result.current(connector)

      // Assert
      expect(mockContext.select).toHaveBeenCalledWith('Solflare')
      expect(mockSleep).toHaveBeenCalledWith(10)
      expect(mockConnect).toHaveBeenCalled()
    })
  })
})
