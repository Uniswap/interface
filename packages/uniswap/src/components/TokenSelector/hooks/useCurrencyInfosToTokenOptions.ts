import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

export function currencyInfosToTokenOptions(currencyInfos?: Maybe<CurrencyInfo>[]): TokenOption[] | undefined {
  return currencyInfos
    ?.filter((cI): cI is CurrencyInfo => Boolean(cI))
    .map((currencyInfo) => ({
      type: OnchainItemListOptionType.Token,
      currencyInfo,
      quantity: null,
      balanceUSD: undefined,
    }))
}

export function createEmptyBalanceOption(currencyInfo: CurrencyInfo): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo,
    balanceUSD: null,
    quantity: null,
  }
}

export function useCurrencyInfosToTokenOptions({
  currencyInfos,
  portfolioBalancesById,
  sortAlphabetically,
}: {
  currencyInfos?: CurrencyInfo[]
  sortAlphabetically?: boolean
  portfolioBalancesById?: Record<string, PortfolioBalance>
}): TokenOption[] | undefined {
  // we use useMemo here to avoid recalculation of internals when function params are the same,
  // but the component, where this hook is used is re-rendered
  return useMemo(() => {
    if (!currencyInfos) {
      return undefined
    }
    const sortedCurrencyInfos = sortAlphabetically
      ? [...currencyInfos].sort((a, b) => {
          if (a.currency.name && b.currency.name) {
            return a.currency.name.localeCompare(b.currency.name)
          }
          return 0
        })
      : currencyInfos

    return mergeCurrencyInfosWithBalances({ currencyInfos: sortedCurrencyInfos, portfolioBalancesById })
  }, [currencyInfos, portfolioBalancesById, sortAlphabetically])
}

export function mergeCurrencyInfosWithBalances({
  currencyInfos,
  portfolioBalancesById,
}: {
  currencyInfos: CurrencyInfo[]
  portfolioBalancesById?: Record<string, PortfolioBalance>
}): TokenOption[] {
  return currencyInfos.map((currencyInfo) => {
    const portfolioBalance = portfolioBalancesById?.[normalizeCurrencyIdForMapLookup(currencyInfo.currencyId)]
    if (!portfolioBalance) {
      return createEmptyBalanceOption(currencyInfo)
    }
    // The balance's currencyInfo wins, but only search results carry categoryIds, so keep those.
    // Lookups always send the field (often empty), so only a non-empty list is worth carrying over.
    const mergedCurrencyInfo =
      currencyInfo.categoryIds?.length && !portfolioBalance.currencyInfo.categoryIds?.length
        ? { ...portfolioBalance.currencyInfo, categoryIds: currencyInfo.categoryIds }
        : portfolioBalance.currencyInfo
    return { type: OnchainItemListOptionType.Token, ...portfolioBalance, currencyInfo: mergedCurrencyInfo }
  })
}
