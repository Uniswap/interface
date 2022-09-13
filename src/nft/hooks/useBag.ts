import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface BagState {
  bagExpanded: boolean
  toggleBag: () => void
}

export const useBag = create<BagState>()(
  devtools(
    (set) => ({
      bagExpanded: false,
      toggleBag: () =>
        set(({ bagExpanded }) => ({
          bagExpanded: !bagExpanded,
        })),
    }),
    { name: 'useBag' }
  )
)
