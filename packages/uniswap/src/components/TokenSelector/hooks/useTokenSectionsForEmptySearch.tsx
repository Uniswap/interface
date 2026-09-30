import { useMemo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { MAX_DEFAULT_TRENDING_TOKEN_RESULTS_AMOUNT } from 'uniswap/src/components/TokenSelector/constants'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

export function useTokenSectionsForEmptySearch({
  addresses,
  chainFilter,
  chainIds,
}: Omit<TokenSectionsHookProps, 'oppositeSelectedToken' | 'variation'>): DerivedQueryResult<
  OnchainItemSection<TokenOption>[]
> {
  const portfolioData = usePortfolioBalancesForAddressById(addresses)
  const {
    data: trendingTokenOptions,
    isLoading,
    error,
    refetch,
  } = useTrendingTokensOptions({ chainFilter, chainIds, portfolioData })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter, { chainIds })

  const recentSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedTokenOptions,
    endElement: <ClearRecentSearchesButton />,
  })

  const trendingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions?.slice(0, MAX_DEFAULT_TRENDING_TOKEN_RESULTS_AMOUNT),
  })
  const sections = useMemo(
    () => [...(recentSection ?? []), ...(trendingSection ?? [])],
    [trendingSection, recentSection],
  )

  // Recent searches are local, so only the trending fetch can fail; its refetch drives the error pane's retry.
  return useMemo(
    () => ({
      data: sections,
      isLoading,
      error,
      refetch,
    }),
    [isLoading, sections, error, refetch],
  )
}
