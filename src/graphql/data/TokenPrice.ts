import graphql from 'babel-plugin-relay/macro'
import { useEffect, useMemo, useState } from 'react'
import { fetchQuery } from 'react-relay'

import { Chain, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import environment from './RelayEnvironment'
import { TimePeriod } from './util'

const tokenPriceQuery = graphql`
  query TokenPriceQuery($contract: ContractInput!) {
    tokens(contracts: [$contract]) {
      market(currency: USD) {
        priceHistory1H: priceHistory(duration: HOUR) {
          timestamp
          value
        }
        priceHistory1D: priceHistory(duration: DAY) {
          timestamp
          value
        }
        priceHistory1W: priceHistory(duration: WEEK) {
          timestamp
          value
        }
        priceHistory1M: priceHistory(duration: MONTH) {
          timestamp
          value
        }
        priceHistory1Y: priceHistory(duration: YEAR) {
          timestamp
          value
        }
      }
    }
  }
`

export type PricePoint = { timestamp: number; value: number }
export type PriceDurations = Partial<Record<TimePeriod, PricePoint[]>>

export function isPricePoint(p: { timestamp: number; value: number | null } | null): p is PricePoint {
  return Boolean(p && p.value)
}

export function useTokenPriceQuery(address: string, chain: Chain): PriceDurations | undefined {
  const contract = useMemo(() => ({ address: address.toLowerCase(), chain }), [address, chain])
  const [prices, setPrices] = useState<PriceDurations>()

  useEffect(() => {
    const subscription = fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, { contract }).subscribe({
      next: (response: TokenPriceQuery['response']) => {
        const priceData = response.tokens?.[0]?.market
        const prices = {
          [TimePeriod.HOUR]: priceData?.priceHistory1H?.filter(isPricePoint),
          [TimePeriod.DAY]: priceData?.priceHistory1D?.filter(isPricePoint),
          [TimePeriod.WEEK]: priceData?.priceHistory1W?.filter(isPricePoint),
          [TimePeriod.MONTH]: priceData?.priceHistory1M?.filter(isPricePoint),
          [TimePeriod.YEAR]: priceData?.priceHistory1Y?.filter(isPricePoint),
        }

        // Ensure the latest price available is available for every TimePeriod.
        const latests = Object.values(prices)
          .map((prices) => prices?.slice(-1)?.[0] ?? null)
          .filter(isPricePoint)
        if (latests.length) {
          const latest = latests.reduce((latest, pricePoint) =>
            latest.timestamp > pricePoint.timestamp ? latest : pricePoint
          )
          Object.values(prices)
            .filter((prices) => prices && prices.slice(-1)[0] !== latest)
            .forEach((prices) => prices?.push(latest))
        }

        setPrices(prices)
      },
    })
    return () => {
      setPrices(undefined)
      subscription.unsubscribe()
    }
  }, [contract])

  return prices
}
