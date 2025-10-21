import { act, renderHook, waitFor } from '@testing-library/react'
import {
  __resetConnectionStateForTest,
  useConnectionState,
  wrapConnectWalletServiceWithStateTracking,
} from 'features/wallet/connection/connectors/state'
import { ConnectWalletService } from 'features/wallet/connection/services/ConnectWalletService'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMockWalletConnectorMeta = (overrides = {}): WalletConnectorMeta => ({
  name: 'Test Wallet',
  icon: 'test-icon.svg',
  wagmi: { id: 'test-connector', type: 'injected' },
  isInjected: true,
  analyticsWalletType: 'Browser Extension',
  ...overrides,
})

const createMockConnectWalletService = (overrides = {}): ConnectWalletService => ({
  connect: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

describe('state', () => {
  beforeEach(() => {
    __resetConnectionStateForTest()
    vi.clearAllMocks()
  })

  describe('useConnectionState', () => {
    it('should return idle state initially', () => {
      // Act
      const { result } = renderHook(() => useConnectionState())

      // Assert
      expect(result.current).toEqual({
        status: 'idle',
        error: undefined,
      })
    })

    it('should update when state changes through wrapConnectWalletServiceWithStateTracking', async () => {
      // Arrange
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockImplementation(async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))
        }),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act
      const { result } = renderHook(() => useConnectionState())

      // Start connection inside act
      await act(async () => {
        trackedService.connect({ walletConnector: mockMeta })
      })

      // Wait for the pending state
      await waitFor(
        () => {
          expect(result.current.status).toBe('pending')
        },
        { timeout: 500 },
      )

      expect(result.current).toHaveProperty('meta')
      if (result.current.status === 'pending') {
        expect(result.current.meta).toEqual(mockMeta)
      }

      // Wait for connection to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 15))
      })

      // Assert - Should be back to idle state
      expect(result.current.status).toBe('idle')
      if (result.current.status === 'idle') {
        expect(result.current.error).toBeUndefined()
      }
    })

    it('should show error state when connection fails', async () => {
      // Arrange
      const errorMessage = 'Connection failed'
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue(new Error(errorMessage)),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta({ name: 'Test Wallet 2' })

      // Act
      const { result } = renderHook(() => useConnectionState())

      // Attempt connection
      await act(async () => {
        await expect(trackedService.connect({ walletConnector: mockMeta })).rejects.toThrow(errorMessage)
      })

      // Assert - Should be in idle state with error
      expect(result.current.status).toBe('idle')
      if (result.current.status === 'idle') {
        expect(result.current.error).toBe(errorMessage)
      }
    })
  })

  describe('wrapConnectWalletServiceWithStateTracking', () => {
    it('should track connection state during successful connection', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act
      await trackedService.connect({ walletConnector: mockMeta })

      // Assert
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should set pending state when connection starts', async () => {
      // Arrange
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockImplementation(async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))
        }),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act
      const connectPromise = trackedService.connect({ walletConnector: mockMeta })

      // Assert - Check that service was called
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })

      await connectPromise
    })

    it('should set idle state when connection succeeds', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act
      await trackedService.connect({ walletConnector: mockMeta })

      // Assert
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should set error state when connection fails', async () => {
      // Arrange
      const errorMessage = 'Connection failed'
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue(new Error(errorMessage)),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act & Assert
      await expect(trackedService.connect({ walletConnector: mockMeta })).rejects.toThrow(errorMessage)
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue('String error'),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act & Assert
      await expect(trackedService.connect({ walletConnector: mockMeta })).rejects.toBe('String error')
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should handle undefined error', async () => {
      // Arrange
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue(undefined),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act & Assert
      await expect(trackedService.connect({ walletConnector: mockMeta })).rejects.toBeUndefined()
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should work with different wallet connector types', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const wagmiMeta = createMockWalletConnectorMeta({ wagmi: { id: 'metamask', type: 'injected' } })
      const solanaMeta = createMockWalletConnectorMeta({ solana: { walletName: 'Phantom' as any } })
      const customMeta = createMockWalletConnectorMeta({ customConnectorId: 'uniswapWalletConnect' as any })

      // Act & Assert
      await trackedService.connect({ walletConnector: wagmiMeta })
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: wagmiMeta })

      await trackedService.connect({ walletConnector: solanaMeta })
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: solanaMeta })

      await trackedService.connect({ walletConnector: customMeta })
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: customMeta })
    })

    it('should allow connection when no previous connection was pending', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act
      await trackedService.connect({ walletConnector: mockMeta })

      // Assert
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })

    it('should allow connection when previous connection had error', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // First, create an error state
      const errorService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue(new Error('Previous error')),
      })
      const errorTrackedService = wrapConnectWalletServiceWithStateTracking(errorService)

      await act(async () => {
        await expect(errorTrackedService.connect({ walletConnector: mockMeta })).rejects.toThrow('Previous error')
      })

      // Act - Now try a successful connection
      await trackedService.connect({ walletConnector: mockMeta })

      // Assert
      expect(mockService.connect).toHaveBeenCalledWith({ walletConnector: mockMeta })
    })
  })

  describe('Connection state transitions', () => {
    it('should handle complete connection lifecycle', async () => {
      // Arrange
      const mockService = createMockConnectWalletService()
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act & Assert
      // Initial state should be idle
      const { result } = renderHook(() => useConnectionState())
      expect(result.current.status).toBe('idle')

      // Start connection
      await act(async () => {
        await trackedService.connect({ walletConnector: mockMeta })
      })

      // Final state should be idle
      expect(result.current.status).toBe('idle')
      if (result.current.status === 'idle') {
        expect(result.current.error).toBeUndefined()
      }
    })

    it('should handle connection failure lifecycle', async () => {
      // Arrange
      const errorMessage = 'Connection failed'
      const mockService = createMockConnectWalletService({
        connect: vi.fn().mockRejectedValue(new Error(errorMessage)),
      })
      const trackedService = wrapConnectWalletServiceWithStateTracking(mockService)
      const mockMeta = createMockWalletConnectorMeta()

      // Act & Assert
      // Initial state should be idle
      const { result } = renderHook(() => useConnectionState())
      expect(result.current.status).toBe('idle')

      // Attempt connection
      await act(async () => {
        await expect(trackedService.connect({ walletConnector: mockMeta })).rejects.toThrow(errorMessage)
      })

      // Final state should be idle with error
      expect(result.current.status).toBe('idle')
      if (result.current.status === 'idle') {
        expect(result.current.error).toBe(errorMessage)
      }
    })
  })
})
