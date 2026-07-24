import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { listRwaTokens } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import type { ListRwaTokensResponse, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Queries ListRwaTokens for flat issuer-token rows (e.g. commodities from CG market data).
 * Unlike ListRankedRwas, each response token is already one issuer-token entry.
 */
export function useListRwaTokensQuery({
  category,
  chainIds,
  includeSparkline1d,
  enabled = true,
}: {
  category: RwaCategory
  chainIds: number[]
  includeSparkline1d: boolean
  enabled?: boolean
}): UseQueryResult<ListRwaTokensResponse, ConnectError> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  return useQuery(
    listRwaTokens,
    { category, chainIds: resolvedChainIds, includeSparkline1d, useSubstreamData: isV2TokensEnabled },
    {
      transport: entryGatewayProdPostTransport,
      enabled: enabled && resolvedChainIds.length > 0,
      staleTime: 5 * ONE_MINUTE_MS,
      gcTime: 30 * ONE_MINUTE_MS,
    },
  )
}
