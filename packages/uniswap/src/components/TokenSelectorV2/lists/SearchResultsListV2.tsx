import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { OnSelectCurrency, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSuggestedTilesMaxCount } from 'uniswap/src/components/TokenSelectorV2/constants'
import { TokenSelectorV2List } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2List'
import { useSectionsWithV2Headers } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
    loading,
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

  // The legacy hook returns legacy-styled headers; swap in V2 headers so the pane doesn't mix styles.
  const v2Sections = useSectionsWithV2Headers(sections)

  // Stable identity so TokenSelectorV2List's memo holds while the user types (searchFilter re-renders).
  const onSelectCurrency: OnSelectCurrency = useEvent(
    // oxlint-disable-next-line max-params
    (currencyInfo: CurrencyInfo, section: OnchainItemSection<TokenSelectorOption>, index: number): void => {
      parentOnSelectCurrency(currencyInfo, section, index)
      registerSearchTokenCurrencyInfo(currencyInfo)
    },
  )

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )

  return (
    <TokenSelectorV2List
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={v2Sections}
      showTokenWarnings={true}
      renderedInModal={renderedInModal}
      suggestedTilesMaxCount={getSuggestedTilesMaxCount(variation)}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
