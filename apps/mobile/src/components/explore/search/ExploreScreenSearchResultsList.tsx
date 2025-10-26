import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { spacing } from 'ui/src/theme'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { MOBILE_SEARCH_TABS, SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useDebounce } from 'utilities/src/time/timing'

const MobileSearchTab = ({
  tab,
  setActiveTab,
  activeTab,
  getTabLabel,
}: {
  tab: SearchTab
  setActiveTab: (tab: SearchTab) => void
  activeTab: SearchTab
  getTabLabel: (tab: SearchTab) => string
}): JSX.Element => {
  const handleOnPress = useCallback(() => {
    setActiveTab(tab)
  }, [setActiveTab, tab])

  return (
    <Trace key={tab} logPress element={ElementName.SearchTab} properties={{ search_tab: tab }}>
      <TouchableArea onPress={handleOnPress}>
        <Text color={activeTab === tab ? '$neutral1' : '$neutral2'} variant="buttonLabel2" testID={tab}>
          {getTabLabel(tab)}
        </Text>
      </TouchableArea>
    </Trace>
  )
}

export const ExploreScreenSearchResultsList = memo(function _ExploreScreenSearchResultsList({
  searchQuery,
  parsedSearchQuery,
  chainFilter,
  parsedChainFilter,
}: {
  searchQuery: string
  parsedSearchQuery: string | null
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
}): JSX.Element {
  const debouncedSearchQuery = useDebounce(searchQuery)
  const debouncedParsedSearchQuery = useDebounce(parsedSearchQuery)
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.All)
  const insets = useAppInsets()
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  const getTabLabel = useCallback(
    // So that the linter errors if someone adds a new tab without updating the switch statement
    // eslint-disable-next-line consistent-return
    (tab: SearchTab): string => {
      switch (tab) {
        case SearchTab.All:
          return t('common.all')
        case SearchTab.Tokens:
          return t('common.tokens')
        case SearchTab.Pools:
          return t('common.pools')
        case SearchTab.Wallets:
          return t('explore.search.section.wallets')
        case SearchTab.NFTCollections:
          return t('common.nfts')
      }
    },
    [t],
  )

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: (isBottomTabsEnabled ? ESTIMATED_BOTTOM_TABS_HEIGHT + spacing.spacing32 : 0) + insets.bottom,
    }),
    [insets.bottom, isBottomTabsEnabled],
  )

  return (
    <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
      <Trace section={SectionName.ExploreSearch}>
        <Flex row px="$spacing20" pt="$spacing16" pb="$spacing8" gap="$spacing16">
          {MOBILE_SEARCH_TABS.map((tab) => (
            <MobileSearchTab
              key={tab}
              tab={tab}
              setActiveTab={setActiveTab}
              activeTab={activeTab}
              getTabLabel={getTabLabel}
            />
          ))}
        </Flex>
        {searchQuery && searchQuery.length > 0 ? (
          <SearchModalResultsList
            chainFilter={chainFilter}
            parsedChainFilter={parsedChainFilter}
            debouncedParsedSearchFilter={debouncedParsedSearchQuery}
            debouncedSearchFilter={debouncedSearchQuery}
            searchFilter={searchQuery}
            activeTab={activeTab}
            renderedInModal={!isBottomTabsEnabled}
            contentContainerStyle={contentContainerStyle}
          />
        ) : (
          <SearchModalNoQueryList
            chainFilter={chainFilter}
            activeTab={activeTab}
            renderedInModal={!isBottomTabsEnabled}
            contentContainerStyle={contentContainerStyle}
          />
        )}
      </Trace>
    </KeyboardAvoidingView>
  )
})
