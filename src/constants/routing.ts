// a list of tokens by chain
import { Currency, Token } from '@pollum-io/sdk-core'
import { SupportedChainId } from 'constants/chains'

import { DAI_ROLLUX, nativeOnChain, USDC_ROLLUX, USDT_ROLLUX, WBTC_ROLLUX, WRAPPED_NATIVE_CURRENCY } from './tokens'

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
  [SupportedChainId.ROLLUX]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ROLLUX],
    DAI_ROLLUX,
    USDC_ROLLUX,
    WBTC_ROLLUX,
  ],
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
  [SupportedChainId.ROLLUX]: [
    nativeOnChain(SupportedChainId.ROLLUX),
    DAI_ROLLUX,
    USDC_ROLLUX,
    USDT_ROLLUX,
    WBTC_ROLLUX,
  ],
  [SupportedChainId.ROLLUX_TANENBAUM]: [nativeOnChain(SupportedChainId.ROLLUX_TANENBAUM)],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {}
