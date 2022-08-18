import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { currencyIdToChain } from 'src/utils/currencyId'

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

export function useFilterCallbacks(initialChainId: ChainId | undefined | null = null) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(initialChainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const onChainPress = useCallback((newChainFilter: typeof chainFilter) => {
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
    onChainPress,
    onClearSearchFilter,
    onChangeText,
  }
}
