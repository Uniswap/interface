import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import COINBASE_ICON_URL from 'assets/images/coinbaseWalletIcon.svg'
import GNOSIS_ICON_URL from 'assets/images/gnosis.png'
import METAMASK_ICON_URL from 'assets/images/metamask.svg'
import UNIWALLET_ICON_URL from 'assets/images/uniwallet.svg'
import WALLET_CONNECT_ICON_URL from 'assets/images/walletConnectIcon.svg'
import INJECTED_DARK_ICON_URL from 'assets/svg/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON_URL from 'assets/svg/browser-wallet-light.svg'
import UNISWAP_LOGO_URL from 'assets/svg/logo.svg'
import { SupportedChainId } from 'constants/chains'
import { useCallback } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { isMobile, isNonIOSPhone } from 'utils/userAgent'

import { RPC_URLS } from '../constants/networks'
import { RPC_PROVIDERS } from '../constants/providers'
import { isCoinbaseWallet, isInjected, isMetaMaskWallet } from './utils'
import { UniwalletConnect, WalletConnectPopup } from './WalletConnect'

export enum ConnectionType {
  UNIWALLET = 'UNIWALLET',
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT = 'WALLET_CONNECT',
  NETWORK = 'NETWORK',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
}

export interface Connection {
  name: string
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  icon?: string
  shouldDisplay?: boolean
  overrideActivate?: () => void
  isNew?: boolean
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: 1 })
)
export const networkConnection: Connection = {
  name: 'Network',
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: false,
}

const isCoinbaseWalletBrowser = isMobile && isCoinbaseWallet
const isMetaMaskBrowser = isMobile && isMetaMaskWallet
const getIsInjectedMobileBrowser = isCoinbaseWalletBrowser || isMetaMaskBrowser

const getShouldAdvertiseMetaMask = !isMetaMaskWallet && !isMobile && (!isInjected || isCoinbaseWallet)
const isGenericInjector = isInjected && !isMetaMaskWallet && !isCoinbaseWallet

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))
const baseInjectedConnection: Omit<Connection, 'icon'> = {
  name: isGenericInjector ? 'Browser Wallet' : 'MetaMask',
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: ConnectionType.INJECTED,
  shouldDisplay: isMetaMaskWallet || getShouldAdvertiseMetaMask || isGenericInjector,
  // If on non-injected, non-mobile browser, prompt user to install Metamask
  overrideActivate: getShouldAdvertiseMetaMask ? () => window.open('https://metamask.io/', 'inst_metamask') : undefined,
}

export const darkInjectedConnection: Connection = {
  ...baseInjectedConnection,
  icon: isGenericInjector ? INJECTED_DARK_ICON_URL : METAMASK_ICON_URL,
}

export const lightInjectedConnection: Connection = {
  ...baseInjectedConnection,
  icon: isGenericInjector ? INJECTED_LIGHT_ICON_URL : METAMASK_ICON_URL,
}

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))
export const gnosisSafeConnection: Connection = {
  name: 'Gnosis Safe',
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  icon: GNOSIS_ICON_URL,
  shouldDisplay: false,
}

const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnectPopup>(
  (actions) => new WalletConnectPopup({ actions, onError })
)
export const walletConnectConnection: Connection = {
  name: 'WalletConnect',
  connector: web3WalletConnect,
  hooks: web3WalletConnectHooks,
  type: ConnectionType.WALLET_CONNECT,
  icon: WALLET_CONNECT_ICON_URL,
  shouldDisplay: !getIsInjectedMobileBrowser,
}

const [web3UniwalletConnect, web3UniwalletConnectHooks] = initializeConnector<UniwalletConnect>(
  (actions) => new UniwalletConnect({ actions, onError })
)
export const uniwalletConnectConnection: Connection = {
  name: 'Uniswap Wallet',
  connector: web3UniwalletConnect,
  hooks: web3UniwalletConnectHooks,
  type: ConnectionType.UNIWALLET,
  icon: UNIWALLET_ICON_URL,
  shouldDisplay: Boolean(!getIsInjectedMobileBrowser && !isNonIOSPhone),
  isNew: true,
}

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RPC_URLS[SupportedChainId.MAINNET][0],
        appName: 'Uniswap',
        appLogoUrl: UNISWAP_LOGO_URL,
        reloadOnDisconnect: false,
      },
      onError,
    })
)

export const coinbaseWalletConnection: Connection = {
  name: 'Coinbase Wallet',
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
  type: ConnectionType.COINBASE_WALLET,
  icon: COINBASE_ICON_URL,
  shouldDisplay: Boolean((isMobile && !getIsInjectedMobileBrowser) || !isMobile || isCoinbaseWalletBrowser),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate:
    isMobile && !getIsInjectedMobileBrowser
      ? () => window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      : undefined,
}

export function getConnections(isDarkMode: boolean) {
  return [
    uniwalletConnectConnection,
    isDarkMode ? darkInjectedConnection : lightInjectedConnection,
    walletConnectConnection,
    coinbaseWalletConnection,
    gnosisSafeConnection,
    networkConnection,
  ]
}

export function useConnections() {
  const isDarkMode = useIsDarkMode()
  return getConnections(isDarkMode)
}

export function useGetConnection() {
  const isDarkMode = useIsDarkMode()
  return useCallback(
    (c: Connector | ConnectionType) => {
      if (c instanceof Connector) {
        const connection = getConnections(isDarkMode).find((connection) => connection.connector === c)
        if (!connection) {
          throw Error('unsupported connector')
        }
        return connection
      } else {
        switch (c) {
          case ConnectionType.INJECTED:
            return isDarkMode ? darkInjectedConnection : lightInjectedConnection
          case ConnectionType.COINBASE_WALLET:
            return coinbaseWalletConnection
          case ConnectionType.WALLET_CONNECT:
            return walletConnectConnection
          case ConnectionType.UNIWALLET:
            return uniwalletConnectConnection
          case ConnectionType.NETWORK:
            return networkConnection
          case ConnectionType.GNOSIS_SAFE:
            return gnosisSafeConnection
        }
      }
    },
    [isDarkMode]
  )
}
