import { ALL_NETWORKS_ARG, CustomRankingType, GqlResult } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import {
  tokenRankingsStatToCurrencyInfo,
  tokenRankingsStatToMarketData,
  useTokenRankingsQuery,
} from 'uniswap/src/data/apiClients/dataApiService/exploreV1/tokenRankings'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

/**
 * V2 counterpart of `useTrendingTokensOptions`: same rankings query and portfolio-balance merge,
 * but keeps the market fields (price, 24h change, network count) the legacy mapper drops so
 * TokenSelectorV2 rows can render them. Zero extra network calls.
 */
export function useTrendingTokensOptionsV2({
  chainFilter,
  chainIds,
  portfolioData,
}: {
  chainFilter: Maybe<UniverseChainId>
  chainIds?: UniverseChainId[]
  portfolioData: PortfolioBalancesResult
}): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPortfolioBalancesById,
  } = portfolioData

  const {
    data,
    isLoading,
    isFetching,
    error: tokensError,
    refetch: refetchTokens,
  } = useTokenRankingsQuery({
    chainId: chainFilter?.toString() ?? ALL_NETWORKS_ARG,
  })

  const trendingStats = data?.tokenRankings[CustomRankingType.Trending]?.tokens
  const chainIdSet = useMemo(() => (chainIds ? new Set(chainIds) : undefined), [chainIds])

  const tokenOptions = useMemo(() => {
    if (!trendingStats) {
      return undefined
    }

    return trendingStats
      .map((stat): TokenOption | null => {
        const currencyInfo = tokenRankingsStatToCurrencyInfo(stat)
        if (!currencyInfo) {
          return null
        }

        const marketData = tokenRankingsStatToMarketData(stat)
        const portfolioBalance = portfolioBalancesById?.[normalizeCurrencyIdForMapLookup(currencyInfo.currencyId)]

        return portfolioBalance
          ? { type: OnchainItemListOptionType.Token, ...portfolioBalance, ...marketData }
          : {
              type: OnchainItemListOptionType.Token,
              currencyInfo,
              quantity: null,
              balanceUSD: null,
              ...marketData,
            }
      })
      .filter((option): option is TokenOption => Boolean(option))
      .filter((option) => (chainFilter ? true : (chainIdSet?.has(option.currencyInfo.currency.chainId) ?? true)))
  }, [trendingStats, portfolioBalancesById, chainFilter, chainIdSet])

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    // oxlint-disable-next-line no-void
    void refetchTokens()
  }, [portfolioBalancesByIdRefetch, refetchTokens])

  const error =
    (!portfolioBalancesById ? portfolioBalancesByIdError : undefined) ||
    (!tokenOptions ? (tokensError ?? undefined) : undefined)

  return {
    data: tokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPortfolioBalancesById || isLoading || isFetching,
  }
}
