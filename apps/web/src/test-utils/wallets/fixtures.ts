import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider/constants'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'

export const WALLET_CONNECT_CONNECTOR: WalletConnectorMeta = {
  wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
  name: CONNECTION_PROVIDER_NAMES.WALLET_CONNECT,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.WALLET_CONNECT],
  isInjected: false,
  analyticsWalletType: 'Wallet Connect',
}

export const EMBEDDED_WALLET_CONNECTOR: WalletConnectorMeta = {
  wagmi: { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, type: 'embeddedUniswapWallet' },
  name: CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET],
  isInjected: false,
  customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
  analyticsWalletType: 'Passkey',
}

export const METAMASK_CONNECTOR: WalletConnectorMeta = {
  wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
  name: CONNECTION_PROVIDER_NAMES.METAMASK,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.METAMASK],
  isInjected: true,
  analyticsWalletType: 'Browser Extension',
}

export const COINBASE_WALLET_CONNECTOR: WalletConnectorMeta = {
  wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
  name: 'Coinbase Wallet',
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.COINBASE_SDK],
  isInjected: false,
  analyticsWalletType: 'Coinbase Wallet',
}

export const UNISWAP_EXTENSION_CONNECTOR: WalletConnectorMeta = {
  wagmi: { id: CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS, type: 'injected' },
  name: CONNECTION_PROVIDER_NAMES.UNISWAP_EXTENSION,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.UNISWAP_EXTENSION],
  isInjected: true,
  analyticsWalletType: 'Browser Extension',
}

export const UNISWAP_WALLET_CONNECTOR: WalletConnectorMeta = {
  name: CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET],
  customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  isInjected: false,
  analyticsWalletType: 'Wallet Connect',
}
