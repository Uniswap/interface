import { Token } from '@uniswap/sdk-core'
import { getNonEmptyArrayOrThrow, NonEmptyArray } from 'utilities/src/primitives/array'
import { Prettify } from 'viem'

function sortStablecoins(stables: Record<string, Token>): Token[] {
  const { USDC, DAI, USDT, ...rest } = stables
  // Prefer USDC, USDT, DAI, and then non-default stablecoinse (e.g. USDB)
  return [USDC, USDT, DAI, ...Object.values(rest)].flatMap((token) => (token ? [token] : []))
}

export function buildChainTokens<TStables extends Record<string, Token>>({
  stables,
}: {
  stables: TStables
}): Prettify<TStables & { stablecoins: NonEmptyArray<Token> }> {
  const stablecoins = sortStablecoins(stables)

  try {
    return { ...stables, stablecoins: getNonEmptyArrayOrThrow(stablecoins) }
  } catch (_error) {
    throw new Error(`Must provide at least one stablecoin for each chain`)
  }
}
