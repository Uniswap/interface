import { Token } from '@uniswap/sdk-core'
import { BANANA_TOKEN, FLEX_USD, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean),
)

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [UniverseChainId.Mainnet]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[UniverseChainId.Mainnet]],
  [UniverseChainId.SmartBCH]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[UniverseChainId.SmartBCH]],
}

export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [UniverseChainId.SmartBCH]: [[FLEX_USD, BANANA_TOKEN]],
}
