import { renderHook } from '@testing-library/react'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import { applyCustomConnectorMeta, useConnectCustomWalletsMap } from 'features/wallet/connection/connectors/custom'
import type { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
// Removed passkey icon import as passkey functionality was removed

// Import mocked modules to get references to their functions
import { connect } from '@wagmi/core'
import { COINBASE_WALLET_CONNECTOR, METAMASK_CONNECTOR, UNISWAP_WALLET_CONNECTOR } from 'test-utils/wallets/fixtures'

const mockConnect = vi.mocked(connect)

// Mock dependencies
vi.mock('@wagmi/core', () => ({
  connect: vi.fn(),
}))

vi.mock('components/Web3Provider/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('components/Web3Provider/walletConnect', () => ({
  uniswapWalletConnect: vi.fn(() => ({ id: 'uniswap-wallet-connect' })),
}))

const mockSignInWithPasskeyAsync = vi.fn().mockResolvedValue(undefined)
vi.mock('hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(() => ({
    signInWithPasskeyAsync: mockSignInWithPasskeyAsync,
  })),
}))

// Mock jotai atoms with proper atom structure
vi.mock('state/application/atoms', () => ({
  persistHideMobileAppPromoBannerAtom: {
    read: vi.fn(),
    write: vi.fn(),
    subscribe: vi.fn(),
  },
}))

// Mock utilities
vi.mock('utilities/src/react/hooks', () => ({
  useEvent: vi.fn((fn) => fn),
}))

describe('custom connectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useConnectCustomWalletsMap', () => {
    it('should return a map with custom connector functions', () => {
      // Act
      const { result } = renderHook(() => useConnectCustomWalletsMap())

      // Assert
      expect(result.current).toHaveProperty(CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID)
      expect(typeof result.current[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]).toBe('function')
    })

    it('should call connectUniswapWallet when uniswap wallet connect connector is invoked', async () => {
      // Arrange
      const { result } = renderHook(() => useConnectCustomWalletsMap())
      mockConnect.mockResolvedValue({} as any)

      // Act
      await result.current[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]()

      // Assert
      expect(mockConnect).toHaveBeenCalledWith({}, { connector: { id: 'uniswap-wallet-connect' } })
    })


    it('should handle errors when uniswap wallet connection fails', async () => {
      // Arrange
      const { result } = renderHook(() => useConnectCustomWalletsMap())
      const error = new Error('Connection failed')
      mockConnect.mockRejectedValue(error)

      // Act & Assert
      await expect(result.current[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]()).rejects.toThrow(
        'Connection failed',
      )
    })

  })

  describe('applyCustomConnectorMeta', () => {
    it('should add uniswap wallet connector meta to wallet connectors', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [METAMASK_CONNECTOR]

      // Act
      const result = applyCustomConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(METAMASK_CONNECTOR)
      expect(result[1]).toEqual(UNISWAP_WALLET_CONNECTOR)
    })

    it('should override coinbase sdk icon with icon override map', () => {
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Coinbase Wallet',
          icon: 'original-coinbase.svg',
          wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
          isInjected: false,
          analyticsWalletType: 'Coinbase Wallet',
        },
      ]
      const result = applyCustomConnectorMeta(walletConnectors)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual({
        name: 'Coinbase Wallet',
        icon: COINBASE_ICON,
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
        isInjected: false,
        analyticsWalletType: 'Coinbase Wallet',
      })
    })

    // Test removed: embedded wallet functionality was removed from the application

    it('should not modify non-embedded wallet connector ids', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [METAMASK_CONNECTOR, COINBASE_WALLET_CONNECTOR]

      // Act
      const result = applyCustomConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(METAMASK_CONNECTOR)
      expect(result[1]).toEqual(COINBASE_WALLET_CONNECTOR)
      expect(result[2]).toEqual(UNISWAP_WALLET_CONNECTOR)
    })

    it('should handle empty wallet connectors array', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = []

      // Act
      const result = applyCustomConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(UNISWAP_WALLET_CONNECTOR)
    })

    // Test removed: embedded wallet functionality was removed from the application
  })
})
