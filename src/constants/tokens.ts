import { Token } from '@uniswap/sdk-core'

import { WXDC_ADDRESS, XSP_ADDRESS } from './addresses'
import { SupportedChainId } from './chains'

export const AMPL = new Token(
  SupportedChainId.MAINNET,
  '0xD46bA6D942050d489DBd938a2C909A5d5039A161',
  9,
  'AMPL',
  'Ampleforth'
)
export const DAI = new Token(
  SupportedChainId.MAINNET,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const USDC = new Token(
  SupportedChainId.MAINNET,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C'
)
export const TT = new Token(
  SupportedChainId.TESTNET,
  '0xFdCf8bD44EC46a71a13f00F4328F6b65adc8BCf9',
  18,
  'TT',
  'Test Token'
)
export const USDT = new Token(
  SupportedChainId.MAINNET,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC = new Token(
  SupportedChainId.MAINNET,
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const FEI = new Token(
  SupportedChainId.MAINNET,
  '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
  18,
  'FEI',
  'Fei USD'
)
export const TRIBE = new Token(
  SupportedChainId.MAINNET,
  '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B',
  18,
  'TRIBE',
  'Tribe'
)
export const FRAX = new Token(
  SupportedChainId.MAINNET,
  '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  18,
  'FRAX',
  'Frax'
)
export const FXS = new Token(
  SupportedChainId.MAINNET,
  '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
  18,
  'FXS',
  'Frax Share'
)
export const renBTC = new Token(
  SupportedChainId.MAINNET,
  '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D',
  8,
  'renBTC',
  'renBTC'
)
export const ETH2X_FLI = new Token(
  SupportedChainId.MAINNET,
  '0xAa6E8127831c9DE45ae56bB1b0d4D4Da6e5665BD',
  18,
  'ETH2x-FLI',
  'ETH 2x Flexible Leverage Index'
)
export const sETH2 = new Token(
  SupportedChainId.MAINNET,
  '0xFe2e637202056d30016725477c5da089Ab0A043A',
  18,
  'sETH2',
  'StakeWise Staked ETH2'
)
export const rETH2 = new Token(
  SupportedChainId.MAINNET,
  '0x20BC832ca081b91433ff6c17f85701B6e92486c5',
  18,
  'rETH2',
  'StakeWise Reward ETH2'
)
export const SWISE = new Token(
  SupportedChainId.MAINNET,
  '0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2',
  18,
  'SWISE',
  'StakeWise'
)
export const UNI: { [chainId: number]: Token } = {
  [SupportedChainId.MAINNET]: new Token(SupportedChainId.MAINNET, XSP_ADDRESS[50], 18, 'XSP', 'XSwapProtocol'),
  [SupportedChainId.TESTNET]: new Token(SupportedChainId.MAINNET, XSP_ADDRESS[51], 18, 'TXSP', 'XSwapProtocol'),
}

export const WXDC_CONFIG: {
  [chainId: number]: {
    chainId: number
    address: string
    decimals: number
    symbol: string
    name: string
  }
} = {
  [SupportedChainId.MAINNET]: {
    chainId: SupportedChainId.MAINNET,
    address: WXDC_ADDRESS[SupportedChainId.MAINNET],
    decimals: 18,
    symbol: 'WXDC',
    name: 'Wrapped XDC',
  },
  [SupportedChainId.TESTNET]: {
    chainId: SupportedChainId.TESTNET,
    address: WXDC_ADDRESS[SupportedChainId.TESTNET],
    decimals: 18,
    symbol: 'WTXDC',
    name: 'Wrapped TXDC',
  },
}

export const WETH_EXTENDED: { [chainId: number]: Token } = {
  [SupportedChainId.MAINNET]: new Token(
    WXDC_CONFIG[SupportedChainId.MAINNET].chainId,
    WXDC_CONFIG[SupportedChainId.MAINNET].address,
    WXDC_CONFIG[SupportedChainId.MAINNET].decimals,
    WXDC_CONFIG[SupportedChainId.MAINNET].symbol,
    WXDC_CONFIG[SupportedChainId.MAINNET].name
  ),
  [SupportedChainId.TESTNET]: new Token(
    WXDC_CONFIG[SupportedChainId.TESTNET].chainId,
    WXDC_CONFIG[SupportedChainId.TESTNET].address,
    WXDC_CONFIG[SupportedChainId.TESTNET].decimals,
    WXDC_CONFIG[SupportedChainId.TESTNET].symbol,
    WXDC_CONFIG[SupportedChainId.TESTNET].name
  ),
}
