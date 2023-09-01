// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/tokens.ts
import { Token } from '@uniswap/sdk-core'
import { UNI_ADDRESS } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'

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

export const WRAPPED_NATIVE_CURRENCY = {
  [ChainId.Mainnet]: new Token(
    1,
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Goerli]: new Token(
    5,
    '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Optimism]: new Token(
    ChainId.Optimism,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ArbitrumOne]: new Token(
    ChainId.ArbitrumOne,
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Base]: new Token(
    ChainId.Base,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Bnb]: new Token(
    ChainId.Bnb,
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB'
  ),
  [ChainId.Polygon]: new Token(
    ChainId.Polygon,
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
  [ChainId.PolygonMumbai]: new Token(
    ChainId.PolygonMumbai,
    '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
}
