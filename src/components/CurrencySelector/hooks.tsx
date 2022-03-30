import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { ChainId } from 'src/constants/chains'
import { useFavoriteCurrencies } from 'src/features/favorites/hooks'
import { useDebounce } from 'src/utils/timing'
import { filter } from './filter'

export function useFilteredCurrencies(
  currencies: Currency[],
  initialChainId: ChainId | undefined | null = null
) {
  // TODO: consider merging these into a single state object to ensure no bad
  // state is accessible.
  // only one of chain and favorites filter is considered at a time
  const [chainFilter, setChainFilter] = useState<ChainId | null>(initialChainId)
  const [favoritesFilter, setFavoritesFilter] = useState<boolean>(false)

  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const favoriteCurrencies = useFavoriteCurrencies(currencies)
  const debouncedSearchFilter = useDebounce(searchFilter)

  const filteredCurrencies = useMemo(
    () =>
      filter(
        favoritesFilter ? favoriteCurrencies : currencies ?? null,
        chainFilter,
        debouncedSearchFilter
      ),
    [chainFilter, currencies, debouncedSearchFilter, favoriteCurrencies, favoritesFilter]
  )

  const onChainPress = (newChainFilter: typeof chainFilter) => {
    if (chainFilter === newChainFilter) {
      setChainFilter(null)
    } else {
      setChainFilter(newChainFilter)
    }
    setFavoritesFilter(false)
  }

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
    searchFilter,
    filteredCurrencies,
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
