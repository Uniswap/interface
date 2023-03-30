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
import { useMgtmEnabled } from 'featureFlags/flags/mgtm'
import { isMobile } from 'utils/userAgent'

import { RPC_URLS } from '../constants/networks'
import { RPC_PROVIDERS } from '../constants/providers'
import {
  getIsCoinbaseWallet,
  getIsCoinbaseWalletBrowser,
  getIsInjected,
  getIsKnownWalletBrowser,
  getIsMetaMaskWallet,
} from './utils'
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
  getName(): string
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  getIcon?(isDarkMode: boolean): string
  darkModeIcon?: string
  overrideActivate?: () => boolean
  isNew?: boolean
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: 1 })
)
const networkConnection: Connection = {
  getName: () => 'Network',
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
}

function isGenericInjector(): boolean {
  return !getIsMetaMaskWallet() && getIsInjected() && !getIsCoinbaseWallet()
}

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))
const injectedConnection: Connection = {
  getName: () => (isGenericInjector() ? 'Browser Wallet' : getIsMetaMaskWallet() ? 'MetaMask' : 'Install MetaMask'),
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: ConnectionType.INJECTED,
  getIcon(isDarkMode: boolean) {
    return isGenericInjector() ? (isDarkMode ? INJECTED_DARK_ICON_URL : INJECTED_LIGHT_ICON_URL) : METAMASK_ICON_URL
  },
  // If on non-injected browser, prompt user to install Metamask
  overrideActivate() {
    if (!getIsMetaMaskWallet()) {
      window.open('https://metamask.io/', 'inst_metamask')
      return true
    }
    return false
  },
}

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))
const gnosisSafeConnection: Connection = {
  getName: () => 'Gnosis Safe',
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  getIcon: () => GNOSIS_ICON_URL,
}

const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnectPopup>(
  (actions) => new WalletConnectPopup({ actions, onError })
)
const walletConnectConnection: Connection = {
  getName: () => 'WalletConnect',
  connector: web3WalletConnect,
  hooks: web3WalletConnectHooks,
  type: ConnectionType.WALLET_CONNECT,
  getIcon: () => WALLET_CONNECT_ICON_URL,
}

const [web3UniwalletConnect, web3UniwalletConnectHooks] = initializeConnector<UniwalletConnect>(
  (actions) => new UniwalletConnect({ actions, onError })
)
const uniwalletConnectConnection: Connection = {
  getName: () => 'Uniswap Wallet',
  connector: web3UniwalletConnect,
  hooks: web3UniwalletConnectHooks,
  type: ConnectionType.UNIWALLET,
  getIcon: () => UNIWALLET_ICON_URL,
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

const coinbaseWalletConnection: Connection = {
  getName: () => 'Coinbase Wallet',
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
  type: ConnectionType.COINBASE_WALLET,
  getIcon: () => COINBASE_ICON_URL,
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate() {
    if (isMobile && !getIsCoinbaseWalletBrowser()) {
      window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      return true
    }
    return false
  },
}

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = [
      injectedConnection,
      coinbaseWalletConnection,
      walletConnectConnection,
      uniwalletConnectConnection,
      networkConnection,
      gnosisSafeConnection,
    ].find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return injectedConnection
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
}

export function useDisplayableConnections(): Connection[] {
  const mgtmEnabled = useMgtmEnabled()

  if (getIsKnownWalletBrowser()) {
    // Return only a single connection option for known wallet browsers
    return [getIsCoinbaseWalletBrowser() ? coinbaseWalletConnection : injectedConnection]
  }

  const connections: Connection[] = []

  if (mgtmEnabled) connections.push(uniwalletConnectConnection)

  // Includes injected option on all desktop browsers and in unknown injected wallet browsers
  if (!isMobile || getIsInjected()) connections.push(injectedConnection)

  return [...connections, walletConnectConnection, coinbaseWalletConnection]
}
