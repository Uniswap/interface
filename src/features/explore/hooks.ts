import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useMemo, useReducer } from 'react'
import { useAssetInfoQuery } from 'src/features/dataApi/zerion/api'
import { Namespace, OrderBy } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import { useFavoriteCurrencies } from 'src/features/favorites/hooks'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { next } from 'src/utils/array'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function useFavoriteTokenInfo(orderBy?: OrderBy) {
  const currencies = useAllCurrencies()
  const currenciesFlat = useMemo(() => flattenObjectOfObjects(currencies), [currencies])
  const favorites = useFavoriteCurrencies(currenciesFlat ?? []).map((c) =>
    c.isToken ? c.address.toLowerCase() : 'eth'
  )

  return useAssetInfoQuery(
    favorites.length > 0
      ? requests[Namespace.Assets].info({ asset_codes: favorites, order_by: orderBy })
      : skipToken
  )
}

export function useMarketTokens(orderBy?: OrderBy) {
  // TODO: filter out tokens not in token list
  const { currentData: topTokens, isLoading } = useAssetInfoQuery(
    requests[Namespace.Assets].market({
      order_by: orderBy,
    })
  )
  return { topTokens, isLoading }
}

export function useTokenSearchResults(searchQuery: string, limit?: number) {
  const { currentData: tokens, isLoading } = useAssetInfoQuery(
    requests[Namespace.Assets].search({ search_query: searchQuery, limit })
  )

  return { tokens, isLoading }
}

const tokenMetadataCategories = [OrderBy.RelativeChange1D, OrderBy.MarketCap]

// TODO(judo): consider persisting latest category
export function useTokenMetadataDisplayType() {
  // simple reducer to cycle through categories
  return useReducer(
    (current: OrderBy) => next(tokenMetadataCategories, current) ?? tokenMetadataCategories[0],
    tokenMetadataCategories[0]
  )
}
