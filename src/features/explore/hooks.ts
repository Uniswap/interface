import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useAssetInfoQuery } from 'src/features/dataApi/zerion/api'
import { Namespace } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import { useFavoriteCurrencies } from 'src/features/favorites/hooks'
import { getInfuraChainName } from 'src/features/providers/utils'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function useFavoriteTokenInfo() {
  const currencies = useAllCurrencies()
  const currenciesFlat = useMemo(() => flattenObjectOfObjects(currencies), [currencies])
  const favorites = useFavoriteCurrencies(currenciesFlat ?? []).map((c) =>
    c.isToken ? c.address.toLowerCase() : 'eth'
  )

  return useAssetInfoQuery(
    favorites.length > 0 ? requests[Namespace.Assets].info({ asset_codes: favorites }) : skipToken
  )
}

export function useTokenInfo(chainId?: ChainId) {
  // TODO: filter out tokens not in token list
  const { currentData: topTokens, isLoading } = useAssetInfoQuery(
    requests[Namespace.Assets].market({ chain: chainId ? getInfuraChainName(chainId) : undefined })
  )
  return { topTokens, isLoading }
}
