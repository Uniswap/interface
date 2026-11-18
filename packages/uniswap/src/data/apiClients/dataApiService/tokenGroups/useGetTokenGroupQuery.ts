import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { GetTokenGroupResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { getGetTokenGroupQueryOptions } from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import type { RelatedTokensSubject } from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/relatedTokenMappers'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

/** The TDP's own token, used as the GetTokenGroup `member` selector. */
export type TokenGroupMember = RelatedTokensSubject

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

  return useQuery(getGetTokenGroupQueryOptions(dataApiServiceClientV2, { member, chainIds, enabled }))
}
