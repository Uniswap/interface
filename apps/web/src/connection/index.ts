import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Actions, Connector } from '@web3-react/types'
import GNOSIS_ICON from 'assets/images/gnosis.png'
import UNISWAP_LOGO from 'assets/svg/logo.svg'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import WALLET_CONNECT_ICON from 'assets/wallets/walletconnect-icon.svg'
import { useSyncExternalStore } from 'react'
import { isMobile, isTouchable, isWebAndroid, isWebIOS } from 'uniswap/src/utils/platform'

import { APP_RPC_URLS } from '../constants/networks'
import { DEPRECATED_RPC_PROVIDERS, RPC_PROVIDERS } from '../constants/providers'
import { EIP6963 } from './eip6963'
import { Connection, ConnectionType, ProviderInfo } from './types'
import { getDeprecatedInjection, getIsCoinbaseWallet, getIsInjected, getIsMetaMaskWallet } from './utils'
import { UniwalletConnect as UniwalletWCV2Connect, WalletConnectV2 } from './WalletConnectV2'

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

type InjectedConnection = Connection & {
  /** Returns a copy of the connection with metadata & activation for a specific extension/provider */
  wrap: (providerInfo: ProviderInfo) => Connection | undefined
  /** Sets which extension/provider the connector should activate */
  selectRdns(rdns: string): void
}

const [eip6963, eip6963hooks] = initializeConnector<EIP6963>((actions) => new EIP6963({ actions, onError }))
// Since eip6963 wallet are `announced` dynamically after compile-time, but web3provider required connectors to be statically defined,
// we define a static eip6963Connection object that provides access to all eip6963 wallets. The `wrap` function is used to obtain a copy
// of the connection with metadata & activation for a specific extension/provider.
export const eip6963Connection: InjectedConnection = {
  getProviderInfo: () => eip6963.provider.currentProviderDetail?.info ?? { name: t`Browser Wallet` },
  selectRdns: (rdns: string) => eip6963.selectProvider(rdns),
  connector: eip6963,
  hooks: eip6963hooks,
  type: ConnectionType.EIP_6963_INJECTED,
  shouldDisplay: () => false, // Since we display each individual eip6963 wallet, we shouldn't display this generic parent connection
  wrap(providerInfo: ProviderInfo) {
    const { rdns } = providerInfo
    if (!rdns) return undefined
    return {
      ...this,
      getProviderInfo: () => providerInfo,
      overrideActivate() {
        eip6963.selectProvider(rdns) // Select the specific eip6963 provider before activating
        return false
      },
      shouldDisplay: () => true, // Individual eip6963 wallets should always be displayed
    }
  },
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: 1 })
)
export const networkConnection: Connection = {
  getProviderInfo: () => ({ name: 'Network' }),
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
}

const [deprecatedWeb3Network, deprecatedWeb3NetworkHooks] = initializeConnector<Network>(
  (actions) =>
    new Network({
      actions,
      urlMap: DEPRECATED_RPC_PROVIDERS,
      defaultChainId: 1,
    })
)
export const deprecatedNetworkConnection: Connection = {
  getProviderInfo: () => ({ name: 'Network' }),
  connector: deprecatedWeb3Network,
  hooks: deprecatedWeb3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
}

const getIsCoinbaseWalletBrowser = () => isMobile && getIsCoinbaseWallet()
const getIsMetaMaskBrowser = () => isMobile && getIsMetaMaskWallet()
const getIsInjectedMobileBrowser = () => getIsCoinbaseWalletBrowser() || getIsMetaMaskBrowser()

const getShouldAdvertiseMetaMask = () =>
  !getIsMetaMaskWallet() && !isMobile && (!getIsInjected() || getIsCoinbaseWallet())
const getIsGenericInjector = () => getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet()

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

export const deprecatedInjectedConnection: Connection = {
  getProviderInfo: (isDarkMode: boolean) => getDeprecatedInjection(isDarkMode) ?? { name: t`Browser Wallet` },
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: ConnectionType.INJECTED,
  shouldDisplay: () => getIsMetaMaskWallet() || getShouldAdvertiseMetaMask() || getIsGenericInjector(),
  // If on non-injected, non-mobile browser, prompt user to install Metamask
  overrideActivate: () => {
    if (getShouldAdvertiseMetaMask()) {
      window.open('https://metamask.io/', 'inst_metamask')
      return true
    }
    return false
  },
}
const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))
export const gnosisSafeConnection: Connection = {
  getProviderInfo: () => ({ name: 'Gnosis Safe', icon: GNOSIS_ICON }),
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  shouldDisplay: () => false,
}

export const walletConnectV2Connection: Connection = new (class implements Connection {
  private initializer = (actions: Actions, defaultChainId = ChainId.MAINNET) =>
    new WalletConnectV2({ actions, defaultChainId, onError })

  type = ConnectionType.WALLET_CONNECT_V2
  getName = () => 'WalletConnect'
  getIcon = () => WALLET_CONNECT_ICON
  getProviderInfo = () => ({
    name: 'WalletConnect',
    icon: WALLET_CONNECT_ICON,
  })
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

const [web3WCV2UniwalletConnect, web3WCV2UniwalletConnectHooks] = initializeConnector<UniwalletWCV2Connect>(
  (actions) => new UniwalletWCV2Connect({ actions, onError })
)

const isNonSupportedDevice = !isWebIOS && !isWebAndroid && isTouchable

export const uniwalletWCV2ConnectConnection: Connection = {
  getProviderInfo: () => ({ name: 'Uniswap Wallet', icon: UNIWALLET_ICON }),
  connector: web3WCV2UniwalletConnect,
  hooks: web3WCV2UniwalletConnectHooks,
  type: ConnectionType.UNISWAP_WALLET_V2,
  shouldDisplay: () => Boolean(!getIsInjectedMobileBrowser() && !isNonSupportedDevice),
}

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: APP_RPC_URLS[ChainId.MAINNET][0],
        appName: 'Uniswap',
        appLogoUrl: UNISWAP_LOGO,
        reloadOnDisconnect: false,
      },
      onError,
    })
)
const coinbaseWalletConnection: Connection = {
  getProviderInfo: () => ({ name: 'Coinbase Wallet', icon: COINBASE_ICON }),
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
  type: ConnectionType.COINBASE_WALLET,
  shouldDisplay: () =>
    Boolean((isMobile && !getIsInjectedMobileBrowser()) || !isMobile || getIsCoinbaseWalletBrowser()),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate: () => {
    if (isMobile && !getIsInjectedMobileBrowser()) {
      window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      return true
    }
    return false
  },
}

export const connections = [
  gnosisSafeConnection,
  uniwalletWCV2ConnectConnection,
  deprecatedInjectedConnection,
  walletConnectV2Connection,
  coinbaseWalletConnection,
  eip6963Connection,
  // network connector should be last in the list, as it should be the fallback if no other connector is active
  networkConnection,
  deprecatedNetworkConnection,
]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = connections.find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return deprecatedInjectedConnection
      case ConnectionType.COINBASE_WALLET:
        return coinbaseWalletConnection
      case ConnectionType.WALLET_CONNECT_V2:
        return walletConnectV2Connection
      case ConnectionType.UNISWAP_WALLET_V2:
        return uniwalletWCV2ConnectConnection
      case ConnectionType.NETWORK:
        return networkConnection
      case ConnectionType.DEPRECATED_NETWORK:
        return deprecatedNetworkConnection
      case ConnectionType.GNOSIS_SAFE:
        return gnosisSafeConnection
      case ConnectionType.EIP_6963_INJECTED:
        return eip6963Connection
    }
  }
}
