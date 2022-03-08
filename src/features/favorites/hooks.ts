import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'

export function useFavoriteCurrencies(currencies: Currency[]) {
  const favorites = useAppSelector(selectFavoriteTokensSet)

  return useMemo(
    () => currencies.filter((c) => favorites.has(currencyId(c))),
    [currencies, favorites]
  )
}
