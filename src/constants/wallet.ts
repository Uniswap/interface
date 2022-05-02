import { Connector } from '@web3-react/types'

import INJECTED_ICON_URL from '../assets/images/arrow-right.svg'
import COINBASE_ICON_URL from '../assets/images/coinbaseWalletIcon.svg'
import METAMASK_ICON_URL from '../assets/images/metamask.png'
import WALLETCONNECT_ICON_URL from '../assets/images/walletConnectIcon.svg'
import { coinbaseWallet, injected, walletConnect } from '../connectors'

interface WalletInfo {
  connector?: Connector
  name: string
  iconURL: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

enum Wallet {
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT = 'WALLET_CONNECT',
}

export const getConnectorForWallet = (wallet: Wallet) => {
  switch (wallet) {
    case Wallet.INJECTED:
      return injected
    case Wallet.COINBASE_WALLET:
      return coinbaseWallet
    case Wallet.WALLET_CONNECT:
      return walletConnect
  }
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconURL: INJECTED_ICON_URL,
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconURL: METAMASK_ICON_URL,
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
  },
  WALLET_CONNECT: {
    connector: walletConnect,
    name: 'WalletConnect',
    iconURL: WALLETCONNECT_ICON_URL,
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true,
  },
  COINBASE_WALLET: {
    connector: coinbaseWallet,
    name: 'Coinbase Wallet',
    iconURL: COINBASE_ICON_URL,
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconURL: COINBASE_ICON_URL,
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true,
  },
}
