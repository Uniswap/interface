import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
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
