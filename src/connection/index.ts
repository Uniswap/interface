import { t } from '@lingui/macro'
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

export function getNetworkConnection(): Connection {
  return {
    name: 'Network',
    connector: web3Network,
    hooks: web3NetworkHooks,
    type: ConnectionType.NETWORK,
    shouldDisplay: false,
  }
}

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

function getInjectedConnection(isDarkMode: boolean): Connection {
  const shouldAdvertiseMetaMask = !getIsMetaMaskWallet() && !isMobile && (!getIsInjected() || getIsCoinbaseWallet())
  const isGenericInjector = getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet()

  const mmMetadata = {
    name: shouldAdvertiseMetaMask ? t`Install MetaMask` : 'MetaMask',
    shouldDisplay: getIsMetaMaskWallet() || shouldAdvertiseMetaMask,
    // If on non-injected, non-mobile browser, prompt user to install Metamask
    overrideActivate: shouldAdvertiseMetaMask ? () => window.open('https://metamask.io/', 'inst_metamask') : undefined,
    icon: METAMASK_ICON_URL,
  }

  const genericMetadata = {
    name: t`Browser Wallet`,
    shouldDisplay: isGenericInjector,
    icon: isDarkMode ? INJECTED_DARK_ICON_URL : INJECTED_LIGHT_ICON_URL,
  }

  return {
    ...(isGenericInjector ? genericMetadata : mmMetadata),
    connector: web3Injected,
    hooks: web3InjectedHooks,
    type: ConnectionType.INJECTED,
  }
}

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))

export function getGnosisSafeConnection(): Connection {
  return {
    name: 'Gnosis Safe',
    connector: web3GnosisSafe,
    hooks: web3GnosisSafeHooks,
    type: ConnectionType.GNOSIS_SAFE,
    icon: GNOSIS_ICON_URL,
    shouldDisplay: false,
  }
}

const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnectPopup>(
  (actions) => new WalletConnectPopup({ actions, onError })
)

export function getWalletConnectConnection(): Connection {
  return {
    name: 'WalletConnect',
    connector: web3WalletConnect,
    hooks: web3WalletConnectHooks,
    type: ConnectionType.WALLET_CONNECT,
    icon: WALLET_CONNECT_ICON_URL,
    shouldDisplay: !getIsKnownWalletBrowser(),
  }
}

const [web3UniwalletConnect, web3UniwalletConnectHooks] = initializeConnector<UniwalletConnect>(
  (actions) => new UniwalletConnect({ actions, onError })
)

export function getUniwalletConnectConnection(): Connection {
  return {
    name: 'Uniswap Wallet',
    connector: web3UniwalletConnect,
    hooks: web3UniwalletConnectHooks,
    type: ConnectionType.UNIWALLET,
    icon: UNIWALLET_ICON_URL,
    shouldDisplay: Boolean(!getIsKnownWalletBrowser() && !isNonIOSPhone),
    isNew: true,
  }
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

function getCoinbaseWalletConnection(): Connection {
  // Coinbase option should be displayed any time unless on a known wallet browser that isn't coinbase
  const shouldHideCoinbase = getIsKnownWalletBrowser() && !getIsCoinbaseWalletBrowser()

  return {
    name: 'Coinbase Wallet',
    connector: web3CoinbaseWallet,
    hooks: web3CoinbaseWalletHooks,
    type: ConnectionType.COINBASE_WALLET,
    icon: COINBASE_ICON_URL,
    shouldDisplay: !shouldHideCoinbase,
    // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
    overrideActivate:
      isMobile && !getIsKnownWalletBrowser()
        ? () => window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
        : undefined,
  }
}

export function getConnections(isDarkMode: boolean) {
  return [
    getUniwalletConnectConnection(),
    getInjectedConnection(isDarkMode),
    getWalletConnectConnection(),
    getCoinbaseWalletConnection(),
    getGnosisSafeConnection(),
    getNetworkConnection(),
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
            return getInjectedConnection(isDarkMode)
          case ConnectionType.COINBASE_WALLET:
            return getCoinbaseWalletConnection()
          case ConnectionType.WALLET_CONNECT:
            return getWalletConnectConnection()
          case ConnectionType.UNIWALLET:
            return getUniwalletConnectConnection()
          case ConnectionType.NETWORK:
            return getNetworkConnection()
          case ConnectionType.GNOSIS_SAFE:
            return getGnosisSafeConnection()
        }
      }
    },
    [isDarkMode]
  )
}
