import { getTokenLogoURL } from 'utils'

export const MUMBAI_TOKEN_LIST = {
  name: 'DmmExchange Token List',
  keywords: ['dmmexchange'],
  timestamp: '2020-12-12T00:00:00+00:00',
  tokens: [
    {
      chainId: 80001,
      address: '0x2CeC76B26A8d96BF3072D34A01BB3a4edE7c06BE',
      symbol: 'USDC',
      name: 'USDC',
      decimals: 6,
      logoURI: getTokenLogoURL('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    },
    {
      chainId: 80001,
      address: '0x064B91Bda6d178DfE03835de9450BFe78201c43F',
      symbol: 'USDT',
      name: 'USDT',
      decimals: 6,
      logoURI: getTokenLogoURL('0xdAC17F958D2ee523a2206206994597C13D831ec7')
    },
    {
      chainId: 80001,
      address: '0x5e2de02472aC02736b43054f095837725A5870eF',
      symbol: 'DAI',
      name: 'DAI',
      decimals: 18,
      logoURI: getTokenLogoURL('0x6B175474E89094C44Da98b954EedeAC495271d0F')
    }
  ],
  version: {
    major: 0,
    minor: 0,
    patch: 0
  }
}
