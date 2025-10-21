import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addFavoriteToken, removeFavoriteToken } from 'uniswap/src/features/favorites/slice'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export function useToggleFavoriteCallback({
  id,
  tokenName,
  isFavoriteToken,
}: {
  id: CurrencyId
  tokenName?: string
  isFavoriteToken: boolean
}): () => void {
  const dispatch = useDispatch()

  return useCallback(() => {
    if (isFavoriteToken) {
      dispatch(removeFavoriteToken({ currencyId: id.toLowerCase() }))
    } else {
      sendAnalyticsEvent(MobileEventName.FavoriteItem, {
        address: currencyIdToAddress(id.toLowerCase()),
        chain: currencyIdToChain(id) as number,
        type: 'token',
        name: tokenName,
      })
      dispatch(addFavoriteToken({ currencyId: id.toLowerCase() }))
    }
  }, [dispatch, id, isFavoriteToken, tokenName])
}
