import { Code, ConnectError } from '@connectrpc/connect'
import { skipToken, useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { GetTokenGroupResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import type { RelatedTokensSubject } from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/relatedTokenMappers'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/** The TDP's own token, used as the GetTokenGroup `member` selector. */
export type TokenGroupMember = RelatedTokensSubject

/** NOT_FOUND is the backend's "ungrouped token" answer, so it resolves to `null` instead of an error. */
async function fetchTokenGroupByMember({
  member,
  chainIds,
}: {
  member: TokenGroupMember
  chainIds: number[]
}): Promise<GetTokenGroupResponse | null> {
  try {
    return await dataApiServiceClientV2.getTokenGroup({
      selector: { case: 'member', value: { chainId: member.chainId, address: member.address } },
      chainIds,
    })
  } catch (error) {
    if (error instanceof ConnectError && error.code === Code.NotFound) {
      return null
    }
    throw error
  }
}

/**
 * The group a TDP token belongs to plus every member, the subject included. No sparklines: the TDP
 * only renders card stats.
 */
export function useGetTokenGroupQuery({
  member,
  enabled = true,
}: {
  member: TokenGroupMember | undefined
  enabled?: boolean
}): UseQueryResult<GetTokenGroupResponse | null> {
  const { chains: chainIds } = useEnabledChains()

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getTokenGroup', member?.chainId, member?.address, chainIds],
    queryFn: member ? () => fetchTokenGroupByMember({ member, chainIds }) : skipToken,
    enabled: enabled && chainIds.length > 0,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}
