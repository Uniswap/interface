import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import {
  CategoryFilterChipRow,
  CategoryFilterChipRowSkeleton,
} from 'uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterChipRow'
import { CategoryFilterEmptyState } from 'uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterEmptyState'
import { useCategoryFilterChips } from 'uniswap/src/components/TokenSelector/categoryFilters/useCategoryFilterChips'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'

function TokenSelectorSearchResultsListInner({
  onSelectCurrency: parentOnSelectCurrency,
  addresses,
  chainFilter,
  chainIds,
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
  chainIds: UniverseChainId[]
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
  const effectiveParsedChainFilter =
    parsedChainFilter && chainIds.includes(parsedChainFilter) ? parsedChainFilter : null
  const {
    data: sections,
    isLoading: isLoadingData,
    error,
    refetch,
  } = useTokenSectionsForSearchResults({
    addresses,
    chainFilter: chainFilter ?? effectiveParsedChainFilter,
    chainIds,
    searchFilter: debouncedParsedSearchFilter ?? debouncedSearchFilter,
    isBalancesOnlySearch,
    input,
  })

  // oxlint-disable-next-line max-params
  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    registerSearchTokenCurrencyInfo(currencyInfo)
  }

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)
  const isLoading = userIsTyping || isLoadingData
  const { chips, showSkeleton, activeIds, filteredSections, isFilteredEmpty, toggleChip, clearFilters } =
    useCategoryFilterChips({
      sections,
      isLoading,
      isBalancesOnlySearch,
    })

  const emptyElement = useMemo(() => {
    if (!debouncedSearchFilter) {
      return undefined
    }
    if (!isFilteredEmpty) {
      return <NoResultsFound searchFilter={debouncedSearchFilter} />
    }
    return (
      <CategoryFilterEmptyState
        activeFilterCount={activeIds.length}
        searchFilter={debouncedSearchFilter}
        onClearFilters={clearFilters}
      />
    )
  }, [debouncedSearchFilter, isFilteredEmpty, activeIds.length, clearFilters])
  return (
    <Flex fill>
      {showSkeleton ? (
        <CategoryFilterChipRowSkeleton />
      ) : (
        <CategoryFilterChipRow activeIds={activeIds} addresses={addresses} chips={chips} onToggle={toggleChip} />
      )}
      <TokenSelectorList
        showTokenAddress
        chainFilter={chainFilter}
        emptyElement={emptyElement}
        errorText={t('token.selector.search.error')}
        hasError={Boolean(error)}
        loading={isLoading}
        refetch={refetch}
        sections={filteredSections}
        showTokenWarnings={true}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
      />
    </Flex>
  )
}

export const TokenSelectorSearchResultsList = memo(TokenSelectorSearchResultsListInner)
