import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { SearchContext, SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { SearchResultType, extractDomain } from 'uniswap/src/features/search/SearchResult'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NavBarSearchTypes } from 'uniswap/src/features/telemetry/types'
import { isMobileApp } from 'utilities/src/platform'

export function sendSearchOptionItemClickedAnalytics({
  item,
  section,
  rowIndex,
  searchFilters,
}: {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalOption>
  rowIndex: number
  searchFilters: SearchFilterContext
}): void {
  const searchContext: SearchContext = {
    ...searchFilters,
    category: section.sectionKey,
    isHistory: section.sectionKey === OnchainItemSectionName.RecentSearches, // history item click
    position: rowIndex,
    suggestionCount: section.data.length, // suggestionCount is # of suggestions in this SECTION, not total # of suggestions
  }

  switch (item.type) {
    case OnchainItemListOptionType.Token: {
      const currency = item.currencyInfo.currency
      if (isMobileApp) {
        sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
          ...searchContext,
          name: currency.name ?? '',
          chain: currency.chainId,
          address: currency.isNative ? 'NATIVE' : currency.address,
          type: 'token',
        })
      } else {
        sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
          ...searchContext,
          chainId: currency.chainId,
          suggestion_type: searchContext.isHistory
            ? NavBarSearchTypes.RecentSearch
            : searchContext.query && searchContext.query.length > 0
              ? NavBarSearchTypes.TokenSuggestion
              : NavBarSearchTypes.TokenTrending,
          total_suggestions: searchContext.suggestionCount,
          query_text: searchContext.query ?? '',
          selected_search_result_name: currency.name ?? '',
          selected_search_result_address: currency.isNative ? 'NATIVE' : currency.address,
        })
      }
      return
    }
    case OnchainItemListOptionType.WalletByAddress:
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        ...searchContext,
        address: item.address,
        type: 'address',
      })
      return
    case OnchainItemListOptionType.ENSAddress:
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        ...searchContext,
        name: item.ensName,
        address: item.address,
        type: 'address',
        domain: extractDomain(item.ensName, SearchResultType.ENSAddress),
      })
      return
    case OnchainItemListOptionType.Unitag: {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        ...searchContext,
        name: item.unitag,
        address: item.address,
        type: 'address',
        domain: extractDomain(item.unitag, SearchResultType.Unitag),
      })
      return
    }
    case OnchainItemListOptionType.NFTCollection:
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        ...searchContext,
        name: item.name,
        chain: item.chainId,
        address: item.address,
        type: 'collection',
      })
      return
  }
}
