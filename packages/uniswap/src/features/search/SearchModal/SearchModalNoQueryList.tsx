import { ContentStyle } from '@shopify/flash-list'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, GeneratedIcon, Text } from 'ui/src'
import { Gallery, Person } from 'ui/src/components/icons'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSectionsForNoQuerySearch } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForNoQuerySearch'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

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
  onSelect?: SearchModalListProps['onSelect']
  renderedInModal: boolean
  contentContainerStyle?: ContentStyle
}

export const SearchModalNoQueryList = memo(function _SearchModalNoQueryList({
  chainFilter,
  activeTab,
  onSelect,
  renderedInModal,
  contentContainerStyle,
}: SearchModalNoQueryListProps): JSX.Element {
  const { t } = useTranslation()

  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useSectionsForNoQuerySearch({
    chainFilter,
    activeTab,
  })

  // Handle empty pretype cases for assets without default results
  const getEmptyElementComponent = (): JSX.Element | undefined => {
    switch (activeTab) {
      case SearchTab.NFTCollections:
        return <EmptyPretypeSection title={t('search.results.pretype.nfts')} icon={Gallery} />
      case SearchTab.Wallets:
        return <EmptyPretypeSection title={t('search.results.pretype.wallets')} icon={Person} />
      default:
        return undefined
    }
  }

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
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
      emptyElement={getEmptyElementComponent()}
      onSelect={onSelect}
    />
  )
})
