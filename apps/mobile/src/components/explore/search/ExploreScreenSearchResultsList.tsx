import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { Flex, Text, TouchableArea, flexStyles } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { MOBILE_SEARCH_TABS, SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useDebounce } from 'utilities/src/time/timing'

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
    <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
      <Trace section={SectionName.ExploreSearch}>
        <Flex row px="$spacing20" pt="$spacing16" pb="$spacing8" gap="$spacing16">
          {MOBILE_SEARCH_TABS.map((tab) => (
            <Trace key={tab} logPress element={ElementName.SearchTab} properties={{ search_tab: tab }}>
              <TouchableArea onPress={() => setActiveTab(tab)}>
                <Text color={activeTab === tab ? '$neutral1' : '$neutral2'} variant="buttonLabel2">
                  {getTabLabel(tab)}
                </Text>
              </TouchableArea>
            </Trace>
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
          />
        ) : (
          <SearchModalNoQueryList chainFilter={chainFilter} activeTab={activeTab} />
        )}
      </Trace>
    </KeyboardAvoidingView>
  )
})
