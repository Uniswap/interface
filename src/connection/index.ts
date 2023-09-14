import { ChainId } from '@pollum-io/smart-order-router'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Actions, Connector } from '@web3-react/types'
import COINBASE_ICON from 'assets/images/coinbaseWalletIcon.svg'
import GNOSIS_ICON from 'assets/images/gnosis.png'
import METAMASK_ICON from 'assets/images/metamask.svg'
import PALI_ICON from 'assets/images/pali.svg'
import WALLET_CONNECT_ICON from 'assets/images/walletConnectIcon.svg'
import INJECTED_DARK_ICON from 'assets/svg/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/svg/browser-wallet-light.svg'
import UNISWAP_LOGO from 'assets/svg/logo.svg'
import { SupportedChainId } from 'constants/chains'
import { useCallback, useSyncExternalStore } from 'react'
import { isMobile } from 'utils/userAgent'

import { RPC_URLS } from '../constants/networks'
import { RPC_PROVIDERS } from '../constants/providers'
import { getIsCoinbaseWallet, getIsInjected, getIsMetaMaskWallet, getIsPaliWallet } from './utils'
import { WalletConnectV2 } from './WalletConnectV2'

export enum ConnectionType {
  // UNIWALLET = 'UNIWALLET',
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT_V2 = 'WALLET_CONNECT_V2',
  NETWORK = 'NETWORK',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
  PALI_WALLET = 'PALI_WALLET',
}

export interface Connection {
  getName(): string
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  getIcon?(isDarkMode: boolean): string
  shouldDisplay(): boolean
  overrideActivate?: () => boolean
  isNew?: boolean
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: ChainId.ROLLUX })
)
export const networkConnection: Connection = {
  getName: () => 'Network',
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
}

const getIsCoinbaseWalletBrowser = () => isMobile && getIsCoinbaseWallet()
const getIsMetaMaskBrowser = () => isMobile && getIsMetaMaskWallet()
const getIsInjectedMobileBrowser = () => getIsCoinbaseWalletBrowser() || getIsMetaMaskBrowser()
const getIsPaliWalletBrowser = () => getIsPaliWallet()

const getShouldAdvertiseMetaMask = () =>
  !getIsMetaMaskWallet() && !isMobile && (!getIsInjected() || getIsCoinbaseWallet()) && !getIsPaliWallet()
const getIsGenericInjector = () =>
  getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet() && !getIsPaliWallet()

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

const injectedConnection: Connection = {
  // TODO(WEB-3131) re-add "Install MetaMask" string when no injector is present
  getName: () => (getIsGenericInjector() ? 'Browser Wallet' : getIsPaliWalletBrowser() ? 'Pali Wallet' : 'MetaMask'),
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: getIsPaliWalletBrowser() ? ConnectionType.PALI_WALLET : ConnectionType.INJECTED,
  getIcon: (isDarkMode: boolean) =>
    getIsGenericInjector()
      ? isDarkMode
        ? INJECTED_DARK_ICON
        : INJECTED_LIGHT_ICON
      : getIsPaliWalletBrowser()
      ? PALI_ICON
      : METAMASK_ICON,
  shouldDisplay: () =>
    getIsMetaMaskWallet() || getShouldAdvertiseMetaMask() || getIsGenericInjector() || getIsPaliWallet(),
  // If on non-injected, non-mobile browser, prompt user to install Metamask
  overrideActivate: () => {
    if (getShouldAdvertiseMetaMask()) {
      window.open('https://metamask.io/', 'inst_metamask')
      return true
    }
    return false
  },
  isNew: getIsPaliWalletBrowser(),
}
const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))
export const gnosisSafeConnection: Connection = {
  getName: () => 'Gnosis Safe',
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  getIcon: () => GNOSIS_ICON,
  shouldDisplay: () => false,
}

export const walletConnectV2Connection: Connection = new (class implements Connection {
  private initializer = (actions: Actions, defaultChainId = ChainId.ROLLUX) =>
    new WalletConnectV2({ actions, defaultChainId, onError })

  type = ConnectionType.WALLET_CONNECT_V2
  getName = () => 'WalletConnect'
  getIcon = () => WALLET_CONNECT_ICON
  shouldDisplay = () => !getIsInjectedMobileBrowser()

  private activeConnector = initializeConnector<WalletConnectV2>(this.initializer)
  // The web3-react Provider requires referentially stable connectors, so we use proxies to allow lazy connections
  // whilst maintaining referential equality.
  private proxyConnector = new Proxy(
    {},
    {
      get: (target, p, receiver) => Reflect.get(this.activeConnector[0], p, receiver),
      getOwnPropertyDescriptor: (target, p) => Reflect.getOwnPropertyDescriptor(this.activeConnector[0], p),
      getPrototypeOf: () => WalletConnectV2.prototype,
      set: (target, p, receiver) => Reflect.set(this.activeConnector[0], p, receiver),
    }
  ) as (typeof this.activeConnector)[0]
  private proxyHooks = new Proxy(
    {},
    {
      get: (target, p, receiver) => {
        return () => {
          // Because our connectors are referentially stable (through proxying), we need a way to trigger React renders
          // from outside of the React lifecycle when our connector is re-initialized. This is done via 'change' events
          // with `useSyncExternalStore`:
          const hooks = useSyncExternalStore(
            (onChange) => {
              this.onActivate = onChange
              return () => (this.onActivate = undefined)
            },
            () => this.activeConnector[1]
          )
          return Reflect.get(hooks, p, receiver)()
        }
      },
    }
  ) as (typeof this.activeConnector)[1]

  private onActivate?: () => void

  overrideActivate = (chainId?: ChainId) => {
    // Always re-create the connector, so that the chainId is updated.
    this.activeConnector = initializeConnector((actions) => this.initializer(actions, chainId))
    this.onActivate?.()
    return false
  }

  get connector() {
    return this.proxyConnector
  }
  get hooks() {
    return this.proxyHooks
  }
})()

// const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnectPopup>(
//   (actions) => new WalletConnectPopup({ actions, onError })
// )

// export const walletConnectConnection: Connection = {
//   getName: () => 'WalletConnect',
//   connector: web3WalletConnect,
//   hooks: web3WalletConnectHooks,
//   type: ConnectionType.WALLET_CONNECT_V2,
//   getIcon: () => WALLET_CONNECT_ICON,
//   shouldDisplay: () => !getIsInjectedMobileBrowser(),
// }

// const [web3UniwalletConnect, web3UniwalletConnectHooks] = initializeConnector<UniwalletConnect>(
//   (actions) => new UniwalletConnect({ actions, onError })
// )
// export const uniwalletConnectConnection: Connection = {
//   getName: () => 'Uniswap Wallet',
//   connector: web3UniwalletConnect,
//   hooks: web3UniwalletConnectHooks,
//   type: ConnectionType.UNIWALLET,
//   getIcon: () => UNIWALLET_ICON,
//   shouldDisplay: () => false,
//   // isNew: true,
// }

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RPC_URLS[SupportedChainId.ROLLUX][0],
        appName: 'Uniswap',
        appLogoUrl: UNISWAP_LOGO,
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
  getIcon: () => COINBASE_ICON,
  shouldDisplay: () => false,
  // shouldDisplay: () =>
  //   Boolean((isMobile && !getIsInjectedMobileBrowser()) || !isMobile || getIsCoinbaseWalletBrowser()),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate: () => {
    if (isMobile && !getIsInjectedMobileBrowser()) {
      window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      return true
    }
    return false
  },
}

// const [web3PaliWallet, web3PaliHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

// const paliWalletConnection: Connection = {
//   getName: () => 'Pali Wallet',
//   connector: web3PaliWallet,
//   hooks: web3PaliHooks,
//   type: ConnectionType.PALI_WALLET,
//   getIcon: () => PALI_ICON,
//   shouldDisplay: () => getIsPaliWalletBrowser(),
//   overrideActivate: () => {
//     if (getShouldAdvertiseMetaMask()) {
//       window.open('https://paliwallet.com/', 'inst_pali')
//       return true
//     }
//     return false
//   },
//   isNew: true,
// }

export function getConnections() {
  return [
    // paliWalletConnection,
    // uniwalletConnectConnection,
    injectedConnection,
    walletConnectV2Connection,
    coinbaseWalletConnection,
    gnosisSafeConnection,
    networkConnection,
  ]
}

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = getConnections().find((connection) => connection.connector === c)
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
      case ConnectionType.WALLET_CONNECT_V2:
        return walletConnectV2Connection
      // case ConnectionType.UNIWALLET:
      //   return uniwalletConnectConnection
      case ConnectionType.NETWORK:
        return networkConnection
      case ConnectionType.GNOSIS_SAFE:
        return gnosisSafeConnection
      case ConnectionType.PALI_WALLET:
        return gnosisSafeConnection
    }
  }
}

export function useGetConnection() {
  return useCallback((c: Connector | ConnectionType) => {
    if (c instanceof Connector) {
      const connection = getConnections().find((connection) => connection.connector === c)
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
        case ConnectionType.WALLET_CONNECT_V2:
          return walletConnectV2Connection
        // case ConnectionType.UNIWALLET:
        //   return uniwalletConnectConnection
        case ConnectionType.NETWORK:
          return networkConnection
        case ConnectionType.GNOSIS_SAFE:
          return gnosisSafeConnection
        case ConnectionType.PALI_WALLET:
          return gnosisSafeConnection
      }
    }
  }, [])
}
