import { useCallback, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { CurrencyWithMetadata } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'

export function useFavoriteCurrenciesWithMetadata(currencies: CurrencyWithMetadata[]) {
  const favorites = useAppSelector(selectFavoriteTokensSet)
  return useMemo(
    () => currencies.filter((c) => favorites.has(currencyId(c.currency))),
    [currencies, favorites]
  )
}

export function useFilterCallbacks(initialChainId: ChainId | undefined | null = null) {
  // TODO: consider merging these into a single state object to ensure no bad
  // state is accessible.
  // only one of chain and favorites filter is considered at a time
  const [chainFilter, setChainFilter] = useState<ChainId | null>(initialChainId)
  const [favoritesFilter, setFavoritesFilter] = useState<boolean>(false)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const onChainPress = useCallback(
    (newChainFilter: typeof chainFilter) => {
      if (chainFilter === newChainFilter) {
        setChainFilter(null)
      } else {
        setChainFilter(newChainFilter)
      }
      setFavoritesFilter(false)
    },
    [chainFilter]
  )

  const onClearChainFilter = useCallback(() => {
    setFavoritesFilter(false)
    setChainFilter(null)
  }, [])

  const onClearSearchFilter = useCallback(() => {
    setFavoritesFilter(false)
    setSearchFilter(null)
  }, [])

  const onToggleFavoritesFilter = useCallback(() => {
    onClearChainFilter()
    setFavoritesFilter((_favoritesFilter) => !_favoritesFilter)
  }, [onClearChainFilter])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

  return {
    chainFilter,
    favoritesFilter,
    searchFilter,
    onChainPress,
    onClearChainFilter,
    onClearSearchFilter,
    onChangeText,
    onToggleFavoritesFilter,
    selected: (chainFilter ??
      ((favoritesFilter && 'favorites') || (!searchFilter && 'reset')) ??
      null) as ChainId | 'reset' | 'favorites' | null,
  }
}
