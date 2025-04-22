import { Connector } from 'wagmi'

export const INJECTED_CONNECTOR = {
  id: 'injected',
  name: 'Install MetaMask',
  type: 'injected',
} as unknown as Connector
export const METAMASK_INJECTED_CONNECTOR = {
  id: 'io.metamask',
  name: 'Install MetaMask',
  type: 'injected',
} as unknown as Connector
export const COINBASE_INJECTED_CONNECTOR = {
  id: 'com.coinbase.wallet',
  name: 'Install Coinbase',
  type: 'injected',
} as unknown as Connector
export const COINBASE_SDK_CONNECTOR = {
  id: 'coinbaseWalletSDK',
  name: 'Coinbase Wallet',
  type: 'coinbaseWallet',
} as unknown as Connector
export const UNISWAP_MOBILE_CONNECTOR = {
  id: 'uniswapWalletConnect',
  name: 'Uniswap Wallet',
  type: 'uniswapWalletConnect',
} as unknown as Connector
export const UNISWAP_EXTENSION_CONNECTOR = {
  id: 'org.uniswap.app',
  name: 'Uniswap Extension',
  type: 'injected',
} as unknown as Connector
export const WALLET_CONNECT_CONNECTOR = {
  id: 'walletConnect',
  name: 'WalletConnect',
  type: 'walletConnect',
  getProvider: () => {
    return Promise.resolve({ modal: { setTheme: jest.fn() } })
  },
} as unknown as Connector
