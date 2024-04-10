import { differenceWith } from 'utilities/src/primitives/array'
import { TokenOption, TokenSection } from 'wallet/src/components/TokenSelector/types'
import { CurrencyInfo, PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { areCurrencyIdsEqual } from 'wallet/src/utils/currencyId'

export function createEmptyBalanceOption(currencyInfo: CurrencyInfo): TokenOption {
  return {
    currencyInfo,
    balanceUSD: null,
    quantity: null,
  }
}

// get items in `currencies` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
export function tokenOptionDifference(
  currencies: TokenOption[] | undefined,
  without: TokenOption[] | undefined
): TokenOption[] | undefined {
  if (!currencies) {
    return undefined
  }
  return differenceWith(currencies, without ?? [], tokenOptionComparator)
}

function tokenOptionComparator(tokenOption: TokenOption, otherTokenOption: TokenOption): boolean {
  return areCurrencyIdsEqual(
    tokenOption.currencyInfo.currencyId,
    otherTokenOption.currencyInfo.currencyId
  )
}

export function formatSearchResults(
  searchResultCurrencies: CurrencyInfo[] | undefined,
  portfolioBalancesById: Record<string, PortfolioBalance> | undefined,
  searchFilter: string | null
): TokenOption[] | undefined {
  if (!searchResultCurrencies) {
    return
  }

  const formattedOptions = searchResultCurrencies.map((currencyInfo): TokenOption => {
    return (
      portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
    )
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

function isExactTokenOptionMatch(searchResult: TokenOption, query: string): boolean {
  return (
    searchResult.currencyInfo.currency.name?.toLowerCase() === query.toLowerCase() ||
    searchResult.currencyInfo.currency.symbol?.toLowerCase() === query.toLowerCase()
  )
}

export function getTokenOptionsSection(
  title: string,
  tokenOptions?: TokenOption[],
  rightElement?: JSX.Element
): TokenSection[] | undefined {
  return tokenOptions?.length
    ? [
        {
          title,
          data: tokenOptions,
          rightElement,
        },
      ]
    : undefined
}
