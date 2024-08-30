import { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SectionHeader } from 'uniswap/src/components/TokenSelector/TokenSectionHeader'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
} from 'uniswap/src/components/TokenSelector/types'
import { PortfolioValueModifier } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
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
  valueModifiers,
  isKeyboardOpen,
  onDismiss,
  addToSearchHistoryCallback,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenSectionsForSearchResultsHook,
  useTokenWarningDismissedHook,
}: {
  onSelectCurrency: OnSelectCurrency
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  valueModifiers?: PortfolioValueModifier[]
  isKeyboardOpen?: boolean
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  addToSearchHistoryCallback: (currencyInfo: CurrencyInfo) => void
  onDismiss: () => void
  useTokenSectionsForSearchResultsHook: (
    address: string | undefined,
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
    chainFilter ?? parsedChainFilter,
    debouncedParsedSearchFilter ?? debouncedSearchFilter,
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
      isKeyboardOpen={isKeyboardOpen}
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
