import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'src/app/hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { makeSelectHasTokenFavorited, selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import {
  addFavoriteToken,
  addWatchedAddress,
  removeFavoriteToken,
  removeWatchedAddress,
} from 'wallet/src/features/favorites/slice'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export function useToggleFavoriteCallback(id: CurrencyId, isFavoriteToken: boolean): () => void {
  const dispatch = useDispatch()
  const token = useCurrencyInfo(id)

  return useCallback(() => {
    if (isFavoriteToken) {
      dispatch(removeFavoriteToken({ currencyId: id }))
    } else {
      sendAnalyticsEvent(MobileEventName.FavoriteItem, {
        address: currencyIdToAddress(id),
        chain: currencyIdToChain(id) as number,
        type: 'token',
        name: token?.currency.name,
      })
      dispatch(addFavoriteToken({ currencyId: id }))
    }
  }, [dispatch, id, isFavoriteToken, token])
}

export function useToggleWatchedWalletCallback(address: Address): () => void {
  const dispatch = useDispatch()
  const isFavoriteWallet = useAppSelector(selectWatchedAddressSet).has(address)
  const displayName = useDisplayName(address)

  return useCallback(() => {
    if (isFavoriteWallet) {
      dispatch(removeWatchedAddress({ address }))
    } else {
      sendAnalyticsEvent(MobileEventName.FavoriteItem, {
        address,
        type: 'wallet',
        name: displayName?.name,
      })
      dispatch(addWatchedAddress({ address }))
    }
  }, [address, dispatch, isFavoriteWallet, displayName])
}

export function useSelectHasTokenFavorited(currencyId: string): boolean {
  const selectHasTokenFavorited = useMemo(makeSelectHasTokenFavorited, [])
  return useAppSelector((state) => selectHasTokenFavorited(state, currencyId))
}
