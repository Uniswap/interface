import { useQuery } from '@tanstack/react-query'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GqlResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApi/DataApiClientV2'
import { dataApiMultichainTokenV2ToSearchResult } from 'uniswap/src/data/rest/dataApiMultichainTokenV2'
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
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      ReactQueryCacheKey.DataApiService,
      'listTokens',
      'v2',
      { chainIds: enabledChainIds, pageSize, orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
    ] as const,
    queryFn: () =>
      dataApiServiceClientV2.listTokens({
        chainIds: enabledChainIds,
        page: { pageSize },
        // TODO(CONS-1396): update to TRENDING order when available
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        // Required by BE — UNSPECIFIED is rejected, mirrors apps/web's listTokensService.ts.
        sparklineDuration: HistoryDuration.DAY,
      }),
    enabled: !skip && isV2TokensEnabled,
  })

  const results = useMemo(() => {
    const multichainTokens = data?.multichainTokens
    if (!multichainTokens) {
      return undefined
    }
    return multichainTokens
      .map(dataApiMultichainTokenV2ToSearchResult)
      .filter((r): r is MultichainSearchResult => r !== undefined)
  }, [data])

  return useMemo(
    () => ({ data: results, loading: isLoading, error: error ?? undefined, refetch }),
    [results, isLoading, error, refetch],
  )
}
