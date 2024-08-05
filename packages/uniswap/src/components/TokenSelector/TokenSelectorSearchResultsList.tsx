import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SectionHeader, TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSection,
} from 'uniswap/src/components/TokenSelector/types'
import { PortfolioValueModifier } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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
  onSelectCurrency: parentOnSelectCurrency,
  activeAccountAddress,
  chainFilter,
  searchFilter,
  debouncedSearchFilter,
  isBalancesOnlySearch,
  valueModifiers,
  onDismiss,
  addToSearchHistoryCallback,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenSectionsForSearchResultsHook,
  useTokenWarningDismissedHook,
}: {
  onSelectCurrency: OnSelectCurrency
  activeAccountAddress: string
  chainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  valueModifiers?: PortfolioValueModifier[]
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  addToSearchHistoryCallback: (currencyInfo: CurrencyInfo) => void
  onDismiss: () => void
  useTokenSectionsForSearchResultsHook: (
    address: string,
    chainFilter: UniverseChainId | null,
    searchFilter: string | null,
    isBalancesOnlySearch: boolean,
    valueModifiers?: PortfolioValueModifier[],
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
  } = useTokenSectionsForSearchResultsHook(
    activeAccountAddress,
    chainFilter,
    debouncedSearchFilter,
    isBalancesOnlySearch,
    valueModifiers,
  )

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
