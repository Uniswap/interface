import { SupportedChainId } from 'constants/chains'
import { TimePeriod } from 'hooks/useExplorePageQuery'
import { atom, useAtom } from 'jotai'
import { atomWithReset, atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

import { Category, SortDirection } from './types'

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)
export const filterStringAtom = atomWithReset<string>('')
export const filterNetworkAtom = atom<SupportedChainId>(SupportedChainId.MAINNET)
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.DAY)
export const sortCategoryAtom = atom<Category>(Category.marketCap)
export const sortDirectionAtom = atom<SortDirection>(SortDirection.decreasing)

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
    if (category === sortCategory) {
      const oppositeDirection =
        sortDirection === SortDirection.increasing ? SortDirection.decreasing : SortDirection.increasing
      setDirectionCategory(oppositeDirection)
    } else {
      setSortCategory(category)
      setDirectionCategory(SortDirection.decreasing)
    }
  }, [category, sortCategory, setSortCategory, sortDirection, setDirectionCategory])
}
