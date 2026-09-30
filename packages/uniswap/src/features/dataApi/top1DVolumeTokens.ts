import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import { getListTokensQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { dataApiMultichainTokenToSearchResult } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CurrencyInfo, MultichainSearchResult, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

type ChainScope = {
  chainFilter: Maybe<UniverseChainId>
  chainIds?: UniverseChainId[]
}

function selectTop1DVolumeTokenResults(data: PlainMessage<ListTokensResponse> | undefined): MultichainSearchResult[] {
  return (data?.multichainTokens ?? [])
    .map((token) => dataApiMultichainTokenToSearchResult(token))
    .filter((result): result is MultichainSearchResult => result !== undefined)
}

/**
 * One page of top tokens by 1D volume — the Explore tokens table's default request — on
 * `chainFilter`, else `chainIds`, else every enabled chain. The single source for every "trending
 * tokens" surface: the search modal's no-query shelf and both token selectors read from it and only
 * differ in how they turn the results into rows (see {@link top1DVolumeResultsToTokenOptions}).
 *
 * Background refetches count as loading so a retry button shows a spinner after an error: once a
 * query has errored it is no longer pending, so `isLoading` alone stays false for the retry.
 */
export function useTop1DVolumeTokens({
  chainFilter,
  chainIds,
  pageSize = 100,
  skip = false,
}: ChainScope & { pageSize?: number; skip?: boolean }): DerivedQueryResult<MultichainSearchResult[]> {
  const { chains: enabledChainIds } = useEnabledChains()
  const queryChainIds = useMemo(
    () => (chainFilter ? [chainFilter] : (chainIds ?? enabledChainIds)),
    [chainFilter, chainIds, enabledChainIds],
  )

  const { data, error, isLoading, isFetching, refetch } = useQuery(
    getListTokensQueryOptions({
      params: {
        chainIds: queryChainIds,
        page: { pageSize },
        // TODO(CONS-1396): update to TRENDING order when available
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        // Required by BE — UNSPECIFIED is rejected, mirrors apps/web's getListTokens.ts.
        sparklineDuration: HistoryDuration.DAY,
      },
      enabled: !skip,
      select: selectTop1DVolumeTokenResults,
    }),
  )

  return { data, error, isLoading: isLoading || isFetching, refetch }
}

function pickDeployment(
  result: MultichainSearchResult,
  { chainFilter, chainIds }: ChainScope,
): CurrencyInfo | undefined {
  if (chainFilter) {
    return result.tokens.find((t) => t.currency.chainId === chainFilter)
  }
  const chainIdSet = chainIds ? new Set<UniverseChainId>(chainIds) : undefined
  const eligible = chainIdSet ? result.tokens.filter((t) => chainIdSet.has(t.currency.chainId)) : result.tokens
  // Strict comparison keeps the first eligible deployment on ties (including when no stats are served).
  let primary: CurrencyInfo | undefined
  for (const token of eligible) {
    if (!primary || (token.searchStats?.volume1dUsd ?? 0) > (primary.searchStats?.volume1dUsd ?? 0)) {
      primary = token
    }
  }
  return primary
}

export function top1DVolumeResultsToTokenOptions(
  results: MultichainSearchResult[],
  { portfolioBalancesById, ...scope }: ChainScope & { portfolioBalancesById?: Record<string, PortfolioBalance> },
): TokenOption[] {
  return results.flatMap((result) => {
    const currencyInfo = pickDeployment(result, scope)
    if (!currencyInfo) {
      return []
    }
    const marketData = {
      priceUsd: currencyInfo.searchStats?.priceUsd,
      pricePercentChange24h: currencyInfo.searchStats?.pricePercentChange1d,
      networkCount: result.tokens.length > 1 ? result.tokens.length : undefined,
    }
    const portfolioBalance = portfolioBalancesById?.[normalizeCurrencyIdForMapLookup(currencyInfo.currencyId)]
    return portfolioBalance
      ? { type: OnchainItemListOptionType.Token, ...portfolioBalance, ...marketData }
      : { type: OnchainItemListOptionType.Token, currencyInfo, quantity: null, balanceUSD: null, ...marketData }
  })
}
