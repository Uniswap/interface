import {
  TokenRankingsResponse,
  TokenRankingsStat,
  TokenStats,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { useMemo } from 'react'
import {
  ExploreTokenItemsResult,
  TokenItemDataWithMetadata,
  getTokenMetadataDisplayTypeSafe,
  noopFetchNextPage,
} from 'src/components/explore/ExploreSections/useExploreTokenItems/shared'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { useTokenRankingsQuery } from 'uniswap/src/data/apiClients/dataApiService/exploreV1/tokenRankings'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

function tokenRankingStatsToTokenItemData(tokenRankingStat: TokenRankingsStat): TokenItemData | null {
  const formattedChain = fromGraphQLChain(tokenRankingStat.chain)

  if (!formattedChain) {
    return null
  }

  return {
    name: tokenRankingStat.name ?? '',
    logoUrl: tokenRankingStat.logo ?? '',
    chainId: formattedChain,
    address: tokenRankingStat.address,
    symbol: tokenRankingStat.symbol ?? '',
    price: tokenRankingStat.price?.value,
    marketCap: tokenRankingStat.fullyDilutedValuation?.value,
    pricePercentChange24h: tokenRankingStat.pricePercentChange1Day?.value,
    volume24h: tokenRankingStat.volume1Day?.value,
    totalValueLocked: tokenRankingStat.totalValueLocked?.value,
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- chainTokens can be undefined at runtime despite protobuf typing
    networkCount: tokenRankingStat.chainTokens?.length || undefined,
  }
}

function processTokens(
  tokens: TokenStats[],
  tokenMetadataDisplayType: TokenMetadataDisplayType,
): TokenItemDataWithMetadata[] {
  const validTokens = tokens.filter(Boolean)
  const processedTokens: TokenItemDataWithMetadata[] = []

  for (const token of validTokens) {
    const tokenItemData = tokenRankingStatsToTokenItemData(token)
    if (tokenItemData) {
      processedTokens.push({ tokenItemData, tokenMetadataDisplayType })
    }
  }

  return processedTokens
}

function processTokenRankings(
  tokenRankings: TokenRankingsResponse['tokenRankings'] | undefined,
): Partial<Record<ExploreOrderBy, TokenItemDataWithMetadata[]>> {
  if (!tokenRankings) {
    return {} as const
  }

  const result: Record<string, TokenItemDataWithMetadata[]> = {}

  for (const [orderByKey, rankings] of Object.entries(tokenRankings)) {
    const tokenMetadataDisplayType = getTokenMetadataDisplayTypeSafe(orderByKey as ExploreOrderBy)
    if (tokenMetadataDisplayType === null) {
      continue
    }

    const processedTokens = processTokens(rankings.tokens, tokenMetadataDisplayType)

    if (processedTokens.length > 0) {
      result[orderByKey] = processedTokens
    }
  }

  return result
}

function useTokenItems(data: TokenRankingsResponse | undefined, orderBy: ExploreOrderBy): TokenItemDataWithMetadata[] {
  // process all the token rankings into a map of orderBy to token items (only do this once)
  const allTokenItemsByOrderBy = useMemo(() => processTokenRankings(data?.tokenRankings), [data])
  // return the token items for the given orderBy, or empty array if the orderBy key doesn't exist
  return useMemo(() => allTokenItemsByOrderBy[orderBy] ?? [], [allTokenItemsByOrderBy, orderBy])
}

/** TokenRankings (v1) — every sort order comes back pre-ranked in one response, no pagination. */
export function useV1ExploreTokenItems({
  selectedNetwork,
  isMultichainPath,
  orderBy,
  skip,
}: {
  selectedNetwork: UniverseChainId | null
  isMultichainPath: boolean
  orderBy: ExploreOrderBy
  skip: boolean
}): ExploreTokenItemsResult {
  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery(
    {
      chainId: selectedNetwork?.toString() ?? ALL_NETWORKS_ARG,
      ...(isMultichainPath && { multichain: true }),
    },
    !skip,
  )
  const topTokenItems = useTokenItems(data, orderBy)

  return {
    topTokenItems,
    hasData: data !== undefined,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage: noopFetchNextPage,
    hasNextPage: false,
  }
}
