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
// export type PricePoint = { timestamp: number; value: number }
export type PricePoint = NonNullable<
  NonNullable<NonNullable<NonNullable<TokenPriceQuery['response']['tokens']>[number]>['market']['priceHistory']>[number]
>
export type PriceDurations = Partial<Record<TimePeriod, PricePoint[]>>

export function isPricePoint(p: { timestamp: number; value: number } | null): p is PricePoint {
  return Boolean(p)
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
    let priceHistory = queryData.tokens?.[0]?.market?.priceHistory?.filter(isPricePoint)
    const currentPrice = queryData.tokens?.[0]?.market?.price?.value

    // Append the current price to the end of the priceHistory array
    if (currentPrice !== undefined && priceHistory && priceHistory.length > 0) {
      // If we can append the current price, make pricehistory array not readonly
      priceHistory = Array.from(priceHistory)
      const timestamp = Date.now() / 1000
      priceHistory.push({ timestamp, value: currentPrice })
    }
    return priceHistory
  }, [queryData])

  return priceHistory
}

// export function useTokenPriceQuery(address: string, chain: Chain): PriceDurations | undefined {
//   const contract = useMemo(() => ({ address: address.toLowerCase(), chain }), [address, chain])
//   const [prices, setPrices] = useState<PriceDurations>()

//   useEffect(() => {
//     const subscription = fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, { contract }).subscribe({
//       next: (response: TokenPriceQuery['response']) => {
//         const priceData = response.tokens?.[0]?.market
//         const prices = {
//           [TimePeriod.HOUR]: priceData?.priceHistory1H?.filter(isPricePoint),
//           [TimePeriod.DAY]: priceData?.priceHistory1D?.filter(isPricePoint),
//           [TimePeriod.WEEK]: priceData?.priceHistory1W?.filter(isPricePoint),
//           [TimePeriod.MONTH]: priceData?.priceHistory1M?.filter(isPricePoint),
//           [TimePeriod.YEAR]: priceData?.priceHistory1Y?.filter(isPricePoint),
//         }

//         // Ensure the latest price available is available for every TimePeriod.
//         const latests = Object.values(prices)
//           .map((prices) => prices?.slice(-1)?.[0] ?? null)
//           .filter(isPricePoint)
//         if (latests.length) {
//           const latest = latests.reduce((latest, pricePoint) =>
//             latest.timestamp > pricePoint.timestamp ? latest : pricePoint
//           )
//           Object.values(prices)
//             .filter((prices) => prices && prices.slice(-1)[0] !== latest)
//             .forEach((prices) => prices?.push(latest))
//         }

//         setPrices(prices)
//       },
//     })
//     return () => {
//       setPrices(undefined)
//       subscription.unsubscribe()
//     }
//   }, [contract])

//   return prices
// }
