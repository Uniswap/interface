// a list of tokens by chain
import { ChainId, Currency, Token } from '@kinetix/sdk-core'

import {
  ATOM_KAVA,
  axlETH_KAVA,
  axlUSDC_KAVA,
  axlWBTC_KAVA,
  MIM_KAVA,
  nativeOnChain,
  USDT_KAVA,
  WRAPPED_NATIVE_CURRENCY,
} from './tokens'

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
  [ChainId.KAVA]: [
    nativeOnChain(ChainId.KAVA),
    axlUSDC_KAVA,
    axlETH_KAVA,
    axlWBTC_KAVA,
    ATOM_KAVA,
    MIM_KAVA,
    USDT_KAVA,
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [ChainId.KAVA]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.KAVA],
    axlUSDC_KAVA,
    axlETH_KAVA,
    axlWBTC_KAVA,
    ATOM_KAVA,
    MIM_KAVA,
    USDT_KAVA,
  ],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ChainId.KAVA]: [],
}
