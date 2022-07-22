import { SupportedChainId } from 'constants/chains'
import { TimePeriod } from 'hooks/useTopTokens'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

import { Category, SortDirection } from './types'

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)
export const filterStringAtom = atom<string>('')
export const filterNetworkAtom = atom<SupportedChainId>(SupportedChainId.MAINNET)
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.day)
export const sortCategoryAtom = atom<Category>(Category.market_cap)
export const sortDirectionAtom = atom<SortDirection>(SortDirection.Decreasing)

/* for favoriting tokens */
export function useToggleFavorite(tokenAddress: string) {
  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)

  return useCallback(() => {
    let updatedFavoriteTokens
    if (favoriteTokens.includes(tokenAddress)) {
      updatedFavoriteTokens = favoriteTokens.filter((address: string) => {
        return address !== tokenAddress
      })
    } else {
      updatedFavoriteTokens = [...favoriteTokens, tokenAddress]
    }
    updateFavoriteTokens(updatedFavoriteTokens)
  }, [favoriteTokens, tokenAddress, updateFavoriteTokens])
}

/* keep track of sort category for token table */
export function useSetSortCategory(category: Category) {
  const [sortCategory, setSortCategory] = useAtom(sortCategoryAtom)
  const [sortDirection, setDirectionCategory] = useAtom(sortDirectionAtom)

  return useCallback(() => {
    const oppositeDirection =
      sortDirection === SortDirection.Increasing ? SortDirection.Decreasing : SortDirection.Increasing
    console.log('categor: ' + category)
    console.log('state: ' + sortCategory)

    if (category === sortCategory) {
      setDirectionCategory(oppositeDirection)
    } else {
      setSortCategory(category)
      setDirectionCategory(SortDirection.Decreasing)
    }
  }, [category, sortCategory, setSortCategory, sortDirection, setDirectionCategory])
}
