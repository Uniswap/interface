import { Currency, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { GetQuoteResult } from 'state/routing/slice'

// utility to get pool from array
function getPool({
  poolsInRoute,
  token0,
  token1,
}: {
  poolsInRoute: Pool[]
  token0: string
  token1?: string | undefined
}): Pool {
  const pool = poolsInRoute.find((p) => {
    return (
      [p.token0.wrapped.address, p.token1.wrapped.address].includes(token0) &&
      (!token1 || [p.token0.wrapped.address, p.token1.wrapped.address].includes(token1))
    )
  })
  if (!pool) {
    throw new Error(`Pool with token0 ${token0} ${token1 ? `and token1 ${token1}` : ''} not found`)
  }

  return pool
}

// assumes every node has exactly one incoming and one outgoing edge, except for
// the source and the destination respectively
function buildRoute(
  poolsInRoute: Pool[],
  currencyIn: Currency,
  currencyOut: Currency,
  startingEdge: GetQuoteResult['routeEdges'][0]
): Route<Currency, Currency> {
  let { inId, outId } = startingEdge

  const initialPool = getPool({ poolsInRoute, token0: inId, token1: outId })
  const pools = [initialPool]

  console.log(`initial pool: ${initialPool.token0.address} ${initialPool.token1.address}`)

  while (outId !== currencyOut.wrapped.address) {
    const pool = getPool({ poolsInRoute, token0: outId })
    pools.push(pool)

    console.log(`pool: ${pool.token0.address} ${pool.token1.address}`)

    inId = outId
    outId = pool.token1.wrapped.address
  }

  console.log('done')

  return new Route<Currency, Currency>(pools, currencyIn, currencyOut)
}

export function useRoute(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  quoteResult: Pick<GetQuoteResult, 'routeEdges' | 'routeNodes'> | undefined
): Route<Currency, Currency>[] | undefined {
  // lookup table for nodes
  const tokensInRoute = useMemo(
    () =>
      quoteResult?.routeNodes?.reduce<Record<string, Token>>((map, node) => {
        map[node.id] = new Token(node.chainId, node.id, parseInt(node.decimals), node.symbol)
        return map
      }, {}),
    [quoteResult]
  )

  // convert edges to `Pool`s
  // keep as array for simplicity since size will always be small
  const poolsInRoute = useMemo(
    () =>
      tokensInRoute
        ? quoteResult?.routeEdges?.map(({ inId, outId, fee, sqrtRatioX96, liquidity, tickCurrent }) => {
            return new Pool(
              tokensInRoute[inId],
              tokensInRoute[outId],
              // todo(judo): will return undefined for invalid fee amounts. add tests
              parseInt(fee) as FeeAmount,
              sqrtRatioX96,
              liquidity,
              parseInt(tickCurrent)
            )
          })
        : undefined,
    [quoteResult?.routeEdges, tokensInRoute]
  )

  console.log('runing')

  return useMemo(() => {
    if (!currencyIn || !currencyOut || !quoteResult || !poolsInRoute) {
      return undefined
    }

    try {
      return quoteResult.routeEdges
        .filter((edge) => edge.inId === currencyIn.wrapped.address)
        .map((edge) => buildRoute(poolsInRoute, currencyIn, currencyOut, edge))
    } catch (err) {
      console.debug(err)
      return undefined
    }
  }, [currencyIn, currencyOut, poolsInRoute, quoteResult])
}
