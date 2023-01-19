import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectFavoriteTokensSet, selectWatchedAddressSet } from 'src/features/favorites/selectors'
import {
  addFavoriteToken,
  addWatchedAddress,
  removeFavoriteToken,
  removeWatchedAddress,
} from 'src/features/favorites/slice'
import { CurrencyId } from 'src/utils/currencyId'

export function useToggleFavoriteCallback(id: CurrencyId): () => void {
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

export function useToggleWatchedWalletCallback(address: Address): () => void {
  const dispatch = useAppDispatch()
  const isFavoriteWallet = useAppSelector(selectWatchedAddressSet).has(address)

  return useCallback(() => {
    if (isFavoriteWallet) {
      dispatch(removeWatchedAddress({ address }))
    } else {
      dispatch(addWatchedAddress({ address }))
    }
  }, [address, dispatch, isFavoriteWallet])
}
