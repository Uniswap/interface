import GNOSIS_ICON from 'assets/images/gnosis.png'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import WALLET_CONNECT_ICON from 'assets/wallets/walletconnect-icon.svg'
import { atomWithStorage, useAtomValue } from 'jotai/utils'

export const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  UNISWAP_WALLET_CONNECT_CONNECTOR_ID: 'uniswapWalletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  UNISWAP_EXTENSION_RDNS: 'org.uniswap.app',
  SAFE_CONNECTOR_ID: 'safe',
} as const

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: UNIWALLET_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: GNOSIS_ICON,
}

// Used to track which connector was used most recently for UI states.
export const recentConnectorIdAtom = atomWithStorage<string | undefined>('recentConnectorId', undefined)
export function useRecentConnectorId() {
  return useAtomValue(recentConnectorIdAtom)
}
