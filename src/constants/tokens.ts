import { Token } from '@uniswap/sdk-core'

import { WXDC_ADDRESS, XSP_ADDRESS, XTT_ADDRESS } from './addresses'
import { SupportedChainId } from './chains'

const { TESTNET, MAINNET } = SupportedChainId
export const TT = new Token(TESTNET, '0xFdCf8bD44EC46a71a13f00F4328F6b65adc8BCf9', 18, 'TT', 'Test Token')
export const XT = new Token(TESTNET, '0xc33BfDD2211dD9A61355B08dc19A68d0e3816f65', 18, 'XT', 'XTest')

export const XSP: { [chainId: number]: Token } = {
  [MAINNET]: new Token(MAINNET, XSP_ADDRESS[50], 18, 'XSP', 'XSwapProtocol'),
  [TESTNET]: new Token(MAINNET, XSP_ADDRESS[51], 18, 'TXSP', 'XSwapProtocol'),
}

export const XTT: { [chainId: number]: Token } = {
  [MAINNET]: new Token(MAINNET, XTT_ADDRESS[50], 18, 'XTT', 'XSwap Treasury Token'),
  [TESTNET]: new Token(MAINNET, XTT_ADDRESS[51], 18, 'XTT', 'XSwap Treasury Token'),
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
  [MAINNET]: {
    chainId: MAINNET,
    address: WXDC_ADDRESS[MAINNET],
    decimals: 18,
    symbol: 'WXDC',
    name: 'Wrapped XDC',
  },
  [TESTNET]: {
    chainId: TESTNET,
    address: WXDC_ADDRESS[TESTNET],
    decimals: 18,
    symbol: 'WXDC',
    name: 'Wrapped XDC',
  },
}

export const WETH_EXTENDED: { [chainId: number]: Token } = {
  [MAINNET]: new Token(
    WXDC_CONFIG[MAINNET].chainId,
    WXDC_CONFIG[MAINNET].address,
    WXDC_CONFIG[MAINNET].decimals,
    WXDC_CONFIG[MAINNET].symbol,
    WXDC_CONFIG[MAINNET].name
  ),
  [TESTNET]: new Token(
    WXDC_CONFIG[TESTNET].chainId,
    WXDC_CONFIG[TESTNET].address,
    WXDC_CONFIG[TESTNET].decimals,
    WXDC_CONFIG[TESTNET].symbol,
    WXDC_CONFIG[TESTNET].name
  ),
}
