import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { SectionHeader } from 'uniswap/src/components/TokenSelector/items/TokenSectionHeader'
import { OnSelectCurrency, TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function EmptyResults({ searchFilter }: { searchFilter: string }): JSX.Element {
  return (
    <Flex>
      <SectionHeader sectionKey={TokenOptionSection.SearchResults} />
      <Text color="$neutral3" mt="$spacing16" mx="$spacing16" textAlign="center" variant="subheading2">
        <Trans
          components={{ highlight: <Text color="$neutral1" variant="subheading2" /> }}
          i18nKey="tokens.selector.search.empty"
          values={{ searchText: searchFilter }}
        />
      </Text>
    </Flex>
  )
}

function _TokenSelectorSearchResultsList({
  onSelectCurrency: parentOnSelectCurrency,
  activeAccountAddress,
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  isBalancesOnlySearch,
  isKeyboardOpen,
  input,
}: {
  onSelectCurrency: OnSelectCurrency
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  isKeyboardOpen?: boolean
  input: TradeableAsset | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { registerSearch } = useAddToSearchHistory()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSearchResults(
    activeAccountAddress,
    chainFilter ?? parsedChainFilter,
    debouncedParsedSearchFilter ?? debouncedSearchFilter,
    isBalancesOnlySearch,
    input,
  )

  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    registerSearch(currencyInfo)
  }

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <EmptyResults searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )
  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
