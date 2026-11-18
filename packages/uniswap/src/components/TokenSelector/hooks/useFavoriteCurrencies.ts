import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { type RestTokensQueryResult, useCurrencyInfosWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'

export function useFavoriteCurrencies(): RestTokensQueryResult<CurrencyInfo[]> {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)
  const {
    data: favoriteTokensOnAllChains,
    isLoading,
    isPlaceholderData,
    error,
    refetch,
  } = useCurrencyInfosWithLoading(favoriteCurrencyIds)

  // Keep the user's favorites order and drop any token the lookup didn't return
  const favoriteTokens = useMemo(() => {
    if (!favoriteTokensOnAllChains) {
      return undefined
    }
    const tokensByCurrencyId = new Map(favoriteTokensOnAllChains.map((token) => [token.currencyId, token]))
    return favoriteCurrencyIds
      .map((_currencyId) => tokensByCurrencyId.get(_currencyId))
      .filter((token): token is CurrencyInfo => !!token)
  }, [favoriteCurrencyIds, favoriteTokensOnAllChains])

  return { data: favoriteTokens, isLoading, isPlaceholderData, error, refetch }
}
