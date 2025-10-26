import { GraphQLApi, TradingApi } from '@universe/api'
import {
  type OnchainItemListOption,
  OnchainItemListOptionType,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { tradingApiSwappableTokenToCurrencyInfo } from 'uniswap/src/data/apiClients/tradingApi/utils/tradingApiSwappableTokenToCurrencyInfo'
import { ModalName, type ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { differenceWith } from 'utilities/src/primitives/array'

export function createEmptyTokenOptionFromBridgingToken(
  token: TradingApi.GetSwappableTokensResponse['tokens'][0],
): TokenOption | undefined {
  const currencyInfo = tradingApiSwappableTokenToCurrencyInfo(token)

  if (!currencyInfo) {
    return undefined
  }

  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo,
    balanceUSD: null,
    quantity: null,
  }
}

export function toGqlSafetyLevel(safetyLevel: TradingApi.SafetyLevel): GraphQLApi.SafetyLevel | null {
  switch (safetyLevel) {
    case TradingApi.SafetyLevel.BLOCKED:
      return GraphQLApi.SafetyLevel.Blocked
    case TradingApi.SafetyLevel.MEDIUM_WARNING:
      return GraphQLApi.SafetyLevel.MediumWarning
    case TradingApi.SafetyLevel.STRONG_WARNING:
      return GraphQLApi.SafetyLevel.StrongWarning
    case TradingApi.SafetyLevel.VERIFIED:
      return GraphQLApi.SafetyLevel.Verified
    default:
      return null
  }
}

// get items in `currencies` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
export function tokenOptionDifference(
  currencies: TokenOption[] | undefined,
  without: TokenOption[] | undefined,
): TokenOption[] | undefined {
  if (!currencies) {
    return undefined
  }
  return differenceWith(currencies, without ?? [], tokenOptionComparator)
}

function tokenOptionComparator(tokenOption: TokenOption, otherTokenOption: TokenOption): boolean {
  return areCurrencyIdsEqual(tokenOption.currencyInfo.currencyId, otherTokenOption.currencyInfo.currencyId)
}

/**
 * Utility to merge the search results with the bridging tokens.
 * Also updates the search results section name accordingly
 */
export function mergeSearchResultsWithBridgingTokens({
  searchResults,
  bridgingTokens,
  sectionHeaderString,
}: {
  searchResults?: OnchainItemSection<TokenOption>[]
  bridgingTokens?: TokenOption[]
  sectionHeaderString?: string
}): OnchainItemSection<TokenOption>[] | undefined {
  if (!searchResults || !bridgingTokens || bridgingTokens.length === 0) {
    return searchResults
  }

  const extractedBridgingTokens: TokenOption[] = []

  const extractedSearchResults = searchResults.map((section) => {
    const sectionResults: TokenOption[] = []
    section.data.forEach((token) => {
      const isBridgingToken = bridgingTokens.some((bridgingToken) =>
        areCurrencyIdsEqual(token.currencyInfo.currencyId, bridgingToken.currencyInfo.currencyId),
      )

      if (isBridgingToken) {
        extractedBridgingTokens.push(token)
      } else {
        sectionResults.push(token)
      }
    })

    return {
      ...section,
      data: sectionResults,
    }
  })

  const bridgingSection: OnchainItemSection<TokenOption> = {
    sectionKey: OnchainItemSectionName.BridgingTokens,
    data: extractedBridgingTokens,
  }

  // Update the search results section name to "Other tokens on {{network}}" if there is a valid bridging section
  const searchResultsSection = extractedSearchResults.find(
    (section) => section.sectionKey === OnchainItemSectionName.SearchResults,
  )
  if (bridgingSection.data.length > 0 && searchResultsSection && sectionHeaderString) {
    searchResultsSection.name = sectionHeaderString
  }

  // Remove empty sections
  return [bridgingSection, ...extractedSearchResults].filter((section) => section.data.length > 0)
}

export function isTokenOptionArray(option: OnchainItemListOption): option is TokenOption[] {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return Array.isArray(option) && option.every((item) => item.type === OnchainItemListOptionType.Token)
}

export function isSwapListLoading({
  loading,
  portfolioSection,
  trendingSection,
  isTestnetModeEnabled,
}: {
  loading: boolean
  portfolioSection: OnchainItemSection<TokenOption>[] | undefined
  trendingSection: OnchainItemSection<TokenOption>[] | undefined
  isTestnetModeEnabled: boolean
}): boolean {
  // the trending section is not shown on testnet
  return loading && (isTestnetModeEnabled ? !portfolioSection : !portfolioSection || !trendingSection)
}

export function flowToModalName(flow: TokenSelectorFlow): ModalNameType | undefined {
  switch (flow) {
    case TokenSelectorFlow.Swap:
      return ModalName.Swap
    case TokenSelectorFlow.Send:
      return ModalName.Send
    default:
      return undefined
  }
}
