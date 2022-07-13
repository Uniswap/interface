import { SetStateAction } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)

/* handle favorite token logic */
export const toggleFavoriteToken = ({
  tokenAddress,
  favoriteTokens,
  updateFavoriteTokens,
}: {
  tokenAddress: string
  favoriteTokens: string[]
  updateFavoriteTokens: (update: SetStateAction<string[]>) => void
}) => {
  let updatedFavoriteTokens
  if (favoriteTokens.includes(tokenAddress)) {
    updatedFavoriteTokens = favoriteTokens.filter((address: string) => {
      return address !== tokenAddress
    })
  } else {
    updatedFavoriteTokens = [...favoriteTokens, tokenAddress]
  }
  updateFavoriteTokens(updatedFavoriteTokens)
}
