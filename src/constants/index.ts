import { injected, walletconnect, walletlink, fortmatic, portis } from '../connectors'

export const FACTORY_ADDRESSES = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  3: '0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36',
  42: '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30'
}

export const ROUTER_ADDRESSES = {
  1: '',
  3: '',
  4: '0xd9210Ff5A0780E083BB40e30d005d93a2DcFA4EF',
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

// list of tokens that lock fund on adding liquidity - used to disable button
export const brokenTokens = [
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  '0x95dAaaB98046846bF4B2853e23cba236fa394A31',
  '0x55296f69f40Ea6d20E478533C15A6B08B654E758',
  '0xc3761EB917CD790B30dAD99f6Cc5b4Ff93C4F9eA'
]

export const NetworkContextName = 'NETWORK'
