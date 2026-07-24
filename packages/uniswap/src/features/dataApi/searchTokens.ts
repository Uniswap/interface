import { SearchTokensResponse } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import { SearchType } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { GqlResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { toMultichainSearchResult } from 'uniswap/src/data/rest/toMultichainSearchResult'
import { transformSearchToMultichain } from 'uniswap/src/data/rest/transformSearchToMultichain'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useEvent } from 'utilities/src/react/hooks'

function useSearchTokensQuery<T>({
  searchQuery,
  chainFilter,
  chainIds,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
  multichain = false,
  select,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  chainIds?: UniverseChainId[]
  skip: boolean
  size?: number
  multichain?: boolean
  select: (data: SearchTokensResponse) => T
}): GqlResult<T> {
  const { chains: enabledChainIds } = useEnabledChains()

  const isSvmConnected = useConnectionStatus(Platform.SVM).isConnected
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : (chainIds ?? enabledChainIds),
      searchType: SearchType.TOKEN,
      page: 1,
      size,
      prioritizeSvm: isSvmConnected,
      multichain,
      useSubstreamData: isV2TokensEnabled,
    }),
    [searchQuery, chainFilter, chainIds, size, enabledChainIds, isSvmConnected, multichain, isV2TokensEnabled],
  )

  const { data, error, isPending, refetch } = useSearchTokensAndPoolsQuery<T>({
    input: variables,
    enabled: !skip,
    select,
  })

  return useMemo(
    () => ({ data, loading: isPending, error: error ?? undefined, refetch }),
    [data, isPending, error, refetch],
  )
}

export function useMultichainSearchTokens({
  searchQuery,
  chainFilter,
  chainIds,
  skip,
  size,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  chainIds?: UniverseChainId[]
  skip: boolean
  size?: number
}): GqlResult<MultichainSearchResult[]> {
  const select = useEvent((data: SearchTokensResponse): MultichainSearchResult[] => {
    const results = transformSearchToMultichain(data)
      .multichainTokens.map(toMultichainSearchResult)
      .filter((r): r is MultichainSearchResult => r !== undefined)

    return filterMultichainResultsToChain(results, chainFilter)
  })

  return useSearchTokensQuery({ searchQuery, chainFilter, chainIds, skip, size, multichain: true, select })
}

export function filterMultichainResultsToChain(
  results: MultichainSearchResult[],
  chainFilter: UniverseChainId | null,
): MultichainSearchResult[] {
  if (!chainFilter) {
    return results
  }

  return results
    .map((result) => ({
      ...result,
      tokens: result.tokens.filter((token) => token.currency.chainId === chainFilter),
    }))
    .filter((result) => result.tokens.length > 0)
}
