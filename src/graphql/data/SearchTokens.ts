import gql from 'graphql-tag'

import { SearchTokensQuery, useSearchTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName } from './util'

gql`
  query SearchTokens($searchQuery: String!) {
    searchTokens(searchQuery: $searchQuery) {
      decimals
      name
      chain
      standard
      address
      symbol
      market(currency: USD) {
        price {
          value
          currency
        }
        pricePercentChange(duration: DAY) {
          value
        }
        volume24H: volume(duration: DAY) {
          value
          currency
        }
      }
      project {
        id
        logoUrl
      }
    }
  }
`

type SearchToken = NonNullable<NonNullable<SearchTokensQuery['searchTokens']>[number]>

// function searchTokenSortFunction(a: SearchToken, b: SearchToken) {
//   if (a.standard === 'NATIVE') return -1
//   else if (b.standard === 'NATIVE') return 1
//   else return (a.market?.volume24H?.value ?? 0) - (b.market?.volume24H?.value ?? 0)
// }

// eslint-disable-next-line import/no-unused-modules
export function useSearchTokens(searchQuery: string, chainId: number) {
  const searchChain = chainIdToBackendName(chainId)

  const { data, loading, error } = useSearchTokensQuery({
    variables: {
      searchQuery,
    },
  })

  const selectionMap: { [projectId: string]: SearchToken } = {}
  data?.searchTokens?.forEach((token) => {
    if (token.project?.id) {
      const existing = selectionMap[token.project.id]
      if (
        !existing ||
        (token.standard === 'NATIVE' && (existing.standard !== 'NATIVE' || token.chain === searchChain)) ||
        (existing.standard !== 'NATIVE' && existing.chain !== searchChain && token.chain === searchChain)
      ) {
        selectionMap[token.project.id] = token
      }
    }
  })

  return { data: Object.values(selectionMap), loading, error }
}
