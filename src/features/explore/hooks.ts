import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useMemo, useReducer } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import { useGetSearchQuery } from 'src/features/dataApi/coingecko/enhancedApi'
import { useGetCoinsMarketsQuery } from 'src/features/dataApi/coingecko/generatedApi'
import { useCoinIdAndCurrencyIdMappings } from 'src/features/dataApi/coingecko/hooks'
import {
  ClientSideOrderBy,
  CoingeckoMarketCoin,
  CoingeckoOrderBy,
  GetCoinsSearchResponse,
} from 'src/features/dataApi/coingecko/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { next } from 'src/utils/array'
import { getCompareFn } from './utils'

const COINS_PER_PAGE = 100

export function useFavoriteTokenInfo() {
  const { currencyIdToCoinId, isLoading } = useCoinIdAndCurrencyIdMappings()
  const favoriteTokenSet = useAppSelector(selectFavoriteTokensSet)

  const favorites = useMemo(
    () =>
      (isLoading
        ? []
        : Array.from(favoriteTokenSet)
            .map((currencyId) => currencyIdToCoinId[currencyId.toLocaleLowerCase()])
            // TODO(MOB-798): better handle case where token does not have a corresponding coin id
            .filter((f) => f)
      ).join(','),
    [currencyIdToCoinId, favoriteTokenSet, isLoading]
  )

  return useMarketTokens({ ids: favorites })
}

// TODO: consider casting coins to `Currency` by merging market data
//       with Coingecko list data
export function useMarketTokens({
  category,
  ids,
  localOrderBy,
  remoteOrderBy = CoingeckoOrderBy.MarketCapDesc,
}: {
  category?: 'ethereum-ecosystem'
  ids?: string
  localOrderBy?: ClientSideOrderBy
  remoteOrderBy?: CoingeckoOrderBy
}): {
  tokens: CoingeckoMarketCoin[]
  isLoading: boolean
} {
  const { currentData, isLoading } = useGetCoinsMarketsQuery(
    ids !== undefined && ids.length === 0
      ? skipToken
      : {
          category,
          ids,
          order: remoteOrderBy,
          page: 1,
          perPage: COINS_PER_PAGE,
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
