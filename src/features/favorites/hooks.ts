import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { CurrencyId } from 'src/utils/currencyId'

export function useToggleFavoriteCallback(id: CurrencyId) {
  const dispatch = useAppDispatch()
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(id)

  return useCallback(() => {
    if (isFavoriteToken) {
      dispatch(removeFavoriteToken({ currencyId: id }))
    } else {
      dispatch(addFavoriteToken({ currencyId: id }))
    }
  }, [dispatch, id, isFavoriteToken])
}
