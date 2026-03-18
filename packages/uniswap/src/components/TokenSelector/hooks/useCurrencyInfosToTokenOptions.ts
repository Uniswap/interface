import { ApolloError } from '@apollo/client'
import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { BRIDGED_BASE_ADDRESSES } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export function useCurrencies(currencyIds: string[]): GqlResult<CurrencyInfo[]> {
  const { data: baseCurrencyInfos, loading, error, refetch } = useTokenProjects(currencyIds)
  const persistedError = usePersistedError(loading, error instanceof ApolloError ? error : undefined)

  // TokenProjects returns tokens on every network, so filter out native assets that have a
  // bridged version on other networks
  const filteredBaseCurrencyInfos = useMemo(() => {
    return baseCurrencyInfos?.filter((currencyInfo) => {
      if (currencyInfo.currency.isNative) {
        return true
      }

      const { address, chainId } = currencyInfo.currency
      const bridgedAsset = BRIDGED_BASE_ADDRESSES.find((bridgedAddress) =>
        areAddressesEqual({
          addressInput1: { address: bridgedAddress, chainId },
          addressInput2: { address, chainId },
        }),
      )

      if (!bridgedAsset) {
        return true
      }

      return false
    })
  }, [baseCurrencyInfos])

  return { data: filteredBaseCurrencyInfos, loading, error: persistedError, refetch }
}

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

    return sortedCurrencyInfos.map((currencyInfo) => {
      const portfolioBalance = portfolioBalancesById?.[normalizeCurrencyIdForMapLookup(currencyInfo.currencyId)]
      return portfolioBalance
        ? { type: OnchainItemListOptionType.Token, ...portfolioBalance }
        : createEmptyBalanceOption(currencyInfo)
    })
  }, [currencyInfos, portfolioBalancesById, sortAlphabetically])
}
