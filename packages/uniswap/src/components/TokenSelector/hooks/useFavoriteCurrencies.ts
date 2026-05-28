import { ApolloError } from '@apollo/client'
import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'

export function useFavoriteCurrencies(): GqlResult<CurrencyInfo[]> {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)
  const { data: favoriteTokensOnAllChains, loading, error, refetch } = useTokenProjects(favoriteCurrencyIds)

  const persistedError = usePersistedError(loading, error instanceof ApolloError ? error : undefined)

  // useTokenProjects returns each token on Arbitrum, Optimism, Polygon,
  // so we need to filter out the tokens which user has actually favorited
  const favoriteTokens = useMemo(() => {
    if (!favoriteTokensOnAllChains) {
      return undefined
    }
    const tokensByCurrencyId = new Map(favoriteTokensOnAllChains.map((token) => [token.currencyId, token]))
    return favoriteCurrencyIds
      .map((_currencyId) => tokensByCurrencyId.get(_currencyId))
      .filter((token): token is CurrencyInfo => !!token)
  }, [favoriteCurrencyIds, favoriteTokensOnAllChains])

  return { data: favoriteTokens, loading, error: persistedError, refetch }
}
