import graphql from 'babel-plugin-relay/macro'
import { TimePeriod } from 'hooks/useExplorePageQuery'
import { useLazyLoadQuery } from 'react-relay'

import type { Chain, TokenRowQuery as TokenRowQueryType } from './__generated__/TokenRowQuery.graphql'

export function useTokenRowQuery(address: string, timePeriod: TimePeriod, chain: Chain) {
  const tokenRowData = useLazyLoadQuery<TokenRowQueryType>(
    graphql`
      query TokenRowQuery($contract: ContractInput!) {
        tokenProjects(contracts: [$contract]) {
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
          }
        }
      }
    `,
    {
      contract: {
        address,
        chain,
      },
    }
  )
  const { price, marketCap, volume1H, volume1D, volume1W, volume1M, volume1Y } =
    tokenRowData.tokenProjects?.[0]?.markets?.[0] ?? {}
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return { price, marketCap, volume: volume1H } ?? {}
    case TimePeriod.DAY:
      return { price, marketCap, volume: volume1D } ?? {}
    case TimePeriod.WEEK:
      return { price, marketCap, volume: volume1W } ?? {}
    case TimePeriod.MONTH:
      return { price, marketCap, volume: volume1M } ?? {}
    case TimePeriod.YEAR:
      return { price, marketCap, volume: volume1Y } ?? {}
    case TimePeriod.ALL:
      //TODO: Add functionality for ALL, without requesting it at same time as rest of data for performance reasons
      return { price, marketCap, volume: volume1Y } ?? {}
  }
}
