import { Connector } from '@web3-react/types'
import {
  coinbaseWallet,
  coinbaseWalletHooks,
  fortmatic,
  fortmaticHooks,
  gnosisSafe,
  gnosisSafeHooks,
  injected,
  injectedHooks,
  network,
  networkHooks,
  Wallet,
  walletConnect,
  walletConnectHooks,
} from 'connectors'

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

export function getHooksForWallet(wallet: Wallet) {
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
