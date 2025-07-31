import { deduplicateWalletConnectorMeta } from 'features/wallet/connection/connectors/multiplatform'
import type { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { METAMASK_CONNECTOR } from 'test-utils/wallets/fixtures'
import { describe, expect, it } from 'vitest'

describe('multiplatform connectors', () => {
  describe('deduplicateWalletConnectorMeta', () => {
    it('should return empty array when no connectors provided', () => {
      // Act
      const result = deduplicateWalletConnectorMeta([])

      // Assert
      expect(result).toEqual([])
    })

    it('should return single connector unchanged', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [METAMASK_CONNECTOR]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(walletConnectors)
    })

    it('should not deduplicate wagmi connectors with exact same name on same platform', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask',
          icon: 'metamask-alt.svg',
          wagmi: { id: 'metamask-alt', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(expect.arrayContaining(walletConnectors))
    })

    it('should not deduplicate solana connectors with exact same name on same platform', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Phantom',
          icon: 'phantom.svg',
          solana: { walletName: 'Phantom' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Phantom',
          icon: 'phantom-alt.svg',
          solana: { walletName: 'Phantom' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(expect.arrayContaining(walletConnectors))
    })

    it('should merge connectors with same name on different platforms', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask',
          icon: 'metamask-wallet.svg',
          solana: { walletName: 'MetaMask' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'MetaMask',
        icon: 'metamask.svg',
        wagmi: { id: 'metamask', type: 'injected' },
        solana: { walletName: 'MetaMask' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should merge different-platform connectors whose whose names differ by inclusion of "Wallet" in one of the names', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Phantom',
          icon: 'phantom.svg',
          wagmi: { id: 'phantom', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Phantom Wallet',
          icon: 'phantom-wallet.svg',
          solana: { walletName: 'Phantom' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'Phantom',
        icon: 'phantom.svg',
        wagmi: { id: 'phantom', type: 'injected' },
        solana: { walletName: 'Phantom' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should preserve different connectors with different names', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Coinbase Wallet',
          icon: 'coinbase.svg',
          wagmi: { id: 'coinbase', type: 'coinbaseWallet' },
          isInjected: false,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Phantom',
          icon: 'phantom.svg',
          solana: { walletName: 'Phantom' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(3)
      expect(result).toEqual(
        expect.arrayContaining([
          {
            name: 'MetaMask',
            icon: 'metamask.svg',
            wagmi: { id: 'metamask', type: 'injected' },
            isInjected: true,
            analyticsWalletType: 'Browser Extension',
          },
          {
            name: 'Coinbase Wallet',
            icon: 'coinbase.svg',
            wagmi: { id: 'coinbase', type: 'coinbaseWallet' },
            isInjected: false,
            analyticsWalletType: 'Browser Extension',
          },
          {
            name: 'Phantom',
            icon: 'phantom.svg',
            solana: { walletName: 'Phantom' as any },
            isInjected: true,
            analyticsWalletType: 'Browser Extension',
          },
        ]),
      )
    })

    it('should merge wagmi and solana connectors with same name', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Phantom',
          icon: 'phantom.svg',
          wagmi: { id: 'phantom', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Phantom',
          icon: 'phantom-solana.svg',
          solana: { walletName: 'Phantom' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'Phantom',
        icon: 'phantom.svg',
        wagmi: { id: 'phantom', type: 'injected' },
        solana: { walletName: 'Phantom' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should not merge custom connectors with other connectors', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Custom Connector',
          icon: 'normal.svg',
          wagmi: { id: 'normalConnectorId', type: 'injected' },
          customConnectorId: 'uniswapWalletConnect',
          isInjected: true,
          analyticsWalletType: 'Wallet Connect',
        },
        {
          name: 'Custom Connector',
          icon: 'sus.svg',
          solana: { walletName: 'Malicious Extension' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(walletConnectors)
    })

    it('should not deduplicate connectors if more than 2 connectors have the same normalized name', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask Wallet',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'METAMASK WALLET',
          icon: 'metamask-caps.svg',
          solana: { walletName: 'METAMASK WALLET' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask',
          icon: 'metamask-sus.svg',
          solana: { walletName: 'sus metamask' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(walletConnectors)
    })

    it('should preserve order of first occurrence when merging', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask Wallet',
          icon: 'metamask-wallet.svg',
          wagmi: { id: 'metamask-wallet', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          solana: { walletName: 'MetaMask' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'MetaMask Wallet',
        icon: 'metamask-wallet.svg',
        wagmi: { id: 'metamask-wallet', type: 'injected' },
        solana: { walletName: 'MetaMask' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should handle connectors with undefined properties on different platforms', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: undefined,
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask Wallet',
          icon: 'metamask.svg',
          solana: { walletName: 'MetaMask' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'MetaMask',
        icon: 'metamask.svg',
        wagmi: { id: 'metamask', type: 'injected' },
        solana: { walletName: 'MetaMask' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })

    it('should handle special characters in wallet names on different platforms', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Wallet & Co.',
          icon: 'wallet-co.svg',
          wagmi: { id: 'wallet-co', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Wallet & Co. Wallet',
          icon: 'wallet-co-wallet.svg',
          solana: { walletName: 'Wallet & Co. Wallet' as any },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'Wallet & Co.',
        icon: 'wallet-co.svg',
        wagmi: { id: 'wallet-co', type: 'injected' },
        solana: { walletName: 'Wallet & Co. Wallet' as any },
        isInjected: true,
        analyticsWalletType: 'Browser Extension',
      })
    })
  })
})
