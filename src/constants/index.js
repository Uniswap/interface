import { injected, walletconnect, walletlink } from '../connectors'

export const FACTORY_ADDRESSES = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  3: '0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36',
  42: '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30'
}

export const SUPPORTED_THEMES = {
  DARK: 'DARK',
  LIGHT: 'LIGHT'
}

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    id: 'Injected',
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    color: '#010101'
  },
  METAMASK: {
    connector: injected,
    id: 'MetaMask',
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    color: '#E8831D'
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    id: 'WalletConnect',
    name: 'Wallet Connect',
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    color: '#4196FC'
  },
  WALLET_LINK: {
    connector: walletlink,
    id: 'WalletLink',
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    color: '#315CF5'
  }
}

export const MOBILE_DEEP_LINKS = {
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5'
  },
  TRUST_WALLET_LINK: {
    name: 'Open in Trust Wallet',
    iconName: 'trustWallet.png',
    description: 'iOS and Android app.',
    href: 'https://link.trustwallet.com/open_url?coin_id=60&url=https://uniswap.exchange/swap',
    color: '#1C74CC'
  }
}

// list of tokens that lock fund on adding liquidity - used to disable button
export const brokenTokens = [
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  '0x95dAaaB98046846bF4B2853e23cba236fa394A31',
  '0x55296f69f40Ea6d20E478533C15A6B08B654E758'
]

export const NetworkContextName = 'NETWORK'
