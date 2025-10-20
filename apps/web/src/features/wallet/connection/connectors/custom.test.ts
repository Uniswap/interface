// Import mocked modules to get references to their functions
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import { applyCustomConnectorMeta } from 'features/wallet/connection/connectors/custom'
import type { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { COINBASE_WALLET_CONNECTOR, METAMASK_CONNECTOR, UNISWAP_WALLET_CONNECTOR } from 'test-utils/wallets/fixtures'
import PASSKEY_ICON from 'ui/src/assets/icons/passkey.svg'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

    it('should apply embedded wallet connector meta to existing embedded wallet', () => {
      // Arrange
      const wagmiEmbeddedWalletConnector = {
        name: CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET,
        icon: 'embedded.svg',
        wagmi: { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, type: 'embeddedUniswapWallet' },
        isInjected: true,
        analyticsWalletType: 'Passkey',
      }
      const walletConnectors: WalletConnectorMeta[] = [wagmiEmbeddedWalletConnector]

      // Act
      const result = applyCustomConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        ...wagmiEmbeddedWalletConnector,
        icon: PASSKEY_ICON,
        customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
      })
      expect(result[1]).toEqual(UNISWAP_WALLET_CONNECTOR)
    })

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

    it('should apply both uniswap wallet and embedded wallet meta transformations', () => {
      // Arrange
      const wagmiEmbeddedWalletConnector = {
        name: CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET,
        icon: 'embedded.svg',
        wagmi: { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, type: 'embeddedUniswapWallet' },
        isInjected: true,
        analyticsWalletType: 'Passkey',
      }
      const walletConnectors: WalletConnectorMeta[] = [wagmiEmbeddedWalletConnector, METAMASK_CONNECTOR]

      // Act
      const result = applyCustomConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        ...wagmiEmbeddedWalletConnector,
        customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        icon: PASSKEY_ICON,
      })
      expect(result[1]).toEqual(METAMASK_CONNECTOR)
      expect(result[2]).toEqual(UNISWAP_WALLET_CONNECTOR)
    })
  })
})
