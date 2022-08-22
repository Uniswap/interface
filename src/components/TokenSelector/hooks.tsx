import { Currency } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { COMMON_BASES } from 'src/constants/tokens'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { currencyId, currencyIdToChain } from 'src/utils/currencyId'

export function useFavoriteCurrencies(): Currency[] {
  const favorites = useAppSelector(selectFavoriteTokensSet)
  const allTokens = useAllCurrencies()

  return useMemo(
    () =>
      Array.from(favorites)
        .map((favoriteId: string) => {
          const chainId = currencyIdToChain(favoriteId)
          if (!chainId) return undefined

          return allTokens[chainId]?.[favoriteId]
        })
        .filter(Boolean) as Currency[],
    [allTokens, favorites]
  )
}

export function useCommonBases(chainFilter: ChainId | null): Currency[] {
  const allTokens = useAllCurrencies()

  return useMemo(() => {
    // If no chain filter is selected (All networks), use mainnet common bases
    const baseCurrencies = COMMON_BASES[chainFilter ?? ChainId.Mainnet] ?? []
    return baseCurrencies
      .map((currency) => {
        return allTokens[chainFilter ?? ChainId.Mainnet]?.[currencyId(currency)]
      })
      .filter(Boolean) as Currency[]
  }, [allTokens, chainFilter])
}

export function useFilterCallbacks(chainId: ChainId | null) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback((newChainFilter: typeof chainFilter) => {
    setChainFilter(newChainFilter)
  }, [])

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

  return {
    chainFilter,
    searchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}
