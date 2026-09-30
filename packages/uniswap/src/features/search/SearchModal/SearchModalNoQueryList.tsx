import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { GeneratedIcon } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { useSectionsForNoQuerySearch } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForNoQuerySearch'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { SearchModalListSkeleton } from 'uniswap/src/features/search/SearchModal/SearchModalListSkeleton'
import { useRwaIssuerCurrencyInfos } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { useMultichainSearchModalMetricsAnalytics } from 'uniswap/src/features/search/SearchModal/useMultichainSearchModalMetricsAnalytics'
import { withSectionGaps } from 'uniswap/src/features/search/SearchModal/viewAll/withSectionGaps'
import { withViewAllFooters } from 'uniswap/src/features/search/SearchModal/viewAll/withViewAllFooters'

function EmptyPretypeSection({ title, icon: Icon }: { title: string; icon: GeneratedIcon }): JSX.Element {
  return (
    <Flex centered gap="$spacing16" mt="$spacing60">
      <Icon size="$icon.36" color="$neutral3" />
      <Text variant="body2" color="$neutral2">
        {title}
      </Text>
    </Flex>
  )
}

interface SearchModalNoQueryListProps {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  auctionSearchEnabled?: boolean
  onSelect?: SearchModalListProps['onSelect']
  /** Search V2: shows "View all" under the All tab's trimmed sections; called with the section's tab. */
  onViewAll?: (tab: SearchTab) => void
  renderedInModal: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  rowWrapper?: SearchModalListProps['rowWrapper']
}

export const SearchModalNoQueryList = memo(function SearchModalNoQueryListInner({
  chainFilter,
  activeTab,
  auctionSearchEnabled = false,
  onSelect,
  onViewAll,
  renderedInModal,
  contentContainerStyle,
  rowWrapper,
}: SearchModalNoQueryListProps): JSX.Element {
  const { t } = useTranslation()

  const isSearchV2UIEnabled = useFeatureFlag(FeatureFlags.SearchV2UI)
  const isTokenCategoriesEnabled = useIsTokenCategoriesEnabled()

  const {
    data: sections,
    isLoading,
    error,
    refetch,
    skeletonPillCount,
  } = useSectionsForNoQuerySearch({
    chainFilter,
    activeTab,
    auctionSearchEnabled,
  })

  // Primary-chain CurrencyInfos for the no-query Stocks-shelf RwaCollection rows' context menu.
  const rwaIssuerCurrencyInfos = useRwaIssuerCurrencyInfos({ sections })

  useMultichainSearchModalMetricsAnalytics({
    sections,
    isSearchResultsLoading: isLoading,
    isSearchQueryPending: false,
  })

  const displayedSections = useMemo(() => {
    if (activeTab !== SearchTab.All) {
      return sections
    }
    const withFooters =
      isTokenCategoriesEnabled && onViewAll
        ? withViewAllFooters({ sections, truncatedSectionKeys: 'all', onViewAll })
        : sections
    return isSearchV2UIEnabled ? withSectionGaps(withFooters) : withFooters
  }, [isSearchV2UIEnabled, isTokenCategoriesEnabled, onViewAll, activeTab, sections])

  // Element and object props are memoized so SearchModalList's memo isn't busted every render.
  const loadingElement = useMemo(
    () => (isSearchV2UIEnabled ? <SearchModalListSkeleton pillCount={skeletonPillCount} /> : undefined),
    [isSearchV2UIEnabled, skeletonPillCount],
  )

  const searchFilters = useMemo(
    (): SearchModalListProps['searchFilters'] => ({
      searchChainFilter: chainFilter,
      searchTabFilter: activeTab,
    }),
    [chainFilter, activeTab],
  )

  // Handle empty pretype cases for assets without default results
  const emptyElement = useMemo(
    () =>
      activeTab === SearchTab.Wallets ? (
        <EmptyPretypeSection title={t('search.results.pretype.wallets')} icon={Person} />
      ) : undefined,
    [activeTab, t],
  )

  return (
    <SearchModalList
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={isLoading}
      loadingElement={loadingElement}
      refetch={refetch}
      sections={displayedSections}
      searchFilters={searchFilters}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
      emptyElement={emptyElement}
      rowWrapper={rowWrapper}
      rwaIssuerCurrencyInfos={rwaIssuerCurrencyInfos}
      onSelect={onSelect}
    />
  )
})
