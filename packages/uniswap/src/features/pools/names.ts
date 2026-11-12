import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'

/**
 * A pool's display name, base then quote ("ETH/USDC"). Omit `token0IsQuote` when the symbols are
 * already in display order. Undefined when either symbol is missing.
 */
export function getPoolName({
  symbol0,
  symbol1,
  token0IsQuote,
  spaced = false,
}: {
  symbol0: string | undefined
  symbol1: string | undefined
  token0IsQuote?: boolean
  spaced?: boolean
}): string | undefined {
  const [baseSymbol, quoteSymbol] = orderPoolDataByQuoteToken({ token0IsQuote, data0: symbol0, data1: symbol1 })
  if (!baseSymbol || !quoteSymbol) {
    return undefined
  }
  return spaced ? `${baseSymbol} / ${quoteSymbol}` : `${baseSymbol}/${quoteSymbol}`
}
