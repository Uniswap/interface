import { atomWithStorage } from 'jotai/utils'

export const favoritesAtom = atomWithStorage<string[]>('favorites', [])
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)
