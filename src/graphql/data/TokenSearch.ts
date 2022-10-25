import { useWeb3React } from '@web3-react/core'
import graphql from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { loadQuery, usePreloadedQuery, useRelayEnvironment } from 'react-relay'

import { TokenSearchQuery } from './__generated__/TokenSearchQuery.graphql'
import { chainIdToBackendName } from './util'

type SearchedTokenProject = NonNullable<NonNullable<TokenSearchQuery['response']['searchTokenProjects']>[number]>
export type SearchedToken = NonNullable<NonNullable<SearchedTokenProject['tokens']>[number]>

const tokenSearchQuery = graphql`
  query TokenSearchQuery($searchQuery: String!, $skip: Boolean!) {
    searchTokenProjects(searchQuery: $searchQuery) @skip(if: $skip) {
      tokens {
        name @required(action: LOG)
        chain @required(action: LOG)
        address
        symbol
        decimals @required(action: LOG)
        market {
          pricePercentChange1D: pricePercentChange(duration: DAY) {
            value
          }
          price {
            value
          }
        }
        project {
          logoUrl
        }
      }
    }
  }
`

export function useTokenSearch(searchQuery: string) {
  const environment = useRelayEnvironment()
  const chain = chainIdToBackendName(useWeb3React().chainId)
  const queryRef = loadQuery<TokenSearchQuery>(environment, tokenSearchQuery, {
    searchQuery,
    skip: searchQuery.length === 0,
  })
  const response = usePreloadedQuery(tokenSearchQuery, queryRef).searchTokenProjects
  const tokens = useMemo(() => {
    if (!response) return []
    const tokenProjectResults = Array.from(response).filter((p): p is SearchedTokenProject => !!p)
    return tokenProjectResults
      .map((p) => p.tokens.find((t) => t?.chain === chain) ?? p.tokens[0])
      .filter((t): t is SearchedToken => !!t)
  }, [chain, response])
  return tokens
}
