import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function createTokenFactory(defaults: { decimals: number; name: string; symbol: string }) {
  return function createToken<A extends string>(address: A, chainId: UniverseChainId): Token {
    return new Token(chainId, address, defaults.decimals, defaults.symbol, defaults.name)
  }
}

/** Builds a metadata object representing USDC with default values; do not use for chains that have non-standard USDC fields. */
export const buildUSDC = createTokenFactory({
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
})

/** Builds a metadata object representing DAI with default values; do not use for chains that have non-standard DAI fields. */
export const buildDAI = createTokenFactory({
  decimals: 18,
  name: 'Dai Stablecoin',
  symbol: 'DAI',
})

/** Builds a metadata object representing USDT with default values; do not use for chains that have non-standard USDT fields. */
export const buildUSDT = createTokenFactory({
  decimals: 6,
  name: 'Tether USD',
  symbol: 'USDT',
})
