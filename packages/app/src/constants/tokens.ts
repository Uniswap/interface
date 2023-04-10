// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/tokens.ts
import { Token } from '@uniswap/sdk-core'

export const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

import { ChainId } from '../features/chains/chains'
import { UNI_ADDRESS } from './addresses'

export const DAI = new Token(
  ChainId.Mainnet,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const DAI_ARBITRUM_ONE = new Token(
  ChainId.ArbitrumOne,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai stable coin'
)
export const USDC = new Token(
  ChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C'
)
export const USDC_ARBITRUM = new Token(
  ChainId.ArbitrumOne,
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  6,
  'USDC',
  'USD//C'
)
export const USDC_OPTIMISM = new Token(
  ChainId.Optimism,
  '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  6,
  'USDC',
  'USD//C'
)
export const USDC_POLYGON = new Token(
  ChainId.Polygon,
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  6,
  'USDC',
  'USD//C'
)

export const USDC_GOERLI = new Token(
  ChainId.Polygon,
  '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
  6,
  'USDC',
  'USD//C'
)

export const USDT = new Token(
  ChainId.Mainnet,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  6,
  'USDT',
  'Tether USD'
)

export const WBTC = new Token(
  ChainId.Mainnet,
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  8,
  'WBTC',
  'Wrapped BTC'
)

export const UNI = {
  [ChainId.Mainnet]: new Token(
    ChainId.Mainnet,
    UNI_ADDRESS[ChainId.Mainnet],
    18,
    'UNI',
    'Uniswap'
  ),
  [ChainId.Goerli]: new Token(
    ChainId.Goerli,
    UNI_ADDRESS[ChainId.Goerli],
    18,
    'UNI',
    'Uniswap'
  ),
}

export const WRAPPED_NATIVE_CURRENCY = {
  [ChainId.Mainnet]: new Token(
    1,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Goerli]: new Token(
    5,
    '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
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
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.Polygon]: new Token(
    ChainId.Polygon,
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
  [ChainId.PolygonMumbai]: new Token(
    ChainId.PolygonMumbai,
    '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
}
