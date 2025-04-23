import { useCallback, useMemo } from 'react'
import {
  SearchTokensQuery,
  useSearchTokensQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { isAddress } from 'utilities/src/addresses'

type SearchToken = NonNullable<NonNullable<SearchTokensQuery['searchTokens']>[number]>

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: UniverseChainId | null,
  skip: boolean,
): GqlResult<CurrencyInfo[]> {
  const gqlChainFilter = chainFilter ? toGraphQLChain(chainFilter) : null
  const { gqlChains } = useEnabledChains()

  const isSearchQueryAnAddress = isAddress(searchQuery)

  // Search across all networks when searching by address or there is no chainFilter, otherwise respect the chainFilter
  const shouldSearchAllNetworks = !gqlChainFilter || isSearchQueryAnAddress

  const { data, loading, error, refetch } = useSearchTokensQuery({
    variables: {
      searchQuery: searchQuery ?? '',
      chains: shouldSearchAllNetworks ? gqlChains : [gqlChainFilter],
      tokenSearchV2Enabled: true,
    },
    skip: skip || !searchQuery,
  })

  const persistedError = usePersistedError(loading, error)
  const formattedData = useMemo(() => {
    if (!data || !data.searchTokens) {
      return undefined
    }

    const processTokens = (tokens: SearchToken[], isOtherNetwork: boolean): CurrencyInfo[] => {
      return tokens
        .map((token) => {
          if (!token) {
            return null
          }
          const currencyInfo = gqlTokenToCurrencyInfo(token)
          return currencyInfo ? { ...currencyInfo, isFromOtherNetwork: isOtherNetwork } : null
        })
        .filter((c) => Boolean(c)) as CurrencyInfo[]
    }

    // If no chain filter or not an address search, return all results normally
    if (!gqlChainFilter || !isSearchQueryAnAddress) {
      return processTokens(data.searchTokens as SearchToken[], false)
    }

    // Otherwise segment into selected network and other networks
    const selectedNetworkResults = processTokens(
      data.searchTokens.filter((token) => token && token.chain === gqlChainFilter) as SearchToken[],
      false,
    )

    const otherNetworksResults = processTokens(
      data.searchTokens.filter((token) => token && token.chain !== gqlChainFilter) as SearchToken[],
      true,
    )

    // 3. Combine both sets of results
    return [...selectedNetworkResults, ...otherNetworksResults]
  }, [data, isSearchQueryAnAddress, gqlChainFilter])

  const retry = useCallback(() => !skip && refetch({ searchQuery: searchQuery ?? '' }), [refetch, searchQuery, skip])

  return useMemo(
    () => ({
      data: formattedData,
      loading,
      error: persistedError,
      refetch: retry,
    }),
    [formattedData, loading, persistedError, retry],
  )
}
