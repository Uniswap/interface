import { createContext, createElement, type ReactNode, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'

export type FavoritesGridId = 'tokens' | 'wallets'

type FavoritesSortingState = {
  sortingGrids: Partial<Record<FavoritesGridId, true>>
  setGridSorting: (gridId: FavoritesGridId, isSorting: boolean) => void
}

function createFavoritesSortingStore(): StoreApi<FavoritesSortingState> {
  return createStore<FavoritesSortingState>((set) => ({
    sortingGrids: {},
    setGridSorting: (gridId, isSorting) =>
      set((state) => {
        if (!!state.sortingGrids[gridId] === isSorting) {
          return state
        }

        const sortingGrids = { ...state.sortingGrids }
        if (isSorting) {
          sortingGrids[gridId] = true
        } else {
          delete sortingGrids[gridId]
        }

        return { sortingGrids }
      }),
  }))
}

const FavoritesSortingStoreContext = createContext<StoreApi<FavoritesSortingState> | null>(null)

export function FavoritesSortingStoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [store] = useState(createFavoritesSortingStore)
  return createElement(FavoritesSortingStoreContext.Provider, { value: store }, children)
}

function useFavoritesSortingStore<T>(selector: (state: FavoritesSortingState) => T): T {
  const store = useContext(FavoritesSortingStoreContext)
  if (!store) {
    throw new Error('Favorites sorting hooks must be used within FavoritesSortingStoreProvider')
  }
  return useStore(store, selector)
}

/**
 * Keeps the surrounding list from scrolling while a favorites grid is being reordered.
 *
 * The grids render inside a virtualized list header, so an active scroll competes with the drag
 * gesture for the touch and shifts the offsets the reorder math is based on.
 */
export function useReportFavoritesSorting(gridId: FavoritesGridId, isSorting: boolean): void {
  const setGridSorting = useFavoritesSortingStore((state) => state.setGridSorting)

  useEffect(() => {
    setGridSorting(gridId, isSorting)
    return () => setGridSorting(gridId, false)
  }, [gridId, isSorting, setGridSorting])
}

export function useIsSortingFavorites(): boolean {
  return useFavoritesSortingStore((state) => Object.keys(state.sortingGrids).length > 0)
}
