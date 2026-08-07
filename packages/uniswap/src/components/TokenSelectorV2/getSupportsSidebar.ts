import { isWebApp } from '@universe/environment'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'

/**
 * Dual-pane My-tokens sidebar is web-desktop-only and never shows for send (the send list
 * already is the user's balances). Disconnected wallets get view-only mode: no sidebar and
 * no portfolio toggle, just the single-pane discovery list.
 */
export function getSupportsSidebar({
  isSmallScreen,
  variation,
  addresses,
}: {
  isSmallScreen: boolean
  variation: TokenSelectorVariation
  addresses: AddressGroup
}): boolean {
  const isWalletConnected = Boolean(addresses.evmAddress ?? addresses.svmAddress)
  return isWebApp && !isSmallScreen && variation !== TokenSelectorVariation.BalancesOnly && isWalletConnected
}
