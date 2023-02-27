import { Currency } from '@kyberswap/ks-sdk-core'
import { Pool, Route } from '@kyberswap/ks-sdk-elastic'

function poolEquals(poolA: Pool, poolB: Pool): boolean {
  return (
    poolA === poolB ||
    (poolA.token0.equals(poolB.token0) && poolA.token1.equals(poolB.token1) && poolA.fee === poolB.fee)
  )
}

function computeAllRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  pools: Pool[],
  chainId: number,
  currentPath: Pool[] = [],
  allPaths: Route<Currency, Currency>[] = [],
  startCurrencyIn: Currency = currencyIn,
  maxHops = 2,
): Route<Currency, Currency>[] {
  const tokenIn = currencyIn?.wrapped
  const tokenOut = currencyOut?.wrapped
  if (!tokenIn || !tokenOut) throw new Error('Missing tokenIn/tokenOut')

  for (const pool of pools) {
    if (!pool.involvesToken(tokenIn) || currentPath.find(pathPool => poolEquals(pool, pathPool))) continue

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0
    if (outputToken.equals(tokenOut)) {
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut))
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        currencyOut,
        pools,
        chainId,
        [...currentPath, pool],
        allPaths,
        startCurrencyIn,
        maxHops - 1,
      )
    }
  }

  return allPaths
}
