import { UniverseChainId } from '@universe/chains'
import {
  OnchainItemListOptionType,
  SearchModalListOption,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { tdpChainFilterForTokenRow } from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'
import { tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export interface SearchModalOptionSelection {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalListOption>
  /** Position of the option within its section (for a pill row, the pill's position within the row). */
  index: number
  /** List row the option renders in (shared by every pill of a pill row). */
  rowIndex: number
}

export type OnSelectSearchModalOption = (selection: SearchModalOptionSelection) => void

/**
 * The single select path for search modal options (vertical rows and Search V2 recents pills): register history,
 * send analytics, navigate. Handlers are stable so the memoized pill row doesn't re-render with the list.
 */
export function useSearchModalOptionSelection({
  searchFilters,
  onSelect,
}: {
  searchFilters: SearchFilterContext
  onSelect?: () => void
}): {
  getModifierPressHref: (item: SearchModalOption) => string | undefined
  /** History + analytics only; for modifier presses, where the platform opens the href itself. */
  recordSelection: OnSelectSearchModalOption
  selectOption: OnSelectSearchModalOption
} {
  const {
    navigateToTokenDetails,
    navigateToExternalProfile,
    navigateToPoolDetails,
    navigateToEarnVault,
    navigateToAuction,
    navigateToCategoryDetails,
    getTokenDetailsUrl,
    getPoolDetailsUrl,
    getExternalProfileUrl,
    getCategoryDetailsUrl,
  } = useUniswapContext()
  const { registerSearchItem } = useAddToSearchHistory()
  const trace = useTrace()

  const tdpChain = (item: SearchModalOption): UniverseChainId | null | undefined => {
    switch (item.type) {
      case OnchainItemListOptionType.Token:
        return tdpChainFilterForTokenRow({
          searchChainFilter: searchFilters.searchChainFilter,
          rowChainId: item.currencyInfo.currency.chainId,
          searchQuery: searchFilters.query,
        })
      case OnchainItemListOptionType.MultichainToken:
        return tdpChainFilterForTokenRow({
          searchChainFilter: searchFilters.searchChainFilter,
          rowChainId: item.primaryCurrencyInfo.currency.chainId,
          explicitTdpChain: item.tdpChainFilter,
          searchQuery: searchFilters.query,
          allowAggregate: true,
        })
      default:
        return undefined
    }
  }

  const getModifierPressHref = useEvent((item: SearchModalOption): string | undefined => {
    switch (item.type) {
      case OnchainItemListOptionType.Token:
        return getTokenDetailsUrl?.(item.currencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain(item)))
      case OnchainItemListOptionType.MultichainToken:
        return getTokenDetailsUrl?.(item.primaryCurrencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain(item)))
      case OnchainItemListOptionType.Pool:
        return getPoolDetailsUrl?.({ poolId: item.poolId, chainId: item.chainId })
      case OnchainItemListOptionType.WalletByAddress:
      case OnchainItemListOptionType.ENSAddress:
      case OnchainItemListOptionType.Unitag:
        return getExternalProfileUrl?.({ address: item.address })
      case OnchainItemListOptionType.Category:
        return getCategoryDetailsUrl?.({ categoryId: item.category.id })
      default:
        return undefined
    }
  })

  const recordSelection = useEvent(({ item, section, index, rowIndex }: SearchModalOptionSelection): void => {
    registerSearchItem(item, { tdpChainFilter: tdpChain(item) })
    sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters, trace })
  })

  const selectOption = useEvent((selection: SearchModalOptionSelection): void => {
    const { item } = selection
    recordSelection(selection)
    switch (item.type) {
      case OnchainItemListOptionType.Token:
        navigateToTokenDetails(item.currencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain(item)))
        break
      case OnchainItemListOptionType.MultichainToken:
        navigateToTokenDetails(item.primaryCurrencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain(item)))
        break
      case OnchainItemListOptionType.Pool:
        navigateToPoolDetails({ poolId: item.poolId, chainId: item.chainId })
        break
      case OnchainItemListOptionType.WalletByAddress:
      case OnchainItemListOptionType.ENSAddress:
      case OnchainItemListOptionType.Unitag:
        navigateToExternalProfile({ address: item.address })
        break
      case OnchainItemListOptionType.EarnVault:
        navigateToEarnVault?.({ analyticsEntryPoint: 'search', vault: item.vault, position: item.position })
        break
      case OnchainItemListOptionType.Auction:
        navigateToAuction?.({ auctionAddress: item.auctionAddress, chainId: item.chainId })
        break
      case OnchainItemListOptionType.Category:
        navigateToCategoryDetails?.({ categoryId: item.category.id })
        break
      default:
        // RwaCollection rows expand in place (RwaCollectionItem owns their issuer selection).
        return
    }
    onSelect?.()
  })

  return { getModifierPressHref, recordSelection, selectOption }
}
