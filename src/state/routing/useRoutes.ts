import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { GetQuoteResult } from 'state/routing/slice'

export function useRoutes(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  quoteResult: Pick<GetQuoteResult, 'routeEdges' | 'routeNodes'> | undefined
): {
  route: Route<Currency, Currency>
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}[] {
  // lookup table for nodes
  const tokensInRoute = useMemo(
    () =>
      quoteResult?.routeNodes?.reduce<Record<string, Token>>((map, node) => {
        map[node.id] = new Token(node.chainId, node.id, parseInt(node.decimals), node.symbol)
        return map
      }, {}),
    [quoteResult]
  )

  // adjacency lists representing all outgoing edges from a given Token
  const graph = useMemo(
    () =>
      quoteResult && tokensInRoute
        ? quoteResult.routeEdges.reduce<Record<string, string[]>>((adjacencyList, { inId, outId }) => {
            adjacencyList[inId] = (adjacencyList[inId] || []).concat(outId)
            return adjacencyList
          }, {})
        : undefined,
    [quoteResult, tokensInRoute]
  )

  return useMemo(() => {
    if (!currencyIn || !currencyOut || !quoteResult || !tokensInRoute || !graph) {
      return []
    }

    try {
      const allRoutes: string[][] = []
      buildRoutes({
        graph,
        src: currencyIn.wrapped.address,
        dest: currencyOut.wrapped.address,
        discovered: {},
        path: [],
        acc: allRoutes,
      })

      return allRoutes.map((route) => {
        const [pool, rawAmountIn, rawAmountOut] = parseRouteToPool(route, tokensInRoute, quoteResult.routeEdges)

        return {
          route: new Route(pool, currencyIn, currencyOut),
          inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
          outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
        }
      })
    } catch (err) {
      console.debug(err)
      return []
    }
  }, [currencyIn, currencyOut, graph, quoteResult, tokensInRoute])
}

// DFS
function buildRoutes({
  graph,
  src,
  dest,
  discovered,
  path,
  acc,
}: {
  graph: Record<string, string[]>
  src: string
  dest: string

  // modified in-place
  discovered: Record<string, boolean>
  path: string[]
  acc: string[][]
}) {
  // mark current as discovered
  discovered[src] = true

  // include current in path
  path.push(src)

  // if destination was found
  if (src === dest) {
    acc.push(path.slice())
  }

  for (const child of graph[src] ?? []) {
    if (!discovered[child]) {
      buildRoutes({ graph, src: child, dest, discovered, path, acc })
    }
  }

  // backtrack
  path.pop()
  discovered[src] = false
}

// transforms an array of Token addresses into an array of Pools
function parseRouteToPool(
  tokens: string[],
  tokensInRoute: Record<string, Token>,
  edges: GetQuoteResult['routeEdges']
): [Pool[], string, string] {
  const pools = []
  let rawAmountIn: string | undefined = undefined
  let rawAmountOut: string | undefined = undefined

  for (let i = 1; i < tokens.length; i++) {
    const [inId, outId] = [tokens[i - 1], tokens[i]]
    const edge = edges.find(({ inId: edgeInId, outId: edgeOutId }) => inId === edgeInId && outId === edgeOutId)

    if (!edge) {
      throw new Error(`Edge ${inId}->${outId} not found`)
    }

    const { amountIn, amountOut, fee, sqrtRatioX96, liquidity, tickCurrent } = edge

    if (i === 1) rawAmountIn = amountIn
    if (i === tokens.length - 1) rawAmountOut = amountOut

    pools.push(
      new Pool(
        tokensInRoute[inId],
        tokensInRoute[outId],
        parseInt(fee) as FeeAmount,
        sqrtRatioX96,
        liquidity,
        parseInt(tickCurrent)
      )
    )
  }

  if (!rawAmountIn || !rawAmountOut) {
    throw new Error('Expected rawAmountIn & rawAmountOut to be defined')
  }

  return [pools, rawAmountIn, rawAmountOut]
}
