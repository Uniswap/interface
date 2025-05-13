import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemListOption, OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { tradingApiSwappableTokenToCurrencyInfo } from 'uniswap/src/data/apiClients/tradingApi/utils/tradingApiSwappableTokenToCurrencyInfo'
import { SafetyLevel as GqlSafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GetSwappableTokensResponse, SafetyLevel } from 'uniswap/src/data/tradingApi/__generated__'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { differenceWith } from 'utilities/src/primitives/array'

export function createEmptyTokenOptionFromBridgingToken(
  token: GetSwappableTokensResponse['tokens'][0],
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

export function toGqlSafetyLevel(safetyLevel: SafetyLevel): GqlSafetyLevel | null {
  switch (safetyLevel) {
    case SafetyLevel.BLOCKED:
      return GqlSafetyLevel.Blocked
    case SafetyLevel.MEDIUM_WARNING:
      return GqlSafetyLevel.MediumWarning
    case SafetyLevel.STRONG_WARNING:
      return GqlSafetyLevel.StrongWarning
    case SafetyLevel.VERIFIED:
      return GqlSafetyLevel.Verified
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
export function mergeSearchResultsWithBridgingTokens(
  searchResults: OnchainItemSection<TokenOption>[] | undefined,
  bridgingTokens: TokenOption[] | undefined,
  sectionHeaderString: string | undefined,
): OnchainItemSection<TokenOption>[] | undefined {
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
