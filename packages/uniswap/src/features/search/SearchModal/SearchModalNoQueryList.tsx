import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useNftSearchResultsToNftCollectionOptions } from 'uniswap/src/components/lists/items/nfts/useNftSearchResultsToNftCollectionOptions'
import { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useSearchPopularNftCollectionsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentlySearchedOptions } from 'uniswap/src/features/search/SearchModal/hooks/useRecentlySearchedOptions'
import { getMockTrendingPoolsSection } from 'uniswap/src/features/search/SearchModal/mocks'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { isMobileApp } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'

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
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  const dispatch = useDispatch()

  const recentlySearchedOptions: SearchModalOption[] = useRecentlySearchedOptions({
    chainFilter,
    activeTab,
    numberOfRecentSearchResults: NUMBER_OF_RESULTS_SHORT,
  })
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])
  const recentSearchSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedOptions,
    endElement: <ClearButton onPress={onPressClearSearchHistory} />,
  })

  const numberOfTrendingTokens =
    activeTab === SearchTab.All
      ? isMobileApp
        ? NUMBER_OF_RESULTS_MEDIUM
        : NUMBER_OF_RESULTS_SHORT
      : NUMBER_OF_RESULTS_LONG
  const skipTrendingTokensQuery = activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All
  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    loading: loadingTokens,
  } = useTrendingTokensCurrencyInfos(chainFilter, skipTrendingTokensQuery)
  const trendingTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions?.slice(0, numberOfTrendingTokens),
  })

  // Load popular NFTs by top trading volume
  const skipPopularNftsQuery = isWeb || (activeTab !== SearchTab.NFTCollections && activeTab !== SearchTab.All)
  const {
    data: popularNfts,
    loading: loadingPopularNfts,
    error: popularNftsError,
  } = useSearchPopularNftCollectionsQuery({ skip: skipPopularNftsQuery })
  const popularNftOptions = useNftSearchResultsToNftCollectionOptions(popularNfts, chainFilter)
  const popularNftSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.PopularNFTCollections,
    options: popularNftOptions,
  })

  const favoriteWalletsOptions = useFavoriteWalletOptions({ skip: activeTab !== SearchTab.Wallets })
  const favoriteWalletsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.FavoriteWallets,
    options: favoriteWalletsOptions,
  })

  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    let sections: OnchainItemSection<SearchModalOption>[] = []

    switch (activeTab) {
      case SearchTab.Tokens:
        sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? [])]
        return {
          data: sections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
      case SearchTab.Pools:
        sections = [...(recentSearchSection ?? []), ...getMockTrendingPoolsSection(15)]
        return {
          data: sections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
      case SearchTab.Wallets:
        return {
          data: [...(recentSearchSection ?? []), ...(favoriteWalletsSection ?? [])],
          loading: false,
          error: undefined,
          refetch: noop,
        }
      case SearchTab.NFTCollections:
        return {
          data: [...(recentSearchSection ?? []), ...(popularNftSection ?? [])], // add recent nft searches
          loading: loadingPopularNfts,
          error: popularNftsError,
          refetch: noop,
        }
      default:
      case SearchTab.All:
        if (isWeb) {
          sections = [
            ...(recentSearchSection ?? []),
            ...(trendingTokenSection ?? []),
            ...getMockTrendingPoolsSection(3),
          ]
        }
        sections = [...(recentSearchSection ?? []), ...(trendingTokenSection ?? []), ...(popularNftSection ?? [])]
        return {
          data: sections,
          loading: loadingTokens,
          error: tokensError,
          refetch: refetchTokens,
        }
    }
  }, [
    activeTab,
    favoriteWalletsSection,
    loadingPopularNfts,
    loadingTokens,
    popularNftSection,
    popularNftsError,
    recentSearchSection,
    refetchTokens,
    tokensError,
    trendingTokenSection,
  ])
}

interface SearchModalNoQueryListProps {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  onSelect?: SearchModalListProps['onSelect']
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
      searchFilters={{
        searchChainFilter: chainFilter,
        searchTabFilter: activeTab,
      }}
      onSelect={onSelect}
    />
  )
})
