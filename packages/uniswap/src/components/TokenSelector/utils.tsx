import { useMemo } from 'react'
import { TokenOptionSection, TokenSection, TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { TokenOption, TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'
import { tradingApiSwappableTokenToCurrencyInfo } from 'uniswap/src/data/apiClients/tradingApi/utils/tradingApiSwappableTokenToCurrencyInfo'
import { SafetyLevel as GqlSafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GetSwappableTokensResponse, SafetyLevel } from 'uniswap/src/data/tradingApi/__generated__'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { differenceWith } from 'utilities/src/primitives/array'

export function createEmptyBalanceOption(currencyInfo: CurrencyInfo): TokenOption {
  return {
    currencyInfo,
    balanceUSD: null,
    quantity: null,
  }
}

export function createEmptyTokenOptionFromBridgingToken(
  token: GetSwappableTokensResponse['tokens'][0],
): TokenOption | undefined {
  const currencyInfo = tradingApiSwappableTokenToCurrencyInfo(token)

  if (!currencyInfo) {
    return undefined
  }

  return {
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

export function formatSearchResults(
  searchResultCurrencies: CurrencyInfo[] | undefined,
  portfolioBalancesById: Record<string, PortfolioBalance> | undefined,
  searchFilter: string | null,
): TokenOption[] | undefined {
  if (!searchResultCurrencies) {
    return undefined
  }

  const formattedOptions = searchResultCurrencies.map((currencyInfo): TokenOption => {
    const portfolioBalanceResult = portfolioBalancesById?.[currencyInfo.currencyId.toLowerCase()]
    // Use currencyInfo from Search Results because the search query fetches protectionInfo but portfolioBalances does not
    return portfolioBalanceResult ? { ...portfolioBalanceResult, currencyInfo } : createEmptyBalanceOption(currencyInfo)
  })

  // Sort to bring exact matches to the top
  formattedOptions.sort((res1: TokenOption, res2: TokenOption) => {
    const res1Match = isExactTokenOptionMatch(res1, searchFilter || '')
    const res2Match = isExactTokenOptionMatch(res2, searchFilter || '')

    if (res1Match && !res2Match) {
      return -1
    } else if (!res1Match && res2Match) {
      return 1
    } else {
      return 0
    }
  })

  return formattedOptions
}

/**
 * Utility to merge the search results with the bridging tokens.
 * Also updates the search results section name accordingly
 */
export function mergeSearchResultsWithBridgingTokens(
  searchResults: TokenSection<TokenOption>[] | undefined,
  bridgingTokens: TokenOption[] | undefined,
  sectionHeaderString: string | undefined,
): TokenSection<TokenOption>[] | undefined {
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

  const bridgingSection: TokenSection<TokenOption> = {
    sectionKey: TokenOptionSection.BridgingTokens,
    data: extractedBridgingTokens,
  }

  // Update the search results section name to "Other tokens on {{network}}" if there is a valid bridging section
  const searchResultsSection = extractedSearchResults.find(
    (section) => section.sectionKey === TokenOptionSection.SearchResults,
  )
  if (bridgingSection.data.length > 0 && searchResultsSection && sectionHeaderString) {
    searchResultsSection.name = sectionHeaderString
  }

  // Remove empty sections
  return [bridgingSection, ...extractedSearchResults].filter((section) => section.data.length > 0)
}

export function isTokenOptionArray(option: TokenSelectorItemTypes): option is TokenOption[] {
  return Array.isArray(option)
}

function isExactTokenOptionMatch(searchResult: TokenOption, query: string): boolean {
  return (
    searchResult.currencyInfo.currency.name?.toLowerCase() === query.toLowerCase() ||
    searchResult.currencyInfo.currency.symbol?.toLowerCase() === query.toLowerCase()
  )
}

export function useTokenOptionsSection<T extends TokenSelectorItemTypes>({
  sectionKey,
  tokenOptions,
  rightElement,
  endElement,
  name,
}: {
  sectionKey: TokenOptionSection
  tokenOptions?: T[]
  rightElement?: JSX.Element
  endElement?: JSX.Element
  name?: string
}): TokenSection<T>[] | undefined {
  return useMemo(() => {
    if (!tokenOptions) {
      return undefined
    }

    // If it is a 2D array, check if any of the inner arrays are not empty
    // Otherwise, check if the array is not empty
    const is2DArray = tokenOptions?.length > 0 && Array.isArray(tokenOptions[0])
    const hasData = is2DArray
      ? tokenOptions.some((item) => isTokenOptionArray(item) && item.length > 0)
      : tokenOptions.length > 0

    return hasData
      ? [
          {
            sectionKey,
            data: tokenOptions,
            name,
            rightElement,
            endElement,
          },
        ]
      : undefined
  }, [name, rightElement, endElement, sectionKey, tokenOptions])
}

export function isSwapListLoading({
  loading,
  portfolioSection,
  popularSection,
  isTestnetModeEnabled,
}: {
  loading: boolean
  portfolioSection: TokenSection<TokenOption>[] | undefined
  popularSection: TokenSection<TokenOption>[] | undefined
  isTestnetModeEnabled: boolean
}): boolean {
  // the popular section is not shown on testnet
  return loading && (isTestnetModeEnabled ? !portfolioSection : !portfolioSection || !popularSection)
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
