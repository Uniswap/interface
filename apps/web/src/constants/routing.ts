// a list of tokens by chain
import { ChainId, Currency, Token, WETH9 } from '@jaguarswap/sdk-core'

import { USDC, USDT, OKB, USDC_X1_TestNet, USDT_X1_TestNet, DAI_X1_TestNet, DAI, WBTC, WRAPPED_NATIVE_CURRENCY, nativeOnChain } from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[]
}

const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean)
)

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [ChainId.X1]: [nativeOnChain(ChainId.X1), DAI, USDC, USDT, WBTC, WRAPPED_NATIVE_CURRENCY[ChainId.X1] as Token],
  [ChainId.X1_TESTNET]: [nativeOnChain(ChainId.X1_TESTNET), DAI_X1_TestNet, USDC_X1_TestNet, USDT_X1_TestNet],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [ChainId.X1]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.X1], DAI, USDC, USDT, WBTC],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ChainId.X1]: [
    [
      new Token(ChainId.X1, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.X1, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin'),
    ],
    [USDC, USDT],
    [DAI, USDT],
  ],
}
