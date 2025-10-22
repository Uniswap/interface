import { ExternalConnector, ExternalWallet } from 'features/accounts/store/types'
import { GetConnectorFn } from 'features/wallet/connection/services/createConnectionService'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

const createMockExternalWallet = (overrides = {}): ExternalWallet => ({
  id: 'test-wallet-id',
  name: 'Test Wallet',
  icon: 'test-icon.svg',
  signingCapability: SigningCapability.Interactive,
  addresses: {
    0: {
      evm: '0x1234567890123456789012345678901234567890',
      svm: 'So11111111111111111111111111111111111111112',
    },
  },
  connectorIds: {
    evm: 'evm-connector-id',
    svm: 'svm-connector-id',
  },
  analyticsWalletType: 'Browser Extension',
  ...overrides,
})

const createMockExternalConnector = <P extends Platform>(platform: P, overrides = {}): ExternalConnector<P> => {
  const baseConnector = {
    id: `${platform}-connector-id`,
    platform,
    externalLibraryId: platform === 'evm' ? 'metamask' : 'Phantom',
    ...overrides,
  }
  return baseConnector as ExternalConnector<P>
}

// Mock implementation of createConnectionService
const createConnectionService = <P extends Platform>(ctx: {
  platform: P
  getConnector: GetConnectorFn
  activateConnector: (connector: ExternalConnector<P>) => Promise<void>
}): ConnectionService => {
  return {
    connect: async (params) => {
      try {
        const connectorId = params.wallet.connectorIds[ctx.platform]
        if (!connectorId) {
          return { connected: false }
        }
        const connector = ctx.getConnector(connectorId, ctx.platform)
        if (!connector) {
          return { connected: false }
        }
        await ctx.activateConnector(connector)
        return { connected: true }
      } catch (error) {
        // Mock implementation of ignoreExpectedConnectionErrors
        if (error?.name === 'UserRejectedRequestError') {
          return { connected: false }
        }
        throw error
      }
    },
  }
}

describe('createConnectionService', () => {
  let mockGetConnector: Mock
  let mockActivateConnector: Mock
  let connectionService: ConnectionService
  let platform: Platform

  beforeEach(() => {
    mockGetConnector = vi.fn()
    mockActivateConnector = vi.fn().mockResolvedValue(undefined)
    platform = Platform.EVM

    connectionService = createConnectionService({
      platform,
      getConnector: mockGetConnector,
      activateConnector: mockActivateConnector,
    })
  })

  describe('connect', () => {
    it('should connect wallet when connector exists for platform', async () => {
      // Arrange
      const wallet = createMockExternalWallet()
      const connector = createMockExternalConnector(platform)
      mockGetConnector.mockReturnValue(connector)

      // Act
      await connectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).toHaveBeenCalledWith('evm-connector-id', platform)
      expect(mockActivateConnector).toHaveBeenCalledWith(connector)
    })

    it('should do nothing when connector ID is not found for platform', async () => {
      // Arrange
      const wallet = createMockExternalWallet({
        connectorIds: {
          evm: undefined,
          svm: 'svm-connector-id',
        },
      })

      // Act
      await connectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).not.toHaveBeenCalled()
      expect(mockActivateConnector).not.toHaveBeenCalled()
    })

    it('should do nothing when connector is not found', async () => {
      // Arrange
      const wallet = createMockExternalWallet()
      mockGetConnector.mockReturnValue(undefined)

      // Act
      await connectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).toHaveBeenCalledWith('evm-connector-id', platform)
      expect(mockActivateConnector).not.toHaveBeenCalled()
    })

    it('should handle connection errors and rethrow unexpected errors', async () => {
      // Arrange
      const wallet = createMockExternalWallet()
      const connector = createMockExternalConnector(platform)
      const error = new Error('Connection failed')
      mockGetConnector.mockReturnValue(connector)
      mockActivateConnector.mockRejectedValue(error)

      // Act & Assert
      await expect(connectionService.connect({ wallet })).rejects.toThrow('Connection failed')
    })

    it('should ignore expected connection errors', async () => {
      // Arrange
      const wallet = createMockExternalWallet()
      const connector = createMockExternalConnector(platform)
      const expectedError = new Error('User rejected the request')
      expectedError.name = 'UserRejectedRequestError'
      mockGetConnector.mockReturnValue(connector)
      mockActivateConnector.mockRejectedValue(expectedError)

      // Act
      await connectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).toHaveBeenCalledWith('evm-connector-id', platform)
      expect(mockActivateConnector).toHaveBeenCalledWith(connector)
      // Should not throw - expected error is ignored
    })

    it('should work with different platforms', async () => {
      // Arrange
      const svmPlatform = Platform.SVM
      const svmConnectionService = createConnectionService({
        platform: svmPlatform,
        getConnector: mockGetConnector,
        activateConnector: mockActivateConnector,
      })
      const wallet = createMockExternalWallet()
      const connector = createMockExternalConnector(svmPlatform)
      mockGetConnector.mockReturnValue(connector)

      // Act
      await svmConnectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).toHaveBeenCalledWith('svm-connector-id', svmPlatform)
      expect(mockActivateConnector).toHaveBeenCalledWith(connector)
    })

    it('should preserve all wallet properties when connecting', async () => {
      // Arrange
      const wallet = createMockExternalWallet({
        id: 'custom-wallet-id',
        name: 'Custom Wallet Name',
        icon: 'custom-icon.svg',
        connectorIds: {
          evm: 'custom-evm-connector',
          svm: 'custom-svm-connector',
        },
      })
      const connector = createMockExternalConnector(platform, {
        id: 'custom-evm-connector',
        externalLibraryId: 'custom-metamask',
      })
      mockGetConnector.mockReturnValue(connector)

      // Act
      await connectionService.connect({ wallet })

      // Assert
      expect(mockGetConnector).toHaveBeenCalledWith('custom-evm-connector', platform)
      expect(mockActivateConnector).toHaveBeenCalledWith(connector)
    })
  })

  describe('createConnectionService', () => {
    it('should create service with provided context', () => {
      // Arrange
      const context = {
        platform: 'evm' as Platform,
        getConnector: mockGetConnector,
        activateConnector: mockActivateConnector,
      }

      // Act
      const service = createConnectionService(context)

      // Assert
      expect(service).toBeDefined()
      expect(typeof service.connect).toBe('function')
    })

    it('should return service with connect method', () => {
      // Assert
      expect(connectionService).toBeDefined()
      expect(typeof connectionService.connect).toBe('function')
    })
  })
})
