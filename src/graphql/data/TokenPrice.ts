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
export type PricePoint = NonNullable<
  NonNullable<NonNullable<NonNullable<TokenPriceQuery['response']['tokens']>[number]>['market']['priceHistory']>[number]
>
export type PriceDurations = Partial<Record<TimePeriod, PricePoint[]>>

export function isPricePoint(p: { timestamp: number; value: number } | null): p is PricePoint {
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

  const priceHistory = useMemo(() => {
    const priceHistory = queryData.tokens?.[0]?.market?.priceHistory?.filter(isPricePoint)
    const currentPrice = queryData.tokens?.[0]?.market?.price?.value

    // Append the current price to the end of the priceHistory array
    if (currentPrice !== undefined && priceHistory && priceHistory.length > 0) {
      const timestamp = Date.now() / 1000
      priceHistory.push({ timestamp, value: currentPrice })
    }
    return priceHistory
  }, [queryData])

  return priceHistory
}
