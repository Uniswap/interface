import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import { SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'
import Fortmatic from 'fortmatic'
import { useMemo } from 'react'

import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'

export enum Wallet {
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT = 'WALLET_CONNECT',
  FORTMATIC = 'FORTMATIC',
  NETWORK = 'NETWORK',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
}

export const BACKFILLABLE_WALLETS = [Wallet.COINBASE_WALLET, Wallet.WALLET_CONNECT, Wallet.INJECTED]
export const SELECTABLE_WALLETS = [...BACKFILLABLE_WALLETS, Wallet.FORTMATIC]

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

export function getWalletForConnector(connector: Connector) {
  switch (connector) {
    case injected:
      return Wallet.INJECTED
    case coinbaseWallet:
      return Wallet.COINBASE_WALLET
    case walletConnect:
      return Wallet.WALLET_CONNECT
    case fortmatic:
      return Wallet.FORTMATIC
    case network:
      return Wallet.NETWORK
    case gnosisSafe:
      return Wallet.GNOSIS_SAFE
    default:
      throw Error('unsupported connector')
  }
}

export function getConnectorForWallet(wallet: Wallet) {
  switch (wallet) {
    case Wallet.INJECTED:
      return injected
    case Wallet.COINBASE_WALLET:
      return coinbaseWallet
    case Wallet.WALLET_CONNECT:
      return walletConnect
    case Wallet.FORTMATIC:
      return fortmatic
    case Wallet.NETWORK:
      return network
    case Wallet.GNOSIS_SAFE:
      return gnosisSafe
  }
}

function getHooksForWallet(wallet: Wallet) {
  switch (wallet) {
    case Wallet.INJECTED:
      return injectedHooks
    case Wallet.COINBASE_WALLET:
      return coinbaseWalletHooks
    case Wallet.WALLET_CONNECT:
      return walletConnectHooks
    case Wallet.FORTMATIC:
      return fortmaticHooks
    case Wallet.NETWORK:
      return networkHooks
    case Wallet.GNOSIS_SAFE:
      return gnosisSafeHooks
  }
}

export const [network, networkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: INFURA_NETWORK_URLS, defaultChainId: 1 })
)

export const [injected, injectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

export const [gnosisSafe, gnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))

export const [walletConnect, walletConnectHooks] = initializeConnector<WalletConnect>(
  (actions) =>
    new WalletConnect({
      actions,
      options: {
        rpc: INFURA_NETWORK_URLS,
        qrcode: true,
      },
      onError,
    })
)

export const [fortmatic, fortmaticHooks] = initializeConnector<EIP1193>(
  (actions) => new EIP1193({ actions, provider: new Fortmatic(process.env.REACT_APP_FORTMATIC_KEY).getProvider() })
)

export const [coinbaseWallet, coinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
        appName: 'Uniswap',
        appLogoUrl: UNISWAP_LOGO_URL,
        reloadOnDisconnect: false,
      },
      onError,
    })
)

interface ConnectorListItem {
  connector: Connector
  hooks: Web3ReactHooks
}

function getConnectorListItemForWallet(wallet: Wallet) {
  return {
    connector: getConnectorForWallet(wallet),
    hooks: getHooksForWallet(wallet),
  }
}

export function useConnectors(selectedWallet: Wallet | undefined) {
  return useMemo(() => {
    const connectors: ConnectorListItem[] = [{ connector: gnosisSafe, hooks: gnosisSafeHooks }]
    if (selectedWallet) {
      connectors.push(getConnectorListItemForWallet(selectedWallet))
    }
    connectors.push(
      ...SELECTABLE_WALLETS.filter((wallet) => wallet !== selectedWallet).map(getConnectorListItemForWallet)
    )
    connectors.push({ connector: network, hooks: networkHooks })
    const web3ReactConnectors: [Connector, Web3ReactHooks][] = connectors.map(({ connector, hooks }) => [
      connector,
      hooks,
    ])
    return web3ReactConnectors
  }, [selectedWallet])
}
