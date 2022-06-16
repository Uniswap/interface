import { useMemo, useReducer } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import { useGetSearchQuery } from 'src/features/dataApi/coingecko/enhancedApi'
import { useGetCoinsMarketsQuery } from 'src/features/dataApi/coingecko/generatedApi'
import {
  ClientSideOrderBy,
  CoingeckoMarketCoin,
  CoingeckoOrderBy,
  GetCoinsSearchResponse,
} from 'src/features/dataApi/coingecko/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { next } from 'src/utils/array'
import { getCompareFn } from './utils'

export function useFavoriteTokenInfo() {
  const favoritesList = Array.from(useAppSelector(selectFavoriteTokensSet)).join(',')

  return useMarketTokens({ ids: favoritesList })
}

// TODO: consider casting coins to `Currency` by merging market data
//       with Coingecko list data
export function useMarketTokens({
  remoteOrderBy = CoingeckoOrderBy.MarketCapDesc,
  localOrderBy,
  ids,
}: {
  remoteOrderBy?: CoingeckoOrderBy
  localOrderBy?: ClientSideOrderBy
  ids?: string
}): {
  tokens: CoingeckoMarketCoin[]
  isLoading: boolean
} {
  const { currentData, isLoading } = useGetCoinsMarketsQuery(
    {
      category: 'ethereum-ecosystem',
      ids,
      order: remoteOrderBy,
      page: 1,
      perPage: 100,
      vsCurrency: 'usd',
    },
    {
      pollingInterval: PollingInterval.Normal,
    }
  )

  const tokens = useMemo(() => {
    const typedCurrentData = currentData as Nullable<CoingeckoMarketCoin[]>
    if (!localOrderBy) return typedCurrentData

    const compareFn = getCompareFn(localOrderBy)
    return typedCurrentData?.slice().sort(compareFn)
  }, [currentData, localOrderBy])

  return useMemo(() => {
    return {
      tokens: tokens ?? [],
      isLoading,
    }
  }, [isLoading, tokens])
}

export function useTokenSearchResults(query: string) {
  const { currentData: results, isLoading } = useGetSearchQuery({ query })

  return { tokens: (results as Nullable<GetCoinsSearchResponse>)?.coins, isLoading }
}

// TODO: fix in follow-up PR
const tokenMetadataCategories = [CoingeckoOrderBy.MarketCapDesc, CoingeckoOrderBy.VolumeDesc]

// TODO(judo): consider persisting latest category
export function useTokenMetadataDisplayType() {
  // simple reducer to cycle through categories
  return useReducer(
    (current: CoingeckoOrderBy) =>
      next(tokenMetadataCategories, current) ?? tokenMetadataCategories[0],
    tokenMetadataCategories[0]
  )
}
