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
        if (index === 0) {
          console.log('hiiiii')
        }

        set(({ traitsOpen }) => ({ traitsOpen: { ...traitsOpen, [index]: isOpen } }))
      },
    })),
    { name: 'useTraitsOpen' }
  )
)
