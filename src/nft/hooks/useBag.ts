import { BagItem } from 'nft/types'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface BagState {
  itemsInBag: BagItem[]
  bagExpanded: boolean
  toggleBag: () => void
}

export const useBag = create<BagState>()(
  devtools(
    (set) => ({
      bagExpanded: false,
      itemsInBag: [],
      toggleBag: () =>
        set(({ bagExpanded }) => ({
          bagExpanded: !bagExpanded,
        })),
    }),
    { name: 'useBag' }
  )
)
