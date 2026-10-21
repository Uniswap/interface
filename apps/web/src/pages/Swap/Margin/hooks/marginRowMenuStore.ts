import { useEvent } from 'utilities/src/react/hooks'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface MarginRowMenuState {
  // Menu key of the row whose `…` menu is open, or null. At most one at a time. A KEY, not a bare
  // positionId: the same position can render a menu on two surfaces at once (the table's utility cell
  // and the expanded drawer), and keying on the position alone would open both.
  openMenuKey: string | null
  setOpenMenuKey: (menuKey: string | null) => void
  // Clears ONLY if the key still names this menu — see useMarginRowMenu's setOpen.
  closeMenuKey: (menuKey: string) => void
}

// Deliberately a module store rather than table state threaded down as props: the utility cell is an
// inline arrow inside a useMemo'd TanStack column array, and flexRender treats that arrow as a
// component TYPE. Putting the open account in that memo's deps gives the arrow a new identity the
// moment the menu opens, which unmounts and remounts the whole cell mid-gesture. Out here the arrow
// never sees it, so the columns stay referentially stable and the trigger survives.
const marginRowMenuStore = createStore<MarginRowMenuState>()((set) => ({
  openMenuKey: null,
  setOpenMenuKey: (menuKey) => set({ openMenuKey: menuKey }),
  closeMenuKey: (menuKey) => set((s) => (s.openMenuKey === menuKey ? { openMenuKey: null } : s)),
}))

export function useMarginRowMenu(menuKey: string): { isOpen: boolean; setOpen: (open: boolean) => void } {
  // Select the BOOLEAN, not the raw key: every row subscribes to this store, so selecting the string
  // would re-render all of them on any row's open/close. Derived here, only the two rows whose boolean
  // actually flips re-render.
  const isOpen = useStore(marginRowMenuStore, (s) => s.openMenuKey === menuKey)
  // Stable identity so a consumer can hand this to a memoized child without re-wrapping it.
  const setOpen = useEvent((open: boolean) => {
    if (open) {
      marginRowMenuStore.getState().setOpenMenuKey(menuKey)
      return
    }
    // Identity-checked: every mounted ContextMenu registers a document-level outside-click listener
    // whether or not that instance is open, so a CLOSED sibling's handler would otherwise null the
    // shared key while this row's menu is up — dismissing the popover before the clicked item's own
    // click lands. With two rows on screen (table + drawer is already two) that is the ordinary case.
    marginRowMenuStore.getState().closeMenuKey(menuKey)
  })
  return { isOpen, setOpen }
}
