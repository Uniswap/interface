// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/tokens.ts
import { Token } from '@taraswap/sdk-core'
import { ChainId } from 'uniswap/src/types/chains'
import { UNI_ADDRESS } from 'wallet/src/constants/addresses'
import { CHAIN_INFO } from 'wallet/src/constants/chains'

export const DAI = new Token(
  ChainId.Mainnet,
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const DAI_ARBITRUM_ONE = new Token(
  ChainId.ArbitrumOne,
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  18,
  'DAI',
  'Dai stable coin'
)
export const USDC = new Token(
  ChainId.Mainnet,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C'
)
export const USDC_ARBITRUM = new Token(
  ChainId.ArbitrumOne,
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  6,
  'USDC',
  'USD//C'
)
export const USDBC_BASE = new Token(
  ChainId.Base,
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
  6,
  'USDbC',
  'USD Base Coin'
)
export const USDT_BNB = new Token(
  ChainId.Bnb,
  '0x55d398326f99059ff775485246999027b3197955',
  18,
  'USDT',
  'TetherUSD'
)
export const USDC_OPTIMISM = new Token(
  ChainId.Optimism,
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
  6,
  'USDC',
  'USD//C'
)
export const USDC_POLYGON = new Token(
  ChainId.Polygon,
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  6,
  'USDC',
  'USD//C'
)

export const USDC_GOERLI = new Token(
  ChainId.Polygon,
  '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
  6,
  'USDC',
  'USD//C'
)

export const USDT = new Token(
  ChainId.Mainnet,
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  6,
  'USDT',
  'Tether USD'
)

export const USDB = new Token(
  ChainId.Blast,
  '0x4300000000000000000000000000000000000003',
  18,
  'USDB',
  'USDB'
)

export const CUSD = new Token(
  ChainId.Celo,
  '0x765de816845861e75a25fca122bb6898b8b1282a',
  18,
  'CUSD',
  'CUSD'
)

export const USDC_AVALANCHE = new Token(
  ChainId.Avalanche,
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  6,
  'USDC',
  'USDC'
)

export const USDzC = new Token(
  ChainId.Zora,
  '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4',
  6,
  'USDzC',
  'USD Coin'
)

export const WBTC = new Token(
  ChainId.Mainnet,
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  8,
  'WBTC',
  'Wrapped BTC'
)

export const UNI = {
  [ChainId.Mainnet]: new Token(ChainId.Mainnet, UNI_ADDRESS[ChainId.Mainnet], 18, 'UNI', 'Uniswap'),
  [ChainId.Goerli]: new Token(ChainId.Goerli, UNI_ADDRESS[ChainId.Goerli], 18, 'UNI', 'Uniswap'),
}

export function wrappedNativeCurrency(chainId: ChainId): Token {
  const wrappedCurrencyInfo = CHAIN_INFO[chainId].wrappedNativeCurrency
  return new Token(
    chainId,
    wrappedCurrencyInfo.address,
    wrappedCurrencyInfo.decimals,
    wrappedCurrencyInfo.symbol,
    wrappedCurrencyInfo.name
  )
}
