import { TimePeriod } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { atomWithReset, atomWithStorage, useAtomValue } from 'jotai/utils'
import { useCallback, useMemo } from 'react'

export enum TokenSortMethod {
  PRICE = 'Price',
  PERCENT_CHANGE = 'Change',
  TOTAL_VALUE_LOCKED = 'TVL',
  VOLUME = 'Volume',
}

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)
export const filterStringAtom = atomWithReset<string>('')
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.DAY)
export const sortMethodAtom = atom<TokenSortMethod>(TokenSortMethod.VOLUME)
export const sortAscendingAtom = atom<boolean>(false)

/* for favoriting tokens */
export function useToggleFavorite(tokenAddress: string | undefined | null) {
  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)

  return useCallback(() => {
    if (!tokenAddress) return
    let updatedFavoriteTokens
    if (favoriteTokens.includes(tokenAddress.toLocaleLowerCase())) {
      updatedFavoriteTokens = favoriteTokens.filter((address: string) => {
        return address !== tokenAddress.toLocaleLowerCase()
      })
    } else {
      updatedFavoriteTokens = [...favoriteTokens, tokenAddress.toLocaleLowerCase()]
    }
    updateFavoriteTokens(updatedFavoriteTokens)
  }, [favoriteTokens, tokenAddress, updateFavoriteTokens])
}

/* keep track of sort category for token table */
export function useSetSortMethod(newSortMethod: TokenSortMethod) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const [sortAscending, setSortAscending] = useAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending(!sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, sortAscending, newSortMethod])
}

export function useIsFavorited(tokenAddress: string | null | undefined) {
  const favoritedTokens = useAtomValue<string[]>(favoritesAtom)

  return useMemo(
    () => (tokenAddress ? favoritedTokens.includes(tokenAddress.toLocaleLowerCase()) : false),
    [favoritedTokens, tokenAddress]
  )
}
