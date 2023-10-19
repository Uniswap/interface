import { WatchQueryFetchPolicy } from '@apollo/client'
import gql from 'graphql-tag'

import { TokenBalance, TokenQuery, usePortfolioBalancesQuery } from './__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from './util'

gql`
  query PortfolioBalances($ownerAddress: String!, $chains: [Chain!]!) {
    portfolios(ownerAddresses: [$ownerAddress], chains: $chains) {
      id
      tokensTotalDenominatedValue {
        id
        value
      }
      tokensTotalDenominatedValueChange(duration: DAY) {
        absolute {
          id
          value
        }
        percentage {
          id
          value
        }
      }
      tokenBalances {
        id
        quantity
        denominatedValue {
          id
          currency
          value
        }
        tokenProjectMarket {
          id
          pricePercentChange(duration: DAY) {
            id
            value
          }
          tokenProject {
            id
            logoUrl
            isSpam
            tokens {
              id
              chain
              address
            }
          }
        }
        token {
          id
          chain
          address
          name
          symbol
          standard
          decimals
        }
      }
    }
  }
`

/** Helper GQL hook to retrieve balances across chains for a given currency, for the active account. */
export function useCrossChainGqlBalances({
  tokenQuery,
  address,
  fetchPolicy,
}: {
  tokenQuery: TokenQuery
  address?: string
  fetchPolicy?: WatchQueryFetchPolicy
}): TokenBalance[] | undefined {
  const { data: portfolioBalances } = usePortfolioBalancesQuery({
    skip: !address,
    variables: { ownerAddress: address ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy,
  })

  const tokenBalances = portfolioBalances?.portfolios?.[0].tokenBalances
  const bridgeInfo = tokenQuery.token?.project?.tokens

  return tokenBalances?.filter(
    (tokenBalance) =>
      tokenBalance.token?.symbol === tokenQuery.token?.symbol &&
      bridgeInfo?.some((bridgeToken) => bridgeToken.id == tokenBalance.token?.id)
  ) as TokenBalance[] | undefined
}
