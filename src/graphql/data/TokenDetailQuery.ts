import graphql from 'babel-plugin-relay/macro'
import { useLazyLoadQuery } from 'react-relay'

import type { Chain, TokenDetailQuery as TokenDetailQueryType } from './__generated__/TokenDetailQuery.graphql'

export function useTokenDetailQuery(address: string, chain: Chain) {
  const tokenDetail = useLazyLoadQuery<TokenDetailQueryType>(
    graphql`
      query TokenDetailQuery($contract: ContractInput) {
        tokenProjects(contracts: [$contract]) {
          description
          homepageUrl
          twitterName
          name
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
            volume24h: volume(duration: DAY) {
              value
              currency
            }
            priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
              value
              currency
            }
            priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
              value
              currency
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
  return tokenDetail
}
