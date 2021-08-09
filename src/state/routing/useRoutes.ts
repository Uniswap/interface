import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { GetQuoteResult } from 'state/routing/slice'

export function useRoutes(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  type: 'exactIn' | 'exactOut',
  quoteResult: Pick<GetQuoteResult, 'routeEdges' | 'routeNodes' | 'quote'> | undefined
): {
  route: Route<Currency, Currency>
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}[] {
  const tokensInRoute: Record<string, Token> | undefined = useMemo(
    () =>
      quoteResult?.routeNodes?.reduce<Record<string, Token>>((map, node) => {
        map[node.id] = new Token(node.chainId, node.id, parseInt(node.decimals), node.symbol)
        return map
      }, {}),
    [quoteResult]
  )

  // adjacency lists representing all edges (Pools) from a given Token
  const graph: Map<Token, Pool[]> | undefined = useMemo(
    () =>
      quoteResult && tokensInRoute
        ? quoteResult.routeEdges.reduce<Map<Token, Pool[]>>((adjacencyList, edge) => {
            const key = tokensInRoute[edge.inId]
            adjacencyList.set(key, (adjacencyList.get(key) || []).concat(parsePool(edge, tokensInRoute)))
            return adjacencyList
          }, new Map<Token, Pool[]>())
        : undefined,
    [quoteResult, tokensInRoute]
  )

  return useMemo(() => {
    if (!currencyIn || !currencyOut || !quoteResult || !tokensInRoute || !graph) {
      return []
    }

    try {
      const allPoolPaths: Pool[][] = []
      buildRoutes({
        graph,
        tokenMap: tokensInRoute,
        src: currencyIn.wrapped,
        dest: currencyOut.wrapped,
        discovered: {},
        path: [],
        acc: allPoolPaths,
      })

      return validate(
        allPoolPaths.map((pools) => {
          const { token0: inToken0, token1: inToken1, fee: inFee } = pools[0]
          const { token0: outToken0, token1: outToken1, fee: outFee } = pools[pools.length - 1]

          const rawAmountIn = quoteResult.routeEdges.find(
            ({ inId, outId, fee: edgeFee }) =>
              (inId === inToken0.address || inId === inToken1.address) &&
              (outId === inToken0.address || outId === inToken1.address) &&
              inFee === (parseInt(edgeFee) as FeeAmount)
          )?.amountIn

          const rawAmountOut = quoteResult.routeEdges.find(
            ({ inId, outId, fee: edgeFee }) =>
              (inId === outToken0.address || inId === outToken1.address) &&
              (outId === outToken0.address || outId === outToken1.address) &&
              outFee === (parseInt(edgeFee) as FeeAmount)
          )?.amountOut

          if (!rawAmountIn || !rawAmountOut) throw new Error('Failed to find pool in edges.')

          return {
            route: new Route(pools, currencyIn, currencyOut),
            inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
            outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
          }
        }),
        type === 'exactIn' ? currencyOut : currencyIn,
        type,
        quoteResult.quote
      )
    } catch (err) {
      console.debug(err)
      return []
    }
  }, [currencyIn, currencyOut, graph, quoteResult, tokensInRoute, type])
}

// DFS
function buildRoutes({
  graph,
  tokenMap,
  src,
  dest,
  discovered,
  path,
  acc,
}: {
  graph: Map<Token, Pool[]>
  tokenMap: Record<string, Token>
  src: Token
  dest: Token

  // modified in-place
  discovered: Record<string, boolean>
  path: Pool[]
  acc: Pool[][]
}) {
  const { address: inId } = src

  // mark current as discovered
  discovered[inId] = true

  // if destination was found
  if (inId === dest.address) {
    acc.push(path.slice())
  }

  for (const pool of graph.get(tokenMap[inId]) ?? []) {
    const { token0, token1 } = pool
    const child = token0.address === inId ? token1 : token0

    if (!discovered[child.address]) {
      // include current in path
      path.push(pool)

      buildRoutes({ graph, tokenMap, src: child, dest, discovered, path, acc })

      // backtrack
      path.pop()
    }
  }
  discovered[inId] = false
}

const parsePool = (
  { inId, outId, fee, sqrtRatioX96, liquidity, tickCurrent }: GetQuoteResult['routeEdges'][0],
  tokensInRoute: Record<string, Token>
): Pool =>
  new Pool(
    tokensInRoute[inId],
    tokensInRoute[outId],
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )

/**
 * Validates the routes
 * @returns allRoutes if all routes are valid
 * @throws if any route is invalid
 */
function validate(
  allRoutes: {
    route: Route<Currency, Currency>
    inputAmount: CurrencyAmount<Currency>
    outputAmount: CurrencyAmount<Currency>
  }[],
  currency: Currency,
  type: 'exactIn' | 'exactOut',
  expectedAmount: string
) {
  const derivedOutputAmount = allRoutes.reduce(
    (acc, cur) => acc.add(type === 'exactIn' ? cur.outputAmount : cur.inputAmount),
    CurrencyAmount.fromRawAmount(currency, '0')
  )

  if (!derivedOutputAmount.equalTo(CurrencyAmount.fromRawAmount(currency, expectedAmount))) {
    throw new Error('Expected sum of outputs to be quote result output')
  }

  return allRoutes
}
