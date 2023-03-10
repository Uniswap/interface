// a list of tokens by chain
import { Currency, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

import { nativeOnChain, USDC_FUJI, USDC_TEVMOS, WETH_FUJI, WETH_TEVMOS, WRAPPED_NATIVE_CURRENCY } from './tokens'

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

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.MAINNET]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET]],
  [SupportedChainId.FUJI]: [USDC_FUJI, WETH_FUJI],
  [SupportedChainId.TESTNET]: [USDC_TEVMOS, WETH_TEVMOS],
}
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {}
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [SupportedChainId.MAINNET]: [
    nativeOnChain(SupportedChainId.MAINNET),

    WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token,
  ],
  [SupportedChainId.FUJI]: [nativeOnChain(SupportedChainId.FUJI), USDC_FUJI],
  [SupportedChainId.TESTNET]: [nativeOnChain(SupportedChainId.TESTNET), USDC_TEVMOS],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.MAINNET]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET]],
  [SupportedChainId.FUJI]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.FUJI], USDC_FUJI],
  [SupportedChainId.TESTNET]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.TESTNET], USDC_TEVMOS],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {}
