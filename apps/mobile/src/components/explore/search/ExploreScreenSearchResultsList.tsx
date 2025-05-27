import { memo, useCallback, useState } from 'react'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { Flex, Text, TouchableArea, flexStyles } from 'ui/src'

import { useTranslation } from 'react-i18next'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { MOBILE_SEARCH_TABS, SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { useDebounce } from 'utilities/src/time/timing'

function LegacyExploreSearchResultsList({
  debouncedSearchQuery,
  chainFilter,
  textInputRef,
}: {
  debouncedSearchQuery: string
  chainFilter: UniverseChainId | null
  textInputRef: React.RefObject<TextInput>
}): JSX.Element {
  const onScroll = useCallback(() => {
    textInputRef.current?.blur()
  }, [textInputRef])

  return (
    <>
      <Flex p="$spacing4" />
      {debouncedSearchQuery.length === 0 ? (
        // Mimic ScrollView behavior with FlatList
        // Needs to be from gesture handler to work on android within BottomSheelModal
        <FlatList
          ListHeaderComponent={<SearchEmptySection selectedChain={chainFilter} />}
          data={[]}
          keyExtractor={(): string => 'search-empty-section-container'}
          keyboardShouldPersistTaps="always" // TODO(WALL-6724): does not actually work; behaves as default/"never"
          renderItem={null}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
        />
      ) : (
        <SearchResultsSection searchQuery={debouncedSearchQuery} selectedChain={chainFilter} />
      )}
    </>
  )
}

function NewExploreSearchResultsList({
  searchQuery,
  chainFilter,
  debouncedSearchQuery,
  debouncedParsedSearchQuery,
}: {
  searchQuery: string
  chainFilter: UniverseChainId | null
  debouncedSearchQuery: string | null
  debouncedParsedSearchQuery: string | null
}): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.All)

  // So that the linter errors if someone adds a new tab without updating the switch statement
  // eslint-disable-next-line consistent-return
  const getTabLabel = (tab: SearchTab): string => {
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
  }

  return (
    <Trace section={SectionName.ExploreSearch}>
      <Flex row px="$spacing20" pt="$spacing16" pb="$spacing8" gap="$spacing16">
        {MOBILE_SEARCH_TABS.map((tab) => (
          <TouchableArea key={tab} onPress={() => setActiveTab(tab)}>
            <Text color={activeTab === tab ? '$neutral1' : '$neutral2'} variant="buttonLabel2">
              {getTabLabel(tab)}
            </Text>
          </TouchableArea>
        ))}
      </Flex>
      {searchQuery && searchQuery.length > 0 ? (
        <SearchModalResultsList
          chainFilter={chainFilter}
          debouncedParsedSearchFilter={debouncedParsedSearchQuery}
          debouncedSearchFilter={debouncedSearchQuery}
          searchFilter={searchQuery}
          activeTab={activeTab}
        />
      ) : (
        <SearchModalNoQueryList chainFilter={chainFilter} activeTab={activeTab} />
      )}
    </Trace>
  )
}

export const ExploreScreenSearchResultsList = memo(function _ExploreScreenSearchResultsList({
  searchQuery,
  parsedSearchQuery,
  chainFilter,
  textInputRef,
}: {
  searchQuery: string
  parsedSearchQuery: string | null
  chainFilter: UniverseChainId | null
  textInputRef: React.RefObject<TextInput>
}): JSX.Element {
  const searchRevampEnabled = useFeatureFlag(FeatureFlags.SearchRevamp)

  const debouncedSearchQuery = useDebounce(searchQuery)
  const debouncedParsedSearchQuery = useDebounce(parsedSearchQuery)

  return (
    <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
      {searchRevampEnabled ? (
        <NewExploreSearchResultsList
          searchQuery={searchQuery}
          chainFilter={chainFilter}
          debouncedSearchQuery={debouncedSearchQuery}
          debouncedParsedSearchQuery={debouncedParsedSearchQuery}
        />
      ) : (
        <LegacyExploreSearchResultsList
          debouncedSearchQuery={debouncedParsedSearchQuery ?? debouncedSearchQuery ?? ''}
          chainFilter={chainFilter}
          textInputRef={textInputRef}
        />
      )}
    </KeyboardAvoidingView>
  )
})
