import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { makeSelectHasTokenFavorited } from 'uniswap/src/features/favorites/selectors'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useSelectHasTokenFavorited(currencyId: string): boolean {
  const selectHasTokenFavorited = useMemo(makeSelectHasTokenFavorited, [])
  return useSelector((state: UniswapState) => selectHasTokenFavorited(state, currencyId.toLowerCase()))
}
