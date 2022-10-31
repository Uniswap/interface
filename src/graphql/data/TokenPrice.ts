import graphql from 'babel-plugin-relay/macro'
import { useEffect, useMemo } from 'react'
import { loadQuery, PreloadedQuery, usePreloadedQuery, useRelayEnvironment } from 'react-relay'

import { Chain, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import { TimePeriod, toHistoryDuration } from './util'

export const tokenPriceQuery = graphql`
  query TokenPriceQuery($contract: ContractInput!, $duration: HistoryDuration!) {
    tokens(contracts: [$contract]) {
      market(currency: USD) @required(action: LOG) {
        price {
          value @required(action: LOG)
        }
        priceHistory(duration: $duration) {
          timestamp @required(action: LOG)
          value @required(action: LOG)
        }
      }
    }
  }
`
export type PricePoint = { timestamp: number; value: number }

export function isPricePoint(p: PricePoint | null): p is PricePoint {
  return p !== null
}

export function useLoadTokenPriceQuery(address: string, chain: Chain, timePeriod: TimePeriod) {
  const duration = toHistoryDuration(timePeriod)
  const contract = useMemo(() => ({ address: address.toLowerCase(), chain }), [address, chain])
  const queryReference = loadQuery<TokenPriceQuery>(useRelayEnvironment(), tokenPriceQuery, { contract, duration })

  useEffect(() => {
    return () => queryReference.dispose()
  })

  return queryReference
}

export function usePreloadedTokenPriceQuery(queryReference: PreloadedQuery<TokenPriceQuery>): PricePoint[] | undefined {
  const queryData = usePreloadedQuery<TokenPriceQuery>(tokenPriceQuery, queryReference)

  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = queryData.tokens?.[0]?.market
    const priceHistory = market?.priceHistory?.filter(isPricePoint)
    const currentPrice = market?.price?.value
    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory, { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [queryData])

  return priceHistory
}
