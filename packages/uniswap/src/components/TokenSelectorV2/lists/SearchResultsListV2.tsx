import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import {
  CategoryFilterChipRow,
  CategoryFilterChipRowSkeleton,
} from 'uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterChipRow'
import { CategoryFilterEmptyState } from 'uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterEmptyState'
import { useCategoryFilterChips } from 'uniswap/src/components/TokenSelector/categoryFilters/useCategoryFilterChips'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { OnSelectCurrency, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSuggestedTilesMaxCount } from 'uniswap/src/components/TokenSelectorV2/constants'
import { TokenSelectorV2List } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2List'
import { useSectionsWithV2Headers } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useEvent } from 'utilities/src/react/hooks'

export function SearchResultsListV2({
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
  variation,
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
  variation: TokenSelectorVariation
  renderedInModal: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { registerSearchTokenCurrencyInfo } = useAddToSearchHistory()
  const effectiveParsedChainFilter =
    parsedChainFilter && chainIds.includes(parsedChainFilter) ? parsedChainFilter : null
  const {
    data: sections,
    isLoading: isDataLoading,
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

  // Stable identity so TokenSelectorV2List's memo holds while the user types (searchFilter re-renders).
  const onSelectCurrency: OnSelectCurrency = useEvent(
    // oxlint-disable-next-line max-params
    (currencyInfo: CurrencyInfo, section: OnchainItemSection<TokenSelectorOption>, index: number): void => {
      parentOnSelectCurrency(currencyInfo, section, index)
      registerSearchTokenCurrencyInfo(currencyInfo)
    },
  )

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)
  const isLoading = userIsTyping || isDataLoading
  const { chips, showSkeleton, activeIds, filteredSections, isFilteredEmpty, toggleChip, clearFilters } =
    useCategoryFilterChips({
      sections,
      isLoading,
      isBalancesOnlySearch,
    })
  // The legacy hook returns legacy-styled headers; swap in V2 headers so the pane doesn't mix styles.
  const v2Sections = useSectionsWithV2Headers(filteredSections)

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
      <TokenSelectorV2List
        showTokenAddress
        chainFilter={chainFilter}
        emptyElement={emptyElement}
        errorText={t('token.selector.search.error')}
        hasError={Boolean(error)}
        loading={isLoading}
        refetch={refetch}
        sections={v2Sections}
        showTokenWarnings={true}
        renderedInModal={renderedInModal}
        suggestedTilesMaxCount={getSuggestedTilesMaxCount(variation)}
        onSelectCurrency={onSelectCurrency}
      />
    </Flex>
  )
}
