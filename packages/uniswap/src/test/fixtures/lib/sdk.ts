import { Token } from '@uniswap/sdk-core'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const ETH = new Token(UniverseChainId.Mainnet, DEFAULT_NATIVE_ADDRESS, 18, 'ETH', 'Ethereum')

export const WETH = new Token(
  UniverseChainId.Mainnet,
  getWrappedNativeAddress(UniverseChainId.Mainnet),
  18,
  'WETH',
  'Wrapped Ether',
)

export const DAI = new Token(
  UniverseChainId.Mainnet,
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  18,
  'DAI',
  'Dai Stablecoin',
)

export const DAI_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  18,
  'DAI',
  'Dai stable coin',
)

export const USDC = new Token(
  UniverseChainId.Mainnet,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C',
)

export const USDC_ARBITRUM = new Token(
  UniverseChainId.ArbitrumOne,
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  6,
  'USDC',
  'USD//C',
)

export const USDBC_BASE = new Token(
  UniverseChainId.Base,
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
  6,
  'USDbC',
  'USD Base Coin',
)

export const USDC_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
  6,
  'USDC',
  'USD//C',
)

export const USDC_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  6,
  'USDC',
  'USD//C',
)

export const USDT = new Token(
  UniverseChainId.Mainnet,
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  6,
  'USDT',
  'Tether USD',
)

export const USDT_BNB = new Token(
  UniverseChainId.Bnb,
  '0x55d398326f99059ff775485246999027b3197955',
  18,
  'USDT',
  'TetherUSD',
)

export const WBTC = new Token(
  UniverseChainId.Mainnet,
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const SDK_TOKENS = [
  ETH,
  WETH,
  DAI,
  USDC,
  USDC_ARBITRUM,
  USDBC_BASE,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  USDT_BNB,
  WBTC,
]
