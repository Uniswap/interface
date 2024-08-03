import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SectionHeader, TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSection,
} from 'uniswap/src/components/TokenSelector/types'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function EmptyResults({ searchFilter }: { searchFilter: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex>
      <SectionHeader title={t('tokens.selector.section.search')} />
      <Text color="$neutral3" textAlign="center" variant="subheading2">
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
  addToSearchHistoryCallback,
  onDismiss,
  onSelectCurrency: parentOnSelectCurrency,
  chainFilter,
  searchFilter,
  debouncedSearchFilter,
  isBalancesOnlySearch,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenSectionsForSearchResultsHook,
  useTokenWarningDismissedHook,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  addToSearchHistoryCallback: (currencyInfo: CurrencyInfo) => void
  onDismiss: () => void
  useTokenSectionsForSearchResultsHook: (
    chainFilter: UniverseChainId | null,
    searchFilter: string | null,
    isBalancesOnlySearch: boolean,
  ) => GqlResult<TokenSection[]>
  useTokenWarningDismissedHook: (currencyId: Maybe<string>) => {
    tokenWarningDismissed: boolean
    dismissWarningCallback: () => void
  }
}): JSX.Element {
  const { t } = useTranslation()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSearchResultsHook(chainFilter, debouncedSearchFilter, isBalancesOnlySearch)

  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    addToSearchHistoryCallback(currencyInfo)
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
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      useTokenWarningDismissedHook={useTokenWarningDismissedHook}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
