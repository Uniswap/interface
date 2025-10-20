import GNOSIS_ICON from 'assets/images/gnosis.png'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import PHANTOM_ICON from 'assets/wallets/phantom-icon.png'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import WALLET_CONNECT_ICON from 'assets/wallets/walletconnect-icon.svg'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
// biome-ignore lint/style/noRestrictedImports: Provider constants need direct ethers imports
import PASSKEY_ICON from 'ui/src/assets/icons/passkey.svg'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'

export const CONNECTOR_ICON_OVERRIDE_MAP: { [name in string]?: string } = {
  [CONNECTION_PROVIDER_NAMES.METAMASK]: METAMASK_ICON,
  [CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET]: UNIWALLET_ICON,
  [CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET]: PASSKEY_ICON,
  [CONNECTION_PROVIDER_NAMES.COINBASE_SDK]: COINBASE_ICON,
  [CONNECTION_PROVIDER_NAMES.WALLET_CONNECT]: WALLET_CONNECT_ICON,
  [CONNECTION_PROVIDER_NAMES.SAFE]: GNOSIS_ICON,
  [CONNECTION_PROVIDER_NAMES.PHANTOM]: PHANTOM_ICON,
}

// Used to track which connector was used most recently for UI states.
export const recentConnectorIdAtom = atomWithStorage<string | undefined>('recentConnectorId', undefined)
export function useRecentConnectorId() {
  return useAtomValue(recentConnectorIdAtom)
}

export const PLAYWRIGHT_CONNECT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
