import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { makeSelectHasTokenFavorited } from 'uniswap/src/features/favorites/selectors'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useSelectHasTokenFavorited(currencyId: string): boolean {
  const selectHasTokenFavorited = useMemo(makeSelectHasTokenFavorited, [])
  return useSelector((state: UniswapState) =>
    selectHasTokenFavorited(state, normalizeCurrencyIdForMapLookup(currencyId)),
  )
}
