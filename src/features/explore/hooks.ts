import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import {
  useGetCoinsMarketsQuery,
  useGetSearchQuery,
} from 'src/features/dataApi/coingecko/enhancedApi'
import { useCoinIdAndCurrencyIdMappings } from 'src/features/dataApi/coingecko/hooks'
import {
  ClientSideOrderBy,
  CoingeckoMarketCoin,
  CoingeckoOrderBy,
  GetCoinsSearchResponse,
} from 'src/features/dataApi/coingecko/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { selectTokensMetadataDisplayType } from 'src/features/wallet/selectors'
import { cycleTokensMetadataDisplayType } from 'src/features/wallet/walletSlice'
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
          category: ids ? undefined : category ?? 'ethereum-ecosystem',
          ids,
          order: remoteOrderBy,
          page: 1,
          perPage: COINS_PER_PAGE,
          vsCurrency: 'usd',
        },
    {
      pollingInterval: PollingInterval.Fast,
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

export function useTokenMetadataDisplayType(): [CoingeckoOrderBy | ClientSideOrderBy, () => void] {
  const dispatch = useAppDispatch()

  const metadataDisplayType = useAppSelector(selectTokensMetadataDisplayType)
  const cycleMetadata = useCallback(() => dispatch(cycleTokensMetadataDisplayType()), [dispatch])

  return [metadataDisplayType, cycleMetadata]
}
