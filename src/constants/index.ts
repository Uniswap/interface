import { injected, walletconnect, walletlink, fortmatic, portis } from '../connectors'

export const FACTORY_ADDRESSES = {
  1: '',
  3: '',
  4: '0xe2f197885abe8ec7c866cFf76605FD06d4576218',
  42: ''
}

export const ROUTER_ADDRESSES = {
  1: '',
  3: '',
  4: '0xcDbE04934d89e97a24BCc07c3562DC8CF17d8167',
  42: ''
}

export const SUPPORTED_THEMES = {
  DARK: 'DARK',
  LIGHT: 'LIGHT'
}

const MAINNET_WALLETS = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  }
}

export const SUPPORTED_WALLETS =
  process.env.REACT_APP_CHAIN_ID !== '1'
    ? MAINNET_WALLETS
    : {
        ...MAINNET_WALLETS,
        ...{
          WALLET_CONNECT: {
            connector: walletconnect,
            name: 'WalletConnect',
            iconName: 'walletConnectIcon.svg',
            description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
            href: null,
            color: '#4196FC'
          },
          WALLET_LINK: {
            connector: walletlink,
            name: 'Coinbase Wallet',
            iconName: 'coinbaseWalletIcon.svg',
            description: 'Use Coinbase Wallet app on mobile device',
            href: null,
            color: '#315CF5'
          },
          COINBASE_LINK: {
            name: 'Open in Coinbase Wallet',
            iconName: 'coinbaseWalletIcon.svg',
            description: 'Open in Coinbase Wallet app.',
            href: 'https://go.cb-w.com/mtUDhEZPy1',
            color: '#315CF5',
            mobile: true,
            mobileOnly: true
          },
          TRUST_WALLET_LINK: {
            name: 'Open in Trust Wallet',
            iconName: 'trustWallet.png',
            description: 'iOS and Android app.',
            href: 'https://link.trustwallet.com/open_url?coin_id=60&url=https://uniswap.exchange/swap',
            color: '#1C74CC',
            mobile: true,
            mobileOnly: true
          },
          FORTMATIC: {
            connector: fortmatic,
            name: 'Fortmatic',
            iconName: 'fortmaticIcon.png',
            description: 'Login using Fortmatic hosted wallet',
            href: null,
            color: '#6748FF',
            mobile: true
          },
          Portis: {
            connector: portis,
            name: 'Portis',
            iconName: 'portisIcon.png',
            description: 'Login using Portis hosted wallet',
            href: null,
            color: '#4A6C9B',
            mobile: true
          }
        }
      }

export const NetworkContextName = 'NETWORK'
