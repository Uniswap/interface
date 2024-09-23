import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SectionHeader } from 'uniswap/src/components/TokenSelector/TokenSectionHeader'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useAddToSearchHistory, useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenOptionSection,
} from 'uniswap/src/components/TokenSelector/types'
// eslint-disable-next-line no-restricted-imports
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function EmptyResults({ searchFilter }: { searchFilter: string }): JSX.Element {
  return (
    <Flex>
      <SectionHeader sectionKey={TokenOptionSection.SearchResults} />
      <Text color="$neutral3" mt="$spacing16" textAlign="center" variant="subheading2">
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
  onDismiss,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
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
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
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
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
