import { isWebApp } from '@universe/environment'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useActiveWallet } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

/**
 * Whether the current platform + active-wallet combination should expose the
 * Custom Gas (network cost override) flow.
 *
 * - Mobile and extension: always true (the active wallet is always a
 *   Uniswap-controlled wallet, so urgency-based overrides are always
 *   applicable).
 * - Web: only true when the active EVM wallet is the Uniswap Embedded Wallet.
 *   External wallets (MetaMask, Coinbase, etc.) manage gas through their own
 *   UI and our override surface does not reach their signer.
 *
 * The `enableCustomGasFeeEntry` Redux setting persists across wallet switches,
 * which is intentional — a user who reconnects an EW gets their preference
 * back. This hook is the runtime gate that prevents the UI / API surface from
 * rendering or sending overrides while a non-EW wallet is active on web.
 *
 * Callers should compose this with the `GasFeeOverrides` feature flag and the
 * `enableCustomGasFeeEntry` user setting; see e.g. ExpandableRows.tsx.
 */
export function useIsCustomGasFlowAvailable(): boolean {
  const activeEVMWallet = useActiveWallet(Platform.EVM)
  if (!isWebApp) {
    return true
  }
  return activeEVMWallet?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
}
