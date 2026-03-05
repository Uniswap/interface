import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function _TokenSelectorSearchResultsList({
  onSelectCurrency: parentOnSelectCurrency,
  addresses,
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  isBalancesOnlySearch,
  input,
  renderedInModal,
}: {
  onSelectCurrency: OnSelectCurrency
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  input: TradeableAsset | undefined
  renderedInModal: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { registerSearchTokenCurrencyInfo } = useAddToSearchHistory()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSearchResults({
    addresses,
    chainFilter: chainFilter ?? parsedChainFilter,
    searchFilter: debouncedParsedSearchFilter ?? debouncedSearchFilter,
    isBalancesOnlySearch,
    input,
  })

  // eslint-disable-next-line max-params
  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    registerSearchTokenCurrencyInfo(currencyInfo)
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
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      renderedInModal={renderedInModal}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
