import { useCallback, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'

export function useFavoriteTokenOptions(currencies: TokenOption[]) {
  const favorites = useAppSelector(selectFavoriteTokensSet)
  return useMemo(
    () => currencies.filter((c) => favorites.has(currencyId(c.currency))),
    [currencies, favorites]
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
