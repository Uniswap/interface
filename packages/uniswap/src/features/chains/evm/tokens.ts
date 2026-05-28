import { Token } from '@uniswap/sdk-core'
import { getNonEmptyArrayOrThrow, NonEmptyArray } from 'utilities/src/primitives/array'
import { Prettify } from 'viem'

function sortStablecoins(stables: Record<string, Token>, primaryKey?: string): Token[] {
  const { [primaryKey ?? '']: primary, USDC, USDT, DAI, ...rest } = stables
  const seen = new Set<Token>()
  return [primary, USDC, USDT, DAI, ...Object.values(rest)].filter((token): token is Token => {
    if (!token || seen.has(token)) {
      return false
    }
    seen.add(token)
    return true
  })
}

export function buildChainTokens<TStables extends Record<string, Token>>({
  stables,
  primaryStablecoin,
}: {
  stables: TStables
  primaryStablecoin?: keyof TStables
}): Prettify<TStables & { stablecoins: NonEmptyArray<Token> }> {
  const stablecoins = sortStablecoins(stables, primaryStablecoin ? String(primaryStablecoin) : undefined)

  try {
    return { ...stables, stablecoins: getNonEmptyArrayOrThrow(stablecoins) }
  } catch (_error) {
    throw new Error(`Must provide at least one stablecoin for each chain`)
  }
}
