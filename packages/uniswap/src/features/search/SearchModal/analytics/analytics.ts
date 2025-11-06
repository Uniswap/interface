import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { extractDomain } from 'uniswap/src/components/lists/items/wallets/utils'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SearchContext, SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NavBarSearchTypes } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'

// eslint-disable-next-line complexity
export function sendSearchOptionItemClickedAnalytics({
  item,
  section,
  rowIndex,
  sectionIndex,
  searchFilters,
}: {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalOption>
  rowIndex: number
  sectionIndex: number
  searchFilters: SearchFilterContext
}): void {
  const searchContext: SearchContext = {
    ...searchFilters,
    category: section.sectionKey,
    isHistory: section.sectionKey === OnchainItemSectionName.RecentSearches,
    position: rowIndex, // rowIndex accounts for header items as well, so the first header in the list has index 0 and first item in the list has index 1
    sectionPosition: sectionIndex + 1, // 1-indexed position of item in section
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
    case OnchainItemListOptionType.Pool: {
      sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
        ...searchContext,
        chainId: item.chainId,
        suggestion_type: searchContext.isHistory
          ? NavBarSearchTypes.RecentSearch
          : searchContext.query && searchContext.query.length > 0
            ? NavBarSearchTypes.PoolSuggestion
            : NavBarSearchTypes.PoolTrending,
        total_suggestions: searchContext.suggestionCount,
        query_text: searchContext.query ?? '',
        selected_search_result_name: `${item.token0CurrencyInfo.currency.symbol ?? 'UNK'} / ${item.token1CurrencyInfo.currency.symbol ?? 'UNK'}`,
        selected_search_result_address: item.poolId,
        protocol_version: ProtocolVersion[item.protocolVersion],
        fee_tier: item.feeTier,
        hook_address: item.hookAddress,
      })
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
        domain: extractDomain(item.ensName, OnchainItemListOptionType.ENSAddress),
      })
      return
    case OnchainItemListOptionType.Unitag: {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        ...searchContext,
        name: item.unitag,
        address: item.address,
        type: 'address',
        domain: extractDomain(item.unitag, OnchainItemListOptionType.Unitag),
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
    default:
      logger.warn('SearchModal/analytics.ts', 'sendSearchOptionItemClickedAnalytics', 'Unhandled search option type', {
        item,
      })
  }
}
