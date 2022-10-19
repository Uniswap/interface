import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface traitOpen {
  [key: number]: boolean
}

interface TraitsOpenState {
  traitsOpen: traitOpen
  setTraitsOpen: (index: number, isOpen: boolean) => void
}

export enum TraitPosition {
  MARKPLACE_INDEX = 0,
  PRICE_RANGE_INDEX = 1,
  TRAIT_START_INDEX = 2,
}

export const useTraitsOpen = create<TraitsOpenState>()(
  devtools(
    (set) => ({
      traitsOpen: {},
      setTraitsOpen: (index, isOpen) => {
        set(({ traitsOpen }) => ({ traitsOpen: { ...traitsOpen, [index]: isOpen } }))
      },
    }),
    { name: 'useTraitsOpen' }
  )
)
