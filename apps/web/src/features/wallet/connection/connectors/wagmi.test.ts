import { renderHook } from '@testing-library/react'
// Import mocked modules to get references to their functions
import { Connector, CreateConnectorFn, connect, getConnectors } from '@wagmi/core'
import { activateWagmiConnector } from 'features/wallet/connection/connectors/wagmi'
import { AccessPattern, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConnectors } from 'wagmi'

const mockConnect = vi.mocked(connect)
const mockGetConnectors = vi.mocked(getConnectors)
const mockUseConnectors = vi.mocked(useConnectors)

// Mock dependencies
vi.mock('@wagmi/core', () => ({
  connect: vi.fn(),
  getConnectors: vi.fn(),
}))

vi.mock('components/Web3Provider/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('wagmi', () => ({
  useConnectors: vi.fn(),
}))

describe('Wagmi connectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connectWagmiWallet', () => {
    it('should connect to wagmi wallet successfully', async () => {
      // Arrange
      const mockConnector = { id: 'metamask', name: 'MetaMask', type: 'injected' } as Connector
      mockGetConnectors.mockReturnValue([mockConnector])
      mockConnect.mockResolvedValue({} as any)

      // Act
      await activateWagmiConnector({
        id: 'wagmiConnectorId_metamask',
        externalLibraryId: 'metamask',
        status: ConnectorStatus.Disconnected,
        access: AccessPattern.Injected,
        platform: Platform.EVM,
      })

      // Assert
      expect(mockGetConnectors).toHaveBeenCalledWith({})
      expect(mockConnect).toHaveBeenCalledWith({}, { connector: mockConnector })
    })

    it('should throw error when connector is not found', async () => {
      // Arrange
      mockGetConnectors.mockReturnValue([])

      // Act & Assert
      await expect(
        activateWagmiConnector({
          id: 'unknown',
          externalLibraryId: 'unknown',
          status: ConnectorStatus.Disconnected,
          access: AccessPattern.Injected,
          platform: Platform.EVM,
        }),
      ).rejects.toThrow('Wagmi connector not found for id unknown')
      expect(mockConnect).not.toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      // Arrange
      const mockConnector = { id: 'metamask', name: 'MetaMask', type: 'injected' } as Connector
      mockGetConnectors.mockReturnValue([mockConnector])
      const error = new Error('Connection failed')
      mockConnect.mockRejectedValue(error)

      // Act & Assert
      await expect(
        activateWagmiConnector({
          id: 'wagmiConnectorId_metamask',
          externalLibraryId: 'metamask',
          status: ConnectorStatus.Disconnected,
          access: AccessPattern.Injected,
          platform: Platform.EVM,
        }),
      ).rejects.toThrow('Connection failed')
      expect(mockGetConnectors).toHaveBeenCalledWith({})
    })

    it('should work with different connector IDs', async () => {
      // Arrange
      const mockConnector = { id: 'coinbase', name: 'Coinbase Wallet', type: 'coinbase' } as Connector
      mockGetConnectors.mockReturnValue([mockConnector])
      mockConnect.mockResolvedValue({} as any)

      // Act
      await activateWagmiConnector({
        id: 'wagmiConnectorId_coinbase',
        externalLibraryId: 'coinbase',
        status: ConnectorStatus.Disconnected,
        access: AccessPattern.Injected,
        platform: Platform.EVM,
      })

      // Assert
      expect(mockGetConnectors).toHaveBeenCalledWith({})
      expect(mockConnect).toHaveBeenCalledWith({}, { connector: mockConnector })
    })

    it('should handle multiple connectors and find the correct one', async () => {
      // Arrange
      const mockConnectors = [
        { id: 'metamask', name: 'MetaMask', type: 'injected' },
        { id: 'coinbase', name: 'Coinbase Wallet', type: 'coinbase' },
        { id: 'walletconnect', name: 'WalletConnect', type: 'walletconnect' },
      ] as unknown as Connector[]
      mockGetConnectors.mockReturnValue(mockConnectors)
      mockConnect.mockResolvedValue({} as any)

      // Act
      await activateWagmiConnector({
        id: 'wagmiConnectorId_coinbase',
        externalLibraryId: 'coinbase',
        status: ConnectorStatus.Disconnected,
        access: AccessPattern.Injected,
        platform: Platform.EVM,
      })

      // Assert
      expect(mockGetConnectors).toHaveBeenCalledWith({})
      expect(mockConnect).toHaveBeenCalledWith({}, { connector: mockConnectors[1] })
    })

    it('should handle getConnectors errors', async () => {
      // Arrange
      const error = new Error('Failed to get connectors')
      mockGetConnectors.mockImplementation(() => {
        throw error
      })

      // Act & Assert
      await expect(
        activateWagmiConnector({
          id: 'wagmiConnectorId_metamask',
          externalLibraryId: 'metamask',
          status: ConnectorStatus.Disconnected,
          access: AccessPattern.Injected,
          platform: Platform.EVM,
        }),
      ).rejects.toThrow('Failed to get connectors')
      expect(mockConnect).not.toHaveBeenCalled()
    })
  })
})
