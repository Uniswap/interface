import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface traitOpen {
  [key: number]: boolean
}

interface TraitsOpenState {
  traitsOpen: traitOpen
  setTraitsOpen: (index: number, isOpen: boolean) => void
}

export const useTraitsOpen = create<TraitsOpenState>()(
  persist(
    devtools((set) => ({
      traitsOpen: {},
      setTraitsOpen: (index, isOpen) => {
        set(({ traitsOpen }) => ({ traitsOpen: { ...traitsOpen, [index]: isOpen } }))
      },
    })),
    { name: 'useTraitsOpen' }
  )
)
