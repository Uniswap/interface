import graphql from 'babel-plugin-relay/macro'
import { useMemo, useState } from 'react'

import { Chain } from './__generated__/TokenPriceQuery.graphql'
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

export type PricePoint = { value: number; timestamp: number }
export type PriceDurations = Partial<Record<TimePeriod, PricePoint[]>>

/*
export function filterPrices(prices: NonNullable<NonNullable<TokenQueryData>['market']>['priceHistory'] | undefined) {
  return prices?.filter((p): p is PricePoint => Boolean(p && p.value))
}
*/

export function useTokenPriceQuery(address: string, chain: Chain): PriceDurations {
  const contract = useMemo(() => ({ address: address.toLowerCase(), chain }), [address, chain])

  const [prices, setPrices] = useState<PriceDurations>({})
  /*
  const updatePrices = (response: TokenPriceQuery['response']) => {
    const priceData = response.tokens?.[0]?.market
    if (priceData) {
      setPrices((current) => {
        return {
          [TimePeriod.HOUR]: filterPrices(priceData.priceHistory1H) ?? current[TimePeriod.HOUR],
          [TimePeriod.DAY]: filterPrices(priceData.priceHistory1D) ?? current[TimePeriod.DAY],
          [TimePeriod.WEEK]: filterPrices(priceData.priceHistory1W) ?? current[TimePeriod.WEEK],
          [TimePeriod.MONTH]: filterPrices(priceData.priceHistory1M) ?? current[TimePeriod.MONTH],
          [TimePeriod.YEAR]: filterPrices(priceData.priceHistory1Y) ?? current[TimePeriod.YEAR],
        }
      })
    }
  }
  useEffect(() => {
    fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, {
      contract,
      skip1H: timePeriod === TimePeriod.HOUR,
      skip1D: timePeriod === TimePeriod.DAY,
      skip1W: timePeriod === TimePeriod.WEEK,
      skip1M: timePeriod === TimePeriod.MONTH,
      skip1Y: timePeriod === TimePeriod.YEAR,
    })
  })
  // Fetch prices & token info in tandem so we can render faster
  useMemo(
    () => fetchAllPriceDurations(contract, toHistoryDuration(timePeriod)).subscribe({ next: updatePrices }),
    [contract, timePeriod]
  )

  useMemo(
    () =>
      setPrices((current) => {
        current[timePeriod] = filterPrices(token?.market?.priceHistory)
        return current
      }),
    [timePeriod, token?.market?.priceHistory]
  )
  */

  return prices
}
