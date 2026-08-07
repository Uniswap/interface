import { createSolanaClient } from '@metamask/connect-solana'
import { logger } from 'utilities/src/logger/logger'
import { METAMASK_CONNECT_DAPP_METADATA } from '~/connection/constants'

/**
 * Registers the MetaMask Connect Solana wallet with the wallet-standard registry so the Solana
 * `WalletProvider` (see `createWeb3Provider.tsx`) auto-detects it alongside other Standard wallets.
 *
 * `createSolanaClient` self-registers the wallet (skipAutoRegister defaults to false), so we don't
 * need to add an explicit adapter. Registration is app-lifetime, so this runs once at client
 * bootstrap (from `sideEffects.ts`) rather than in a component effect.
 */
export function registerMetaMaskSolanaWallet(): void {
  createSolanaClient({
    dapp: METAMASK_CONNECT_DAPP_METADATA,
  }).catch((error) => {
    logger.warn(
      'registerMetaMaskSolana.ts',
      'registerMetaMaskSolanaWallet',
      'Failed to register MetaMask Connect Solana wallet',
      { error },
    )
  })
}
