import graphql from 'babel-plugin-relay/macro'
import { useLazyLoadQuery } from 'react-relay'

import type { Chain, Currency, TopTokenQuery as TopTokenQueryType } from './__generated__/TopTokenQuery.graphql'

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  ALL,
}

interface IAmount {
  currency: Currency | null
  value: number | null
}

export type TokenData = {
  name: string | null
  address: string
  chain: Chain | null
  symbol: string | null
  price: IAmount | null | undefined
  marketCap: IAmount | null | undefined
  volume: Record<TimePeriod, IAmount | null | undefined>
  percentChange: Record<TimePeriod, IAmount | null | undefined>
}

export interface UseTopTokensResult {
  data: TokenData[] | undefined
  error: string | null
  loading: boolean
}

export function useTopTokenQuery(page: number) {
  const topTokenData = useLazyLoadQuery<TopTokenQueryType>(
    graphql`
      query TopTokenQuery($page: Int!) {
        topTokenProjects(orderBy: MARKET_CAP, pageSize: 100, currency: USD, page: $page) {
          name
          tokens {
            chain
            address
            symbol
          }
          markets(currencies: [USD]) {
            price {
              value
              currency
            }
            marketCap {
              value
              currency
            }
            fullyDilutedMarketCap {
              value
              currency
            }
            volume1H: volume(duration: HOUR) {
              value
              currency
            }
            volume1D: volume(duration: DAY) {
              value
              currency
            }
            volume1W: volume(duration: WEEK) {
              value
              currency
            }
            volume1M: volume(duration: MONTH) {
              value
              currency
            }
            volume1Y: volume(duration: YEAR) {
              value
              currency
            }
            volumeAll: volume(duration: MAX) {
              value
              currency
            }
            pricePercentChange1H: pricePercentChange(duration: HOUR) {
              currency
              value
            }
            pricePercentChange24h {
              currency
              value
            }
            pricePercentChange1W: pricePercentChange(duration: WEEK) {
              currency
              value
            }
            pricePercentChange1M: pricePercentChange(duration: MONTH) {
              currency
              value
            }
            pricePercentChange1Y: pricePercentChange(duration: YEAR) {
              currency
              value
            }
            pricePercentChangeAll: pricePercentChange(duration: MAX) {
              currency
              value
            }
          }
        }
      }
    `,
    {
      page,
    }
  )

  const topTokens: TokenData[] | undefined = topTokenData.topTokenProjects?.map((token) =>
    token?.tokens?.[0].address
      ? {
          name: token?.name,
          address: token?.tokens?.[0].address,
          chain: token?.tokens?.[0].chain,
          symbol: token?.tokens?.[0].symbol,
          price: token?.markets?.[0]?.price,
          marketCap: token?.markets?.[0]?.marketCap,
          volume: {
            [TimePeriod.HOUR]: token?.markets?.[0]?.volume1H,
            [TimePeriod.DAY]: token?.markets?.[0]?.volume1D,
            [TimePeriod.WEEK]: token?.markets?.[0]?.volume1W,
            [TimePeriod.MONTH]: token?.markets?.[0]?.volume1M,
            [TimePeriod.YEAR]: token?.markets?.[0]?.volume1Y,
            [TimePeriod.ALL]: token?.markets?.[0]?.volumeAll,
          },
          percentChange: {
            [TimePeriod.HOUR]: token?.markets?.[0]?.pricePercentChange1H,
            [TimePeriod.DAY]: token?.markets?.[0]?.pricePercentChange24h,
            [TimePeriod.WEEK]: token?.markets?.[0]?.pricePercentChange1W,
            [TimePeriod.MONTH]: token?.markets?.[0]?.pricePercentChange1M,
            [TimePeriod.YEAR]: token?.markets?.[0]?.pricePercentChange1Y,
            [TimePeriod.ALL]: token?.markets?.[0]?.pricePercentChangeAll,
          },
        }
      : ({} as TokenData)
  )
  return topTokens
}
