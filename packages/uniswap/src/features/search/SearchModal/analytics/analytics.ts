import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { isMobileApp } from '@universe/environment'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { extractDomain } from 'uniswap/src/components/lists/items/wallets/utils'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchContext, SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NavBarSearchTypes } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'

export function sendSearchOptionItemClickedAnalytics({
  item,
  section,
  rowIndex,
  sectionIndex,
  searchFilters,
  rwaSelection,
}: {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalOption>
  rowIndex: number
  sectionIndex: number
  searchFilters: SearchFilterContext
  /** The tapped issuer's chain + address in an RWA collection; when omitted, the event's chain/address are unset. */
  rwaSelection?: { chainId: UniverseChainId; address: string }
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

      if (item.multichainResult.tokens.length === 1) {
        sendTokenAnalyticsEvent({ searchContext, currency: firstCurrency })
      } else {
        sendTokenAnalyticsEvent({ searchContext, currency: firstCurrency, multichain: true })
      }
      return
    }
    case OnchainItemListOptionType.Token: {
      const currency = item.currencyInfo.currency
      sendTokenAnalyticsEvent({ searchContext, currency })
      return
    }
    case OnchainItemListOptionType.EarnVault: {
      // Earn row routes to the underlying asset's TDP — report that token.
      const currency = item.underlyingCurrencyInfo?.currency
      if (currency) {
        sendTokenAnalyticsEvent({ searchContext, currency })
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
        tokenType: 'token',
      })
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
    case OnchainItemListOptionType.Auction:
      sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
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
    default:
      logger.warn('SearchModal/analytics.ts', 'sendSearchOptionItemClickedAnalytics', 'Unhandled search option type', {
        item,
      })
  }
}

function sendTokenAnalyticsEvent({
  searchContext,
  currency,
  multichain = false,
}: {
  searchContext: SearchContext
  currency: Currency
  multichain?: boolean
}): void {
  sendSearchResultClickedAnalytics({
    searchContext,
    name: currency.name ?? '',
    chainId: currency.chainId,
    address: currency.isNative ? 'NATIVE' : currency.address,
    tokenType: multichain ? 'multichain_token' : 'token',
  })
}

/**
 * Emits the search-result-clicked event in the right shape per platform (mobile `ExploreSearchResultClicked` vs
 * web `NavbarResultSelected`). Shared by the token, multichain-token, and tokenized-stock paths so the two
 * payload shapes never drift.
 */
function sendSearchResultClickedAnalytics({
  searchContext,
  name,
  chainId,
  address,
  tokenType,
}: {
  searchContext: SearchContext
  name: string
  chainId?: UniverseChainId
  address?: string
  tokenType: 'token' | 'multichain_token'
}): void {
  if (isMobileApp) {
    sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
      ...searchContext,
      name,
      chain: chainId,
      address,
      type: tokenType,
    })
  } else {
    sendAnalyticsEvent(InterfaceEventName.NavbarResultSelected, {
      ...searchContext,
      chainId,
      suggestion_type: searchContext.isHistory
        ? NavBarSearchTypes.RecentSearch
        : searchContext.query && searchContext.query.length > 0
          ? NavBarSearchTypes.TokenSuggestion
          : NavBarSearchTypes.TokenTrending,
      total_suggestions: searchContext.suggestionCount,
      query_text: searchContext.query ?? '',
      selected_search_result_name: name,
      selected_search_result_address: address,
      token_type: tokenType,
    })
  }
}
