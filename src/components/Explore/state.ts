import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)

/* handle favorite token logic */
export function useToggleFavorite(tokenAddress: string): () => void {
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
