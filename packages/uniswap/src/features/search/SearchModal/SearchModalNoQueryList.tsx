import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/TokenSelector/types'
import { useOnchainItemListSection } from 'uniswap/src/components/TokenSelector/utils'
import { SearchModalItemTypes } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalList } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { NUMBER_OF_RESULTS_LONG, NUMBER_OF_RESULTS_SHORT } from 'uniswap/src/features/search/SearchModal/constants'
import {
  MOCK_POOL_OPTION_ITEM,
  MOCK_RECENT_POOLS_SECTION,
  getMockTrendingPoolsSection,
} from 'uniswap/src/features/search/SearchModal/mocks'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'

function ClearButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex height="100%" justifyContent="center" alignItems="center">
      <TouchableArea onPress={onPress}>
        <Text color="$neutral2" variant="buttonLabel3">
          {t('common.clear')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}

function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
}): GqlResult<OnchainItemSection<SearchModalItemTypes>[]> {
  const dispatch = useDispatch()

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter, NUMBER_OF_RESULTS_SHORT)
  // it's a dependency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])
  const recentTokensSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedTokenOptions,
    endElement: <ClearButton onPress={onPressClearSearchHistory} />,
  })

  const MOCK_RECENT_ALL_SECTION: OnchainItemSection<SearchModalItemTypes>[] = useMemo(
    () => [
      {
        sectionKey: OnchainItemSectionName.RecentSearches,
        data: [...(recentlySearchedTokenOptions?.slice(0, 1) ?? []), MOCK_POOL_OPTION_ITEM], // want 2 options
        endElement: <ClearButton onPress={onPressClearSearchHistory} />,
      },
    ],
    [onPressClearSearchHistory, recentlySearchedTokenOptions],
  )

  const numberOfTrendingTokens = activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG
  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    loading: loadingTokens,
  } = useTrendingTokensCurrencyInfos(chainFilter)
  const trendingTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions?.slice(0, numberOfTrendingTokens),
  })

  const sections: OnchainItemSection<SearchModalItemTypes>[] = useMemo(() => {
    if (isWeb) {
      switch (activeTab) {
        case SearchTab.Tokens:
          return [...(recentTokensSection ?? []), ...(trendingTokenSection ?? [])]
        case SearchTab.Pools:
          return [...MOCK_RECENT_POOLS_SECTION, ...getMockTrendingPoolsSection(15)]
        default:
        case SearchTab.All:
          return [
            ...(MOCK_RECENT_ALL_SECTION ?? []),
            ...(trendingTokenSection ?? []),
            ...getMockTrendingPoolsSection(3),
          ]
      }
    }

    switch (activeTab) {
      // eventually add NFTs, wallets, etc
      case SearchTab.Tokens:
      default:
      case SearchTab.All:
        return [...(recentTokensSection ?? []), ...(trendingTokenSection ?? [])]
    }
  }, [activeTab, recentTokensSection, trendingTokenSection, MOCK_RECENT_ALL_SECTION])

  return useMemo(
    () => ({
      data: sections,
      loading: loadingTokens,
      error: tokensError,
      refetch: refetchTokens,
    }),
    [loadingTokens, refetchTokens, sections, tokensError],
  )
}

interface SearchModalNoQueryListProps {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  onSelect: (item: SearchModalItemTypes) => void
}

export const SearchModalNoQueryList = memo(function _SearchModalNoQueryList({
  chainFilter,
  activeTab,
  onSelect,
}: SearchModalNoQueryListProps): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useSectionsForNoQuerySearch({ chainFilter, activeTab })

  return (
    <SearchModalList
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      onSelect={onSelect}
    />
  )
})
