import { Token } from '@uniswap/sdk-core'

import { WXDC_ADDRESS, XSP_ADDRESS } from './addresses'
import { SupportedChainId } from './chains'

export const TT = new Token(
  SupportedChainId.TESTNET,
  '0xFdCf8bD44EC46a71a13f00F4328F6b65adc8BCf9',
  18,
  'TT',
  'Test Token'
)
export const XT = new Token(SupportedChainId.TESTNET, '0xc33BfDD2211dD9A61355B08dc19A68d0e3816f65', 18, 'XT', 'XTest')

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
    symbol: 'WXDC',
    name: 'Wrapped XDC',
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
