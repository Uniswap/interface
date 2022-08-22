import graphql from 'babel-plugin-relay/macro'
import { TimePeriod } from 'hooks/useExplorePageQuery'
import { useLazyLoadQuery } from 'react-relay'

import type { Chain, TokenPriceQuery as TokenPriceQueryType } from './__generated__/TokenPriceQuery.graphql'

export function useTokenPriceQuery(address: string, timePeriod: TimePeriod, chain: Chain) {
  const tokenPrices = useLazyLoadQuery<TokenPriceQueryType>(
    graphql`
      query TokenPriceQuery($contract: ContractInput!) {
        tokenProjects(contracts: [$contract]) {
          name
          markets(currencies: [USD]) {
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
          tokens {
            chain
            address
            symbol
            decimals
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
  const { priceHistory1H, priceHistory1D, priceHistory1W, priceHistory1M, priceHistory1Y } =
    tokenPrices.tokenProjects?.[0]?.markets?.[0] ?? {}

  switch (timePeriod) {
    case TimePeriod.HOUR:
      return priceHistory1H ?? []
    case TimePeriod.DAY:
      return priceHistory1D ?? []
    case TimePeriod.WEEK:
      return priceHistory1W ?? []
    case TimePeriod.MONTH:
      return priceHistory1M ?? []
    case TimePeriod.YEAR:
      return priceHistory1Y ?? []
    case TimePeriod.ALL:
      //TODO: Add functionality for ALL, without requesting it at same time as rest of data for performance reasons
      return priceHistory1Y ?? []
  }
}
