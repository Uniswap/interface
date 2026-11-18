import { useQuery } from '@tanstack/react-query'
import { getRelatedTokensQueryOptions } from '@universe/data-api'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import {
  type RelatedTokensSubject,
  toRelatedTokens,
} from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/relatedTokenMappers'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

/**
 * Tokens in `categoryId` for the TDP related-tokens section, excluding the page's own token.
 *
 * Backed by ListTokens with the `category_ids` filter (the GetRelatedTokens RPC was never built).
 * BE accepts the filter but doesn't apply it yet, so results mirror the unfiltered volume ranking
 * until serving lands; nothing here changes when it does. The subject drop and 16 cap are FE-side
 * by contract.
 */
export function useRelatedTokensQuery({
  categoryId,
  subject,
  enabled = true,
}: {
  categoryId: string | undefined
  subject: RelatedTokensSubject
  enabled?: boolean
}): { tokens: RankedTokenCardItem[]; isLoading: boolean; isError: boolean; refetch: () => void } {
  const { chains: chainIds } = useEnabledChains()

  const { data, isLoading, isError, refetch } = useQuery(
    getRelatedTokensQueryOptions(dataApiServiceClientV2, { categoryId, chainIds, enabled }),
  )

  const tokens = useMemo(
    () => toRelatedTokens({ tokens: data?.multichainTokens ?? [], subject }),
    [data?.multichainTokens, subject],
  )

  return { tokens, isLoading, isError, refetch }
}
