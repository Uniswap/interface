import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { isMobileApp } from '@universe/environment'
import {
  OnchainItemListOptionType,
  SearchModalListOption,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { extractDomain } from 'uniswap/src/components/lists/items/wallets/utils'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SearchContext, SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  getCurrencyInfoSafetyAnalytics,
  getTokenSafetyAnalytics,
} from 'uniswap/src/features/telemetry/tokenSafetyAnalytics'
import { NavBarSearchTypes, type TokenSafetyAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export function sendSearchOptionItemClickedAnalytics({
  item,
  section,
  rowIndex,
  sectionIndex,
  searchFilters,
  rwaSelection,
  trace,
}: {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalListOption>
  rowIndex: number
  sectionIndex: number
  searchFilters: SearchFilterContext
  /** The tapped issuer's chain + address in an RWA collection; when omitted, the event's chain/address are unset. */
  rwaSelection?: { chainId: UniverseChainId; address: string }
  trace?: ITraceContext
}): void {
  const searchContext: SearchContext = {
    ...searchFilters,
    category: section.sectionKey,
    isHistory: section.sectionKey === OnchainItemSectionName.RecentSearches,
    position: rowIndex, // rowIndex accounts for header items as well, so the first header in the list has index 0 and first item in the list has index 1
    sectionPosition: sectionIndex + 1, // 1-indexed position of item in section
    // suggestionCount is # of suggestions in this SECTION, not total # of suggestions; flattened so a pill row counts its pills
    suggestionCount: section.data.flat().length,
  }

  switch (item.type) {
    case OnchainItemListOptionType.MultichainToken: {
      const firstCurrency = item.multichainResult.tokens[0]?.currency

      if (firstCurrency === undefined) {
        logger.warn(
          'SearchModal/analytics.ts',
          'sendSearchOptionItemClickedAnalytics',
          'First currency is undefined in multichain result, skipping analytics',
          { item },
        )
        return
      }

      const safety = getTokenSafetyAnalytics({
        safetyInfo: item.multichainResult.safetyInfo,
        isSuppressed: item.multichainResult.isSuppressed,
      })
      if (item.multichainResult.tokens.length === 1) {
        sendTokenAnalyticsEvent({ searchContext, currency: firstCurrency, safety, trace })
      } else {
        sendTokenAnalyticsEvent({ searchContext, currency: firstCurrency, safety, multichain: true, trace })
      }
      return
    }
    case OnchainItemListOptionType.Token: {
      const currency = item.currencyInfo.currency
      sendTokenAnalyticsEvent({
        searchContext,
        currency,
        safety: getCurrencyInfoSafetyAnalytics(item.currencyInfo),
        trace,
      })
      return
    }
    case OnchainItemListOptionType.EarnVault: {
      // Earn row routes to the underlying asset's TDP — report that token.
      const { underlyingCurrencyInfo } = item
      if (underlyingCurrencyInfo) {
        sendTokenAnalyticsEvent({
          searchContext,
          currency: underlyingCurrencyInfo.currency,
          safety: getCurrencyInfoSafetyAnalytics(underlyingCurrencyInfo),
          trace,
        })
      }
      return
    }
    case OnchainItemListOptionType.RwaCollection: {
      // Tokenized-stock collection: route through the shared (platform-aware) token path. The tapped issuer's
      // chain + address are resolved and validated by the caller (selectIssuer) and threaded via rwaSelection.
      sendSearchResultClickedAnalytics({
        searchContext,
        name: item.rwa.name,
        chainId: rwaSelection?.chainId,
        address: rwaSelection?.address,
        resultType: 'token',
        trace,
      })
      return
    }
    case OnchainItemListOptionType.Pool: {
      sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
        ...trace,
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
    case OnchainItemListOptionType.Auction:
      sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
        ...trace,
        ...searchContext,
        chainId: item.chainId,
        suggestion_type: searchContext.isHistory
          ? NavBarSearchTypes.RecentSearch
          : searchContext.query && searchContext.query.length > 0
            ? NavBarSearchTypes.AuctionSuggestion
            : NavBarSearchTypes.AuctionTrending,
        total_suggestions: searchContext.suggestionCount,
        query_text: searchContext.query ?? '',
        selected_search_result_name: item.tokenName ?? item.tokenSymbol,
        selected_search_result_address: item.auctionAddress,
      })
      return
    case OnchainItemListOptionType.Category:
      sendSearchResultClickedAnalytics({
        searchContext,
        name: item.category.name,
        address: item.category.id,
        resultType: 'collection',
        trace,
      })
      return
    default:
      logger.warn('SearchModal/analytics.ts', 'sendSearchOptionItemClickedAnalytics', 'Unhandled search option type', {
        item,
      })
  }
}

function sendTokenAnalyticsEvent({
  searchContext,
  currency,
  safety,
  multichain = false,
  trace,
}: {
  searchContext: SearchContext
  currency: Currency
  safety: TokenSafetyAnalyticsProperties
  multichain?: boolean
  trace?: ITraceContext
}): void {
  sendSearchResultClickedAnalytics({
    searchContext,
    name: currency.name ?? '',
    chainId: currency.chainId,
    address: currency.isNative ? 'NATIVE' : currency.address,
    resultType: multichain ? 'multichain_token' : 'token',
    safety,
    trace,
  })
}

type SearchResultType = 'token' | 'multichain_token' | 'collection'

function getWebSuggestionType(searchContext: SearchContext, resultType: SearchResultType): NavBarSearchTypes {
  if (searchContext.isHistory) {
    return NavBarSearchTypes.RecentSearch
  }
  if (resultType === 'collection') {
    return NavBarSearchTypes.CategorySuggestion
  }
  return searchContext.query && searchContext.query.length > 0
    ? NavBarSearchTypes.TokenSuggestion
    : NavBarSearchTypes.TokenTrending
}

/**
 * Emits the search-result-clicked event in the right shape per platform (mobile `ExploreSearchResultClicked` vs
 * web `NavbarResultSelected`). Shared by the token, multichain-token, tokenized-stock, and category paths so
 * the two payload shapes never drift. For a category, `address` carries the category id.
 */
function sendSearchResultClickedAnalytics({
  searchContext,
  name,
  chainId,
  address,
  resultType,
  safety,
  trace,
}: {
  searchContext: SearchContext
  name: string
  chainId?: UniverseChainId
  address?: string
  resultType: SearchResultType
  safety?: TokenSafetyAnalyticsProperties
  trace?: ITraceContext
}): void {
  if (isMobileApp) {
    sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
      ...searchContext,
      ...safety,
      name,
      chain: chainId,
      address,
      type: resultType,
    })
  } else {
    sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
      ...trace,
      ...searchContext,
      ...safety,
      chainId,
      suggestion_type: getWebSuggestionType(searchContext, resultType),
      total_suggestions: searchContext.suggestionCount,
      query_text: searchContext.query ?? '',
      selected_search_result_name: name,
      selected_search_result_address: address,
      token_type: resultType === 'collection' ? undefined : resultType,
    })
  }
}
