import GNOSIS_ICON from 'assets/images/gnosis.png'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import WALLET_CONNECT_ICON from 'assets/wallets/walletconnect-icon.svg'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

export const UNISWAP_EXTENSION_CONNECTOR_NAME = 'Uniswap Extension'

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION_PROVIDER_IDS.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: UNIWALLET_ICON,
  [CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID]: UNIWALLET_ICON,
  [CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION_PROVIDER_IDS.SAFE_CONNECTOR_ID]: GNOSIS_ICON,
}

// Used to track which connector was used most recently for UI states.
export const recentConnectorIdAtom = atomWithStorage<string | undefined>('recentConnectorId', undefined)
export function useRecentConnectorId() {
  return useAtomValue(recentConnectorIdAtom)
}
