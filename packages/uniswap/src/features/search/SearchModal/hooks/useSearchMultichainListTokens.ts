import { useQuery } from '@tanstack/react-query'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { dataApiServiceClient } from 'uniswap/src/data/apiClients/dataApiService/listTokens'
import { dataApiMultichainTokenToSearchResult } from 'uniswap/src/data/rest/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Fetches tokens from the ListTokens API with multichain grouping.
 * Returns MultichainSearchResult[] for use in the search modal's no-query state.
 */
export function useSearchMultichainListTokens({
  pageSize,
  skip,
}: {
  pageSize: number
  skip: boolean
}): GqlResult<MultichainSearchResult[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      ReactQueryCacheKey.DataApiService,
      'listTokens',
      { chainIds: enabledChainIds, pageSize, multichain: true, orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
    ] as const,
    queryFn: () =>
      dataApiServiceClient.listTokens({
        chainIds: enabledChainIds,
        pageSize,
        multichain: true,
        // TODO(CONS-1396): update to TRENDING order when available
        orderBy: TokensOrderBy.VOLUME_1D,
        ascending: false,
      }),
    enabled: !skip,
  })

  const results = useMemo(() => {
    const multichainTokens = data?.multichainTokens
    if (!multichainTokens) {
      return undefined
    }
    return multichainTokens
      .map(dataApiMultichainTokenToSearchResult)
      .filter((r): r is MultichainSearchResult => r !== undefined)
  }, [data])

  return useMemo(
    () => ({ data: results, loading: isLoading, error: error ?? undefined, refetch }),
    [results, isLoading, error, refetch],
  )
}
