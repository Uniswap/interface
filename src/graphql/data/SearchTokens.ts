import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { Chain, SearchTokensQuery, useSearchTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName } from './util'

gql`
  query SearchTokens($searchQuery: String!) {
    searchTokens(searchQuery: $searchQuery) {
      id
      decimals
      name
      chain
      standard
      address
      symbol
      market(currency: USD) {
        id
        price {
          id
          value
          currency
        }
        pricePercentChange(duration: DAY) {
          id
          value
        }
        volume24H: volume(duration: DAY) {
          id
          value
          currency
        }
      }
      project {
        id
        logoUrl
        safetyLevel
      }
    }
  }
`

export type SearchToken = NonNullable<NonNullable<SearchTokensQuery['searchTokens']>[number]>

function isMoreRevelantToken(current: SearchToken, existing: SearchToken | undefined, searchChain: Chain) {
  if (!existing) return true

  // Always priotize natives, and if both tokens are native, prefer native on current chain (i.e. Matic on Polygon over Matic on Mainnet )
  if (current.standard === 'NATIVE' && (existing.standard !== 'NATIVE' || current.chain === searchChain)) return true

  // Prefer tokens on the searched chain, otherwise prefer mainnet tokens
  return current.chain === searchChain || (existing.chain !== searchChain && current.chain === Chain.Ethereum)
}

// Places natives first, wrapped native on current chain next, then sorts by volume
function searchTokenSortFunction(
  searchChain: Chain,
  wrappedNativeAddress: string | undefined,
  a: SearchToken,
  b: SearchToken
) {
  if (a.standard === 'NATIVE') {
    if (b.standard === 'NATIVE') {
      if (a.chain === searchChain) return -1
      else if (b.chain === searchChain) return 1
      else return 0
    } else return -1
  } else if (b.standard === 'NATIVE') return 1
  else if (wrappedNativeAddress && a.address === wrappedNativeAddress) return -1
  else if (wrappedNativeAddress && b.address === wrappedNativeAddress) return 1
  else return (b.market?.volume24H?.value ?? 0) - (a.market?.volume24H?.value ?? 0)
}

export function useSearchTokens(searchQuery: string, chainId: number) {
  const { data, loading, error } = useSearchTokensQuery({
    variables: {
      searchQuery,
    },
    skip: !searchQuery,
  })

  const sortedTokens = useMemo(() => {
    const searchChain = chainIdToBackendName(chainId)
    // Stores results, allowing overwriting cross-chain tokens w/ more 'relevant token'
    const selectionMap: { [projectId: string]: SearchToken } = {}
    data?.searchTokens?.forEach((token) => {
      if (token.project?.id) {
        const existing = selectionMap[token.project.id]
        if (isMoreRevelantToken(token, existing, searchChain)) selectionMap[token.project.id] = token
      }
    })
    return Object.values(selectionMap).sort(
      searchTokenSortFunction.bind(null, searchChain, WRAPPED_NATIVE_CURRENCY[chainId]?.address)
    )
  }, [data, chainId])

  return {
    data: sortedTokens,
    loading,
    error,
  }
}
